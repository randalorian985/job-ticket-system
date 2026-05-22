using JobTicketSystem.Api.Controllers;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PurchaseOrdersControllerTests
{
    private const string ValidationMessage = "PurchaseOrderNumber must be unique.";

    [Fact]
    public async Task Create_returns_bad_request_when_validation_fails()
    {
        var controller = CreateController(service =>
            service.CreateAsyncHandler = (_, _) => Task.FromException<PurchaseOrderDto>(new ValidationException(ValidationMessage)));

        var result = await controller.CreateAsync(CreateRequest());

        AssertBadRequest(result);
    }

    [Fact]
    public async Task Update_returns_bad_request_when_validation_fails()
    {
        var controller = CreateController(service =>
            service.UpdateAsyncHandler = (_, _, _) => Task.FromException<PurchaseOrderDto?>(new ValidationException(ValidationMessage)));

        var result = await controller.UpdateAsync(Guid.NewGuid(), UpdateRequest());

        AssertBadRequest(result);
    }

    [Fact]
    public async Task Submit_returns_bad_request_when_validation_fails()
    {
        var controller = CreateController(service =>
            service.SubmitAsyncHandler = (_, _) => Task.FromException<PurchaseOrderDto?>(new ValidationException(ValidationMessage)));

        var result = await controller.SubmitAsync(Guid.NewGuid());

        AssertBadRequest(result);
    }

    [Fact]
    public async Task Receive_returns_bad_request_when_validation_fails()
    {
        var controller = CreateController(service =>
            service.ReceiveAsyncHandler = (_, _, _) => Task.FromException<PurchaseOrderDto?>(new ValidationException(ValidationMessage)));

        var result = await controller.ReceiveAsync(Guid.NewGuid(), ReceiveRequest());

        AssertBadRequest(result);
    }

    [Fact]
    public async Task Cancel_returns_bad_request_when_validation_fails()
    {
        var controller = CreateController(service =>
            service.CancelAsyncHandler = (_, _) => Task.FromException<PurchaseOrderDto?>(new ValidationException(ValidationMessage)));

        var result = await controller.CancelAsync(Guid.NewGuid());

        AssertBadRequest(result);
    }

    [Fact]
    public async Task Close_returns_bad_request_when_validation_fails()
    {
        var controller = CreateController(service =>
            service.CloseAsyncHandler = (_, _) => Task.FromException<PurchaseOrderDto?>(new ValidationException(ValidationMessage)));

        var result = await controller.CloseAsync(Guid.NewGuid());

        AssertBadRequest(result);
    }

    [Fact]
    public async Task Close_preserves_non_validation_failures()
    {
        var controller = CreateController(service =>
            service.CloseAsyncHandler = (_, _) => Task.FromException<PurchaseOrderDto?>(new InvalidOperationException("database offline")));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => controller.CloseAsync(Guid.NewGuid()));

        Assert.Equal("database offline", exception.Message);
    }

    [Fact]
    public async Task Submit_preserves_non_validation_failures()
    {
        var controller = CreateController(service =>
            service.SubmitAsyncHandler = (_, _) => Task.FromException<PurchaseOrderDto?>(new InvalidOperationException("database offline")));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => controller.SubmitAsync(Guid.NewGuid()));

        Assert.Equal("database offline", exception.Message);
    }

    [Fact]
    public async Task Unarchive_returns_bad_request_when_validation_fails()
    {
        var controller = CreateController(service =>
            service.UnarchiveAsyncHandler = (_, _) => Task.FromException<bool>(new ValidationException(ValidationMessage)));

        var result = await controller.UnarchiveAsync(Guid.NewGuid());

        AssertBadRequest(result);
    }

    [Fact]
    public async Task Unarchive_preserves_non_validation_failures()
    {
        var controller = CreateController(service =>
            service.UnarchiveAsyncHandler = (_, _) => Task.FromException<bool>(new InvalidOperationException("database offline")));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => controller.UnarchiveAsync(Guid.NewGuid()));

        Assert.Equal("database offline", exception.Message);
    }

    private static PurchaseOrdersController CreateController(Action<ConfigurablePurchaseOrdersService> configure)
    {
        var service = new ConfigurablePurchaseOrdersService();
        configure(service);
        return new PurchaseOrdersController(service);
    }

    private static CreatePurchaseOrderDto CreateRequest() =>
        new(Guid.NewGuid(), "PO-TEST", null, null, null, [new PurchaseOrderLineRequestDto(Guid.NewGuid(), 1m, 2m)]);

    private static UpdatePurchaseOrderDto UpdateRequest() =>
        new(
            "PO-TEST",
            null,
            null,
            null,
            VendorInvoiceStatus.Pending,
            0m,
            0m,
            0m,
            null,
            null,
            [new PurchaseOrderLineRequestDto(Guid.NewGuid(), 1m, 2m)]);

    private static ReceivePurchaseOrderDto ReceiveRequest() =>
        new(null, [new ReceivePurchaseOrderLineDto(Guid.NewGuid(), 1m)]);

    private static void AssertBadRequest<T>(ActionResult<T> result)
    {
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequest.Value);
        Assert.Contains(ValidationMessage, badRequest.Value.ToString());
    }

    private static void AssertBadRequest(ActionResult result)
    {
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
        Assert.Contains(ValidationMessage, badRequest.Value.ToString());
    }

    private sealed class ConfigurablePurchaseOrdersService : IPurchaseOrdersService
    {
        public Func<CreatePurchaseOrderDto, CancellationToken, Task<PurchaseOrderDto>> CreateAsyncHandler { get; set; } =
            (_, _) => Task.FromResult<PurchaseOrderDto>(null!);

        public Func<Guid, UpdatePurchaseOrderDto, CancellationToken, Task<PurchaseOrderDto?>> UpdateAsyncHandler { get; set; } =
            (_, _, _) => Task.FromResult<PurchaseOrderDto?>(null);

        public Func<Guid, CancellationToken, Task<PurchaseOrderDto?>> SubmitAsyncHandler { get; set; } =
            (_, _) => Task.FromResult<PurchaseOrderDto?>(null);

        public Func<Guid, ReceivePurchaseOrderDto, CancellationToken, Task<PurchaseOrderDto?>> ReceiveAsyncHandler { get; set; } =
            (_, _, _) => Task.FromResult<PurchaseOrderDto?>(null);

        public Func<Guid, CancellationToken, Task<PurchaseOrderDto?>> CancelAsyncHandler { get; set; } =
            (_, _) => Task.FromResult<PurchaseOrderDto?>(null);

        public Func<Guid, CancellationToken, Task<PurchaseOrderDto?>> CloseAsyncHandler { get; set; } =
            (_, _) => Task.FromResult<PurchaseOrderDto?>(null);

        public Func<Guid, CancellationToken, Task<bool>> UnarchiveAsyncHandler { get; set; } =
            (_, _) => Task.FromResult(false);

        public Task<IReadOnlyList<PurchaseOrderListItemDto>> ListAsync(bool includeArchived = false, Guid? vendorId = null, PurchaseOrderStatus? status = null, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<PurchaseOrderListItemDto>>(Array.Empty<PurchaseOrderListItemDto>());

        public Task<PurchaseOrderDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto request, CancellationToken cancellationToken = default) =>
            CreateAsyncHandler(request, cancellationToken);

        public Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto request, CancellationToken cancellationToken = default) =>
            UpdateAsyncHandler(id, request, cancellationToken);

        public Task<PurchaseOrderDto?> SubmitAsync(Guid id, CancellationToken cancellationToken = default) =>
            SubmitAsyncHandler(id, cancellationToken);

        public Task<PurchaseOrderDto?> ReceiveAsync(Guid id, ReceivePurchaseOrderDto request, CancellationToken cancellationToken = default) =>
            ReceiveAsyncHandler(id, request, cancellationToken);

        public Task<PurchaseOrderDto?> CancelAsync(Guid id, CancellationToken cancellationToken = default) =>
            CancelAsyncHandler(id, cancellationToken);

        public Task<PurchaseOrderDto?> CloseAsync(Guid id, CancellationToken cancellationToken = default) =>
            CloseAsyncHandler(id, cancellationToken);

        public Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(false);

        public Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default) =>
            UnarchiveAsyncHandler(id, cancellationToken);
    }
}
