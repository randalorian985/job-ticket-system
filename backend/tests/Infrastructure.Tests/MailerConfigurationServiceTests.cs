using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Notifications;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class MailerConfigurationServiceTests
{
    [Fact]
    public async Task Get_returns_environment_settings_without_creating_database_row()
    {
        await using var context = CreateContext();
        var service = CreateService(context, new SmtpEmailSettings(
            true,
            "smtp.env.example.com",
            2525,
            true,
            "env-user",
            "env-password",
            "dispatch@example.com",
            "https://dev.mudbugdigital.com"));

        var result = await service.GetAsync();
        var resolved = await service.GetResolvedSettingsAsync();

        Assert.Equal("Environment", result.ConfigurationSource);
        Assert.Equal("smtp.env.example.com", result.SmtpHost);
        Assert.True(result.SmtpPasswordSet);
        Assert.Empty(context.MailerConfigurations);
        Assert.Equal("env-password", resolved.Password);
    }

    [Fact]
    public async Task Update_saves_manual_smtp_with_protected_password()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();

        var result = await service.UpdateAsync(CreateUpdateRequest() with
        {
            SmtpPassword = "smtp-secret"
        }, userId);

        var entity = await context.MailerConfigurations.SingleAsync();
        var resolved = await service.GetResolvedSettingsAsync();

        Assert.Equal("Ready", result.Status);
        Assert.True(result.SmtpPasswordSet);
        Assert.Equal("protected:smtp-secret", entity.SmtpPasswordCipherText);
        Assert.Equal("smtp-secret", resolved.Password);
        Assert.Equal(userId, entity.UpdatedByUserId);
        Assert.Contains(context.AuditLogs, audit =>
            audit.EntityName == nameof(MailerConfiguration)
            && audit.UserId == userId
            && audit.ActionType == AuditActionType.Update);
    }

    [Fact]
    public async Task Update_keeps_existing_password_when_password_field_is_blank()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.UpdateAsync(CreateUpdateRequest() with { SmtpPassword = "first-secret" }, Guid.NewGuid());

        await service.UpdateAsync(CreateUpdateRequest() with
        {
            SmtpHost = "smtp.changed.example.com",
            SmtpPassword = ""
        }, Guid.NewGuid());

        var entity = await context.MailerConfigurations.SingleAsync();
        var resolved = await service.GetResolvedSettingsAsync();

        Assert.Equal("smtp.changed.example.com", entity.SmtpHost);
        Assert.Equal("protected:first-secret", entity.SmtpPasswordCipherText);
        Assert.Equal("first-secret", resolved.Password);
    }

    [Fact]
    public async Task Update_rejects_oauth_provider_until_flow_is_available()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            service.UpdateAsync(CreateUpdateRequest() with { Provider = "Microsoft365" }, Guid.NewGuid()));

        Assert.Equal("Google Workspace and Microsoft 365 OAuth mailers are not available yet. Use Manual SMTP for outgoing mail.", exception.Message);
        Assert.Empty(context.MailerConfigurations);
    }

    private static MailerConfigurationService CreateService(
        ApplicationDbContext context,
        SmtpEmailSettings? environmentSettings = null)
    {
        return new MailerConfigurationService(
            context,
            Options.Create(environmentSettings ?? new SmtpEmailSettings(false, null, 587, true, null, null, null, null)),
            new TestMailerSecretProtector());
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static UpdateMailerConfigurationDto CreateUpdateRequest() => new(
        Provider: "ManualSmtp",
        Enabled: true,
        FromName: "Dispatch",
        FromAddress: "dispatch@example.com",
        ReplyToAddress: "office@example.com",
        SmtpHost: "smtp.example.com",
        SmtpPort: 587,
        SmtpEnableSsl: true,
        SmtpUsername: "dispatch@example.com",
        SmtpPassword: null,
        ClearSmtpPassword: false,
        AppBaseUrl: "https://dev.mudbugdigital.com");

    private sealed class TestMailerSecretProtector : IMailerSecretProtector
    {
        public string Protect(string value) => $"protected:{value}";

        public string Unprotect(string protectedValue) => protectedValue.Replace("protected:", "", StringComparison.Ordinal);
    }
}
