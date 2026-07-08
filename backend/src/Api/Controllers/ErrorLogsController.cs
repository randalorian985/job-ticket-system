using JobTicketSystem.Application.Diagnostics;
using JobTicketSystem.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/error-logs")]
public sealed class ErrorLogsController(
    IErrorLogService errorLogService,
    ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<IReadOnlyList<ApplicationErrorLogDto>>> List(
        [FromQuery] int limit = 100,
        [FromQuery] string? source = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var logs = await errorLogService.ListAsync(new ErrorLogQueryDto(limit, source, search), cancellationToken);
        return Ok(logs);
    }

    [HttpPost("client")]
    [Authorize(Policy = "EmployeeOrAbove")]
    public async Task<ActionResult<ApplicationErrorLogDto>> RecordClientError(
        ClientErrorLogRequestDto request,
        CancellationToken cancellationToken)
    {
        var userAgent = string.IsNullOrWhiteSpace(request.UserAgent)
            ? Request.Headers.UserAgent.ToString()
            : request.UserAgent;

        var log = await errorLogService.RecordAsync(
            new CreateErrorLogRequestDto(
                Message: request.Message,
                Source: string.IsNullOrWhiteSpace(request.Source) ? "Client" : request.Source,
                Cause: request.Cause,
                Location: request.Location,
                RequestPath: request.RequestPath,
                RequestMethod: request.RequestMethod,
                UserAgent: userAgent,
                StackTrace: request.StackTrace,
                MetadataJson: request.MetadataJson,
                Severity: request.Severity,
                OccurredAtUtc: request.OccurredAtUtc),
            currentUserContext.UserId,
            currentUserContext.Role,
            cancellationToken);

        return Ok(log);
    }
}

public sealed record ClientErrorLogRequestDto(
    string Message,
    string? Cause,
    string? Source,
    string? Location,
    string? RequestPath,
    string? RequestMethod,
    string? UserAgent,
    string? StackTrace,
    string? MetadataJson,
    string? Severity,
    DateTime? OccurredAtUtc);
