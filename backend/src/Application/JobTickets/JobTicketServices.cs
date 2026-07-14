using System.Text.Json;
using System.Text.Json.Serialization;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Notifications;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.JobTickets;

public interface IJobTicketsService
{
    Task<IReadOnlyList<JobTicketListItemDto>> ListAsync(JobTicketListQuery query, CancellationToken cancellationToken = default);
    Task<JobTicketDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<JobTicketDto> CreateAsync(CreateJobTicketDto request, CancellationToken cancellationToken = default);
    Task<JobTicketDto?> UpdateAsync(Guid id, UpdateJobTicketDto request, CancellationToken cancellationToken = default);
    Task<JobTicketDto?> ChangeStatusAsync(Guid id, ChangeJobTicketStatusDto request, CancellationToken cancellationToken = default);
    Task<JobTicketDto?> ArchiveAsync(Guid id, ArchiveJobTicketDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobTicketAssignmentDto>> ListAssignmentsAsync(Guid jobTicketId, CancellationToken cancellationToken = default);
    Task<JobTicketAssignmentDto> AddAssignmentAsync(Guid jobTicketId, AddJobTicketAssignmentDto request, CancellationToken cancellationToken = default);
    Task<bool> RemoveAssignmentAsync(Guid jobTicketId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobWorkEntryDto>> ListWorkEntriesAsync(Guid jobTicketId, CancellationToken cancellationToken = default);
    Task<JobWorkEntryDto> AddWorkEntryAsync(Guid jobTicketId, AddJobWorkEntryDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobTicketPartDto>> ListPartsAsync(Guid jobTicketId, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto> AddPartAsync(Guid jobTicketId, AddJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto> QuickAddPartAsync(Guid jobTicketId, QuickAddJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> UpdatePartAsync(Guid jobTicketId, Guid jobTicketPartId, UpdateJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> ApprovePartAsync(Guid jobTicketId, Guid jobTicketPartId, ApproveJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> RejectPartAsync(Guid jobTicketId, Guid jobTicketPartId, RejectJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> ArchivePartAsync(Guid jobTicketId, Guid jobTicketPartId, ArchiveJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TicketTimelineItemDto>> GetTimelineAsync(Guid jobTicketId, CancellationToken cancellationToken = default);
}

public sealed class JobTicketsService(
    ApplicationDbContext dbContext,
    ICurrentUserContext currentUserContext,
    INewTicketNotificationService notificationService) : IJobTicketsService
{
    private static readonly Guid SystemUserId = Guid.Empty;
    private static readonly JobTicketStatus[] EmployeeClosedStatuses =
    [
        JobTicketStatus.Completed,
        JobTicketStatus.Cancelled,
        JobTicketStatus.Invoiced,
        JobTicketStatus.Reviewed
    ];

    public async Task<IReadOnlyList<JobTicketListItemDto>> ListAsync(JobTicketListQuery query, CancellationToken cancellationToken = default)
    {
        var jobTickets = dbContext.JobTickets.AsQueryable();

        if (!currentUserContext.IsManager)
        {
            jobTickets = jobTickets.Where(x =>
                x.AssignedEmployees.Any(a => a.EmployeeId == currentUserContext.EmployeeId) &&
                !EmployeeClosedStatuses.Contains(x.Status));
        }

        if (query.CustomerId.HasValue)
        {
            jobTickets = jobTickets.Where(x => x.CustomerId == query.CustomerId.Value);
        }

        if (query.ServiceLocationId.HasValue)
        {
            jobTickets = jobTickets.Where(x => x.ServiceLocationId == query.ServiceLocationId.Value);
        }

        if (query.Status.HasValue)
        {
            jobTickets = jobTickets.Where(x => x.Status == query.Status.Value);
        }

        if (query.Priority.HasValue)
        {
            jobTickets = jobTickets.Where(x => x.Priority == query.Priority.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            jobTickets = jobTickets.Where(x => x.TicketNumber.Contains(search) || x.Title.Contains(search));
        }

        return await jobTickets
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(query.PagedQuery.NormalizedOffset)
            .Take(query.PagedQuery.NormalizedLimit)
            .Select(x => new JobTicketListItemDto(
                x.Id,
                x.TicketNumber,
                x.Title,
                x.Status,
                x.Priority,
                x.CustomerId,
                x.ServiceLocationId,
                x.RequestedAtUtc,
                x.ScheduledStartAtUtc,
                x.DueAtUtc,
                x.CompletedAtUtc,
                x.Customer.Name,
                x.ServiceLocation.LocationName,
                x.EquipmentId,
                x.Equipment != null ? x.Equipment.Name : null))
            .ToListAsync(cancellationToken);
    }

    public async Task<JobTicketDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (!currentUserContext.IsManager)
        {
            var assigned = await dbContext.JobTicketEmployees.AnyAsync(x => x.JobTicketId == id && x.EmployeeId == currentUserContext.EmployeeId, cancellationToken);
            if (!assigned)
            {
                return null;
            }
        }

        return await LoadJobTicketAsync(id, cancellationToken);
    }

    public async Task<JobTicketDto> CreateAsync(CreateJobTicketDto request, CancellationToken cancellationToken = default)
    {
        ValidateCreateOrUpdateRequest(request);
        await ValidateReferencesAsync(request.CustomerId, request.ServiceLocationId, request.BillingPartyCustomerId, request.EquipmentId, request.AssignedManagerEmployeeId, cancellationToken);

        for (var attempt = 0; attempt < 3; attempt++)
        {
            var entity = new JobTicket
            {
                TicketNumber = await GenerateTicketNumberAsync(cancellationToken),
                CustomerId = request.CustomerId,
                ServiceLocationId = request.ServiceLocationId,
                BillingPartyCustomerId = request.BillingPartyCustomerId,
                EquipmentId = request.EquipmentId,
                Title = request.Title.Trim(),
                Description = ValidationHelpers.NullIfWhitespace(request.Description),
                JobType = ValidationHelpers.NullIfWhitespace(request.JobType),
                Status = request.Status,
                Priority = request.Priority,
                LocationType = request.LocationType,
                RequestedAtUtc = request.RequestedAtUtc,
                ScheduledStartAtUtc = request.ScheduledStartAtUtc,
                DueAtUtc = request.DueAtUtc,
                EstimatedDurationMinutes = request.EstimatedDurationMinutes,
                AssignedManagerEmployeeId = request.AssignedManagerEmployeeId,
                PurchaseOrderNumber = ValidationHelpers.NullIfWhitespace(request.PurchaseOrderNumber),
                BillingContactName = ValidationHelpers.NullIfWhitespace(request.BillingContactName),
                BillingContactPhone = ValidationHelpers.NullIfWhitespace(request.BillingContactPhone),
                BillingContactEmail = ValidationHelpers.NullIfWhitespace(request.BillingContactEmail),
                InternalNotes = ValidationHelpers.NullIfWhitespace(request.InternalNotes),
                CustomerFacingNotes = ValidationHelpers.NullIfWhitespace(request.CustomerFacingNotes),
                CompletedAtUtc = request.Status == JobTicketStatus.Completed ? DateTime.UtcNow : null
            };

            dbContext.JobTickets.Add(entity);
            AddAudit(entity.Id, nameof(JobTicket), AuditActionType.Create, null, AuditJson(("TicketNumber", entity.TicketNumber)));

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException) when (attempt < 2)
            {
                dbContext.Entry(entity).State = EntityState.Detached;
                continue;
            }

            await notificationService.NotifyAsync(entity.Id, CancellationToken.None);

            return await LoadJobTicketAsync(entity.Id, cancellationToken)
                ?? throw new InvalidOperationException("Created job ticket could not be reloaded.");
        }

        throw new ValidationException("Unable to generate a unique job ticket number. Please retry.");
    }

    public async Task<JobTicketDto?> UpdateAsync(Guid id, UpdateJobTicketDto request, CancellationToken cancellationToken = default)
    {
        ValidateCreateOrUpdateRequest(request);
        await ValidateReferencesAsync(request.CustomerId, request.ServiceLocationId, request.BillingPartyCustomerId, request.EquipmentId, request.AssignedManagerEmployeeId, cancellationToken);

        var entity = await dbContext.JobTickets.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;

        var oldStatus = entity.Status;
        entity.CustomerId = request.CustomerId;
        entity.ServiceLocationId = request.ServiceLocationId;
        entity.BillingPartyCustomerId = request.BillingPartyCustomerId;
        entity.EquipmentId = request.EquipmentId;
        entity.Title = request.Title.Trim();
        entity.Description = ValidationHelpers.NullIfWhitespace(request.Description);
        entity.JobType = ValidationHelpers.NullIfWhitespace(request.JobType);
        entity.Status = request.Status;
        entity.Priority = request.Priority;
        entity.LocationType = request.LocationType;
        entity.RequestedAtUtc = request.RequestedAtUtc;
        entity.ScheduledStartAtUtc = request.ScheduledStartAtUtc;
        entity.DueAtUtc = request.DueAtUtc;
        entity.EstimatedDurationMinutes = request.EstimatedDurationMinutes;
        entity.AssignedManagerEmployeeId = request.AssignedManagerEmployeeId;
        entity.PurchaseOrderNumber = ValidationHelpers.NullIfWhitespace(request.PurchaseOrderNumber);
        entity.BillingContactName = ValidationHelpers.NullIfWhitespace(request.BillingContactName);
        entity.BillingContactPhone = ValidationHelpers.NullIfWhitespace(request.BillingContactPhone);
        entity.BillingContactEmail = ValidationHelpers.NullIfWhitespace(request.BillingContactEmail);
        entity.InternalNotes = ValidationHelpers.NullIfWhitespace(request.InternalNotes);
        entity.CustomerFacingNotes = ValidationHelpers.NullIfWhitespace(request.CustomerFacingNotes);

        if (oldStatus != JobTicketStatus.Completed && request.Status == JobTicketStatus.Completed)
        {
            entity.CompletedAtUtc = DateTime.UtcNow;
        }
        else if (oldStatus == JobTicketStatus.Completed && request.Status != JobTicketStatus.Completed)
        {
            entity.CompletedAtUtc = null;
        }

        AddAudit(entity.Id, nameof(JobTicket), AuditActionType.Update, null, AuditJson(("Status", entity.Status.ToString())));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await LoadJobTicketAsync(entity.Id, cancellationToken);
    }

    public async Task<JobTicketDto?> ChangeStatusAsync(Guid id, ChangeJobTicketStatusDto request, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.JobTickets.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;

        var oldStatus = entity.Status;
        entity.Status = request.Status;

        if (request.Status == JobTicketStatus.Completed)
        {
            entity.CompletedAtUtc = DateTime.UtcNow;
        }
        else if (oldStatus == JobTicketStatus.Completed)
        {
            entity.CompletedAtUtc = null;
        }

        AddAudit(entity.Id, nameof(JobTicket), AuditActionType.StatusChange, AuditJson(("Status", oldStatus.ToString())), AuditJson(("Status", entity.Status.ToString())));
        await dbContext.SaveChangesAsync(cancellationToken);

        return await LoadJobTicketAsync(entity.Id, cancellationToken);
    }

    public async Task<JobTicketDto?> ArchiveAsync(Guid id, ArchiveJobTicketDto request, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        var archiveReason = ValidationHelpers.NullIfWhitespace(request.ArchiveReason);
        if (archiveReason is null)
        {
            throw new ValidationException("ArchiveReason is required.");
        }

        var entity = await dbContext.JobTickets.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;

        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        entity.DeletedByUserId = SystemUserId;
        entity.ArchiveReason = archiveReason;

        AddAudit(entity.Id, nameof(JobTicket), AuditActionType.Delete, null, AuditJson(("ArchiveReason", archiveReason)));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await LoadJobTicketAsync(entity.Id, cancellationToken, includeArchived: true);
    }

    public async Task<IReadOnlyList<JobTicketAssignmentDto>> ListAssignmentsAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);

        return await dbContext.JobTicketEmployees
            .Where(x => x.JobTicketId == jobTicketId)
            .OrderBy(x => x.AssignedAtUtc)
            .Select(x => new JobTicketAssignmentDto(
                x.JobTicketId,
                x.EmployeeId,
                x.AssignedAtUtc,
                x.IsLead,
                x.Employee.FirstName + " " + x.Employee.LastName))
            .ToListAsync(cancellationToken);
    }

    public async Task<JobTicketAssignmentDto> AddAssignmentAsync(Guid jobTicketId, AddJobTicketAssignmentDto request, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        if (!await dbContext.Employees.AnyAsync(x => x.Id == request.EmployeeId, cancellationToken))
        {
            throw new ValidationException("EmployeeId does not reference an active employee.");
        }

        var exists = await dbContext.JobTicketEmployees.AnyAsync(
            x => x.JobTicketId == jobTicketId && x.EmployeeId == request.EmployeeId,
            cancellationToken);

        if (exists)
        {
            throw new ValidationException("Employee is already assigned to this job ticket.");
        }

        var assignment = new JobTicketEmployee
        {
            JobTicketId = jobTicketId,
            EmployeeId = request.EmployeeId,
            AssignedAtUtc = DateTime.UtcNow,
            AssignedByUserId = SystemUserId,
            IsLead = request.IsLead
        };

        dbContext.JobTicketEmployees.Add(assignment);
        AddAudit(jobTicketId, nameof(JobTicketEmployee), AuditActionType.Assignment, null, AuditJson(("EmployeeId", request.EmployeeId), ("Operation", "Add")));
        await dbContext.SaveChangesAsync(cancellationToken);

        var employeeName = await dbContext.Employees
            .Where(x => x.Id == assignment.EmployeeId)
            .Select(x => x.FirstName + " " + x.LastName)
            .SingleAsync(cancellationToken);

        return new JobTicketAssignmentDto(assignment.JobTicketId, assignment.EmployeeId, assignment.AssignedAtUtc, assignment.IsLead, employeeName);
    }

    public async Task<bool> RemoveAssignmentAsync(Guid jobTicketId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);

        var assignment = await dbContext.JobTicketEmployees
            .SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.EmployeeId == employeeId, cancellationToken);

        if (assignment is null) return false;

        assignment.IsDeleted = true;
        assignment.DeletedAtUtc = DateTime.UtcNow;
        assignment.DeletedByUserId = SystemUserId;

        AddAudit(jobTicketId, nameof(JobTicketEmployee), AuditActionType.Assignment, null, AuditJson(("EmployeeId", employeeId), ("Operation", "Remove")));
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<JobWorkEntryDto>> ListWorkEntriesAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        await EnsureCurrentUserCanAccessJobTicketAsync(jobTicketId, cancellationToken);

        return await dbContext.JobWorkEntries
            .Where(x => x.JobTicketId == jobTicketId)
            .OrderByDescending(x => x.PerformedAtUtc)
            .Select(x => new JobWorkEntryDto(x.Id, x.JobTicketId, x.EmployeeId, x.EntryType, x.Notes, x.PerformedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<JobWorkEntryDto> AddWorkEntryAsync(Guid jobTicketId, AddJobWorkEntryDto request, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        await EnsureCurrentUserCanAccessJobTicketAsync(jobTicketId, cancellationToken);
        await EnsureEmployeeClockedIntoJobTicketAsync(jobTicketId, cancellationToken);
        ValidationHelpers.ValidateRequired(request.Notes, nameof(request.Notes));
        if (!Enum.IsDefined(request.EntryType))
        {
            throw new ValidationException("EntryType is not a valid work entry type.");
        }

        if (request.EmployeeId.HasValue && !await dbContext.Employees.AnyAsync(x => x.Id == request.EmployeeId.Value, cancellationToken))
        {
            throw new ValidationException("EmployeeId does not reference an active employee.");
        }

        var entry = new JobWorkEntry
        {
            JobTicketId = jobTicketId,
            EmployeeId = request.EmployeeId,
            EntryType = request.EntryType,
            Notes = request.Notes.Trim(),
            PerformedAtUtc = request.PerformedAtUtc ?? DateTime.UtcNow
        };

        dbContext.JobWorkEntries.Add(entry);
        AddAudit(jobTicketId, nameof(JobWorkEntry), AuditActionType.Create, null, AuditJson(("EntryType", entry.EntryType.ToString())));
        await dbContext.SaveChangesAsync(cancellationToken);

        return new JobWorkEntryDto(entry.Id, entry.JobTicketId, entry.EmployeeId, entry.EntryType, entry.Notes, entry.PerformedAtUtc);
    }

    public async Task<IReadOnlyList<JobTicketPartDto>> ListPartsAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        await EnsureCurrentUserCanAccessJobTicketAsync(jobTicketId, cancellationToken);

        return await dbContext.JobTicketParts
            .Where(x => x.JobTicketId == jobTicketId)
            .OrderByDescending(x => x.AddedAtUtc)
            .Select(MapJobTicketPart(currentUserContext.IsManager))
            .ToListAsync(cancellationToken);
    }

    public async Task<JobTicketPartDto> AddPartAsync(Guid jobTicketId, AddJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserCanAccessJobTicketAsync(jobTicketId, cancellationToken);
        await EnsureEmployeeClockedIntoJobTicketAsync(jobTicketId, cancellationToken);
        var jobTicket = await dbContext.JobTickets.SingleOrDefaultAsync(x => x.Id == jobTicketId, cancellationToken);
        if (jobTicket is null)
        {
            throw new ValidationException("JobTicketId does not reference an active job ticket.");
        }

        ValidatePositiveQuantity(request.Quantity);
        var part = await dbContext.Parts.SingleOrDefaultAsync(x => x.Id == request.PartId, cancellationToken);
        if (part is null)
        {
            throw new ValidationException("PartId does not reference an active part.");
        }

        if (request.AddedByEmployeeId.HasValue)
        {
            await ValidateAddedByEmployeeAssignmentAsync(jobTicketId, request.AddedByEmployeeId.Value, request.AllowManagerOverride, cancellationToken);
        }

        await ValidatePartCompatibilityReferencesAsync(request.EquipmentId, request.ReplacedByJobTicketPartId, jobTicketId, null, cancellationToken);

        var entry = new JobTicketPart
        {
            JobTicketId = jobTicketId,
            PartId = request.PartId,
            PartNumberSnapshot = part.PartNumber,
            PartNameSnapshot = part.Name,
            EquipmentId = request.EquipmentId,
            Quantity = request.Quantity,
            UnitCostSnapshot = part.UnitCost,
            SalePriceSnapshot = part.UnitPrice,
            ComponentCategory = ValidationHelpers.NullIfWhitespace(request.ComponentCategory),
            FailureDescription = ValidationHelpers.NullIfWhitespace(request.FailureDescription),
            RepairDescription = ValidationHelpers.NullIfWhitespace(request.RepairDescription),
            TechnicianNotes = ValidationHelpers.NullIfWhitespace(request.TechnicianNotes),
            InstalledAtUtc = request.InstalledAtUtc,
            WasSuccessful = request.WasSuccessful,
            RemovedAtUtc = request.RemovedAtUtc,
            ReplacedByJobTicketPartId = request.ReplacedByJobTicketPartId,
            CompatibilityNotes = ValidationHelpers.NullIfWhitespace(request.CompatibilityNotes),
            Notes = ValidationHelpers.NullIfWhitespace(request.Notes),
            IsBillable = request.IsBillable,
            ApprovalStatus = JobPartApprovalStatus.Pending,
            AddedAtUtc = request.AddedAtUtc ?? DateTime.UtcNow,
            AddedByEmployeeId = request.AddedByEmployeeId,
            AddedByUserId = request.AddedByEmployeeId,
            Status = PartTransactionStatus.Used
        };

        dbContext.JobTicketParts.Add(entry);

        if (request.AdjustInventory)
        {
            part.QuantityOnHand -= request.Quantity;
            var stockLocation = await GetOrCreateDefaultStockLocationAsync(cancellationToken);
            dbContext.InventoryTransactions.Add(new InventoryTransaction
            {
                StockLocation = stockLocation,
                PartId = part.Id,
                TransactionType = InventoryTransactionType.ManualAdjustment,
                QuantityDelta = -request.Quantity,
                Reason = $"Job ticket {jobTicket.TicketNumber} part usage",
                Notes = $"JobTicketPartId: {entry.Id}",
                OccurredAtUtc = entry.AddedAtUtc
            });
        }

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Create, null, AuditJson(("JobTicketPartId", entry.Id), ("PartId", request.PartId), ("Quantity", request.Quantity)));
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart(currentUserContext.IsManager).Compile().Invoke(entry);
    }

    public async Task<JobTicketPartDto> QuickAddPartAsync(Guid jobTicketId, QuickAddJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserCanAccessJobTicketAsync(jobTicketId, cancellationToken);
        await EnsureEmployeeClockedIntoJobTicketAsync(jobTicketId, cancellationToken);
        var jobTicket = await dbContext.JobTickets.SingleOrDefaultAsync(x => x.Id == jobTicketId, cancellationToken);
        if (jobTicket is null)
        {
            throw new ValidationException("JobTicketId does not reference an active job ticket.");
        }

        ValidatePositiveQuantity(request.Quantity);
        var partNumber = ValidationHelpers.NullIfWhitespace(request.PartNumber);
        if (partNumber is null)
        {
            throw new ValidationException("PartNumber is required.");
        }

        if (request.UnitCost < 0)
        {
            throw new ValidationException("UnitCost cannot be negative.");
        }

        if (request.SalePrice < 0)
        {
            throw new ValidationException("SalePrice cannot be negative.");
        }

        if (request.AddedByEmployeeId.HasValue)
        {
            await ValidateAddedByEmployeeAssignmentAsync(jobTicketId, request.AddedByEmployeeId.Value, request.AllowManagerOverride, cancellationToken);
        }

        await ValidatePartCompatibilityReferencesAsync(request.EquipmentId, request.ReplacedByJobTicketPartId, jobTicketId, null, cancellationToken);

        var normalizedPartNumber = partNumber.Trim();
        var partNumberUpper = normalizedPartNumber.ToUpperInvariant();
        var existingPart = await dbContext.Parts.SingleOrDefaultAsync(x => x.PartNumber.ToUpper() == partNumberUpper, cancellationToken);

        var partName = ValidationHelpers.NullIfWhitespace(request.PartName);
        if (existingPart is null && partName is null)
        {
            throw new ValidationException("PartName is required when PartNumber does not match an existing part.");
        }

        var addedAtUtc = request.AddedAtUtc ?? DateTime.UtcNow;
        var entry = new JobTicketPart
        {
            JobTicketId = jobTicketId,
            PartId = existingPart?.Id,
            PartNumberSnapshot = existingPart?.PartNumber ?? normalizedPartNumber,
            PartNameSnapshot = existingPart?.Name ?? partName!,
            IsUnlistedPart = existingPart is null,
            EquipmentId = request.EquipmentId,
            Quantity = request.Quantity,
            UnitCostSnapshot = existingPart?.UnitCost ?? request.UnitCost,
            SalePriceSnapshot = existingPart?.UnitPrice ?? request.SalePrice,
            ComponentCategory = ValidationHelpers.NullIfWhitespace(request.ComponentCategory),
            FailureDescription = ValidationHelpers.NullIfWhitespace(request.FailureDescription),
            RepairDescription = ValidationHelpers.NullIfWhitespace(request.RepairDescription),
            TechnicianNotes = ValidationHelpers.NullIfWhitespace(request.TechnicianNotes),
            InstalledAtUtc = request.InstalledAtUtc,
            WasSuccessful = request.WasSuccessful,
            RemovedAtUtc = request.RemovedAtUtc,
            ReplacedByJobTicketPartId = request.ReplacedByJobTicketPartId,
            CompatibilityNotes = ValidationHelpers.NullIfWhitespace(request.CompatibilityNotes),
            Notes = ValidationHelpers.NullIfWhitespace(request.Notes),
            IsBillable = request.IsBillable,
            OfficeOrderRequested = request.RequestOfficeOrder,
            OfficeOrderRequestedAtUtc = request.RequestOfficeOrder ? addedAtUtc : null,
            OfficeOrderNotes = ValidationHelpers.NullIfWhitespace(request.OfficeOrderNotes),
            ApprovalStatus = JobPartApprovalStatus.Pending,
            AddedAtUtc = addedAtUtc,
            AddedByEmployeeId = request.AddedByEmployeeId,
            AddedByUserId = request.AddedByEmployeeId,
            Status = PartTransactionStatus.Used
        };

        dbContext.JobTicketParts.Add(entry);

        if (existingPart is not null && request.AdjustInventory)
        {
            existingPart.QuantityOnHand -= request.Quantity;
            var stockLocation = await GetOrCreateDefaultStockLocationAsync(cancellationToken);
            dbContext.InventoryTransactions.Add(new InventoryTransaction
            {
                StockLocation = stockLocation,
                PartId = existingPart.Id,
                TransactionType = InventoryTransactionType.ManualAdjustment,
                QuantityDelta = -request.Quantity,
                Reason = $"Job ticket {jobTicket.TicketNumber} quick-add part usage",
                Notes = $"JobTicketPartId: {entry.Id}",
                OccurredAtUtc = entry.AddedAtUtc
            });
        }

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Create, null, AuditJson(("JobTicketPartId", entry.Id), ("PartNumber", entry.PartNumberSnapshot), ("Quantity", request.Quantity), ("IsUnlistedPart", entry.IsUnlistedPart), ("OfficeOrderRequested", entry.OfficeOrderRequested)));
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart(currentUserContext.IsManager).Compile().Invoke(entry);
    }

    public async Task<JobTicketPartDto?> UpdatePartAsync(Guid jobTicketId, Guid jobTicketPartId, UpdateJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserCanAccessJobTicketAsync(jobTicketId, cancellationToken);
        await EnsureEmployeeClockedIntoJobTicketAsync(jobTicketId, cancellationToken);
        ValidatePartUpdatePermissions(request);

        var entry = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.Id == jobTicketPartId, cancellationToken);
        if (entry is null) return null;

        EnsureEditable(entry, request.AllowManagerOverride);
        ValidatePositiveQuantity(request.Quantity);
        await ValidatePartCompatibilityReferencesAsync(request.EquipmentId, request.ReplacedByJobTicketPartId, jobTicketId, entry.Id, cancellationToken);

        var oldValues = AuditJson(("Quantity", entry.Quantity), ("IsBillable", entry.IsBillable), ("ApprovalStatus", entry.ApprovalStatus.ToString()));
        entry.Quantity = request.Quantity;
        entry.EquipmentId = request.EquipmentId;
        entry.ComponentCategory = ValidationHelpers.NullIfWhitespace(request.ComponentCategory);
        entry.FailureDescription = ValidationHelpers.NullIfWhitespace(request.FailureDescription);
        entry.RepairDescription = ValidationHelpers.NullIfWhitespace(request.RepairDescription);
        entry.TechnicianNotes = ValidationHelpers.NullIfWhitespace(request.TechnicianNotes);
        entry.InstalledAtUtc = request.InstalledAtUtc;
        entry.WasSuccessful = request.WasSuccessful;
        entry.RemovedAtUtc = request.RemovedAtUtc;
        entry.ReplacedByJobTicketPartId = request.ReplacedByJobTicketPartId;
        entry.CompatibilityNotes = ValidationHelpers.NullIfWhitespace(request.CompatibilityNotes);
        entry.Notes = ValidationHelpers.NullIfWhitespace(request.Notes);
        entry.IsBillable = request.IsBillable;

        if (request.ApprovalStatus.HasValue)
        {
            entry.ApprovalStatus = request.ApprovalStatus.Value;
            if (entry.ApprovalStatus == JobPartApprovalStatus.Rejected)
            {
                var reason = ValidationHelpers.NullIfWhitespace(request.RejectionReason);
                if (reason is null)
                {
                    throw new ValidationException("RejectionReason is required when setting approval status to Rejected.");
                }

                entry.RejectionReason = reason;
                entry.RejectedAtUtc = DateTime.UtcNow;
                entry.RejectedByUserId = request.ActorUserId;
                entry.ApprovedAtUtc = null;
                entry.ApprovedByUserId = null;
            }
            else if (entry.ApprovalStatus == JobPartApprovalStatus.Approved)
            {
                entry.ApprovedAtUtc = DateTime.UtcNow;
                entry.ApprovedByUserId = request.ActorUserId;
                entry.RejectedAtUtc = null;
                entry.RejectedByUserId = null;
                entry.RejectionReason = null;
            }
        }

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Update, oldValues, AuditJson(("JobTicketPartId", entry.Id), ("Quantity", entry.Quantity), ("IsBillable", entry.IsBillable), ("ApprovalStatus", entry.ApprovalStatus.ToString())));
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart(currentUserContext.IsManager).Compile().Invoke(entry);
    }

    public async Task<JobTicketPartDto?> ApprovePartAsync(Guid jobTicketId, Guid jobTicketPartId, ApproveJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        var entry = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.Id == jobTicketPartId, cancellationToken);
        if (entry is null) return null;

        EnsureEditable(entry, request.AllowManagerOverride);
        entry.ApprovalStatus = JobPartApprovalStatus.Approved;
        entry.ApprovedByUserId = request.ApprovedByUserId;
        entry.ApprovedAtUtc = DateTime.UtcNow;
        entry.RejectionReason = null;
        entry.RejectedByUserId = null;
        entry.RejectedAtUtc = null;

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Approval, null, AuditJson(("JobTicketPartId", entry.Id), ("ApprovalStatus", "Approved")));
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart(currentUserContext.IsManager).Compile().Invoke(entry);
    }

    public async Task<JobTicketPartDto?> RejectPartAsync(Guid jobTicketId, Guid jobTicketPartId, RejectJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        var reason = ValidationHelpers.NullIfWhitespace(request.RejectionReason);
        if (reason is null)
        {
            throw new ValidationException("RejectionReason is required.");
        }

        var entry = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.Id == jobTicketPartId, cancellationToken);
        if (entry is null) return null;

        EnsureEditable(entry, request.AllowManagerOverride);
        entry.ApprovalStatus = JobPartApprovalStatus.Rejected;
        entry.RejectionReason = reason;
        entry.RejectedByUserId = request.RejectedByUserId;
        entry.RejectedAtUtc = DateTime.UtcNow;
        entry.ApprovedByUserId = null;
        entry.ApprovedAtUtc = null;

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Approval, null, AuditJson(("JobTicketPartId", entry.Id), ("ApprovalStatus", "Rejected")));
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart(currentUserContext.IsManager).Compile().Invoke(entry);
    }

    public async Task<JobTicketPartDto?> ArchivePartAsync(Guid jobTicketId, Guid jobTicketPartId, ArchiveJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        var entry = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.Id == jobTicketPartId, cancellationToken);
        if (entry is null) return null;

        var part = request.RestoreInventory && entry.PartId.HasValue
            ? await dbContext.Parts.SingleOrDefaultAsync(x => x.Id == entry.PartId.Value, cancellationToken)
            : null;

        var archivedAtUtc = DateTime.UtcNow;
        entry.IsDeleted = true;
        entry.DeletedAtUtc = archivedAtUtc;
        entry.DeletedByUserId = request.ArchivedByUserId;
        entry.Status = PartTransactionStatus.Cancelled;

        if (request.RestoreInventory && part is not null)
        {
            part.QuantityOnHand += entry.Quantity;
            var stockLocation = await GetOrCreateDefaultStockLocationAsync(cancellationToken);
            dbContext.InventoryTransactions.Add(new InventoryTransaction
            {
                StockLocation = stockLocation,
                PartId = part.Id,
                TransactionType = InventoryTransactionType.ManualAdjustment,
                QuantityDelta = entry.Quantity,
                Reason = $"Job ticket {jobTicketId} part archive restore",
                Notes = $"JobTicketPartId: {entry.Id}",
                OccurredAtUtc = archivedAtUtc
            });
        }

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Delete, null, AuditJson(("JobTicketPartId", entry.Id), ("RestoreInventory", request.RestoreInventory)));
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart(currentUserContext.IsManager).Compile().Invoke(entry);
    }


    private async Task EnsureCurrentUserCanAccessJobTicketAsync(Guid jobTicketId, CancellationToken cancellationToken)
    {
        if (currentUserContext.IsManager)
        {
            return;
        }

        var isAssigned = await dbContext.JobTicketEmployees.AnyAsync(x => x.JobTicketId == jobTicketId && x.EmployeeId == currentUserContext.EmployeeId, cancellationToken);
        if (!isAssigned)
        {
            throw new ValidationException("Current employee is not assigned to this job ticket.");
        }
    }

    private async Task EnsureEmployeeClockedIntoJobTicketAsync(Guid jobTicketId, CancellationToken cancellationToken)
    {
        if (currentUserContext.IsManager)
        {
            return;
        }

        var hasOpenEntryForTicket = await dbContext.TimeEntries.AnyAsync(
            x => x.JobTicketId == jobTicketId &&
                 x.EmployeeId == currentUserContext.EmployeeId &&
                 x.EndedAtUtc == null,
            cancellationToken);

        if (!hasOpenEntryForTicket)
        {
            throw new ValidationException("Clock in to this job ticket before recording field work.");
        }
    }

    private void EnsureManagerOrAdmin()
    {
        if (!currentUserContext.IsManager)
        {
            throw new ValidationException("This operation requires manager or admin access.");
        }
    }

    private async Task EnsureJobTicketExists(Guid jobTicketId, CancellationToken cancellationToken)
    {
        if (!await dbContext.JobTickets.AnyAsync(x => x.Id == jobTicketId, cancellationToken))
        {
            throw new ValidationException("JobTicketId does not reference an active job ticket.");
        }
    }

    private static void ValidatePositiveQuantity(decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ValidationException("Quantity must be greater than zero.");
        }
    }

    private async Task<StockLocation> GetOrCreateDefaultStockLocationAsync(CancellationToken cancellationToken)
    {
        var stockLocation = await dbContext.StockLocations
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.Code)
            .FirstOrDefaultAsync(cancellationToken);

        if (stockLocation is not null)
        {
            return stockLocation;
        }

        stockLocation = new StockLocation
        {
            Name = "Main Warehouse",
            Code = "MAIN",
            Description = "Default warehouse stock location"
        };
        dbContext.StockLocations.Add(stockLocation);
        return stockLocation;
    }

    private void ValidatePartUpdatePermissions(UpdateJobTicketPartDto request)
    {
        if (request.ApprovalStatus.HasValue)
        {
            EnsureManagerOrAdmin();
            if (!Enum.IsDefined(request.ApprovalStatus.Value))
            {
                throw new ValidationException("ApprovalStatus is not a valid job part approval status.");
            }
        }

        if (request.AllowManagerOverride && !currentUserContext.IsManager)
        {
            throw new ValidationException("Only managers or admins can apply manager override.");
        }
    }

    private async Task ValidateAddedByEmployeeAssignmentAsync(Guid jobTicketId, Guid employeeId, bool allowManagerOverride, CancellationToken cancellationToken)
    {
        if (!await dbContext.Employees.AnyAsync(x => x.Id == employeeId, cancellationToken))
        {
            throw new ValidationException("AddedByEmployeeId does not reference an active employee.");
        }

        if (allowManagerOverride)
        {
            return;
        }

        var isAssigned = await dbContext.JobTicketEmployees.AnyAsync(x => x.JobTicketId == jobTicketId && x.EmployeeId == employeeId, cancellationToken);
        if (!isAssigned)
        {
            throw new ValidationException("AddedByEmployeeId must be assigned to the job ticket unless manager override is enabled.");
        }
    }

    private async Task ValidatePartCompatibilityReferencesAsync(Guid? equipmentId, Guid? replacedByJobTicketPartId, Guid jobTicketId, Guid? currentJobTicketPartId, CancellationToken cancellationToken)
    {
        if (equipmentId.HasValue && !await dbContext.Equipment.AnyAsync(x => x.Id == equipmentId.Value, cancellationToken))
        {
            throw new ValidationException("EquipmentId does not reference an active equipment record.");
        }

        if (!replacedByJobTicketPartId.HasValue)
        {
            return;
        }

        if (currentJobTicketPartId.HasValue && replacedByJobTicketPartId.Value == currentJobTicketPartId.Value)
        {
            throw new ValidationException("ReplacedByJobTicketPartId cannot reference the same job ticket part.");
        }

        var replacementExists = await dbContext.JobTicketParts.AnyAsync(
            x => x.JobTicketId == jobTicketId && x.Id == replacedByJobTicketPartId.Value,
            cancellationToken);

        if (!replacementExists)
        {
            throw new ValidationException("ReplacedByJobTicketPartId must reference a job ticket part on the same job ticket.");
        }
    }

    private static void EnsureEditable(JobTicketPart entry, bool allowManagerOverride)
    {
        if (!allowManagerOverride && (entry.ApprovalStatus is JobPartApprovalStatus.Approved or JobPartApprovalStatus.Invoiced))
        {
            throw new ValidationException("Approved or invoiced job parts cannot be edited without manager override.");
        }
    }

    private async Task ValidateReferencesAsync(Guid customerId, Guid serviceLocationId, Guid billingPartyCustomerId, Guid? equipmentId, Guid? assignedManagerEmployeeId, CancellationToken cancellationToken)
    {
        if (!await dbContext.Customers.AnyAsync(x => x.Id == customerId, cancellationToken))
        {
            throw new ValidationException("CustomerId does not reference an active customer.");
        }

        if (!await dbContext.ServiceLocations.AnyAsync(x => x.Id == serviceLocationId, cancellationToken))
        {
            throw new ValidationException("ServiceLocationId does not reference an active service location.");
        }

        if (!await dbContext.Customers.AnyAsync(x => x.Id == billingPartyCustomerId, cancellationToken))
        {
            throw new ValidationException("BillingPartyCustomerId does not reference an active customer.");
        }

        if (equipmentId.HasValue)
        {
            var equipment = await dbContext.Equipment
                .Where(x => x.Id == equipmentId.Value)
                .Select(x => new { x.Id, x.ServiceLocationId })
                .SingleOrDefaultAsync(cancellationToken);

            if (equipment is null)
            {
                throw new ValidationException("EquipmentId does not reference an active equipment record.");
            }

            if (equipment.ServiceLocationId != serviceLocationId)
            {
                throw new ValidationException("Equipment must belong to the selected ServiceLocationId.");
            }
        }

        if (assignedManagerEmployeeId.HasValue && !await dbContext.Employees.AnyAsync(x => x.Id == assignedManagerEmployeeId.Value, cancellationToken))
        {
            throw new ValidationException("AssignedManagerEmployeeId does not reference an active employee.");
        }
    }

    private static void ValidateCreateOrUpdateRequest(CreateJobTicketDto request)
        => ValidateCreateOrUpdateRequest(
            request.CustomerId,
            request.ServiceLocationId,
            request.BillingPartyCustomerId,
            request.Title,
            request.Description,
            request.JobType,
            request.PurchaseOrderNumber,
            request.BillingContactName,
            request.BillingContactPhone,
            request.BillingContactEmail,
            request.InternalNotes,
            request.CustomerFacingNotes);

    private static void ValidateCreateOrUpdateRequest(UpdateJobTicketDto request)
        => ValidateCreateOrUpdateRequest(
            request.CustomerId,
            request.ServiceLocationId,
            request.BillingPartyCustomerId,
            request.Title,
            request.Description,
            request.JobType,
            request.PurchaseOrderNumber,
            request.BillingContactName,
            request.BillingContactPhone,
            request.BillingContactEmail,
            request.InternalNotes,
            request.CustomerFacingNotes);

    private static void ValidateCreateOrUpdateRequest(
        Guid customerId,
        Guid serviceLocationId,
        Guid billingPartyCustomerId,
        string title,
        string? description,
        string? jobType,
        string? purchaseOrderNumber,
        string? billingContactName,
        string? billingContactPhone,
        string? billingContactEmail,
        string? internalNotes,
        string? customerFacingNotes)
    {
        if (customerId == Guid.Empty) throw new ValidationException("CustomerId is required.");
        if (serviceLocationId == Guid.Empty) throw new ValidationException("ServiceLocationId is required.");
        if (billingPartyCustomerId == Guid.Empty) throw new ValidationException("BillingPartyCustomerId is required.");
        ValidationHelpers.ValidateRequired(title, nameof(title));
        ValidateMaxLength(title, nameof(title), 200);
        ValidateMaxLength(description, nameof(description), 4000);
        ValidateMaxLength(jobType, nameof(jobType), 100);
        ValidateMaxLength(purchaseOrderNumber, nameof(purchaseOrderNumber), 100);
        ValidateMaxLength(billingContactName, nameof(billingContactName), 200);
        ValidateMaxLength(billingContactPhone, nameof(billingContactPhone), 50);
        ValidateMaxLength(billingContactEmail, nameof(billingContactEmail), 320);
        ValidateMaxLength(internalNotes, nameof(internalNotes), 4000);
        ValidateMaxLength(customerFacingNotes, nameof(customerFacingNotes), 4000);
    }

    private static void ValidateMaxLength(string? value, string fieldName, int maxLength)
    {
        var trimmed = ValidationHelpers.NullIfWhitespace(value);
        if (trimmed is not null && trimmed.Length > maxLength)
        {
            throw new ValidationException($"{fieldName} must be {maxLength} characters or fewer.");
        }
    }

    private async Task<string> GenerateTicketNumberAsync(CancellationToken cancellationToken)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"JT-{year}-";

        var existingNumbers = await dbContext.JobTickets
            .Where(x => x.TicketNumber.StartsWith(prefix))
            .Select(x => x.TicketNumber)
            .ToListAsync(cancellationToken);

        var next = existingNumbers
            .Select(x => x.Length >= prefix.Length + 6 && int.TryParse(x[^6..], out var number) ? number : 0)
            .DefaultIfEmpty(0)
            .Max() + 1;

        return $"{prefix}{next:D6}";
    }

    private static string AuditJson(params (string Name, object? Value)[] values)
    {
        return JsonSerializer.Serialize(values.ToDictionary(x => x.Name, x => x.Value));
    }

    public async Task<IReadOnlyList<TicketTimelineItemDto>> GetTimelineAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        var logs = await dbContext.AuditLogs
            .Where(x => x.EntityId == jobTicketId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(200)
            .ToListAsync(cancellationToken);

        // Build actor name lookup for any non-null UserId in this batch
        var actorIds = logs
            .Where(x => x.UserId.HasValue && x.UserId.Value != Guid.Empty)
            .Select(x => x.UserId!.Value)
            .Distinct()
            .ToList();

        var actorNames = actorIds.Count > 0
            ? await dbContext.Employees
                .Where(x => actorIds.Contains(x.Id))
                .Select(x => new { x.Id, Name = x.FirstName + " " + x.LastName })
                .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        return logs
            .Select(log => new TicketTimelineItemDto(
                log.Id,
                log.CreatedAtUtc,
                log.ActionType.ToString(),
                log.EntityName,
                FormatTimelineEvent(log),
                log.UserId.HasValue && actorNames.TryGetValue(log.UserId.Value, out var name) ? name : null,
                log.OldValuesJson,
                log.NewValuesJson))
            .ToList();
    }

    private static string FormatTimelineEvent(AuditLog log)
    {
        var newVals = ParseJson(log.NewValuesJson);
        var oldVals = ParseJson(log.OldValuesJson);

        return (log.EntityName, log.ActionType) switch
        {
            (nameof(JobTicket), AuditActionType.Create) =>
                $"Ticket created" + (newVals.TryGetValue("TicketNumber", out var tn) ? $" ({tn})" : ""),
            (nameof(JobTicket), AuditActionType.StatusChange) =>
                $"Status changed from {FriendlyStatus(oldVals.GetValueOrDefault("Status"))} to {FriendlyStatus(newVals.GetValueOrDefault("Status"))}",
            (nameof(JobTicket), AuditActionType.Update) =>
                "Ticket details updated",
            (nameof(JobTicket), AuditActionType.Delete) =>
                "Ticket archived" + (newVals.TryGetValue("ArchiveReason", out var reason) ? $": {reason}" : ""),
            (nameof(JobTicketEmployee), AuditActionType.Assignment) =>
                newVals.GetValueOrDefault("Operation") == "Add"
                    ? "Technician assigned to ticket"
                    : "Technician removed from ticket",
            (nameof(JobWorkEntry), AuditActionType.Create) =>
                $"Work note added ({FriendlyEntryType(newVals.GetValueOrDefault("EntryType"))})",
            (nameof(JobTicketPart), AuditActionType.Create) =>
                newVals.GetValueOrDefault("OfficeOrderRequested") == "true" || newVals.GetValueOrDefault("OfficeOrderRequested") == "True"
                    ? $"Part order requested: {newVals.GetValueOrDefault("PartNumber") ?? "unlisted part"}"
                    : $"Part added: {newVals.GetValueOrDefault("PartNumber") ?? newVals.GetValueOrDefault("PartId") ?? "part"}",
            (nameof(JobTicketPart), AuditActionType.Update) =>
                "Part record updated",
            (nameof(JobTicketPart), AuditActionType.Approval) =>
                $"Part {newVals.GetValueOrDefault("ApprovalStatus")?.ToString()?.ToLowerInvariant() ?? "reviewed"}",
            (nameof(JobTicketPart), AuditActionType.Delete) =>
                "Part removed from ticket",
            _ => $"{log.EntityName} {log.ActionType}"
        };
    }

    private static Dictionary<string, string> ParseJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json)
                       ?.ToDictionary(kv => kv.Key, kv => kv.Value.ToString())
                   ?? new();
        }
        catch
        {
            return new();
        }
    }

    private static string FriendlyStatus(string? raw) => raw switch
    {
        "Draft" => "Draft",
        "Submitted" => "Submitted",
        "Assigned" => "Assigned",
        "InProgress" => "In Progress",
        "WaitingOnParts" => "Waiting on Parts",
        "WaitingOnCustomer" => "Waiting on Customer",
        "Completed" => "Completed",
        "Cancelled" => "Cancelled",
        "Invoiced" => "Invoiced",
        "Reviewed" => "Reviewed",
        _ => raw ?? "Unknown"
    };

    private static string FriendlyEntryType(string? raw) => raw switch
    {
        "WorkNote" => "work note",
        "ClockIn" => "clock-in",
        "ClockOut" => "clock-out",
        "TravelStart" => "travel start",
        "ArrivalOnSite" => "arrival on site",
        _ => raw?.ToLowerInvariant() ?? "note"
    };

    private void AddAudit(Guid entityId, string entityName, AuditActionType actionType, string? oldValues, string? newValues)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = entityName,
            EntityId = entityId,
            ActionType = actionType,
            UserId = currentUserContext.UserId != Guid.Empty ? currentUserContext.UserId : null,
            OldValuesJson = oldValues,
            NewValuesJson = newValues
        });
    }

    private async Task<JobTicketDto?> LoadJobTicketAsync(
        Guid id,
        CancellationToken cancellationToken,
        bool includeArchived = false)
    {
        var query = includeArchived
            ? dbContext.JobTickets.IgnoreQueryFilters()
            : dbContext.JobTickets.AsQueryable();

        return await query
            .Where(x => x.Id == id)
            .Select(MapJobTicket)
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static readonly System.Linq.Expressions.Expression<Func<JobTicket, JobTicketDto>> MapJobTicket = x => new JobTicketDto(
        x.Id,
        x.TicketNumber,
        x.CustomerId,
        x.ServiceLocationId,
        x.BillingPartyCustomerId,
        x.EquipmentId,
        x.Title,
        x.Description,
        x.JobType,
        x.Priority,
        x.Status,
        x.LocationType,
        x.RequestedAtUtc,
        x.ScheduledStartAtUtc,
        x.DueAtUtc,
        x.CompletedAtUtc,
        x.AssignedManagerEmployeeId,
        x.PurchaseOrderNumber,
        x.BillingContactName,
        x.BillingContactPhone,
        x.BillingContactEmail,
        x.InternalNotes,
        x.CustomerFacingNotes,
        x.ArchiveReason,
        x.Customer.Name,
        x.ServiceLocation.LocationName,
        x.BillingPartyCustomer.Name,
        x.Equipment != null ? x.Equipment.Name : null,
        x.Equipment != null ? x.Equipment.EquipmentNumber : null,
        x.AssignedManagerEmployee != null
            ? x.AssignedManagerEmployee.FirstName + " " + x.AssignedManagerEmployee.LastName
            : null,
        x.EstimatedDurationMinutes);

    private static System.Linq.Expressions.Expression<Func<JobTicketPart, JobTicketPartDto>> MapJobTicketPart(bool includePricing) => x => new JobTicketPartDto(
        x.Id,
        x.JobTicketId,
        x.PartId,
        x.PartNumberSnapshot,
        x.PartNameSnapshot,
        x.IsUnlistedPart,
        x.OfficeOrderRequested,
        x.OfficeOrderRequestedAtUtc,
        x.OfficeOrderNotes,
        x.EquipmentId,
        x.Quantity,
        includePricing ? x.UnitCostSnapshot : null,
        includePricing ? x.SalePriceSnapshot : null,
        x.ComponentCategory,
        x.FailureDescription,
        x.RepairDescription,
        x.TechnicianNotes,
        x.InstalledAtUtc,
        x.WasSuccessful,
        x.RemovedAtUtc,
        x.ReplacedByJobTicketPartId,
        x.CompatibilityNotes,
        x.IsBillable,
        x.Notes,
        x.ApprovalStatus,
        x.AddedAtUtc,
        x.AddedByEmployeeId,
        x.ApprovedByUserId,
        x.ApprovedAtUtc,
        x.RejectedByUserId,
        x.RejectedAtUtc,
        x.RejectionReason);
}

