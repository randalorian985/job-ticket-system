using JobTicketSystem.Domain.Common;
using JobTicketSystem.Domain.Enums;

namespace JobTicketSystem.Domain.Entities;

public sealed class PurchaseOrder : SoftDeletableEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public DateTime OrderedAtUtc { get; set; }
    public DateTime? ExpectedAtUtc { get; set; }
    public DateTime? ReceivedAtUtc { get; set; }
    public string? VendorInvoiceNumber { get; set; }
    public DateTime? VendorInvoiceDateUtc { get; set; }
    public decimal SubtotalCost { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal TaxCost { get; set; }
    public decimal OtherCost { get; set; }
    public decimal TotalLandedCost { get; set; }
    public string? Notes { get; set; }
    public ICollection<PurchaseOrderLine> Lines { get; set; } = new List<PurchaseOrderLine>();
}

public sealed class PurchaseOrderLine : AuditableEntity
{
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Guid PartId { get; set; }
    public Part Part { get; set; } = null!;
    public decimal QuantityOrdered { get; set; }
    public decimal QuantityReceived { get; set; }
    public decimal UnitCost { get; set; }
    public decimal LandedUnitCost { get; set; }
    public string? Notes { get; set; }
}
