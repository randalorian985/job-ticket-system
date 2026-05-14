using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PurchaseOrderServicesTests
{
    [Fact]
    public async Task Purchase_order_create_submit_receive_and_invoice_costs_are_tracked_without_inventory_adjustment()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);

        var created = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            "PO-1001",
            new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc),
            "Initial order",
            [new PurchaseOrderLineRequestDto(part.Id, 4m, 12.50m, "Seal kits")]));

        var submitted = await service.SubmitAsync(created.Id);
        var received = await service.ReceiveAsync(created.Id, new ReceivePurchaseOrderDto(
            new DateTime(2026, 5, 8, 0, 0, 0, DateTimeKind.Utc),
            [new ReceivePurchaseOrderLineDto(created.Lines.Single().Id, 4m)]));
        var updated = await service.UpdateAsync(created.Id, new UpdatePurchaseOrderDto(
            created.ExpectedAtUtc,
            "INV-77",
            new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc),
            VendorInvoiceStatus.Matched,
            7m,
            3m,
            2m,
            "Inbound freight and handling",
            "Invoice matched",
            [new PurchaseOrderLineRequestDto(part.Id, 4m, 12.50m, "Seal kits")]
        ));

        Assert.Equal(PurchaseOrderStatus.Submitted, submitted!.Status);
        Assert.Equal(PurchaseOrderStatus.Received, received!.Status);
        Assert.Equal("INV-77", updated!.VendorInvoiceNumber);
        Assert.Equal(50m, updated.InvoiceSubtotal);
        Assert.Equal(12m, updated.LandedCostTotal);
        Assert.Equal(5m, (await context.Parts.SingleAsync(x => x.Id == part.Id)).QuantityOnHand);
    }

    [Fact]
    public async Task Purchase_order_archive_preserves_soft_delete_listing_behavior()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);
        var created = await service.CreateAsync(new CreatePurchaseOrderDto(vendor.Id, "PO-ARCH", null, null, null, [new PurchaseOrderLineRequestDto(part.Id, 1m, 2m)]));

        await service.ArchiveAsync(created.Id);

        Assert.Empty(await service.ListAsync());
        Assert.True((await service.ListAsync(includeArchived: true)).Single().IsArchived);
        Assert.True(await service.UnarchiveAsync(created.Id));
        Assert.Single(await service.ListAsync());
    }

    [Fact]
    public async Task Purchase_order_receive_rejects_quantity_above_ordered()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);
        var created = await service.CreateAsync(new CreatePurchaseOrderDto(vendor.Id, "PO-OVER", null, null, null, [new PurchaseOrderLineRequestDto(part.Id, 2m, 10m)]));
        await service.SubmitAsync(created.Id);

        await Assert.ThrowsAsync<ValidationException>(() => service.ReceiveAsync(created.Id, new ReceivePurchaseOrderDto(null, [new ReceivePurchaseOrderLineDto(created.Lines.Single().Id, 3m)])));
    }

    private static async Task<(Vendor Vendor, Part Part)> SeedVendorAndPart(ApplicationDbContext context)
    {
        var vendor = new Vendor { Name = "Delta Supply" };
        var category = new PartCategory { Name = "Hydraulic" };
        var part = new Part { Vendor = vendor, PartCategory = category, PartNumber = "SEAL-1", Name = "Seal Kit", QuantityOnHand = 5m, ReorderThreshold = 2m, UnitCost = 10m, UnitPrice = 15m };
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
