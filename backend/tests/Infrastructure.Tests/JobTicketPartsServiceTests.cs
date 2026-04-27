using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class JobTicketPartsServiceTests
{
    [Fact]
    public async Task Add_valid_part_to_job_ticket_succeeds()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        var created = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(refs.Part.Id, 2m, null, null, null, null, null, null, null, null, null, null, "Used in repair", true, refs.Employee.Id, null));

        Assert.Equal(refs.JobTicket.Id, created.JobTicketId);
        Assert.Equal(refs.Part.Id, created.PartId);
        Assert.Equal(2m, created.Quantity);
    }

    [Fact]
    public async Task Reject_add_when_job_ticket_does_not_exist()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        await Assert.ThrowsAsync<ValidationException>(() => service.AddPartAsync(Guid.NewGuid(), new AddJobTicketPartDto(refs.Part.Id, 1m, null, null, null, null, null, null, null, null, null, null, null, true, null, null)));
    }

    [Fact]
    public async Task Reject_add_when_part_does_not_exist()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        await Assert.ThrowsAsync<ValidationException>(() => service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(Guid.NewGuid(), 1m, null, null, null, null, null, null, null, null, null, null, null, true, null, null)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Reject_zero_or_negative_quantity(decimal quantity)
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        await Assert.ThrowsAsync<ValidationException>(() => service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, quantity, null, null, null, null, null, null, null, null, null, null, null, true, null, null)));
    }

    [Fact]
    public async Task Captures_price_snapshots_and_master_price_change_does_not_change_existing_snapshot()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, null, null, null, null, null, null, null, null, null, null, true, refs.Employee.Id, null));
        refs.Part.UnitCost = 999m;
        refs.Part.UnitPrice = 1111m;
        await context.SaveChangesAsync();

        var listed = await service.ListPartsAsync(refs.JobTicket.Id);

        Assert.Equal(12.34m, created.UnitCostSnapshot);
        Assert.Equal(25.67m, created.SalePriceSnapshot);
        Assert.Equal(12.34m, listed.Single().UnitCostSnapshot);
        Assert.Equal(25.67m, listed.Single().SalePriceSnapshot);
    }

    [Fact]
    public async Task List_excludes_archived_job_parts()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, null, null, null, null, null, null, null, null, null, null, true, refs.Employee.Id, null));
        await service.ArchivePartAsync(refs.JobTicket.Id, created.Id, new ArchiveJobTicketPartDto(refs.Manager.Id));

        var listed = await service.ListPartsAsync(refs.JobTicket.Id);

        Assert.Empty(listed);
    }

    [Fact]
    public async Task Approve_job_part_succeeds()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);
        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, null, null, null, null, null, null, null, null, null, null, true, refs.Employee.Id, null));

        var approved = await service.ApprovePartAsync(refs.JobTicket.Id, created.Id, new ApproveJobTicketPartDto(refs.Manager.Id));

        Assert.NotNull(approved);
        Assert.Equal(JobPartApprovalStatus.Approved, approved!.ApprovalStatus);
        Assert.Equal(refs.Manager.Id, approved.ApprovedByUserId);
    }

    [Fact]
    public async Task Reject_job_part_requires_reason_and_sets_rejected_status()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);
        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, null, null, null, null, null, null, null, null, null, null, true, refs.Employee.Id, null));

        await Assert.ThrowsAsync<ValidationException>(() => service.RejectPartAsync(refs.JobTicket.Id, created.Id, new RejectJobTicketPartDto(" ", refs.Manager.Id)));

        var rejected = await service.RejectPartAsync(refs.JobTicket.Id, created.Id, new RejectJobTicketPartDto("Not billable", refs.Manager.Id));

        Assert.NotNull(rejected);
        Assert.Equal(JobPartApprovalStatus.Rejected, rejected!.ApprovalStatus);
        Assert.Equal("Not billable", rejected.RejectionReason);
    }

    [Fact]
    public async Task Archive_job_part_restores_inventory_when_requested()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 3m, null, null, null, null, null, null, null, null, null, null, null, true, refs.Employee.Id, null, AdjustInventory: true));
        await service.ArchivePartAsync(refs.JobTicket.Id, created.Id, new ArchiveJobTicketPartDto(refs.Manager.Id, RestoreInventory: true));

        var refreshedPart = await context.Parts.SingleAsync(x => x.Id == refs.Part.Id);
        Assert.Equal(10m, refreshedPart.QuantityOnHand);
    }

    [Fact]
    public async Task Audit_logs_created_for_add_update_archive_approve_reject_actions()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, null, null, null, null, null, null, null, null, null, null, true, refs.Employee.Id, null));
        await service.UpdatePartAsync(refs.JobTicket.Id, created.Id, new UpdateJobTicketPartDto(2m, null, null, null, null, null, null, null, null, null, null, "Adjusted", true, null, null, refs.Manager.Id));
        await service.ApprovePartAsync(refs.JobTicket.Id, created.Id, new ApproveJobTicketPartDto(refs.Manager.Id, true));
        await service.RejectPartAsync(refs.JobTicket.Id, created.Id, new RejectJobTicketPartDto("Need review", refs.Manager.Id, true));
        await service.ArchivePartAsync(refs.JobTicket.Id, created.Id, new ArchiveJobTicketPartDto(refs.Manager.Id));

        var logs = await context.AuditLogs.Where(x => x.EntityName == nameof(JobTicketPart)).ToListAsync();

        Assert.Contains(logs, x => x.ActionType == AuditActionType.Create);
        Assert.Contains(logs, x => x.ActionType == AuditActionType.Update);
        Assert.True(logs.Count(x => x.ActionType == AuditActionType.Approval) >= 2);
        Assert.Contains(logs, x => x.ActionType == AuditActionType.Delete);
    }

    [Fact]
    public async Task Add_part_can_save_optional_compatibility_fields()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);
        var installedAtUtc = DateTime.UtcNow.AddHours(-2);
        var removedAtUtc = DateTime.UtcNow.AddHours(-1);

        var created = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(
                refs.Part.Id,
                1m,
                null,
                "Hydraulic",
                "Leak under pressure",
                "Replaced gasket",
                "Torqued to spec",
                installedAtUtc,
                true,
                removedAtUtc,
                null,
                "Observed stable pressure after repair",
                "Tracked for compatibility",
                true,
                refs.Employee.Id,
                null));

        Assert.Equal("Hydraulic", created.ComponentCategory);
        Assert.Equal("Leak under pressure", created.FailureDescription);
        Assert.Equal("Replaced gasket", created.RepairDescription);
        Assert.Equal("Torqued to spec", created.TechnicianNotes);
        Assert.Equal(installedAtUtc, created.InstalledAtUtc);
        Assert.True(created.WasSuccessful);
        Assert.Equal(removedAtUtc, created.RemovedAtUtc);
        Assert.Equal("Observed stable pressure after repair", created.CompatibilityNotes);
    }

    [Fact]
    public async Task Add_part_can_reference_specific_equipment()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        var created = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(refs.Part.Id, 1m, refs.Equipment.Id, null, null, null, null, null, null, null, null, null, null, true, refs.Employee.Id, null));

        Assert.Equal(refs.Equipment.Id, created.EquipmentId);
    }

    [Fact]
    public async Task Add_part_can_reference_replacement_job_ticket_part()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context);

        var replacementPart = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(refs.Part.Id, 1m, null, null, null, null, null, null, null, null, null, null, "replacement", true, refs.Employee.Id, null));

        var created = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(refs.Part.Id, 1m, null, null, null, null, null, null, null, null, replacementPart.Id, null, "legacy part", true, refs.Employee.Id, null));

        Assert.Equal(replacementPart.Id, created.ReplacedByJobTicketPartId);
    }

    private static async Task<SeedRefs> SeedReferencesAsync(ApplicationDbContext context)
    {
        var customer = new Customer { Name = "Customer A" };
        var billingCustomer = new Customer { Name = "Billing Customer" };
        var serviceLocation = new ServiceLocation
        {
            Customer = customer,
            CompanyName = "Customer A",
            LocationName = "Main Site",
            AddressLine1 = "123 Main St",
            City = "Austin",
            State = "TX",
            PostalCode = "78701",
            Country = "USA"
        };

        var manager = new Employee { FirstName = "Manager", LastName = "One", Email = "manager-parts@example.com" };
        var employee = new Employee { FirstName = "Tech", LastName = "One", Email = "tech-parts@example.com" };
        var category = new PartCategory { Name = "General" };
        var part = new Part
        {
            PartCategory = category,
            PartNumber = "P-100",
            Name = "Filter",
            UnitCost = 12.34m,
            UnitPrice = 25.67m,
            QuantityOnHand = 10m,
            ReorderThreshold = 2m
        };
        var equipment = new Equipment
        {
            Customer = customer,
            ServiceLocation = serviceLocation,
            Name = "Pump A"
        };

        context.AddRange(customer, billingCustomer, serviceLocation, manager, employee, category, part, equipment);
        await context.SaveChangesAsync();

        var ticket = new JobTicket
        {
            TicketNumber = $"JT-{DateTime.UtcNow.Year}-000001",
            CustomerId = customer.Id,
            ServiceLocationId = serviceLocation.Id,
            BillingPartyCustomerId = billingCustomer.Id,
            EquipmentId = equipment.Id,
            Title = "Replace filter",
            Status = JobTicketStatus.InProgress,
            Priority = JobTicketPriority.Normal
        };

        context.JobTickets.Add(ticket);
        await context.SaveChangesAsync();

        context.JobTicketEmployees.Add(new JobTicketEmployee
        {
            JobTicketId = ticket.Id,
            EmployeeId = employee.Id,
            AssignedAtUtc = DateTime.UtcNow,
            AssignedByUserId = manager.Id,
            IsLead = true
        });

        await context.SaveChangesAsync();
        return new SeedRefs(ticket, part, manager, employee, equipment);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private sealed record SeedRefs(JobTicket JobTicket, Part Part, Employee Manager, Employee Employee, Equipment Equipment);
}
