using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Diagnostics;

public sealed record ErrorLogQueryDto(
    int Limit = 100,
    string? Source = null,
    string? Search = null);

public sealed record CreateErrorLogRequestDto(
    string Message,
    string Source,
    string? Cause = null,
    string? Location = null,
    string? RequestPath = null,
    string? RequestMethod = null,
    string? UserAgent = null,
    string? StackTrace = null,
    string? MetadataJson = null,
    string? Severity = null,
    DateTime? OccurredAtUtc = null);

public sealed record ApplicationErrorLogDto(
    Guid Id,
    DateTime OccurredAtUtc,
    string Severity,
    string Source,
    string Message,
    string? Cause,
    string? Location,
    string? RequestPath,
    string? RequestMethod,
    Guid? UserId,
    string? UserRole,
    string? UserAgent,
    string? StackTrace,
    string? MetadataJson);

public interface IErrorLogService
{
    Task<IReadOnlyList<ApplicationErrorLogDto>> ListAsync(ErrorLogQueryDto query, CancellationToken cancellationToken = default);
    Task<ApplicationErrorLogDto> RecordAsync(CreateErrorLogRequestDto request, Guid? userId, string? userRole, CancellationToken cancellationToken = default);
}

public sealed class ErrorLogService(ApplicationDbContext dbContext, ICurrentUserContext currentUserContext) : IErrorLogService
{
    public async Task<IReadOnlyList<ApplicationErrorLogDto>> ListAsync(ErrorLogQueryDto query, CancellationToken cancellationToken = default)
    {
        if (!currentUserContext.IsAdmin)
        {
            throw new UnauthorizedAccessException("Only Admin users can review application error logs.");
        }

        var limit = Math.Clamp(query.Limit, 1, 500);
        var source = query.Source?.Trim();
        var search = query.Search?.Trim();

        var logs = dbContext.ApplicationErrorLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(source))
        {
            logs = logs.Where(log => log.Source == source);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            logs = logs.Where(log =>
                log.Message.Contains(search) ||
                (log.Cause != null && log.Cause.Contains(search)) ||
                (log.Location != null && log.Location.Contains(search)) ||
                (log.RequestPath != null && log.RequestPath.Contains(search)) ||
                (log.UserRole != null && log.UserRole.Contains(search)));
        }

        return await logs
            .OrderByDescending(log => log.OccurredAtUtc)
            .ThenByDescending(log => log.CreatedAtUtc)
            .Take(limit)
            .Select(log => ToDto(log))
            .ToListAsync(cancellationToken);
    }

    public async Task<ApplicationErrorLogDto> RecordAsync(CreateErrorLogRequestDto request, Guid? userId, string? userRole, CancellationToken cancellationToken = default)
    {
        var entity = new ApplicationErrorLog
        {
            OccurredAtUtc = EnsureUtc(request.OccurredAtUtc ?? DateTime.UtcNow),
            Severity = Clean(request.Severity, 40) ?? "Error",
            Source = Clean(request.Source, 80) ?? "Unknown",
            Message = Clean(request.Message, 2000) ?? "Unknown error",
            Cause = Clean(request.Cause, 2000),
            Location = Clean(request.Location, 1000),
            RequestPath = Clean(request.RequestPath, 1000),
            RequestMethod = Clean(request.RequestMethod, 20),
            UserId = userId == Guid.Empty ? null : userId,
            UserRole = Clean(userRole, 50),
            UserAgent = Clean(request.UserAgent, 1000),
            StackTrace = Clean(request.StackTrace, 20000),
            MetadataJson = Clean(request.MetadataJson, 20000)
        };

        dbContext.ApplicationErrorLogs.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(entity);
    }

    private static ApplicationErrorLogDto ToDto(ApplicationErrorLog log) => new(
        log.Id,
        log.OccurredAtUtc,
        log.Severity,
        log.Source,
        log.Message,
        log.Cause,
        log.Location,
        log.RequestPath,
        log.RequestMethod,
        log.UserId,
        log.UserRole,
        log.UserAgent,
        log.StackTrace,
        log.MetadataJson);

    private static DateTime EnsureUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();

    private static string? Clean(string? value, int maxLength)
    {
        var cleaned = value?.Trim();
        if (string.IsNullOrWhiteSpace(cleaned))
        {
            return null;
        }

        return cleaned.Length <= maxLength ? cleaned : cleaned[..maxLength];
    }
}
