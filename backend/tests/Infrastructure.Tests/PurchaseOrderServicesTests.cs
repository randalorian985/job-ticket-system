using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PurchaseOrderServicesTests
{
    [Fact]
    public async Task CreateAsync_creates_purchase_order_with_generated_number_and_line_snapshots()
    {
        await using var context = CreateContext();
        var vendor = new Vendor { Name = "Delta Supply" };
        var category = new PartCategory { Name = "Hydraulic" };
        var part = new Part
        {
            PartCategory = category,
            Vendor = vendor,
            PartNumber = "SEAL-1",
            Name = "Seal Kit",
            UnitCost = 12m,
            UnitPrice = 20m,
            QuantityOnHand = 3m,
            ReorderThreshold = 5m
        };
        context.AddRange(vendor, category, part);
        await context.SaveChangesAsync();

        var service = new PurchaseOrdersService(context, new TestCurrentUserContext());
        var created = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            new DateTime(2026, 5, 14, 12, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 5, 21, 12, 0, 0, DateTimeKind.Utc),
            "Need replenishment",
            new[]
            {
                new CreatePurchaseOrderLineDto(part.Id, 4m, null, "Urgent")
            }));

        Assert.StartsWith("PO-2026-", created.OrderNumber);
        Assert.Equal(PurchaseOrderStatus.Ordered, created.Status);
        Assert.Single(created.Lines);
        Assert.Equal(12m, created.Lines[0].UnitCost);
        Assert.Equal(48m, created.SubtotalCost);
        Assert.Equal(48m, created.TotalLandedCost);
    }

    [Fact]
    public async Task ReceiveAsync_updates_received_quantities_status_and_part_stock()
    {
        await using var context = CreateContext();
        var vendor = new Vendor { Name = "Delta Supply" };
        var category = new PartCategory { Name = "Hydraulic" };
        var part = new Part
        {
            PartCategory = category,
            Vendor = vendor,
            PartNumber = "HOSE-1",
            Name = "Hydraulic Hose",
            UnitCost = 8m,
            UnitPrice = 12m,
            QuantityOnHand = 1m,
            ReorderThreshold = 4m
        };
        context.AddRange(vendor, category, part);
        await context.SaveChangesAsync();

        var service = new PurchaseOrdersService(context, new TestCurrentUserContext());
        var created = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            DateTime.UtcNow,
            null,
            null,
            new[] { new CreatePurchaseOrderLineDto(part.Id, 5m, 9m, null) }));

        var partial = await service.ReceiveAsync(created.Id, new ReceivePurchaseOrderDto(
            new DateTime(2026, 5, 15, 14, 0, 0, DateTimeKind.Utc),
            new[] { new ReceivePurchaseOrderLineDto(created.Lines[0].Id, 2m) }));

        Assert.NotNull(partial);
        Assert.Equal(PurchaseOrderStatus.PartiallyReceived, partial!.Status);
        Assert.Equal(2m, partial.Lines[0].QuantityReceived);

        var finalReceipt = await service.ReceiveAsync(created.Id, new ReceivePurchaseOrderDto(
            new DateTime(2026, 5, 16, 14, 0, 0, DateTimeKind.Utc),
            new[] { new ReceivePurchaseOrderLineDto(created.Lines[0].Id, 3m) }));

        Assert.NotNull(finalReceipt);
        Assert.Equal(PurchaseOrderStatus.Received, finalReceipt!.Status);
        Assert.Equal(5m, finalReceipt.Lines[0].QuantityReceived);
        Assert.Equal(6m, (await context.Parts.SingleAsync()).QuantityOnHand);
    }

    [Fact]
    public async Task RecordVendorInvoiceAsync_allocates_landed_cost_to_lines()
    {
        await using var context = CreateContext();
        var vendor = new Vendor { Name = "Delta Supply" };
        var category = new PartCategory { Name = "Hydraulic" };
        var partA = new Part
        {
            PartCategory = category,
            Vendor = vendor,
            PartNumber = "SEAL-1",
            Name = "Seal Kit",
            UnitCost = 10m,
            UnitPrice = 20m,
            QuantityOnHand = 0m,
            ReorderThreshold = 4m
        };
        var partB = new Part
        {
            PartCategory = category,
            Vendor = vendor,
            PartNumber = "FILTER-1",
            Name = "Filter",
            UnitCost = 20m,
            UnitPrice = 30m,
            QuantityOnHand = 0m,
            ReorderThreshold = 2m
        };
        context.AddRange(vendor, category, partA, partB);
        await context.SaveChangesAsync();

        var service = new PurchaseOrdersService(context, new TestCurrentUserContext());
        var created = await service.CreateAsync(new CreatePurchaseOrderDto(
            vendor.Id,
            DateTime.UtcNow,
            null,
            null,
            new[]
            {
                new CreatePurchaseOrderLineDto(partA.Id, 2m, 10m, null),
                new CreatePurchaseOrderLineDto(partB.Id, 1m, 20m, null)
            }));

        var updated = await service.RecordVendorInvoiceAsync(created.Id, new RecordVendorInvoiceDto(
            "INV-1001",
            new DateTime(2026, 5, 17, 9, 0, 0, DateTimeKind.Utc),
            6m,
            2m,
            0m,
            "Final vendor bill"));

        Assert.NotNull(updated);
        Assert.Equal("INV-1001", updated!.VendorInvoiceNumber);
        Assert.Equal(48m, updated.TotalLandedCost);
        Assert.Contains(updated.Lines, line => line.PartNumber == "SEAL-1" && line.LandedUnitCost == 12m);
        Assert.Contains(updated.Lines, line => line.PartNumber == "FILTER-1" && line.LandedUnitCost == 24m);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private sealed class TestCurrentUserContext : ICurrentUserContext
    {
        public Guid UserId => Guid.Parse("11111111-1111-1111-1111-111111111111");
        public Guid EmployeeId => UserId;
        public string Role => SystemRoles.Admin;
        public bool IsAuthenticated => true;
        public bool IsAdmin => true;
        public bool IsManager => true;
        public bool IsEmployee => true;
    }
}
