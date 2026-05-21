using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PurchaseOrderReceiptLineValidationTests
{
    [Fact]
    public async Task Purchase_order_receive_rejects_duplicate_line_ids()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);
        var created = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            "PO-DUP-RECEIPT-LINE",
            null,
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 3m, 10m)]));
        await service.SubmitAsync(created.Id);

        var lineId = created.Lines.Single().Id;
        var exception = await Assert.ThrowsAsync<ValidationException>(() => service.ReceiveAsync(created.Id, new ReceivePurchaseOrderDto(
            null,
            [
                new ReceivePurchaseOrderLineDto(lineId, 1m),
                new ReceivePurchaseOrderLineDto(lineId, 2m)
            ])));

        Assert.Equal("Received lines cannot contain duplicate LineId values.", exception.Message);
    }

    [Fact]
    public async Task Purchase_order_receive_rejects_decreasing_previously_received_quantity()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);
        var created = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            "PO-DECREASE-RECEIPT",
            null,
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 4m, 10m)]));
        await service.SubmitAsync(created.Id);

        var lineId = created.Lines.Single().Id;
        await service.ReceiveAsync(created.Id, new ReceivePurchaseOrderDto(null, [new ReceivePurchaseOrderLineDto(lineId, 3m)]));

        var exception = await Assert.ThrowsAsync<ValidationException>(() => service.ReceiveAsync(created.Id, new ReceivePurchaseOrderDto(
            null,
            [new ReceivePurchaseOrderLineDto(lineId, 2m)])));

        Assert.Equal("Received quantity cannot decrease once inventory is received.", exception.Message);
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
