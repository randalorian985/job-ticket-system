using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/ticket-status-filters")]
public sealed class TicketStatusFiltersController(
    ITicketStatusFilterConfigurationService service,
    ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<IReadOnlyList<TicketStatusFilterOptionDto>>> ListAsync(CancellationToken cancellationToken = default)
    {
        return Ok(await service.ListAsync(cancellationToken));
    }

    [HttpPut]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<IReadOnlyList<TicketStatusFilterOptionDto>>> SaveAsync(
        [FromBody] SaveTicketStatusFilterConfigurationDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.SaveAsync(request, currentUserContext.UserId, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    private ActionResult HandleValidation(Exception exception)
    {
        return exception switch
        {
            ValidationException => BadRequest(new { error = exception.Message }),
            _ => throw exception
        };
    }
}
