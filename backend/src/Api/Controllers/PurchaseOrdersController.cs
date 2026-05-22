using System.Runtime.ExceptionServices;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Authorize(Policy = "ManagerOrAdmin")]
[Route("api/purchase-orders")]
public sealed class PurchaseOrdersController(IPurchaseOrdersService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PurchaseOrderListItemDto>>> ListAsync(
        [FromQuery] bool includeArchived = false,
        [FromQuery] Guid? vendorId = null,
        [FromQuery] PurchaseOrderStatus? status = null,
        CancellationToken cancellationToken = default)
        => Ok(await service.ListAsync(includeArchived, vendorId, status, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PurchaseOrderDto>> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var purchaseOrder = await service.GetAsync(id, cancellationToken);
        return purchaseOrder is null ? NotFound() : Ok(purchaseOrder);
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseOrderDto>> CreateAsync([FromBody] CreatePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await service.CreateAsync(request, cancellationToken);
            return Created($"{Request.Path}/{created.Id}", created);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PurchaseOrderDto>> UpdateAsync(Guid id, [FromBody] UpdatePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.UpdateAsync(id, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<ActionResult<PurchaseOrderDto>> SubmitAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.SubmitAsync(id, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/receive")]
    public async Task<ActionResult<PurchaseOrderDto>> ReceiveAsync(Guid id, [FromBody] ReceivePurchaseOrderDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.ReceiveAsync(id, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<PurchaseOrderDto>> CancelAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.CancelAsync(id, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/close")]
    public async Task<ActionResult<PurchaseOrderDto>> CloseAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.CloseAsync(id, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<ActionResult> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
        => await service.ArchiveAsync(id, cancellationToken) ? NoContent() : NotFound();

    [HttpPost("{id:guid}/unarchive")]
    public async Task<ActionResult> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            return await service.UnarchiveAsync(id, cancellationToken) ? NoContent() : NotFound();
        }
        catch (ValidationException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }

    private ActionResult HandleValidation(Exception exception)
    {
        if (exception is ValidationException)
        {
            return BadRequest(new { error = exception.Message });
        }

        ExceptionDispatchInfo.Capture(exception).Throw();
        return StatusCode(500);
    }
}
