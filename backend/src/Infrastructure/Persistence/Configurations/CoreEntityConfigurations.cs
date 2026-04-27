using JobTicketSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobTicketSystem.Infrastructure.Persistence.Configurations;

public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.AccountNumber).HasMaxLength(50);
        builder.Property(x => x.Email).HasMaxLength(320);
        builder.HasIndex(x => x.AccountNumber).IsUnique().HasFilter("[AccountNumber] IS NOT NULL");
    }
}

public sealed class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(320);
        builder.Property(x => x.LaborRate).HasPrecision(18, 2);
        builder.HasIndex(x => x.Email).IsUnique().HasFilter("[Email] IS NOT NULL");
    }
}

public sealed class EquipmentConfiguration : IEntityTypeConfiguration<Equipment>
{
    public void Configure(EntityTypeBuilder<Equipment> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Latitude).HasPrecision(9, 6);
        builder.Property(x => x.Longitude).HasPrecision(9, 6);
        builder.HasOne(x => x.Customer).WithMany(x => x.Equipment).HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ServiceLocation).WithMany(x => x.Equipment).HasForeignKey(x => x.ServiceLocationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.OwnerCustomer).WithMany().HasForeignKey(x => x.OwnerCustomerId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(x => x.ResponsibleBillingCustomer).WithMany().HasForeignKey(x => x.ResponsibleBillingCustomerId).OnDelete(DeleteBehavior.NoAction);
        builder.HasIndex(x => x.ServiceLocationId);
        builder.HasIndex(x => x.OwnerCustomerId);
        builder.HasIndex(x => x.ResponsibleBillingCustomerId);
    }
}

public sealed class ServiceLocationConfiguration : IEntityTypeConfiguration<ServiceLocation>
{
    public void Configure(EntityTypeBuilder<ServiceLocation> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.CompanyName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.LocationName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.OnSiteContactName).HasMaxLength(200);
        builder.Property(x => x.OnSiteContactPhone).HasMaxLength(50);
        builder.Property(x => x.OnSiteContactEmail).HasMaxLength(320);
        builder.Property(x => x.AddressLine1).HasMaxLength(200).IsRequired();
        builder.Property(x => x.AddressLine2).HasMaxLength(200);
        builder.Property(x => x.City).HasMaxLength(100).IsRequired();
        builder.Property(x => x.State).HasMaxLength(100).IsRequired();
        builder.Property(x => x.PostalCode).HasMaxLength(20).IsRequired();
        builder.Property(x => x.ParishCounty).HasMaxLength(100);
        builder.Property(x => x.Country).HasMaxLength(100).IsRequired();
        builder.Property(x => x.GateCode).HasMaxLength(100);
        builder.Property(x => x.AccessInstructions).HasMaxLength(2000);
        builder.Property(x => x.SafetyRequirements).HasMaxLength(2000);
        builder.Property(x => x.SiteNotes).HasMaxLength(4000);
        builder.Property(x => x.Latitude).HasPrecision(9, 6);
        builder.Property(x => x.Longitude).HasPrecision(9, 6);
        builder.Property(x => x.IsActive).HasDefaultValue(true).IsRequired();
        builder.HasOne(x => x.Customer).WithMany(x => x.ServiceLocations).HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(x => x.CustomerId);
    }
}

public sealed class VendorConfiguration : IEntityTypeConfiguration<Vendor>
{
    public void Configure(EntityTypeBuilder<Vendor> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
    }
}

public sealed class PartCategoryConfiguration : IEntityTypeConfiguration<PartCategory>
{
    public void Configure(EntityTypeBuilder<PartCategory> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.HasIndex(x => x.Name).IsUnique();
    }
}

public sealed class PartConfiguration : IEntityTypeConfiguration<Part>
{
    public void Configure(EntityTypeBuilder<Part> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.PartNumber).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.UnitCost).HasPrecision(18, 2);
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.Property(x => x.QuantityOnHand).HasPrecision(18, 4);
        builder.Property(x => x.ReorderThreshold).HasPrecision(18, 4);
        builder.HasOne(x => x.PartCategory).WithMany(x => x.Parts).HasForeignKey(x => x.PartCategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Vendor).WithMany(x => x.Parts).HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(x => x.PartNumber).IsUnique();
    }
}

public sealed class JobTicketConfiguration : IEntityTypeConfiguration<JobTicket>
{
    public void Configure(EntityTypeBuilder<JobTicket> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.TicketNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.BillingContactName).HasMaxLength(200);
        builder.Property(x => x.BillingContactPhone).HasMaxLength(50);
        builder.Property(x => x.BillingContactEmail).HasMaxLength(320);
        builder.Property(x => x.PurchaseOrderNumber).HasMaxLength(100);
        builder.Property(x => x.SiteLatitude).HasPrecision(9, 6);
        builder.Property(x => x.SiteLongitude).HasPrecision(9, 6);
        builder.HasOne(x => x.Customer).WithMany(x => x.JobTickets).HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ServiceLocation).WithMany(x => x.JobTickets).HasForeignKey(x => x.ServiceLocationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.BillingPartyCustomer).WithMany().HasForeignKey(x => x.BillingPartyCustomerId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(x => x.Equipment).WithMany(x => x.JobTickets).HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(x => x.TicketNumber).IsUnique();
        builder.HasIndex(x => x.ServiceLocationId);
        builder.HasIndex(x => x.BillingPartyCustomerId);
    }
}

