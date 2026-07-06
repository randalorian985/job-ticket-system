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
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(refs.Part.Id, 2m, "Used in repair", true, refs.Employee.Id, null));

        Assert.Equal(refs.JobTicket.Id, created.JobTicketId);
        Assert.Equal(refs.Part.Id, created.PartId);
        Assert.Equal(refs.Part.PartNumber, created.PartNumber);
        Assert.Equal(refs.Part.Name, created.PartName);
        Assert.Equal(2m, created.Quantity);
    }

    [Fact]
    public async Task Reject_add_when_job_ticket_does_not_exist()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        await Assert.ThrowsAsync<ValidationException>(() => service.AddPartAsync(Guid.NewGuid(), new AddJobTicketPartDto(refs.Part.Id, 1m, null, true, null, null)));
    }

    [Fact]
    public async Task Reject_add_when_part_does_not_exist()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        await Assert.ThrowsAsync<ValidationException>(() => service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(Guid.NewGuid(), 1m, null, true, null, null)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Reject_zero_or_negative_quantity(decimal quantity)
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        await Assert.ThrowsAsync<ValidationException>(() => service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, quantity, null, true, null, null)));
    }

    [Fact]
    public async Task Captures_price_snapshots_and_master_price_change_does_not_change_existing_snapshot()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, true, refs.Employee.Id, null));
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
    public async Task Update_part_rejects_invalid_approval_status()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(refs.Manager.Id, JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());
        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, true, refs.Employee.Id, null));

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdatePartAsync(refs.JobTicket.Id, created.Id, new UpdateJobTicketPartDto(1m, null, true, (JobPartApprovalStatus)999, null, refs.Manager.Id)));

        Assert.Equal(JobPartApprovalStatus.Pending, context.JobTicketParts.Single(x => x.Id == created.Id).ApprovalStatus);
    }

    [Fact]
    public async Task Employee_part_responses_hide_price_snapshots_while_manager_responses_keep_them()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var managerService = new JobTicketsService(context, new TestCurrentUserContext(refs.Manager.Id, JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var managerCreated = await managerService.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, true, refs.Employee.Id, null));

        var employeeService = new JobTicketsService(context, new TestCurrentUserContext(refs.Employee.Id, JobTicketSystem.Application.Security.SystemRoles.Employee), new NoOpNewTicketNotificationService());
        var employeeListed = await employeeService.ListPartsAsync(refs.JobTicket.Id);
        SeedOpenTimeEntry(context, refs.JobTicket.Id, refs.Employee.Id);
        await context.SaveChangesAsync();
        var employeeUpdated = await employeeService.UpdatePartAsync(refs.JobTicket.Id, managerCreated.Id, new UpdateJobTicketPartDto(1m, "employee note", true, null, null, refs.Employee.Id));

        Assert.Equal(12.34m, managerCreated.UnitCostSnapshot);
        Assert.Equal(25.67m, managerCreated.SalePriceSnapshot);
        Assert.Null(employeeListed.Single().UnitCostSnapshot);
        Assert.Null(employeeListed.Single().SalePriceSnapshot);
        Assert.NotNull(employeeUpdated);
        Assert.Null(employeeUpdated!.UnitCostSnapshot);
        Assert.Null(employeeUpdated.SalePriceSnapshot);
    }

    [Fact]
    public async Task Employee_part_entry_requires_open_time_entry_for_ticket()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var employeeService = new JobTicketsService(context, new TestCurrentUserContext(refs.Employee.Id, JobTicketSystem.Application.Security.SystemRoles.Employee), new NoOpNewTicketNotificationService());

        var exception = await Assert.ThrowsAsync<ValidationException>(() => employeeService.QuickAddPartAsync(
            refs.JobTicket.Id,
            new QuickAddJobTicketPartDto("MISC-FIELD", "Field part", 1m, 0m, 0m, "Used in field", false, refs.Employee.Id, null)));

        Assert.Equal("Clock in to this job ticket before recording field work.", exception.Message);
    }

    [Fact]
    public async Task List_excludes_archived_job_parts()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, true, refs.Employee.Id, null));
        await service.ArchivePartAsync(refs.JobTicket.Id, created.Id, new ArchiveJobTicketPartDto(refs.Manager.Id));

        var listed = await service.ListPartsAsync(refs.JobTicket.Id);

        Assert.Empty(listed);
    }

    [Fact]
    public async Task Approve_job_part_succeeds()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());
        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, true, refs.Employee.Id, null));

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
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());
        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, true, refs.Employee.Id, null));

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
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 3m, null, true, refs.Employee.Id, null, AdjustInventory: true));
        await service.ArchivePartAsync(refs.JobTicket.Id, created.Id, new ArchiveJobTicketPartDto(refs.Manager.Id, RestoreInventory: true));

        var refreshedPart = await context.Parts.SingleAsync(x => x.Id == refs.Part.Id);
        Assert.Equal(10m, refreshedPart.QuantityOnHand);
    }

    [Fact]
    public async Task Add_part_with_inventory_adjustment_records_inventory_history()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 3m, null, true, refs.Employee.Id, null, AdjustInventory: true));

        var refreshedPart = await context.Parts.SingleAsync(x => x.Id == refs.Part.Id);
        var transaction = await context.InventoryTransactions.Include(x => x.StockLocation).SingleAsync(x => x.PartId == refs.Part.Id);
        Assert.Equal(7m, refreshedPart.QuantityOnHand);
        Assert.Equal(InventoryTransactionType.ManualAdjustment, transaction.TransactionType);
        Assert.Equal(-3m, transaction.QuantityDelta);
        Assert.Equal("MAIN", transaction.StockLocation.Code);
        Assert.Contains(refs.JobTicket.TicketNumber, transaction.Reason);
        Assert.NotNull(transaction.Notes);
        Assert.Contains(created.Id.ToString(), transaction.Notes!);
    }

    [Fact]
    public async Task Archive_part_with_inventory_restore_records_inventory_history()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 3m, null, true, refs.Employee.Id, null, AdjustInventory: true));
        await service.ArchivePartAsync(refs.JobTicket.Id, created.Id, new ArchiveJobTicketPartDto(refs.Manager.Id, RestoreInventory: true));

        var refreshedPart = await context.Parts.SingleAsync(x => x.Id == refs.Part.Id);
        var transactions = await context.InventoryTransactions.OrderBy(x => x.QuantityDelta).ToListAsync();
        Assert.Equal(10m, refreshedPart.QuantityOnHand);
        Assert.Equal(2, transactions.Count);
        Assert.Equal(-3m, transactions[0].QuantityDelta);
        Assert.Equal(3m, transactions[1].QuantityDelta);
        Assert.Equal(InventoryTransactionType.ManualAdjustment, transactions[1].TransactionType);
        Assert.NotNull(transactions[1].Notes);
        Assert.Contains(created.Id.ToString(), transactions[1].Notes!);
        Assert.Contains("part archive restore", transactions[1].Reason);
    }

    [Fact]
    public async Task Quick_add_existing_part_number_uses_catalog_part_and_records_inventory_history()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.QuickAddPartAsync(
            refs.JobTicket.Id,
            new QuickAddJobTicketPartDto("p-100", null, 2m, 1m, 2m, "quick existing", true, refs.Employee.Id, null));

        var refreshedPart = await context.Parts.SingleAsync(x => x.Id == refs.Part.Id);
        var transaction = await context.InventoryTransactions.SingleAsync(x => x.PartId == refs.Part.Id);

        Assert.Equal(refs.Part.Id, created.PartId);
        Assert.Equal("P-100", created.PartNumber);
        Assert.Equal("Filter", created.PartName);
        Assert.False(created.IsUnlistedPart);
        Assert.Equal(8m, refreshedPart.QuantityOnHand);
        Assert.Equal(-2m, transaction.QuantityDelta);
        Assert.Contains("quick-add", transaction.Reason);
    }

    [Fact]
    public async Task Quick_add_unlisted_part_tracks_cost_and_billable_price_without_master_part()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.QuickAddPartAsync(
            refs.JobTicket.Id,
            new QuickAddJobTicketPartDto("MISC-1", "One off seal", 1.5m, 4m, 9m, "not in catalog", true, refs.Employee.Id, null));

        Assert.Null(created.PartId);
        Assert.Equal("MISC-1", created.PartNumber);
        Assert.Equal("One off seal", created.PartName);
        Assert.True(created.IsUnlistedPart);
        Assert.Equal(4m, created.UnitCostSnapshot);
        Assert.Equal(9m, created.SalePriceSnapshot);
        Assert.Empty(await context.InventoryTransactions.ToListAsync());
        Assert.Equal(1, await context.Parts.CountAsync());
    }

    [Fact]
    public async Task Quick_add_can_request_office_order()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.QuickAddPartAsync(
            refs.JobTicket.Id,
            new QuickAddJobTicketPartDto("MISC-ORDER", "Return trip fitting", 1m, 11m, 22m, null, true, refs.Employee.Id, null, RequestOfficeOrder: true, OfficeOrderNotes: "Order for return trip"));

        var persisted = await context.JobTicketParts.SingleAsync(x => x.Id == created.Id);

        Assert.True(created.OfficeOrderRequested);
        Assert.NotNull(created.OfficeOrderRequestedAtUtc);
        Assert.Equal("Order for return trip", created.OfficeOrderNotes);
        Assert.True(persisted.OfficeOrderRequested);
        Assert.NotNull(persisted.OfficeOrderRequestedAtUtc);
        Assert.Equal("Order for return trip", persisted.OfficeOrderNotes);
    }

    [Fact]
    public async Task Audit_logs_created_for_add_update_archive_approve_reject_actions()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.AddPartAsync(refs.JobTicket.Id, new AddJobTicketPartDto(refs.Part.Id, 1m, null, true, refs.Employee.Id, null));
        await service.UpdatePartAsync(refs.JobTicket.Id, created.Id, new UpdateJobTicketPartDto(2m, "Adjusted", true, null, null, refs.Manager.Id));
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
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());
        var installedAtUtc = DateTime.UtcNow.AddHours(-2);
        var removedAtUtc = DateTime.UtcNow.AddHours(-1);

        var created = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(
                refs.Part.Id,
                1m,
                "Tracked for compatibility",
                true,
                refs.Employee.Id,
                null,
                ComponentCategory: "Hydraulic",
                FailureDescription: "Leak under pressure",
                RepairDescription: "Replaced gasket",
                TechnicianNotes: "Torqued to spec",
                InstalledAtUtc: installedAtUtc,
                WasSuccessful: true,
                RemovedAtUtc: removedAtUtc,
                CompatibilityNotes: "Observed stable pressure after repair"));

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
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var created = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(refs.Part.Id, 1m, null, true, refs.Employee.Id, null, EquipmentId: refs.Equipment.Id));

        Assert.Equal(refs.Equipment.Id, created.EquipmentId);
    }

    [Fact]
    public async Task Add_part_can_reference_replacement_job_ticket_part()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketsService(context, new TestCurrentUserContext(Guid.NewGuid(), JobTicketSystem.Application.Security.SystemRoles.Manager), new NoOpNewTicketNotificationService());

        var replacementPart = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(refs.Part.Id, 1m, "replacement", true, refs.Employee.Id, null));

        var created = await service.AddPartAsync(
            refs.JobTicket.Id,
            new AddJobTicketPartDto(refs.Part.Id, 1m, "legacy part", true, refs.Employee.Id, null, ReplacedByJobTicketPartId: replacementPart.Id));

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

    private static void SeedOpenTimeEntry(ApplicationDbContext context, Guid jobTicketId, Guid employeeId)
    {
        context.TimeEntries.Add(new TimeEntry
        {
            JobTicketId = jobTicketId,
            EmployeeId = employeeId,
            StartedAtUtc = DateTime.UtcNow,
            ClockInLatitude = 30m,
            ClockInLongitude = -97m,
            ClockInDeviceMetadata = "test"
        });
    }

    private sealed record SeedRefs(JobTicket JobTicket, Part Part, Employee Manager, Employee Employee, Equipment Equipment);
}
