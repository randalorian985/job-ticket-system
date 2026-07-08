using System.Security.Claims;
using System.Text.Json;
using JobTicketSystem.Application.Diagnostics;

namespace JobTicketSystem.Api.Diagnostics;

public sealed class ErrorLoggingMiddleware(RequestDelegate next, ILogger<ErrorLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, IErrorLogService errorLogService)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            await TryRecordAsync(context, errorLogService, exception);
            throw;
        }
    }

    private async Task TryRecordAsync(HttpContext context, IErrorLogService errorLogService, Exception exception)
    {
        try
        {
            var userId = GetUserId(context.User);
            var userRole = context.User.FindFirstValue(ClaimTypes.Role);
            var metadata = JsonSerializer.Serialize(new
            {
                context.TraceIdentifier,
                QueryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : null,
                Route = context.Request.Path.Value
            });

            await errorLogService.RecordAsync(
                new CreateErrorLogRequestDto(
                    Message: exception.Message,
                    Source: "Server",
                    Cause: exception.GetType().FullName,
                    Location: context.GetEndpoint()?.DisplayName,
                    RequestPath: context.Request.Path.Value,
                    RequestMethod: context.Request.Method,
                    UserAgent: context.Request.Headers.UserAgent.ToString(),
                    StackTrace: exception.ToString(),
                    MetadataJson: metadata),
                userId,
                userRole,
                context.RequestAborted);
        }
        catch (Exception loggingException)
        {
            logger.LogError(loggingException, "Unable to record application error log.");
        }
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var rawUserId = user.FindFirstValue("employee_id")
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(rawUserId, out var userId) && userId != Guid.Empty
            ? userId
            : null;
    }
}
