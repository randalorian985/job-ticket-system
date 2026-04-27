using JobTicketSystem.Application.MasterData;
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
    Task<JobTicketPartDto?> UpdatePartAsync(Guid jobTicketId, Guid jobTicketPartId, UpdateJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> ApprovePartAsync(Guid jobTicketId, Guid jobTicketPartId, ApproveJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> RejectPartAsync(Guid jobTicketId, Guid jobTicketPartId, RejectJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> ArchivePartAsync(Guid jobTicketId, Guid jobTicketPartId, ArchiveJobTicketPartDto request, CancellationToken cancellationToken = default);
}

public sealed class JobTicketsService(ApplicationDbContext dbContext) : IJobTicketsService
{
    private static readonly Guid SystemUserId = Guid.Empty;

    public async Task<IReadOnlyList<JobTicketListItemDto>> ListAsync(JobTicketListQuery query, CancellationToken cancellationToken = default)
    {
        var jobTickets = dbContext.JobTickets.AsQueryable();

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
            .Select(x => new JobTicketListItemDto(x.Id, x.TicketNumber, x.Title, x.Status, x.Priority, x.CustomerId, x.ServiceLocationId, x.RequestedAtUtc, x.ScheduledStartAtUtc, x.DueAtUtc, x.CompletedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public Task<JobTicketDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.JobTickets.Where(x => x.Id == id).Select(MapJobTicket).SingleOrDefaultAsync(cancellationToken);

    public async Task<JobTicketDto> CreateAsync(CreateJobTicketDto request, CancellationToken cancellationToken = default)
    {
        ValidateCreateOrUpdateRequest(request.CustomerId, request.ServiceLocationId, request.BillingPartyCustomerId, request.Title);
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
                RequestedAtUtc = request.RequestedAtUtc,
                ScheduledStartAtUtc = request.ScheduledStartAtUtc,
                DueAtUtc = request.DueAtUtc,
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
            AddAudit(entity.Id, nameof(JobTicket), AuditActionType.Create, null, $"{{\"TicketNumber\":\"{entity.TicketNumber}\"}}");

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                return MapJobTicket.Compile().Invoke(entity);
            }
            catch (DbUpdateException) when (attempt < 2)
            {
                dbContext.Entry(entity).State = EntityState.Detached;
            }
        }

        throw new ValidationException("Unable to generate a unique job ticket number. Please retry.");
    }

    public async Task<JobTicketDto?> UpdateAsync(Guid id, UpdateJobTicketDto request, CancellationToken cancellationToken = default)
    {
        ValidateCreateOrUpdateRequest(request.CustomerId, request.ServiceLocationId, request.BillingPartyCustomerId, request.Title);
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
        entity.RequestedAtUtc = request.RequestedAtUtc;
        entity.ScheduledStartAtUtc = request.ScheduledStartAtUtc;
        entity.DueAtUtc = request.DueAtUtc;
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

        AddAudit(entity.Id, nameof(JobTicket), AuditActionType.Update, null, $"{{\"Status\":\"{entity.Status}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicket.Compile().Invoke(entity);
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

        AddAudit(entity.Id, nameof(JobTicket), AuditActionType.StatusChange, $"{{\"Status\":\"{oldStatus}\"}}", $"{{\"Status\":\"{entity.Status}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapJobTicket.Compile().Invoke(entity);
    }

    public async Task<JobTicketDto?> ArchiveAsync(Guid id, ArchiveJobTicketDto request, CancellationToken cancellationToken = default)
    {
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

        AddAudit(entity.Id, nameof(JobTicket), AuditActionType.Delete, null, $"{{\"ArchiveReason\":\"{archiveReason}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicket.Compile().Invoke(entity);
    }

    public async Task<IReadOnlyList<JobTicketAssignmentDto>> ListAssignmentsAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);

        return await dbContext.JobTicketEmployees
            .Where(x => x.JobTicketId == jobTicketId)
            .OrderBy(x => x.AssignedAtUtc)
            .Select(x => new JobTicketAssignmentDto(x.JobTicketId, x.EmployeeId, x.AssignedAtUtc, x.IsLead))
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
        AddAudit(jobTicketId, nameof(JobTicketEmployee), AuditActionType.Assignment, null, $"{{\"EmployeeId\":\"{request.EmployeeId}\",\"Operation\":\"Add\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);

        return new JobTicketAssignmentDto(assignment.JobTicketId, assignment.EmployeeId, assignment.AssignedAtUtc, assignment.IsLead);
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

        AddAudit(jobTicketId, nameof(JobTicketEmployee), AuditActionType.Assignment, null, $"{{\"EmployeeId\":\"{employeeId}\",\"Operation\":\"Remove\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<JobWorkEntryDto>> ListWorkEntriesAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);

        return await dbContext.JobWorkEntries
            .Where(x => x.JobTicketId == jobTicketId)
            .OrderByDescending(x => x.PerformedAtUtc)
            .Select(x => new JobWorkEntryDto(x.Id, x.JobTicketId, x.EmployeeId, x.EntryType, x.Notes, x.PerformedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<JobWorkEntryDto> AddWorkEntryAsync(Guid jobTicketId, AddJobWorkEntryDto request, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        ValidationHelpers.ValidateRequired(request.Notes, nameof(request.Notes));

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
        AddAudit(jobTicketId, nameof(JobWorkEntry), AuditActionType.Create, null, $"{{\"EntryType\":\"{entry.EntryType}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);

        return new JobWorkEntryDto(entry.Id, entry.JobTicketId, entry.EmployeeId, entry.EntryType, entry.Notes, entry.PerformedAtUtc);
    }

    public async Task<IReadOnlyList<JobTicketPartDto>> ListPartsAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);

        return await dbContext.JobTicketParts
            .Where(x => x.JobTicketId == jobTicketId)
            .OrderByDescending(x => x.AddedAtUtc)
            .Select(MapJobTicketPart)
            .ToListAsync(cancellationToken);
    }

    public async Task<JobTicketPartDto> AddPartAsync(Guid jobTicketId, AddJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
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

        var entry = new JobTicketPart
        {
            JobTicketId = jobTicketId,
            PartId = request.PartId,
            Quantity = request.Quantity,
            UnitCostSnapshot = part.UnitCost,
            SalePriceSnapshot = part.UnitPrice,
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
        }

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Create, null, $"{{\"JobTicketPartId\":\"{entry.Id}\",\"PartId\":\"{request.PartId}\",\"Quantity\":{request.Quantity}}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart.Compile().Invoke(entry);
    }

    public async Task<JobTicketPartDto?> UpdatePartAsync(Guid jobTicketId, Guid jobTicketPartId, UpdateJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        var entry = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.Id == jobTicketPartId, cancellationToken);
        if (entry is null) return null;

        EnsureEditable(entry, request.AllowManagerOverride);
        ValidatePositiveQuantity(request.Quantity);

        var oldValues = $"{{\"Quantity\":{entry.Quantity},\"IsBillable\":{entry.IsBillable.ToString().ToLowerInvariant()},\"ApprovalStatus\":\"{entry.ApprovalStatus}\"}}";
        entry.Quantity = request.Quantity;
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

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Update, oldValues, $"{{\"JobTicketPartId\":\"{entry.Id}\",\"Quantity\":{entry.Quantity},\"IsBillable\":{entry.IsBillable.ToString().ToLowerInvariant()},\"ApprovalStatus\":\"{entry.ApprovalStatus}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart.Compile().Invoke(entry);
    }

    public async Task<JobTicketPartDto?> ApprovePartAsync(Guid jobTicketId, Guid jobTicketPartId, ApproveJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        var entry = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.Id == jobTicketPartId, cancellationToken);
        if (entry is null) return null;

        EnsureEditable(entry, request.AllowManagerOverride);
        entry.ApprovalStatus = JobPartApprovalStatus.Approved;
        entry.ApprovedByUserId = request.ApprovedByUserId;
        entry.ApprovedAtUtc = DateTime.UtcNow;
        entry.RejectionReason = null;
        entry.RejectedByUserId = null;
        entry.RejectedAtUtc = null;

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Approval, null, $"{{\"JobTicketPartId\":\"{entry.Id}\",\"ApprovalStatus\":\"Approved\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart.Compile().Invoke(entry);
    }

    public async Task<JobTicketPartDto?> RejectPartAsync(Guid jobTicketId, Guid jobTicketPartId, RejectJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
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

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Approval, null, $"{{\"JobTicketPartId\":\"{entry.Id}\",\"ApprovalStatus\":\"Rejected\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart.Compile().Invoke(entry);
    }

    public async Task<JobTicketPartDto?> ArchivePartAsync(Guid jobTicketId, Guid jobTicketPartId, ArchiveJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        var entry = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.Id == jobTicketPartId, cancellationToken);
        if (entry is null) return null;

        var part = request.RestoreInventory
            ? await dbContext.Parts.SingleOrDefaultAsync(x => x.Id == entry.PartId, cancellationToken)
            : null;

        entry.IsDeleted = true;
        entry.DeletedAtUtc = DateTime.UtcNow;
        entry.DeletedByUserId = request.ArchivedByUserId;
        entry.Status = PartTransactionStatus.Cancelled;

        if (request.RestoreInventory && part is not null)
        {
            part.QuantityOnHand += entry.Quantity;
        }

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Delete, null, $"{{\"JobTicketPartId\":\"{entry.Id}\",\"RestoreInventory\":{request.RestoreInventory.ToString().ToLowerInvariant()}}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicketPart.Compile().Invoke(entry);
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

    private static void ValidateCreateOrUpdateRequest(Guid customerId, Guid serviceLocationId, Guid billingPartyCustomerId, string title)
    {
        if (customerId == Guid.Empty) throw new ValidationException("CustomerId is required.");
        if (serviceLocationId == Guid.Empty) throw new ValidationException("ServiceLocationId is required.");
        if (billingPartyCustomerId == Guid.Empty) throw new ValidationException("BillingPartyCustomerId is required.");
        ValidationHelpers.ValidateRequired(title, nameof(title));
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

    private void AddAudit(Guid entityId, string entityName, AuditActionType actionType, string? oldValues, string? newValues)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = entityName,
            EntityId = entityId,
            ActionType = actionType,
            UserId = SystemUserId,
            OldValuesJson = oldValues,
            NewValuesJson = newValues
        });
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
        x.ArchiveReason);

    private static readonly System.Linq.Expressions.Expression<Func<JobTicketPart, JobTicketPartDto>> MapJobTicketPart = x => new JobTicketPartDto(
        x.Id,
        x.JobTicketId,
        x.PartId,
        x.Quantity,
        x.UnitCostSnapshot,
        x.SalePriceSnapshot,
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
    DateTime? CompletedAtUtc);

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
    string? ArchiveReason);

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
    DateTime? RequestedAtUtc,
    DateTime? ScheduledStartAtUtc,
    DateTime? DueAtUtc,
    Guid? AssignedManagerEmployeeId,
    string? PurchaseOrderNumber,
    string? BillingContactName,
    string? BillingContactPhone,
    string? BillingContactEmail,
    string? InternalNotes,
    string? CustomerFacingNotes);

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
    DateTime? RequestedAtUtc,
    DateTime? ScheduledStartAtUtc,
    DateTime? DueAtUtc,
    Guid? AssignedManagerEmployeeId,
    string? PurchaseOrderNumber,
    string? BillingContactName,
    string? BillingContactPhone,
    string? BillingContactEmail,
    string? InternalNotes,
    string? CustomerFacingNotes);

public sealed record ChangeJobTicketStatusDto(JobTicketStatus Status);
public sealed record ArchiveJobTicketDto(string ArchiveReason);

public sealed record AddJobTicketAssignmentDto(Guid EmployeeId, bool IsLead = false);
public sealed record JobTicketAssignmentDto(Guid JobTicketId, Guid EmployeeId, DateTime AssignedAtUtc, bool IsLead);

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
    bool AllowManagerOverride = false);

public sealed record UpdateJobTicketPartDto(
    decimal Quantity,
    string? Notes,
    bool IsBillable,
    JobPartApprovalStatus? ApprovalStatus,
    string? RejectionReason,
    Guid? ActorUserId,
    bool AllowManagerOverride = false);

public sealed record ApproveJobTicketPartDto(Guid? ApprovedByUserId, bool AllowManagerOverride = false);
public sealed record RejectJobTicketPartDto(string RejectionReason, Guid? RejectedByUserId, bool AllowManagerOverride = false);
public sealed record ArchiveJobTicketPartDto(Guid? ArchivedByUserId, bool RestoreInventory = true);

public sealed record JobTicketPartDto(
    Guid Id,
    Guid JobTicketId,
    Guid PartId,
    decimal Quantity,
    decimal UnitCostSnapshot,
    decimal SalePriceSnapshot,
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
