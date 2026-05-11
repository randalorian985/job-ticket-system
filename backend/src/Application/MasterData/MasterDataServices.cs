using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.MasterData;

public interface ICustomersService
{
    Task<IReadOnlyList<CustomerDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default);
    Task<CustomerDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CustomerDto> CreateAsync(CreateCustomerDto request, CancellationToken cancellationToken = default);
    Task<CustomerDto?> UpdateAsync(Guid id, UpdateCustomerDto request, CancellationToken cancellationToken = default);
    Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IServiceLocationsService
{
    Task<IReadOnlyList<ServiceLocationDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default);
    Task<ServiceLocationDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ServiceLocationDto> CreateAsync(CreateServiceLocationDto request, CancellationToken cancellationToken = default);
    Task<ServiceLocationDto?> UpdateAsync(Guid id, UpdateServiceLocationDto request, CancellationToken cancellationToken = default);
    Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IEquipmentService
{
    Task<IReadOnlyList<EquipmentDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default);
    Task<EquipmentDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EquipmentDto> CreateAsync(CreateEquipmentDto request, CancellationToken cancellationToken = default);
    Task<EquipmentDto?> UpdateAsync(Guid id, UpdateEquipmentDto request, CancellationToken cancellationToken = default);
    Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IVendorsService
{
    Task<IReadOnlyList<VendorDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default);
    Task<VendorDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VendorDto> CreateAsync(CreateVendorDto request, CancellationToken cancellationToken = default);
    Task<VendorDto?> UpdateAsync(Guid id, UpdateVendorDto request, CancellationToken cancellationToken = default);
    Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IPartCategoriesService
{
    Task<IReadOnlyList<PartCategoryDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default);
    Task<PartCategoryDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PartCategoryDto> CreateAsync(CreatePartCategoryDto request, CancellationToken cancellationToken = default);
    Task<PartCategoryDto?> UpdateAsync(Guid id, UpdatePartCategoryDto request, CancellationToken cancellationToken = default);
    Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IPartsService
{
    Task<IReadOnlyList<PartDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartLookupDto>> ListLookupAsync(PagedQuery query, CancellationToken cancellationToken = default);
    Task<PartDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PartDto> CreateAsync(CreatePartDto request, CancellationToken cancellationToken = default);
    Task<PartDto?> UpdateAsync(Guid id, UpdatePartDto request, CancellationToken cancellationToken = default);
    Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class CustomersService(ApplicationDbContext dbContext) : ICustomersService
{
    public async Task<IReadOnlyList<CustomerDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        var customers = query.IncludeArchived ? dbContext.Customers.IgnoreQueryFilters() : dbContext.Customers;
        return await customers.OrderBy(x => x.Name).Skip(query.NormalizedOffset).Take(query.NormalizedLimit).Select(Map).ToListAsync(cancellationToken);
    }

    public Task<CustomerDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Customers.Where(x => x.Id == id).Select(Map).SingleOrDefaultAsync(cancellationToken);

    public async Task<CustomerDto> CreateAsync(CreateCustomerDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        var entity = new Customer
        {
            Name = request.Name.Trim(),
            AccountNumber = ValidationHelpers.NullIfWhitespace(request.AccountNumber),
            ContactName = ValidationHelpers.NullIfWhitespace(request.ContactName),
            Email = ValidationHelpers.NullIfWhitespace(request.Email),
            Phone = ValidationHelpers.NullIfWhitespace(request.Phone)
        };

        dbContext.Customers.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map.Compile().Invoke(entity);
    }

    public async Task<CustomerDto?> UpdateAsync(Guid id, UpdateCustomerDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        var entity = await dbContext.Customers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.AccountNumber = ValidationHelpers.NullIfWhitespace(request.AccountNumber);
        entity.ContactName = ValidationHelpers.NullIfWhitespace(request.ContactName);
        entity.Email = ValidationHelpers.NullIfWhitespace(request.Email);
        entity.Phone = ValidationHelpers.NullIfWhitespace(request.Phone);

        await dbContext.SaveChangesAsync(cancellationToken);
        return Map.Compile().Invoke(entity);
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Customers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;

        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Customers.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = false;
        entity.DeletedAtUtc = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static readonly System.Linq.Expressions.Expression<Func<Customer, CustomerDto>> Map = x => new CustomerDto(x.Id, x.Name, x.AccountNumber, x.ContactName, x.Email, x.Phone, x.IsDeleted);
}

public sealed class ServiceLocationsService(ApplicationDbContext dbContext) : IServiceLocationsService
{
    public async Task<IReadOnlyList<ServiceLocationDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        var locations = query.IncludeArchived ? dbContext.ServiceLocations.IgnoreQueryFilters() : dbContext.ServiceLocations;
        return await locations.OrderBy(x => x.CompanyName).ThenBy(x => x.LocationName).Skip(query.NormalizedOffset).Take(query.NormalizedLimit).Select(Map).ToListAsync(cancellationToken);
    }

    public Task<ServiceLocationDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.ServiceLocations.Where(x => x.Id == id).Select(Map).SingleOrDefaultAsync(cancellationToken);

    public async Task<ServiceLocationDto> CreateAsync(CreateServiceLocationDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateServiceLocation(request.CompanyName, request.LocationName, request.AddressLine1, request.City, request.State, request.PostalCode, request.Country);
        await EnsureCustomerExists(request.CustomerId, cancellationToken);

        var entity = new ServiceLocation
        {
            CustomerId = request.CustomerId,
            CompanyName = request.CompanyName.Trim(),
            LocationName = request.LocationName.Trim(),
            AddressLine1 = request.AddressLine1.Trim(),
            City = request.City.Trim(),
            State = request.State.Trim(),
            PostalCode = request.PostalCode.Trim(),
            Country = request.Country.Trim(),
            IsActive = request.IsActive
        };

        dbContext.ServiceLocations.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map.Compile().Invoke(entity);
    }

    public async Task<ServiceLocationDto?> UpdateAsync(Guid id, UpdateServiceLocationDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateServiceLocation(request.CompanyName, request.LocationName, request.AddressLine1, request.City, request.State, request.PostalCode, request.Country);
        await EnsureCustomerExists(request.CustomerId, cancellationToken);

        var entity = await dbContext.ServiceLocations.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;

        entity.CustomerId = request.CustomerId;
        entity.CompanyName = request.CompanyName.Trim();
        entity.LocationName = request.LocationName.Trim();
        entity.AddressLine1 = request.AddressLine1.Trim();
        entity.City = request.City.Trim();
        entity.State = request.State.Trim();
        entity.PostalCode = request.PostalCode.Trim();
        entity.Country = request.Country.Trim();
        entity.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Map.Compile().Invoke(entity);
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.ServiceLocations.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsActive = false;
        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.ServiceLocations.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = false;
        entity.DeletedAtUtc = null;
        entity.IsActive = true;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task EnsureCustomerExists(Guid? customerId, CancellationToken cancellationToken)
    {
        if (!customerId.HasValue) return;
        var exists = await dbContext.Customers.AnyAsync(x => x.Id == customerId.Value, cancellationToken);
        if (!exists) throw new ValidationException("CustomerId does not reference an active customer.");
    }

    private static readonly System.Linq.Expressions.Expression<Func<ServiceLocation, ServiceLocationDto>> Map = x => new ServiceLocationDto(
        x.Id, x.CustomerId, x.CompanyName, x.LocationName, x.AddressLine1, x.City, x.State, x.PostalCode, x.Country, x.IsActive, x.IsDeleted);
}

public sealed class EquipmentService(ApplicationDbContext dbContext) : IEquipmentService
{
    public async Task<IReadOnlyList<EquipmentDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        var equipment = query.IncludeArchived ? dbContext.Equipment.IgnoreQueryFilters() : dbContext.Equipment;
        return await equipment.OrderBy(x => x.Name).Skip(query.NormalizedOffset).Take(query.NormalizedLimit).Select(Map).ToListAsync(cancellationToken);
    }

    public Task<EquipmentDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Equipment.Where(x => x.Id == id).Select(Map).SingleOrDefaultAsync(cancellationToken);

    public async Task<EquipmentDto> CreateAsync(CreateEquipmentDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        await EnsureRelatedExists(request.CustomerId, request.ServiceLocationId, request.OwnerCustomerId, request.ResponsibleBillingCustomerId, cancellationToken);

        var entity = new Equipment
        {
            CustomerId = request.CustomerId,
            ServiceLocationId = request.ServiceLocationId,
            OwnerCustomerId = request.OwnerCustomerId,
            ResponsibleBillingCustomerId = request.ResponsibleBillingCustomerId,
            Name = request.Name.Trim(),
            EquipmentNumber = ValidationHelpers.NullIfWhitespace(request.EquipmentNumber),
            UnitNumber = ValidationHelpers.NullIfWhitespace(request.UnitNumber),
            Manufacturer = ValidationHelpers.NullIfWhitespace(request.Manufacturer),
            ModelNumber = ValidationHelpers.NullIfWhitespace(request.ModelNumber),
            SerialNumber = ValidationHelpers.NullIfWhitespace(request.SerialNumber),
            EquipmentType = ValidationHelpers.NullIfWhitespace(request.EquipmentType),
            Year = request.Year
        };

        dbContext.Equipment.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map.Compile().Invoke(entity);
    }

    public async Task<EquipmentDto?> UpdateAsync(Guid id, UpdateEquipmentDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        await EnsureRelatedExists(request.CustomerId, request.ServiceLocationId, request.OwnerCustomerId, request.ResponsibleBillingCustomerId, cancellationToken);

        var entity = await dbContext.Equipment.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;

        entity.CustomerId = request.CustomerId;
        entity.ServiceLocationId = request.ServiceLocationId;
        entity.OwnerCustomerId = request.OwnerCustomerId;
        entity.ResponsibleBillingCustomerId = request.ResponsibleBillingCustomerId;
        entity.Name = request.Name.Trim();
        entity.EquipmentNumber = ValidationHelpers.NullIfWhitespace(request.EquipmentNumber);
        entity.UnitNumber = ValidationHelpers.NullIfWhitespace(request.UnitNumber);
        entity.Manufacturer = ValidationHelpers.NullIfWhitespace(request.Manufacturer);
        entity.ModelNumber = ValidationHelpers.NullIfWhitespace(request.ModelNumber);
        entity.SerialNumber = ValidationHelpers.NullIfWhitespace(request.SerialNumber);
        entity.EquipmentType = ValidationHelpers.NullIfWhitespace(request.EquipmentType);
        entity.Year = request.Year;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Map.Compile().Invoke(entity);
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Equipment.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Equipment.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        await EnsureRelatedExists(entity.CustomerId, entity.ServiceLocationId, entity.OwnerCustomerId, entity.ResponsibleBillingCustomerId, cancellationToken);
        entity.IsDeleted = false;
        entity.DeletedAtUtc = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task EnsureRelatedExists(Guid customerId, Guid serviceLocationId, Guid? ownerCustomerId, Guid? responsibleBillingCustomerId, CancellationToken cancellationToken)
    {
        if (!await dbContext.Customers.AnyAsync(x => x.Id == customerId, cancellationToken)) throw new ValidationException("CustomerId does not reference an active customer.");
        if (!await dbContext.ServiceLocations.AnyAsync(x => x.Id == serviceLocationId, cancellationToken)) throw new ValidationException("ServiceLocationId does not reference an active service location.");
        if (ownerCustomerId.HasValue && !await dbContext.Customers.AnyAsync(x => x.Id == ownerCustomerId.Value, cancellationToken)) throw new ValidationException("OwnerCustomerId does not reference an active customer.");
        if (responsibleBillingCustomerId.HasValue && !await dbContext.Customers.AnyAsync(x => x.Id == responsibleBillingCustomerId.Value, cancellationToken)) throw new ValidationException("ResponsibleBillingCustomerId does not reference an active customer.");
    }

    private static readonly System.Linq.Expressions.Expression<Func<Equipment, EquipmentDto>> Map = x => new EquipmentDto(
        x.Id, x.CustomerId, x.ServiceLocationId, x.OwnerCustomerId, x.ResponsibleBillingCustomerId, x.Name, x.EquipmentNumber, x.UnitNumber, x.Manufacturer, x.ModelNumber, x.SerialNumber, x.EquipmentType, x.Year, x.IsDeleted);
}

public sealed class VendorsService(ApplicationDbContext dbContext) : IVendorsService
{
    public async Task<IReadOnlyList<VendorDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        var vendors = query.IncludeArchived ? dbContext.Vendors.IgnoreQueryFilters() : dbContext.Vendors;
        return await vendors.OrderBy(x => x.Name).Skip(query.NormalizedOffset).Take(query.NormalizedLimit)
            .Select(x => new VendorDto(x.Id, x.Name, x.AccountNumber, x.ContactName, x.Email, x.Phone, x.IsDeleted))
            .ToListAsync(cancellationToken);
    }

    public Task<VendorDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Vendors.Where(x => x.Id == id).Select(x => new VendorDto(x.Id, x.Name, x.AccountNumber, x.ContactName, x.Email, x.Phone, x.IsDeleted))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<VendorDto> CreateAsync(CreateVendorDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        var entity = new Vendor { Name = request.Name.Trim(), AccountNumber = ValidationHelpers.NullIfWhitespace(request.AccountNumber), ContactName = ValidationHelpers.NullIfWhitespace(request.ContactName), Email = ValidationHelpers.NullIfWhitespace(request.Email), Phone = ValidationHelpers.NullIfWhitespace(request.Phone) };
        dbContext.Vendors.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new VendorDto(entity.Id, entity.Name, entity.AccountNumber, entity.ContactName, entity.Email, entity.Phone, entity.IsDeleted);
    }

    public async Task<VendorDto?> UpdateAsync(Guid id, UpdateVendorDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        var entity = await dbContext.Vendors.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        entity.Name = request.Name.Trim(); entity.AccountNumber = ValidationHelpers.NullIfWhitespace(request.AccountNumber); entity.ContactName = ValidationHelpers.NullIfWhitespace(request.ContactName); entity.Email = ValidationHelpers.NullIfWhitespace(request.Email); entity.Phone = ValidationHelpers.NullIfWhitespace(request.Phone);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new VendorDto(entity.Id, entity.Name, entity.AccountNumber, entity.ContactName, entity.Email, entity.Phone, entity.IsDeleted);
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Vendors.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Vendors.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = false;
        entity.DeletedAtUtc = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public sealed class PartCategoriesService(ApplicationDbContext dbContext) : IPartCategoriesService
{
    public async Task<IReadOnlyList<PartCategoryDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        var categories = query.IncludeArchived ? dbContext.PartCategories.IgnoreQueryFilters() : dbContext.PartCategories;
        return await categories.OrderBy(x => x.Name).Skip(query.NormalizedOffset).Take(query.NormalizedLimit)
            .Select(x => new PartCategoryDto(x.Id, x.Name, x.Description, x.IsDeleted))
            .ToListAsync(cancellationToken);
    }

    public Task<PartCategoryDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.PartCategories.Where(x => x.Id == id).Select(x => new PartCategoryDto(x.Id, x.Name, x.Description, x.IsDeleted)).SingleOrDefaultAsync(cancellationToken);

    public async Task<PartCategoryDto> CreateAsync(CreatePartCategoryDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        var entity = new PartCategory { Name = request.Name.Trim(), Description = ValidationHelpers.NullIfWhitespace(request.Description) };
        dbContext.PartCategories.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new PartCategoryDto(entity.Id, entity.Name, entity.Description, entity.IsDeleted);
    }

    public async Task<PartCategoryDto?> UpdateAsync(Guid id, UpdatePartCategoryDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.Name, nameof(request.Name));
        var entity = await dbContext.PartCategories.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        entity.Name = request.Name.Trim(); entity.Description = ValidationHelpers.NullIfWhitespace(request.Description);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new PartCategoryDto(entity.Id, entity.Name, entity.Description, entity.IsDeleted);
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PartCategories.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PartCategories.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = false;
        entity.DeletedAtUtc = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public sealed class PartsService(ApplicationDbContext dbContext) : IPartsService
{
    public async Task<IReadOnlyList<PartDto>> ListAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        var parts = query.IncludeArchived ? dbContext.Parts.IgnoreQueryFilters() : dbContext.Parts;
        return await parts.OrderBy(x => x.Name).Skip(query.NormalizedOffset).Take(query.NormalizedLimit)
            .Select(x => new PartDto(x.Id, x.PartCategoryId, x.VendorId, x.PartNumber, x.Name, x.Description, x.UnitCost, x.UnitPrice, x.QuantityOnHand, x.ReorderThreshold, x.IsDeleted))
            .ToListAsync(cancellationToken);
    }

    public Task<IReadOnlyList<PartLookupDto>> ListLookupAsync(PagedQuery query, CancellationToken cancellationToken = default) =>
        dbContext.Parts.OrderBy(x => x.Name).Skip(query.NormalizedOffset).Take(query.NormalizedLimit)
            .Select(x => new PartLookupDto(x.Id, x.PartNumber, x.Name, x.Description))
            .ToListAsync(cancellationToken).ContinueWith(t => (IReadOnlyList<PartLookupDto>)t.Result, cancellationToken);

    public Task<PartDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Parts.Where(x => x.Id == id)
            .Select(x => new PartDto(x.Id, x.PartCategoryId, x.VendorId, x.PartNumber, x.Name, x.Description, x.UnitCost, x.UnitPrice, x.QuantityOnHand, x.ReorderThreshold, x.IsDeleted))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<PartDto> CreateAsync(CreatePartDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidatePart(request.PartCategoryId, request.PartNumber, request.Name);
        await EnsureRelationsExist(request.PartCategoryId, request.VendorId, cancellationToken);

        var entity = new Part
        {
            PartCategoryId = request.PartCategoryId,
            VendorId = request.VendorId,
            PartNumber = request.PartNumber.Trim(),
            Name = request.Name.Trim(),
            Description = ValidationHelpers.NullIfWhitespace(request.Description),
            UnitCost = request.UnitCost,
            UnitPrice = request.UnitPrice,
            QuantityOnHand = request.QuantityOnHand,
            ReorderThreshold = request.ReorderThreshold
        };

        dbContext.Parts.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new PartDto(entity.Id, entity.PartCategoryId, entity.VendorId, entity.PartNumber, entity.Name, entity.Description, entity.UnitCost, entity.UnitPrice, entity.QuantityOnHand, entity.ReorderThreshold, entity.IsDeleted);
    }

    public async Task<PartDto?> UpdateAsync(Guid id, UpdatePartDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidatePart(request.PartCategoryId, request.PartNumber, request.Name);
        await EnsureRelationsExist(request.PartCategoryId, request.VendorId, cancellationToken);

        var entity = await dbContext.Parts.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;

        entity.PartCategoryId = request.PartCategoryId;
        entity.VendorId = request.VendorId;
        entity.PartNumber = request.PartNumber.Trim();
        entity.Name = request.Name.Trim();
        entity.Description = ValidationHelpers.NullIfWhitespace(request.Description);
        entity.UnitCost = request.UnitCost;
        entity.UnitPrice = request.UnitPrice;
        entity.QuantityOnHand = request.QuantityOnHand;
        entity.ReorderThreshold = request.ReorderThreshold;

        await dbContext.SaveChangesAsync(cancellationToken);
        return new PartDto(entity.Id, entity.PartCategoryId, entity.VendorId, entity.PartNumber, entity.Name, entity.Description, entity.UnitCost, entity.UnitPrice, entity.QuantityOnHand, entity.ReorderThreshold, entity.IsDeleted);
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Parts.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Parts.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        await EnsureRelationsExist(entity.PartCategoryId, entity.VendorId, cancellationToken);
        entity.IsDeleted = false;
        entity.DeletedAtUtc = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task EnsureRelationsExist(Guid partCategoryId, Guid? vendorId, CancellationToken cancellationToken)
    {
        if (!await dbContext.PartCategories.AnyAsync(x => x.Id == partCategoryId, cancellationToken)) throw new ValidationException("PartCategoryId does not reference an active part category.");
        if (vendorId.HasValue && !await dbContext.Vendors.AnyAsync(x => x.Id == vendorId, cancellationToken)) throw new ValidationException("VendorId does not reference an active vendor.");
    }
}

public sealed record CustomerDto(Guid Id, string Name, string? AccountNumber, string? ContactName, string? Email, string? Phone, bool IsArchived);
public sealed record CreateCustomerDto(string Name, string? AccountNumber, string? ContactName, string? Email, string? Phone);
public sealed record UpdateCustomerDto(string Name, string? AccountNumber, string? ContactName, string? Email, string? Phone);

public sealed record ServiceLocationDto(Guid Id, Guid? CustomerId, string CompanyName, string LocationName, string AddressLine1, string City, string State, string PostalCode, string Country, bool IsActive, bool IsArchived);
public sealed record CreateServiceLocationDto(Guid? CustomerId, string CompanyName, string LocationName, string AddressLine1, string City, string State, string PostalCode, string Country, bool IsActive = true);
public sealed record UpdateServiceLocationDto(Guid? CustomerId, string CompanyName, string LocationName, string AddressLine1, string City, string State, string PostalCode, string Country, bool IsActive = true);

public sealed record EquipmentDto(Guid Id, Guid CustomerId, Guid ServiceLocationId, Guid? OwnerCustomerId, Guid? ResponsibleBillingCustomerId, string Name, string? EquipmentNumber, string? UnitNumber, string? Manufacturer, string? ModelNumber, string? SerialNumber, string? EquipmentType, int? Year, bool IsArchived);
public sealed record CreateEquipmentDto(Guid CustomerId, Guid ServiceLocationId, Guid? OwnerCustomerId, Guid? ResponsibleBillingCustomerId, string Name, string? EquipmentNumber, string? UnitNumber = null, string? Manufacturer = null, string? ModelNumber = null, string? SerialNumber = null, string? EquipmentType = null, int? Year = null);
public sealed record UpdateEquipmentDto(Guid CustomerId, Guid ServiceLocationId, Guid? OwnerCustomerId, Guid? ResponsibleBillingCustomerId, string Name, string? EquipmentNumber, string? UnitNumber = null, string? Manufacturer = null, string? ModelNumber = null, string? SerialNumber = null, string? EquipmentType = null, int? Year = null);

public sealed record VendorDto(Guid Id, string Name, string? AccountNumber, string? ContactName, string? Email, string? Phone, bool IsArchived);
public sealed record CreateVendorDto(string Name, string? AccountNumber, string? ContactName, string? Email, string? Phone);
public sealed record UpdateVendorDto(string Name, string? AccountNumber, string? ContactName, string? Email, string? Phone);

public sealed record PartCategoryDto(Guid Id, string Name, string? Description, bool IsArchived);
public sealed record CreatePartCategoryDto(string Name, string? Description);
public sealed record UpdatePartCategoryDto(string Name, string? Description);

public sealed record PartDto(Guid Id, Guid PartCategoryId, Guid? VendorId, string PartNumber, string Name, string? Description, decimal UnitCost, decimal UnitPrice, decimal QuantityOnHand, decimal ReorderThreshold, bool IsArchived);
public sealed record PartLookupDto(Guid Id, string PartNumber, string Name, string? Description);
public sealed record CreatePartDto(Guid PartCategoryId, Guid? VendorId, string PartNumber, string Name, string? Description, decimal UnitCost, decimal UnitPrice, decimal QuantityOnHand, decimal ReorderThreshold);
public sealed record UpdatePartDto(Guid PartCategoryId, Guid? VendorId, string PartNumber, string Name, string? Description, decimal UnitCost, decimal UnitPrice, decimal QuantityOnHand, decimal ReorderThreshold);

internal static class ValidationHelpers
{
    internal static string? NullIfWhitespace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    internal static void ValidateRequired(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new ValidationException($"{fieldName} is required.");
    }

    internal static void ValidateServiceLocation(string companyName, string locationName, string addressLine1, string city, string state, string postalCode, string country)
    {
        ValidateRequired(companyName, nameof(companyName));
        ValidateRequired(locationName, nameof(locationName));
        ValidateRequired(addressLine1, nameof(addressLine1));
        ValidateRequired(city, nameof(city));
        ValidateRequired(state, nameof(state));
        ValidateRequired(postalCode, nameof(postalCode));
        ValidateRequired(country, nameof(country));
    }

    internal static void ValidatePart(Guid partCategoryId, string partNumber, string name)
    {
        if (partCategoryId == Guid.Empty) throw new ValidationException("PartCategoryId is required.");
        ValidateRequired(partNumber, nameof(partNumber));
        ValidateRequired(name, nameof(name));
    }
}
