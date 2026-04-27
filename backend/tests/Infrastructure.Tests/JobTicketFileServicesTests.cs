using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using JobTicketSystem.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class JobTicketFileServicesTests
{
    [Fact]
    public async Task Upload_valid_image_file_succeeds()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var storage = CreateStorageProvider();
        var service = new JobTicketFilesService(context, storage);

        await using var stream = new MemoryStream([1, 2, 3, 4]);
        var result = await service.UploadAsync(refs.JobTicket.Id, new UploadJobTicketFileDto(
            "photo.jpg",
            "image/jpeg",
            stream.Length,
            stream,
            "Before repair",
            FileVisibility.Customer,
            false,
            refs.Employee.Id,
            refs.Equipment.Id,
            refs.WorkEntry.Id));

        Assert.Equal("photo.jpg", result.OriginalFileName);
        Assert.Equal(".jpg", result.FileExtension);
        Assert.StartsWith("job-tickets/", result.StorageKey);
        Assert.Single(context.JobTicketFiles);
    }

    [Fact]
    public async Task Upload_rejects_missing_job_ticket()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketFilesService(context, CreateStorageProvider());

        await using var stream = new MemoryStream([1]);
        await Assert.ThrowsAsync<ValidationException>(() => service.UploadAsync(Guid.NewGuid(), new UploadJobTicketFileDto(
            "photo.jpg", "image/jpeg", stream.Length, stream, null, FileVisibility.Internal, false, refs.Employee.Id, null, null)));
    }

    [Fact]
    public async Task Upload_rejects_empty_file()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketFilesService(context, CreateStorageProvider());

        await using var stream = new MemoryStream();
        await Assert.ThrowsAsync<ValidationException>(() => service.UploadAsync(refs.JobTicket.Id, new UploadJobTicketFileDto(
            "photo.jpg", "image/jpeg", 0, stream, null, FileVisibility.Internal, false, null, null, null)));
    }

    [Fact]
    public async Task Upload_rejects_unsupported_content_type()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketFilesService(context, CreateStorageProvider());

        await using var stream = new MemoryStream([1]);
        await Assert.ThrowsAsync<ValidationException>(() => service.UploadAsync(refs.JobTicket.Id, new UploadJobTicketFileDto(
            "photo.bmp", "image/bmp", stream.Length, stream, null, FileVisibility.Internal, false, null, null, null)));
    }

    [Fact]
    public async Task List_excludes_archived_files()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketFilesService(context, CreateStorageProvider());

        var first = await UploadSimpleAsync(service, refs.JobTicket.Id, "one.jpg");
        await UploadSimpleAsync(service, refs.JobTicket.Id, "two.jpg");

        await service.ArchiveAsync(refs.JobTicket.Id, first.Id, new ArchiveJobTicketFileDto(refs.Employee.Id));
        var listed = await service.ListAsync(refs.JobTicket.Id);

        Assert.Single(listed);
        Assert.Equal("two.jpg", listed.Single().OriginalFileName);
    }

    [Fact]
    public async Task Update_changes_caption_visibility_and_invoice_flag()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketFilesService(context, CreateStorageProvider());

        var created = await UploadSimpleAsync(service, refs.JobTicket.Id, "update.jpg");
        var updated = await service.UpdateAsync(refs.JobTicket.Id, created.Id, new UpdateJobTicketFileDto("Updated", FileVisibility.Customer, true));

        Assert.NotNull(updated);
        Assert.Equal("Updated", updated!.Caption);
        Assert.Equal(FileVisibility.Customer, updated.Visibility);
        Assert.True(updated.IsInvoiceAttachment);
    }

    [Fact]
    public async Task Archive_marks_file_deleted()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketFilesService(context, CreateStorageProvider());

        var created = await UploadSimpleAsync(service, refs.JobTicket.Id, "archive.jpg");
        await service.ArchiveAsync(refs.JobTicket.Id, created.Id, new ArchiveJobTicketFileDto(refs.Employee.Id));

        var file = await context.JobTicketFiles.IgnoreQueryFilters().SingleAsync(x => x.Id == created.Id);
        Assert.True(file.IsDeleted);
        Assert.NotNull(file.DeletedAtUtc);
    }

    [Fact]
    public async Task Upload_update_archive_create_audit_logs()
    {
        await using var context = CreateContext();
        var refs = await SeedReferencesAsync(context);
        var service = new JobTicketFilesService(context, CreateStorageProvider());

        var created = await UploadSimpleAsync(service, refs.JobTicket.Id, "audit.jpg");
        await service.UpdateAsync(refs.JobTicket.Id, created.Id, new UpdateJobTicketFileDto("Audit", FileVisibility.Internal, false));
        await service.ArchiveAsync(refs.JobTicket.Id, created.Id, new ArchiveJobTicketFileDto(refs.Employee.Id));

        var audits = await context.AuditLogs.Where(x => x.EntityName == nameof(JobTicketFile) && x.EntityId == created.Id).ToListAsync();
        Assert.Contains(audits, x => x.ActionType == AuditActionType.Create);
        Assert.Contains(audits, x => x.ActionType == AuditActionType.Update);
        Assert.Contains(audits, x => x.ActionType == AuditActionType.Delete);
    }

    [Fact]
    public void Local_storage_provider_generates_safe_unique_storage_key()
    {
        var provider = CreateStorageProvider();

        var keyOne = provider.GenerateStorageKey(Guid.NewGuid(), "unsafe ../photo (1).jpg", ".jpg");
        var keyTwo = provider.GenerateStorageKey(Guid.NewGuid(), "unsafe ../photo (1).jpg", ".jpg");

        Assert.NotEqual(keyOne, keyTwo);
        Assert.DoesNotContain("..", keyOne);
        Assert.DoesNotContain("\\", keyOne);
        Assert.Contains(".jpg", keyOne);
    }

    private static async Task<JobTicketFileDto> UploadSimpleAsync(JobTicketFilesService service, Guid jobTicketId, string fileName)
    {
        await using var stream = new MemoryStream([1, 2, 3]);
        return await service.UploadAsync(jobTicketId, new UploadJobTicketFileDto(
            fileName,
            "image/jpeg",
            stream.Length,
            stream,
            null,
            FileVisibility.Internal,
            false,
            null,
            null,
            null));
    }

    private static LocalFileStorageProvider CreateStorageProvider()
    {
        var root = Path.Combine(Path.GetTempPath(), "job-ticket-tests", Guid.NewGuid().ToString("N"));
        return new LocalFileStorageProvider(new LocalFileStorageOptions(root));
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static async Task<SeedRefs> SeedReferencesAsync(ApplicationDbContext context)
    {
        var customer = new Customer { Name = "Customer" };
        var location = new ServiceLocation
        {
            Customer = customer,
            CompanyName = "Customer",
            LocationName = "HQ",
            AddressLine1 = "123 Main",
            City = "Austin",
            State = "TX",
            PostalCode = "78701",
            Country = "USA"
        };
        var employee = new Employee { FirstName = "Tech", LastName = "One", Email = "tech1@example.com" };

        context.AddRange(customer, location, employee);
        await context.SaveChangesAsync();

        var equipment = new Equipment
        {
            CustomerId = customer.Id,
            ServiceLocationId = location.Id,
            Name = "Generator"
        };

        var ticket = new JobTicket
        {
            TicketNumber = "JT-TEST-0001",
            CustomerId = customer.Id,
            ServiceLocationId = location.Id,
            BillingPartyCustomerId = customer.Id,
            Equipment = equipment,
            Title = "Repair",
            Status = JobTicketStatus.Assigned
        };

        var workEntry = new JobWorkEntry
        {
            JobTicket = ticket,
            Employee = employee,
            EntryType = WorkEntryType.Note,
            Notes = "Initial",
            PerformedAtUtc = DateTime.UtcNow
        };

        context.AddRange(equipment, ticket, workEntry);
        await context.SaveChangesAsync();

        return new SeedRefs(ticket, equipment, employee, workEntry);
    }

    private sealed record SeedRefs(JobTicket JobTicket, Equipment Equipment, Employee Employee, JobWorkEntry WorkEntry);
}
