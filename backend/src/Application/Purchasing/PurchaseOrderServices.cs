using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Purchasing;

public sealed record PurchaseOrderLineDto(Guid Id, Guid PurchaseOrderId, Guid PartId, string PartNumber, string PartName, decimal QuantityOrdered, decimal QuantityReceived, decimal UnitCost, decimal LineSubtotal, string? Notes, bool IsArchived);
public sealed record PurchaseOrderDto(Guid Id, string PurchaseOrderNumber, Guid VendorId, string VendorName, PurchaseOrderStatus Status, DateTime OrderedAtUtc, DateTime? ExpectedAtUtc, DateTime? ReceivedAtUtc, string? VendorInvoiceNumber, DateTime? VendorInvoiceDateUtc, VendorInvoiceStatus InvoiceStatus, decimal InvoiceSubtotal, decimal FreightCost, decimal TaxAmount, decimal OtherLandedCost, decimal LandedCostTotal, string? LandedCostNotes, string? Notes, bool IsArchived, IReadOnlyList<PurchaseOrderLineDto> Lines);
public sealed record PurchaseOrderListItemDto(Guid Id, string PurchaseOrderNumber, Guid VendorId, string VendorName, PurchaseOrderStatus Status, DateTime OrderedAtUtc, DateTime? ExpectedAtUtc, DateTime? ReceivedAtUtc, string? VendorInvoiceNumber, VendorInvoiceStatus InvoiceStatus, decimal OrderedSubtotal, decimal LandedCostTotal, decimal QuantityOrdered, decimal QuantityReceived, bool IsArchived);
public sealed record PurchaseOrderLineRequestDto(Guid PartId, decimal QuantityOrdered, decimal UnitCost, string? Notes = null);
public sealed record CreatePurchaseOrderDto(Guid VendorId, string? PurchaseOrderNumber, DateTime? OrderedAtUtc, DateTime? ExpectedAtUtc, string? Notes, IReadOnlyList<PurchaseOrderLineRequestDto> Lines);
public sealed record UpdatePurchaseOrderDto(string? PurchaseOrderNumber, DateTime? ExpectedAtUtc, string? VendorInvoiceNumber, DateTime? VendorInvoiceDateUtc, VendorInvoiceStatus InvoiceStatus, decimal FreightCost, decimal TaxAmount, decimal OtherLandedCost, string? LandedCostNotes, string? Notes, IReadOnlyList<PurchaseOrderLineRequestDto> Lines);
public sealed record ReceivePurchaseOrderLineDto(Guid LineId, decimal ReceivedQuantity);
public sealed record ReceivePurchaseOrderDto(DateTime? ReceivedAtUtc, IReadOnlyList<ReceivePurchaseOrderLineDto> Lines);

public interface IPurchaseOrdersService
{
    Task<IReadOnlyList<PurchaseOrderListItemDto>> ListAsync(bool includeArchived = false, Guid? vendorId = null, PurchaseOrderStatus? status = null, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto request, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto request, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> SubmitAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> ReceiveAsync(Guid id, ReceivePurchaseOrderDto request, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> CancelAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class PurchaseOrdersService(ApplicationDbContext dbContext) : IPurchaseOrdersService
{
    public async Task<IReadOnlyList<PurchaseOrderListItemDto>> ListAsync(bool includeArchived = false, Guid? vendorId = null, PurchaseOrderStatus? status = null, CancellationToken cancellationToken = default)
    {
        var query = includeArchived ? dbContext.PurchaseOrders.IgnoreQueryFilters() : dbContext.PurchaseOrders;
        if (vendorId.HasValue) query = query.Where(x => x.VendorId == vendorId.Value);
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);

        return await query
            .Include(x => x.Vendor)
            .Include(x => x.Lines)
            .OrderByDescending(x => x.OrderedAtUtc)
            .ThenBy(x => x.PurchaseOrderNumber)
            .Select(x => new PurchaseOrderListItemDto(
                x.Id,
                x.PurchaseOrderNumber,
                x.VendorId,
                x.Vendor.Name,
                x.Status,
                x.OrderedAtUtc,
                x.ExpectedAtUtc,
                x.ReceivedAtUtc,
                x.VendorInvoiceNumber,
                x.InvoiceStatus,
                x.Lines.Where(line => !line.IsDeleted).Sum(line => line.QuantityOrdered * line.UnitCost),
                x.FreightCost + x.TaxAmount + x.OtherLandedCost,
                x.Lines.Where(line => !line.IsDeleted).Sum(line => line.QuantityOrdered),
                x.Lines.Where(line => !line.IsDeleted).Sum(line => line.QuantityReceived),
                x.IsDeleted))
            .ToListAsync(cancellationToken);
    }

    private async Task EnsurePurchaseOrderNumberIsUnique(string purchaseOrderNumber, Guid? currentPurchaseOrderId, CancellationToken cancellationToken)
    {
        var normalizedPurchaseOrderNumber = NormalizePurchaseOrderNumber(purchaseOrderNumber);

        var duplicateExists = await dbContext.PurchaseOrders
            .IgnoreQueryFilters()
            .AnyAsync(
                x => x.PurchaseOrderNumber.Trim().ToUpper() == normalizedPurchaseOrderNumber
                     && (!currentPurchaseOrderId.HasValue || x.Id != currentPurchaseOrderId.Value),
                cancellationToken);

        if (duplicateExists) throw new ValidationException("PurchaseOrderNumber must be unique.");
    }

    private static string NormalizePurchaseOrderNumber(string purchaseOrderNumber) => purchaseOrderNumber.Trim().ToUpperInvariant();
    private static DateTime ToUtcOrNow(DateTime? value) => ToNullableUtc(value) ?? DateTime.UtcNow;
    private static DateTime? ToNullableUtc(DateTime? value) => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null;
    private static string? NullIfWhitespace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
