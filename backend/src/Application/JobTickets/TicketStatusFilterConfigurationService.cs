using System.Text.Json;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.JobTickets;

public interface ITicketStatusFilterConfigurationService
{
    Task<IReadOnlyList<TicketStatusFilterOptionDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TicketStatusFilterOptionDto>> SaveAsync(SaveTicketStatusFilterConfigurationDto request, Guid? updatedByUserId, CancellationToken cancellationToken = default);
}

public sealed class TicketStatusFilterConfigurationService(ApplicationDbContext dbContext) : ITicketStatusFilterConfigurationService
{
    public static readonly IReadOnlyList<TicketStatusFilterOptionDto> DefaultFilterOptions =
    [
        new(Guid.Parse("0f747a37-c8b8-4f59-b27b-7f5933fc86b8"), "Submitted", JobTicketStatus.Submitted, 10, true),
        new(Guid.Parse("cb4421b3-0030-4a34-b8e0-a2c7d56844bf"), "Assigned", JobTicketStatus.Assigned, 20, true),
        new(Guid.Parse("db738d94-5064-4d2f-98eb-e4d5661e8f5b"), "In Progress", JobTicketStatus.InProgress, 30, true),
        new(Guid.Parse("584a66db-2332-4590-8b22-0a96134aac56"), "Waiting on Parts", JobTicketStatus.WaitingOnParts, 40, true),
        new(Guid.Parse("3ed284cc-a83b-4fdc-b094-3a7466e9d5d1"), "Waiting on Customer", JobTicketStatus.WaitingOnCustomer, 50, true)
    ];

    public async Task<IReadOnlyList<TicketStatusFilterOptionDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        var configuredOptions = await dbContext.TicketStatusFilterOptions
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.DisplayLabel)
            .Select(x => new TicketStatusFilterOptionDto(x.Id, x.DisplayLabel, x.Status, x.DisplayOrder, x.IsActive))
            .ToListAsync(cancellationToken);

        return configuredOptions.Count == 0 ? DefaultFilterOptions : configuredOptions;
    }

    public async Task<IReadOnlyList<TicketStatusFilterOptionDto>> SaveAsync(SaveTicketStatusFilterConfigurationDto request, Guid? updatedByUserId, CancellationToken cancellationToken = default)
    {
        var requestedOptions = request.Options ?? Array.Empty<SaveTicketStatusFilterOptionDto>();

        if (requestedOptions.Count > 20)
        {
            throw new ValidationException("Ticket status filter configuration supports up to 20 filter options.");
        }

        var normalizedOptions = requestedOptions.Select(NormalizeRequest).ToList();
        var duplicateActiveStatuses = normalizedOptions
            .Where(x => x.IsActive)
            .GroupBy(x => x.Status)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key.ToString())
            .ToList();

        if (duplicateActiveStatuses.Count > 0)
        {
            throw new ValidationException($"Active ticket status filters must map to unique statuses. Duplicate statuses: {string.Join(", ", duplicateActiveStatuses)}.");
        }

        var existingOptions = await dbContext.TicketStatusFilterOptions.ToListAsync(cancellationToken);
        var existingById = existingOptions.ToDictionary(x => x.Id);
        var oldValuesJson = JsonSerializer.Serialize(existingOptions
            .OrderBy(x => x.DisplayOrder)
            .Select(x => new { x.Id, x.DisplayLabel, x.Status, x.DisplayOrder, x.IsActive }));

        foreach (var option in normalizedOptions)
        {
            var id = option.Id ?? Guid.NewGuid();
            if (!existingById.TryGetValue(id, out var entity))
            {
                entity = new TicketStatusFilterOption { Id = id };
                dbContext.TicketStatusFilterOptions.Add(entity);
            }

            entity.DisplayLabel = option.DisplayLabel;
            entity.Status = option.Status;
            entity.DisplayOrder = option.DisplayOrder;
            entity.IsActive = option.IsActive;
            entity.UpdatedByUserId = updatedByUserId;
        }

        dbContext.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = updatedByUserId,
            EntityName = nameof(TicketStatusFilterOption),
            ActionType = AuditActionType.Update,
            OldValuesJson = oldValuesJson,
            NewValuesJson = JsonSerializer.Serialize(normalizedOptions)
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return await ListAsync(cancellationToken);
    }

    private static NormalizedTicketStatusFilterOption NormalizeRequest(SaveTicketStatusFilterOptionDto request)
    {
        if (!Enum.IsDefined(request.Status))
        {
            throw new ValidationException("Status must map to an existing ticket status.");
        }

        var label = request.DisplayLabel?.Trim();
        if (string.IsNullOrWhiteSpace(label))
        {
            throw new ValidationException("DisplayLabel is required.");
        }

        if (label.Length > 80)
        {
            throw new ValidationException("DisplayLabel must be 80 characters or fewer.");
        }

        return new NormalizedTicketStatusFilterOption(request.Id, label, request.Status, request.DisplayOrder, request.IsActive);
    }

    private sealed record NormalizedTicketStatusFilterOption(
        Guid? Id,
        string DisplayLabel,
        JobTicketStatus Status,
        int DisplayOrder,
        bool IsActive);
}

public sealed record TicketStatusFilterOptionDto(
    Guid Id,
    string DisplayLabel,
    JobTicketStatus Status,
    int DisplayOrder,
    bool IsActive);

public sealed record SaveTicketStatusFilterConfigurationDto(
    IReadOnlyList<SaveTicketStatusFilterOptionDto> Options);

public sealed record SaveTicketStatusFilterOptionDto(
    Guid? Id,
    string DisplayLabel,
    JobTicketStatus Status,
    int DisplayOrder,
    bool IsActive);
