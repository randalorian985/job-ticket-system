using System.Text.Json;
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
    Task<JobTicketPartDto?> UpdatePartAsync(Guid jobTicketId, Guid jobTicketPartId, UpdateJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> ApprovePartAsync(Guid jobTicketId, Guid jobTicketPartId, ApproveJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> RejectPartAsync(Guid jobTicketId, Guid jobTicketPartId, RejectJobTicketPartDto request, CancellationToken cancellationToken = default);
    Task<JobTicketPartDto?> ArchivePartAsync(Guid jobTicketId, Guid jobTicketPartId, ArchiveJobTicketPartDto request, CancellationToken cancellationToken = default);
}

public sealed class JobTicketServices(ApplicationDbContext dbContext) : IJobTicketsService
{
    private static readonly Guid SystemUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public async Task<IReadOnlyList<JobTicketListItemDto>> ListAsync(JobTicketListQuery query, CancellationToken cancellationToken = default)
    {
        var q = dbContext.JobTickets.AsNoTracking().Where(x => !x.IsDeleted);

        if (query.CustomerId.HasValue) q = q.Where(x => x.CustomerId == query.CustomerId.Value);
        if (query.ServiceLocationId.HasValue) q = q.Where(x => x.ServiceLocationId == query.ServiceLocationId.Value);
        if (query.Status.HasValue) q = q.Where(x => x.Status == query.Status.Value);
        if (query.Priority.HasValue) q = q.Where(x => x.Priority == query.Priority.Value);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            q = q.Where(x => x.TicketNumber.Contains(search) || x.Title.Contains(search));
        }

        var offset = Math.Max(0, query.Offset);
        var limit = Math.Clamp(query.Limit, 1, 200);

        return await q.OrderByDescending(x => x.RequestedAtUtc)
            .Skip(offset)
            .Take(limit)
            .Select(x => new JobTicketListItemDto(x.Id, x.TicketNumber, x.Title, x.Status, x.Priority, x.CustomerId, x.ServiceLocationId, x.RequestedAtUtc, x.ScheduledStartAtUtc, x.DueAtUtc, x.CompletedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public Task<JobTicketDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.JobTickets.AsNoTracking().Where(x => x.Id == id && !x.IsDeleted).Select(MapJobTicket).SingleOrDefaultAsync(cancellationToken);

    public async Task<JobTicketDto> CreateAsync(CreateJobTicketDto request, CancellationToken cancellationToken = default)
    {
        await ValidateReferencesAsync(request.CustomerId, request.ServiceLocationId, request.BillingPartyCustomerId, request.EquipmentId, cancellationToken);

        var ticket = new JobTicket
        {
            TicketNumber = await GenerateTicketNumber(cancellationToken),
            CustomerId = request.CustomerId,
            ServiceLocationId = request.ServiceLocationId,
            BillingPartyCustomerId = request.BillingPartyCustomerId,
            EquipmentId = request.EquipmentId,
            Title = Required(request.Title, "Title"),
            Description = request.Description,
            JobType = request.JobType,
            Priority = request.Priority,
            Status = request.Status,
            RequestedAtUtc = request.RequestedAtUtc ?? DateTime.UtcNow,
            ScheduledStartAtUtc = request.ScheduledStartAtUtc,
            DueAtUtc = request.DueAtUtc,
            AssignedManagerEmployeeId = request.AssignedManagerEmployeeId,
            PurchaseOrderNumber = request.PurchaseOrderNumber,
            BillingContactName = request.BillingContactName,
            BillingContactPhone = request.BillingContactPhone,
            BillingContactEmail = request.BillingContactEmail,
            InternalNotes = request.InternalNotes,
            CustomerFacingNotes = request.CustomerFacingNotes,
            CreatedByUserId = SystemUserId
        };

        dbContext.JobTickets.Add(ticket);
        AddAudit(ticket.Id, nameof(JobTicket), AuditActionType.Create, null, AuditJson(("Title", ticket.Title), ("Status", ticket.Status)));
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetAsync(ticket.Id, cancellationToken) ?? throw new InvalidOperationException("Created job ticket was not found.");
    }

    public async Task<JobTicketDto?> UpdateAsync(Guid id, UpdateJobTicketDto request, CancellationToken cancellationToken = default)
    {
        var ticket = await dbContext.JobTickets.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (ticket is null) return null;

        await ValidateReferencesAsync(request.CustomerId, request.ServiceLocationId, request.BillingPartyCustomerId, request.EquipmentId, cancellationToken);

        var before = Snapshot(ticket);
        ticket.CustomerId = request.CustomerId;
        ticket.ServiceLocationId = request.ServiceLocationId;
        ticket.BillingPartyCustomerId = request.BillingPartyCustomerId;
        ticket.EquipmentId = request.EquipmentId;
        ticket.Title = Required(request.Title, "Title");
        ticket.Description = request.Description;
        ticket.JobType = request.JobType;
        ticket.Priority = request.Priority;
        ticket.Status = request.Status;
        ticket.RequestedAtUtc = request.RequestedAtUtc ?? ticket.RequestedAtUtc;
        ticket.ScheduledStartAtUtc = request.ScheduledStartAtUtc;
        ticket.DueAtUtc = request.DueAtUtc;
        ticket.AssignedManagerEmployeeId = request.AssignedManagerEmployeeId;
        ticket.PurchaseOrderNumber = request.PurchaseOrderNumber;
        ticket.BillingContactName = request.BillingContactName;
        ticket.BillingContactPhone = request.BillingContactPhone;
        ticket.BillingContactEmail = request.BillingContactEmail;
        ticket.InternalNotes = request.InternalNotes;
        ticket.CustomerFacingNotes = request.CustomerFacingNotes;
        ticket.UpdatedAtUtc = DateTime.UtcNow;
        ticket.UpdatedByUserId = SystemUserId;

        AddAudit(ticket.Id, nameof(JobTicket), AuditActionType.Update, before, Snapshot(ticket));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(id, cancellationToken);
    }

    public async Task<JobTicketDto?> ChangeStatusAsync(Guid id, ChangeJobTicketStatusDto request, CancellationToken cancellationToken = default)
    {
        var ticket = await dbContext.JobTickets.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (ticket is null) return null;

        var before = Snapshot(ticket);
        ticket.Status = request.Status;
        ticket.UpdatedAtUtc = DateTime.UtcNow;
        ticket.UpdatedByUserId = SystemUserId;
        if (request.Status == JobTicketStatus.Completed || request.Status == JobTicketStatus.Invoiced)
        {
            ticket.CompletedAtUtc ??= DateTime.UtcNow;
        }

        AddAudit(ticket.Id, nameof(JobTicket), AuditActionType.StatusChange, before, Snapshot(ticket));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(id, cancellationToken);
    }

    public async Task<JobTicketDto?> ArchiveAsync(Guid id, ArchiveJobTicketDto request, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.JobTickets.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (entity is null) return null;

        var archiveReason = Required(request.ArchiveReason, "ArchiveReason");
        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        entity.DeletedByUserId = SystemUserId;
        entity.ArchiveReason = archiveReason;

        AddAudit(entity.Id, nameof(JobTicket), AuditActionType.Delete, null, AuditJson(("ArchiveReason", archiveReason)));
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapJobTicket.Compile().Invoke(entity);
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
        return await dbContext.JobWorkEntries.AsNoTracking()
            .Where(x => x.JobTicketId == jobTicketId && !x.IsDeleted)
            .OrderByDescending(x => x.PerformedAtUtc)
            .Select(x => new JobWorkEntryDto(x.Id, x.JobTicketId, x.EmployeeId, x.EntryType, x.Notes, x.PerformedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<JobWorkEntryDto> AddWorkEntryAsync(Guid jobTicketId, AddJobWorkEntryDto request, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);

        if (request.EmployeeId.HasValue && !await dbContext.Employees.AnyAsync(x => x.Id == request.EmployeeId.Value, cancellationToken))
        {
            throw new ValidationException("EmployeeId does not reference an employee.");
        }

        var entry = new JobWorkEntry
        {
            JobTicketId = jobTicketId,
            EmployeeId = request.EmployeeId,
            EntryType = request.EntryType,
            Notes = Required(request.Notes, "Notes"),
            PerformedAtUtc = request.PerformedAtUtc ?? DateTime.UtcNow,
            CreatedByUserId = SystemUserId
        };

        dbContext.JobWorkEntries.Add(entry);
        AddAudit(jobTicketId, nameof(JobWorkEntry), AuditActionType.Create, null, AuditJson(("EntryType", entry.EntryType)));
        await dbContext.SaveChangesAsync(cancellationToken);
        return new JobWorkEntryDto(entry.Id, entry.JobTicketId, entry.EmployeeId, entry.EntryType, entry.Notes, entry.PerformedAtUtc);
    }

    public async Task<IReadOnlyList<JobTicketPartDto>> ListPartsAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        return await dbContext.JobTicketParts.AsNoTracking()
            .Where(x => x.JobTicketId == jobTicketId && !x.IsDeleted)
            .OrderByDescending(x => x.AddedAtUtc)
            .Select(x => new JobTicketPartDto(
                x.Id,
                x.JobTicketId,
                x.PartId,
                x.EquipmentId,
                x.Quantity,
                x.UnitCostSnapshot,
                x.SalePriceSnapshot,
                x.ComponentCategory,
                x.FailureDescription,
                x.RepairDescription,
                x.TechnicianNotes,
                x.InstalledAtUtc,
                x.WasSuccessful,
                x.RemovedAtUtc,
                x.ReplacedByJobTicketPartId,
                x.CompatibilityNotes,
                x.Notes,
                x.IsBillable,
                x.ApprovalStatus,
                x.AddedAtUtc,
                x.AddedByEmployeeId,
                x.ApprovedByUserId,
                x.ApprovedAtUtc,
                x.RejectedByUserId,
                x.RejectedAtUtc,
                x.RejectionReason))
            .ToListAsync(cancellationToken);
    }

    public async Task<JobTicketPartDto> AddPartAsync(Guid jobTicketId, AddJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);

        await ValidatePartAsync(request.PartId, request.EquipmentId, cancellationToken);
        if (request.AddedByEmployeeId.HasValue)
        {
            await ValidateAddedByEmployeeAssignmentAsync(jobTicketId, request.AddedByEmployeeId.Value, request.AllowManagerOverride, cancellationToken);
        }

        var part = await dbContext.Parts.AsNoTracking().SingleAsync(x => x.Id == request.PartId, cancellationToken);
        var jobPart = new JobTicketPart
        {
            JobTicketId = jobTicketId,
            PartId = request.PartId,
            EquipmentId = request.EquipmentId,
            Quantity = Positive(request.Quantity, "Quantity"),
            UnitCostSnapshot = part.UnitCost,
            SalePriceSnapshot = part.SalePrice,
            ComponentCategory = request.ComponentCategory,
            FailureDescription = request.FailureDescription,
            RepairDescription = request.RepairDescription,
            TechnicianNotes = request.TechnicianNotes,
            InstalledAtUtc = request.InstalledAtUtc,
            WasSuccessful = request.WasSuccessful,
            RemovedAtUtc = request.RemovedAtUtc,
            ReplacedByJobTicketPartId = request.ReplacedByJobTicketPartId,
            CompatibilityNotes = request.CompatibilityNotes,
            Notes = request.Notes,
            IsBillable = request.IsBillable,
            ApprovalStatus = JobPartApprovalStatus.Pending,
            AddedAtUtc = request.AddedAtUtc ?? DateTime.UtcNow,
            AddedByEmployeeId = request.AddedByEmployeeId,
            CreatedByUserId = SystemUserId
        };

        dbContext.JobTicketParts.Add(jobPart);
        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Create, null, AuditJson(("PartId", request.PartId), ("Quantity", request.Quantity)));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetPartOrThrow(jobPart.Id, cancellationToken);
    }

    public async Task<JobTicketPartDto?> UpdatePartAsync(Guid jobTicketId, Guid jobTicketPartId, UpdateJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        var part = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.Id == jobTicketPartId && x.JobTicketId == jobTicketId && !x.IsDeleted, cancellationToken);
        if (part is null) return null;

        await ValidatePartAsync(request.PartId, request.EquipmentId, cancellationToken);
        if (request.AddedByEmployeeId.HasValue)
        {
            await ValidateAddedByEmployeeAssignmentAsync(jobTicketId, request.AddedByEmployeeId.Value, request.AllowManagerOverride, cancellationToken);
        }

        var before = Snapshot(part);
        part.PartId = request.PartId;
        part.EquipmentId = request.EquipmentId;
        part.Quantity = Positive(request.Quantity, "Quantity");
        part.Notes = request.Notes;
        part.IsBillable = request.IsBillable;
        part.AddedByEmployeeId = request.AddedByEmployeeId;
        part.ComponentCategory = request.ComponentCategory;
        part.FailureDescription = request.FailureDescription;
        part.RepairDescription = request.RepairDescription;
        part.TechnicianNotes = request.TechnicianNotes;
        part.InstalledAtUtc = request.InstalledAtUtc;
        part.WasSuccessful = request.WasSuccessful;
        part.RemovedAtUtc = request.RemovedAtUtc;
        part.ReplacedByJobTicketPartId = request.ReplacedByJobTicketPartId;
        part.CompatibilityNotes = request.CompatibilityNotes;
        part.UpdatedAtUtc = DateTime.UtcNow;
        part.UpdatedByUserId = SystemUserId;

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Update, before, Snapshot(part));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetPartOrThrow(part.Id, cancellationToken);
    }

    public async Task<JobTicketPartDto?> ApprovePartAsync(Guid jobTicketId, Guid jobTicketPartId, ApproveJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        var part = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.Id == jobTicketPartId && x.JobTicketId == jobTicketId && !x.IsDeleted, cancellationToken);
        if (part is null) return null;
        if (part.ApprovalStatus != JobPartApprovalStatus.Pending)
        {
            throw new ValidationException("Only pending job parts can be approved.");
        }

        part.ApprovalStatus = JobPartApprovalStatus.Approved;
        part.ApprovedByUserId = request.ApprovedByUserId;
        part.ApprovedAtUtc = DateTime.UtcNow;
        part.RejectedByUserId = null;
        part.RejectedAtUtc = null;
        part.RejectionReason = null;
        part.UpdatedAtUtc = DateTime.UtcNow;
        part.UpdatedByUserId = request.ApprovedByUserId;

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Approval, null, AuditJson(("JobTicketPartId", jobTicketPartId), ("Status", part.ApprovalStatus)));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetPartOrThrow(part.Id, cancellationToken);
    }

    public async Task<JobTicketPartDto?> RejectPartAsync(Guid jobTicketId, Guid jobTicketPartId, RejectJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        var part = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.Id == jobTicketPartId && x.JobTicketId == jobTicketId && !x.IsDeleted, cancellationToken);
        if (part is null) return null;
        if (part.ApprovalStatus != JobPartApprovalStatus.Pending)
        {
            throw new ValidationException("Only pending job parts can be rejected.");
        }

        part.ApprovalStatus = JobPartApprovalStatus.Rejected;
        part.RejectedByUserId = request.RejectedByUserId;
        part.RejectedAtUtc = DateTime.UtcNow;
        part.RejectionReason = Required(request.RejectionReason, "RejectionReason");
        part.UpdatedAtUtc = DateTime.UtcNow;
        part.UpdatedByUserId = request.RejectedByUserId;

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Approval, null, AuditJson(("JobTicketPartId", jobTicketPartId), ("Status", part.ApprovalStatus)));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetPartOrThrow(part.Id, cancellationToken);
    }

    public async Task<JobTicketPartDto?> ArchivePartAsync(Guid jobTicketId, Guid jobTicketPartId, ArchiveJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        await EnsureJobTicketExists(jobTicketId, cancellationToken);
        var part = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.Id == jobTicketPartId && x.JobTicketId == jobTicketId && !x.IsDeleted, cancellationToken);
        if (part is null) return null;

        part.IsDeleted = true;
        part.DeletedAtUtc = DateTime.UtcNow;
        part.DeletedByUserId = request.ArchivedByUserId;
        part.UpdatedAtUtc = DateTime.UtcNow;
        part.UpdatedByUserId = request.ArchivedByUserId;

        AddAudit(jobTicketId, nameof(JobTicketPart), AuditActionType.Delete, null, AuditJson(("JobTicketPartId", jobTicketPartId), ("Operation", "Archive")));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetPartOrThrow(part.Id, cancellationToken);
    }

    private async Task<JobTicketPartDto> GetPartOrThrow(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.JobTicketParts.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new JobTicketPartDto(
                x.Id,
                x.JobTicketId,
                x.PartId,
                x.EquipmentId,
                x.Quantity,
                x.UnitCostSnapshot,
                x.SalePriceSnapshot,
                x.ComponentCategory,
                x.FailureDescription,
                x.RepairDescription,
                x.TechnicianNotes,
                x.InstalledAtUtc,
                x.WasSuccessful,
                x.RemovedAtUtc,
                x.ReplacedByJobTicketPartId,
                x.CompatibilityNotes,
                x.Notes,
                x.IsBillable,
                x.ApprovalStatus,
                x.AddedAtUtc,
                x.AddedByEmployeeId,
                x.ApprovedByUserId,
                x.ApprovedAtUtc,
                x.RejectedByUserId,
                x.RejectedAtUtc,
                x.RejectionReason))
            .SingleAsync(cancellationToken);
    }

    private async Task ValidateReferencesAsync(Guid customerId, Guid serviceLocationId, Guid billingPartyCustomerId, Guid? equipmentId, CancellationToken cancellationToken)
    {
        if (!await dbContext.Customers.AnyAsync(x => x.Id == customerId && !x.IsDeleted, cancellationToken))
        {
            throw new ValidationException("CustomerId does not reference an active customer.");
        }

        if (!await dbContext.ServiceLocations.AnyAsync(x => x.Id == serviceLocationId && !x.IsDeleted, cancellationToken))
        {
            throw new ValidationException("ServiceLocationId does not reference an active service location.");
        }

        if (!await dbContext.Customers.AnyAsync(x => x.Id == billingPartyCustomerId && !x.IsDeleted, cancellationToken))
        {
            throw new ValidationException("BillingPartyCustomerId does not reference an active customer.");
        }

        if (equipmentId.HasValue && !await dbContext.Equipment.AnyAsync(x => x.Id == equipmentId.Value && x.ServiceLocationId == serviceLocationId && !x.IsDeleted, cancellationToken))
        {
            throw new ValidationException("EquipmentId must reference active equipment at the selected service location.");
        }
    }

    private async Task ValidatePartAsync(Guid partId, Guid? equipmentId, CancellationToken cancellationToken)
    {
        if (!await dbContext.Parts.AnyAsync(x => x.Id == partId && !x.IsDeleted, cancellationToken))
        {
            throw new ValidationException("PartId does not reference an active part.");
        }

        if (equipmentId.HasValue && !await dbContext.Equipment.AnyAsync(x => x.Id == equipmentId.Value && !x.IsDeleted, cancellationToken))
        {
            throw new ValidationException("EquipmentId does not reference active equipment.");
        }
    }

    private async Task ValidateAddedByEmployeeAssignmentAsync(Guid jobTicketId, Guid employeeId, bool allowManagerOverride, CancellationToken cancellationToken)
    {
        if (!await dbContext.Employees.AnyAsync(x => x.Id == employeeId, cancellationToken))
        {
            throw new ValidationException("AddedByEmployeeId does not reference an employee.");
        }

        var isAssigned = await dbContext.JobTicketEmployees.AnyAsync(
            x => x.JobTicketId == jobTicketId && x.EmployeeId == employeeId && !x.IsDeleted,
            cancellationToken);

        if (!isAssigned && !allowManagerOverride)
        {
            throw new ValidationException("AddedByEmployeeId must be assigned to this job ticket unless manager override is enabled.");
        }
    }

    private async Task EnsureJobTicketExists(Guid jobTicketId, CancellationToken cancellationToken)
    {
        var exists = await dbContext.JobTickets.AnyAsync(x => x.Id == jobTicketId && !x.IsDeleted, cancellationToken);
        if (!exists)
        {
            throw new ValidationException("Job ticket was not found.");
        }
    }

    private async Task<string> GenerateTicketNumber(CancellationToken cancellationToken)
    {
        var prefix = $"JT-{DateTime.UtcNow.Year}-";
        var count = await dbContext.JobTickets.CountAsync(x => x.TicketNumber.StartsWith(prefix), cancellationToken);
        return $"{prefix}{count + 1:00000}";
    }

    private static string Required(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ValidationException($"{field} is required.");
        }

        return value.Trim();
    }

    private static decimal Positive(decimal value, string field)
    {
        if (value <= 0) throw new ValidationException($"{field} must be greater than zero.");
        return value;
    }

    private void AddAudit(Guid entityId, string entityName, AuditActionType action, string? before, string? after)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            EntityId = entityId,
            EntityName = entityName,
            Action = action,
            BeforeJson = before,
            AfterJson = after,
            UserId = SystemUserId
        });
    }

    private static string Snapshot(object value) => JsonSerializer.Serialize(value);

    private static string AuditJson(params (string Key, object? Value)[] entries)
        => JsonSerializer.Serialize(entries.ToDictionary(x => x.Key, x => x.Value));

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
}

