using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class JobTicketPartBillingBoundaryTests
{
    [Fact]
    public async Task Employee_cannot_change_job_part_billable_state_through_update()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context, isBillable: false);
        var service = new JobTicketAssignmentValidatingService(
            context,
            new BillingBoundaryCurrentUserContext(refs.Employee.Id, SystemRoles.Employee));

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdatePartAsync(
            refs.JobTicket.Id,
            refs.JobTicketPart.Id,
            new UpdateJobTicketPartDto(1m, "field note", true, null, null, refs.Employee.Id)));

        var persisted = await context.JobTicketParts.SingleAsync(x => x.Id == refs.JobTicketPart.Id);
        Assert.False(persisted.IsBillable);
    }

    [Fact]
    public async Task Employee_can_update_field_part_details_when_billable_state_is_unchanged()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context, isBillable: false);
        var service = new JobTicketAssignmentValidatingService(
            context,
            new BillingBoundaryCurrentUserContext(refs.Employee.Id, SystemRoles.Employee));

        var updated = await service.UpdatePartAsync(
            refs.JobTicket.Id,
            refs.JobTicketPart.Id,
            new UpdateJobTicketPartDto(2m, "used on boom cylinder", false, null, null, refs.Employee.Id));

        Assert.NotNull(updated);
        Assert.Equal(2m, updated!.Quantity);
        Assert.Equal("used on boom cylinder", updated.Notes);
        Assert.False(updated.IsBillable);
    }

    [Fact]
    public async Task Manager_can_change_job_part_billable_state_through_update()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context, isBillable: false);
        var service = new JobTicketAssignmentValidatingService(
            context,
            new BillingBoundaryCurrentUserContext(refs.Manager.Id, SystemRoles.Manager));

        var updated = await service.UpdatePartAsync(
            refs.JobTicket.Id,
            refs.JobTicketPart.Id,
            new UpdateJobTicketPartDto(1m, "back office billing review", true, null, null, refs.Manager.Id));

        Assert.NotNull(updated);
        Assert.True(updated!.IsBillable);
    }

    private static async Task<SeedRefs> SeedReferencesAsync(ApplicationDbContext context, bool isBillable)
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
            Email = "manager-billing-boundary@example.com",
            Role = SystemRoles.Manager,
            Status = EmployeeStatus.Active
        };
        var employee = new Employee
        {
            FirstName = "Tech",
            LastName = "One",
            Email = "tech-billing-boundary@example.com",
            Role = SystemRoles.Employee,
            Status = EmployeeStatus.Active
        };
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
        context.TimeEntries.Add(new TimeEntry
        {
            JobTicketId = ticket.Id,
            EmployeeId = employee.Id,
            StartedAtUtc = DateTime.UtcNow,
            ClockInLatitude = 30m,
            ClockInLongitude = -97m,
            ClockInDeviceMetadata = "test"
        });

        var jobTicketPart = new JobTicketPart
        {
            JobTicketId = ticket.Id,
            PartId = part.Id,
            PartNumberSnapshot = part.PartNumber,
            PartNameSnapshot = part.Name,
            Quantity = 1m,
            UnitCostSnapshot = part.UnitCost,
            SalePriceSnapshot = part.UnitPrice,
            IsBillable = isBillable,
            Notes = "initial field note",
            ApprovalStatus = JobPartApprovalStatus.Pending,
            AddedAtUtc = DateTime.UtcNow,
            AddedByEmployeeId = employee.Id,
            AddedByUserId = employee.Id,
            Status = PartTransactionStatus.Used
        };

        context.JobTicketParts.Add(jobTicketPart);
        await context.SaveChangesAsync();

        return new SeedRefs(ticket, jobTicketPart, manager, employee);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private sealed record SeedRefs(JobTicket JobTicket, JobTicketPart JobTicketPart, Employee Manager, Employee Employee);

    private sealed class BillingBoundaryCurrentUserContext(Guid employeeId, string role) : ICurrentUserContext
    {
        public Guid UserId { get; } = employeeId;
        public Guid EmployeeId { get; } = employeeId;
        public string Role { get; } = role;
        public bool IsAuthenticated => true;
        public bool IsAdmin => Role == SystemRoles.Admin;
        public bool IsManager => Role is SystemRoles.Admin or SystemRoles.Manager;
        public bool IsEmployee => Role == SystemRoles.Employee;
    }
}
