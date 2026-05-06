using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.Pilot;
using JobTicketSystem.Application.Reporting;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Application.TimeEntries;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PilotDemoSeedTests
{
    [Fact]
    public async Task SeedAsync_creates_idempotent_local_pilot_dataset()
    {
        await using var context = CreateContext();
        var seedService = CreateSeedService(context);

        var first = await seedService.SeedAsync();
        var second = await seedService.SeedAsync();

        Assert.True(first.Created);
        Assert.False(second.Created);
        Assert.Equal(3, second.DemoUserCount);
        Assert.Equal(2, second.DemoCustomerCount);
        Assert.Equal(3, second.DemoJobTicketCount);
        Assert.Equal(1, second.InvoiceReadyJobTicketCount);
        Assert.Equal(3, await context.JobTickets.CountAsync(x => x.TicketNumber.StartsWith("PILOT-")));
    }

    [Fact]
    public async Task Seeded_pilot_data_validates_employee_to_manager_to_reporting_workflow()
    {
        await using var context = CreateContext();
        var seedService = CreateSeedService(context);
        await seedService.SeedAsync();

        var technician = await context.Employees.SingleAsync(x => x.UserName == PilotDemoSeedService.EmployeeUserName);
        var manager = await context.Employees.SingleAsync(x => x.UserName == PilotDemoSeedService.ManagerUserName);
        var activeTicket = await context.JobTickets.SingleAsync(x => x.TicketNumber == "PILOT-ACTIVE-002");
        var readyTicket = await context.JobTickets.SingleAsync(x => x.TicketNumber == "PILOT-READY-001");
        var part = await context.Parts.SingleAsync(x => x.PartNumber == "PILOT-FILTER-001");

        var employeeJobs = new JobTicketsService(context, new TestCurrentUserContext(technician.Id, SystemRoles.Employee));
        var visibleJobs = await employeeJobs.ListAsync(new JobTicketListQuery(null, null, null, null, null));
        Assert.Contains(visibleJobs, x => x.Id == activeTicket.Id);

        var timeEntries = new TimeEntriesService(context, new TestCurrentUserContext(technician.Id, SystemRoles.Employee));
        var clockIn = await timeEntries.ClockInAsync(new ClockInRequestDto(activeTicket.Id, technician.Id, 30.2672m, -97.7431m, 10m, "phase-4a-test", "Arrived for pilot validation."));
        var clockOut = await timeEntries.ClockOutAsync(new ClockOutRequestDto(clockIn.Id, technician.Id, 30.2673m, -97.7430m, 8m, "Validated compressor inspection checklist.", "Leaving site."));

        Assert.NotNull(clockOut.EndedAtUtc);
        Assert.Equal(TimeEntryApprovalStatus.Pending, clockOut.ApprovalStatus);

        var workEntry = await employeeJobs.AddWorkEntryAsync(activeTicket.Id, new AddJobWorkEntryDto(technician.Id, WorkEntryType.Inspection, "Pilot E2E validation work note.", DateTime.UtcNow));
        Assert.Equal(activeTicket.Id, workEntry.JobTicketId);

        var addedPart = await employeeJobs.AddPartAsync(activeTicket.Id, new AddJobTicketPartDto(part.Id, 1m, "Pilot E2E validation part.", true, technician.Id, DateTime.UtcNow, AdjustInventory: false, EquipmentId: activeTicket.EquipmentId));
        Assert.Equal(JobPartApprovalStatus.Pending, addedPart.ApprovalStatus);

        var managerTimeEntries = new TimeEntriesService(context, new TestCurrentUserContext(manager.Id, SystemRoles.Manager));
        var approvedTime = await managerTimeEntries.ApproveAsync(clockOut.Id, new ApproveTimeEntryRequestDto(manager.Id));
        Assert.Equal(TimeEntryApprovalStatus.Approved, approvedTime!.ApprovalStatus);

        var managerJobs = new JobTicketsService(context, new TestCurrentUserContext(manager.Id, SystemRoles.Manager));
        var approvedPart = await managerJobs.ApprovePartAsync(activeTicket.Id, addedPart.Id, new ApproveJobTicketPartDto(manager.Id));
        Assert.Equal(JobPartApprovalStatus.Approved, approvedPart!.ApprovalStatus);

        var reporting = new ReportingService(context);
        var invoiceReady = await reporting.GetInvoiceReadySummaryAsync(readyTicket.Id);
        var readyJobs = await reporting.GetJobsReadyToInvoiceAsync(new ReportQueryFiltersDto());
        var laborByEmployee = await reporting.GetLaborByEmployeeAsync(new ReportQueryFiltersDto(EmployeeId: technician.Id));

        Assert.NotNull(invoiceReady);
        Assert.NotEmpty(invoiceReady!.ApprovedLaborEntries);
        Assert.NotEmpty(invoiceReady.ApprovedParts);
        Assert.Contains(readyJobs, x => x.JobTicketId == readyTicket.Id);
        Assert.Contains(laborByEmployee, x => x.EmployeeId == technician.Id);
    }

    private static PilotDemoSeedService CreateSeedService(ApplicationDbContext context)
        => new(context, new AuthService(context, new TestCurrentUserContext(Guid.Empty, SystemRoles.Admin)));

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
