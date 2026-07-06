using System.Text.Json;
using System.Text.RegularExpressions;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using JobTicketSystem.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using DomainCompanyConfiguration = JobTicketSystem.Domain.Entities.CompanyConfiguration;

namespace JobTicketSystem.Application.CompanyConfiguration;

public interface ICompanyConfigurationService
{
    Task<CompanyConfigurationDto> GetAsync(CancellationToken cancellationToken = default);
    Task<CompanyConfigurationDto> UpdateAsync(UpdateCompanyConfigurationDto request, Guid? updatedByUserId, CancellationToken cancellationToken = default);
    Task<CompanyConfigurationDto> UploadLogoAsync(UploadCompanyLogoDto request, Guid? updatedByUserId, CancellationToken cancellationToken = default);
    Task<CompanyLogoDownloadDto?> GetLogoAsync(CancellationToken cancellationToken = default);
}

public interface INewTicketNotificationRecipientsService
{
    Task<IReadOnlyList<NewTicketNotificationRecipientDto>> GetRecipientsAsync(CancellationToken cancellationToken = default);
    Task<NewTicketNotificationRecipientDto> AddRecipientAsync(AddNewTicketNotificationRecipientDto request, Guid? addedByUserId, CancellationToken cancellationToken = default);
    Task<bool> RemoveRecipientAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class CompanyConfigurationService(ApplicationDbContext dbContext, IFileStorageProvider storageProvider) : ICompanyConfigurationService
{
    public const long MaxLogoFileSizeBytes = 2_000_000;

    private static readonly Guid SingletonConfigurationId = Guid.Parse("b8b0a81b-5c16-45b3-9b4e-60d6a55f6125");
    private static readonly Regex HexColorPattern = new("^#[0-9A-Fa-f]{6}$", RegexOptions.Compiled);

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp"
    };

