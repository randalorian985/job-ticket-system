using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.MasterData;

public interface IEquipmentCompatiblePartsService
{
    Task<EquipmentCompatiblePartsDto> GetForEquipmentAsync(Guid equipmentId, CancellationToken cancellationToken = default);
    Task<EquipmentCompatiblePartDto> AddAsync(Guid equipmentId, AddEquipmentCompatiblePartDto request, Guid addedByUserId, CancellationToken cancellationToken = default);
    Task<bool> RemoveAsync(Guid equipmentId, Guid partId, CancellationToken cancellationToken = default);
    Task<bool> UpdateNotesAsync(Guid equipmentId, Guid partId, UpdateEquipmentCompatiblePartDto request, CancellationToken cancellationToken = default);
}

public sealed class EquipmentCompatiblePartsService(ApplicationDbContext dbContext) : IEquipmentCompatiblePartsService
{
    public async Task<EquipmentCompatiblePartsDto> GetForEquipmentAsync(Guid equipmentId, CancellationToken cancellationToken = default)
    {
        var compatible = await dbContext.EquipmentCompatibleParts
            .Where(x => x.EquipmentId == equipmentId)
            .Include(x => x.Part).ThenInclude(p => p.PartCategory)
            .Include(x => x.Part).ThenInclude(p => p.Vendor)
            .OrderBy(x => x.Part.Name)
            .Select(x => new EquipmentCompatiblePartDto(
                x.PartId,
                x.Part.PartNumber,
                x.Part.Name,
                x.Part.Description,
                x.Part.PartCategory.Name,
                x.Part.Vendor != null ? x.Part.Vendor.Name : null,
                x.Part.UnitCost,
                x.Notes,
                x.IsRecommendedForPM,
                x.AddedByUserId,
                x.AddedAtUtc))
            .ToListAsync(cancellationToken);

        // Part usage history: parts used on any ticket tied to this equipment
        var history = await dbContext.JobTicketParts
            .Where(x => x.EquipmentId == equipmentId && !x.IsDeleted)
            .Include(x => x.JobTicket)
            .Include(x => x.Part).ThenInclude(p => p!.Vendor)
            .OrderByDescending(x => x.AddedAtUtc)
            .Select(x => new EquipmentPartHistoryDto(
                x.PartId,
                x.PartNumberSnapshot,
                x.PartNameSnapshot,
                x.Quantity,
                x.UnitCostSnapshot,
                x.JobTicketId,
                x.JobTicket.Title,
                x.Part != null && x.Part.Vendor != null ? x.Part.Vendor.Name : null,
                x.InstalledAtUtc,
                x.AddedAtUtc,
                x.Status.ToString(),
                x.ApprovalStatus.ToString()))
            .Take(100)
            .ToListAsync(cancellationToken);

        return new EquipmentCompatiblePartsDto(compatible, history);
    }

    public async Task<EquipmentCompatiblePartDto> AddAsync(Guid equipmentId, AddEquipmentCompatiblePartDto request, Guid addedByUserId, CancellationToken cancellationToken = default)
    {
        if (!await dbContext.Equipment.AnyAsync(x => x.Id == equipmentId && !x.IsDeleted, cancellationToken))
            throw new ValidationException("Equipment not found.");

        var part = await dbContext.Parts
            .Include(p => p.PartCategory)
            .Include(p => p.Vendor)
            .FirstOrDefaultAsync(p => p.Id == request.PartId && !p.IsDeleted, cancellationToken)
            ?? throw new ValidationException("Part not found.");

        var exists = await dbContext.EquipmentCompatibleParts
            .AnyAsync(x => x.EquipmentId == equipmentId && x.PartId == request.PartId, cancellationToken);
        if (exists)
            throw new ValidationException("This part is already in the compatible parts catalog for this equipment.");

        var entry = new EquipmentCompatiblePart
        {
            EquipmentId = equipmentId,
            PartId = request.PartId,
            Notes = ValidationHelpers.NullIfWhitespace(request.Notes?.Trim()),
            IsRecommendedForPM = request.IsRecommendedForPM,
            AddedByUserId = addedByUserId,
            AddedAtUtc = DateTime.UtcNow
        };

        dbContext.EquipmentCompatibleParts.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new EquipmentCompatiblePartDto(
            part.Id, part.PartNumber, part.Name, part.Description,
            part.PartCategory.Name, part.Vendor?.Name, part.UnitCost,
            entry.Notes, entry.IsRecommendedForPM, entry.AddedByUserId, entry.AddedAtUtc);
    }

    public async Task<bool> RemoveAsync(Guid equipmentId, Guid partId, CancellationToken cancellationToken = default)
    {
        var entry = await dbContext.EquipmentCompatibleParts
            .FirstOrDefaultAsync(x => x.EquipmentId == equipmentId && x.PartId == partId, cancellationToken);
        if (entry is null) return false;

        dbContext.EquipmentCompatibleParts.Remove(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateNotesAsync(Guid equipmentId, Guid partId, UpdateEquipmentCompatiblePartDto request, CancellationToken cancellationToken = default)
    {
        var entry = await dbContext.EquipmentCompatibleParts
            .FirstOrDefaultAsync(x => x.EquipmentId == equipmentId && x.PartId == partId, cancellationToken);
        if (entry is null) return false;

        entry.Notes = ValidationHelpers.NullIfWhitespace(request.Notes?.Trim());
        entry.IsRecommendedForPM = request.IsRecommendedForPM;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public sealed record EquipmentCompatiblePartsDto(
    IReadOnlyList<EquipmentCompatiblePartDto> Catalog,
    IReadOnlyList<EquipmentPartHistoryDto> History);

public sealed record EquipmentCompatiblePartDto(
    Guid PartId,
    string PartNumber,
    string PartName,
    string? Description,
    string CategoryName,
    string? VendorName,
    decimal UnitCost,
    string? Notes,
    bool IsRecommendedForPM,
    Guid AddedByUserId,
    DateTime AddedAtUtc);

public sealed record EquipmentPartHistoryDto(
    Guid? PartId,
    string PartNumber,
    string PartName,
    decimal Quantity,
    decimal UnitCost,
    Guid JobTicketId,
    string JobTicketTitle,
    string? VendorName,
    DateTime? InstalledAtUtc,
    DateTime AddedAtUtc,
    string Status,
    string ApprovalStatus);

public sealed record AddEquipmentCompatiblePartDto(
    Guid PartId,
    string? Notes,
    bool IsRecommendedForPM = false);

public sealed record UpdateEquipmentCompatiblePartDto(
    string? Notes,
    bool IsRecommendedForPM);
