using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.JobTickets;

public interface IPartsUsageHistoryService
{
    Task<IReadOnlyList<PartsUsageHistoryItemDto>> ListAsync(PartsUsageHistoryQuery query, CancellationToken cancellationToken = default);
}

public sealed class PartsUsageHistoryService(ApplicationDbContext dbContext, ICurrentUserContext currentUserContext) : IPartsUsageHistoryService
{
    public async Task<IReadOnlyList<PartsUsageHistoryItemDto>> ListAsync(PartsUsageHistoryQuery query, CancellationToken cancellationToken = default)
    {
        if (!currentUserContext.IsManager)
        {
            throw new ValidationException("This operation requires manager or admin access.");
        }

        var normalized = query.Normalized();
        EquipmentContextDto? requestedEquipment = null;
        if (normalized.EquipmentId.HasValue)
        {
            requestedEquipment = await dbContext.Equipment
                .Where(x => x.Id == normalized.EquipmentId.Value)
                .Select(x => new EquipmentContextDto(x.Id, x.Name, x.Manufacturer, x.ModelNumber, x.EquipmentType))
                .SingleOrDefaultAsync(cancellationToken);

            if (requestedEquipment is null)
            {
                throw new ValidationException("EquipmentId does not reference an active equipment record.");
            }
        }

        var history = dbContext.JobTicketParts
            .AsNoTracking()
            .Where(x => x.ApprovalStatus != JobPartApprovalStatus.Rejected);

        if (normalized.PartId.HasValue)
        {
            history = history.Where(x => x.PartId == normalized.PartId.Value);
        }

        if (requestedEquipment is not null)
        {
            var modelNumber = requestedEquipment.ModelNumber;
            var equipmentType = requestedEquipment.EquipmentType;
            history = history.Where(x =>
                x.EquipmentId == requestedEquipment.Id ||
                x.JobTicket.EquipmentId == requestedEquipment.Id ||
                (!string.IsNullOrWhiteSpace(modelNumber) &&
                    (x.Equipment!.ModelNumber == modelNumber || x.JobTicket.Equipment!.ModelNumber == modelNumber)) ||
                (!string.IsNullOrWhiteSpace(equipmentType) &&
                    (x.Equipment!.EquipmentType == equipmentType || x.JobTicket.Equipment!.EquipmentType == equipmentType)));
        }

        var rows = await history
            .OrderByDescending(x => x.InstalledAtUtc ?? x.AddedAtUtc)
            .ThenBy(x => x.Part.PartNumber)
            .Skip(normalized.Offset)
            .Take(normalized.Limit)
            .Select(x => new PartsUsageHistoryRowDto(
                x.Id,
                x.JobTicketId,
                x.JobTicket.TicketNumber,
                x.PartId,
                x.Part.PartNumber,
                x.Part.Name,
                x.EquipmentId ?? x.JobTicket.EquipmentId,
                x.Equipment != null ? x.Equipment.Name : x.JobTicket.Equipment != null ? x.JobTicket.Equipment.Name : null,
                x.Equipment != null ? x.Equipment.Manufacturer : x.JobTicket.Equipment != null ? x.JobTicket.Equipment.Manufacturer : null,
                x.Equipment != null ? x.Equipment.ModelNumber : x.JobTicket.Equipment != null ? x.JobTicket.Equipment.ModelNumber : null,
                x.Equipment != null ? x.Equipment.EquipmentType : x.JobTicket.Equipment != null ? x.JobTicket.Equipment.EquipmentType : null,
                x.Quantity,
                x.ComponentCategory,
                x.FailureDescription,
                x.RepairDescription,
                x.TechnicianNotes,
                x.CompatibilityNotes,
                x.Notes,
                x.InstalledAtUtc,
                x.AddedAtUtc,
                x.WasSuccessful,
                x.ApprovalStatus))
            .ToListAsync(cancellationToken);

        return rows.Select(row => Map(row, requestedEquipment)).ToList();
    }

