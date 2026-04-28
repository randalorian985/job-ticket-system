using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Application.TimeEntries;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class AuthIntegrationTests
{
    [Fact]
    public async Task Login_succeeds_with_valid_credentials_and_password_is_hashed()
    {
        await using var factory = new TestApiFactory();
        await factory.SeedAsync((db, auth) => SeedUsersAsync(db, auth));

        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new AuthLoginRequestDto("admin", "AdminPass!123"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var stored = await db.Employees.SingleAsync(x => x.UserName == "admin");
        Assert.NotNull(stored.PasswordHash);
        Assert.DoesNotContain("AdminPass!123", stored.PasswordHash!);
    }

    [Fact]
    public async Task Login_fails_with_invalid_credentials()
    {
        await using var factory = new TestApiFactory();
        await factory.SeedAsync((db, auth) => SeedUsersAsync(db, auth));
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new AuthLoginRequestDto("admin", "wrong-password"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Unauthenticated_requests_are_rejected_for_protected_endpoints()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/reports/jobs-ready-to-invoice");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Employee_cannot_archive_job_ticket_and_can_only_access_assigned_job()
    {
        await using var factory = new TestApiFactory();
        await factory.SeedAsync(async (db, auth) =>
        {
            var refs = await SeedDataAsync(db, auth);
            db.JobTicketEmployees.Add(new JobTicketEmployee { JobTicketId = refs.AssignedJob.Id, EmployeeId = refs.Employee.Id, AssignedAtUtc = DateTime.UtcNow });
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();
        await client.SetBearerTokenAsync("employee", "EmployeePass!123");

        var jobs = await client.GetFromJsonAsync<List<JobTicketListItemDto>>("/api/job-tickets");
        Assert.Single(jobs!);

        var unassigned = await factory.GetUnassignedJobIdAsync();
        var getUnassigned = await client.GetAsync($"/api/job-tickets/{unassigned}");
        Assert.Equal(HttpStatusCode.NotFound, getUnassigned.StatusCode);

        var assigned = await factory.GetAssignedJobIdAsync();
        var archive = await client.PostAsJsonAsync($"/api/job-tickets/{assigned}/archive", new ArchiveJobTicketDto("should fail"));
        Assert.Equal(HttpStatusCode.Forbidden, archive.StatusCode);
    }

    [Fact]
    public async Task Employee_clock_in_and_file_upload_require_assigned_job()
    {
        await using var factory = new TestApiFactory();
        await factory.SeedAsync((db, auth) => SeedDataAsync(db, auth));

        var client = factory.CreateClient();
        await client.SetBearerTokenAsync("employee", "EmployeePass!123");

        var assigned = await factory.GetAssignedJobIdAsync();
        var unassigned = await factory.GetUnassignedJobIdAsync();
        var employeeId = await factory.GetEmployeeIdAsync();

        var okClockIn = await client.PostAsJsonAsync("/api/time-entries/clock-in", new ClockInRequestDto(assigned, employeeId, 30m, -97m, null, "Android", null));
        Assert.Equal(HttpStatusCode.OK, okClockIn.StatusCode);

        var badClockIn = await client.PostAsJsonAsync("/api/time-entries/clock-in", new ClockInRequestDto(unassigned, employeeId, 30m, -97m, null, "Android", null));
        Assert.Equal(HttpStatusCode.BadRequest, badClockIn.StatusCode);

        var fileContent = new StreamContent(new MemoryStream([1, 2, 3]));
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        var form = new MultipartFormDataContent
        {
            { fileContent, "File", "photo.jpg" }
        };

        var uploadAssigned = await client.PostAsync($"/api/job-tickets/{assigned}/files", form);
        Assert.NotEqual(HttpStatusCode.Forbidden, uploadAssigned.StatusCode);

        var uploadUnassigned = await client.PostAsync($"/api/job-tickets/{unassigned}/files", form);
        Assert.Equal(HttpStatusCode.Forbidden, uploadUnassigned.StatusCode);
    }

    [Fact]
    public async Task Assigned_employee_file_upload_returns_created_with_safe_location_header()
    {
        await using var factory = new TestApiFactory();
        await factory.SeedAsync(async (db, auth) =>
        {
            var refs = await SeedDataAsync(db, auth);
            db.JobTicketEmployees.Add(new JobTicketEmployee
            {
                JobTicketId = refs.AssignedJob.Id,
                EmployeeId = refs.Employee.Id,
                AssignedAtUtc = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();
        await client.SetBearerTokenAsync("employee", "EmployeePass!123");
        var assigned = await factory.GetAssignedJobIdAsync();

        using var fileContent = new StreamContent(new MemoryStream([1, 2, 3, 4]));
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        using var form = new MultipartFormDataContent
        {
            { fileContent, "File", "photo.jpg" }
        };

        var response = await client.PostAsync($"/api/job-tickets/{assigned}/files", form);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var location = response.Headers.Location!.ToString();
        Assert.StartsWith($"/api/job-tickets/{assigned}/files/", location, StringComparison.Ordinal);
        Assert.DoesNotContain("\\", location, StringComparison.Ordinal);
        Assert.DoesNotContain("uploads", location, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("storage", location, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("blob", location, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("key=", location, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Manager_or_admin_can_view_reports_but_employee_cannot_and_manager_can_approve_reject_time()
    {
        await using var factory = new TestApiFactory();
        await factory.SeedAsync((db, auth) => SeedDataAsync(db, auth));

        var managerClient = factory.CreateClient();
        await managerClient.SetBearerTokenAsync("manager", "ManagerPass!123");
        var reportOk = await managerClient.GetAsync("/api/reports/jobs-ready-to-invoice");
        Assert.Equal(HttpStatusCode.OK, reportOk.StatusCode);

        var adminClient = factory.CreateClient();
        await adminClient.SetBearerTokenAsync("admin", "AdminPass!123");
        var adminReport = await adminClient.GetAsync("/api/reports/jobs-ready-to-invoice");
        Assert.Equal(HttpStatusCode.OK, adminReport.StatusCode);

        var employeeClient = factory.CreateClient();
        await employeeClient.SetBearerTokenAsync("employee", "EmployeePass!123");
        var employeeReport = await employeeClient.GetAsync("/api/reports/jobs-ready-to-invoice");
        Assert.Equal(HttpStatusCode.Forbidden, employeeReport.StatusCode);

        var entryId = await factory.CreateTimeEntryAsync();
        var approve = await managerClient.PostAsJsonAsync($"/api/time-entries/{entryId}/approve", new ApproveTimeEntryRequestDto(Guid.Empty));
        Assert.Equal(HttpStatusCode.OK, approve.StatusCode);
        var reject = await managerClient.PostAsJsonAsync($"/api/time-entries/{entryId}/reject", new RejectTimeEntryRequestDto(Guid.Empty, "Needs edits"));
        Assert.Equal(HttpStatusCode.OK, reject.StatusCode);
    }

    [Fact]
    public async Task Employee_can_use_parts_lookup_without_manager_cost_fields()
    {
        await using var factory = new TestApiFactory();
        await factory.SeedAsync(async (db, auth) =>
        {
            await SeedDataAsync(db, auth);
            var category = new PartCategory { Name = "General" };
            db.PartCategories.Add(category);
            await db.SaveChangesAsync();
            db.Parts.Add(new Part
            {
                PartCategoryId = category.Id,
                PartNumber = "P-100",
                Name = "Filter",
                UnitCost = 9.50m,
                UnitPrice = 19.99m
            });
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();
        await client.SetBearerTokenAsync("employee", "EmployeePass!123");

        var response = await client.GetAsync("/api/parts/lookup?offset=0&limit=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var first = body.RootElement[0];
        Assert.True(first.TryGetProperty("id", out _));
        Assert.True(first.TryGetProperty("partNumber", out _));
        Assert.True(first.TryGetProperty("name", out _));
        Assert.False(first.TryGetProperty("unitCost", out _));
    }

    [Fact]
    public async Task Employee_cannot_change_part_approval_status_through_update_endpoint()
    {
        await using var factory = new TestApiFactory();
        await factory.SeedAsync(async (db, auth) =>
        {
            var refs = await SeedDataAsync(db, auth);
            var category = new PartCategory { Name = "Filters" };
            db.PartCategories.Add(category);
            await db.SaveChangesAsync();

            var part = new Part
            {
                PartCategoryId = category.Id,
                PartNumber = "F-100",
                Name = "Air Filter",
                UnitCost = 10m,
                UnitPrice = 20m
            };
            db.Parts.Add(part);
            await db.SaveChangesAsync();

            db.JobTicketParts.Add(new JobTicketPart
            {
                JobTicketId = refs.AssignedJob.Id,
                PartId = part.Id,
                Quantity = 1m,
                UnitCostSnapshot = part.UnitCost,
                SalePriceSnapshot = part.UnitPrice,
                IsBillable = true,
                AddedAtUtc = DateTime.UtcNow,
                AddedByEmployeeId = refs.Employee.Id
            });
            await db.SaveChangesAsync();
        });

        Guid jobTicketId;
        Guid jobTicketPartId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            jobTicketId = await db.JobTickets.Where(x => x.Title == "Assigned").Select(x => x.Id).SingleAsync();
            jobTicketPartId = await db.JobTicketParts.Where(x => x.JobTicketId == jobTicketId).Select(x => x.Id).SingleAsync();
        }

        var client = factory.CreateClient();
        await client.SetBearerTokenAsync("employee", "EmployeePass!123");

        var response = await client.PutAsJsonAsync($"/api/job-tickets/{jobTicketId}/parts/{jobTicketPartId}", new UpdateJobTicketPartDto(
            1m,
            "attempted approval",
            true,
            JobPartApprovalStatus.Approved,
            null,
            null,
            false,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        await using var verifyScope = factory.Services.CreateAsyncScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var persisted = await verifyDb.JobTicketParts.SingleAsync(x => x.Id == jobTicketPartId);
        Assert.Equal(JobPartApprovalStatus.Pending, persisted.ApprovalStatus);
    }

    private static async Task SeedUsersAsync(ApplicationDbContext db, IAuthService auth)
    {
        db.Employees.AddRange(
            new Employee { FirstName = "Admin", LastName = "User", UserName = "admin", Email = "admin@example.com", Role = SystemRoles.Admin, PasswordHash = auth.HashPassword("AdminPass!123") },
            new Employee { FirstName = "Manager", LastName = "User", UserName = "manager", Email = "manager@example.com", Role = SystemRoles.Manager, PasswordHash = auth.HashPassword("ManagerPass!123") },
            new Employee { FirstName = "Employee", LastName = "User", UserName = "employee", Email = "employee@example.com", Role = SystemRoles.Employee, PasswordHash = auth.HashPassword("EmployeePass!123") }
        );
        await db.SaveChangesAsync();
    }

    private static async Task<SeedRefs> SeedDataAsync(ApplicationDbContext db, IAuthService auth)
    {
        await SeedUsersAsync(db, auth);
        var customer = new Customer { Name = "C1" };
        var billing = new Customer { Name = "B1" };
        var location = new ServiceLocation { CompanyName = "C1", LocationName = "L1", AddressLine1 = "1 Main", City = "Austin", State = "TX", PostalCode = "78701", Country = "USA" };
        db.AddRange(customer, billing, location);
        await db.SaveChangesAsync();

        var assignedJob = new JobTicket { TicketNumber = "JT-2026-000001", CustomerId = customer.Id, ServiceLocationId = location.Id, BillingPartyCustomerId = billing.Id, Title = "Assigned", Status = JobTicketStatus.InProgress };
        var unassignedJob = new JobTicket { TicketNumber = "JT-2026-000002", CustomerId = customer.Id, ServiceLocationId = location.Id, BillingPartyCustomerId = billing.Id, Title = "Unassigned", Status = JobTicketStatus.InProgress };
        db.JobTickets.AddRange(assignedJob, unassignedJob);
        await db.SaveChangesAsync();

        var employee = await db.Employees.SingleAsync(x => x.UserName == "employee");
        var manager = await db.Employees.SingleAsync(x => x.UserName == "manager");
        db.JobTicketEmployees.Add(new JobTicketEmployee { JobTicketId = assignedJob.Id, EmployeeId = employee.Id, AssignedAtUtc = DateTime.UtcNow });
        db.TimeEntries.Add(new TimeEntry { JobTicketId = assignedJob.Id, EmployeeId = employee.Id, StartedAtUtc = DateTime.UtcNow.AddHours(-1), EndedAtUtc = DateTime.UtcNow, LaborHours = 1m, BillableHours = 1m, HourlyRate = 10m, ClockInLatitude = 30m, ClockInLongitude = -97m, ApprovalStatus = TimeEntryApprovalStatus.Pending, TotalMinutes = 60 });
        await db.SaveChangesAsync();
        return new SeedRefs(employee, manager, assignedJob, unassignedJob);
    }

    private sealed record SeedRefs(Employee Employee, Employee Manager, JobTicket AssignedJob, JobTicket UnassignedJob);
}

internal sealed class TestApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor is not null) services.Remove(descriptor);
            services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(_dbName));
        });

        builder.UseSetting("Logging:LogLevel:Default", "Warning");
        builder.UseSetting("Logging:LogLevel:Microsoft", "Warning");
        builder.UseSetting("Logging:LogLevel:Microsoft.AspNetCore", "Error");
        builder.UseSetting("Logging:LogLevel:Microsoft.AspNetCore.DataProtection", "Error");
        builder.UseSetting("Logging:LogLevel:Microsoft.EntityFrameworkCore", "Error");
        builder.UseSetting("Jwt:Issuer", "JobTicketSystem");
        builder.UseSetting("Jwt:Audience", "JobTicketSystem.Api");
        builder.UseSetting("Jwt:SigningKey", "PLEASE_CHANGE_THIS_DEVELOPMENT_KEY_1234567890");
        builder.UseSetting("Jwt:ExpirationMinutes", "120");
    }

    public async Task SeedAsync(Func<ApplicationDbContext, IAuthService, Task> seed)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var auth = scope.ServiceProvider.GetRequiredService<IAuthService>();
        await seed(db, auth);
    }

    public async Task<Guid> GetAssignedJobIdAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.JobTickets.Where(x => x.Title == "Assigned").Select(x => x.Id).SingleAsync();
    }

    public async Task<Guid> GetUnassignedJobIdAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.JobTickets.Where(x => x.Title == "Unassigned").Select(x => x.Id).SingleAsync();
    }

    public async Task<Guid> GetEmployeeIdAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Employees.Where(x => x.UserName == "employee").Select(x => x.Id).SingleAsync();
    }

    public async Task<Guid> CreateTimeEntryAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.TimeEntries.Select(x => x.Id).FirstAsync();
    }
}

internal static class HttpClientAuthExtensions
{
    public static async Task SetBearerTokenAsync(this HttpClient client, string username, string password)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new AuthLoginRequestDto(username, password));
        loginResponse.EnsureSuccessStatusCode();
        var payload = await loginResponse.Content.ReadFromJsonAsync<AuthLoginResponseDto>();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", payload!.AccessToken);
    }
}
