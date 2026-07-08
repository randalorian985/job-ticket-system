using JobTicketSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobTicketSystem.Infrastructure.Persistence.Configurations;

public sealed class StockLocationConfiguration : IEntityTypeConfiguration<StockLocation>
{
    public void Configure(EntityTypeBuilder<StockLocation> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000);
        builder.Property(x => x.IsActive).HasDefaultValue(true).IsRequired();
        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => x.Name);
        builder.HasIndex(x => x.IsActive);
    }
}

public sealed class InventoryTransactionConfiguration : IEntityTypeConfiguration<InventoryTransaction>
{
    public void Configure(EntityTypeBuilder<InventoryTransaction> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.Property(x => x.QuantityDelta).HasPrecision(18, 4);
        builder.Property(x => x.Reason).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.HasQueryFilter(x => !x.Part.IsDeleted);
        builder.HasOne(x => x.StockLocation).WithMany(x => x.InventoryTransactions).HasForeignKey(x => x.StockLocationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Part).WithMany().HasForeignKey(x => x.PartId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.PurchaseOrder).WithMany().HasForeignKey(x => x.PurchaseOrderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.PurchaseOrderLine).WithMany().HasForeignKey(x => x.PurchaseOrderLineId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => x.StockLocationId);
        builder.HasIndex(x => x.PartId);
        builder.HasIndex(x => x.TransactionType);
        builder.HasIndex(x => x.OccurredAtUtc);
        builder.HasIndex(x => x.PurchaseOrderId);
    }
}
