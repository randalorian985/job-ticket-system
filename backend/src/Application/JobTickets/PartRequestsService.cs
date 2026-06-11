using System.Text;
using System.Text.Json.Serialization;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.JobTickets;

public interface IPartRequestsService
{
    Task<PartRequestDto> CreateForJobTicketAsync(Guid jobTicketId, CreatePartRequestDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartRequestDto>> ListQueueAsync(PartRequestQueueQuery? query = null, CancellationToken cancellationToken = default);
    Task<PartRequestDto?> GetAsync(Guid partRequestId, CancellationToken cancellationToken = default);
    Task<PartRequestDto?> UpdateBackOfficeAsync(Guid partRequestId, UpdatePartRequestDto request, CancellationToken cancellationToken = default);
}

public sealed class PartRequestsService(ApplicationDbContext dbContext, ICurrentUserContext currentUserContext) : IPartRequestsService
{
    private static readonly Guid SystemUserId = Guid.Empty;

    public async Task<PartRequestDto> CreateForJobTicketAsync(Guid jobTicketId, CreatePartRequestDto request, CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserCanAccessJobTicketAsync(jobTicketId, cancellationToken);
        await EnsureEmployeeClockedIntoJobTicketAsync(jobTicketId, cancellationToken);

        var jobTicket = await dbContext.JobTickets.SingleOrDefaultAsync(x => x.Id == jobTicketId, cancellationToken);
        if (jobTicket is null)
        {
            throw new ValidationException("JobTicketId does not reference an active job ticket.");
        }

        ValidatePositiveQuantity(request.Quantity);

        Part? selectedPart = null;
        if (request.PartId.HasValue)
        {
            selectedPart = await dbContext.Parts.SingleOrDefaultAsync(x => x.Id == request.PartId.Value, cancellationToken);
            if (selectedPart is null)
            {
                throw new ValidationException("PartId does not reference an active part.");
            }
        }

        var partDescription = Normalize(request.PartDescription) ?? selectedPart?.Name;
        if (partDescription is null)
        {
            throw new ValidationException("PartDescription is required when no catalog part is selected.");
        }

        var technicianNotes = Normalize(request.Notes);
        var urgency = Normalize(request.Urgency);
        var addedAtUtc = DateTime.UtcNow;
        var officeNotes = request.NeedsOrdered ? BuildOfficeNotes(technicianNotes, urgency, request.NeededByUtc) : null;

        var entry = new JobTicketPart
        {
            JobTicketId = jobTicketId,
            PartId = selectedPart?.Id,
            PartNumberSnapshot = selectedPart?.PartNumber ?? partDescription,
            PartNameSnapshot = selectedPart?.Name ?? partDescription,
            IsUnlistedPart = selectedPart is null,
            OfficeOrderRequested = request.NeedsOrdered,
            OfficeOrderRequestedAtUtc = request.NeedsOrdered ? addedAtUtc : null,
            OfficeOrderNotes = officeNotes,
            Quantity = request.Quantity,
            UnitCostSnapshot = 0m,
            SalePriceSnapshot = 0m,
            TechnicianNotes = technicianNotes,
            Notes = technicianNotes,
            IsBillable = false,
            ApprovalStatus = JobPartApprovalStatus.Pending,
            AddedAtUtc = addedAtUtc,
            AddedByEmployeeId = currentUserContext.EmployeeId == Guid.Empty ? null : currentUserContext.EmployeeId,
            AddedByUserId = currentUserContext.EmployeeId == Guid.Empty ? null : currentUserContext.EmployeeId,
            Status = PartTransactionStatus.Used
        };

        dbContext.JobTicketParts.Add(entry);
        dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(JobTicketPart),
            EntityId = entry.Id,
            ActionType = AuditActionType.Create,
            UserId = currentUserContext.UserId == Guid.Empty ? SystemUserId : currentUserContext.UserId,
            NewValuesJson = $"{{\"PartRequest\":true,\"JobTicketId\":\"{jobTicketId}\",\"PartId\":\"{selectedPart?.Id}\",\"NeedsOrdered\":{request.NeedsOrdered.ToString().ToLowerInvariant()}}}"
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return await MapPartRequestQuery(queueOnly: false).SingleAsync(x => x.Id == entry.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<PartRequestDto>> ListQueueAsync(PartRequestQueueQuery? query = null, CancellationToken cancellationToken = default)
    {
        EnsureBackOffice();

        var requests = MapPartRequestQuery(queueOnly: true);
        if (query?.Status is not null)
        {
            requests = requests.Where(x => x.Status == query.Status.Value);
        }

        var search = Normalize(query?.Search);
        if (search is not null)
        {
            requests = requests.Where(x =>
                x.JobTicketNumber.Contains(search) ||
                x.JobTicketTitle.Contains(search) ||
                x.PartNumber.Contains(search) ||
                x.PartName.Contains(search));
        }

        return await requests
            .ToListAsync(cancellationToken);
    }

    public async Task<PartRequestDto?> GetAsync(Guid partRequestId, CancellationToken cancellationToken = default)
    {
        EnsureBackOffice();
        return await MapPartRequestQuery(queueOnly: true).SingleOrDefaultAsync(x => x.Id == partRequestId, cancellationToken);
    }

    public async Task<PartRequestDto?> UpdateBackOfficeAsync(Guid partRequestId, UpdatePartRequestDto request, CancellationToken cancellationToken = default)
    {
        EnsureBackOffice();

        var entry = await dbContext.JobTicketParts.SingleOrDefaultAsync(x => x.Id == partRequestId && x.OfficeOrderRequested, cancellationToken);
        if (entry is null)
        {
            return null;
        }

        ValidatePositiveQuantity(request.Quantity);
        if (!Enum.IsDefined(request.Status))
        {
            throw new ValidationException("Status is not a valid part request status.");
        }

        if (request.UnitCostSnapshot < 0)
        {
            throw new ValidationException("UnitCostSnapshot cannot be negative.");
        }

        if (request.SalePriceSnapshot < 0)
        {
            throw new ValidationException("SalePriceSnapshot cannot be negative.");
        }

        Part? catalogPart = null;
        if (request.PartId.HasValue)
        {
            catalogPart = await dbContext.Parts.SingleOrDefaultAsync(x => x.Id == request.PartId.Value, cancellationToken);
            if (catalogPart is null)
            {
                throw new ValidationException("PartId does not reference an active part.");
            }
        }

        var description = NormalizeRequired(request.PartDescription, nameof(request.PartDescription));
        entry.PartId = catalogPart?.Id;
        entry.PartNumberSnapshot = catalogPart?.PartNumber ?? description;
        entry.PartNameSnapshot = catalogPart?.Name ?? description;
        entry.IsUnlistedPart = catalogPart is null;
        entry.Quantity = request.Quantity;
        entry.UnitCostSnapshot = request.UnitCostSnapshot;
        entry.SalePriceSnapshot = request.SalePriceSnapshot;
        entry.IsBillable = request.IsBillable;
        entry.ApprovalStatus = request.Status;
        entry.CompatibilityNotes = Normalize(request.InternalStatusNotes);

        if (request.Status == JobPartApprovalStatus.Approved)
        {
            entry.ApprovedAtUtc = DateTime.UtcNow;
            entry.ApprovedByUserId = currentUserContext.UserId;
            entry.RejectedAtUtc = null;
            entry.RejectedByUserId = null;
            entry.RejectionReason = null;
        }
        else if (request.Status == JobPartApprovalStatus.Rejected)
        {
            entry.RejectedAtUtc = DateTime.UtcNow;
            entry.RejectedByUserId = currentUserContext.UserId;
            entry.RejectionReason = Normalize(request.InternalStatusNotes) ?? "Rejected by back office.";
            entry.ApprovedAtUtc = null;
            entry.ApprovedByUserId = null;
        }
        else
        {
            entry.ApprovedAtUtc = null;
            entry.ApprovedByUserId = null;
            entry.RejectedAtUtc = null;
            entry.RejectedByUserId = null;
            entry.RejectionReason = null;
        }

        dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(JobTicketPart),
            EntityId = entry.Id,
            ActionType = AuditActionType.Update,
            UserId = currentUserContext.UserId == Guid.Empty ? SystemUserId : currentUserContext.UserId,
            NewValuesJson = $"{{\"PartRequestStatus\":\"{request.Status}\",\"IsBillable\":{request.IsBillable.ToString().ToLowerInvariant()}}}"
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return await MapPartRequestQuery(queueOnly: true).SingleAsync(x => x.Id == entry.Id, cancellationToken);
    }

    private IQueryable<PartRequestDto> MapPartRequestQuery(bool queueOnly)
    {
        var parts = dbContext.JobTicketParts.AsQueryable();
        if (queueOnly)
        {
            parts = parts.Where(x => x.OfficeOrderRequested);
        }

        return parts
            .OrderByDescending(x => x.AddedAtUtc)
            .Select(x => new PartRequestDto(
            x.Id,
            x.JobTicketId,
            x.JobTicket.TicketNumber,
            x.JobTicket.Title,
            x.PartId,
            x.PartNumberSnapshot,
            x.PartNameSnapshot,
            x.Quantity,
            x.Notes,
            x.TechnicianNotes,
            x.OfficeOrderNotes,
            x.CompatibilityNotes,
            x.UnitCostSnapshot,
            x.SalePriceSnapshot,
            x.IsBillable,
            x.OfficeOrderRequested,
            x.ApprovalStatus,
            x.AddedAtUtc,
            x.AddedByEmployeeId,
            x.ApprovedAtUtc,
            x.RejectedAtUtc,
            x.RejectionReason));
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

    private void EnsureBackOffice()
    {
        if (!currentUserContext.IsManager)
        {
            throw new ValidationException("This operation requires manager or admin access.");
        }
    }

    private static string NormalizeRequired(string value, string fieldName)
    {
        var normalized = Normalize(value);
        if (normalized is null)
        {
            throw new ValidationException($"{fieldName} is required.");
        }

        return normalized;
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void ValidatePositiveQuantity(decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ValidationException("Quantity must be greater than zero.");
        }
    }

    private static string? BuildOfficeNotes(string? notes, string? urgency, DateTime? neededByUtc)
    {
        var builder = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(urgency))
        {
            builder.Append("Urgency: ").Append(urgency).AppendLine();
        }

        if (neededByUtc.HasValue)
        {
            builder.Append("Needed by: ").Append(neededByUtc.Value.ToUniversalTime().ToString("O")).AppendLine();
        }

        if (!string.IsNullOrWhiteSpace(notes))
        {
            builder.Append("Technician notes: ").Append(notes);
        }

        var value = builder.ToString().Trim();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }
}

public sealed record CreatePartRequestDto(
    string PartDescription,
    decimal Quantity,
    string? Notes,
    string? Urgency = null,
    DateTime? NeededByUtc = null,
    Guid? PartId = null,
    bool NeedsOrdered = true);

public sealed record PartRequestQueueQuery(
    JobPartApprovalStatus? Status = null,
    string? Search = null);

public sealed record UpdatePartRequestDto(
    string PartDescription,
    decimal Quantity,
    JobPartApprovalStatus Status,
    string? InternalStatusNotes,
    decimal UnitCostSnapshot,
    decimal SalePriceSnapshot,
    bool IsBillable,
    Guid? PartId = null);

public sealed record PartRequestDto(
    Guid Id,
    Guid JobTicketId,
    string JobTicketNumber,
    string JobTicketTitle,
    Guid? PartId,
    string PartNumber,
    string PartName,
    decimal Quantity,
    string? Notes,
    string? TechnicianNotes,
    string? RequestNotes,
    string? InternalStatusNotes,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)] decimal UnitCostSnapshot,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)] decimal SalePriceSnapshot,
    bool IsBillable,
    bool NeedsOrdered,
    JobPartApprovalStatus Status,
    DateTime RequestedAtUtc,
    Guid? RequestedByEmployeeId,
    DateTime? ApprovedAtUtc,
    DateTime? RejectedAtUtc,
    string? RejectionReason);
