using System.Net;
using System.Net.Http.Json;
using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class JobTicketsControllerIntegrationTests
{
    [Fact]
    public async Task Create_returns_created_with_retrievable_location()
    {
        await using var factory = new TestApiFactory();
        var customerId = Guid.Empty;
        var serviceLocationId = Guid.Empty;

        await factory.SeedAsync(async (db, auth) =>
        {
            db.Employees.Add(new Employee
            {
                FirstName = "Manager",
                LastName = "User",
                UserName = "manager",
                Email = "manager@example.com",
                Role = "Manager",
                PasswordHash = auth.HashPassword("ManagerPass!123")
            });

            var customer = new Customer { Name = "Quick Add Customer" };
            var serviceLocation = new ServiceLocation
            {
                CustomerId = customer.Id,
                CompanyName = customer.Name,
                LocationName = "Quick Add Location",
                AddressLine1 = "123 Green St",
                City = "Houma",
                State = "LA",
                PostalCode = "70360",
                Country = "USA"
            };

            db.AddRange(customer, serviceLocation);
            await db.SaveChangesAsync();
            customerId = customer.Id;
            serviceLocationId = serviceLocation.Id;
        });

        var client = factory.CreateClient();
        await client.SetBearerTokenAsync("manager", "ManagerPass!123");

        var response = await client.PostAsJsonAsync(
            "/api/job-tickets",
            new CreateJobTicketDto(
                CustomerId: customerId,
                ServiceLocationId: serviceLocationId,
                BillingPartyCustomerId: customerId,
                EquipmentId: null,
                Title: "Repair rental crane",
                Description: null,
                JobType: "Repair",
                Priority: JobTicketPriority.Normal,
                Status: JobTicketStatus.Draft,
                LocationType: WorkLocationType.CustomerSite,
                RequestedAtUtc: DateTime.UtcNow,
                ScheduledStartAtUtc: null,
                DueAtUtc: null,
                AssignedManagerEmployeeId: null,
                PurchaseOrderNumber: null,
                BillingContactName: null,
                BillingContactPhone: null,
                BillingContactEmail: null,
                InternalNotes: null,
                CustomerFacingNotes: null));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<JobTicketDto>();
        Assert.NotNull(created);
        Assert.Equal($"/api/job-tickets/{created!.Id}", response.Headers.Location?.AbsolutePath);

        var getResponse = await client.GetAsync(response.Headers.Location);
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }
}
