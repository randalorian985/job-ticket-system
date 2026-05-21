using JobTicketSystem.Api.Controllers;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PurchaseOrdersControllerTests
{
    [Fact]
    public async Task Unarchive_returns_bad_request_when_validation_fails()
    {
        var controller = new PurchaseOrdersController(new ValidationFailurePurchaseOrdersService());

        var result = await controller.UnarchiveAsync(Guid.NewGuid());

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
        Assert.Contains("PurchaseOrderNumber must be unique.", badRequest.Value.ToString());
    }

    [Fact]
    public async Task Unarchive_preserves_non_validation_failures()
    {
        var controller = new PurchaseOrdersController(new NonValidationFailurePurchaseOrdersService());

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => controller.UnarchiveAsync(Guid.NewGuid()));

        Assert.Equal("database offline", exception.Message);
    }

    private sealed class ValidationFailurePurchaseOrdersService : IPurchaseOrdersService
    {
        public Task<IReadOnlyList<PurchaseOrderListItemDto>> ListAsync(bool includeArchived = false, Guid? vendorId = null, PurchaseOrderStatus? status = null, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<PurchaseOrderListItemDto>>(Array.Empty<PurchaseOrderListItemDto>());

        public Task<PurchaseOrderDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto request, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto>(null!);

        public Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto request, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<PurchaseOrderDto?> SubmitAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<PurchaseOrderDto?> ReceiveAsync(Guid id, ReceivePurchaseOrderDto request, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<PurchaseOrderDto?> CancelAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(false);

        public Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromException<bool>(new ValidationException("PurchaseOrderNumber must be unique."));
    }

    private sealed class NonValidationFailurePurchaseOrdersService : IPurchaseOrdersService
    {
        public Task<IReadOnlyList<PurchaseOrderListItemDto>> ListAsync(bool includeArchived = false, Guid? vendorId = null, PurchaseOrderStatus? status = null, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<PurchaseOrderListItemDto>>(Array.Empty<PurchaseOrderListItemDto>());

        public Task<PurchaseOrderDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto request, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto>(null!);

        public Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto request, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<PurchaseOrderDto?> SubmitAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<PurchaseOrderDto?> ReceiveAsync(Guid id, ReceivePurchaseOrderDto request, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<PurchaseOrderDto?> CancelAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<PurchaseOrderDto?>(null);

        public Task<bool> ArchiveAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(false);

        public Task<bool> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromException<bool>(new InvalidOperationException("database offline"));
    }
}
