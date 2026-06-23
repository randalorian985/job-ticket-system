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

        var created = await service.CreateAsync(new CreateCustomerDto(
            "Acme",
            null,
            null,
            null,
            null,
            BillingAddressLine1: "100 Billing Rd",
            BillingCity: "Tulsa",
            BillingState: "OK",
            BillingPostalCode: "74101"));
        var updated = await service.UpdateAsync(created.Id, new UpdateCustomerDto(
            "Acme Updated",
            "A-123",
            "Alex Manager",
            "alex@example.com",
            "555-0100",
            "200 Billing Rd",
            "Suite 2",
            "Dallas",
            "TX",
            "75001"));
        var archived = await service.ArchiveAsync(created.Id);
        var listed = await service.ListAsync(new PagedQuery());

        Assert.NotNull(updated);
        Assert.Equal("Acme Updated", updated!.Name);
        Assert.Equal("Alex Manager", updated.ContactName);
        Assert.Equal("555-0100", updated.Phone);
        Assert.Equal("200 Billing Rd", updated.BillingAddressLine1);
        Assert.Equal("Suite 2", updated.BillingAddressLine2);
        Assert.Equal("Dallas", updated.BillingCity);
        Assert.Equal("TX", updated.BillingState);
        Assert.Equal("75001", updated.BillingPostalCode);
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
        var created = await service.CreateAsync(new CreateServiceLocationDto(
            customer.Id,
            "Acme",
            "HQ",
            "123 Main",
            "Austin",
            "TX",
            "78701",
            "USA",
            OnSiteContactName: "Sam Site",
            OnSiteContactPhone: "555-0200",
            OnSiteContactEmail: "sam@example.com",
            AddressLine2: "Dock 4",
            ParishCounty: "Travis",
            GateCode: "4321",
            AccessInstructions: "Use north gate",
            SafetyRequirements: "Hard hat required",
            SiteNotes: "Check in at office"));

        var archived = await service.ArchiveAsync(created.Id);
        var listed = await service.ListAsync(new PagedQuery());

        Assert.Equal("Sam Site", created.OnSiteContactName);
        Assert.Equal("555-0200", created.OnSiteContactPhone);
        Assert.Equal("sam@example.com", created.OnSiteContactEmail);
        Assert.Equal("Dock 4", created.AddressLine2);
        Assert.Equal("Travis", created.ParishCounty);
        Assert.Equal("4321", created.GateCode);
        Assert.Equal("Use north gate", created.AccessInstructions);
        Assert.Equal("Hard hat required", created.SafetyRequirements);
        Assert.Equal("Check in at office", created.SiteNotes);
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

    [Fact]
    public async Task Equipment_can_be_unarchived_when_related_records_are_active()
    {
        await using var context = CreateContext();
        var customer = new Customer { Name = "Customer A" };
        var owner = new Customer { Name = "Owner A" };
        var billing = new Customer { Name = "Billing A" };
        context.Customers.AddRange(customer, owner, billing);
        await context.SaveChangesAsync();

        var location = new ServiceLocation
        {
            CustomerId = customer.Id, CompanyName = "Acme", LocationName = "Shop", AddressLine1 = "123 Main", City = "Austin", State = "TX", PostalCode = "78701", Country = "USA"
        };
        context.ServiceLocations.Add(location);
        await context.SaveChangesAsync();

        var service = new EquipmentService(context);
        var created = await service.CreateAsync(new CreateEquipmentDto(customer.Id, location.Id, owner.Id, billing.Id, "Lift", "E-1"));
        await service.ArchiveAsync(created.Id);

        var unarchived = await service.UnarchiveAsync(created.Id);
        Assert.True(unarchived);
        Assert.Single(await service.ListAsync(new PagedQuery()));
    }

    [Fact]
    public async Task Equipment_unarchive_fails_when_customer_or_related_records_archived_and_remains_archived()
    {
        await using var context = CreateContext();
        var customer = new Customer { Name = "Customer A" };
        var owner = new Customer { Name = "Owner A" };
        var billing = new Customer { Name = "Billing A" };
        context.Customers.AddRange(customer, owner, billing);
        await context.SaveChangesAsync();
        var location = new ServiceLocation { CustomerId = customer.Id, CompanyName = "Acme", LocationName = "Shop", AddressLine1 = "123 Main", City = "Austin", State = "TX", PostalCode = "78701", Country = "USA" };
        context.ServiceLocations.Add(location);
        await context.SaveChangesAsync();

        var service = new EquipmentService(context);
        var created = await service.CreateAsync(new CreateEquipmentDto(customer.Id, location.Id, owner.Id, billing.Id, "Lift", "E-2"));
        await service.ArchiveAsync(created.Id);

        customer.IsDeleted = true;
        owner.IsDeleted = true;
        billing.IsDeleted = true;
        location.IsDeleted = true;
        location.IsActive = false;
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() => service.UnarchiveAsync(created.Id));
        var archivedEntity = await context.Equipment.IgnoreQueryFilters().SingleAsync(x => x.Id == created.Id);
        Assert.True(archivedEntity.IsDeleted);
        Assert.Null(await service.GetAsync(created.Id));
    }

    [Fact]
    public async Task Part_unarchive_fails_when_category_or_vendor_archived_and_remains_archived()
    {
        await using var context = CreateContext();
        var category = new PartCategory { Name = "Electrical" };
        var vendor = new Vendor { Name = "Vendor A" };
        context.PartCategories.Add(category);
        context.Vendors.Add(vendor);
        await context.SaveChangesAsync();

        var service = new PartsService(context);
        var created = await service.CreateAsync(new CreatePartDto(category.Id, vendor.Id, "P-3", "Motor", null, 5m, 6m, 7m, 1m));
        await service.ArchiveAsync(created.Id);

        category.IsDeleted = true;
        vendor.IsDeleted = true;
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() => service.UnarchiveAsync(created.Id));
        var archivedEntity = await context.Parts.IgnoreQueryFilters().SingleAsync(x => x.Id == created.Id);
        Assert.True(archivedEntity.IsDeleted);
        Assert.Null(await service.GetAsync(created.Id));
    }


    [Fact]
    public async Task Master_data_lists_can_include_archived_records_for_manager_admin_workflows()
    {
        await using var context = CreateContext();
        var customer = new Customer { Name = "Customer A" };
        var vendor = new Vendor { Name = "Vendor A" };
        var category = new PartCategory { Name = "Category A" };
        context.AddRange(customer, vendor, category);
        await context.SaveChangesAsync();

        var location = new ServiceLocation { CustomerId = customer.Id, CompanyName = "Acme", LocationName = "HQ", AddressLine1 = "123 Main", City = "Austin", State = "TX", PostalCode = "78701", Country = "USA" };
        context.ServiceLocations.Add(location);
        await context.SaveChangesAsync();

        var customerService = new CustomersService(context);
        var locationService = new ServiceLocationsService(context);
        var equipmentService = new EquipmentService(context);
        var vendorService = new VendorsService(context);
        var categoryService = new PartCategoriesService(context);
        var partsService = new PartsService(context);

        var equipment = await equipmentService.CreateAsync(new CreateEquipmentDto(customer.Id, location.Id, null, null, "Lift", "E-1"));
        var part = await partsService.CreateAsync(new CreatePartDto(category.Id, vendor.Id, "P-1", "Filter", null, 1m, 2m, 3m, 1m));

        await customerService.ArchiveAsync(customer.Id);
        await locationService.ArchiveAsync(location.Id);
        await equipmentService.ArchiveAsync(equipment.Id);
        await vendorService.ArchiveAsync(vendor.Id);
        await categoryService.ArchiveAsync(category.Id);
        await partsService.ArchiveAsync(part.Id);

        Assert.Empty(await customerService.ListAsync(new PagedQuery()));
        Assert.True((await customerService.ListAsync(new PagedQuery(IncludeArchived: true))).Single().IsArchived);
        Assert.True((await locationService.ListAsync(new PagedQuery(IncludeArchived: true))).Single().IsArchived);
        Assert.True((await equipmentService.ListAsync(new PagedQuery(IncludeArchived: true))).Single().IsArchived);
        Assert.True((await vendorService.ListAsync(new PagedQuery(IncludeArchived: true))).Single().IsArchived);
        Assert.True((await categoryService.ListAsync(new PagedQuery(IncludeArchived: true))).Single().IsArchived);
        Assert.True((await partsService.ListAsync(new PagedQuery(IncludeArchived: true))).Single().IsArchived);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
