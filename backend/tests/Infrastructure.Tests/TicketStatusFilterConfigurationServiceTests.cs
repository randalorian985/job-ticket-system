using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class TicketStatusFilterConfigurationServiceTests
{
    [Fact]
    public async Task List_returns_default_active_filter_options_when_no_configuration_exists()
    {
        await using var context = CreateContext();
        var service = new TicketStatusFilterConfigurationService(context);

        var options = await service.ListAsync();

        Assert.Equal(
            [JobTicketStatus.Submitted, JobTicketStatus.Assigned, JobTicketStatus.InProgress, JobTicketStatus.WaitingOnParts, JobTicketStatus.WaitingOnCustomer],
            options.Select(x => x.Status).ToArray());
        Assert.All(options, option => Assert.True(option.IsActive));
    }

    [Fact]
    public async Task Save_creates_edits_reorders_and_deactivates_filter_options()
    {
        await using var context = CreateContext();
        var service = new TicketStatusFilterConfigurationService(context);

        var saved = await service.SaveAsync(new SaveTicketStatusFilterConfigurationDto([
            new(null, "Ready for Review", JobTicketStatus.Completed, 20, true),
            new(null, "Field Work", JobTicketStatus.InProgress, 10, true),
            new(null, "Hidden Submitted", JobTicketStatus.Submitted, 30, false)
        ]), Guid.NewGuid());
        var completed = saved.Single(x => x.Status == JobTicketStatus.Completed);

        saved = await service.SaveAsync(new SaveTicketStatusFilterConfigurationDto([
            new(completed.Id, "Completed Review", JobTicketStatus.Completed, 5, true),
            new(saved.Single(x => x.Status == JobTicketStatus.InProgress).Id, "Field Work", JobTicketStatus.InProgress, 10, false),
            new(saved.Single(x => x.Status == JobTicketStatus.Submitted).Id, "Submitted", JobTicketStatus.Submitted, 20, true),
            new(null, "Waiting Parts", JobTicketStatus.WaitingOnParts, 15, true)
        ]), Guid.NewGuid());

        string[] expectedLabels = ["Completed Review", "Field Work", "Waiting Parts", "Submitted"];
        Assert.Equal(expectedLabels, saved.Select(x => x.DisplayLabel).ToArray());
        Assert.False(saved.Single(x => x.DisplayLabel == "Field Work").IsActive);
        Assert.Equal(JobTicketStatus.WaitingOnParts, saved.Single(x => x.DisplayLabel == "Waiting Parts").Status);
        Assert.Equal(4, await context.TicketStatusFilterOptions.CountAsync());
        Assert.Equal(2, await context.AuditLogs.CountAsync(x => x.EntityName == nameof(TicketStatusFilterOption)));
    }

    [Fact]
    public async Task Save_rejects_invalid_status_and_duplicate_active_statuses()
    {
        await using var context = CreateContext();
        var service = new TicketStatusFilterConfigurationService(context);

        await Assert.ThrowsAsync<ValidationException>(() => service.SaveAsync(new SaveTicketStatusFilterConfigurationDto([
            new(null, "Invalid", (JobTicketStatus)999, 10, true)
        ]), Guid.NewGuid()));

        await Assert.ThrowsAsync<ValidationException>(() => service.SaveAsync(new SaveTicketStatusFilterConfigurationDto([
            new(null, "One", JobTicketStatus.InProgress, 10, true),
            new(null, "Two", JobTicketStatus.InProgress, 20, true)
        ]), Guid.NewGuid()));
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
