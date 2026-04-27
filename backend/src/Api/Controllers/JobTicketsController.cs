using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/job-tickets")]
[Authorize(Policy = "EmployeeOrAbove")]
public sealed class JobTicketsController(IJobTicketsService service, ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<JobTicketListItemDto>>> ListAsync(
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? serviceLocationId,
        [FromQuery] JobTicketStatus? status,
        [FromQuery] JobTicketPriority? priority,
        [FromQuery] string? search,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var items = await service.ListAsync(new JobTicketListQuery(customerId, serviceLocationId, status, priority, search, offset, limit), cancellationToken);
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<JobTicketDto>> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ticket = await service.GetAsync(id, cancellationToken);
        return ticket is null ? NotFound() : Ok(ticket);
    }

    [HttpPost]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<JobTicketDto>> CreateAsync([FromBody] CreateJobTicketDto request, CancellationToken cancellationToken = default)
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
    public async Task<ActionResult<JobTicketDto>> UpdateAsync(Guid id, [FromBody] UpdateJobTicketDto request, CancellationToken cancellationToken = default)
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

    [HttpPost("{id:guid}/status")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<JobTicketDto>> ChangeStatusAsync(Guid id, [FromBody] ChangeJobTicketStatusDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.ChangeStatusAsync(id, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/archive")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<JobTicketDto>> ArchiveAsync(Guid id, [FromBody] ArchiveJobTicketDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var archived = await service.ArchiveAsync(id, request, cancellationToken);
            return archived is null ? NotFound() : Ok(archived);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("{id:guid}/assignments")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<IReadOnlyList<JobTicketAssignmentDto>>> ListAssignmentsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListAssignmentsAsync(id, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/assignments")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<JobTicketAssignmentDto>> AddAssignmentAsync(Guid id, [FromBody] AddJobTicketAssignmentDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await service.AddAssignmentAsync(id, request, cancellationToken);
            return Ok(created);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpDelete("{id:guid}/assignments/{employeeId:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult> RemoveAssignmentAsync(Guid id, Guid employeeId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await service.RemoveAssignmentAsync(id, employeeId, cancellationToken) ? NoContent() : NotFound();
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("{id:guid}/work-entries")]
    [Authorize(Policy = "AssignedEmployeeOrManager")]
    public async Task<ActionResult<IReadOnlyList<JobWorkEntryDto>>> ListWorkEntriesAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListWorkEntriesAsync(id, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/work-entries")]
    [Authorize(Policy = "AssignedEmployeeOrManager")]
    public async Task<ActionResult<JobWorkEntryDto>> AddWorkEntryAsync(Guid id, [FromBody] AddJobWorkEntryDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var employeeId = currentUserContext.IsManager ? request.EmployeeId : currentUserContext.EmployeeId;
            return Ok(await service.AddWorkEntryAsync(id, request with { EmployeeId = employeeId }, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("{jobTicketId:guid}/parts")]
    [Authorize(Policy = "AssignedEmployeeOrManager")]
    public async Task<ActionResult<IReadOnlyList<JobTicketPartDto>>> ListPartsAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListPartsAsync(jobTicketId, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{jobTicketId:guid}/parts")]
    [Authorize(Policy = "AssignedEmployeeOrManager")]
    public async Task<ActionResult<JobTicketPartDto>> AddPartAsync(Guid jobTicketId, [FromBody] AddJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var addedByEmployeeId = currentUserContext.IsManager ? request.AddedByEmployeeId : currentUserContext.EmployeeId;
            return Ok(await service.AddPartAsync(jobTicketId, request with { AddedByEmployeeId = addedByEmployeeId }, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPut("{jobTicketId:guid}/parts/{jobTicketPartId:guid}")]
    [Authorize(Policy = "AssignedEmployeeOrManager")]
    public async Task<ActionResult<JobTicketPartDto>> UpdatePartAsync(Guid jobTicketId, Guid jobTicketPartId, [FromBody] UpdateJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.UpdatePartAsync(jobTicketId, jobTicketPartId, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{jobTicketId:guid}/parts/{jobTicketPartId:guid}/approve")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<JobTicketPartDto>> ApprovePartAsync(Guid jobTicketId, Guid jobTicketPartId, [FromBody] ApproveJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var approved = await service.ApprovePartAsync(jobTicketId, jobTicketPartId, request with { ApprovedByUserId = currentUserContext.EmployeeId }, cancellationToken);
            return approved is null ? NotFound() : Ok(approved);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{jobTicketId:guid}/parts/{jobTicketPartId:guid}/reject")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<JobTicketPartDto>> RejectPartAsync(Guid jobTicketId, Guid jobTicketPartId, [FromBody] RejectJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var rejected = await service.RejectPartAsync(jobTicketId, jobTicketPartId, request with { RejectedByUserId = currentUserContext.EmployeeId }, cancellationToken);
            return rejected is null ? NotFound() : Ok(rejected);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{jobTicketId:guid}/parts/{jobTicketPartId:guid}/archive")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<JobTicketPartDto>> ArchivePartAsync(Guid jobTicketId, Guid jobTicketPartId, [FromBody] ArchiveJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var archived = await service.ArchivePartAsync(jobTicketId, jobTicketPartId, request with { ArchivedByUserId = currentUserContext.EmployeeId }, cancellationToken);
            return archived is null ? NotFound() : Ok(archived);
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