public sealed record JobTicketListQuery(
    Guid? CustomerId,
    Guid? ServiceLocationId,
    JobTicketStatus? Status,
    JobTicketPriority? Priority,
    string? Search,
    int Offset = 0,
    int Limit = 50)
{
    public PagedQuery PagedQuery => new(Offset, Limit);
}

public sealed record JobTicketListItemDto(
    Guid Id,
    string TicketNumber,
    string Title,
    JobTicketStatus Status,
    JobTicketPriority Priority,
    Guid CustomerId,
    Guid ServiceLocationId,
    DateTime? RequestedAtUtc,
    DateTime? ScheduledStartAtUtc,
    DateTime? DueAtUtc,
    DateTime? CompletedAtUtc,
    string CustomerName,
    string ServiceLocationName,
    Guid? EquipmentId,
    string? EquipmentName);

public sealed record TicketTimelineItemDto(
    Guid Id,
    DateTime OccurredAtUtc,
    string ActionType,
    string EntityName,
    string Description,
    string? ActorName,
    string? OldValuesJson,
    string? NewValuesJson);

public sealed record JobTicketDto(
    Guid Id,
    string TicketNumber,
    Guid CustomerId,
    Guid ServiceLocationId,
    Guid BillingPartyCustomerId,
    Guid? EquipmentId,
    string Title,
    string? Description,
    string? JobType,
    JobTicketPriority Priority,
    JobTicketStatus Status,
    WorkLocationType LocationType,
    DateTime? RequestedAtUtc,
    DateTime? ScheduledStartAtUtc,
    DateTime? DueAtUtc,
    DateTime? CompletedAtUtc,
    Guid? AssignedManagerEmployeeId,
    string? PurchaseOrderNumber,
    string? BillingContactName,
    string? BillingContactPhone,
    string? BillingContactEmail,
    string? InternalNotes,
    string? CustomerFacingNotes,
    string? ArchiveReason,
    string CustomerName,
    string ServiceLocationName,
    string BillingPartyCustomerName,
    string? EquipmentName,
    string? EquipmentNumber,
    string? AssignedManagerEmployeeName,
    int? EstimatedDurationMinutes);

