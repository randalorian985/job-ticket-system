using JobTicketSystem.Application.MasterData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers.MasterData;

[Route("api/parts")]
public sealed class PartsController(IPartsService service) : MasterDataControllerBase
{
    [HttpGet]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<IReadOnlyList<PartDto>>> ListAsync([FromQuery] int offset = 0, [FromQuery] int limit = 50, CancellationToken cancellationToken = default)
        => Ok(await service.ListAsync(new PagedQuery(offset, limit), cancellationToken));

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<PartDto>> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await service.GetAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<PartDto>> CreateAsync([FromBody] CreatePartDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await service.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetAsync), new { id = created.Id }, created);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<PartDto>> UpdateAsync(Guid id, [FromBody] UpdatePartDto request, CancellationToken cancellationToken = default)
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
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
        => await service.ArchiveAsync(id, cancellationToken) ? NoContent() : NotFound();
}
