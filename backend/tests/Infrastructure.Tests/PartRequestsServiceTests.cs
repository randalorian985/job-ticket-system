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
