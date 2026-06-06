using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/part-requests")]
[Authorize(Policy = "EmployeeOrAbove")]
public sealed class PartRequestsController(IPartRequestsService service) : ControllerBase
{
    [HttpPost("job-ticket/{jobTicketId:guid}")]
    [Authorize(Policy = "AssignedEmployeeOrManager")]
    public async Task<ActionResult<PartRequestDto>> CreateForJobTicketAsync(Guid jobTicketId, [FromBody] CreatePartRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await service.CreateForJobTicketAsync(jobTicketId, request, cancellationToken);
            return CreatedAtAction(nameof(GetAsync), new { id = created.Id }, created);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<IReadOnlyList<PartRequestDto>>> ListQueueAsync(
        [FromQuery] JobPartApprovalStatus? status,
        [FromQuery] string? search,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListQueueAsync(new PartRequestQueueQuery(status, search), cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<PartRequestDto>> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = await service.GetAsync(id, cancellationToken);
            return request is null ? NotFound() : Ok(request);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<PartRequestDto>> UpdateBackOfficeAsync(Guid id, [FromBody] UpdatePartRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.UpdateBackOfficeAsync(id, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
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
