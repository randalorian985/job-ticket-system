using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Purchasing;

public interface IPurchaseOrdersService
{
    Task<IReadOnlyList<PurchaseOrderListItemDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto request, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto request, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> ReceiveAsync(Guid id, ReceivePurchaseOrderDto request, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> RecordVendorInvoiceAsync(Guid id, RecordVendorInvoiceDto request, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class PurchaseOrdersService(ApplicationDbContext dbContext, ICurrentUserContext currentUserContext) : IPurchaseOrdersService
{
    public async Task<IReadOnlyList<PurchaseOrderListItemDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        var purchaseOrders = query.IncludeArchived ? dbContext.PurchaseOrders.IgnoreQueryFilters() : dbContext.PurchaseOrders;

        return await purchaseOrders
            .OrderByDescending(x => x.OrderedAtUtc)
            .Skip(query.NormalizedOffset)
            .Take(query.NormalizedLimit)
            .Select(x => new PurchaseOrderListItemDto(
                x.Id,
                x.OrderNumber,
                x.VendorId,
                x.Vendor.Name,
                x.Status,
                x.OrderedAtUtc,
                x.ExpectedAtUtc,
                x.ReceivedAtUtc,
                x.TotalLandedCost,
                x.IsDeleted))
            .ToListAsync(cancellationToken);
    }

    public async Task<PurchaseOrderDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await LoadAsync(id, includeArchived: true, cancellationToken);
        return entity is null ? null : Map(entity);
    }

    public async Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        await ValidateCreateAsync(request, cancellationToken);

        for (var attempt = 0; attempt < 3; attempt++)
        {
            var vendor = await dbContext.Vendors.SingleAsync(x => x.Id == request.VendorId, cancellationToken);
            var requestedPartIds = request.Lines.Select(x => x.PartId).Distinct().ToArray();
            var parts = await dbContext.Parts.Where(x => requestedPartIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, cancellationToken);

            var entity = new PurchaseOrder
            {
                OrderNumber = await GenerateOrderNumberAsync(cancellationToken),
                VendorId = request.VendorId,
                OrderedAtUtc = request.OrderedAtUtc,
                ExpectedAtUtc = request.ExpectedAtUtc,
                Status = PurchaseOrderStatus.Ordered,
                Notes = ValidationHelpers.NullIfWhitespace(request.Notes)
            };

            foreach (var line in request.Lines)
            {
                var part = parts[line.PartId];
                var unitCost = line.UnitCost ?? part.UnitCost;
                entity.Lines.Add(new PurchaseOrderLine
                {
                    PartId = line.PartId,
                    QuantityOrdered = line.QuantityOrdered,
                    QuantityReceived = 0,
                    UnitCost = unitCost,
                    LandedUnitCost = unitCost,
                    Notes = ValidationHelpers.NullIfWhitespace(line.Notes)
                });
            }

            entity.SubtotalCost = entity.Lines.Sum(x => x.QuantityOrdered * x.UnitCost);
            entity.TotalLandedCost = entity.SubtotalCost;

            dbContext.PurchaseOrders.Add(entity);
            AddAudit(entity.Id, nameof(PurchaseOrder), AuditActionType.Create, null, $"{{\"OrderNumber\":\"{entity.OrderNumber}\",\"VendorId\":\"{vendor.Id}\"}}");

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                var created = await LoadAsync(entity.Id, includeArchived: false, cancellationToken) ?? entity;
                return Map(created);
            }
            catch (DbUpdateException) when (attempt < 2)
            {
                dbContext.Entry(entity).State = EntityState.Detached;
            }
        }

