using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using JobTicketSystem.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.JobTickets;

public interface IJobTicketFilesService
{
    Task<IReadOnlyList<JobTicketFileDto>> ListAsync(Guid jobTicketId, CancellationToken cancellationToken = default);
    Task<JobTicketFileDto?> GetAsync(Guid jobTicketId, Guid fileId, CancellationToken cancellationToken = default);
    Task<JobTicketFileDto> UploadAsync(Guid jobTicketId, UploadJobTicketFileDto request, CancellationToken cancellationToken = default);
    Task<JobTicketFileDownloadDto?> GetDownloadAsync(Guid jobTicketId, Guid fileId, CancellationToken cancellationToken = default);
    Task<JobTicketFileDto?> UpdateAsync(Guid jobTicketId, Guid fileId, UpdateJobTicketFileDto request, CancellationToken cancellationToken = default);
    Task<JobTicketFileDto?> ArchiveAsync(Guid jobTicketId, Guid fileId, ArchiveJobTicketFileDto request, CancellationToken cancellationToken = default);
}

public sealed class JobTicketFilesService(ApplicationDbContext dbContext, IFileStorageProvider storageProvider) : IJobTicketFilesService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".pdf"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "application/pdf"
    };

    public async Task<IReadOnlyList<JobTicketFileDto>> ListAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        await EnsureActiveJobTicketAsync(jobTicketId, cancellationToken);

        return await dbContext.JobTicketFiles
            .Where(x => x.JobTicketId == jobTicketId)
            .OrderByDescending(x => x.UploadedAtUtc)
            .Select(MapDto)
            .ToListAsync(cancellationToken);
    }

    public async Task<JobTicketFileDto?> GetAsync(Guid jobTicketId, Guid fileId, CancellationToken cancellationToken = default)
    {
        await EnsureActiveJobTicketAsync(jobTicketId, cancellationToken);

        return await dbContext.JobTicketFiles
            .Where(x => x.JobTicketId == jobTicketId && x.Id == fileId)
            .Select(MapDto)
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<JobTicketFileDto> UploadAsync(Guid jobTicketId, UploadJobTicketFileDto request, CancellationToken cancellationToken = default)
    {
        var jobTicket = await dbContext.JobTickets
            .Where(x => x.Id == jobTicketId)
            .Select(x => new { x.Id, x.EquipmentId, x.ServiceLocationId })
            .SingleOrDefaultAsync(cancellationToken);

        if (jobTicket is null)
        {
            throw new ValidationException("Job ticket was not found.");
        }

        if (request.FileSizeBytes <= 0)
        {
            throw new ValidationException("File size must be greater than zero.");
        }

        if (request.Content is null || !request.Content.CanRead)
        {
            throw new ValidationException("File content stream is required.");
        }

        var trimmedName = request.OriginalFileName?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            throw new ValidationException("OriginalFileName is required.");
        }

        var extension = Path.GetExtension(trimmedName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            throw new ValidationException("Unsupported file extension. Supported types: jpg, jpeg, png, webp, pdf.");
        }

        var contentType = request.ContentType?.Trim();
        if (string.IsNullOrWhiteSpace(contentType) || !AllowedContentTypes.Contains(contentType))
        {
            throw new ValidationException("Unsupported content type. Supported types: image/jpeg, image/png, image/webp, application/pdf.");
        }

        if (request.UploadedByEmployeeId.HasValue)
        {
            var uploadedByExists = await dbContext.Employees.AnyAsync(x => x.Id == request.UploadedByEmployeeId.Value, cancellationToken);
            if (!uploadedByExists)
            {
                throw new ValidationException("UploadedByEmployeeId does not reference an active employee.");
            }
        }

        if (request.EquipmentId.HasValue)
        {
            var equipment = await dbContext.Equipment
                .Where(x => x.Id == request.EquipmentId.Value)
                .Select(x => new { x.Id, x.ServiceLocationId })
                .SingleOrDefaultAsync(cancellationToken);

            if (equipment is null)
            {
                throw new ValidationException("EquipmentId does not reference an active equipment record.");
            }

            if (jobTicket.EquipmentId.HasValue && jobTicket.EquipmentId.Value != equipment.Id)
            {
                throw new ValidationException("EquipmentId must match the job ticket equipment when one is assigned.");
            }

            if (!jobTicket.EquipmentId.HasValue && jobTicket.ServiceLocationId != equipment.ServiceLocationId)
            {
                throw new ValidationException("EquipmentId must belong to the same service location as the job ticket.");
            }
        }

        if (request.WorkEntryId.HasValue)
        {
            var workEntryExists = await dbContext.JobWorkEntries.AnyAsync(
                x => x.Id == request.WorkEntryId.Value && x.JobTicketId == jobTicketId,
                cancellationToken);
            if (!workEntryExists)
            {
                throw new ValidationException("WorkEntryId does not reference a work entry on this job ticket.");
            }
        }

        var storageKey = storageProvider.GenerateStorageKey(jobTicketId, trimmedName, extension);
        await storageProvider.SaveAsync(storageKey, request.Content, cancellationToken);

        var entity = new JobTicketFile
        {
            JobTicketId = jobTicketId,
            EquipmentId = request.EquipmentId,
            WorkEntryId = request.WorkEntryId,
            UploadedByEmployeeId = request.UploadedByEmployeeId,
            OriginalFileName = trimmedName,
            StorageKey = storageKey,
            ContentType = contentType,
            FileExtension = extension,
            FileSizeBytes = request.FileSizeBytes,
            Caption = ValidationHelpers.NullIfWhitespace(request.Caption),
            Visibility = request.Visibility,
            IsInvoiceAttachment = request.IsInvoiceAttachment,
            UploadedAtUtc = DateTime.UtcNow
        };

        dbContext.JobTicketFiles.Add(entity);
        AddAudit(entity.Id, AuditActionType.Create, null, $"{{\"JobTicketId\":\"{jobTicketId}\",\"StorageKey\":\"{entity.StorageKey}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapDto.Compile().Invoke(entity);
    }

    public async Task<JobTicketFileDownloadDto?> GetDownloadAsync(Guid jobTicketId, Guid fileId, CancellationToken cancellationToken = default)
    {
        await EnsureActiveJobTicketAsync(jobTicketId, cancellationToken);

        var file = await dbContext.JobTicketFiles
            .Where(x => x.JobTicketId == jobTicketId && x.Id == fileId)
            .SingleOrDefaultAsync(cancellationToken);

        if (file is null)
        {
            return null;
        }

        var stream = await storageProvider.OpenReadAsync(file.StorageKey, cancellationToken);
        return new JobTicketFileDownloadDto(file.Id, file.OriginalFileName, file.ContentType, stream);
    }

    public async Task<JobTicketFileDto?> UpdateAsync(Guid jobTicketId, Guid fileId, UpdateJobTicketFileDto request, CancellationToken cancellationToken = default)
    {
        await EnsureActiveJobTicketAsync(jobTicketId, cancellationToken);

        var entity = await dbContext.JobTicketFiles
            .SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.Id == fileId, cancellationToken);

        if (entity is null)
        {
            return null;
        }

        var oldValuesJson = $"{{\"Caption\":\"{entity.Caption}\",\"Visibility\":\"{entity.Visibility}\",\"IsInvoiceAttachment\":{entity.IsInvoiceAttachment.ToString().ToLowerInvariant()}}}";
        entity.Caption = ValidationHelpers.NullIfWhitespace(request.Caption);
        entity.Visibility = request.Visibility;
        entity.IsInvoiceAttachment = request.IsInvoiceAttachment;

        var newValuesJson = $"{{\"Caption\":\"{entity.Caption}\",\"Visibility\":\"{entity.Visibility}\",\"IsInvoiceAttachment\":{entity.IsInvoiceAttachment.ToString().ToLowerInvariant()}}}";

        AddAudit(entity.Id, AuditActionType.Update, oldValuesJson, newValuesJson);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapDto.Compile().Invoke(entity);
    }

    public async Task<JobTicketFileDto?> ArchiveAsync(Guid jobTicketId, Guid fileId, ArchiveJobTicketFileDto request, CancellationToken cancellationToken = default)
    {
        await EnsureActiveJobTicketAsync(jobTicketId, cancellationToken);

        var entity = await dbContext.JobTicketFiles
            .SingleOrDefaultAsync(x => x.JobTicketId == jobTicketId && x.Id == fileId, cancellationToken);

        if (entity is null)
        {
            return null;
        }

        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        entity.DeletedByUserId = request.ArchivedByEmployeeId;

        AddAudit(entity.Id, AuditActionType.Delete, null, $"{{\"ArchivedByEmployeeId\":\"{request.ArchivedByEmployeeId}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapDto.Compile().Invoke(entity);
    }

    private async Task EnsureActiveJobTicketAsync(Guid jobTicketId, CancellationToken cancellationToken)
    {
        var exists = await dbContext.JobTickets.AnyAsync(x => x.Id == jobTicketId, cancellationToken);
        if (!exists)
        {
            throw new ValidationException("Job ticket was not found.");
        }
    }

    private void AddAudit(Guid fileId, AuditActionType actionType, string? oldValuesJson, string? newValuesJson)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            EntityName = nameof(JobTicketFile),
            EntityId = fileId,
            ActionType = actionType,
            OldValuesJson = oldValuesJson,
            NewValuesJson = newValuesJson
        });
    }

    private static readonly System.Linq.Expressions.Expression<Func<JobTicketFile, JobTicketFileDto>> MapDto =
        entity => new JobTicketFileDto(
            entity.Id,
            entity.JobTicketId,
            entity.EquipmentId,
            entity.WorkEntryId,
            entity.UploadedByEmployeeId,
            entity.OriginalFileName,
            entity.StorageKey,
            entity.ContentType,
            entity.FileExtension,
            entity.FileSizeBytes,
            entity.Caption,
            entity.Visibility,
            entity.IsInvoiceAttachment,
            entity.UploadedAtUtc);
}

public sealed record UploadJobTicketFileDto(
    string OriginalFileName,
    string ContentType,
    long FileSizeBytes,
    Stream Content,
    string? Caption,
    FileVisibility Visibility,
    bool IsInvoiceAttachment,
    Guid? UploadedByEmployeeId,
    Guid? EquipmentId,
    Guid? WorkEntryId);

public sealed record UpdateJobTicketFileDto(
    string? Caption,
    FileVisibility Visibility,
    bool IsInvoiceAttachment);

public sealed record ArchiveJobTicketFileDto(Guid? ArchivedByEmployeeId);

public sealed record JobTicketFileDto(
    Guid Id,
    Guid JobTicketId,
    Guid? EquipmentId,
    Guid? WorkEntryId,
    Guid? UploadedByEmployeeId,
    string OriginalFileName,
    string StorageKey,
    string ContentType,
    string FileExtension,
    long FileSizeBytes,
    string? Caption,
    FileVisibility Visibility,
    bool IsInvoiceAttachment,
    DateTime UploadedAtUtc);

public sealed record JobTicketFileDownloadDto(
    Guid Id,
    string OriginalFileName,
    string ContentType,
    Stream ContentStream);
