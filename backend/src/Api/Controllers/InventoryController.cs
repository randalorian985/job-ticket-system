using JobTicketSystem.Application.Inventory;
using JobTicketSystem.Application.MasterData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Authorize(Policy = "ManagerOrAdmin")]
[Route("api/inventory")]
public sealed class InventoryController(IInventoryService service) : ControllerBase
{
    [HttpGet("stock-locations")]
    public async Task<ActionResult<IReadOnlyList<StockLocationDto>>> ListStockLocationsAsync(
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        [FromQuery] bool includeArchived = false,
        CancellationToken cancellationToken = default)
        => Ok(await service.ListStockLocationsAsync(new PagedQuery(offset, limit, includeArchived), cancellationToken));

    [HttpGet("stock-locations/{id:guid}")]
    public async Task<ActionResult<StockLocationDto>> GetStockLocationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var location = await service.GetStockLocationAsync(id, cancellationToken);
        return location is null ? NotFound() : Ok(location);
    }

    [HttpPost("stock-locations")]
    public async Task<ActionResult<StockLocationDto>> CreateStockLocationAsync([FromBody] CreateStockLocationDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await service.CreateStockLocationAsync(request, cancellationToken);
            return Created($"{Request.Path}/{created.Id}", created);
        }
        catch (ValidationException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }

    [HttpPut("stock-locations/{id:guid}")]
    public async Task<ActionResult<StockLocationDto>> UpdateStockLocationAsync(Guid id, [FromBody] UpdateStockLocationDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.UpdateStockLocationAsync(id, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (ValidationException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }

    [HttpPost("stock-locations/{id:guid}/archive")]
    public async Task<ActionResult> ArchiveStockLocationAsync(Guid id, CancellationToken cancellationToken = default)
        => await service.ArchiveStockLocationAsync(id, cancellationToken) ? NoContent() : NotFound();

    [HttpPost("stock-locations/{id:guid}/unarchive")]
    public async Task<ActionResult> UnarchiveStockLocationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            return await service.UnarchiveStockLocationAsync(id, cancellationToken) ? NoContent() : NotFound();
        }
        catch (ValidationException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }

    [HttpGet("stock")]
    public async Task<ActionResult<IReadOnlyList<InventoryStockSummaryDto>>> ListStockSummaryAsync(
        [FromQuery] Guid? stockLocationId = null,
        [FromQuery] Guid? partId = null,
        CancellationToken cancellationToken = default)
        => Ok(await service.ListStockSummaryAsync(stockLocationId, partId, cancellationToken));

    [HttpGet("transactions")]
    public async Task<ActionResult<IReadOnlyList<InventoryTransactionDto>>> ListTransactionsAsync(
        [FromQuery] Guid? stockLocationId = null,
        [FromQuery] Guid? partId = null,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
        => Ok(await service.ListTransactionsAsync(stockLocationId, partId, limit, cancellationToken));

    [HttpPost("adjustments")]
    public async Task<ActionResult<InventoryTransactionDto>> CreateManualAdjustmentAsync([FromBody] CreateManualInventoryAdjustmentDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await service.CreateManualAdjustmentAsync(request, cancellationToken);
            return Created($"{Request.Path}/{created.Id}", created);
        }
        catch (ValidationException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }
}
