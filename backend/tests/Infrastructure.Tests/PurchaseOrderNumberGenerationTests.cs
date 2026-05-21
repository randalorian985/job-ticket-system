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
