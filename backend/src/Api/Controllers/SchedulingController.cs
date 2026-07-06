using JobTicketSystem.Application.JobTickets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/scheduling")]
[Authorize(Policy = "ManagerOrAdmin")]
public sealed class SchedulingController(ISchedulingService service) : ControllerBase
{
    [HttpGet("unscheduled")]
    public async Task<ActionResult<IReadOnlyList<SchedulableTicketDto>>> GetUnscheduledAsync(CancellationToken cancellationToken)
        => Ok(await service.GetUnscheduledAsync(cancellationToken));

    [HttpGet("calendar")]
    public async Task<ActionResult<IReadOnlyList<SchedulableTicketDto>>> GetCalendarAsync(
        [FromQuery] DateTime startUtc,
        [FromQuery] DateTime endUtc,
        CancellationToken cancellationToken)
        => Ok(await service.GetByDateRangeAsync(startUtc, endUtc, cancellationToken));

    [HttpGet("by-technician")]
    public async Task<ActionResult<IReadOnlyList<TechnicianScheduleDto>>> GetByTechnicianAsync(
        [FromQuery] DateTime startUtc,
        [FromQuery] DateTime endUtc,
        CancellationToken cancellationToken)
        => Ok(await service.GetByTechnicianAsync(startUtc, endUtc, cancellationToken));

    [HttpPost("{ticketId:guid}/schedule")]
    public async Task<IActionResult> ScheduleTicketAsync(Guid ticketId, [FromBody] ScheduleTicketDto request, CancellationToken cancellationToken)
    {
        var updated = await service.ScheduleTicketAsync(ticketId, request, cancellationToken);
        return updated ? NoContent() : NotFound();
    }
}