public sealed record CreateJobTicketDto(
    Guid CustomerId,
    Guid ServiceLocationId,
    Guid BillingPartyCustomerId,
    Guid? EquipmentId,
    string Title,
    string? Description,
    string? JobType,
    JobTicketPriority Priority,
    JobTicketStatus Status,
    WorkLocationType LocationType,
    DateTime? RequestedAtUtc,
    DateTime? ScheduledStartAtUtc,
    DateTime? DueAtUtc,
    Guid? AssignedManagerEmployeeId,
    string? PurchaseOrderNumber,
    string? BillingContactName,
    string? BillingContactPhone,
    string? BillingContactEmail,
    string? InternalNotes,
    string? CustomerFacingNotes,
    int? EstimatedDurationMinutes = null);

public sealed record UpdateJobTicketDto(
    Guid CustomerId,
    Guid ServiceLocationId,
    Guid BillingPartyCustomerId,
    Guid? EquipmentId,
    string Title,
    string? Description,
    string? JobType,
    JobTicketPriority Priority,
    JobTicketStatus Status,
    WorkLocationType LocationType,
    DateTime? RequestedAtUtc,
    DateTime? ScheduledStartAtUtc,
    DateTime? DueAtUtc,
    Guid? AssignedManagerEmployeeId,
    string? PurchaseOrderNumber,
    string? BillingContactName,
    string? BillingContactPhone,
    string? BillingContactEmail,
    string? InternalNotes,
    string? CustomerFacingNotes,
    int? EstimatedDurationMinutes = null);