    public async Task<CompanyConfigurationDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var entity = await GetExistingEntityAsync(cancellationToken);
        return entity is null ? MapDefaultDto() : MapDto(entity);
    }

    public async Task<CompanyConfigurationDto> UpdateAsync(UpdateCompanyConfigurationDto request, Guid? updatedByUserId, CancellationToken cancellationToken = default)
    {
        var entity = await GetOrCreateEntityAsync(cancellationToken);
        var oldValuesJson = JsonSerializer.Serialize(new
        {
            entity.CompanyName,
            entity.PrimaryColor,
            entity.SecondaryColor,
            entity.AccentColor
        });

        ApplyRequest(entity, request);
        entity.UpdatedByUserId = updatedByUserId;

        AddAudit(entity.Id, AuditActionType.Update, oldValuesJson, JsonSerializer.Serialize(new
        {
            entity.CompanyName,
            entity.PrimaryColor,
            entity.SecondaryColor,
            entity.AccentColor
        }), updatedByUserId);

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapDto(entity);
    }

    public async Task<CompanyConfigurationDto> UploadLogoAsync(UploadCompanyLogoDto request, Guid? updatedByUserId, CancellationToken cancellationToken = default)
    {
        ValidateLogoRequest(request);
        await ValidateFileSignatureAsync(request.ContentType.Trim(), request.Content, cancellationToken);

        var entity = await GetOrCreateEntityAsync(cancellationToken);
        var originalFileName = request.OriginalFileName.Trim();
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        var storageKey = BuildLogoStorageKey(originalFileName, extension);

        await storageProvider.SaveAsync(storageKey, request.Content, cancellationToken);

        entity.LogoStorageKey = storageKey;
        entity.LogoOriginalFileName = originalFileName;
        entity.LogoContentType = request.ContentType.Trim();
        entity.LogoFileExtension = extension;
        entity.LogoFileSizeBytes = request.FileSizeBytes;
        entity.LogoUploadedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = updatedByUserId;

        AddAudit(entity.Id, AuditActionType.Update, null, JsonSerializer.Serialize(new
        {
            LogoStorageKey = storageKey,
            entity.LogoOriginalFileName,
            entity.LogoContentType,
            entity.LogoFileSizeBytes
        }), updatedByUserId);

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapDto(entity);
    }

    public async Task<CompanyLogoDownloadDto?> GetLogoAsync(CancellationToken cancellationToken = default)
    {
        var entity = await GetExistingEntityAsync(cancellationToken);
        if (entity?.LogoStorageKey is null || entity.LogoOriginalFileName is null || entity.LogoContentType is null)
        {
            return null;
        }

        try
        {
            var stream = await storageProvider.OpenReadAsync(entity.LogoStorageKey, cancellationToken);
            return new CompanyLogoDownloadDto(entity.LogoOriginalFileName, entity.LogoContentType, stream);
        }
        catch (FileNotFoundException)
        {
            return null;
        }
    }

    private async Task<DomainCompanyConfiguration?> GetExistingEntityAsync(CancellationToken cancellationToken)
    {
        return await dbContext.CompanyConfigurations
            .OrderByDescending(x => x.Id == SingletonConfigurationId)
            .ThenBy(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<DomainCompanyConfiguration> GetOrCreateEntityAsync(CancellationToken cancellationToken)
    {
        var entity = await GetExistingEntityAsync(cancellationToken);
        if (entity is not null)
        {
            return entity;
        }

        entity = new DomainCompanyConfiguration
        {
            Id = SingletonConfigurationId,
            CompanyName = CompanyConfigurationDefaults.CompanyName,
            PrimaryColor = CompanyConfigurationDefaults.PrimaryColor,
            SecondaryColor = CompanyConfigurationDefaults.SecondaryColor,
            AccentColor = CompanyConfigurationDefaults.AccentColor
        };

        dbContext.CompanyConfigurations.Add(entity);
        return entity;
    }

    private static void ApplyRequest(DomainCompanyConfiguration entity, UpdateCompanyConfigurationDto request)
    {
        entity.CompanyName = RequiredText(request.CompanyName, nameof(request.CompanyName), 200);
        entity.LegalName = OptionalText(request.LegalName, nameof(request.LegalName), 200);
        entity.ContactName = OptionalText(request.ContactName, nameof(request.ContactName), 200);
        entity.Email = OptionalText(request.Email, nameof(request.Email), 320);
        entity.PartOrderRequestsEmail = OptionalText(request.PartOrderRequestsEmail, nameof(request.PartOrderRequestsEmail), 320);
        entity.Phone = OptionalText(request.Phone, nameof(request.Phone), 50);
        entity.Website = OptionalText(request.Website, nameof(request.Website), 300);
        entity.AddressLine1 = OptionalText(request.AddressLine1, nameof(request.AddressLine1), 200);
        entity.AddressLine2 = OptionalText(request.AddressLine2, nameof(request.AddressLine2), 200);
        entity.City = OptionalText(request.City, nameof(request.City), 100);
        entity.State = OptionalText(request.State, nameof(request.State), 100);
        entity.PostalCode = OptionalText(request.PostalCode, nameof(request.PostalCode), 20);
        entity.Country = OptionalText(request.Country, nameof(request.Country), 100);
        entity.PrimaryColor = NormalizeHexColor(request.PrimaryColor, nameof(request.PrimaryColor));
        entity.SecondaryColor = NormalizeHexColor(request.SecondaryColor, nameof(request.SecondaryColor));
        entity.AccentColor = NormalizeHexColor(request.AccentColor, nameof(request.AccentColor));
        entity.NewTicketNotificationsEnabled = request.NewTicketNotificationsEnabled;
        if (request.NewTicketNotificationMinimumPriority < 1 || request.NewTicketNotificationMinimumPriority > 4)
        {
            throw new ValidationException("NewTicketNotificationMinimumPriority must be between 1 (Low) and 4 (Urgent).");
        }
        entity.NewTicketNotificationMinimumPriority = request.NewTicketNotificationMinimumPriority;
    }

    private static void ValidateLogoRequest(UploadCompanyLogoDto request)
    {
        if (request.FileSizeBytes <= 0)
        {
            throw new ValidationException("Logo file size must be greater than zero.");
        }

        if (request.FileSizeBytes > MaxLogoFileSizeBytes)
        {
            throw new ValidationException("Logo file size must be 2 MB or smaller.");
        }

        if (request.Content is null || !request.Content.CanRead)
        {
            throw new ValidationException("Logo content stream is required.");
        }

        if (!request.Content.CanSeek)
        {
            throw new ValidationException("Logo content stream must support seeking for validation.");
        }

        var originalFileName = request.OriginalFileName?.Trim();
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            throw new ValidationException("Logo file name is required.");
        }

        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            throw new ValidationException("Unsupported logo extension. Supported types: jpg, jpeg, png, webp.");
        }

        var contentType = request.ContentType?.Trim();
        if (string.IsNullOrWhiteSpace(contentType) || !AllowedContentTypes.Contains(contentType))
        {
            throw new ValidationException("Unsupported logo content type. Supported types: image/jpeg, image/png, image/webp.");
        }

        if (!ContentTypeMatchesExtension(extension, contentType))
        {
            throw new ValidationException("Logo extension must match the declared content type.");
        }
    }

    private static string RequiredText(string? value, string fieldName, int maxLength)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new ValidationException($"{fieldName} is required.");
        }

        if (trimmed.Length > maxLength)
        {
            throw new ValidationException($"{fieldName} must be {maxLength} characters or fewer.");
        }

        return trimmed;
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

    private static string NormalizeHexColor(string? value, string fieldName)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new ValidationException($"{fieldName} is required.");
        }

        if (!HexColorPattern.IsMatch(trimmed))
        {
            throw new ValidationException($"{fieldName} must be a 6-digit hex color such as #3157C8.");
        }

        return trimmed.ToUpperInvariant();
    }

    private static async Task ValidateFileSignatureAsync(string contentType, Stream content, CancellationToken cancellationToken)
    {
        var originalPosition = content.Position;
        var buffer = new byte[16];
        var bytesRead = await content.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken);
        content.Position = originalPosition;

        if (!MatchesSignature(contentType, buffer, bytesRead))
        {
            throw new ValidationException("Logo content does not match the declared content type.");
        }
    }

    private static bool ContentTypeMatchesExtension(string extension, string contentType)
    {
        return extension switch
        {
            ".jpg" or ".jpeg" => contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase),
            ".png" => contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase),
            ".webp" => contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase),
            _ => false
        };
    }

    private static bool MatchesSignature(string contentType, byte[] buffer, int bytesRead)
    {
        return contentType.ToLowerInvariant() switch
        {
            "image/jpeg" => StartsWith(buffer, bytesRead, new byte[] { 0xFF, 0xD8, 0xFF }),
            "image/png" => StartsWith(buffer, bytesRead, new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            "image/webp" => IsWebp(buffer, bytesRead),
            _ => false
        };
    }

    private static bool StartsWith(byte[] buffer, int bytesRead, byte[] signature)
    {
        if (bytesRead < signature.Length)
        {
            return false;
        }

        for (var index = 0; index < signature.Length; index++)
        {
            if (buffer[index] != signature[index])
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsWebp(byte[] buffer, int bytesRead)
    {
        return bytesRead >= 12
            && buffer[0] == 0x52
            && buffer[1] == 0x49
            && buffer[2] == 0x46
            && buffer[3] == 0x46
            && buffer[8] == 0x57
            && buffer[9] == 0x45
            && buffer[10] == 0x42
            && buffer[11] == 0x50;
    }

    private static string BuildLogoStorageKey(string originalFileName, string extension)
    {
        var safeFileName = Path.GetFileNameWithoutExtension(originalFileName);
        var normalizedName = string.Concat(safeFileName.Where(character => char.IsLetterOrDigit(character) || character is '-' or '_'));
        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            normalizedName = "logo";
        }

        var now = DateTime.UtcNow;
        return Path.Combine(
                "company-configuration",
                now.Year.ToString(),
                now.Month.ToString("00"),
                $"{Guid.NewGuid():N}_{normalizedName}{extension}")
            .Replace('\\', '/');
    }

    private void AddAudit(Guid entityId, AuditActionType actionType, string? oldValuesJson, string? newValuesJson, Guid? userId)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EntityName = typeof(DomainCompanyConfiguration).Name,
            EntityId = entityId,
            ActionType = actionType,
            OldValuesJson = oldValuesJson,
            NewValuesJson = newValuesJson
        });
    }

    private static CompanyConfigurationDto MapDefaultDto() => new(
        SingletonConfigurationId,
        CompanyConfigurationDefaults.CompanyName,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        CompanyConfigurationDefaults.PrimaryColor,
        CompanyConfigurationDefaults.SecondaryColor,
        CompanyConfigurationDefaults.AccentColor,
        false,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        1);

    private static CompanyConfigurationDto MapDto(DomainCompanyConfiguration entity) => new(
        entity.Id,
        entity.CompanyName,
        entity.LegalName,
        entity.ContactName,
        entity.Email,
        entity.PartOrderRequestsEmail,
        entity.Phone,
        entity.Website,
        entity.AddressLine1,
        entity.AddressLine2,
        entity.City,
        entity.State,
        entity.PostalCode,
        entity.Country,
        entity.PrimaryColor,
        entity.SecondaryColor,
        entity.AccentColor,
        entity.LogoStorageKey is not null,
        entity.LogoOriginalFileName,
        entity.LogoContentType,
        entity.LogoFileSizeBytes,
        entity.LogoUploadedAtUtc,
        entity.CreatedAtUtc,
        entity.UpdatedAtUtc,
        entity.NewTicketNotificationsEnabled,
        entity.NewTicketNotificationMinimumPriority);
}