public sealed record JobTicketListQuery(
    Guid? CustomerId = null,
    Guid? ServiceLocationId = null,
    JobTicketStatus? Status = null,
    JobTicketPriority? Priority = null,
    string? Search = null,
    int Offset = 0,
    int Limit = 50);

public sealed record JobTicketListItemDto(Guid Id, string TicketNumber, string Title, JobTicketStatus Status, JobTicketPriority Priority, Guid CustomerId, Guid ServiceLocationId, DateTime? RequestedAtUtc, DateTime? ScheduledStartAtUtc, DateTime? DueAtUtc, DateTime? CompletedAtUtc);

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
    Guid PartId,
    decimal Quantity,
    string? Notes,
    bool IsBillable,
    Guid? AddedByEmployeeId,
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

public sealed record JobTicketPartDto(
    Guid Id,
    Guid JobTicketId,
    Guid PartId,
    Guid? EquipmentId,
    decimal Quantity,
    decimal? UnitCostSnapshot,
    decimal? SalePriceSnapshot,
    string? ComponentCategory,
    string? FailureDescription,
    string? RepairDescription,
    string? TechnicianNotes,
    DateTime? InstalledAtUtc,
    bool? WasSuccessful,
    DateTime? RemovedAtUtc,
    Guid? ReplacedByJobTicketPartId,
    string? CompatibilityNotes,
    string? Notes,
    bool IsBillable,
    JobPartApprovalStatus ApprovalStatus,
    DateTime AddedAtUtc,
    Guid? AddedByEmployeeId,
    Guid? ApprovedByUserId,
    DateTime? ApprovedAtUtc,
    Guid? RejectedByUserId,
    DateTime? RejectedAtUtc,
    string? RejectionReason);

public sealed record ApproveJobTicketPartDto(Guid ApprovedByUserId);
public sealed record RejectJobTicketPartDto(Guid RejectedByUserId, string RejectionReason);
public sealed record ArchiveJobTicketPartDto(Guid ArchivedByUserId);

public sealed class ValidationException(string message) : Exception(message);