public sealed record ChangeJobTicketStatusDto(JobTicketStatus Status);

public sealed record ArchiveJobTicketDto(string ArchiveReason);

public sealed record AddJobTicketAssignmentDto(Guid EmployeeId, bool IsLead = false);
public sealed record JobTicketAssignmentDto(Guid JobTicketId, Guid EmployeeId, DateTime AssignedAtUtc, bool IsLead, string EmployeeName);

public sealed record AddJobWorkEntryDto(Guid? EmployeeId, WorkEntryType EntryType, string Notes, DateTime? PerformedAtUtc);
public sealed record JobWorkEntryDto(Guid Id, Guid JobTicketId, Guid? EmployeeId, WorkEntryType EntryType, string Notes, DateTime PerformedAtUtc);

public sealed record AddJobTicketPartDto(
    Guid PartId,
    decimal Quantity,
    string? Notes,
    bool IsBillable,
    Guid? AddedByEmployeeId,
    DateTime? AddedAtUtc,
    bool AdjustInventory = true,
    bool AllowManagerOverride = false,
    Guid? EquipmentId = null,
    string? ComponentCategory = null,
    string? FailureDescription = null,
    string? RepairDescription = null,
    string? TechnicianNotes = null,
    DateTime? InstalledAtUtc = null,
    bool? WasSuccessful = null,
    DateTime? RemovedAtUtc = null,
    Guid? ReplacedByJobTicketPartId = null,
    string? CompatibilityNotes = null);

