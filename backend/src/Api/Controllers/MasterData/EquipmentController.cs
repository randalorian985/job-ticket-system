using JobTicketSystem.Application.MasterData;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers.MasterData;

[Route("api/equipment")]
public sealed class EquipmentController(IEquipmentService service) : MasterDataControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EquipmentDto>>> ListAsync([FromQuery] int offset = 0, [FromQuery] int limit = 50, [FromQuery] bool includeArchived = false, CancellationToken cancellationToken = default)
        => Ok(await service.ListAsync(new PagedQuery(offset, limit, includeArchived), cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EquipmentDto>> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await service.GetAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<EquipmentDto>> CreateAsync([FromBody] CreateEquipmentDto request, CancellationToken cancellationToken = default)
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
    public async Task<ActionResult<EquipmentDto>> UpdateAsync(Guid id, [FromBody] UpdateEquipmentDto request, CancellationToken cancellationToken = default)
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

    [HttpPost("{id:guid}/archive")]
    public async Task<ActionResult> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
        => await service.ArchiveAsync(id, cancellationToken) ? NoContent() : NotFound();

    [HttpPost("{id:guid}/unarchive")]
    public async Task<ActionResult> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
        => await service.UnarchiveAsync(id, cancellationToken) ? NoContent() : NotFound();
}
