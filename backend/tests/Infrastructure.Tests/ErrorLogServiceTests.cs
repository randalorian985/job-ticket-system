using JobTicketSystem.Application.Diagnostics;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class ErrorLogServiceTests
{
    [Fact]
    public async Task RecordAsync_saves_error_context_for_review()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = CreateService(context, userId, SystemRoles.Employee);

        var result = await service.RecordAsync(new CreateErrorLogRequestDto(
            Message: "Unable to load ticket.",
            Source: "Client",
            Cause: "HTTP 500",
            Location: "JobTicketDetailPage",
            RequestPath: "/manage/job-tickets/123",
            RequestMethod: "GET",
            UserAgent: "Unit test browser",
            StackTrace: "stack",
            MetadataJson: "{\"status\":500}",
            Severity: "Error",
            OccurredAtUtc: new DateTime(2026, 7, 8, 2, 30, 0, DateTimeKind.Utc)),
            userId,
            SystemRoles.Employee);

        var stored = await context.ApplicationErrorLogs.SingleAsync();
        Assert.Equal(result.Id, stored.Id);
        Assert.Equal("Unable to load ticket.", stored.Message);
        Assert.Equal("HTTP 500", stored.Cause);
        Assert.Equal("/manage/job-tickets/123", stored.RequestPath);
        Assert.Equal(userId, stored.UserId);
        Assert.Equal(SystemRoles.Employee, stored.UserRole);
        Assert.NotEqual(default, stored.CreatedAtUtc);
    }

    [Fact]
    public async Task ListAsync_returns_admin_filtered_latest_logs()
    {
        await using var context = CreateContext();
        var recorder = CreateService(context, Guid.NewGuid(), SystemRoles.Employee);

        await recorder.RecordAsync(new CreateErrorLogRequestDto(
            Message: "Client report",
            Source: "Client",
            RequestPath: "/manage/job-tickets",
            OccurredAtUtc: new DateTime(2026, 7, 8, 2, 30, 0, DateTimeKind.Utc)),
            Guid.NewGuid(),
            SystemRoles.Employee);
        await recorder.RecordAsync(new CreateErrorLogRequestDto(
            Message: "Server exception",
            Source: "Server",
            RequestPath: "/api/job-tickets",
            OccurredAtUtc: new DateTime(2026, 7, 8, 2, 35, 0, DateTimeKind.Utc)),
            Guid.NewGuid(),
            SystemRoles.Admin);

        var adminService = CreateService(context, Guid.NewGuid(), SystemRoles.Admin);
        var clientLogs = await adminService.ListAsync(new ErrorLogQueryDto(Limit: 10, Source: "Client", Search: "job-tickets"));

        Assert.Single(clientLogs);
        Assert.Equal("Client report", clientLogs[0].Message);
        Assert.Equal("Client", clientLogs[0].Source);
    }

    [Fact]
    public async Task ListAsync_rejects_non_admin_users()
    {
        await using var context = CreateContext();
        var service = CreateService(context, Guid.NewGuid(), SystemRoles.Manager);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.ListAsync(new ErrorLogQueryDto()));
    }

    private static ErrorLogService CreateService(ApplicationDbContext context, Guid userId, string role) =>
        new(context, new TestCurrentUserContext(userId, role));

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
