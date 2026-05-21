using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PurchaseOrderChronologyValidationTests
{
    [Fact]
    public async Task Purchase_order_create_rejects_expected_date_before_ordered_date()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);

        var exception = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            "PO-CHRONO-CREATE",
            new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc),
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 1m, 10m)])));

        Assert.Equal("Expected receipt date cannot be earlier than the ordered date.", exception.Message);
    }

    [Fact]
    public async Task Purchase_order_update_rejects_invoice_date_before_received_date()
    {
        await using var context = CreateContext();
        var (vendor, part) = await SeedVendorAndPart(context);
        var service = new PurchaseOrdersService(context);

        var created = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            "PO-CHRONO-INVOICE",
            new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 2m, 10m)]));

        await service.SubmitAsync(created.Id);
        await service.ReceiveAsync(created.Id, new ReceivePurchaseOrderDto(
            new DateTime(2026, 5, 5, 0, 0, 0, DateTimeKind.Utc),
            [new ReceivePurchaseOrderLineDto(created.Lines.Single().Id, 2m)]));

        var exception = await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(created.Id, new UpdatePurchaseOrderDto(
            created.PurchaseOrderNumber,
            created.ExpectedAtUtc,
            "INV-CHRONO",
            new DateTime(2026, 5, 4, 0, 0, 0, DateTimeKind.Utc),
            VendorInvoiceStatus.Matched,
            0m,
            0m,
            0m,
            null,
            null,
            [new PurchaseOrderLineRequestDto(part.Id, 2m, 10m)])));

        Assert.Equal("Vendor invoice date cannot be earlier than the received date.", exception.Message);
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
