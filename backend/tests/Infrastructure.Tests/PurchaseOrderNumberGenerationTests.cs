using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PurchaseOrderNumberGenerationTests
{
    [Fact]
    public async Task Auto_generated_purchase_order_number_skips_existing_generated_value()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);
        var generatedCandidate = $"PO-{DateTime.UtcNow:yyyyMMdd}-0001";

        await service.CreateAsync(new CreatePurchaseOrderDto(vendor.Id, generatedCandidate, null, null, null, [new PurchaseOrderLineRequestDto(part.Id, 1m, 10m)]));

        var created = await service.CreateAsync(new CreatePurchaseOrderDto(vendor.Id, null, null, null, null, [new PurchaseOrderLineRequestDto(part.Id, 1m, 10m)]));

        Assert.NotEqual(generatedCandidate, created.PurchaseOrderNumber);
        Assert.EndsWith("0002", created.PurchaseOrderNumber);
    }

    [Fact]
    public async Task Auto_generated_purchase_order_number_uses_daily_sequence_instead_of_total_count()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);

        for (var sequence = 1; sequence <= 5; sequence++)
        {
            await service.CreateAsync(new CreatePurchaseOrderDto(
                vendor.Id,
                $"PO-20240101-{sequence:0000}",
                null,
                null,
                null,
                [new PurchaseOrderLineRequestDto(part.Id, 1m, 10m)]));
        }

        var todayPrefix = $"PO-{DateTime.UtcNow:yyyyMMdd}";

        await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            $"{todayPrefix}-0001",
            null,
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 1m, 10m)]));

        var created = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            null,
            null,
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 1m, 10m)]));

        Assert.Equal($"{todayPrefix}-0002", created.PurchaseOrderNumber);
    }

    private static async Task<(Vendor Vendor, Part Part)> SeedVendorAndPart(ApplicationDbContext context)
    {
        var vendor = new Vendor { Name = "Delta Supply" };
        var category = new PartCategory { Name = "Hydraulic" };
        var part = new Part
        {
            Vendor = vendor,
            PartCategory = category,
            PartNumber = "SEAL-1",
            Name = "Seal Kit",
            QuantityOnHand = 5m,
            ReorderThreshold = 2m,
            UnitCost = 10m,
            UnitPrice = 15m
        };

        context.AddRange(vendor, category, part);
        await context.SaveChangesAsync();
        return (vendor, part);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