public static class CompanyConfigurationDefaults
{
    public const string CompanyName = "Job Ticket System";
    public const string PrimaryColor = "#3157C8";
    public const string SecondaryColor = "#172033";
    public const string AccentColor = "#087F5B";
}

public sealed record UpdateCompanyConfigurationDto(
    string CompanyName,
    string? LegalName,
    string? ContactName,
    string? Email,
    string? PartOrderRequestsEmail,
    string? Phone,
    string? Website,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country,
    string PrimaryColor,
    string SecondaryColor,
    string AccentColor,
    bool NewTicketNotificationsEnabled = true,
    int NewTicketNotificationMinimumPriority = 1);

public sealed record NewTicketNotificationRecipientDto(
    Guid Id,
    string Label,
    string Email,
    bool IsActive);

public sealed record AddNewTicketNotificationRecipientDto(
    string Label,
    string Email);

public sealed record UploadCompanyLogoDto(
    string OriginalFileName,
    string ContentType,
    long FileSizeBytes,
    Stream Content);

public sealed record CompanyConfigurationDto(
    Guid Id,
    string CompanyName,
    string? LegalName,
    string? ContactName,
    string? Email,
    string? PartOrderRequestsEmail,
    string? Phone,
    string? Website,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country,
    string PrimaryColor,
    string SecondaryColor,
    string AccentColor,
    bool HasLogo,
    string? LogoOriginalFileName,
    string? LogoContentType,
    long? LogoFileSizeBytes,
    DateTime? LogoUploadedAtUtc,
    DateTime? CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    bool NewTicketNotificationsEnabled,
    int NewTicketNotificationMinimumPriority);

