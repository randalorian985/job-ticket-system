using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Api.Production;

public sealed class DatabaseMigrationHostedService(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<DatabaseMigrationHostedService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!configuration.GetValue<bool>("DatabaseMigrations:ApplyOnStartup"))
        {
            return;
        }

        await using var scope = serviceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (!dbContext.Database.IsRelational())
        {
            logger.LogInformation("Database migration startup check skipped because the configured provider is not relational.");
            return;
        }

        logger.LogInformation("Applying database migrations on startup.");
        await dbContext.Database.MigrateAsync(cancellationToken);
        logger.LogInformation("Database migrations are up to date.");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
