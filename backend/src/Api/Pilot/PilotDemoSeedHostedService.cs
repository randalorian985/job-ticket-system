using JobTicketSystem.Application.Pilot;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Api.Pilot;

public sealed class PilotDemoSeedHostedService(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<PilotDemoSeedHostedService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!configuration.GetValue<bool>("PilotDemoSeed:Enabled"))
        {
            return;
        }

        await using var scope = serviceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (configuration.GetValue("PilotDemoSeed:MigrateDatabase", true) && dbContext.Database.IsRelational())
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
        }

        var seedService = scope.ServiceProvider.GetRequiredService<IPilotDemoSeedService>();
        var summary = await seedService.SeedAsync(cancellationToken);

        logger.LogWarning(
            "Phase 4A local pilot seed data {SeedAction}. Demo users: {DemoUserCount}; job tickets: {DemoJobTicketCount}; invoice-ready tickets: {InvoiceReadyJobTicketCount}. Disable PilotDemoSeed outside local/demo environments.",
            summary.Created ? "created" : "already present",
            summary.DemoUserCount,
            summary.DemoJobTicketCount,
            summary.InvoiceReadyJobTicketCount);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
