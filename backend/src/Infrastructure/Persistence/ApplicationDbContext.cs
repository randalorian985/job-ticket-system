using JobTicketSystem.Domain.Common;
using JobTicketSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace JobTicketSystem.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<ServiceLocation> ServiceLocations => Set<ServiceLocation>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<PartCategory> PartCategories => Set<PartCategory>();
    public DbSet<Part> Parts => Set<Part>();
    public DbSet<JobTicket> JobTickets => Set<JobTicket>();
    public DbSet<JobTicketEmployee> JobTicketEmployees => Set<JobTicketEmployee>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<TimeEntryAdjustment> TimeEntryAdjustments => Set<TimeEntryAdjustment>();
    public DbSet<JobWorkEntry> JobWorkEntries => Set<JobWorkEntry>();
    public DbSet<JobTicketPart> JobTicketParts => Set<JobTicketPart>();
    public DbSet<JobTicketFile> JobTicketFiles => Set<JobTicketFile>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<InvoiceSummary> InvoiceSummaries => Set<InvoiceSummary>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderLine> PurchaseOrderLines => Set<PurchaseOrderLine>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        ApplyUtcDateTimeConverters(modelBuilder);
    }

    public override int SaveChanges()
    {
        ApplyUtcAuditValues();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyUtcAuditValues();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyUtcAuditValues()
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = now;
                entry.Entity.UpdatedAtUtc = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = now;
                entry.Property(entity => entity.CreatedAtUtc).IsModified = false;
            }
        }

        foreach (var entry in ChangeTracker.Entries<AuditLog>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CreatedAtUtc == default)
            {
                entry.Entity.CreatedAtUtc = now;
            }
        }
    }

    private static void ApplyUtcDateTimeConverters(ModelBuilder modelBuilder)
    {
        var utcDateTimeConverter = new ValueConverter<DateTime, DateTime>(
            value => value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime(),
            value => DateTime.SpecifyKind(value, DateTimeKind.Utc));

        var nullableUtcDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
            value => value.HasValue
                ? (value.Value.Kind == DateTimeKind.Utc ? value : value.Value.ToUniversalTime())
                : value,
            value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : value);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(utcDateTimeConverter);
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(nullableUtcDateTimeConverter);
                }
            }
        }
    }
}
