using System.Net;
using System.Net.Mail;
using System.Text.Json;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace JobTicketSystem.Application.Notifications;

public interface IMailerConfigurationService
{
    Task<MailerConfigurationDto> GetAsync(CancellationToken cancellationToken = default);
    Task<MailerConfigurationDto> UpdateAsync(UpdateMailerConfigurationDto request, Guid? updatedByUserId, CancellationToken cancellationToken = default);
    Task<MailerTestResultDto> SendTestAsync(SendMailerTestRequestDto request, Guid? updatedByUserId, CancellationToken cancellationToken = default);
    Task<ResolvedMailerSettings> GetResolvedSettingsAsync(CancellationToken cancellationToken = default);
}

public interface IMailerSecretProtector
{
    string Protect(string value);
    string Unprotect(string protectedValue);
}

public sealed class MailerConfigurationService(
    ApplicationDbContext dbContext,
    IOptions<SmtpEmailSettings> smtpOptions,
    IMailerSecretProtector secretProtector) : IMailerConfigurationService
{
    private static readonly Guid SingletonConfigurationId = Guid.Parse("d46b7b50-4afa-4dbf-9d23-c606fa997960");
    private const string DatabaseSource = "Database";
    private const string EnvironmentSource = "Environment";

    public async Task<MailerConfigurationDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var entity = await GetExistingEntityAsync(cancellationToken);
        return entity is null ? MapEnvironmentDto(smtpOptions.Value) : MapDto(entity, DatabaseSource);
    }

    public async Task<MailerConfigurationDto> UpdateAsync(
        UpdateMailerConfigurationDto request,
        Guid? updatedByUserId,
        CancellationToken cancellationToken = default)
    {
        var entity = await GetOrCreateEntityAsync(cancellationToken);
        var oldValuesJson = JsonSerializer.Serialize(new
        {
            entity.Provider,
            entity.Enabled,
            entity.FromAddress,
            entity.ReplyToAddress,
            entity.SmtpHost,
            entity.SmtpPort,
            entity.SmtpEnableSsl,
            entity.SmtpUsername,
            SmtpPasswordSet = entity.SmtpPasswordCipherText is not null,
            entity.AppBaseUrl
        });

        ApplyRequest(entity, request);
        entity.UpdatedByUserId = updatedByUserId;

        dbContext.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = updatedByUserId,
            EntityName = nameof(MailerConfiguration),
            EntityId = entity.Id,
            ActionType = AuditActionType.Update,
            OldValuesJson = oldValuesJson,
            NewValuesJson = JsonSerializer.Serialize(new
            {
                entity.Provider,
                entity.Enabled,
                entity.FromAddress,
                entity.ReplyToAddress,
                entity.SmtpHost,
                entity.SmtpPort,
                entity.SmtpEnableSsl,
                entity.SmtpUsername,
                SmtpPasswordSet = entity.SmtpPasswordCipherText is not null,
                entity.AppBaseUrl
            })
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapDto(entity, DatabaseSource);
    }

    public async Task<MailerTestResultDto> SendTestAsync(
        SendMailerTestRequestDto request,
        Guid? updatedByUserId,
        CancellationToken cancellationToken = default)
    {
        var recipient = RequiredEmail(request.RecipientEmail, nameof(request.RecipientEmail));
        var entity = await GetExistingEntityAsync(cancellationToken);
        var settings = entity is null
            ? ResolveFromEnvironment(smtpOptions.Value)
            : ResolveFromEntity(entity);

        if (!settings.Enabled)
        {
            return await StoreTestResultAsync(entity, false, "Outgoing mail is disabled.", updatedByUserId, cancellationToken);
        }

        if (!settings.IsConfigured)
        {
            return await StoreTestResultAsync(entity, false, "Manual SMTP settings are incomplete.", updatedByUserId, cancellationToken);
        }

        try
        {
            using var message = CreateMessage(
                settings,
                recipient,
                "Job Ticket System mailer test",
                $"This is a test email from {settings.AppBaseUrl ?? "Job Ticket System"} sent at {DateTime.UtcNow:u}.");

            using var client = CreateSmtpClient(settings);
            await client.SendMailAsync(message, cancellationToken);

            return await StoreTestResultAsync(entity, true, $"Test email sent to {recipient}.", updatedByUserId, cancellationToken);
        }
        catch (Exception exception)
        {
            return await StoreTestResultAsync(entity, false, $"Test email failed: {exception.Message}", updatedByUserId, cancellationToken);
        }
    }

    public async Task<ResolvedMailerSettings> GetResolvedSettingsAsync(CancellationToken cancellationToken = default)
    {
        var entity = await GetExistingEntityAsync(cancellationToken);
        return entity is null ? ResolveFromEnvironment(smtpOptions.Value) : ResolveFromEntity(entity);
    }

    private async Task<MailerTestResultDto> StoreTestResultAsync(
        MailerConfiguration? entity,
        bool success,
        string message,
        Guid? updatedByUserId,
        CancellationToken cancellationToken)
    {
        var testedAtUtc = DateTime.UtcNow;

        if (entity is not null)
        {
            entity.LastTestedAtUtc = testedAtUtc;
            entity.LastTestSucceeded = success;
            entity.LastTestMessage = Truncate(message, 1000);
            entity.UpdatedByUserId = updatedByUserId;
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return new MailerTestResultDto(success, message, testedAtUtc);
    }

    private async Task<MailerConfiguration?> GetExistingEntityAsync(CancellationToken cancellationToken)
    {
        return await dbContext.MailerConfigurations
            .OrderByDescending(x => x.Id == SingletonConfigurationId)
            .ThenBy(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<MailerConfiguration> GetOrCreateEntityAsync(CancellationToken cancellationToken)
    {
        var entity = await GetExistingEntityAsync(cancellationToken);
        if (entity is not null)
        {
            return entity;
        }

        entity = new MailerConfiguration
        {
            Id = SingletonConfigurationId,
            Provider = MailerProvider.ManualSmtp,
            SmtpPort = 587,
            SmtpEnableSsl = true
        };

        dbContext.MailerConfigurations.Add(entity);
        return entity;
    }

    private void ApplyRequest(MailerConfiguration entity, UpdateMailerConfigurationDto request)
    {
        var provider = ParseProvider(request.Provider);
        if (provider != MailerProvider.ManualSmtp)
        {
            throw new ValidationException("Google Workspace and Microsoft 365 OAuth mailers are not available yet. Use Manual SMTP for outgoing mail.");
        }

        entity.Provider = provider;
        entity.Enabled = request.Enabled;
        entity.FromName = OptionalText(request.FromName, nameof(request.FromName), 200);
        entity.FromAddress = OptionalEmail(request.FromAddress, nameof(request.FromAddress), required: request.Enabled);
        entity.ReplyToAddress = OptionalEmail(request.ReplyToAddress, nameof(request.ReplyToAddress), required: false);
        entity.SmtpHost = OptionalText(request.SmtpHost, nameof(request.SmtpHost), 255);
        entity.SmtpPort = NormalizePort(request.SmtpPort);
        entity.SmtpEnableSsl = request.SmtpEnableSsl;
        entity.SmtpUsername = OptionalText(request.SmtpUsername, nameof(request.SmtpUsername), 320);
        entity.AppBaseUrl = OptionalUrl(request.AppBaseUrl, nameof(request.AppBaseUrl), 300);

        if (request.ClearSmtpPassword)
        {
            entity.SmtpPasswordCipherText = null;
        }

        var password = ValidationHelpers.NullIfWhitespace(request.SmtpPassword);
        if (password is not null)
        {
            if (password.Length > 1000)
            {
                throw new ValidationException("SmtpPassword must be 1000 characters or fewer.");
            }

            entity.SmtpPasswordCipherText = secretProtector.Protect(password);
        }

        if (entity.Enabled && string.IsNullOrWhiteSpace(entity.SmtpHost))
        {
            throw new ValidationException("SmtpHost is required when outgoing mail is enabled.");
        }
    }

    private ResolvedMailerSettings ResolveFromEntity(MailerConfiguration entity)
    {
        if (entity.Provider != MailerProvider.ManualSmtp)
        {
            return new ResolvedMailerSettings(
                Provider: entity.Provider,
                Enabled: false,
                IsConfigured: false,
                FromName: entity.FromName,
                FromAddress: entity.FromAddress,
                ReplyToAddress: entity.ReplyToAddress,
                Host: null,
                Port: 587,
                EnableSsl: true,
                Username: null,
                Password: null,
                AppBaseUrl: entity.AppBaseUrl,
                ConfigurationSource: DatabaseSource);
        }

        var password = string.IsNullOrWhiteSpace(entity.SmtpPasswordCipherText)
            ? null
            : secretProtector.Unprotect(entity.SmtpPasswordCipherText);
        var host = ValidationHelpers.NullIfWhitespace(entity.SmtpHost);
        var fromAddress = ValidationHelpers.NullIfWhitespace(entity.FromAddress);

        return new ResolvedMailerSettings(
            Provider: entity.Provider,
            Enabled: entity.Enabled,
            IsConfigured: entity.Enabled && host is not null && fromAddress is not null,
            FromName: ValidationHelpers.NullIfWhitespace(entity.FromName),
            FromAddress: fromAddress,
            ReplyToAddress: ValidationHelpers.NullIfWhitespace(entity.ReplyToAddress),
            Host: host,
            Port: entity.SmtpPort <= 0 ? 587 : entity.SmtpPort,
            EnableSsl: entity.SmtpEnableSsl,
            Username: ValidationHelpers.NullIfWhitespace(entity.SmtpUsername),
            Password: password,
            AppBaseUrl: ValidationHelpers.NullIfWhitespace(entity.AppBaseUrl),
            ConfigurationSource: DatabaseSource);
    }

    private static ResolvedMailerSettings ResolveFromEnvironment(SmtpEmailSettings settings)
    {
        var host = ValidationHelpers.NullIfWhitespace(settings.Host);
        var fromAddress = ValidationHelpers.NullIfWhitespace(settings.FromAddress);

        return new ResolvedMailerSettings(
            Provider: MailerProvider.ManualSmtp,
            Enabled: settings.Enabled,
            IsConfigured: settings.Enabled && host is not null,
            FromName: null,
            FromAddress: fromAddress,
            ReplyToAddress: null,
            Host: host,
            Port: settings.Port <= 0 ? 587 : settings.Port,
            EnableSsl: settings.EnableSsl,
            Username: ValidationHelpers.NullIfWhitespace(settings.Username),
            Password: ValidationHelpers.NullIfWhitespace(settings.Password),
            AppBaseUrl: ValidationHelpers.NullIfWhitespace(settings.AppBaseUrl),
            ConfigurationSource: EnvironmentSource);
    }

    private static MailerConfigurationDto MapEnvironmentDto(SmtpEmailSettings settings)
    {
        var resolved = ResolveFromEnvironment(settings);
        var status = BuildStatus(resolved.Enabled, resolved.IsConfigured, resolved.Provider);

        return new MailerConfigurationDto(
            Id: SingletonConfigurationId,
            Provider: resolved.Provider.ToString(),
            Enabled: resolved.Enabled,
            ConfigurationSource: EnvironmentSource,
            IsConfigured: resolved.IsConfigured,
            Status: status.Status,
            StatusMessage: status.Message,
            FromName: null,
            FromAddress: resolved.FromAddress,
            ReplyToAddress: null,
            SmtpHost: resolved.Host,
            SmtpPort: resolved.Port,
            SmtpEnableSsl: resolved.EnableSsl,
            SmtpUsername: resolved.Username,
            SmtpPasswordSet: resolved.Password is not null,
            AppBaseUrl: resolved.AppBaseUrl,
            LastTestedAtUtc: null,
            LastTestSucceeded: null,
            LastTestMessage: null,
            UpdatedAtUtc: null);
    }

    private static MailerConfigurationDto MapDto(MailerConfiguration entity, string source)
    {
        var isConfigured = entity.Provider == MailerProvider.ManualSmtp
            && entity.Enabled
            && !string.IsNullOrWhiteSpace(entity.SmtpHost)
            && !string.IsNullOrWhiteSpace(entity.FromAddress);
        var status = BuildStatus(entity.Enabled, isConfigured, entity.Provider);

        return new MailerConfigurationDto(
            Id: entity.Id,
            Provider: entity.Provider.ToString(),
            Enabled: entity.Enabled,
            ConfigurationSource: source,
            IsConfigured: isConfigured,
            Status: status.Status,
            StatusMessage: status.Message,
            FromName: entity.FromName,
            FromAddress: entity.FromAddress,
            ReplyToAddress: entity.ReplyToAddress,
            SmtpHost: entity.SmtpHost,
            SmtpPort: entity.SmtpPort <= 0 ? 587 : entity.SmtpPort,
            SmtpEnableSsl: entity.SmtpEnableSsl,
            SmtpUsername: entity.SmtpUsername,
            SmtpPasswordSet: entity.SmtpPasswordCipherText is not null,
            AppBaseUrl: entity.AppBaseUrl,
            LastTestedAtUtc: entity.LastTestedAtUtc,
            LastTestSucceeded: entity.LastTestSucceeded,
            LastTestMessage: entity.LastTestMessage,
            UpdatedAtUtc: entity.UpdatedAtUtc);
    }

    private static (string Status, string Message) BuildStatus(bool enabled, bool isConfigured, MailerProvider provider)
    {
        if (provider != MailerProvider.ManualSmtp)
        {
            return ("OAuthPending", "OAuth mailer setup is pending.");
        }

        if (!enabled)
        {
            return ("Disabled", "Outgoing mail is disabled.");
        }

        return isConfigured
            ? ("Ready", "Outgoing mail is configured.")
            : ("NeedsSetup", "Manual SMTP settings are incomplete.");
    }

    private static SmtpClient CreateSmtpClient(ResolvedMailerSettings settings)
    {
        var client = new SmtpClient(settings.Host, settings.Port)
        {
            EnableSsl = settings.EnableSsl,
            Timeout = 10_000,
            Credentials = string.IsNullOrWhiteSpace(settings.Username)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(settings.Username, settings.Password)
        };

        return client;
    }

    public static MailMessage CreateMessage(
        ResolvedMailerSettings settings,
        string recipientEmail,
        string subject,
        string body)
    {
        var fromAddress = settings.FromAddress ?? recipientEmail;
        var from = string.IsNullOrWhiteSpace(settings.FromName)
            ? new MailAddress(fromAddress)
            : new MailAddress(fromAddress, settings.FromName);

        var message = new MailMessage
        {
            From = from,
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };
        message.To.Add(recipientEmail);

        if (!string.IsNullOrWhiteSpace(settings.ReplyToAddress))
        {
            message.ReplyToList.Add(settings.ReplyToAddress);
        }

        return message;
    }

    private static MailerProvider ParseProvider(string? value)
    {
        if (Enum.TryParse<MailerProvider>(value, ignoreCase: true, out var provider))
        {
            return provider;
        }

        throw new ValidationException("Provider must be ManualSmtp, GoogleWorkspace, or Microsoft365.");
    }

    private static int NormalizePort(int value)
    {
        if (value < 1 || value > 65535)
        {
            throw new ValidationException("SmtpPort must be between 1 and 65535.");
        }

        return value;
    }

    private static string? OptionalText(string? value, string fieldName, int maxLength)
    {
        var trimmed = ValidationHelpers.NullIfWhitespace(value);
        if (trimmed is not null && trimmed.Length > maxLength)
        {
            throw new ValidationException($"{fieldName} must be {maxLength} characters or fewer.");
        }

        return trimmed;
    }

    private static string RequiredEmail(string? value, string fieldName) =>
        OptionalEmail(value, fieldName, required: true)
        ?? throw new ValidationException($"{fieldName} is required.");

    private static string? OptionalEmail(string? value, string fieldName, bool required)
    {
        var trimmed = OptionalText(value, fieldName, 320);
        if (trimmed is null)
        {
            if (required)
            {
                throw new ValidationException($"{fieldName} is required.");
            }

            return null;
        }

        try
        {
            var address = new MailAddress(trimmed);
            if (!string.Equals(address.Address, trimmed, StringComparison.OrdinalIgnoreCase))
            {
                throw new FormatException();
            }
        }
        catch
        {
            throw new ValidationException($"{fieldName} must be a valid email address.");
        }

        return trimmed;
    }

    private static string? OptionalUrl(string? value, string fieldName, int maxLength)
    {
        var trimmed = OptionalText(value, fieldName, maxLength);
        if (trimmed is null)
        {
            return null;
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ValidationException($"{fieldName} must be a valid http or https URL.");
        }

        return trimmed.TrimEnd('/');
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];
}

public sealed record MailerConfigurationDto(
    Guid Id,
    string Provider,
    bool Enabled,
    string ConfigurationSource,
    bool IsConfigured,
    string Status,
    string? StatusMessage,
    string? FromName,
    string? FromAddress,
    string? ReplyToAddress,
    string? SmtpHost,
    int SmtpPort,
    bool SmtpEnableSsl,
    string? SmtpUsername,
    bool SmtpPasswordSet,
    string? AppBaseUrl,
    DateTime? LastTestedAtUtc,
    bool? LastTestSucceeded,
    string? LastTestMessage,
    DateTime? UpdatedAtUtc);

public sealed record UpdateMailerConfigurationDto(
    string Provider,
    bool Enabled,
    string? FromName,
    string? FromAddress,
    string? ReplyToAddress,
    string? SmtpHost,
    int SmtpPort,
    bool SmtpEnableSsl,
    string? SmtpUsername,
    string? SmtpPassword,
    bool ClearSmtpPassword,
    string? AppBaseUrl);

public sealed record SendMailerTestRequestDto(string RecipientEmail);

public sealed record MailerTestResultDto(bool Success, string Message, DateTime TestedAtUtc);

public sealed record ResolvedMailerSettings(
    MailerProvider Provider,
    bool Enabled,
    bool IsConfigured,
    string? FromName,
    string? FromAddress,
    string? ReplyToAddress,
    string? Host,
    int Port,
    bool EnableSsl,
    string? Username,
    string? Password,
    string? AppBaseUrl,
    string ConfigurationSource);
