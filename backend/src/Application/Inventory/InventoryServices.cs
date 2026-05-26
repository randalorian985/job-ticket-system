using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Inventory;

public sealed record InventoryLocationDto(Guid Id, string Name, string Code, string? Description, bool IsDefault, bool IsArchived);
public sealed record InventoryTransactionDto(Guid Id, Guid PartId, string PartNumber, string PartName, Guid InventoryLocationId, string InventoryLocationName, string TransactionType, decimal QuantityDelta, decimal QuantityAfter, Guid? PurchaseOrderId, string Reason, DateTime CreatedAtUtc);
public sealed record InventoryListItemDto(Guid PartId, string PartNumber, string PartName, Guid InventoryLocationId, string InventoryLocationName, decimal OnHandQuantity);
public sealed record InventoryDetailDto(InventoryListItemDto Item, IReadOnlyList<InventoryTransactionDto> History);
public sealed record CreateInventoryLocationDto(string Name, string Code, string? Description, bool IsDefault = false);
public sealed record CreateManualInventoryAdjustmentDto(Guid PartId, Guid InventoryLocationId, decimal QuantityDelta, string Reason);

public interface IInventoryService
{
    Task<IReadOnlyList<InventoryListItemDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<InventoryDetailDto?> GetAsync(Guid partId, Guid inventoryLocationId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryLocationDto>> ListLocationsAsync(bool includeArchived = false, CancellationToken cancellationToken = default);
    Task<InventoryLocationDto> CreateLocationAsync(CreateInventoryLocationDto request, CancellationToken cancellationToken = default);
    Task<InventoryTransactionDto> CreateManualAdjustmentAsync(CreateManualInventoryAdjustmentDto request, CancellationToken cancellationToken = default);
}

public sealed class InventoryService(ApplicationDbContext dbContext) : IInventoryService
{
    public async Task<IReadOnlyList<InventoryListItemDto>> ListAsync(CancellationToken cancellationToken = default) =>
        await dbContext.InventoryTransactions.AsNoTracking()
            .GroupBy(x => new { x.PartId, x.Part.PartNumber, PartName = x.Part.Name, x.InventoryLocationId, LocationName = x.InventoryLocation.Name })
            .Select(g => new InventoryListItemDto(g.Key.PartId, g.Key.PartNumber, g.Key.PartName, g.Key.InventoryLocationId, g.Key.LocationName, g.Sum(x => x.QuantityDelta)))
            .OrderBy(x => x.PartNumber)
            .ToListAsync(cancellationToken);

    public async Task<InventoryDetailDto?> GetAsync(Guid partId, Guid inventoryLocationId, CancellationToken cancellationToken = default)
    {
        var item = (await ListAsync(cancellationToken)).SingleOrDefault(x => x.PartId == partId && x.InventoryLocationId == inventoryLocationId);
        if (item is null) return null;
        var history = await dbContext.InventoryTransactions.AsNoTracking()
            .Where(x => x.PartId == partId && x.InventoryLocationId == inventoryLocationId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new InventoryTransactionDto(x.Id, x.PartId, x.Part.PartNumber, x.Part.Name, x.InventoryLocationId, x.InventoryLocation.Name, x.TransactionType, x.QuantityDelta, x.QuantityAfter, x.PurchaseOrderId, x.Reason, x.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        return new InventoryDetailDto(item, history);
    }

    public async Task<IReadOnlyList<InventoryLocationDto>> ListLocationsAsync(bool includeArchived = false, CancellationToken cancellationToken = default)
    {
        var query = includeArchived ? dbContext.InventoryLocations.IgnoreQueryFilters() : dbContext.InventoryLocations;
        return await query.OrderBy(x => x.Code).Select(x => new InventoryLocationDto(x.Id, x.Name, x.Code, x.Description, x.IsDefault, x.IsDeleted)).ToListAsync(cancellationToken);
    }

    public async Task<InventoryLocationDto> CreateLocationAsync(CreateInventoryLocationDto request, CancellationToken cancellationToken = default)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(code)) throw new ValidationException("Name and code are required.");
        if (await dbContext.InventoryLocations.IgnoreQueryFilters().AnyAsync(x => x.Code == code, cancellationToken)) throw new ValidationException("Code must be unique.");
        var entity = new Domain.Entities.InventoryLocation { Name = request.Name.Trim(), Code = code, Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(), IsDefault = request.IsDefault };
        if (request.IsDefault)
        {
            var existingDefaults = await dbContext.InventoryLocations.Where(x => x.IsDefault).ToListAsync(cancellationToken);
            existingDefaults.ForEach(x => x.IsDefault = false);
        }
        dbContext.InventoryLocations.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new InventoryLocationDto(entity.Id, entity.Name, entity.Code, entity.Description, entity.IsDefault, entity.IsDeleted);
    }

    public async Task<InventoryTransactionDto> CreateManualAdjustmentAsync(CreateManualInventoryAdjustmentDto request, CancellationToken cancellationToken = default)
    {
        if (request.QuantityDelta == 0) throw new ValidationException("QuantityDelta cannot be zero.");
        if (string.IsNullOrWhiteSpace(request.Reason)) throw new ValidationException("Reason is required.");
        var part = await dbContext.Parts.SingleOrDefaultAsync(x => x.Id == request.PartId, cancellationToken) ?? throw new ValidationException("PartId is invalid.");
        var location = await dbContext.InventoryLocations.SingleOrDefaultAsync(x => x.Id == request.InventoryLocationId, cancellationToken) ?? throw new ValidationException("InventoryLocationId is invalid.");
        var current = await dbContext.InventoryTransactions.Where(x => x.PartId == request.PartId && x.InventoryLocationId == request.InventoryLocationId).SumAsync(x => x.QuantityDelta, cancellationToken);
        var tx = new Domain.Entities.InventoryTransaction { PartId = request.PartId, InventoryLocationId = request.InventoryLocationId, QuantityDelta = request.QuantityDelta, QuantityAfter = current + request.QuantityDelta, TransactionType = "ManualAdjustment", Reason = request.Reason.Trim() };
        dbContext.InventoryTransactions.Add(tx);
        part.QuantityOnHand += request.QuantityDelta;
        await dbContext.SaveChangesAsync(cancellationToken);
        return new InventoryTransactionDto(tx.Id, tx.PartId, part.PartNumber, part.Name, tx.InventoryLocationId, location.Name, tx.TransactionType, tx.QuantityDelta, tx.QuantityAfter, tx.PurchaseOrderId, tx.Reason, tx.CreatedAtUtc);
    }
}
