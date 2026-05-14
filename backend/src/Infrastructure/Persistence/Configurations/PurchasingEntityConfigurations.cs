using JobTicketSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobTicketSystem.Infrastructure.Persistence.Configurations;

public sealed class PurchaseOrderConfiguration : IEntityTypeConfiguration<PurchaseOrder>
{
    public void Configure(EntityTypeBuilder<PurchaseOrder> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.OrderNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.VendorInvoiceNumber).HasMaxLength(100);
        builder.Property(x => x.SubtotalCost).HasPrecision(18, 2);
        builder.Property(x => x.ShippingCost).HasPrecision(18, 2);
        builder.Property(x => x.TaxCost).HasPrecision(18, 2);
        builder.Property(x => x.OtherCost).HasPrecision(18, 2);
        builder.Property(x => x.TotalLandedCost).HasPrecision(18, 2);
        builder.Property(x => x.Notes).HasMaxLength(4000);
        builder.HasOne(x => x.Vendor).WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Lines).WithOne(x => x.PurchaseOrder).HasForeignKey(x => x.PurchaseOrderId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => x.OrderNumber).IsUnique();
        builder.HasIndex(x => x.VendorId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.OrderedAtUtc);
    }
}

public sealed class PurchaseOrderLineConfiguration : IEntityTypeConfiguration<PurchaseOrderLine>
{
    public void Configure(EntityTypeBuilder<PurchaseOrderLine> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.Property(x => x.QuantityOrdered).HasPrecision(18, 4);
        builder.Property(x => x.QuantityReceived).HasPrecision(18, 4);
        builder.Property(x => x.UnitCost).HasPrecision(18, 2);
        builder.Property(x => x.LandedUnitCost).HasPrecision(18, 2);
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.HasOne(x => x.Part).WithMany().HasForeignKey(x => x.PartId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => x.PurchaseOrderId);
        builder.HasIndex(x => x.PartId);
    }
}
