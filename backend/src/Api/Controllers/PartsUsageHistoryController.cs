using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/parts/usage-history")]
[Authorize(Policy = "ManagerOrAdmin")]
public sealed class PartsUsageHistoryController(IPartsUsageHistoryService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PartsUsageHistoryItemDto>>> ListAsync(
        [FromQuery] Guid? equipmentId,
        [FromQuery] Guid? partId,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListAsync(new PartsUsageHistoryQuery(equipmentId, partId, offset, limit), cancellationToken));
        }
        catch (ValidationException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }
}