public sealed class JobTicketEmployeeConfiguration : IEntityTypeConfiguration<JobTicketEmployee>
{
    public void Configure(EntityTypeBuilder<JobTicketEmployee> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.HasOne(x => x.JobTicket).WithMany(x => x.AssignedEmployees).HasForeignKey(x => x.JobTicketId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Employee).WithMany(x => x.JobTickets).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.JobTicketId, x.EmployeeId }).IsUnique().HasFilter("[IsDeleted] = 0");
    }
}

public sealed class TimeEntryConfiguration : IEntityTypeConfiguration<TimeEntry>
{
    public void Configure(EntityTypeBuilder<TimeEntry> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.LaborHours).HasPrecision(18, 4);
        builder.Property(x => x.BillableHours).HasPrecision(18, 4);
        builder.Property(x => x.HourlyRate).HasPrecision(18, 2);
        builder.HasOne(x => x.JobTicket).WithMany(x => x.TimeEntries).HasForeignKey(x => x.JobTicketId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Employee).WithMany(x => x.TimeEntries).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class TimeEntryAdjustmentConfiguration : IEntityTypeConfiguration<TimeEntryAdjustment>
{
    public void Configure(EntityTypeBuilder<TimeEntryAdjustment> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.Property(x => x.Hours).HasPrecision(18, 4);
        builder.Property(x => x.Reason).HasMaxLength(1000).IsRequired();
        builder.HasQueryFilter(x => !x.TimeEntry.IsDeleted);
        builder.HasOne(x => x.TimeEntry).WithMany(x => x.Adjustments).HasForeignKey(x => x.TimeEntryId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class JobWorkEntryConfiguration : IEntityTypeConfiguration<JobWorkEntry>
{
    public void Configure(EntityTypeBuilder<JobWorkEntry> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.Notes).HasMaxLength(4000).IsRequired();
        builder.HasOne(x => x.JobTicket).WithMany(x => x.WorkEntries).HasForeignKey(x => x.JobTicketId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Employee).WithMany(x => x.WorkEntries).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class JobTicketPartConfiguration : IEntityTypeConfiguration<JobTicketPart>
{
    public void Configure(EntityTypeBuilder<JobTicketPart> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.Quantity).HasPrecision(18, 4);
        builder.Property(x => x.UnitCost).HasPrecision(18, 2);
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.HasOne(x => x.JobTicket).WithMany(x => x.Parts).HasForeignKey(x => x.JobTicketId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Part).WithMany(x => x.JobTicketParts).HasForeignKey(x => x.PartId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class JobTicketFileConfiguration : IEntityTypeConfiguration<JobTicketFile>
{
    public void Configure(EntityTypeBuilder<JobTicketFile> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.FileName).HasMaxLength(255).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(150).IsRequired();
        builder.Property(x => x.StoragePath).HasMaxLength(1000).IsRequired();
        builder.HasOne(x => x.JobTicket).WithMany(x => x.Files).HasForeignKey(x => x.JobTicketId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.EntityName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.OldValuesJson).HasColumnType("nvarchar(max)");
        builder.Property(x => x.NewValuesJson).HasColumnType("nvarchar(max)");
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.HasIndex(x => new { x.EntityName, x.EntityId });
    }
}

public sealed class InvoiceSummaryConfiguration : IEntityTypeConfiguration<InvoiceSummary>
{
    public void Configure(EntityTypeBuilder<InvoiceSummary> builder)
    {
        builder.ConfigureAuditableEntity();
        builder.ConfigureSoftDelete();
        builder.Property(x => x.InvoiceNumber).HasMaxLength(50);
        builder.Property(x => x.LaborSubtotal).HasPrecision(18, 2);
        builder.Property(x => x.PartsSubtotal).HasPrecision(18, 2);
        builder.Property(x => x.TaxAmount).HasPrecision(18, 2);
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 2);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.HasOne(x => x.JobTicket).WithOne(x => x.InvoiceSummary).HasForeignKey<InvoiceSummary>(x => x.JobTicketId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Customer).WithMany(x => x.InvoiceSummaries).HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => x.JobTicketId).IsUnique();
        builder.HasIndex(x => x.InvoiceNumber).IsUnique().HasFilter("[InvoiceNumber] IS NOT NULL");
    }
}
