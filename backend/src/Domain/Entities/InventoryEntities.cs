using JobTicketSystem.Domain.Common;
using JobTicketSystem.Domain.Enums;

namespace JobTicketSystem.Domain.Entities;

public sealed class StockLocation : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
}

public sealed class InventoryTransaction : AuditableEntity
{
    public Guid StockLocationId { get; set; }
    public StockLocation StockLocation { get; set; } = null!;
    public Guid PartId { get; set; }
    public Part Part { get; set; } = null!;
    public Guid? PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }
    public Guid? PurchaseOrderLineId { get; set; }
    public PurchaseOrderLine? PurchaseOrderLine { get; set; }
    public InventoryTransactionType TransactionType { get; set; } = InventoryTransactionType.ManualAdjustment;
    public decimal QuantityDelta { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime OccurredAtUtc { get; set; }
}
