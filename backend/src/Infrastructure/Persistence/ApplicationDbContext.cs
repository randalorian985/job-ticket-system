using JobTicketSystem.Domain.Common;
using JobTicketSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
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
}
