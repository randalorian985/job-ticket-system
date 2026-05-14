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
public sealed record UpdatePurchaseOrderDto(DateTime? ExpectedAtUtc, string? VendorInvoiceNumber, DateTime? VendorInvoiceDateUtc, VendorInvoiceStatus InvoiceStatus, decimal FreightCost, decimal TaxAmount, decimal OtherLandedCost, string? LandedCostNotes, string? Notes, IReadOnlyList<PurchaseOrderLineRequestDto> Lines);
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
        MapQuery(dbContext.PurchaseOrders.Where(x => x.Id == id)).SingleOrDefaultAsync(cancellationToken);

    public async Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        await ValidateVendor(request.VendorId, cancellationToken);
        ValidateLines(request.Lines);
        await ValidateParts(request.Lines.Select(x => x.PartId), cancellationToken);

        var entity = new PurchaseOrder
        {
            VendorId = request.VendorId,
            PurchaseOrderNumber = string.IsNullOrWhiteSpace(request.PurchaseOrderNumber) ? await GeneratePurchaseOrderNumber(cancellationToken) : request.PurchaseOrderNumber.Trim(),
            OrderedAtUtc = ToUtcOrNow(request.OrderedAtUtc),
            ExpectedAtUtc = ToNullableUtc(request.ExpectedAtUtc),
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
        if (entity.Status is PurchaseOrderStatus.Cancelled or PurchaseOrderStatus.Closed) throw new ValidationException("Closed or cancelled purchase orders cannot be updated.");

        ValidateLines(request.Lines);
        await ValidateParts(request.Lines.Select(x => x.PartId), cancellationToken);

        entity.ExpectedAtUtc = ToNullableUtc(request.ExpectedAtUtc);
        entity.VendorInvoiceNumber = NullIfWhitespace(request.VendorInvoiceNumber);
        entity.VendorInvoiceDateUtc = ToNullableUtc(request.VendorInvoiceDateUtc);
        entity.InvoiceStatus = request.InvoiceStatus;
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

            foreach (var existing in activeLines)
            {
                var requested = request.Lines.Single(x => x.PartId == existing.PartId);
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

    public async Task<PurchaseOrderDto?> SubmitAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PurchaseOrders.Include(x => x.Lines).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        if (!entity.Lines.Any(x => !x.IsDeleted)) throw new ValidationException("A purchase order must have at least one active line before submit.");
        if (entity.Status == PurchaseOrderStatus.Draft) entity.Status = PurchaseOrderStatus.Submitted;
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(id, cancellationToken);
    }

    public async Task<PurchaseOrderDto?> ReceiveAsync(Guid id, ReceivePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        if (request.Lines.Count == 0) throw new ValidationException("At least one received line is required.");
        var entity = await dbContext.PurchaseOrders.Include(x => x.Lines).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        if (entity.Status is PurchaseOrderStatus.Draft or PurchaseOrderStatus.Cancelled or PurchaseOrderStatus.Closed) throw new ValidationException("Only submitted purchase orders can be received.");

        var activeLines = entity.Lines.Where(x => !x.IsDeleted).ToDictionary(x => x.Id);
        foreach (var received in request.Lines)
        {
            if (!activeLines.TryGetValue(received.LineId, out var line)) throw new ValidationException("Received line does not belong to this purchase order.");
            line.QuantityReceived = ValidateNonNegative(received.ReceivedQuantity, nameof(received.ReceivedQuantity));
            if (line.QuantityReceived > line.QuantityOrdered) throw new ValidationException("Received quantity cannot exceed ordered quantity.");
        }

        var allReceived = activeLines.Values.All(x => x.QuantityReceived >= x.QuantityOrdered);
        entity.Status = allReceived ? PurchaseOrderStatus.Received : PurchaseOrderStatus.PartiallyReceived;
        entity.ReceivedAtUtc = allReceived ? ToUtcOrNow(request.ReceivedAtUtc) : ToNullableUtc(request.ReceivedAtUtc);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(id, cancellationToken);
    }

    public async Task<PurchaseOrderDto?> CancelAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PurchaseOrders.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        if (entity.Status is PurchaseOrderStatus.Received or PurchaseOrderStatus.Invoiced or PurchaseOrderStatus.Closed) throw new ValidationException("Received, invoiced, or closed purchase orders cannot be cancelled.");
        entity.Status = PurchaseOrderStatus.Cancelled;
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(id, cancellationToken);
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PurchaseOrders.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PurchaseOrders.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = false;
        entity.DeletedAtUtc = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static IQueryable<PurchaseOrderDto> MapQuery(IQueryable<PurchaseOrder> query) => query
        .Include(x => x.Vendor)
        .Include(x => x.Lines).ThenInclude(x => x.Part)
        .Select(x => new PurchaseOrderDto(
            x.Id,
            x.PurchaseOrderNumber,
            x.VendorId,
            x.Vendor.Name,
            x.Status,
            x.OrderedAtUtc,
            x.ExpectedAtUtc,
            x.ReceivedAtUtc,
            x.VendorInvoiceNumber,
            x.VendorInvoiceDateUtc,
            x.InvoiceStatus,
            x.Lines.Where(line => !line.IsDeleted).Sum(line => line.QuantityOrdered * line.UnitCost),
            x.FreightCost,
            x.TaxAmount,
            x.OtherLandedCost,
            x.FreightCost + x.TaxAmount + x.OtherLandedCost,
            x.LandedCostNotes,
            x.Notes,
            x.IsDeleted,
            x.Lines.Where(line => !line.IsDeleted).OrderBy(line => line.Part.PartNumber).Select(line => new PurchaseOrderLineDto(
                line.Id,
                line.PurchaseOrderId,
                line.PartId,
                line.Part.PartNumber,
                line.Part.Name,
                line.QuantityOrdered,
                line.QuantityReceived,
                line.UnitCost,
                line.QuantityOrdered * line.UnitCost,
                line.Notes,
                line.IsDeleted)).ToList()));

    private async Task ValidateVendor(Guid vendorId, CancellationToken cancellationToken)
    {
        if (!await dbContext.Vendors.AnyAsync(x => x.Id == vendorId, cancellationToken)) throw new ValidationException("VendorId does not reference an active vendor.");
    }

    private async Task ValidateParts(IEnumerable<Guid> partIds, CancellationToken cancellationToken)
    {
        var ids = partIds.Distinct().ToArray();
        var count = await dbContext.Parts.CountAsync(x => ids.Contains(x.Id), cancellationToken);
        if (count != ids.Length) throw new ValidationException("One or more parts do not reference active parts.");
    }

    private static void ValidateLines(IReadOnlyList<PurchaseOrderLineRequestDto> lines)
    {
        if (lines.Count == 0) throw new ValidationException("At least one purchase order line is required.");
        foreach (var line in lines)
        {
            if (line.PartId == Guid.Empty) throw new ValidationException("PartId is required for every purchase order line.");
            if (line.QuantityOrdered <= 0) throw new ValidationException("QuantityOrdered must be greater than zero.");
            ValidateNonNegative(line.UnitCost, nameof(line.UnitCost));
        }
    }

    private async Task<string> GeneratePurchaseOrderNumber(CancellationToken cancellationToken)
    {
        var count = await dbContext.PurchaseOrders.IgnoreQueryFilters().CountAsync(cancellationToken) + 1;
        return $"PO-{DateTime.UtcNow:yyyyMMdd}-{count:0000}";
    }

    private static decimal ValidateNonNegative(decimal value, string fieldName)
    {
        if (value < 0) throw new ValidationException($"{fieldName} must be zero or greater.");
        return value;
    }

    private static DateTime ToUtcOrNow(DateTime? value) => ToNullableUtc(value) ?? DateTime.UtcNow;
    private static DateTime? ToNullableUtc(DateTime? value) => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null;
    private static string? NullIfWhitespace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
