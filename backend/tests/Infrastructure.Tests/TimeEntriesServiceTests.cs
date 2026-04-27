using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.TimeEntries;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class TimeEntriesServiceTests
{
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

        var approved = await service.ApproveAsync(created.Id, new ApproveTimeEntryRequestDto(refs.Manager.Id));

        Assert.NotNull(approved);
        Assert.Equal(TimeEntryApprovalStatus.Approved, approved!.ApprovalStatus);
        Assert.Equal(refs.Manager.Id, approved.ApprovedByUserId);
    }

    [Fact]
    public async Task Reject_time_entry_with_reason()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));
        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));

        var rejected = await service.RejectAsync(created.Id, new RejectTimeEntryRequestDto(refs.Manager.Id, "GPS mismatch"));

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

        var adjusted = await service.AdjustAsync(created.Id, new AdjustTimeEntryRequestDto(refs.Manager.Id, "Manual correction", true, entry.StartedAtUtc.AddMinutes(-15), entry.EndedAtUtc, 0.75m, 0.75m, null, "Adjusted"));

        Assert.NotNull(adjusted);
        var audit = await context.TimeEntryAdjustments.SingleAsync(x => x.TimeEntryId == created.Id);
        Assert.Equal(1m, audit.OriginalLaborHours);
        Assert.Equal(0.75m, audit.NewLaborHours);
        Assert.Equal("Manual correction", audit.Reason);
    }

    [Fact]
    public async Task Audit_logs_created_for_time_tracking_actions()
    {
        await using var context = CreateContext();
        var refs = await SeedRefsAsync(context, assigned: true);
        var service = new TimeEntriesService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager));

        var created = await service.ClockInAsync(new ClockInRequestDto(refs.JobTicket.Id, refs.Employee.Id, 30m, -97m, null, "Android", null));
        await service.ClockOutAsync(new ClockOutRequestDto(created.Id, refs.Employee.Id, 30.1m, -97.1m, null, "Done", null));
        await service.ApproveAsync(created.Id, new ApproveTimeEntryRequestDto(refs.Manager.Id));
        await service.RejectAsync(created.Id, new RejectTimeEntryRequestDto(refs.Manager.Id, "Needs update"));
        await service.AdjustAsync(created.Id, new AdjustTimeEntryRequestDto(refs.Manager.Id, "Correction", true, null, null, 0.2m, 0.2m, null, null));

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
        var employee = new Employee { FirstName = "Tech", LastName = "One", Email = "tech2@example.com" };
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

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private sealed record SeedRefs(JobTicket JobTicket, Employee Employee, Employee Manager);
}
