using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Inventory;

public sealed record StockLocationDto(Guid Id, string Name, string Code, string? Description, bool IsActive, bool IsArchived);
public sealed record CreateStockLocationDto(string Name, string Code, string? Description);
public sealed record UpdateStockLocationDto(string Name, string Code, string? Description, bool IsActive);
public sealed record InventoryStockSummaryDto(Guid StockLocationId, string StockLocationName, Guid PartId, string PartNumber, string PartName, decimal QuantityOnHand, DateTime? LastTransactionAtUtc);
public sealed record InventoryTransactionDto(Guid Id, Guid StockLocationId, string StockLocationName, Guid PartId, string PartNumber, string PartName, InventoryTransactionType TransactionType, decimal QuantityDelta, DateTime OccurredAtUtc, string Reason, string? Notes, string? PurchaseOrderNumber);
public sealed record CreateManualInventoryAdjustmentDto(Guid StockLocationId, Guid PartId, decimal QuantityDelta, string Reason, string? Notes, DateTime? OccurredAtUtc);

public interface IInventoryService
{
    Task<IReadOnlyList<StockLocationDto>> ListStockLocationsAsync(PagedQuery query, CancellationToken cancellationToken = default);
    Task<StockLocationDto?> GetStockLocationAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StockLocationDto> CreateStockLocationAsync(CreateStockLocationDto request, CancellationToken cancellationToken = default);
    Task<StockLocationDto?> UpdateStockLocationAsync(Guid id, UpdateStockLocationDto request, CancellationToken cancellationToken = default);
    Task<bool> ArchiveStockLocationAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UnarchiveStockLocationAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryStockSummaryDto>> ListStockSummaryAsync(Guid? stockLocationId = null, Guid? partId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryTransactionDto>> ListTransactionsAsync(Guid? stockLocationId = null, Guid? partId = null, int limit = 100, CancellationToken cancellationToken = default);
    Task<InventoryTransactionDto> CreateManualAdjustmentAsync(CreateManualInventoryAdjustmentDto request, CancellationToken cancellationToken = default);
}

public sealed class InventoryService(ApplicationDbContext dbContext) : IInventoryService
{
    public async Task<IReadOnlyList<StockLocationDto>> ListStockLocationsAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        var locations = query.IncludeArchived ? dbContext.StockLocations.IgnoreQueryFilters() : dbContext.StockLocations;
        return await locations
            .OrderBy(x => x.Name)
            .ThenBy(x => x.Code)
            .Skip(query.NormalizedOffset)
            .Take(query.NormalizedLimit)
            .Select(MapStockLocation)
            .ToListAsync(cancellationToken);
    }

    public Task<StockLocationDto?> GetStockLocationAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.StockLocations.IgnoreQueryFilters().Where(x => x.Id == id).Select(MapStockLocation).SingleOrDefaultAsync(cancellationToken);

    public async Task<StockLocationDto> CreateStockLocationAsync(CreateStockLocationDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        ValidationHelpers.ValidateRequired(request.Code, nameof(request.Code));

        var normalizedCode = NormalizeCode(request.Code);
        await EnsureStockLocationCodeUniqueAsync(normalizedCode, null, cancellationToken);

        var entity = new StockLocation
        {
            Name = request.Name.Trim(),
            Code = normalizedCode,
            Description = ValidationHelpers.NullIfWhitespace(request.Description),
            IsActive = true
        };

        dbContext.StockLocations.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapStockLocation.Compile().Invoke(entity);
    }

    public async Task<StockLocationDto?> UpdateStockLocationAsync(Guid id, UpdateStockLocationDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        ValidationHelpers.ValidateRequired(request.Code, nameof(request.Code));

        var entity = await dbContext.StockLocations.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        var normalizedCode = NormalizeCode(request.Code);
        await EnsureStockLocationCodeUniqueAsync(normalizedCode, entity.Id, cancellationToken);

        entity.Name = request.Name.Trim();
        entity.Code = normalizedCode;
        entity.Description = ValidationHelpers.NullIfWhitespace(request.Description);
        entity.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapStockLocation.Compile().Invoke(entity);
    }

