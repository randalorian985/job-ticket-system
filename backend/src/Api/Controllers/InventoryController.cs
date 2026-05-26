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
    [HttpGet]
    public Task<IReadOnlyList<InventoryListItemDto>> ListAsync(CancellationToken cancellationToken = default) => service.ListAsync(cancellationToken);

    [HttpGet("{partId:guid}/locations/{locationId:guid}")]
    public async Task<ActionResult<InventoryDetailDto>> GetAsync(Guid partId, Guid locationId, CancellationToken cancellationToken = default)
    {
        var result = await service.GetAsync(partId, locationId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("locations")]
    public Task<IReadOnlyList<InventoryLocationDto>> ListLocationsAsync([FromQuery] bool includeArchived = false, CancellationToken cancellationToken = default) => service.ListLocationsAsync(includeArchived, cancellationToken);

    [HttpPost("locations")]
    public async Task<ActionResult<InventoryLocationDto>> CreateLocationAsync([FromBody] CreateInventoryLocationDto request, CancellationToken cancellationToken = default)
    {
        try { return Ok(await service.CreateLocationAsync(request, cancellationToken)); }
        catch (ValidationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("adjustments")]
    public async Task<ActionResult<InventoryTransactionDto>> CreateAdjustmentAsync([FromBody] CreateManualInventoryAdjustmentDto request, CancellationToken cancellationToken = default)
    {
        try { return Ok(await service.CreateManualAdjustmentAsync(request, cancellationToken)); }
        catch (ValidationException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
