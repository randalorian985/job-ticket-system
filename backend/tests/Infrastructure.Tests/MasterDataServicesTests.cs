using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class MasterDataServicesTests
{
    [Fact]
    public async Task Customers_create_update_archive_and_list_excludes_archived()
    {
        await using var context = CreateContext();
        var service = new CustomersService(context);

        var created = await service.CreateAsync(new CreateCustomerDto("Acme", null, null, null, null));
        var updated = await service.UpdateAsync(created.Id, new UpdateCustomerDto("Acme Updated", "A-123", null, null, null));
        var archived = await service.ArchiveAsync(created.Id);
        var listed = await service.ListAsync(new PagedQuery());

        Assert.NotNull(updated);
        Assert.Equal("Acme Updated", updated!.Name);
        Assert.True(archived);
        Assert.Empty(listed);
    }

    [Fact]
    public async Task Customers_can_be_unarchived()
    {
        await using var context = CreateContext();
        var service = new CustomersService(context);
        var created = await service.CreateAsync(new CreateCustomerDto("Reopen", null, null, null, null));
        await service.ArchiveAsync(created.Id);

        var unarchived = await service.UnarchiveAsync(created.Id);
        var listed = await service.ListAsync(new PagedQuery());

        Assert.True(unarchived);
        Assert.Single(listed);
    }

    [Fact]
    public async Task Service_location_create_fails_when_customer_missing()
    {
        await using var context = CreateContext();
        var service = new ServiceLocationsService(context);

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateServiceLocationDto(
            Guid.NewGuid(),
            "Acme",
            "Yard",
            "123 Main",
            "Austin",
            "TX",
            "78701",
            "USA")));
    }

    [Fact]
    public async Task Service_location_create_and_archive_excludes_from_list()
    {
        await using var context = CreateContext();
        var customer = new Customer { Name = "Customer A" };
        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        var service = new ServiceLocationsService(context);
        var created = await service.CreateAsync(new CreateServiceLocationDto(customer.Id, "Acme", "HQ", "123 Main", "Austin", "TX", "78701", "USA"));

        var archived = await service.ArchiveAsync(created.Id);
        var listed = await service.ListAsync(new PagedQuery());

        Assert.True(archived);
        Assert.Empty(listed);
    }

    [Fact]
    public async Task Parts_update_and_archive_excludes_from_list()
    {
        await using var context = CreateContext();
        var category = new PartCategory { Name = "Electrical" };
        context.PartCategories.Add(category);
        await context.SaveChangesAsync();

        var service = new PartsService(context);
        var created = await service.CreateAsync(new CreatePartDto(category.Id, null, "P-1", "Fuse", null, 1m, 2m, 10m, 2m));
        var updated = await service.UpdateAsync(created.Id, new UpdatePartDto(category.Id, null, "P-1", "Fuse 2", "Desc", 1m, 3m, 12m, 2m));
        var archived = await service.ArchiveAsync(created.Id);
        var listed = await service.ListAsync(new PagedQuery());

        Assert.NotNull(updated);
        Assert.Equal("Fuse 2", updated!.Name);
        Assert.True(archived);
        Assert.Empty(listed);
    }

    [Fact]
    public async Task Parts_can_be_unarchived()
    {
        await using var context = CreateContext();
        var category = new PartCategory { Name = "Hydraulic" };
        context.PartCategories.Add(category);
        await context.SaveChangesAsync();

        var service = new PartsService(context);
        var created = await service.CreateAsync(new CreatePartDto(category.Id, null, "P-2", "Seal", null, 2m, 3m, 5m, 1m));
        await service.ArchiveAsync(created.Id);

        var unarchived = await service.UnarchiveAsync(created.Id);
        var listed = await service.ListAsync(new PagedQuery());
        Assert.True(unarchived);
        Assert.Single(listed);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