    private static PartsUsageHistoryItemDto Map(PartsUsageHistoryRowDto row, EquipmentContextDto? requestedEquipment)
    {
        var evidenceTags = new List<string>();
        var isExactEquipment = requestedEquipment is not null && row.EquipmentId == requestedEquipment.Id;
        var isSameModel = requestedEquipment is not null &&
            !string.IsNullOrWhiteSpace(requestedEquipment.ModelNumber) &&
            string.Equals(row.ModelNumber, requestedEquipment.ModelNumber, StringComparison.OrdinalIgnoreCase);
        var isConfirmed = row.WasSuccessful == true || row.ApprovalStatus is JobPartApprovalStatus.Approved or JobPartApprovalStatus.Invoiced;

        if (isExactEquipment)
        {
            evidenceTags.Add("previously used on this equipment");
        }

        if (!isExactEquipment && isSameModel)
        {
            evidenceTags.Add("commonly used with this model");
        }

        if (isConfirmed)
        {
            evidenceTags.Add("technician-confirmed");
        }

        if (requestedEquipment is not null && !isExactEquipment && !isSameModel)
        {
            evidenceTags.Add("possible match based on similar jobs");
        }

        if (!isConfirmed)
        {
            evidenceTags.Add("needs verification");
        }

        if (evidenceTags.Count == 0)
        {
            evidenceTags.Add("needs verification");
        }

        return new PartsUsageHistoryItemDto(
            row.JobTicketPartId,
            row.JobTicketId,
            row.TicketNumber,
            row.PartId,
            row.PartNumber,
            row.PartName,
            row.EquipmentId,
            row.EquipmentName,
            row.Manufacturer,
            row.ModelNumber,
            row.EquipmentType,
            row.Quantity,
            row.ComponentCategory,
            row.FailureDescription,
            row.RepairDescription,
            row.TechnicianNotes,
            row.CompatibilityNotes,
            row.Notes,
            row.InstalledAtUtc,
            row.AddedAtUtc,
            row.WasSuccessful,
            row.ApprovalStatus,
            evidenceTags);
    }

    private sealed record EquipmentContextDto(Guid Id, string Name, string? Manufacturer, string? ModelNumber, string? EquipmentType);

    private sealed record PartsUsageHistoryRowDto(
        Guid JobTicketPartId,
        Guid JobTicketId,
        string TicketNumber,
        Guid PartId,
        string PartNumber,
        string PartName,
        Guid? EquipmentId,
        string? EquipmentName,
        string? Manufacturer,
        string? ModelNumber,
        string? EquipmentType,
        decimal Quantity,
        string? ComponentCategory,
        string? FailureDescription,
        string? RepairDescription,
        string? TechnicianNotes,
        string? CompatibilityNotes,
        string? Notes,
        DateTime? InstalledAtUtc,
        DateTime AddedAtUtc,
        bool? WasSuccessful,
        JobPartApprovalStatus ApprovalStatus);
}

public sealed record PartsUsageHistoryQuery(Guid? EquipmentId, Guid? PartId, int Offset = 0, int Limit = 50)
{
    public PartsUsageHistoryQuery Normalized() => this with
    {
        Offset = Math.Max(Offset, 0),
        Limit = Math.Clamp(Limit, 1, 100)
    };
}

public sealed record PartsUsageHistoryItemDto(
    Guid JobTicketPartId,
    Guid JobTicketId,
    string TicketNumber,
    Guid PartId,
    string PartNumber,
    string PartName,
    Guid? EquipmentId,
    string? EquipmentName,
    string? Manufacturer,
    string? ModelNumber,
    string? EquipmentType,
    decimal Quantity,
    string? ComponentCategory,
    string? FailureDescription,
    string? RepairDescription,
    string? TechnicianNotes,
    string? CompatibilityNotes,
    string? Notes,
    DateTime? InstalledAtUtc,
    DateTime AddedAtUtc,
    bool? WasSuccessful,
    JobPartApprovalStatus ApprovalStatus,
    IReadOnlyList<string> EvidenceTags);
