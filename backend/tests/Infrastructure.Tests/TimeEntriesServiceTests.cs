using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.TimeEntries;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class TimeEntriesServiceTests
{
    [Fact]
    public async Task Review_queue_defaults_to_pending_and_supports_optional_filters()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var secondTicket = new JobTicket
        {
            TicketNumber = "JT-2026-000002",
            CustomerId = refs.JobTicket.CustomerId,
            ServiceLocationId = refs.JobTicket.ServiceLocationId,
            BillingPartyCustomerId = refs.JobTicket.BillingPartyCustomerId,
            Title = "Second Test Ticket",
            Status = JobTicketStatus.InProgress
        };
        context.JobTickets.Add(secondTicket);
        await context.SaveChangesAsync();

        var included = new TimeEntry
        {
            JobTicketId = refs.JobTicket.Id,
            EmployeeId = refs.Employee.Id,
            StartedAtUtc = new DateTime(2026, 5, 20, 13, 0, 0, DateTimeKind.Utc),
            EndedAtUtc = new DateTime(2026, 5, 20, 15, 0, 0, DateTimeKind.Utc),
            LaborHours = 2m,
            BillableHours = 2m,
            ApprovalStatus = TimeEntryApprovalStatus.Pending
        };
        var approved = new TimeEntry
        {
            JobTicketId = refs.JobTicket.Id,
            EmployeeId = refs.Employee.Id,
            StartedAtUtc = new DateTime(2026, 5, 21, 13, 0, 0, DateTimeKind.Utc),
            EndedAtUtc = new DateTime(2026, 5, 21, 14, 0, 0, DateTimeKind.Utc),
            LaborHours = 1m,
            BillableHours = 1m,
            ApprovalStatus = TimeEntryApprovalStatus.Approved
        };
        var otherJob = new TimeEntry
        {
            JobTicketId = secondTicket.Id,
            EmployeeId = refs.Employee.Id,
            StartedAtUtc = new DateTime(2026, 5, 20, 16, 0, 0, DateTimeKind.Utc),
            EndedAtUtc = new DateTime(2026, 5, 20, 17, 0, 0, DateTimeKind.Utc),
            LaborHours = 1m,
            BillableHours = 1m,
            ApprovalStatus = TimeEntryApprovalStatus.Pending
        };
        context.TimeEntries.AddRange(included, approved, otherJob);
        await context.SaveChangesAsync();

        var service = new TimeEntriesService(context, new TestCurrentUserContext(refs.Manager.Id, JobTicketSystem.Application.Security.SystemRoles.Manager));

        var defaultQueue = await service.ListForReviewAsync(new TimeEntryReviewFilters());
        var filteredQueue = await service.ListForReviewAsync(new TimeEntryReviewFilters(
            refs.JobTicket.Id,
            refs.Employee.Id,
            TimeEntryApprovalStatus.Pending,
            new DateTime(2026, 5, 20, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 5, 20, 23, 59, 59, DateTimeKind.Utc)));

        Assert.Equal(2, defaultQueue.Count);
        Assert.Single(filteredQueue);
        Assert.Equal(included.Id, filteredQueue[0].Id);
    }

    [Fact]
    public async Task Review_queue_returns_manager_facing_context_and_searches_job_customer_and_location()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var entry = new TimeEntry
        {
            JobTicketId = refs.JobTicket.Id,
            EmployeeId = refs.Employee.Id,
            StartedAtUtc = new DateTime(2026, 6, 9, 13, 0, 0, DateTimeKind.Utc),
            EndedAtUtc = new DateTime(2026, 6, 9, 15, 0, 0, DateTimeKind.Utc),
            LaborHours = 2m,
            BillableHours = 1.5m,
            ApprovalStatus = TimeEntryApprovalStatus.Pending
        };
        context.TimeEntries.Add(entry);
        await context.SaveChangesAsync();
        var service = new TimeEntriesService(context, new TestCurrentUserContext(refs.Manager.Id, JobTicketSystem.Application.Security.SystemRoles.Manager));

        foreach (var search in new[] { "JT-2026", "Customer A", "Main Site", "Austin", "Test Ticket" })
        {
            var result = await service.ListForReviewAsync(new TimeEntryReviewFilters(Search: search));
            Assert.Single(result);
            Assert.Equal("Tech One", result[0].EmployeeName);
            Assert.Equal("JT-2026-000001", result[0].JobTicketNumber);
            Assert.Equal("Customer A", result[0].CustomerName);
            Assert.Equal("Main Site", result[0].LocationName);
        }
    }

    [Fact]
    public async Task Review_queue_requires_manager_or_admin_access()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(refs.Employee.Id, JobTicketSystem.Application.Security.SystemRoles.Employee));

        await Assert.ThrowsAsync<ValidationException>(() => service.ListForReviewAsync(new TimeEntryReviewFilters()));
    }

    [Fact]
    public async Task Clock_in_with_valid_assigned_employee_succeeds()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));

        var entry = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30.2672m, -97.7431m, 5.5m, "iOS", "Starting work"));

        Assert.Equal(refs.Employee.Id, entry.EmployeeId);
        Assert.Equal(refs.JobTicket.Id, entry.JobTicketId);
        Assert.Null(entry.EndedAtUtc);
    }

    [Fact]
    public async Task Reject_clock_in_when_employee_not_assigned_to_job()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: false);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null)));
    }

    [Fact]
    public async Task Reject_clock_in_when_employee_already_has_open_time_entry()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));

        await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30.1m, -97.1m, null, "Android", null)));
    }

    [Fact]
    public async Task Clock_out_calculates_total_time()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));

        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));
        var entry = await context.TimeEntries.SingleAsync(x => x.Id == created.Id);
        entry.StartedAtUtc = DateTime.UtcNow.AddMinutes(-75);
        await context.SaveChangesAsync();

        var closed = await service.ClockOutAsync(new ClockOutRequestDto(created.Id, refs.Employee.Id, 30.2m, -97.2m, 4.1m, "Completed diagnostics", "Done"));

        Assert.NotNull(closed.EndedAtUtc);
        Assert.True(closed.TotalMinutes >= 74);
        Assert.True(closed.LaborHours >= 1.23m);
    }

    [Fact]
    public async Task Reject_clock_out_by_different_employee()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var secondEmployee = new Employee { FirstName = "Other", LastName = "Tech", Email = "other@example.com" };
        context.Employees.Add(secondEmployee);
        await context.SaveChangesAsync();
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));

        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.ClockOutAsync(new ClockOutRequestDto(created.Id, secondEmployee.Id, 30.2m, -97.2m, null, "Summary", null)));
    }

    [Fact]
    public async Task Reject_clock_out_without_gps_coordinates()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));

        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.ClockOutAsync(new ClockOutRequestDto(created.Id, refs.Employee.Id, null, -97.2m, null, "Summary", null)));
    }

    [Fact]
    public async Task Approve_time_entry()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));
        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));
        await service.ClockOutAsync(new ClockOutRequestDto(created.Id, refs.Employee.Id, 30.1m, -97.1m, null, "Completed", null));

        var approved = await service.ApproveAsync(created.Id, refs.Manager.Id);

        Assert.NotNull(approved);
        Assert.Equal(TimeEntryApprovalStatus.Approved, approved!.ApprovalStatus);
        Assert.Equal(refs.Manager.Id, approved.ApprovedByUserId);
    }

    [Fact]
    public async Task Bulk_approve_only_approves_completed_pending_entries()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var first = new TimeEntry { JobTicketId = refs.JobTicket.Id, EmployeeId = refs.Employee.Id, StartedAtUtc = DateTime.UtcNow.AddHours(-3), EndedAtUtc = DateTime.UtcNow.AddHours(-2), LaborHours = 1m, BillableHours = 1m };
        var second = new TimeEntry { JobTicketId = refs.JobTicket.Id, EmployeeId = refs.Employee.Id, StartedAtUtc = DateTime.UtcNow.AddHours(-2), EndedAtUtc = DateTime.UtcNow.AddHours(-1), LaborHours = 1m, BillableHours = 1m };
        context.TimeEntries.AddRange(first, second);
        await context.SaveChangesAsync();
        var service = new TimeEntriesService(context, new TestCurrentUserContext(refs.Manager.Id, JobTicketSystem.Application.Security.SystemRoles.Manager));

        var approved = await service.BulkApproveAsync(new BulkApproveTimeEntriesRequestDto(new[] { first.Id, second.Id }), refs.Manager.Id);

        Assert.Equal(2, approved.Count);
        Assert.All(approved, entry => Assert.Equal(TimeEntryApprovalStatus.Approved, entry.ApprovalStatus));
    }

    [Fact]
    public async Task Employee_cannot_bulk_approve_time_entries()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(refs.Employee.Id, JobTicketSystem.Application.Security.SystemRoles.Employee));

        var entryId = Guid.NewGuid();
        await Assert.ThrowsAsync<ValidationException>(() => service.ApproveAsync(entryId, refs.Employee.Id));
        await Assert.ThrowsAsync<ValidationException>(() => service.RejectAsync(entryId, new RejectTimeEntryRequestDto("Unauthorized"), refs.Employee.Id));
        await Assert.ThrowsAsync<ValidationException>(() => service.EditAndApproveAsync(entryId, new AdjustTimeEntryRequestDto("Unauthorized", null, null, 1m, 1m, null, null), refs.Employee.Id));
        await Assert.ThrowsAsync<ValidationException>(() => service.BulkApproveAsync(new BulkApproveTimeEntriesRequestDto(new[] { entryId }), refs.Employee.Id));
        await Assert.ThrowsAsync<ValidationException>(() => service.ArchiveAsync(entryId, new ArchiveTimeEntryRequestDto("Unauthorized"), refs.Employee.Id));
    }

    [Fact]
    public async Task Reject_time_entry_with_reason()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));
        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));

        var rejected = await service.RejectAsync(created.Id, new RejectTimeEntryRequestDto("GPS mismatch"), refs.Manager.Id);

        Assert.NotNull(rejected);
        Assert.Equal(TimeEntryApprovalStatus.Rejected, rejected!.ApprovalStatus);
        Assert.Equal("GPS mismatch", rejected.RejectionReason);
    }

    [Fact]
    public async Task Adjust_time_entry_creates_adjustment_with_original_values()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));
        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));
        var entry = await context.TimeEntries.SingleAsync(x => x.Id == created.Id);
        entry.StartedAtUtc = DateTime.UtcNow.AddMinutes(-90);
        entry.EndedAtUtc = DateTime.UtcNow.AddMinutes(-30);
        entry.TotalMinutes = 60;
        entry.LaborHours = 1m;
        entry.BillableHours = 0.5m;
        await context.SaveChangesAsync();

        var adjusted = await service.AdjustAsync(created.Id, new AdjustTimeEntryRequestDto("Manual correction", entry.StartedAtUtc.AddMinutes(-15), entry.EndedAtUtc, 0.75m, 0.75m, null, "Adjusted"), refs.Manager.Id, managerOverride: true);

        Assert.NotNull(adjusted);
        var audit = await context.TimeEntryAdjustments.SingleAsync(x => x.TimeEntryId == created.Id);
        Assert.Equal(1m, audit.OriginalLaborHours);
        Assert.Equal(0.75m, audit.NewLaborHours);
        Assert.Equal("Manual correction", audit.Reason);
    }

    [Fact]
    public async Task Edit_and_approve_preserves_original_values_in_adjustment_history()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var originalStart = DateTime.UtcNow.AddHours(-2);
        var entry = new TimeEntry { JobTicketId = refs.JobTicket.Id, EmployeeId = refs.Employee.Id, StartedAtUtc = originalStart, EndedAtUtc = originalStart.AddHours(1), LaborHours = 1m, BillableHours = 1m };
        context.TimeEntries.Add(entry);
        await context.SaveChangesAsync();
        var service = new TimeEntriesService(context, new TestCurrentUserContext(refs.Manager.Id, JobTicketSystem.Application.Security.SystemRoles.Manager));

        var result = await service.EditAndApproveAsync(entry.Id, new AdjustTimeEntryRequestDto("Corrected lunch overlap", originalStart.AddMinutes(15), entry.EndedAtUtc, 0.75m, 0.5m, null, "Manager corrected"), refs.Manager.Id);

        Assert.NotNull(result);
        Assert.Equal(TimeEntryApprovalStatus.Approved, result!.ApprovalStatus);
        var adjustment = await context.TimeEntryAdjustments.SingleAsync(x => x.TimeEntryId == entry.Id);
        Assert.Equal(originalStart, adjustment.OriginalStartedAtUtc);
        Assert.Equal(1m, adjustment.OriginalLaborHours);
        Assert.Equal(0.75m, adjustment.NewLaborHours);
        Assert.Equal(refs.Manager.Id, adjustment.AdjustedByUserId);
        Assert.Equal("Corrected lunch overlap", adjustment.Reason);
    }

    [Fact]
    public async Task Edit_and_approve_commits_adjustment_and_approval_in_one_save()
    {
        var interceptor = new SaveCountInterceptor();
        await using var context = CreateContext(interceptor);
        var refs = await SeedRefsAsync(context, assigned: true);
        var start = DateTime.UtcNow.AddHours(-2);
        var entry = new TimeEntry { JobTicketId = refs.JobTicket.Id, EmployeeId = refs.Employee.Id, StartedAtUtc = start, EndedAtUtc = start.AddHours(1), LaborHours = 1m, BillableHours = 1m };
        context.TimeEntries.Add(entry);
        await context.SaveChangesAsync();
        interceptor.Reset();
        var service = new TimeEntriesService(context, new TestCurrentUserContext(refs.Manager.Id, JobTicketSystem.Application.Security.SystemRoles.Manager));

        await service.EditAndApproveAsync(entry.Id, new AdjustTimeEntryRequestDto("Manager correction", start.AddMinutes(15), entry.EndedAtUtc, 0.75m, 0.5m, null, "Corrected"), refs.Manager.Id);

        Assert.Equal(1, interceptor.SaveCount);
        Assert.Equal(TimeEntryApprovalStatus.Approved, entry.ApprovalStatus);
        Assert.Single(context.TimeEntryAdjustments.Where(x => x.TimeEntryId == entry.Id));
    }

    [Fact]
    public async Task Archive_time_entry_requires_manager_reason_and_excludes_from_review()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var start = DateTime.UtcNow.AddHours(-2);
        var entry = new TimeEntry
        {
            JobTicketId = refs.JobTicket.Id,
            EmployeeId = refs.Employee.Id,
            StartedAtUtc = start,
            EndedAtUtc = start.AddHours(1),
            LaborHours = 1m,
            BillableHours = 1m
        };
        context.TimeEntries.Add(entry);
        await context.SaveChangesAsync();
        var service = new TimeEntriesService(context, new TestCurrentUserContext(refs.Manager.Id, JobTicketSystem.Application.Security.SystemRoles.Manager));

        await Assert.ThrowsAsync<ValidationException>(() => service.ArchiveAsync(entry.Id, new ArchiveTimeEntryRequestDto("   "), refs.Manager.Id));

        var archived = await service.ArchiveAsync(entry.Id, new ArchiveTimeEntryRequestDto("Duplicate time entry"), refs.Manager.Id);

        Assert.True(archived);
        Assert.Empty(await service.ListForReviewAsync(new TimeEntryReviewFilters()));
        var archivedEntity = await context.TimeEntries.IgnoreQueryFilters().SingleAsync(x => x.Id == entry.Id);
        Assert.True(archivedEntity.IsDeleted);
        Assert.Equal(refs.Manager.Id, archivedEntity.DeletedByUserId);
        Assert.NotNull(archivedEntity.DeletedAtUtc);
        var audit = await context.AuditLogs.SingleAsync(x => x.EntityId == entry.Id && x.ActionType == AuditActionType.Delete);
        Assert.Contains("Duplicate time entry", audit.NewValuesJson);
    }

    [Fact]
    public async Task Single_approval_uses_the_same_pending_completed_eligibility_rule_as_bulk_approval()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(refs.Manager.Id, JobTicketSystem.Application.Security.SystemRoles.Manager));
        var openEntry = new TimeEntry { JobTicketId = refs.JobTicket.Id, EmployeeId = refs.Employee.Id, StartedAtUtc = DateTime.UtcNow, LaborHours = 0m, BillableHours = 0m };
        var approvedEntry = new TimeEntry { JobTicketId = refs.JobTicket.Id, EmployeeId = refs.Employee.Id, StartedAtUtc = DateTime.UtcNow.AddHours(-2), EndedAtUtc = DateTime.UtcNow.AddHours(-1), LaborHours = 1m, BillableHours = 1m, ApprovalStatus = TimeEntryApprovalStatus.Approved };
        context.TimeEntries.AddRange(openEntry, approvedEntry);
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() => service.ApproveAsync(openEntry.Id, refs.Manager.Id));
        await Assert.ThrowsAsync<ValidationException>(() => service.ApproveAsync(approvedEntry.Id, refs.Manager.Id));
    }

    [Fact]
    public async Task Employee_cannot_adjust_time_entry_through_service_direct_invocation()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);

        var managerService = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));
        var created = await managerService.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));

        var employeeService = new TimeEntriesService(context, new TestCurrentUserContext(refs.Employee.Id, JobTicketSystem.Application.Security.SystemRoles.Employee));

        await Assert.ThrowsAsync<ValidationException>(() =>
            employeeService.AdjustAsync(created.Id, new AdjustTimeEntryRequestDto("Unauthorized direct adjustment", null, null, 1.25m, 1.25m, null, null), refs.Employee.Id, managerOverride: true));
    }

    [Fact]
    public async Task Audit_logs_created_for_time_tracking_actions()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));

        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));
        await service.ClockOutAsync(new ClockOutRequestDto(created.Id, refs.Employee.Id, 30.1m, -97.1m, null, "Done", null));
        await service.ApproveAsync(created.Id, refs.Manager.Id);
        await service.RejectAsync(created.Id, new RejectTimeEntryRequestDto("Needs update"), refs.Manager.Id);
        await service.AdjustAsync(created.Id, new AdjustTimeEntryRequestDto("Correction", null, null, 0.2m, 0.2m, null, null), refs.Manager.Id, managerOverride: true);

        var logs = await context.AuditLogs.Where(x => x.EntityId == created.Id).ToListAsync();
        Assert.True(logs.Count >= 5);
        Assert.Contains(logs, x => x.NewValuesJson!.Contains("ClockIn"));
        Assert.Contains(logs, x => x.NewValuesJson!.Contains("ClockOut"));
        Assert.Contains(logs, x => x.NewValuesJson!.Contains("Approve"));
        Assert.Contains(logs, x => x.NewValuesJson!.Contains("Reject"));
        Assert.Contains(logs, x => x.NewValuesJson!.Contains("Adjust"));
    }

    private static async Task<SeedRefs> SeedRefsAsync(ApplicationDbContext context, bool assigned)
    {
        var customer = new Customer { Name = "Customer A" };
        var billingCustomer = new Customer { Name = "Billing Customer" };
        var location = new ServiceLocation
        {
            Customer = customer,
            CompanyName = "Customer A",
            LocationName = "Main Site",
            AddressLine1 = "1 Main St",
            City = "Austin",
            State = "TX",
            PostalCode = "78701",
            Country = "USA"
        };
        var manager = new Employee { FirstName = "Manager", LastName = "One", Email = "manager2@example.com" };
        var employee = new Employee { FirstName = "Tech", LastName = "One", Email = "tech2@example.com", CostRate = 62.50m, BillRate = 115.25m };
        context.AddRange(customer, billingCustomer, location, manager, employee);
        await context.SaveChangesAsync();

        var ticket = new JobTicket
        {
            TicketNumber = "JT-2026-000001",
            CustomerId = customer.Id,
            ServiceLocationId = location.Id,
            BillingPartyCustomerId = billingCustomer.Id,
            Title = "Test Ticket",
            Status = JobTicketStatus.InProgress
        };

        context.JobTickets.Add(ticket);
        await context.SaveChangesAsync();

        if (assigned)
        {
            context.JobTicketEmployees.Add(new JobTicketEmployee
            {
                JobTicketId = ticket.Id,
                EmployeeId = employee.Id,
                AssignedAtUtc = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        return new SeedRefs(ticket, employee, manager);
    }

    private static ApplicationDbContext CreateContext(params IInterceptor[] interceptors)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString());
        if (interceptors.Length > 0) optionsBuilder.AddInterceptors(interceptors);
        return new ApplicationDbContext(optionsBuilder.Options);
    }

    private sealed class SaveCountInterceptor : SaveChangesInterceptor
    {
        public int SaveCount { get; private set; }
        public void Reset() => SaveCount = 0;

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            SaveCount += 1;
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }

    private sealed record SeedRefs(JobTicket JobTicket, Employee Employee, Employee Manager);

    [Fact]
    public async Task Clock_in_captures_employee_rate_snapshots()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));

        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));
        var entry = await context.TimeEntries.SingleAsync(x => x.Id == created.Id);

        Assert.Equal(62.50m, entry.CostRateSnapshot);
        Assert.Equal(115.25m, entry.BillRateSnapshot);
    }
}
