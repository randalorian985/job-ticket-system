using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.TimeEntries;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/time-entries")]
[Authorize(Policy = "EmployeeOrAbove")]
public sealed class TimeEntriesController(ITimeEntriesService service, ICurrentUserContext currentUserContext) : ControllerBase
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

    [HttpPost("travel-start")]
    public async Task<ActionResult<TimeEntryDto>> StartTravelAsync([FromBody] TravelStartRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.StartTravelAsync(request, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("travel-end")]
    public async Task<ActionResult<TimeEntryDto>> EndTravelAsync([FromBody] TravelEndRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.EndTravelAsync(request, cancellationToken));
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

    [HttpGet("review")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<IReadOnlyList<TimeApprovalQueueItemDto>>> ListForReviewAsync(
        [FromQuery] Guid? jobTicketId,
        [FromQuery] Guid? employeeId,
        [FromQuery] TimeEntryApprovalStatus? approvalStatus,
        [FromQuery] DateTime? dateFromUtc,
        [FromQuery] DateTime? dateToUtc,
        [FromQuery] string? search,
        [FromQuery] TimeEntryType? entryType,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var filters = new TimeEntryReviewFilters(jobTicketId, employeeId, approvalStatus, dateFromUtc, dateToUtc, search, entryType);
            return Ok(await service.ListForReviewAsync(filters, cancellationToken));
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
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<TimeEntryDto>> ApproveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = await service.ApproveAsync(id, currentUserContext.EmployeeId, cancellationToken);
            return entry is null ? NotFound() : Ok(entry);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("bulk-approve")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<IReadOnlyList<TimeEntryDto>>> BulkApproveAsync([FromBody] BulkApproveTimeEntriesRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.BulkApproveAsync(request, currentUserContext.EmployeeId, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/edit-and-approve")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<TimeEntryDto>> EditAndApproveAsync(Guid id, [FromBody] AdjustTimeEntryRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = await service.EditAndApproveAsync(id, request, currentUserContext.EmployeeId, cancellationToken);
            return entry is null ? NotFound() : Ok(entry);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<TimeEntryDto>> RejectAsync(Guid id, [FromBody] RejectTimeEntryRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = await service.RejectAsync(id, request, currentUserContext.EmployeeId, cancellationToken);
            return entry is null ? NotFound() : Ok(entry);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/adjust")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<TimeEntryDto>> AdjustAsync(Guid id, [FromBody] AdjustTimeEntryRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = await service.AdjustAsync(id, request, currentUserContext.EmployeeId, managerOverride: true, cancellationToken);
            return entry is null ? NotFound() : Ok(entry);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult> ArchiveAsync(Guid id, [FromBody] ArchiveTimeEntryRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            return await service.ArchiveAsync(id, request, currentUserContext.EmployeeId, cancellationToken) ? NoContent() : NotFound();
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
