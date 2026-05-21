using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PurchaseOrderUnarchiveTests
{
    [Fact]
    public async Task Unarchive_rejects_purchase_order_number_collision()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);

        var archived = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            "PO-ARCHIVE",
            null,
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 1m, 10m)]));

        await service.ArchiveAsync(archived.Id);

        await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            "PO-ARCHIVE",
            null,
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 1m, 10m)]));

        var exception = await Assert.ThrowsAsync<ValidationException>(() => service.UnarchiveAsync(archived.Id));

        Assert.Equal("PurchaseOrderNumber must be unique.", exception.Message);
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
