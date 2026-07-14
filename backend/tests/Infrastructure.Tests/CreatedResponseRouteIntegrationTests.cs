using System.Net;
using System.Net.Http.Json;
using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class CreatedResponseRouteIntegrationTests
{
    [Fact]
    public async Task User_create_returns_created_with_retrievable_location()
    {
        await using var factory = new TestApiFactory();
        await factory.SeedAsync(async (db, auth) =>
        {
            db.Employees.Add(new Employee
            {
                FirstName = "Admin",
                LastName = "User",
                UserName = "admin",
                Email = "admin@example.com",
                Role = SystemRoles.Admin,
                PasswordHash = auth.HashPassword("AdminPass!123")
            });
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();
        await client.SetBearerTokenAsync("admin", "AdminPass!123");

        var response = await client.PostAsJsonAsync(
            "/api/users",
            new CreateUserDto(
                "route.test.user",
                "route.test.user@example.com",
                "Route",
                "Test",
                SystemRoles.Employee,
                "TempPass!123"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(created);
        Assert.Equal($"/api/users/{created!.Id}", response.Headers.Location?.AbsolutePath);

        var getResponse = await client.GetAsync(response.Headers.Location);
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    [Fact]
    public async Task Part_request_create_returns_created_with_retrievable_location()
    {
        await using var factory = new TestApiFactory();
        var jobTicketId = Guid.Empty;

        await factory.SeedAsync(async (db, auth) =>
        {
            db.Employees.Add(new Employee
            {
                FirstName = "Manager",
                LastName = "User",
                UserName = "manager",
                Email = "manager@example.com",
                Role = SystemRoles.Manager,
                PasswordHash = auth.HashPassword("ManagerPass!123")
            });

            var customer = new Customer { Name = "Route Test Customer" };
            var serviceLocation = new ServiceLocation
            {
                CustomerId = customer.Id,
                CompanyName = customer.Name,
                LocationName = "Route Test Location",
                AddressLine1 = "123 Main St",
                City = "Houma",
                State = "LA",
                PostalCode = "70360",
                Country = "USA"
            };
            var jobTicket = new JobTicket
            {
                TicketNumber = "JT-ROUTE-TEST",
                CustomerId = customer.Id,
                ServiceLocationId = serviceLocation.Id,
                BillingPartyCustomerId = customer.Id,
                Title = "Part request route test",
                Status = JobTicketStatus.InProgress
            };

            db.AddRange(customer, serviceLocation, jobTicket);
            await db.SaveChangesAsync();
            jobTicketId = jobTicket.Id;
        });

        var client = factory.CreateClient();
        await client.SetBearerTokenAsync("manager", "ManagerPass!123");

        var response = await client.PostAsJsonAsync(
            $"/api/part-requests/job-ticket/{jobTicketId}",
            new CreatePartRequestDto("Hydraulic hose", 1m, "Response route regression test"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<PartRequestDto>();
        Assert.NotNull(created);
        Assert.Equal($"/api/part-requests/{created!.Id}", response.Headers.Location?.AbsolutePath);

        var getResponse = await client.GetAsync(response.Headers.Location);
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }
}