        throw new ValidationException("Unable to generate a unique purchase order number. Please retry.");
    }

    public async Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        var entity = await LoadAsync(id, includeArchived: false, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        if (entity.Status == PurchaseOrderStatus.Received || entity.Status == PurchaseOrderStatus.Cancelled)
        {
            throw new ValidationException("Received or cancelled purchase orders cannot be edited.");
        }

        await EnsureVendorExistsAsync(request.VendorId, cancellationToken);

        entity.VendorId = request.VendorId;
        entity.OrderedAtUtc = request.OrderedAtUtc;
        entity.ExpectedAtUtc = request.ExpectedAtUtc;
        entity.Notes = ValidationHelpers.NullIfWhitespace(request.Notes);

        AddAudit(entity.Id, nameof(PurchaseOrder), AuditActionType.Update, null, $"{{\"VendorId\":\"{entity.VendorId}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<PurchaseOrderDto?> ReceiveAsync(Guid id, ReceivePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        var entity = await LoadAsync(id, includeArchived: false, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        if (entity.Status == PurchaseOrderStatus.Cancelled)
        {
            throw new ValidationException("Cancelled purchase orders cannot be received.");
        }

        if (request.Lines.Count == 0)
        {
            throw new ValidationException("At least one received line is required.");
        }

        var lineMap = entity.Lines.ToDictionary(x => x.Id);
        foreach (var line in request.Lines)
        {
            if (!lineMap.TryGetValue(line.PurchaseOrderLineId, out var purchaseOrderLine))
            {
                throw new ValidationException("Received line does not belong to this purchase order.");
            }

            if (line.QuantityReceived <= 0)
            {
                throw new ValidationException("QuantityReceived must be greater than zero.");
            }

            var remainingQuantity = purchaseOrderLine.QuantityOrdered - purchaseOrderLine.QuantityReceived;
            if (line.QuantityReceived > remainingQuantity)
            {
                throw new ValidationException("QuantityReceived cannot exceed the remaining quantity on the line.");
            }

            purchaseOrderLine.QuantityReceived += line.QuantityReceived;
            purchaseOrderLine.Part.QuantityOnHand += line.QuantityReceived;
        }

        entity.ReceivedAtUtc = request.ReceivedAtUtc ?? DateTime.UtcNow;
        entity.Status = entity.Lines.All(x => x.QuantityReceived >= x.QuantityOrdered)
            ? PurchaseOrderStatus.Received
            : PurchaseOrderStatus.PartiallyReceived;

        AddAudit(entity.Id, nameof(PurchaseOrder), AuditActionType.Update, null, $"{{\"Status\":\"{entity.Status}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<PurchaseOrderDto?> RecordVendorInvoiceAsync(Guid id, RecordVendorInvoiceDto request, CancellationToken cancellationToken = default)
    {
        var entity = await LoadAsync(id, includeArchived: false, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        ValidationHelpers.ValidateRequired(request.VendorInvoiceNumber, nameof(request.VendorInvoiceNumber));

        entity.VendorInvoiceNumber = request.VendorInvoiceNumber.Trim();
        entity.VendorInvoiceDateUtc = request.VendorInvoiceDateUtc;
        entity.ShippingCost = request.ShippingCost;
        entity.TaxCost = request.TaxCost;
        entity.OtherCost = request.OtherCost;
        entity.Notes = ValidationHelpers.NullIfWhitespace(request.Notes) ?? entity.Notes;
        entity.SubtotalCost = entity.Lines.Sum(x => x.QuantityOrdered * x.UnitCost);

        AllocateLandedCosts(entity);

        AddAudit(entity.Id, nameof(PurchaseOrder), AuditActionType.Update, null, $"{{\"VendorInvoiceNumber\":\"{entity.VendorInvoiceNumber}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<PurchaseOrderDto?> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await LoadAsync(id, includeArchived: false, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        entity.DeletedByUserId = currentUserContext.UserId;
        AddAudit(entity.Id, nameof(PurchaseOrder), AuditActionType.Delete, null, $"{{\"OrderNumber\":\"{entity.OrderNumber}\"}}");
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    private async Task ValidateCreateAsync(CreatePurchaseOrderDto request, CancellationToken cancellationToken)
    {
        await EnsureVendorExistsAsync(request.VendorId, cancellationToken);

        if (request.Lines.Count == 0)
        {
            throw new ValidationException("At least one purchase order line is required.");
        }

        var duplicatePartIds = request.Lines
            .GroupBy(x => x.PartId)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToArray();

        if (duplicatePartIds.Length > 0)
        {
            throw new ValidationException("Each part may only appear once on a purchase order.");
        }

        foreach (var line in request.Lines)
        {
            if (line.QuantityOrdered <= 0)
            {
                throw new ValidationException("QuantityOrdered must be greater than zero.");
            }

            if (line.UnitCost.HasValue && line.UnitCost.Value < 0)
            {
                throw new ValidationException("UnitCost cannot be negative.");
            }
        }

        var partIds = request.Lines.Select(x => x.PartId).Distinct().ToArray();
        var matchingPartCount = await dbContext.Parts.CountAsync(x => partIds.Contains(x.Id), cancellationToken);
        if (matchingPartCount != partIds.Length)
        {
            throw new ValidationException("All purchase order lines must reference active parts.");
        }
    }

    private async Task EnsureVendorExistsAsync(Guid vendorId, CancellationToken cancellationToken)
    {
        if (!await dbContext.Vendors.AnyAsync(x => x.Id == vendorId, cancellationToken))
        {
            throw new ValidationException("VendorId does not reference an active vendor.");
        }
    }

    private async Task<string> GenerateOrderNumberAsync(CancellationToken cancellationToken)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"PO-{year}-";
        var existingOrderNumbers = await dbContext.PurchaseOrders.IgnoreQueryFilters()
            .Where(x => x.OrderNumber.StartsWith(prefix))
            .Select(x => x.OrderNumber)
            .ToListAsync(cancellationToken);

        var nextSequence = existingOrderNumbers
            .Select(number => number.Length > prefix.Length && int.TryParse(number[prefix.Length..], out var parsed) ? parsed : 0)
            .DefaultIfEmpty()
            .Max() + 1;

        return $"{prefix}{nextSequence:000000}";
    }

    private void AllocateLandedCosts(PurchaseOrder purchaseOrder)
    {
        var surchargeTotal = purchaseOrder.ShippingCost + purchaseOrder.TaxCost + purchaseOrder.OtherCost;
        var subtotal = purchaseOrder.Lines.Sum(x => x.QuantityOrdered * x.UnitCost);
        var quantityTotal = purchaseOrder.Lines.Sum(x => x.QuantityOrdered);

        foreach (var line in purchaseOrder.Lines)
        {
            var baseLineCost = line.QuantityOrdered * line.UnitCost;
            decimal allocatedSurcharge;
            if (surchargeTotal == 0)
            {
                allocatedSurcharge = 0;
            }
            else if (subtotal > 0)
            {
                allocatedSurcharge = surchargeTotal * (baseLineCost / subtotal);
            }
            else if (quantityTotal > 0)
            {
                allocatedSurcharge = surchargeTotal * (line.QuantityOrdered / quantityTotal);
            }
            else
            {
                allocatedSurcharge = 0;
            }

            line.LandedUnitCost = line.QuantityOrdered > 0
                ? Math.Round((baseLineCost + allocatedSurcharge) / line.QuantityOrdered, 2, MidpointRounding.AwayFromZero)
                : line.UnitCost;
        }

        purchaseOrder.TotalLandedCost = purchaseOrder.SubtotalCost + surchargeTotal;
    }

    private async Task<PurchaseOrder?> LoadAsync(Guid id, bool includeArchived, CancellationToken cancellationToken)
    {
        var purchaseOrders = includeArchived ? dbContext.PurchaseOrders.IgnoreQueryFilters() : dbContext.PurchaseOrders;
        return await purchaseOrders
            .Include(x => x.Vendor)
            .Include(x => x.Lines)
                .ThenInclude(x => x.Part)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    private void AddAudit(Guid entityId, string entityName, AuditActionType actionType, string? oldValuesJson, string? newValuesJson)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            EntityId = entityId,
            EntityName = entityName,
            ActionType = actionType,
            UserId = currentUserContext.UserId,
            OldValuesJson = oldValuesJson,
            NewValuesJson = newValuesJson,
            IpAddress = null
        });
    }

    private static PurchaseOrderDto Map(PurchaseOrder entity)
    {
        return new PurchaseOrderDto(
            entity.Id,
            entity.OrderNumber,
            entity.VendorId,
            entity.Vendor?.Name ?? string.Empty,
            entity.Status,
            entity.OrderedAtUtc,
            entity.ExpectedAtUtc,
            entity.ReceivedAtUtc,
            entity.VendorInvoiceNumber,
            entity.VendorInvoiceDateUtc,
            entity.SubtotalCost,
            entity.ShippingCost,
            entity.TaxCost,
            entity.OtherCost,
            entity.TotalLandedCost,
            entity.Notes,
            entity.IsDeleted,
            entity.Lines.OrderBy(x => x.CreatedAtUtc).Select(line => new PurchaseOrderLineDto(
                line.Id,
                line.PartId,
                line.Part?.PartNumber ?? string.Empty,
                line.Part?.Name ?? string.Empty,
                line.QuantityOrdered,
                line.QuantityReceived,
                line.UnitCost,
                line.LandedUnitCost,
                Math.Round(line.QuantityOrdered * line.UnitCost, 2, MidpointRounding.AwayFromZero),
                Math.Round(line.QuantityOrdered * line.LandedUnitCost, 2, MidpointRounding.AwayFromZero),
                line.Notes)).ToArray());
    }
}

public sealed record PurchaseOrderListItemDto(
    Guid Id,
    string OrderNumber,
    Guid VendorId,
    string VendorName,
    PurchaseOrderStatus Status,
    DateTime OrderedAtUtc,
    DateTime? ExpectedAtUtc,
    DateTime? ReceivedAtUtc,
    decimal TotalLandedCost,
    bool IsArchived);

public sealed record PurchaseOrderDto(
    Guid Id,
    string OrderNumber,
    Guid VendorId,
    string VendorName,
    PurchaseOrderStatus Status,
    DateTime OrderedAtUtc,
    DateTime? ExpectedAtUtc,
    DateTime? ReceivedAtUtc,
    string? VendorInvoiceNumber,
    DateTime? VendorInvoiceDateUtc,
    decimal SubtotalCost,
    decimal ShippingCost,
    decimal TaxCost,
    decimal OtherCost,
    decimal TotalLandedCost,
    string? Notes,
    bool IsArchived,
    IReadOnlyList<PurchaseOrderLineDto> Lines);

public sealed record PurchaseOrderLineDto(
    Guid Id,
    Guid PartId,
    string PartNumber,
    string PartName,
    decimal QuantityOrdered,
    decimal QuantityReceived,
    decimal UnitCost,
    decimal LandedUnitCost,
    decimal ExtendedCost,
    decimal ExtendedLandedCost,
    string? Notes);

public sealed record CreatePurchaseOrderDto(Guid VendorId, DateTime OrderedAtUtc, DateTime? ExpectedAtUtc, string? Notes, IReadOnlyList<CreatePurchaseOrderLineDto> Lines);
public sealed record CreatePurchaseOrderLineDto(Guid PartId, decimal QuantityOrdered, decimal? UnitCost, string? Notes);
public sealed record UpdatePurchaseOrderDto(Guid VendorId, DateTime OrderedAtUtc, DateTime? ExpectedAtUtc, string? Notes);
public sealed record ReceivePurchaseOrderDto(DateTime? ReceivedAtUtc, IReadOnlyList<ReceivePurchaseOrderLineDto> Lines);
public sealed record ReceivePurchaseOrderLineDto(Guid PurchaseOrderLineId, decimal QuantityReceived);
public sealed record RecordVendorInvoiceDto(string VendorInvoiceNumber, DateTime VendorInvoiceDateUtc, decimal ShippingCost, decimal TaxCost, decimal OtherCost, string? Notes);
