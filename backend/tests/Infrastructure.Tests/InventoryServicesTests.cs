using JobTicketSystem.Application.Inventory;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
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
        Assert.Equal("MAIN", created.StockLocationName);
        Assert.Equal("SEAL-1", created.PartNumber);
        Assert.Equal(8m, (await context.Parts.SingleAsync(x => x.Id == part.Id)).QuantityOnHand);
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
        Assert.Equal("MAIN", row.StockLocationName);
        Assert.Equal("SEAL-1", row.PartNumber);
        Assert.Equal(1m, row.QuantityOnHand);
        Assert.NotNull(row.LastTransactionAtUtc);
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
            QuantityOnHand = 5m,
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
