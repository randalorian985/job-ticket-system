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
    public async Task Update_saves_microsoft365_graph_settings_with_protected_secret()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();
        var clientId = Guid.NewGuid().ToString();

        var result = await service.UpdateAsync(CreateUpdateRequest() with
        {
            Provider = "Microsoft365",
            FromAddress = null,
            SmtpHost = null,
            Microsoft365TenantId = "contoso.onmicrosoft.com",
            Microsoft365ClientId = clientId,
            Microsoft365ClientSecret = "graph-secret",
            Microsoft365SenderEmail = "dispatch@example.com"
        }, userId);

        var entity = await context.MailerConfigurations.SingleAsync();
        var resolved = await service.GetResolvedSettingsAsync();

        Assert.Equal("Ready", result.Status);
        Assert.Equal("Connected via Microsoft 365 Graph.", result.StatusMessage);
        Assert.True(result.Microsoft365ClientSecretSet);
        Assert.Equal("protected:graph-secret", entity.Microsoft365ClientSecretCipherText);
        Assert.Equal(MailerProvider.Microsoft365, resolved.Provider);
        Assert.Equal("graph-secret", resolved.Microsoft365ClientSecret);
        Assert.Equal("dispatch@example.com", resolved.Microsoft365SenderEmail);
        Assert.Equal("dispatch@example.com", resolved.FromAddress);
    }

    [Fact]
    public async Task SendTest_uses_configured_microsoft365_graph_delivery()
    {
        await using var context = CreateContext();
        var delivery = new CapturingMailerDeliveryService();
        var service = CreateService(context, mailerDeliveryService: delivery);
        var clientId = Guid.NewGuid().ToString();

        await service.UpdateAsync(CreateUpdateRequest() with
        {
            Provider = "Microsoft365",
            FromAddress = null,
            SmtpHost = null,
            Microsoft365TenantId = "contoso.onmicrosoft.com",
            Microsoft365ClientId = clientId,
            Microsoft365ClientSecret = "graph-secret",
            Microsoft365SenderEmail = "dispatch@example.com"
        }, Guid.NewGuid());

        var result = await service.SendTestAsync(new SendMailerTestRequestDto("owner@example.com"), Guid.NewGuid());

        Assert.True(result.Success);
        var sent = Assert.Single(delivery.SentMessages);
        Assert.Equal(MailerProvider.Microsoft365, sent.Settings.Provider);
        Assert.Equal("owner@example.com", sent.RecipientEmail);
        Assert.Equal("dispatch@example.com", sent.Settings.Microsoft365SenderEmail);
    }

    [Fact]
    public async Task Update_rejects_google_provider_until_flow_is_available()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            service.UpdateAsync(CreateUpdateRequest() with { Provider = "GoogleWorkspace" }, Guid.NewGuid()));

        Assert.Equal("Google Workspace OAuth mailer is not available yet. Use Manual SMTP or Microsoft 365 Graph for outgoing mail.", exception.Message);
        Assert.Empty(context.MailerConfigurations);
    }

    private static MailerConfigurationService CreateService(
        ApplicationDbContext context,
        SmtpEmailSettings? environmentSettings = null,
        IMailerDeliveryService? mailerDeliveryService = null)
    {
        return new MailerConfigurationService(
            context,
            Options.Create(environmentSettings ?? new SmtpEmailSettings(false, null, 587, true, null, null, null, null)),
            new TestMailerSecretProtector(),
            mailerDeliveryService ?? new CapturingMailerDeliveryService());
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

    private sealed class CapturingMailerDeliveryService : IMailerDeliveryService
    {
        public List<SentMailerMessage> SentMessages { get; } = [];

        public Task SendAsync(
            ResolvedMailerSettings settings,
            string recipientEmail,
            string subject,
            string body,
            CancellationToken cancellationToken = default)
        {
            SentMessages.Add(new SentMailerMessage(settings, recipientEmail, subject, body));
            return Task.CompletedTask;
        }
    }

    private sealed record SentMailerMessage(
        ResolvedMailerSettings Settings,
        string RecipientEmail,
        string Subject,
        string Body);
}