public sealed record CompanyLogoDownloadDto(
    string OriginalFileName,
    string ContentType,
    Stream ContentStream);

public sealed class NewTicketNotificationRecipientsService(ApplicationDbContext dbContext) : INewTicketNotificationRecipientsService
{
    public async Task<IReadOnlyList<NewTicketNotificationRecipientDto>> GetRecipientsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.NewTicketNotificationRecipients
            .OrderBy(r => r.CreatedAtUtc)
            .Select(r => new NewTicketNotificationRecipientDto(r.Id, r.Label, r.Email, r.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<NewTicketNotificationRecipientDto> AddRecipientAsync(
        AddNewTicketNotificationRecipientDto request,
        Guid? addedByUserId,
        CancellationToken cancellationToken = default)
    {
        var label = request.Label?.Trim();
        if (string.IsNullOrWhiteSpace(label) || label.Length > 200)
        {
            throw new ValidationException("Label is required and must be 200 characters or fewer.");
        }

        var email = request.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email) || email.Length > 320)
        {
            throw new ValidationException("Email is required and must be 320 characters or fewer.");
        }

        var entity = new NewTicketNotificationRecipient
        {
            Label = label,
            Email = email,
            IsActive = true,
            AddedByUserId = addedByUserId
        };

        dbContext.NewTicketNotificationRecipients.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new NewTicketNotificationRecipientDto(entity.Id, entity.Label, entity.Email, entity.IsActive);
    }

    public async Task<bool> RemoveRecipientAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.NewTicketNotificationRecipients
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (entity is null) return false;

        dbContext.NewTicketNotificationRecipients.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
