using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Purchasing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers.Purchasing;

[ApiController]
[Route("api/purchase-orders")]
[Authorize(Policy = "ManagerOrAdmin")]
public sealed class PurchaseOrdersController(IPurchaseOrdersService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PurchaseOrderListItemDto>>> ListAsync(
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        [FromQuery] bool includeArchived = false,
        CancellationToken cancellationToken = default)
        => Ok(await service.ListAsync(new PagedQuery(offset, limit, includeArchived), cancellationToken));

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
            return CreatedAtAction(nameof(GetAsync), new { id = created.Id }, created);
        }
        catch (Exception exception) when (exception is ValidationException)
        {
            return BadRequest(new { error = exception.Message });
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
        catch (Exception exception) when (exception is ValidationException)
        {
            return BadRequest(new { error = exception.Message });
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
        catch (Exception exception) when (exception is ValidationException)
        {
            return BadRequest(new { error = exception.Message });
        }
    }

    [HttpPost("{id:guid}/vendor-invoice")]
    public async Task<ActionResult<PurchaseOrderDto>> RecordVendorInvoiceAsync(Guid id, [FromBody] RecordVendorInvoiceDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.RecordVendorInvoiceAsync(id, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception) when (exception is ValidationException)
        {
            return BadRequest(new { error = exception.Message });
        }
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<ActionResult<PurchaseOrderDto>> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var archived = await service.ArchiveAsync(id, cancellationToken);
        return archived is null ? NotFound() : Ok(archived);
    }
}
