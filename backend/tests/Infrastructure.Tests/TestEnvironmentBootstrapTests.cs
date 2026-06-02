using System.Net;
using System.Net.Http.Json;
using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class TestEnvironmentBootstrapTests
{
    [Fact]
    public async Task Enabled_test_bootstrap_creates_loginable_admin_without_seed_data()
    {
        await using var factory = new TestBootstrapApiFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new AuthLoginRequestDto("test.admin", "TestAdmin123!"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var login = await response.Content.ReadFromJsonAsync<AuthLoginResponseDto>();
        Assert.NotNull(login);
        Assert.Equal(SystemRoles.Admin, login!.User.Role);
        Assert.Equal("test.admin", login.User.Username);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var admin = await db.Employees.SingleAsync(x => x.UserName == "test.admin");

        Assert.Equal(SystemRoles.Admin, admin.Role);
        Assert.Equal(EmployeeStatus.Active, admin.Status);
        Assert.NotNull(admin.PasswordHash);
        Assert.DoesNotContain("TestAdmin123!", admin.PasswordHash!);
        Assert.Equal([SystemRoles.Admin, SystemRoles.Manager, SystemRoles.Employee], SystemRoles.All);
    }

    private sealed class TestBootstrapApiFactory : WebApplicationFactory<Program>
    {
        private readonly string _dbName = Guid.NewGuid().ToString();

        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor is not null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(_dbName));
            });

            builder.UseSetting("Logging:LogLevel:Default", "Warning");
            builder.UseSetting("Logging:LogLevel:Microsoft", "Warning");
            builder.UseSetting("Logging:LogLevel:Microsoft.AspNetCore", "Error");
            builder.UseSetting("Logging:LogLevel:Microsoft.EntityFrameworkCore", "Error");
            builder.UseSetting("Jwt:Issuer", "JobTicketSystem");
            builder.UseSetting("Jwt:Audience", "JobTicketSystem.Api");
            builder.UseSetting("Jwt:SigningKey", "PLEASE_CHANGE_THIS_DEVELOPMENT_KEY_1234567890");
            builder.UseSetting("Jwt:ExpirationMinutes", "120");
            builder.UseSetting("PilotDemoSeed:Enabled", "false");
            builder.UseSetting("TestBootstrap:Enabled", "true");
            builder.UseSetting("TestBootstrap:MigrateDatabase", "false");
            builder.UseSetting("TestBootstrap:AdminUserName", "test.admin");
            builder.UseSetting("TestBootstrap:AdminEmail", "test.admin@example.local");
            builder.UseSetting("TestBootstrap:AdminPassword", "TestAdmin123!");
            builder.UseSetting("TestBootstrap:AdminFirstName", "Test");
            builder.UseSetting("TestBootstrap:AdminLastName", "Admin");
        }
    }
}
