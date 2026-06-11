using System.Text.Json;
using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PartRequestsServiceTests
{
    [Fact]
    public async Task Assigned_employee_can_create_part_request_without_cost_or_price()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new PartRequestsService(context, new TestUserContext(refs.Employee.Id, SystemRoles.Employee));

        var created = await service.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto("Hydraulic hose", 2m, "Need replacement hose", "High", DateTime.UtcNow.AddDays(1)));

        Assert.Equal("Hydraulic hose", created.PartName);
        Assert.Equal(2m, created.Quantity);
        Assert.True(created.NeedsOrdered);
        Assert.Equal(JobPartApprovalStatus.Pending, created.Status);
        Assert.False(created.IsBillable);
        Assert.Equal(0m, created.UnitCostSnapshot);
        Assert.Equal(0m, created.SalePriceSnapshot);
        Assert.Null(created.PartId);

        var persisted = await context.JobTicketParts.SingleAsync(x => x.Id == created.Id);
        Assert.True(persisted.OfficeOrderRequested);
        Assert.True(persisted.IsUnlistedPart);
        Assert.False(persisted.IsBillable);
        Assert.Equal(0m, persisted.UnitCostSnapshot);
        Assert.Equal(0m, persisted.SalePriceSnapshot);
        Assert.Contains("Urgency: High", persisted.OfficeOrderNotes);
    }

    [Fact]
    public async Task Assigned_employee_can_select_existing_part_without_exposing_cost_or_price()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new PartRequestsService(context, new TestUserContext(refs.Employee.Id, SystemRoles.Employee));

        var created = await service.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto(
                refs.Part.Name,
                1m,
                "Need the catalog hose ordered for this ticket.",
                PartId: refs.Part.Id,
                NeedsOrdered: true));

        Assert.Equal(refs.Part.Id, created.PartId);
        Assert.Equal(refs.Part.PartNumber, created.PartNumber);
        Assert.Equal(refs.Part.Name, created.PartName);
        Assert.True(created.NeedsOrdered);
        Assert.False(created.IsBillable);
        Assert.Equal(0m, created.UnitCostSnapshot);
        Assert.Equal(0m, created.SalePriceSnapshot);

        var persisted = await context.JobTicketParts.SingleAsync(x => x.Id == created.Id);
        Assert.False(persisted.IsUnlistedPart);
        Assert.True(persisted.OfficeOrderRequested);
        Assert.Equal(refs.Part.Id, persisted.PartId);
        Assert.Equal(0m, persisted.UnitCostSnapshot);
        Assert.Equal(0m, persisted.SalePriceSnapshot);
    }

    [Fact]
    public async Task Needs_ordered_false_records_ticket_part_without_back_office_queue_item()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var employeeService = new PartRequestsService(context, new TestUserContext(refs.Employee.Id, SystemRoles.Employee));

        var created = await employeeService.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto(
                refs.Part.Name,
                1m,
                "Installed from truck stock; no order needed.",
                PartId: refs.Part.Id,
                NeedsOrdered: false));

        Assert.False(created.NeedsOrdered);
        Assert.Equal(refs.Part.Id, created.PartId);
        Assert.Equal(JobPartApprovalStatus.Pending, created.Status);
        Assert.Equal(0m, created.UnitCostSnapshot);
        Assert.Equal(0m, created.SalePriceSnapshot);

        var persisted = await context.JobTicketParts.SingleAsync(x => x.Id == created.Id);
        Assert.False(persisted.OfficeOrderRequested);
        Assert.Null(persisted.OfficeOrderRequestedAtUtc);
        Assert.Null(persisted.OfficeOrderNotes);

        var managerService = new PartRequestsService(context, new TestUserContext(refs.Manager.Id, SystemRoles.Manager));
        var queue = await managerService.ListQueueAsync();
        Assert.Empty(queue);
    }

    [Fact]
    public async Task Technician_safe_part_lookup_does_not_return_pricing_or_inventory_fields()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new PartsService(context);

        var lookup = await service.ListLookupAsync(new PagedQuery(0, 10));
        var item = Assert.Single(lookup);
        Assert.Equal(refs.Part.Id, item.Id);
        Assert.Equal(refs.Part.PartNumber, item.PartNumber);
        Assert.Equal(refs.Part.Name, item.Name);

        var json = JsonSerializer.Serialize(item, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        Assert.DoesNotContain("unitCost", json);
        Assert.DoesNotContain("unitPrice", json);
        Assert.DoesNotContain("quantityOnHand", json);
        Assert.DoesNotContain("reorderThreshold", json);
        Assert.DoesNotContain("vendor", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Queue_filters_by_status_and_search_for_back_office_review()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var employeeService = new PartRequestsService(context, new TestUserContext(refs.Employee.Id, SystemRoles.Employee));
        await employeeService.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto("Hydraulic hose", 2m, "Need replacement hose"));
        var rejected = await employeeService.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto("Seal kit", 1m, "Wrong size on truck"));

        var managerService = new PartRequestsService(context, new TestUserContext(refs.Manager.Id, SystemRoles.Manager));
        await managerService.UpdateBackOfficeAsync(
            rejected.Id,
            new UpdatePartRequestDto("Seal kit", 1m, JobPartApprovalStatus.Rejected, "Need more detail.", 0m, 0m, false));

        var pendingHose = await managerService.ListQueueAsync(new PartRequestQueueQuery(JobPartApprovalStatus.Pending, "Hydraulic hose"));
        var rejectedSeal = await managerService.ListQueueAsync(new PartRequestQueueQuery(JobPartApprovalStatus.Rejected, "Seal kit"));

        Assert.Single(pendingHose);
        Assert.Equal("Hydraulic hose", pendingHose[0].PartName);
        Assert.Single(rejectedSeal);
        Assert.Equal(JobPartApprovalStatus.Rejected, rejectedSeal[0].Status);
    }

    [Fact]
    public async Task Queue_orders_requests_by_most_recent_request_first()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var employeeService = new PartRequestsService(context, new TestUserContext(refs.Employee.Id, SystemRoles.Employee));
        var older = await employeeService.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto("Older request", 1m, null));
        var newer = await employeeService.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto("Newer request", 1m, null));

        var olderEntity = await context.JobTicketParts.SingleAsync(x => x.Id == older.Id);
        var newerEntity = await context.JobTicketParts.SingleAsync(x => x.Id == newer.Id);
        olderEntity.AddedAtUtc = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        newerEntity.AddedAtUtc = new DateTime(2026, 1, 2, 12, 0, 0, DateTimeKind.Utc);
        await context.SaveChangesAsync();

        var managerService = new PartRequestsService(context, new TestUserContext(refs.Manager.Id, SystemRoles.Manager));
        var queue = await managerService.ListQueueAsync();

        Assert.Equal([newer.Id, older.Id], queue.Select(x => x.Id));
    }

    [Fact]
    public async Task Unassigned_employee_cannot_create_part_request_for_ticket()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var otherEmployee = new Employee
        {
            FirstName = "Other",
            LastName = "Tech",
            Email = "other-tech@example.com",
            Role = SystemRoles.Employee,
            Status = EmployeeStatus.Active
        };
        context.Employees.Add(otherEmployee);
        await context.SaveChangesAsync();

        var service = new PartRequestsService(context, new TestUserContext(otherEmployee.Id, SystemRoles.Employee));

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto("Hydraulic hose", 1m, null)));
    }

    [Fact]
    public async Task Assigned_employee_cannot_create_part_request_until_clocked_into_ticket()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        context.TimeEntries.RemoveRange(context.TimeEntries);
        await context.SaveChangesAsync();

        var service = new PartRequestsService(context, new TestUserContext(refs.Employee.Id, SystemRoles.Employee));

        var exception = await Assert.ThrowsAsync<ValidationException>(() => service.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto("Hydraulic hose", 1m, null)));

        Assert.Equal("Clock in to this job ticket before recording field work.", exception.Message);
    }

    [Fact]
    public async Task Back_office_can_view_and_update_request_status_cost_price_and_catalog_match()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var employeeService = new PartRequestsService(context, new TestUserContext(refs.Employee.Id, SystemRoles.Employee));
        var created = await employeeService.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto("Hydraulic hose", 2m, "Need replacement hose"));

        var managerService = new PartRequestsService(context, new TestUserContext(refs.Manager.Id, SystemRoles.Manager));
        var queue = await managerService.ListQueueAsync();
        Assert.Single(queue);

        var updated = await managerService.UpdateBackOfficeAsync(
            created.Id,
            new UpdatePartRequestDto(
                refs.Part.Name,
                2m,
                JobPartApprovalStatus.Approved,
                "Matched to catalog and approved for billing.",
                50m,
                75m,
                true,
                refs.Part.Id));

        Assert.NotNull(updated);
        Assert.Equal(refs.Part.Id, updated!.PartId);
        Assert.Equal(refs.Part.PartNumber, updated.PartNumber);
        Assert.Equal(refs.Part.Name, updated.PartName);
        Assert.Equal(JobPartApprovalStatus.Approved, updated.Status);
        Assert.True(updated.IsBillable);
        Assert.True(updated.NeedsOrdered);
        Assert.Equal(50m, updated.UnitCostSnapshot);
        Assert.Equal(75m, updated.SalePriceSnapshot);
        Assert.Equal("Matched to catalog and approved for billing.", updated.InternalStatusNotes);

        var persisted = await context.JobTicketParts.SingleAsync(x => x.Id == created.Id);
        Assert.False(persisted.IsUnlistedPart);
        Assert.Equal(refs.Part.Id, persisted.PartId);
        Assert.NotNull(persisted.ApprovedAtUtc);
    }

    [Fact]
    public async Task Employee_cannot_view_queue_or_update_back_office_fields()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new PartRequestsService(context, new TestUserContext(refs.Employee.Id, SystemRoles.Employee));
        var created = await service.CreateForJobTicketAsync(
            refs.JobTicket.Id,
            new CreatePartRequestDto("Hydraulic hose", 1m, null));

        await Assert.ThrowsAsync<ValidationException>(() => service.ListQueueAsync());
        await Assert.ThrowsAsync<ValidationException>(() => service.UpdateBackOfficeAsync(
            created.Id,
            new UpdatePartRequestDto("Hydraulic hose", 1m, JobPartApprovalStatus.Approved, "employee should not update", 10m, 20m, true)));

        var persisted = await context.JobTicketParts.SingleAsync(x => x.Id == created.Id);
        Assert.Equal(JobPartApprovalStatus.Pending, persisted.ApprovalStatus);
        Assert.False(persisted.IsBillable);
        Assert.Equal(0m, persisted.UnitCostSnapshot);
        Assert.Equal(0m, persisted.SalePriceSnapshot);
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
        var manager = new Employee
        {
            FirstName = "Manager",
            LastName = "One",
            Email = "manager-part-request@example.com",
            Role = SystemRoles.Manager,
            Status = EmployeeStatus.Active
        };
        var employee = new Employee
        {
            FirstName = "Tech",
            LastName = "One",
            Email = "tech-part-request@example.com",
            Role = SystemRoles.Employee,
            Status = EmployeeStatus.Active
        };
        var category = new PartCategory { Name = "Hydraulics" };
        var part = new Part
        {
            PartCategory = category,
            PartNumber = "HYD-100",
            Name = "Hydraulic Hose",
            UnitCost = 50m,
            UnitPrice = 75m,
            QuantityOnHand = 5m,
            ReorderThreshold = 1m
        };
        var equipment = new Equipment
        {
            Customer = customer,
            ServiceLocation = serviceLocation,
            Name = "Lift A"
        };

        context.AddRange(customer, billingCustomer, serviceLocation, manager, employee, category, part, equipment);
        await context.SaveChangesAsync();

        var ticket = new JobTicket
        {
            TicketNumber = $"JT-{DateTime.UtcNow.Year}-000201",
            CustomerId = customer.Id,
            ServiceLocationId = serviceLocation.Id,
            BillingPartyCustomerId = billingCustomer.Id,
            EquipmentId = equipment.Id,
            Title = "Repair lift",
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
        context.TimeEntries.Add(new TimeEntry
        {
            JobTicketId = ticket.Id,
            EmployeeId = employee.Id,
            StartedAtUtc = DateTime.UtcNow,
            ClockInLatitude = 30m,
            ClockInLongitude = -97m,
            ClockInDeviceMetadata = "test"
        });
        await context.SaveChangesAsync();

        return new SeedRefs(ticket, manager, employee, part);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private sealed record SeedRefs(JobTicket JobTicket, Employee Manager, Employee Employee, Part Part);

    private sealed class TestUserContext(Guid employeeId, string role) : ICurrentUserContext
    {
        public Guid UserId { get; } = employeeId;
        public Guid EmployeeId { get; } = employeeId;
        public string Role { get; } = role;
        public bool IsAuthenticated => true;
        public bool IsAdmin => Role == SystemRoles.Admin;
        public bool IsManager => Role is SystemRoles.Admin or SystemRoles.Manager;
        public bool IsEmployee => Role is SystemRoles.Admin or SystemRoles.Manager or SystemRoles.Employee;
    }
}
