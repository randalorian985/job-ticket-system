using System.Text.Json;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.TimeEntries;

public interface ITimeEntriesService
{
    Task<TimeEntryDto> ClockInAsync(ClockInRequestDto request, CancellationToken cancellationToken = default);
    Task<TimeEntryDto> ClockOutAsync(ClockOutRequestDto request, CancellationToken cancellationToken = default);
    Task<TimeEntryDto?> GetOpenEntryAsync(Guid employeeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TimeEntryDto>> ListForJobTicketAsync(Guid jobTicketId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TimeApprovalQueueItemDto>> ListForReviewAsync(TimeEntryReviewFilters filters, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TimeEntryDto>> BulkApproveAsync(BulkApproveTimeEntriesRequestDto request, Guid approvedByUserId, CancellationToken cancellationToken = default);
    Task<TimeEntryDto?> EditAndApproveAsync(Guid id, AdjustTimeEntryRequestDto request, Guid adjustedByUserId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TimeEntryDto>> ListForEmployeeAsync(Guid employeeId, CancellationToken cancellationToken = default);
    Task<TimeEntryDto?> ApproveAsync(Guid id, Guid approvedByUserId, CancellationToken cancellationToken = default);
    Task<TimeEntryDto?> RejectAsync(Guid id, RejectTimeEntryRequestDto request, Guid rejectedByUserId, CancellationToken cancellationToken = default);
    Task<TimeEntryDto?> AdjustAsync(Guid id, AdjustTimeEntryRequestDto request, Guid adjustedByUserId, bool managerOverride, CancellationToken cancellationToken = default);
    Task<bool> ArchiveAsync(Guid id, ArchiveTimeEntryRequestDto request, Guid archivedByUserId, CancellationToken cancellationToken = default);
}

public sealed class TimeEntriesService(ApplicationDbContext dbContext, ICurrentUserContext currentUserContext) : ITimeEntriesService
{
    public async Task<TimeEntryDto> ClockInAsync(ClockInRequestDto request, CancellationToken cancellationToken = default)
    {
        ValidateClockIn(request);
        EnsureEmployeeRequestMatchesCurrentUser(request.EmployeeId);
        var employee = await EnsureEmployeeExistsAsync(request.EmployeeId, cancellationToken);
        await EnsureJobTicketExistsAsync(request.JobTicketId, cancellationToken);
        await EnsureEmployeeAssignedAsync(request.JobTicketId, request.EmployeeId, cancellationToken);

        var hasOpenEntry = await dbContext.TimeEntries
            .AnyAsync(x => x.EmployeeId == request.EmployeeId && x.EndedAtUtc == null, cancellationToken);

        if (hasOpenEntry)
        {
            throw new ValidationException("Employee already has an open time entry.");
        }

        var entry = new TimeEntry
        {
            JobTicketId = request.JobTicketId,
            EmployeeId = request.EmployeeId,
            StartedAtUtc = DateTime.UtcNow,
            HourlyRate = 0,
            CostRateSnapshot = employee.CostRate,
            BillRateSnapshot = employee.BillRate ?? employee.LaborRate,
            ClockInLatitude = request.ClockInLatitude!.Value,
            ClockInLongitude = request.ClockInLongitude!.Value,
            ClockInAccuracy = request.ClockInAccuracy,
            ClockInDeviceMetadata = request.DeviceMetadata.Trim(),
            ClockInNote = ValidationHelpers.NullIfWhitespace(request.Note)
        };

        dbContext.TimeEntries.Add(entry);
        AddAudit(entry.Id, nameof(TimeEntry), AuditActionType.Create, null, $"{{\"Action\":\"ClockIn\",\"EmployeeId\":\"{entry.EmployeeId}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);

        return Map(entry);
    }

    public async Task<TimeEntryDto> ClockOutAsync(ClockOutRequestDto request, CancellationToken cancellationToken = default)
    {
        ValidateClockOut(request);
        EnsureEmployeeRequestMatchesCurrentUser(request.EmployeeId);

        var entry = await dbContext.TimeEntries
            .SingleOrDefaultAsync(x => x.Id == request.TimeEntryId, cancellationToken)
            ?? throw new ValidationException("TimeEntryId does not reference an active time entry.");

        if (entry.EmployeeId != request.EmployeeId)
        {
            throw new ValidationException("Employee cannot clock out another employee's time entry.");
        }

        if (entry.EndedAtUtc.HasValue)
        {
            throw new ValidationException("Time entry is already clocked out.");
        }

        entry.EndedAtUtc = DateTime.UtcNow;
        entry.ClockOutLatitude = request.ClockOutLatitude!.Value;
        entry.ClockOutLongitude = request.ClockOutLongitude!.Value;
        entry.ClockOutAccuracy = request.ClockOutAccuracy;
        entry.WorkSummary = request.WorkSummary.Trim();
        entry.ClockOutNote = ValidationHelpers.NullIfWhitespace(request.Note);

        var totalMinutes = Math.Max(0, (int)Math.Round((entry.EndedAtUtc.Value - entry.StartedAtUtc).TotalMinutes, MidpointRounding.AwayFromZero));
        entry.TotalMinutes = totalMinutes;

        var totalHours = decimal.Round(totalMinutes / 60m, 4, MidpointRounding.AwayFromZero);
        entry.LaborHours = totalHours;
        entry.BillableHours = totalHours;

        dbContext.JobWorkEntries.Add(new JobWorkEntry
        {
            JobTicketId = entry.JobTicketId,
            EmployeeId = entry.EmployeeId,
            EntryType = WorkEntryType.Note,
            Notes = entry.WorkSummary,
            PerformedAtUtc = entry.EndedAtUtc.Value
        });

        AddAudit(entry.Id, nameof(TimeEntry), AuditActionType.Update, null, $"{{\"Action\":\"ClockOut\",\"TotalMinutes\":{totalMinutes}}}");
        await dbContext.SaveChangesAsync(cancellationToken);

        return Map(entry);
    }

    public Task<TimeEntryDto?> GetOpenEntryAsync(Guid employeeId, CancellationToken cancellationToken = default)
    {
        EnsureEmployeeRequestMatchesCurrentUser(employeeId);
        if (employeeId == Guid.Empty) throw new ValidationException("EmployeeId is required.");

        return dbContext.TimeEntries
            .Where(x => x.EmployeeId == employeeId && x.EndedAtUtc == null)
            .OrderByDescending(x => x.StartedAtUtc)
            .Select(MapProjection)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TimeEntryDto>> ListForJobTicketAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        if (jobTicketId == Guid.Empty) throw new ValidationException("JobTicketId is required.");
        await EnsureCurrentUserCanAccessJobTicketAsync(jobTicketId, cancellationToken);

        return await dbContext.TimeEntries
            .Where(x => x.JobTicketId == jobTicketId)
            .OrderByDescending(x => x.StartedAtUtc)
            .Select(MapProjection)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TimeApprovalQueueItemDto>> ListForReviewAsync(TimeEntryReviewFilters filters, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();

        if (filters.DateFromUtc.HasValue && filters.DateToUtc.HasValue && filters.DateFromUtc > filters.DateToUtc)
        {
            throw new ValidationException("DateFromUtc must be before or equal to DateToUtc.");
        }

        var query = dbContext.TimeEntries
            .Where(x => !filters.JobTicketId.HasValue || x.JobTicketId == filters.JobTicketId.Value)
            .Where(x => !filters.EmployeeId.HasValue || x.EmployeeId == filters.EmployeeId.Value)
            .Where(x => !filters.ApprovalStatus.HasValue || x.ApprovalStatus == filters.ApprovalStatus.Value)
            .Where(x => !filters.DateFromUtc.HasValue || x.StartedAtUtc >= filters.DateFromUtc.Value)
            .Where(x => !filters.DateToUtc.HasValue || x.StartedAtUtc <= filters.DateToUtc.Value);

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var search = filters.Search.Trim();
            query = query.Where(x =>
                x.JobTicketId.ToString().Contains(search) ||
                x.JobTicket.TicketNumber.Contains(search) ||
                x.JobTicket.Title.Contains(search) ||
                (x.JobTicket.Description != null && x.JobTicket.Description.Contains(search)) ||
                (x.JobTicket.JobType != null && x.JobTicket.JobType.Contains(search)) ||
                x.JobTicket.Customer.Name.Contains(search) ||
                x.JobTicket.ServiceLocation.CompanyName.Contains(search) ||
                x.JobTicket.ServiceLocation.LocationName.Contains(search) ||
                x.JobTicket.ServiceLocation.AddressLine1.Contains(search) ||
                x.JobTicket.ServiceLocation.City.Contains(search) ||
                x.JobTicket.ServiceLocation.State.Contains(search));
        }

        return await query
            .OrderByDescending(x => x.StartedAtUtc)
            .Select(ReviewMapProjection)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TimeEntryDto>> BulkApproveAsync(BulkApproveTimeEntriesRequestDto request, Guid approvedByUserId, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        EnsureActorId(approvedByUserId, "ApprovedByUserId");
        if (request.TimeEntryIds is null || request.TimeEntryIds.Count == 0) throw new ValidationException("At least one time entry is required.");

        var ids = request.TimeEntryIds.Distinct().ToArray();
        var entries = await dbContext.TimeEntries
            .Where(x => ids.Contains(x.Id))
            .ToListAsync(cancellationToken);

        if (entries.Count != ids.Length) throw new ValidationException("One or more time entries were not found.");

        foreach (var entry in entries)
        {
            EnsureEligibleForApproval(entry);
        }

        var approvedAtUtc = DateTime.UtcNow;
        foreach (var entry in entries)
        {
            ApplyApproval(entry, approvedByUserId, approvedAtUtc);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return entries.Select(Map).ToList();
    }

    public async Task<TimeEntryDto?> EditAndApproveAsync(Guid id, AdjustTimeEntryRequestDto request, Guid adjustedByUserId, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        ValidateAdjustmentRequest(request, adjustedByUserId);

        var entry = await LoadTimeEntryForAdjustmentAsync(id, cancellationToken);
        if (entry is null) return null;

        EnsureEligibleForApproval(entry);
        ApplyAdjustment(entry, request, adjustedByUserId, managerOverride: true);
        ApplyApproval(entry, adjustedByUserId, DateTime.UtcNow);

        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entry);
    }

    public async Task<IReadOnlyList<TimeEntryDto>> ListForEmployeeAsync(Guid employeeId, CancellationToken cancellationToken = default)
    {
        EnsureEmployeeRequestMatchesCurrentUser(employeeId);
        if (employeeId == Guid.Empty) throw new ValidationException("EmployeeId is required.");

        return await dbContext.TimeEntries
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.StartedAtUtc)
            .Select(MapProjection)
            .ToListAsync(cancellationToken);
    }

    public async Task<TimeEntryDto?> ApproveAsync(Guid id, Guid approvedByUserId, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        EnsureActorId(approvedByUserId, "ApprovedByUserId");

        var entry = await dbContext.TimeEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entry is null) return null;

        EnsureEligibleForApproval(entry);
        ApplyApproval(entry, approvedByUserId, DateTime.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Map(entry);
    }

    public async Task<TimeEntryDto?> RejectAsync(Guid id, RejectTimeEntryRequestDto request, Guid rejectedByUserId, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        ValidationHelpers.ValidateRequired(request.Reason, nameof(request.Reason));
        EnsureActorId(rejectedByUserId, "RejectedByUserId");

        var entry = await dbContext.TimeEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entry is null) return null;

        entry.ApprovalStatus = TimeEntryApprovalStatus.Rejected;
        entry.RejectionReason = request.Reason.Trim();
        entry.ApprovedByUserId = null;
        entry.ApprovedAtUtc = null;

        AddAudit(entry.Id, nameof(TimeEntry), AuditActionType.Update, null, $"{{\"Action\":\"Reject\",\"RejectedByUserId\":\"{rejectedByUserId}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);

        return Map(entry);
    }

    public async Task<TimeEntryDto?> AdjustAsync(Guid id, AdjustTimeEntryRequestDto request, Guid adjustedByUserId, bool managerOverride, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        ValidateAdjustmentRequest(request, adjustedByUserId);

        var entry = await LoadTimeEntryForAdjustmentAsync(id, cancellationToken);
        if (entry is null) return null;

        ApplyAdjustment(entry, request, adjustedByUserId, managerOverride);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Map(entry);
    }

    public async Task<bool> ArchiveAsync(Guid id, ArchiveTimeEntryRequestDto request, Guid archivedByUserId, CancellationToken cancellationToken = default)
    {
        EnsureManagerOrAdmin();
        ValidationHelpers.ValidateRequired(request.Reason, nameof(request.Reason));
        EnsureActorId(archivedByUserId, "ArchivedByUserId");

        var entry = await dbContext.TimeEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entry is null) return false;

        entry.IsDeleted = true;
        entry.DeletedAtUtc = DateTime.UtcNow;
        entry.DeletedByUserId = archivedByUserId;

        AddAudit(entry.Id, nameof(TimeEntry), AuditActionType.Delete, null, AuditJson(
            ("Action", "Archive"),
            ("ArchivedByUserId", archivedByUserId),
            ("Reason", request.Reason.Trim())));
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private Task<TimeEntry?> LoadTimeEntryForAdjustmentAsync(Guid id, CancellationToken cancellationToken)
        => dbContext.TimeEntries
            .Include(x => x.JobTicket)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    private void ApplyAdjustment(TimeEntry entry, AdjustTimeEntryRequestDto request, Guid adjustedByUserId, bool managerOverride)
    {
        if (!managerOverride)
        {
            if (entry.ApprovalStatus == TimeEntryApprovalStatus.Approved)
            {
                throw new ValidationException("Approved time entries cannot be adjusted without manager override.");
            }

            if (entry.JobTicket.Status == JobTicketStatus.Invoiced)
            {
                throw new ValidationException("Invoiced time entries cannot be adjusted without manager override.");
            }
        }

        var originalStarted = entry.StartedAtUtc;
        var originalEnded = entry.EndedAtUtc;
        var originalLabor = entry.LaborHours;
        var originalBillable = entry.BillableHours;
        var originalHourlyRate = entry.HourlyRate;
        var originalNotes = entry.Notes;

        if (request.StartedAtUtc.HasValue) entry.StartedAtUtc = request.StartedAtUtc.Value;
        if (request.EndedAtUtc.HasValue) entry.EndedAtUtc = request.EndedAtUtc;
        if (entry.EndedAtUtc.HasValue && entry.EndedAtUtc <= entry.StartedAtUtc)
        {
            throw new ValidationException("EndedAtUtc must be after StartedAtUtc.");
        }

        if (request.LaborHours.HasValue) entry.LaborHours = request.LaborHours.Value;
        if (request.BillableHours.HasValue) entry.BillableHours = request.BillableHours.Value;
        if (request.HourlyRate.HasValue) entry.HourlyRate = request.HourlyRate.Value;
        if (request.Notes is not null) entry.Notes = ValidationHelpers.NullIfWhitespace(request.Notes);

        if (entry.EndedAtUtc.HasValue)
        {
            var calculatedMinutes = Math.Max(0, (int)Math.Round((entry.EndedAtUtc.Value - entry.StartedAtUtc).TotalMinutes, MidpointRounding.AwayFromZero));
            entry.TotalMinutes = calculatedMinutes;
            if (!request.LaborHours.HasValue && !request.BillableHours.HasValue)
            {
                var calculatedHours = decimal.Round(calculatedMinutes / 60m, 4, MidpointRounding.AwayFromZero);
                entry.LaborHours = calculatedHours;
                entry.BillableHours = calculatedHours;
            }
        }

        if (entry.LaborHours < 0) throw new ValidationException("LaborHours cannot be negative.");
        if (entry.BillableHours < 0) throw new ValidationException("BillableHours cannot be negative.");
        if (entry.BillableHours > entry.LaborHours) throw new ValidationException("BillableHours cannot exceed LaborHours.");

        dbContext.TimeEntryAdjustments.Add(new TimeEntryAdjustment
        {
            TimeEntryId = entry.Id,
            AdjustmentType = AdjustmentType.Override,
            Hours = entry.LaborHours - originalLabor,
            Reason = request.Reason.Trim(),
            AdjustedByUserId = adjustedByUserId,
            OriginalStartedAtUtc = originalStarted,
            OriginalEndedAtUtc = originalEnded,
            OriginalLaborHours = originalLabor,
            OriginalBillableHours = originalBillable,
            OriginalHourlyRate = originalHourlyRate,
            OriginalNotes = originalNotes,
            NewStartedAtUtc = entry.StartedAtUtc,
            NewEndedAtUtc = entry.EndedAtUtc,
            NewLaborHours = entry.LaborHours,
            NewBillableHours = entry.BillableHours,
            NewHourlyRate = entry.HourlyRate,
            NewNotes = entry.Notes
        });

        AddAudit(entry.Id, nameof(TimeEntry), AuditActionType.Update, null, $"{{\"Action\":\"Adjust\",\"ManagerOverride\":{managerOverride.ToString().ToLowerInvariant()}}}");
    }

    private static void ValidateAdjustmentRequest(AdjustTimeEntryRequestDto request, Guid adjustedByUserId)
    {
        ValidationHelpers.ValidateRequired(request.Reason, nameof(request.Reason));
        EnsureActorId(adjustedByUserId, "AdjustedByUserId");
    }


    private void EnsureEmployeeRequestMatchesCurrentUser(Guid employeeId)
    {
        if (currentUserContext.IsManager)
        {
            return;
        }

        if (currentUserContext.EmployeeId != employeeId)
        {
            throw new ValidationException("Employees can only perform time operations for their own account.");
        }
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

    private void EnsureManagerOrAdmin()
    {
        if (!currentUserContext.IsManager)
        {
            throw new ValidationException("This operation requires manager or admin access.");
        }
    }

    private static readonly System.Linq.Expressions.Expression<Func<TimeEntry, TimeApprovalQueueItemDto>> ReviewMapProjection = x => new TimeApprovalQueueItemDto(
        x.Id,
        x.JobTicketId,
        x.EmployeeId,
        x.Employee.FirstName + " " + x.Employee.LastName,
        x.StartedAtUtc,
        x.EndedAtUtc,
        x.TotalMinutes,
        x.LaborHours,
        x.BillableHours,
        x.ApprovalStatus,
        x.RejectionReason,
        x.WorkSummary,
        x.ClockInNote,
        x.ClockOutNote,
        x.Notes,
        x.JobTicket.TicketNumber,
        x.JobTicket.Title,
        x.JobTicket.JobType,
        x.JobTicket.Customer.Name,
        x.JobTicket.ServiceLocation.CompanyName,
        x.JobTicket.ServiceLocation.LocationName,
        x.JobTicket.ServiceLocation.AddressLine1 + ", " + x.JobTicket.ServiceLocation.City + ", " + x.JobTicket.ServiceLocation.State);

    private static readonly System.Linq.Expressions.Expression<Func<TimeEntry, TimeEntryDto>> MapProjection = x => new TimeEntryDto(
        x.Id,
        x.JobTicketId,
        x.EmployeeId,
        x.StartedAtUtc,
        x.EndedAtUtc,
        x.TotalMinutes,
        x.LaborHours,
        x.BillableHours,
        x.ApprovalStatus,
        x.ApprovedByUserId,
        x.ApprovedAtUtc,
        x.RejectionReason,
        x.ClockInLatitude,
        x.ClockInLongitude,
        x.ClockInAccuracy,
        x.ClockOutLatitude,
        x.ClockOutLongitude,
        x.ClockOutAccuracy,
        x.WorkSummary,
        x.ClockInNote,
        x.ClockOutNote,
        x.ClockInDeviceMetadata);

    private static TimeEntryDto Map(TimeEntry entry) => new(
        entry.Id,
        entry.JobTicketId,
        entry.EmployeeId,
        entry.StartedAtUtc,
        entry.EndedAtUtc,
        entry.TotalMinutes,
        entry.LaborHours,
        entry.BillableHours,
        entry.ApprovalStatus,
        entry.ApprovedByUserId,
        entry.ApprovedAtUtc,
        entry.RejectionReason,
        entry.ClockInLatitude,
        entry.ClockInLongitude,
        entry.ClockInAccuracy,
        entry.ClockOutLatitude,
        entry.ClockOutLongitude,
        entry.ClockOutAccuracy,
        entry.WorkSummary,
        entry.ClockInNote,
        entry.ClockOutNote,
        entry.ClockInDeviceMetadata);

    private static void EnsureEligibleForApproval(TimeEntry entry)
    {
        if (entry.ApprovalStatus != TimeEntryApprovalStatus.Pending)
        {
            throw new ValidationException("Only pending time entries can be approved.");
        }

        if (!entry.EndedAtUtc.HasValue)
        {
            throw new ValidationException("Open time entries cannot be approved.");
        }
    }

    private static void EnsureActorId(Guid actorId, string fieldName)
    {
        if (actorId == Guid.Empty) throw new ValidationException($"{fieldName} is required.");
    }

    private void ApplyApproval(TimeEntry entry, Guid approvedByUserId, DateTime approvedAtUtc)
    {
        entry.ApprovalStatus = TimeEntryApprovalStatus.Approved;
        entry.ApprovedByUserId = approvedByUserId;
        entry.ApprovedAtUtc = approvedAtUtc;
        entry.RejectionReason = null;
        AddAudit(entry.Id, nameof(TimeEntry), AuditActionType.Approval, null, $"{{\"Action\":\"Approve\",\"ApprovedByUserId\":\"{approvedByUserId}\"}}");
    }

    private async Task<Employee> EnsureEmployeeExistsAsync(Guid employeeId, CancellationToken cancellationToken)
    {
        if (employeeId == Guid.Empty) throw new ValidationException("EmployeeId is required.");
        var employee = await dbContext.Employees
            .SingleOrDefaultAsync(x => x.Id == employeeId, cancellationToken);

        if (employee is null)
        {
            throw new ValidationException("EmployeeId does not reference an active employee.");
        }

        return employee;
    }

    private async Task EnsureJobTicketExistsAsync(Guid jobTicketId, CancellationToken cancellationToken)
    {
        if (jobTicketId == Guid.Empty) throw new ValidationException("JobTicketId is required.");
        if (!await dbContext.JobTickets.AnyAsync(x => x.Id == jobTicketId, cancellationToken))
        {
            throw new ValidationException("JobTicketId does not reference an active job ticket.");
        }
    }

    private async Task EnsureEmployeeAssignedAsync(Guid jobTicketId, Guid employeeId, CancellationToken cancellationToken)
    {
        var isAssigned = await dbContext.JobTicketEmployees.AnyAsync(
            x => x.JobTicketId == jobTicketId && x.EmployeeId == employeeId,
            cancellationToken);

        if (!isAssigned)
        {
            throw new ValidationException("Employee must be assigned to the job ticket before clocking in.");
        }
    }

    private void AddAudit(Guid entityId, string entityName, AuditActionType actionType, string? oldValues, string? newValues)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = entityName,
            EntityId = entityId,
            ActionType = actionType,
            UserId = null,
            OldValuesJson = oldValues,
            NewValuesJson = newValues
        });
    }

    private static string AuditJson(params (string Name, object? Value)[] values)
    {
        return JsonSerializer.Serialize(values.ToDictionary(x => x.Name, x => x.Value));
    }

    private static void ValidateClockIn(ClockInRequestDto request)
    {
        if (!request.ClockInLatitude.HasValue) throw new ValidationException("ClockInLatitude is required.");
        if (!request.ClockInLongitude.HasValue) throw new ValidationException("ClockInLongitude is required.");
        ValidationHelpers.ValidateRequired(request.DeviceMetadata, nameof(request.DeviceMetadata));
    }

    private static void ValidateClockOut(ClockOutRequestDto request)
    {
        if (!request.ClockOutLatitude.HasValue) throw new ValidationException("ClockOutLatitude is required.");
        if (!request.ClockOutLongitude.HasValue) throw new ValidationException("ClockOutLongitude is required.");
        ValidationHelpers.ValidateRequired(request.WorkSummary, nameof(request.WorkSummary));
    }
}

public sealed record ClockInRequestDto(
    Guid JobTicketId,
    Guid EmployeeId,
    decimal? ClockInLatitude,
    decimal? ClockInLongitude,
    decimal? ClockInAccuracy,
    string DeviceMetadata,
    string? Note);

public sealed record ClockOutRequestDto(
    Guid TimeEntryId,
    Guid EmployeeId,
    decimal? ClockOutLatitude,
    decimal? ClockOutLongitude,
    decimal? ClockOutAccuracy,
    string WorkSummary,
    string? Note);

public sealed record BulkApproveTimeEntriesRequestDto(IReadOnlyList<Guid> TimeEntryIds);
public sealed record RejectTimeEntryRequestDto(string Reason);
public sealed record ArchiveTimeEntryRequestDto(string Reason);

public sealed record AdjustTimeEntryRequestDto(
    string Reason,
    DateTime? StartedAtUtc,
    DateTime? EndedAtUtc,
    decimal? LaborHours,
    decimal? BillableHours,
    decimal? HourlyRate,
    string? Notes);

public sealed record TimeEntryReviewFilters(
    Guid? JobTicketId = null,
    Guid? EmployeeId = null,
    TimeEntryApprovalStatus? ApprovalStatus = TimeEntryApprovalStatus.Pending,
    DateTime? DateFromUtc = null,
    DateTime? DateToUtc = null,
    string? Search = null);

public sealed record TimeEntryDto(
    Guid Id,
    Guid JobTicketId,
    Guid EmployeeId,
    DateTime StartedAtUtc,
    DateTime? EndedAtUtc,
    int? TotalMinutes,
    decimal LaborHours,
    decimal BillableHours,
    TimeEntryApprovalStatus ApprovalStatus,
    Guid? ApprovedByUserId,
    DateTime? ApprovedAtUtc,
    string? RejectionReason,
    decimal ClockInLatitude,
    decimal ClockInLongitude,
    decimal? ClockInAccuracy,
    decimal? ClockOutLatitude,
    decimal? ClockOutLongitude,
    decimal? ClockOutAccuracy,
    string? WorkSummary,
    string? ClockInNote,
    string? ClockOutNote,
    string? ClockInDeviceMetadata);

public sealed record TimeApprovalQueueItemDto(
    Guid Id,
    Guid JobTicketId,
    Guid EmployeeId,
    string EmployeeName,
    DateTime StartedAtUtc,
    DateTime? EndedAtUtc,
    int? TotalMinutes,
    decimal LaborHours,
    decimal BillableHours,
    TimeEntryApprovalStatus ApprovalStatus,
    string? RejectionReason,
    string? WorkSummary,
    string? ClockInNote,
    string? ClockOutNote,
    string? ManagerNotes,
    string JobTicketNumber,
    string JobName,
    string? LaborType,
    string CustomerName,
    string SiteName,
    string LocationName,
    string LocationAddress);
