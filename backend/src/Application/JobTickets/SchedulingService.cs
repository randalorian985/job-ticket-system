using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.JobTickets;

public interface ISchedulingService
{
    Task<IReadOnlyList<SchedulableTicketDto>> GetUnscheduledAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SchedulableTicketDto>> GetByDateRangeAsync(DateTime startUtc, DateTime endUtc, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TechnicianScheduleDto>> GetByTechnicianAsync(DateTime startUtc, DateTime endUtc, CancellationToken cancellationToken = default);
    Task<bool> ScheduleTicketAsync(Guid ticketId, ScheduleTicketDto request, CancellationToken cancellationToken = default);
}

public sealed class SchedulingService(ApplicationDbContext dbContext) : ISchedulingService
{
    private static readonly JobTicketStatus[] SchedulableStatuses =
    [
        JobTicketStatus.Draft,
        JobTicketStatus.Submitted,
        JobTicketStatus.Assigned,
        JobTicketStatus.InProgress,
        JobTicketStatus.WaitingOnParts,
        JobTicketStatus.WaitingOnCustomer
    ];

    public async Task<IReadOnlyList<SchedulableTicketDto>> GetUnscheduledAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.JobTickets
            .Where(x => !x.IsDeleted
                && x.ScheduledStartAtUtc == null
                && SchedulableStatuses.Contains(x.Status))
            .OrderByDescending(x => x.Priority)
            .ThenBy(x => x.RequestedAtUtc)
            .Select(x => new SchedulableTicketDto(
                x.Id,
                x.TicketNumber,
                x.Title,
                x.Status,
                x.Priority,
                x.Customer.Name,
                x.ServiceLocation.LocationName,
                x.Equipment != null ? x.Equipment.Name : null,
                x.RequestedAtUtc,
                x.ScheduledStartAtUtc,
                x.DueAtUtc,
                x.EstimatedDurationMinutes,
                x.AssignedManagerEmployeeId,
                x.AssignedManagerEmployee != null
                    ? x.AssignedManagerEmployee.FirstName + " " + x.AssignedManagerEmployee.LastName
                    : null))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SchedulableTicketDto>> GetByDateRangeAsync(DateTime startUtc, DateTime endUtc, CancellationToken cancellationToken = default)
    {
        return await dbContext.JobTickets
            .Where(x => !x.IsDeleted
                && SchedulableStatuses.Contains(x.Status)
                && x.ScheduledStartAtUtc != null
                && x.ScheduledStartAtUtc >= startUtc
                && x.ScheduledStartAtUtc <= endUtc)
            .OrderBy(x => x.ScheduledStartAtUtc)
            .ThenByDescending(x => x.Priority)
            .Select(x => new SchedulableTicketDto(
                x.Id,
                x.TicketNumber,
                x.Title,
                x.Status,
                x.Priority,
                x.Customer.Name,
                x.ServiceLocation.LocationName,
                x.Equipment != null ? x.Equipment.Name : null,
                x.RequestedAtUtc,
                x.ScheduledStartAtUtc,
                x.DueAtUtc,
                x.EstimatedDurationMinutes,
                x.AssignedManagerEmployeeId,
                x.AssignedManagerEmployee != null
                    ? x.AssignedManagerEmployee.FirstName + " " + x.AssignedManagerEmployee.LastName
                    : null))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TechnicianScheduleDto>> GetByTechnicianAsync(DateTime startUtc, DateTime endUtc, CancellationToken cancellationToken = default)
    {
        var assignments = await dbContext.JobTicketEmployees
            .Where(a => !a.IsDeleted
                && !a.JobTicket.IsDeleted
                && SchedulableStatuses.Contains(a.JobTicket.Status)
                && a.JobTicket.ScheduledStartAtUtc != null
                && a.JobTicket.ScheduledStartAtUtc >= startUtc
                && a.JobTicket.ScheduledStartAtUtc <= endUtc)
            .Select(a => new
            {
                EmployeeId = a.EmployeeId,
                EmployeeName = a.Employee.FirstName + " " + a.Employee.LastName,
                Ticket = new SchedulableTicketDto(
                    a.JobTicket.Id,
                    a.JobTicket.TicketNumber,
                    a.JobTicket.Title,
                    a.JobTicket.Status,
                    a.JobTicket.Priority,
                    a.JobTicket.Customer.Name,
                    a.JobTicket.ServiceLocation.LocationName,
                    a.JobTicket.Equipment != null ? a.JobTicket.Equipment.Name : null,
                    a.JobTicket.RequestedAtUtc,
                    a.JobTicket.ScheduledStartAtUtc,
                    a.JobTicket.DueAtUtc,
                    a.JobTicket.EstimatedDurationMinutes,
                    a.JobTicket.AssignedManagerEmployeeId,
                    a.JobTicket.AssignedManagerEmployee != null
                        ? a.JobTicket.AssignedManagerEmployee.FirstName + " " + a.JobTicket.AssignedManagerEmployee.LastName
                        : null)
            })
            .ToListAsync(cancellationToken);

        return assignments
            .GroupBy(a => new { a.EmployeeId, a.EmployeeName })
            .Select(g => new TechnicianScheduleDto(
                g.Key.EmployeeId,
                g.Key.EmployeeName,
                g.Select(a => a.Ticket).OrderBy(t => t.ScheduledStartAtUtc).ToList()))
            .OrderBy(t => t.EmployeeName)
            .ToList();
    }

    public async Task<bool> ScheduleTicketAsync(Guid ticketId, ScheduleTicketDto request, CancellationToken cancellationToken = default)
    {
        var ticket = await dbContext.JobTickets
            .SingleOrDefaultAsync(x => x.Id == ticketId && !x.IsDeleted, cancellationToken);

        if (ticket is null) return false;

        ticket.ScheduledStartAtUtc = request.ScheduledStartAtUtc;
        ticket.EstimatedDurationMinutes = request.EstimatedDurationMinutes;

        if (request.AssignedManagerEmployeeId.HasValue)
            ticket.AssignedManagerEmployeeId = request.AssignedManagerEmployeeId;

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public sealed record SchedulableTicketDto(
    Guid Id,
    string TicketNumber,
    string Title,
    JobTicketStatus Status,
    JobTicketPriority Priority,
    string CustomerName,
    string ServiceLocationName,
    string? EquipmentName,
    DateTime? RequestedAtUtc,
    DateTime? ScheduledStartAtUtc,
    DateTime? DueAtUtc,
    int? EstimatedDurationMinutes,
    Guid? AssignedManagerEmployeeId,
    string? AssignedManagerEmployeeName);

public sealed record TechnicianScheduleDto(
    Guid EmployeeId,
    string EmployeeName,
    IReadOnlyList<SchedulableTicketDto> Tickets);

public sealed record ScheduleTicketDto(
    DateTime? ScheduledStartAtUtc,
    int? EstimatedDurationMinutes = null,
    Guid? AssignedManagerEmployeeId = null);
