using JobTicketSystem.Application.Auth;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Api.TestEnvironment;

public sealed class TestEnvironmentBootstrapHostedService(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<TestEnvironmentBootstrapHostedService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!configuration.GetValue<bool>("TestBootstrap:Enabled"))
        {
            return;
        }

        await using var scope = serviceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (configuration.GetValue("TestBootstrap:MigrateDatabase", true) && dbContext.Database.IsRelational())
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
        }

        var settings = new TestEnvironmentBootstrapSettings(
            configuration.GetValue("TestBootstrap:AdminUserName", TestEnvironmentBootstrapService.DefaultAdminUserName)!,
            configuration.GetValue("TestBootstrap:AdminEmail", TestEnvironmentBootstrapService.DefaultAdminEmail)!,
            configuration.GetValue("TestBootstrap:AdminPassword", TestEnvironmentBootstrapService.DefaultAdminPassword)!,
            configuration.GetValue("TestBootstrap:AdminFirstName", "Test")!,
            configuration.GetValue("TestBootstrap:AdminLastName", "Admin")!);

        var bootstrapService = scope.ServiceProvider.GetRequiredService<ITestEnvironmentBootstrapService>();
        var summary = await bootstrapService.EnsureAsync(settings, cancellationToken);

        logger.LogWarning(
            "Test environment bootstrap admin {SeedAction}. Admin user: {AdminUserName}; role: {AdminRole}; available roles: {AvailableRoles}. Disable TestBootstrap outside local/test environments.",
            summary.Created ? "created" : "already present",
            summary.AdminUserName,
            summary.AdminRole,
            string.Join(", ", summary.AvailableRoles));
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
