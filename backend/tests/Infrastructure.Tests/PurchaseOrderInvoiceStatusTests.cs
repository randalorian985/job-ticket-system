using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PurchaseOrderInvoiceStatusTests
{
    [Fact]
    public async Task Purchase_order_update_rejects_non_pending_invoice_status_while_partially_received()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);
        var created = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            "PO-PARTIAL-INVOICE-GUARD",
            new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 2m, 10m)]));

        await service.SubmitAsync(created.Id);
        await service.ReceiveAsync(created.Id, new ReceivePurchaseOrderDto(
            new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
            [new ReceivePurchaseOrderLineDto(created.Lines.Single().Id, 1m)]));

        var exception = await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(created.Id, new UpdatePurchaseOrderDto(
            created.PurchaseOrderNumber,
            created.ExpectedAtUtc,
            "INV-PARTIAL",
            new DateTime(2026, 5, 3, 0, 0, 0, DateTimeKind.Utc),
            VendorInvoiceStatus.Matched,
            0m,
            0m,
            0m,
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 2m, 10m)])));

        Assert.Equal("Vendor invoice status cannot move beyond pending until inventory has been fully received.", exception.Message);
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