public sealed record QuickAddJobTicketPartDto(
    string PartNumber,
    string? PartName,
    decimal Quantity,
    decimal UnitCost,
    decimal SalePrice,
    string? Notes,
    bool IsBillable,
    Guid? AddedByEmployeeId,
    DateTime? AddedAtUtc,
    bool RequestOfficeOrder = false,
    string? OfficeOrderNotes = null,
    bool AdjustInventory = true,
    bool AllowManagerOverride = false,
    Guid? EquipmentId = null,
    string? ComponentCategory = null,
    string? FailureDescription = null,
    string? RepairDescription = null,
    string? TechnicianNotes = null,
    DateTime? InstalledAtUtc = null,
    bool? WasSuccessful = null,
    DateTime? RemovedAtUtc = null,
    Guid? ReplacedByJobTicketPartId = null,
    string? CompatibilityNotes = null);

public sealed record UpdateJobTicketPartDto(
    decimal Quantity,
    string? Notes,
    bool IsBillable,
    JobPartApprovalStatus? ApprovalStatus,
    string? RejectionReason,
    Guid? ActorUserId,
    bool AllowManagerOverride = false,
    Guid? EquipmentId = null,
    string? ComponentCategory = null,
    string? FailureDescription = null,
    string? RepairDescription = null,
    string? TechnicianNotes = null,
    DateTime? InstalledAtUtc = null,
    bool? WasSuccessful = null,
    DateTime? RemovedAtUtc = null,
    Guid? ReplacedByJobTicketPartId = null,
    string? CompatibilityNotes = null);

