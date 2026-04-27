using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.TimeEntries;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/time-entries")]
public sealed class TimeEntriesController(ITimeEntriesService service) : ControllerBase
{
    [HttpPost("clock-in")]
    public async Task<ActionResult<TimeEntryDto>> ClockInAsync([FromBody] ClockInRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ClockInAsync(request, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("clock-out")]
    public async Task<ActionResult<TimeEntryDto>> ClockOutAsync([FromBody] ClockOutRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ClockOutAsync(request, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("open")]
    public async Task<ActionResult<TimeEntryDto>> GetOpenAsync([FromQuery] Guid employeeId, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = await service.GetOpenEntryAsync(employeeId, cancellationToken);
            return entry is null ? NotFound() : Ok(entry);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("job/{jobTicketId:guid}")]
    public async Task<ActionResult<IReadOnlyList<TimeEntryDto>>> ListForJobAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListForJobTicketAsync(jobTicketId, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<ActionResult<IReadOnlyList<TimeEntryDto>>> ListForEmployeeAsync(Guid employeeId, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListForEmployeeAsync(employeeId, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<TimeEntryDto>> ApproveAsync(Guid id, [FromBody] ApproveTimeEntryRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = await service.ApproveAsync(id, request, cancellationToken);
            return entry is null ? NotFound() : Ok(entry);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<TimeEntryDto>> RejectAsync(Guid id, [FromBody] RejectTimeEntryRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = await service.RejectAsync(id, request, cancellationToken);
            return entry is null ? NotFound() : Ok(entry);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/adjust")]
    public async Task<ActionResult<TimeEntryDto>> AdjustAsync(Guid id, [FromBody] AdjustTimeEntryRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = await service.AdjustAsync(id, request, cancellationToken);
            return entry is null ? NotFound() : Ok(entry);
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
