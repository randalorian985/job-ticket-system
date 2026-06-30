using JobTicketSystem.Application.CompanyConfiguration;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using JobTicketSystem.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class CompanyConfigurationServiceTests
{
    [Fact]
    public async Task Get_returns_default_branding_without_creating_row()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.GetAsync();

        Assert.Equal(CompanyConfigurationDefaults.CompanyName, result.CompanyName);
        Assert.Equal(CompanyConfigurationDefaults.PrimaryColor, result.PrimaryColor);
        Assert.Equal(CompanyConfigurationDefaults.SecondaryColor, result.SecondaryColor);
        Assert.Equal(CompanyConfigurationDefaults.AccentColor, result.AccentColor);
        Assert.False(result.HasLogo);
        Assert.Empty(context.CompanyConfigurations);
    }

    [Fact]
    public async Task Update_saves_company_profile_and_normalized_colors()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();

        var result = await service.UpdateAsync(CreateUpdateRequest() with
        {
            CompanyName = "Bayou Crane Service",
            PrimaryColor = "#123abc",
            SecondaryColor = "#222222",
            AccentColor = "#00aa55"
        }, userId);

        Assert.Equal("Bayou Crane Service", result.CompanyName);
        Assert.Equal("#123ABC", result.PrimaryColor);
        Assert.Equal("#222222", result.SecondaryColor);
        Assert.Equal("#00AA55", result.AccentColor);
        Assert.Single(context.CompanyConfigurations);
        Assert.Contains(context.AuditLogs, audit =>
            audit.EntityName == nameof(CompanyConfiguration)
            && audit.UserId == userId
            && audit.ActionType == AuditActionType.Update);
    }

    [Fact]
    public async Task Update_rejects_invalid_hex_color()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            service.UpdateAsync(CreateUpdateRequest() with { PrimaryColor = "blue" }, Guid.NewGuid()));

        Assert.Equal("PrimaryColor must be a 6-digit hex color such as #3157C8.", exception.Message);
        Assert.Empty(context.CompanyConfigurations);
    }

    [Fact]
    public async Task Upload_logo_saves_image_metadata_and_download_stream()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var bytes = CreatePngBytes();
        var userId = Guid.NewGuid();

        await using var stream = new MemoryStream(bytes);
        var result = await service.UploadLogoAsync(
            new UploadCompanyLogoDto("crane-logo.png", "image/png", stream.Length, stream),
            userId);

        var entity = await context.CompanyConfigurations.SingleAsync();
        Assert.True(result.HasLogo);
        Assert.Equal("crane-logo.png", result.LogoOriginalFileName);
        Assert.Equal("image/png", result.LogoContentType);
        Assert.StartsWith("company-configuration/", entity.LogoStorageKey);
        Assert.Equal(userId, entity.UpdatedByUserId);

        var download = await service.GetLogoAsync();
        Assert.NotNull(download);
        await using var downloadStream = download!.ContentStream;
        using var memory = new MemoryStream();
        await downloadStream.CopyToAsync(memory);
        Assert.Equal(bytes, memory.ToArray());
    }

    [Fact]
    public async Task Upload_logo_rejects_content_that_does_not_match_declared_type()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await using var stream = new MemoryStream([1, 2, 3, 4]);
        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            service.UploadLogoAsync(new UploadCompanyLogoDto("logo.png", "image/png", stream.Length, stream), Guid.NewGuid()));

        Assert.Equal("Logo content does not match the declared content type.", exception.Message);
        Assert.Empty(context.CompanyConfigurations);
    }

    private static CompanyConfigurationService CreateService(ApplicationDbContext context)
    {
        var root = Path.Combine(Path.GetTempPath(), "job-ticket-customer-config-tests", Guid.NewGuid().ToString("N"));
        var storage = new LocalFileStorageProvider(new LocalFileStorageOptions(root));
        return new CompanyConfigurationService(context, storage);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static UpdateCompanyConfigurationDto CreateUpdateRequest() => new(
        "Crane Company",
        "Crane Company LLC",
        "Dispatch",
        "dispatch@example.com",
        "parts-orders@example.com",
        "555-0100",
        "https://example.com",
        "100 Lift Way",
        null,
        "Lafayette",
        "LA",
        "70501",
        "USA",
        "#3157C8",
        "#172033",
        "#087F5B");

    private static byte[] CreatePngBytes() =>
    [
        0x89, 0x50, 0x4E, 0x47,
        0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D
    ];
}
