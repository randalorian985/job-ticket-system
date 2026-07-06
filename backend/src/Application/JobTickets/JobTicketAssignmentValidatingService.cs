using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Notifications;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.JobTickets;

public sealed class JobTicketAssignmentValidatingService(ApplicationDbContext dbContext, ICurrentUserContext currentUserContext, INewTicketNotificationService notificationService) : IJobTicketsService
{
    private readonly JobTicketsService inner = new(dbContext, currentUserContext, notificationService);

    public Task<IReadOnlyList<JobTicketListItemDto>> ListAsync(JobTicketListQuery query, CancellationToken cancellationToken = default)
        => inner.ListAsync(query, cancellationToken);

    public Task<JobTicketDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
        => inner.GetAsync(id, cancellationToken);

    public Task<JobTicketDto> CreateAsync(CreateJobTicketDto request, CancellationToken cancellationToken = default)
        => inner.CreateAsync(request, cancellationToken);

    public Task<JobTicketDto?> UpdateAsync(Guid id, UpdateJobTicketDto request, CancellationToken cancellationToken = default)
        => inner.UpdateAsync(id, request, cancellationToken);

    public Task<JobTicketDto?> ChangeStatusAsync(Guid id, ChangeJobTicketStatusDto request, CancellationToken cancellationToken = default)
        => inner.ChangeStatusAsync(id, request, cancellationToken);

    public Task<JobTicketDto?> ArchiveAsync(Guid id, ArchiveJobTicketDto request, CancellationToken cancellationToken = default)
        => inner.ArchiveAsync(id, request, cancellationToken);

    public Task<IReadOnlyList<JobTicketAssignmentDto>> ListAssignmentsAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
        => inner.ListAssignmentsAsync(jobTicketId, cancellationToken);

    public async Task<JobTicketAssignmentDto> AddAssignmentAsync(Guid jobTicketId, AddJobTicketAssignmentDto request, CancellationToken cancellationToken = default)
    {
        var canAssignEmployee = await dbContext.Employees.AnyAsync(
            x => x.Id == request.EmployeeId && x.Status == EmployeeStatus.Active && x.Role == SystemRoles.Employee,
            cancellationToken);

        if (!canAssignEmployee)
        {
            throw new ValidationException("EmployeeId must reference an active employee user.");
        }

        if (request.IsLead)
        {
            var leadExists = await dbContext.JobTicketEmployees.AnyAsync(
                x => x.JobTicketId == jobTicketId && x.IsLead,
                cancellationToken);

            if (leadExists)
            {
                throw new ValidationException("A lead tech is already assigned to this job ticket.");
            }
        }

        return await inner.AddAssignmentAsync(jobTicketId, request, cancellationToken);
    }

    public Task<bool> RemoveAssignmentAsync(Guid jobTicketId, Guid employeeId, CancellationToken cancellationToken = default)
        => inner.RemoveAssignmentAsync(jobTicketId, employeeId, cancellationToken);

    public Task<IReadOnlyList<JobWorkEntryDto>> ListWorkEntriesAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
        => inner.ListWorkEntriesAsync(jobTicketId, cancellationToken);

    public Task<JobWorkEntryDto> AddWorkEntryAsync(Guid jobTicketId, AddJobWorkEntryDto request, CancellationToken cancellationToken = default)
        => inner.AddWorkEntryAsync(jobTicketId, request, cancellationToken);

    public Task<IReadOnlyList<JobTicketPartDto>> ListPartsAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
        => inner.ListPartsAsync(jobTicketId, cancellationToken);

    public Task<JobTicketPartDto> AddPartAsync(Guid jobTicketId, AddJobTicketPartDto request, CancellationToken cancellationToken = default)
        => inner.AddPartAsync(jobTicketId, request, cancellationToken);

    public Task<JobTicketPartDto> QuickAddPartAsync(Guid jobTicketId, QuickAddJobTicketPartDto request, CancellationToken cancellationToken = default)
        => inner.QuickAddPartAsync(jobTicketId, request, cancellationToken);

    public async Task<JobTicketPartDto?> UpdatePartAsync(Guid jobTicketId, Guid jobTicketPartId, UpdateJobTicketPartDto request, CancellationToken cancellationToken = default)
    {
        if (!currentUserContext.IsManager)
        {
            var existingIsBillable = await dbContext.JobTicketParts
                .Where(x => x.JobTicketId == jobTicketId && x.Id == jobTicketPartId)
                .Select(x => (bool?)x.IsBillable)
                .SingleOrDefaultAsync(cancellationToken);

            if (existingIsBillable.HasValue && request.IsBillable != existingIsBillable.Value)
            {
                throw new ValidationException("Only managers or admins can change job part billing state.");
            }
        }

        return await inner.UpdatePartAsync(jobTicketId, jobTicketPartId, request, cancellationToken);
    }

    public Task<JobTicketPartDto?> ApprovePartAsync(Guid jobTicketId, Guid jobTicketPartId, ApproveJobTicketPartDto request, CancellationToken cancellationToken = default)
        => inner.ApprovePartAsync(jobTicketId, jobTicketPartId, request, cancellationToken);

    public Task<JobTicketPartDto?> RejectPartAsync(Guid jobTicketId, Guid jobTicketPartId, RejectJobTicketPartDto request, CancellationToken cancellationToken = default)
        => inner.RejectPartAsync(jobTicketId, jobTicketPartId, request, cancellationToken);

    public Task<JobTicketPartDto?> ArchivePartAsync(Guid jobTicketId, Guid jobTicketPartId, ArchiveJobTicketPartDto request, CancellationToken cancellationToken = default)
        => inner.ArchivePartAsync(jobTicketId, jobTicketPartId, request, cancellationToken);

    public Task<IReadOnlyList<TicketTimelineItemDto>> GetTimelineAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
        => inner.GetTimelineAsync(jobTicketId, cancellationToken);
}
