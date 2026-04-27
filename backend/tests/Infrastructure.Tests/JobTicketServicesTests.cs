using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class JobTicketServicesTests
{
    [Fact]
    public async Task Create_job_ticket_with_valid_references_succeeds()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);

        var created = await service.CreateAsync(BuildCreateRequest(refs));

        Assert.Equal(refs.Customer.Id, created.CustomerId);
        Assert.Equal(refs.ServiceLocation.Id, created.ServiceLocationId);
        Assert.Equal(refs.BillingCustomer.Id, created.BillingPartyCustomerId);
    }

    [Fact]
    public async Task Create_rejects_when_billing_party_missing()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);

        var request = BuildCreateRequest(refs) with { BillingPartyCustomerId = Guid.NewGuid() };
        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(request));
    }

    [Fact]
    public async Task Create_rejects_when_service_location_missing()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);

        var request = BuildCreateRequest(refs) with { ServiceLocationId = Guid.NewGuid() };
        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(request));
    }

    [Fact]
    public async Task Create_auto_generates_job_ticket_number()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);

        var created = await service.CreateAsync(BuildCreateRequest(refs));

        Assert.StartsWith($"JT-{DateTime.UtcNow.Year}-", created.TicketNumber);
    }

    [Fact]
    public async Task Assign_employee_to_job_ticket_succeeds()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);
        var ticket = await service.CreateAsync(BuildCreateRequest(refs));

        var assignment = await service.AddAssignmentAsync(ticket.Id, new AddJobTicketAssignmentDto(refs.Employee.Id));

        Assert.Equal(refs.Employee.Id, assignment.EmployeeId);
    }

    [Fact]
    public async Task Duplicate_employee_assignment_is_rejected()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);
        var ticket = await service.CreateAsync(BuildCreateRequest(refs));

        await service.AddAssignmentAsync(ticket.Id, new AddJobTicketAssignmentDto(refs.Employee.Id));
        await Assert.ThrowsAsync<ValidationException>(() => service.AddAssignmentAsync(ticket.Id, new AddJobTicketAssignmentDto(refs.Employee.Id)));
    }

    [Fact]
    public async Task Archive_job_ticket_with_reason_succeeds()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);
        var ticket = await service.CreateAsync(BuildCreateRequest(refs));

        var archived = await service.ArchiveAsync(ticket.Id, new ArchiveJobTicketDto("Duplicate request"));

        Assert.NotNull(archived);
        Assert.Equal("Duplicate request", archived!.ArchiveReason);
    }

    [Fact]
    public async Task Archive_without_reason_is_rejected()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);
        var ticket = await service.CreateAsync(BuildCreateRequest(refs));

        await Assert.ThrowsAsync<ValidationException>(() => service.ArchiveAsync(ticket.Id, new ArchiveJobTicketDto("   ")));
    }

    [Fact]
    public async Task Change_status_to_completed_sets_completed_date()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);
        var ticket = await service.CreateAsync(BuildCreateRequest(refs));

        var updated = await service.ChangeStatusAsync(ticket.Id, new ChangeJobTicketStatusDto(JobTicketStatus.Completed));

        Assert.NotNull(updated);
        Assert.NotNull(updated!.CompletedAtUtc);
    }

    [Fact]
    public async Task Archived_job_tickets_are_excluded_from_normal_list()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);
        var ticket = await service.CreateAsync(BuildCreateRequest(refs));

        await service.ArchiveAsync(ticket.Id, new ArchiveJobTicketDto("No longer needed"));
        var listed = await service.ListAsync(new JobTicketListQuery(null, null, null, null, null));

        Assert.Empty(listed);
    }

    [Fact]
    public async Task Add_work_entry_to_job_ticket_succeeds()
    {
        await using var context = CreateContext();
        var refs = await SeedCoreReferencesAsync(context);
        var service = new JobTicketsService(context);
        var ticket = await service.CreateAsync(BuildCreateRequest(refs));

        var entry = await service.AddWorkEntryAsync(ticket.Id, new AddJobWorkEntryDto(refs.Employee.Id, WorkEntryType.Note, "Initial inspection complete", null));

        Assert.Equal(ticket.Id, entry.JobTicketId);
        Assert.Equal("Initial inspection complete", entry.Notes);
    }

    private static CreateJobTicketDto BuildCreateRequest(SeedRefs refs)
        => new(
            refs.Customer.Id,
            refs.ServiceLocation.Id,
            refs.BillingCustomer.Id,
            refs.Equipment.Id,
            "Inspect compressor",
            "Investigate performance issue",
            "Repair",
            JobTicketPriority.Normal,
            JobTicketStatus.Submitted,
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            refs.Manager.Id,
            "PO-123",
            "Billing Contact",
            "555-0100",
            "billing@example.com",
            "Internal note",
            "Customer note");

    private static async Task<SeedRefs> SeedCoreReferencesAsync(ApplicationDbContext context)
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
        var manager = new Employee { FirstName = "Manager", LastName = "One", Email = "manager@example.com" };
        var employee = new Employee { FirstName = "Tech", LastName = "One", Email = "tech@example.com" };

        context.AddRange(customer, billingCustomer, location, manager, employee);
        await context.SaveChangesAsync();

        var equipment = new Equipment
        {
            CustomerId = customer.Id,
            ServiceLocationId = location.Id,
            Name = "Compressor"
        };

        context.Equipment.Add(equipment);
        await context.SaveChangesAsync();

        return new SeedRefs(customer, billingCustomer, location, equipment, manager, employee);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private sealed record SeedRefs(Customer Customer, Customer BillingCustomer, ServiceLocation ServiceLocation, Equipment Equipment, Employee Manager, Employee Employee);
}
