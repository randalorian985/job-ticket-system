using FluentValidation;
using JobTicketSystem.Application.Inventory;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class InventoryServicesTests
{
    [Fact]
    public async Task Manual_adjustment_creates_transaction_and_recalculates_part_quantity_on_hand()
    {
        await using var context = CreateContext();
        var (location, part) = await SeedLocationAndPartAsync(context);
        var service = new InventoryService(context);

        var created = await service.CreateManualAdjustmentAsync(new CreateManualInventoryAdjustmentDto(
            location.Id,
            part.Id,
            3m,
            "Cycle count correction",
            "Found extra stock",
            new DateTime(2026, 5, 25, 9, 30, 0, DateTimeKind.Utc)));

        Assert.Equal(3m, created.QuantityDelta);
        Assert.Equal("Main Warehouse", created.StockLocationName);
        Assert.Equal("SEAL-1", created.PartNumber);
        Assert.Equal(3m, (await context.Parts.SingleAsync(x => x.Id == part.Id)).QuantityOnHand);
    }

    [Fact]
    public async Task Stock_summary_groups_manual_adjustments_by_location_and_part()
    {
        await using var context = CreateContext();
        var (location, part) = await SeedLocationAndPartAsync(context);
        var service = new InventoryService(context);

        await service.CreateManualAdjustmentAsync(new CreateManualInventoryAdjustmentDto(location.Id, part.Id, 2m, "Counted inbound shelf stock", null, null));
        await service.CreateManualAdjustmentAsync(new CreateManualInventoryAdjustmentDto(location.Id, part.Id, -1m, "Removed damaged item", null, null));

        var summary = await service.ListStockSummaryAsync(location.Id, part.Id);

        var row = Assert.Single(summary);
        Assert.Equal("Main Warehouse", row.StockLocationName);
        Assert.Equal("SEAL-1", row.PartNumber);
        Assert.Equal(1m, row.QuantityOnHand);
        Assert.NotNull(row.LastTransactionAtUtc);
    }

    [Fact]
    public async Task Warehouse_transfer_creates_offsetting_transactions_and_updates_location_stock()
    {
        await using var context = CreateContext();
        var (sourceLocation, part) = await SeedLocationAndPartAsync(context);
        var destinationLocation = new StockLocation { Name = "Overflow Cage", Code = "OVR", Description = "Secondary stock room" };
        context.StockLocations.Add(destinationLocation);
        await context.SaveChangesAsync();

        var service = new InventoryService(context);
        await service.CreateManualAdjustmentAsync(new CreateManualInventoryAdjustmentDto(sourceLocation.Id, part.Id, 5m, "Opening count", null, null));

        var transfer = await service.CreateTransferAsync(new CreateInventoryTransferDto(
            sourceLocation.Id,
            destinationLocation.Id,
            part.Id,
            2m,
            "Rebalance stock",
            "Needed for west aisle",
            new DateTime(2026, 5, 26, 14, 0, 0, DateTimeKind.Utc)));

        Assert.Equal(2m, transfer.Quantity);
        Assert.Equal("Main Warehouse", transfer.SourceStockLocationName);
        Assert.Equal("Overflow Cage", transfer.DestinationStockLocationName);
        Assert.Equal(5m, (await context.Parts.SingleAsync(x => x.Id == part.Id)).QuantityOnHand);

        var summary = await service.ListStockSummaryAsync(partId: part.Id);
        Assert.Contains(summary, row => row.StockLocationId == sourceLocation.Id && row.QuantityOnHand == 3m);
        Assert.Contains(summary, row => row.StockLocationId == destinationLocation.Id && row.QuantityOnHand == 2m);

        var transactions = await service.ListTransactionsAsync(partId: part.Id, limit: 10);
        Assert.Contains(transactions, row => row.Id == transfer.SourceTransactionId && row.TransactionType == InventoryTransactionType.Transfer && row.QuantityDelta == -2m && row.Notes == "To Overflow Cage (OVR). Needed for west aisle");
        Assert.Contains(transactions, row => row.Id == transfer.DestinationTransactionId && row.TransactionType == InventoryTransactionType.Transfer && row.QuantityDelta == 2m && row.Notes == "From Main Warehouse (MAIN). Needed for west aisle");
    }

    [Fact]
    public async Task Warehouse_transfer_rejects_same_source_and_destination_location()
    {
        await using var context = CreateContext();
        var (location, part) = await SeedLocationAndPartAsync(context);
        var service = new InventoryService(context);
        await service.CreateManualAdjustmentAsync(new CreateManualInventoryAdjustmentDto(location.Id, part.Id, 2m, "Opening count", null, null));

        var exception = await Assert.ThrowsAsync<ValidationException>(() => service.CreateTransferAsync(new CreateInventoryTransferDto(
            location.Id,
            location.Id,
            part.Id,
            1m,
            "Rebalance stock",
            null,
            null)));

        Assert.Equal("Source and destination stock locations must be different.", exception.Message);
    }

    [Fact]
    public async Task Warehouse_transfer_rejects_quantity_above_available_source_stock()
    {
        await using var context = CreateContext();
        var (sourceLocation, part) = await SeedLocationAndPartAsync(context);
        var destinationLocation = new StockLocation { Name = "Overflow Cage", Code = "OVR", Description = "Secondary stock room" };
        context.StockLocations.Add(destinationLocation);
        await context.SaveChangesAsync();

        var service = new InventoryService(context);
        await service.CreateManualAdjustmentAsync(new CreateManualInventoryAdjustmentDto(sourceLocation.Id, part.Id, 1m, "Opening count", null, null));

        var exception = await Assert.ThrowsAsync<ValidationException>(() => service.CreateTransferAsync(new CreateInventoryTransferDto(
            sourceLocation.Id,
            destinationLocation.Id,
            part.Id,
            2m,
            "Rebalance stock",
            null,
            null)));

        Assert.Equal("Transfer quantity exceeds available stock at the source location.", exception.Message);
    }

    private static async Task<(StockLocation Location, Part Part)> SeedLocationAndPartAsync(ApplicationDbContext context)
    {
        var location = new StockLocation { Name = "Main Warehouse", Code = "MAIN", Description = "Primary stock room" };
        var category = new PartCategory { Name = "Hydraulic" };
        var part = new Part
        {
            PartCategory = category,
            PartNumber = "SEAL-1",
            Name = "Seal Kit",
            QuantityOnHand = 0m,
            ReorderThreshold = 2m,
            UnitCost = 10m,
            UnitPrice = 15m
        };

        context.AddRange(location, category, part);
        await context.SaveChangesAsync();
        return (location, part);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
