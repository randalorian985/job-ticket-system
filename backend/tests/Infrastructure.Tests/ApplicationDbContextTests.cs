using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class ApplicationDbContextTests
{
    [Fact]
    public void Model_contains_expected_core_entities()
    {
        using var context = CreateContext();
        var entityTypes = context.Model.GetEntityTypes().Select(entityType => entityType.ClrType).ToHashSet();

        Assert.Contains(typeof(Customer), entityTypes);
        Assert.Contains(typeof(Employee), entityTypes);
        Assert.Contains(typeof(JobTicket), entityTypes);
        Assert.Contains(typeof(InvoiceSummary), entityTypes);
        Assert.Contains(typeof(AuditLog), entityTypes);
    }

    [Fact]
    public void Model_uses_required_decimal_precision()
    {
        using var context = CreateContext();
        var model = context.Model;

        AssertPrecision<Part>(model, nameof(Part.UnitCost), 18, 2);
        AssertPrecision<Part>(model, nameof(Part.QuantityOnHand), 18, 4);
        AssertPrecision<TimeEntry>(model, nameof(TimeEntry.LaborHours), 18, 4);
        AssertPrecision<Equipment>(model, nameof(Equipment.Latitude), 9, 6);
        AssertPrecision<JobTicket>(model, nameof(JobTicket.SiteLongitude), 9, 6);
        AssertPrecision<InvoiceSummary>(model, nameof(InvoiceSummary.TotalAmount), 18, 2);
    }

    [Fact]
    public async Task SaveChanges_sets_utc_audit_timestamps()
    {
        await using var context = CreateContext();

        var customer = new Customer { Name = "Acme Marine" };
        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        Assert.NotEqual(default, customer.CreatedAtUtc);
        Assert.NotEqual(default, customer.UpdatedAtUtc);
        Assert.Equal(DateTimeKind.Utc, customer.CreatedAtUtc.Kind);
        Assert.Equal(DateTimeKind.Utc, customer.UpdatedAtUtc.Kind);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static void AssertPrecision<TEntity>(Microsoft.EntityFrameworkCore.Metadata.IModel model, string propertyName, int precision, int scale)
    {
        var property = model.FindEntityType(typeof(TEntity))?.FindProperty(propertyName);
        Assert.NotNull(property);
        Assert.Equal(precision, property.GetPrecision());
        Assert.Equal(scale, property.GetScale());
    }
}
