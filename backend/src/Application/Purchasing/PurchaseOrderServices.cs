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

    public Task<PurchaseOrderDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        MapQuery(dbContext.PurchaseOrders.IgnoreQueryFilters().Where(x => x.Id == id)).SingleOrDefaultAsync(cancellationToken);

    public async Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        await ValidateVendor(request.VendorId, cancellationToken);
        ValidateLines(request.Lines);
        await ValidateParts(request.Lines.Select(x => x.PartId), cancellationToken);
        var orderedAtUtc = ToUtcOrNow(request.OrderedAtUtc);
        var expectedAtUtc = ToNullableUtc(request.ExpectedAtUtc);
        ValidateChronology(orderedAtUtc, expectedAtUtc, null, null);
        var purchaseOrderNumber = string.IsNullOrWhiteSpace(request.PurchaseOrderNumber)
            ? await GeneratePurchaseOrderNumber(cancellationToken)
            : NormalizePurchaseOrderNumber(request.PurchaseOrderNumber);
        await EnsurePurchaseOrderNumberIsUnique(purchaseOrderNumber, null, cancellationToken);

        var entity = new PurchaseOrder
        {
            VendorId = request.VendorId,
            PurchaseOrderNumber = purchaseOrderNumber,
            OrderedAtUtc = orderedAtUtc,
            ExpectedAtUtc = expectedAtUtc,
            Notes = NullIfWhitespace(request.Notes),
            Status = PurchaseOrderStatus.Draft,
            InvoiceStatus = VendorInvoiceStatus.Pending
        };

        foreach (var line in request.Lines)
        {
            entity.Lines.Add(new PurchaseOrderLine
            {
                PartId = line.PartId,
                QuantityOrdered = line.QuantityOrdered,
                UnitCost = line.UnitCost,
                Notes = NullIfWhitespace(line.Notes)
            });
        }

        dbContext.PurchaseOrders.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return (await GetAsync(entity.Id, cancellationToken))!;
    }

    public async Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PurchaseOrders.Include(x => x.Lines).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        EnsureCanUpdate(entity.Status);

        ValidateLines(request.Lines);
        await ValidateParts(request.Lines.Select(x => x.PartId), cancellationToken);

        var purchaseOrderNumber = string.IsNullOrWhiteSpace(request.PurchaseOrderNumber)
            ? entity.PurchaseOrderNumber
            : NormalizePurchaseOrderNumber(request.PurchaseOrderNumber);
        await EnsurePurchaseOrderNumberIsUnique(purchaseOrderNumber, entity.Id, cancellationToken);

        var expectedAtUtc = ToNullableUtc(request.ExpectedAtUtc);
        var vendorInvoiceDateUtc = ToNullableUtc(request.VendorInvoiceDateUtc);
        ValidateChronology(entity.OrderedAtUtc, expectedAtUtc, entity.ReceivedAtUtc, vendorInvoiceDateUtc);

        var normalizedVendorInvoiceNumber = request.InvoiceStatus == VendorInvoiceStatus.Pending
            ? null
            : NullIfWhitespace(request.VendorInvoiceNumber);
        vendorInvoiceDateUtc = request.InvoiceStatus == VendorInvoiceStatus.Pending
            ? null
            : vendorInvoiceDateUtc;

        ValidateInvoiceMetadata(request.InvoiceStatus, normalizedVendorInvoiceNumber, vendorInvoiceDateUtc);
        ValidateInvoiceStatusForReceipt(request.InvoiceStatus, entity.Status);

        entity.PurchaseOrderNumber = purchaseOrderNumber;
        entity.ExpectedAtUtc = expectedAtUtc;
        entity.VendorInvoiceNumber = normalizedVendorInvoiceNumber;
        entity.VendorInvoiceDateUtc = vendorInvoiceDateUtc;
        entity.InvoiceStatus = request.InvoiceStatus;
        entity.Status = ResolveInvoiceBackedStatus(entity.Status, request.InvoiceStatus);
        entity.FreightCost = ValidateNonNegative(request.FreightCost, nameof(request.FreightCost));
        entity.TaxAmount = ValidateNonNegative(request.TaxAmount, nameof(request.TaxAmount));
        entity.OtherLandedCost = ValidateNonNegative(request.OtherLandedCost, nameof(request.OtherLandedCost));
        entity.LandedCostNotes = NullIfWhitespace(request.LandedCostNotes);
        entity.Notes = NullIfWhitespace(request.Notes);

        var activeLines = entity.Lines.Where(x => !x.IsDeleted).ToList();
        if (activeLines.Any(x => x.QuantityReceived > 0))
        {
            if (request.Lines.Select(x => x.PartId).OrderBy(x => x).SequenceEqual(activeLines.Select(x => x.PartId).OrderBy(x => x)) is false)
            {
                throw new ValidationException("Received purchase orders cannot add or remove lines.");
            }

            var requestedLineByPartId = request.Lines.ToDictionary(x => x.PartId);
            foreach (var existing in activeLines)
            {
                if (!requestedLineByPartId.TryGetValue(existing.PartId, out var requested))
                {
                    throw new ValidationException("Received purchase orders cannot add or remove lines.");
                }

                if (requested.QuantityOrdered < existing.QuantityReceived) throw new ValidationException("QuantityOrdered cannot be below received quantity.");
                existing.QuantityOrdered = requested.QuantityOrdered;
                existing.UnitCost = requested.UnitCost;
                existing.Notes = NullIfWhitespace(requested.Notes);
            }
        }
        else
        {
            foreach (var existing in activeLines)
            {
                existing.IsDeleted = true;
                existing.DeletedAtUtc = DateTime.UtcNow;
            }

            foreach (var line in request.Lines)
            {
                entity.Lines.Add(new PurchaseOrderLine
                {
                    PartId = line.PartId,
                    QuantityOrdered = line.QuantityOrdered,
                    UnitCost = line.UnitCost,
                    Notes = NullIfWhitespace(line.Notes)
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(id, cancellationToken);
    }
}