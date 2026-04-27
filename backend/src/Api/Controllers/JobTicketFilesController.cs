using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/job-tickets/{jobTicketId:guid}/files")]
[Authorize(Policy = "AssignedEmployeeOrManager")]
public sealed class JobTicketFilesController(IJobTicketFilesService service, ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<JobTicketFileDto>>> ListAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.ListAsync(jobTicketId, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("{fileId:guid}")]
    public async Task<ActionResult<JobTicketFileDto>> GetAsync(Guid jobTicketId, Guid fileId, CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await service.GetAsync(jobTicketId, fileId, cancellationToken);
            return file is null ? NotFound() : Ok(file);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost]
    [RequestSizeLimit(50_000_000)]
    public async Task<ActionResult<JobTicketFileDto>> UploadAsync(Guid jobTicketId, [FromForm] UploadJobTicketFileRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            if (request.File is null)
            {
                return BadRequest(new { error = "File is required." });
            }

            await using var stream = request.File.OpenReadStream();
            var created = await service.UploadAsync(
                jobTicketId,
                new UploadJobTicketFileDto(
                    request.File.FileName,
                    request.File.ContentType,
                    request.File.Length,
                    stream,
                    request.Caption,
                    request.Visibility,
                    request.IsInvoiceAttachment,
                    currentUserContext.IsManager ? request.UploadedByEmployeeId : currentUserContext.EmployeeId,
                    request.EquipmentId,
                    request.WorkEntryId),
                cancellationToken);

            return CreatedAtAction(nameof(GetAsync), new { jobTicketId, fileId = created.Id }, created);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("{fileId:guid}/download")]
    public async Task<ActionResult> DownloadAsync(Guid jobTicketId, Guid fileId, CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await service.GetDownloadAsync(jobTicketId, fileId, cancellationToken);
            if (file is null)
            {
                return NotFound();
            }

            return File(file.ContentStream, file.ContentType, file.OriginalFileName);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPut("{fileId:guid}")]
    public async Task<ActionResult<JobTicketFileDto>> UpdateAsync(Guid jobTicketId, Guid fileId, [FromBody] UpdateJobTicketFileDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.UpdateAsync(jobTicketId, fileId, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{fileId:guid}/archive")]
    public async Task<ActionResult<JobTicketFileDto>> ArchiveAsync(Guid jobTicketId, Guid fileId, [FromBody] ArchiveJobTicketFileDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var archived = await service.ArchiveAsync(jobTicketId, fileId, request with { ArchivedByEmployeeId = currentUserContext.EmployeeId }, cancellationToken);
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

public sealed record UploadJobTicketFileRequestDto(
    IFormFile File,
    string? Caption,
    FileVisibility Visibility = FileVisibility.Internal,
    bool IsInvoiceAttachment = false,
    Guid? UploadedByEmployeeId = null,
    Guid? EquipmentId = null,
    Guid? WorkEntryId = null);