public sealed record ApproveJobTicketPartDto(Guid? ApprovedByUserId, bool AllowManagerOverride = false);
public sealed record RejectJobTicketPartDto(string RejectionReason, Guid? RejectedByUserId, bool AllowManagerOverride = false);
public sealed record ArchiveJobTicketPartDto(Guid? ArchivedByUserId, bool RestoreInventory = true);

public sealed record JobTicketPartDto(
    Guid Id,
    Guid JobTicketId,
    Guid? PartId,
    string PartNumber,
    string PartName,
    bool IsUnlistedPart,
    bool OfficeOrderRequested,
    DateTime? OfficeOrderRequestedAtUtc,
    string? OfficeOrderNotes,
    Guid? EquipmentId,
    decimal Quantity,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] decimal? UnitCostSnapshot,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] decimal? SalePriceSnapshot,
    string? ComponentCategory,
    string? FailureDescription,
    string? RepairDescription,
    string? TechnicianNotes,
    DateTime? InstalledAtUtc,
    bool? WasSuccessful,
    DateTime? RemovedAtUtc,
    Guid? ReplacedByJobTicketPartId,
    string? CompatibilityNotes,
    bool IsBillable,
    string? Notes,
    JobPartApprovalStatus ApprovalStatus,
    DateTime AddedAtUtc,
    Guid? AddedByEmployeeId,
    Guid? ApprovedByUserId,
    DateTime? ApprovedAtUtc,
    Guid? RejectedByUserId,
    DateTime? RejectedAtUtc,
    string? RejectionReason);
