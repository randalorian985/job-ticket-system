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

    private async Task EnsureJobTicketExists(Guid jobTicketId, CancellationToken cancellationToken)
    {
        if (!await dbContext.JobTickets.AnyAsync(x => x.Id == jobTicketId, cancellationToken))
        {
            throw new ValidationException("JobTicketId does not reference an active job ticket.");
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