    public async Task<bool> ArchiveStockLocationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.StockLocations.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.IsActive = false;
        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnarchiveStockLocationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.StockLocations.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        await EnsureStockLocationCodeUniqueAsync(entity.Code, entity.Id, cancellationToken);
        entity.IsDeleted = false;
        entity.DeletedAtUtc = null;
        entity.IsActive = true;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<InventoryStockSummaryDto>> ListStockSummaryAsync(Guid? stockLocationId = null, Guid? partId = null, CancellationToken cancellationToken = default)
    {
        var groupedQuery = dbContext.InventoryTransactions.AsQueryable();

        if (stockLocationId.HasValue)
        {
            groupedQuery = groupedQuery.Where(x => x.StockLocationId == stockLocationId.Value);
        }

        if (partId.HasValue)
        {
            groupedQuery = groupedQuery.Where(x => x.PartId == partId.Value);
        }

        var summaryQuery = groupedQuery
            .GroupBy(x => new
            {
                x.StockLocationId,
                x.PartId
            })
            .Select(group => new
            {
                group.Key.StockLocationId,
                group.Key.PartId,
                QuantityOnHand = group.Sum(item => item.QuantityDelta),
                LastTransactionAtUtc = group.Max(item => (DateTime?)item.OccurredAtUtc)
            });

        return await summaryQuery
            .Join(
                dbContext.StockLocations,
                summary => summary.StockLocationId,
                stockLocation => stockLocation.Id,
                (summary, stockLocation) => new { summary, stockLocation })
            .Join(
                dbContext.Parts,
                joined => joined.summary.PartId,
                part => part.Id,
                (joined, part) => new InventoryStockSummaryDto(
                    joined.summary.StockLocationId,
                    joined.stockLocation.Name,
                    joined.summary.PartId,
                    part.PartNumber,
                    part.Name,
                    joined.summary.QuantityOnHand,
                    joined.summary.LastTransactionAtUtc))
            .OrderBy(x => x.StockLocationName)
            .ThenBy(x => x.PartNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryTransactionDto>> ListTransactionsAsync(Guid? stockLocationId = null, Guid? partId = null, int limit = 100, CancellationToken cancellationToken = default)
    {
        var normalizedLimit = Math.Clamp(limit, 1, 200);
        var query = dbContext.InventoryTransactions
            .Include(x => x.StockLocation)
            .Include(x => x.Part)
            .Include(x => x.PurchaseOrder)
            .AsQueryable();

        if (stockLocationId.HasValue)
        {
            query = query.Where(x => x.StockLocationId == stockLocationId.Value);
        }

        if (partId.HasValue)
        {
            query = query.Where(x => x.PartId == partId.Value);
        }

        return await query
            .OrderByDescending(x => x.OccurredAtUtc)
            .ThenByDescending(x => x.CreatedAtUtc)
            .Take(normalizedLimit)
            .Select(MapTransaction)
            .ToListAsync(cancellationToken);
    }

    public async Task<InventoryTransactionDto> CreateManualAdjustmentAsync(CreateManualInventoryAdjustmentDto request, CancellationToken cancellationToken = default)
    {
        if (request.StockLocationId == Guid.Empty)
        {
            throw new ValidationException("StockLocationId is required.");
        }

        if (request.PartId == Guid.Empty)
        {
            throw new ValidationException("PartId is required.");
        }

        if (request.QuantityDelta == 0)
        {
            throw new ValidationException("QuantityDelta must not be zero.");
        }

        ValidationHelpers.ValidateRequired(request.Reason, nameof(request.Reason));

        await EnsureStockLocationExistsAsync(request.StockLocationId, cancellationToken);
        await EnsurePartExistsAsync(request.PartId, cancellationToken);

        var entity = new InventoryTransaction
        {
            StockLocationId = request.StockLocationId,
            PartId = request.PartId,
            TransactionType = InventoryTransactionType.ManualAdjustment,
            QuantityDelta = request.QuantityDelta,
            Reason = request.Reason.Trim(),
            Notes = ValidationHelpers.NullIfWhitespace(request.Notes),
            OccurredAtUtc = ToUtcOrNow(request.OccurredAtUtc)
        };

        dbContext.InventoryTransactions.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await RecalculatePartQuantityOnHandAsync(request.PartId, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await dbContext.InventoryTransactions
            .Include(x => x.StockLocation)
            .Include(x => x.Part)
            .Include(x => x.PurchaseOrder)
            .Where(x => x.Id == entity.Id)
            .Select(MapTransaction)
            .SingleAsync(cancellationToken);
    }

    private async Task EnsureStockLocationCodeUniqueAsync(string code, Guid? currentId, CancellationToken cancellationToken)
    {
        var exists = await dbContext.StockLocations.IgnoreQueryFilters().AnyAsync(
            x => x.Code == code && (!currentId.HasValue || x.Id != currentId.Value),
            cancellationToken);

        if (exists)
        {
            throw new ValidationException("Code must be unique.");
        }
    }

    private async Task EnsureStockLocationExistsAsync(Guid id, CancellationToken cancellationToken)
    {
        var exists = await dbContext.StockLocations.AnyAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (!exists)
        {
            throw new ValidationException("StockLocationId does not reference an active stock location.");
        }
    }

    private async Task EnsurePartExistsAsync(Guid id, CancellationToken cancellationToken)
    {
        var exists = await dbContext.Parts.AnyAsync(x => x.Id == id, cancellationToken);
        if (!exists)
        {
            throw new ValidationException("PartId does not reference an active part.");
        }
    }

    private async Task RecalculatePartQuantityOnHandAsync(Guid partId, CancellationToken cancellationToken)
    {
        var part = await dbContext.Parts.SingleAsync(x => x.Id == partId, cancellationToken);
        part.QuantityOnHand = await dbContext.InventoryTransactions
            .Where(x => x.PartId == partId)
            .SumAsync(x => x.QuantityDelta, cancellationToken);
    }

    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();
    private static DateTime ToUtcOrNow(DateTime? value) => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : DateTime.UtcNow;

    private static readonly System.Linq.Expressions.Expression<Func<StockLocation, StockLocationDto>> MapStockLocation = x =>
        new StockLocationDto(x.Id, x.Name, x.Code, x.Description, x.IsActive, x.IsDeleted);

    private static readonly System.Linq.Expressions.Expression<Func<InventoryTransaction, InventoryTransactionDto>> MapTransaction = x =>
        new InventoryTransactionDto(
            x.Id,
            x.StockLocationId,
            x.StockLocation.Name,
            x.PartId,
            x.Part.PartNumber,
            x.Part.Name,
            x.TransactionType,
            x.QuantityDelta,
            x.OccurredAtUtc,
            x.Reason,
            x.Notes,
            x.PurchaseOrder != null ? x.PurchaseOrder.PurchaseOrderNumber : null);
}