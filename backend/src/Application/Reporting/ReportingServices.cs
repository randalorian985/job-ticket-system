using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Reporting;

public sealed record ReportQueryFiltersDto(
    DateTime? DateFromUtc = null,
    DateTime? DateToUtc = null,
    Guid? CustomerId = null,
    Guid? BillingPartyCustomerId = null,
    Guid? ServiceLocationId = null,
    Guid? EmployeeId = null,
    JobTicketStatus? JobStatus = null,
    InvoiceStatus? InvoiceStatus = null,
    int Offset = 0,
    int Limit = 50)
{
    public PagedQuery Paged => new(Offset, Limit);
}

public sealed record InvoiceReadySummaryDto(
    Guid JobTicketId,
    string JobTicketNumber,
    string Customer,
    string BillingPartyCustomer,
    string ServiceLocation,
    string? Equipment,
    JobTicketStatus JobStatus,
    InvoiceStatus InvoiceStatus,
    string? CustomerFacingNotes,
    IReadOnlyList<string> WorkDescriptions,
    IReadOnlyList<InvoiceReadyLaborLineDto> ApprovedLaborEntries,
    IReadOnlyList<InvoiceReadyPartLineDto> ApprovedParts,
    decimal LaborHours,
    decimal? LaborCostTotal,
    decimal? LaborBillableTotal,
    decimal PartsCostTotal,
    decimal PartsBillableTotal,
    decimal MiscCharges,
    decimal Tax,
    decimal GrandTotal,
    string? PurchaseOrderNumber,
    string? BillingContactName,
    string? BillingContactPhone,
    string? BillingContactEmail);

public sealed record InvoiceReadyLaborLineDto(Guid TimeEntryId, Guid EmployeeId, string EmployeeName, decimal LaborHours, decimal BillableHours, decimal? CostRate, decimal? BillRate);
public sealed record InvoiceReadyPartLineDto(Guid JobTicketPartId, Guid PartId, string PartNumber, string PartName, decimal Quantity, decimal UnitCostSnapshot, decimal UnitPriceSnapshot);

public sealed record JobCostSummaryDto(Guid JobTicketId, string JobTicketNumber, decimal LaborHours, decimal LaborCostTotal, decimal LaborBillableTotal, decimal PartsCostTotal, decimal PartsBillableTotal, decimal GrandTotal);
public sealed record JobsReadyToInvoiceItemDto(Guid JobTicketId, string JobTicketNumber, string Customer, string BillingPartyCustomer, JobTicketStatus JobStatus, InvoiceStatus InvoiceStatus, decimal ApprovedLaborHours, decimal ApprovedPartsCount, decimal EstimatedBillableTotal, DateTime? CompletedAtUtc);
public sealed record LaborByJobDto(Guid JobTicketId, string JobTicketNumber, string Customer, decimal ApprovedLaborHours, decimal LaborCostTotal, decimal LaborBillableTotal);
public sealed record LaborByEmployeeDto(Guid EmployeeId, string EmployeeName, decimal ApprovedLaborHours, decimal LaborCostTotal, decimal LaborBillableTotal, int JobCount);
public sealed record PartsByJobDto(Guid JobTicketId, string JobTicketNumber, string Customer, decimal ApprovedPartQuantity, decimal PartsCostTotal, decimal PartsBillableTotal);
public sealed record ServiceHistoryItemDto(Guid JobTicketId, string JobTicketNumber, Guid CustomerId, string Customer, Guid? EquipmentId, string? Equipment, string Title, JobTicketStatus JobStatus, DateTime CreatedAtUtc, DateTime? CompletedAtUtc);

public interface IReportingService
{
    Task<InvoiceReadySummaryDto?> GetInvoiceReadySummaryAsync(Guid jobTicketId, CancellationToken cancellationToken = default);
    Task<JobCostSummaryDto?> GetJobCostSummaryAsync(Guid jobTicketId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobsReadyToInvoiceItemDto>> GetJobsReadyToInvoiceAsync(ReportQueryFiltersDto filters, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LaborByJobDto>> GetLaborByJobAsync(ReportQueryFiltersDto filters, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LaborByEmployeeDto>> GetLaborByEmployeeAsync(ReportQueryFiltersDto filters, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartsByJobDto>> GetPartsByJobAsync(ReportQueryFiltersDto filters, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ServiceHistoryItemDto>> GetCustomerServiceHistoryAsync(Guid customerId, ReportQueryFiltersDto filters, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ServiceHistoryItemDto>> GetEquipmentServiceHistoryAsync(Guid equipmentId, ReportQueryFiltersDto filters, CancellationToken cancellationToken = default);
}

public sealed class ReportingService(ApplicationDbContext dbContext) : IReportingService
{
    public async Task<InvoiceReadySummaryDto?> GetInvoiceReadySummaryAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        var jobTicket = await dbContext.JobTickets
            .Where(x => x.Id == jobTicketId)
            .Select(x => new
            {
                x.Id,
                x.TicketNumber,
                Customer = x.Customer.Name,
                BillingPartyCustomer = x.BillingPartyCustomer.Name,
                ServiceLocation = x.ServiceLocation.LocationName,
                Equipment = x.Equipment != null ? x.Equipment.Name : null,
                x.Status,
                InvoiceStatus = x.InvoiceSummary != null ? x.InvoiceSummary.Status : InvoiceStatus.NotReady,
                x.CustomerFacingNotes,
                WorkDescriptions = x.WorkEntries.OrderByDescending(w => w.PerformedAtUtc).Select(w => w.Notes).ToList(),
                x.PurchaseOrderNumber,
                x.BillingContactName,
                x.BillingContactPhone,
                x.BillingContactEmail,
                Tax = x.InvoiceSummary != null ? x.InvoiceSummary.TaxAmount : 0m
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (jobTicket is null)
        {
            return null;
        }

        var approvedLabor = await dbContext.TimeEntries
            .Where(x => x.JobTicketId == jobTicketId && x.ApprovalStatus == TimeEntryApprovalStatus.Approved && x.EndedAtUtc.HasValue)
            .Select(x => new InvoiceReadyLaborLineDto(
                x.Id,
                x.EmployeeId,
                x.Employee.FirstName + " " + x.Employee.LastName,
                x.LaborHours,
                x.BillableHours,
                x.CostRateSnapshot ?? x.Employee.CostRate,
                x.BillRateSnapshot ?? x.Employee.BillRate ?? x.Employee.LaborRate))
            .ToListAsync(cancellationToken);

        var approvedParts = await dbContext.JobTicketParts
            .Where(x => x.JobTicketId == jobTicketId && x.ApprovalStatus == JobPartApprovalStatus.Approved)
            .Select(x => new InvoiceReadyPartLineDto(x.Id, x.PartId, x.Part.PartNumber, x.Part.Name, x.Quantity, x.UnitCostSnapshot, x.SalePriceSnapshot))
            .ToListAsync(cancellationToken);

        var laborHours = approvedLabor.Sum(x => x.LaborHours);
        var laborCostEntries = approvedLabor.Where(x => x.CostRate.HasValue).ToList();
        var laborBillEntries = approvedLabor.Where(x => x.BillRate.HasValue).ToList();
        decimal? laborCostTotal = laborCostEntries.Count != 0 ? laborCostEntries.Sum(x => x.LaborHours * x.CostRate!.Value) : null;
        decimal? laborBillableTotal = laborBillEntries.Count != 0 ? laborBillEntries.Sum(x => x.BillableHours * x.BillRate!.Value) : null;

        var partsCostTotal = approvedParts.Sum(x => x.Quantity * x.UnitCostSnapshot);
        var partsBillableTotal = approvedParts.Sum(x => x.Quantity * x.UnitPriceSnapshot);
        const decimal miscCharges = 0m;
        var tax = jobTicket.Tax;
        var grandTotal = (laborBillableTotal ?? 0m) + partsBillableTotal + miscCharges + tax;

        return new InvoiceReadySummaryDto(
            jobTicket.Id,
            jobTicket.TicketNumber,
            jobTicket.Customer,
            jobTicket.BillingPartyCustomer,
            jobTicket.ServiceLocation,
            jobTicket.Equipment,
            jobTicket.Status,
            jobTicket.InvoiceStatus,
            jobTicket.CustomerFacingNotes,
            jobTicket.WorkDescriptions,
            approvedLabor,
            approvedParts,
            laborHours,
            laborCostTotal,
            laborBillableTotal,
            partsCostTotal,
            partsBillableTotal,
            miscCharges,
            tax,
            grandTotal,
            jobTicket.PurchaseOrderNumber,
            jobTicket.BillingContactName,
            jobTicket.BillingContactPhone,
            jobTicket.BillingContactEmail);
    }

    public async Task<JobCostSummaryDto?> GetJobCostSummaryAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        var invoiceReady = await GetInvoiceReadySummaryAsync(jobTicketId, cancellationToken);
        if (invoiceReady is null)
        {
            return null;
        }

        return new JobCostSummaryDto(
            invoiceReady.JobTicketId,
            invoiceReady.JobTicketNumber,
            invoiceReady.LaborHours,
            invoiceReady.LaborCostTotal ?? 0m,
            invoiceReady.LaborBillableTotal ?? 0m,
            invoiceReady.PartsCostTotal,
            invoiceReady.PartsBillableTotal,
            invoiceReady.GrandTotal);
    }

    public async Task<IReadOnlyList<JobsReadyToInvoiceItemDto>> GetJobsReadyToInvoiceAsync(ReportQueryFiltersDto filters, CancellationToken cancellationToken = default)
    {
        var query = ApplyTicketFilters(dbContext.JobTickets.AsQueryable(), filters)
            .Where(x => (x.Status == JobTicketStatus.Completed || x.Status == JobTicketStatus.Reviewed) && x.Status != JobTicketStatus.Invoiced)
            .Where(x => x.InvoiceSummary == null || (x.InvoiceSummary.Status != InvoiceStatus.Sent && x.InvoiceSummary.Status != InvoiceStatus.Paid && x.InvoiceSummary.Status != InvoiceStatus.Void))
            .Where(x => x.TimeEntries.Any(t => t.ApprovalStatus == TimeEntryApprovalStatus.Approved && t.EndedAtUtc.HasValue)
                || x.Parts.Any(p => p.ApprovalStatus == JobPartApprovalStatus.Approved));

        return await query
            .OrderByDescending(x => x.CompletedAtUtc ?? x.UpdatedAtUtc)
            .Skip(filters.Paged.NormalizedOffset)
            .Take(filters.Paged.NormalizedLimit)
            .Select(x => new JobsReadyToInvoiceItemDto(
                x.Id,
                x.TicketNumber,
                x.Customer.Name,
                x.BillingPartyCustomer.Name,
                x.Status,
                x.InvoiceSummary != null ? x.InvoiceSummary.Status : InvoiceStatus.NotReady,
                x.TimeEntries.Where(t => t.ApprovalStatus == TimeEntryApprovalStatus.Approved && t.EndedAtUtc.HasValue).Sum(t => t.LaborHours),
                x.Parts.Where(p => p.ApprovalStatus == JobPartApprovalStatus.Approved).Sum(p => p.Quantity),
                x.TimeEntries.Where(t => t.ApprovalStatus == TimeEntryApprovalStatus.Approved && t.EndedAtUtc.HasValue).Sum(t => t.BillableHours * (t.BillRateSnapshot ?? t.Employee.BillRate ?? t.Employee.LaborRate ?? 0m))
                    + x.Parts.Where(p => p.ApprovalStatus == JobPartApprovalStatus.Approved).Sum(p => p.Quantity * p.SalePriceSnapshot),
                x.CompletedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<LaborByJobDto>> GetLaborByJobAsync(ReportQueryFiltersDto filters, CancellationToken cancellationToken = default)
    {
        var query = ApplyTicketFilters(dbContext.JobTickets.AsQueryable(), filters);

        return await query
            .Where(x => x.TimeEntries.Any(t => t.ApprovalStatus == TimeEntryApprovalStatus.Approved && t.EndedAtUtc.HasValue))
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(filters.Paged.NormalizedOffset)
            .Take(filters.Paged.NormalizedLimit)
            .Select(x => new LaborByJobDto(
                x.Id,
                x.TicketNumber,
                x.Customer.Name,
                x.TimeEntries.Where(t => t.ApprovalStatus == TimeEntryApprovalStatus.Approved && t.EndedAtUtc.HasValue).Sum(t => t.LaborHours),
                x.TimeEntries.Where(t => t.ApprovalStatus == TimeEntryApprovalStatus.Approved && t.EndedAtUtc.HasValue).Sum(t => t.LaborHours * (t.CostRateSnapshot ?? t.Employee.CostRate ?? 0m)),
                x.TimeEntries.Where(t => t.ApprovalStatus == TimeEntryApprovalStatus.Approved && t.EndedAtUtc.HasValue).Sum(t => t.BillableHours * (t.BillRateSnapshot ?? t.Employee.BillRate ?? t.Employee.LaborRate ?? 0m))))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<LaborByEmployeeDto>> GetLaborByEmployeeAsync(ReportQueryFiltersDto filters, CancellationToken cancellationToken = default)
    {
        var timeEntries = dbContext.TimeEntries
            .Where(x => x.ApprovalStatus == TimeEntryApprovalStatus.Approved && x.EndedAtUtc.HasValue)
            .Where(x => !filters.DateFromUtc.HasValue || x.EndedAtUtc >= filters.DateFromUtc.Value)
            .Where(x => !filters.DateToUtc.HasValue || x.EndedAtUtc <= filters.DateToUtc.Value);

        if (filters.CustomerId.HasValue)
        {
            timeEntries = timeEntries.Where(x => x.JobTicket.CustomerId == filters.CustomerId.Value);
        }

        if (filters.BillingPartyCustomerId.HasValue)
        {
            timeEntries = timeEntries.Where(x => x.JobTicket.BillingPartyCustomerId == filters.BillingPartyCustomerId.Value);
        }

        if (filters.ServiceLocationId.HasValue)
        {
            timeEntries = timeEntries.Where(x => x.JobTicket.ServiceLocationId == filters.ServiceLocationId.Value);
        }

        if (filters.EmployeeId.HasValue)
        {
            timeEntries = timeEntries.Where(x => x.EmployeeId == filters.EmployeeId.Value);
        }

        if (filters.JobStatus.HasValue)
        {
            timeEntries = timeEntries.Where(x => x.JobTicket.Status == filters.JobStatus.Value);
        }

        if (filters.InvoiceStatus.HasValue)
        {
            timeEntries = timeEntries.Where(x => x.JobTicket.InvoiceSummary != null && x.JobTicket.InvoiceSummary.Status == filters.InvoiceStatus.Value);
        }

        return await timeEntries
            .GroupBy(x => new { x.EmployeeId, x.Employee.FirstName, x.Employee.LastName })
            .OrderBy(x => x.Key.LastName)
            .ThenBy(x => x.Key.FirstName)
            .Skip(filters.Paged.NormalizedOffset)
            .Take(filters.Paged.NormalizedLimit)
            .Select(group => new LaborByEmployeeDto(
                group.Key.EmployeeId,
                group.Key.FirstName + " " + group.Key.LastName,
                group.Sum(x => x.LaborHours),
                group.Sum(x => x.LaborHours * (x.CostRateSnapshot ?? x.Employee.CostRate ?? 0m)),
                group.Sum(x => x.BillableHours * (x.BillRateSnapshot ?? x.Employee.BillRate ?? x.Employee.LaborRate ?? 0m)),
                group.Select(x => x.JobTicketId).Distinct().Count()))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PartsByJobDto>> GetPartsByJobAsync(ReportQueryFiltersDto filters, CancellationToken cancellationToken = default)
    {
        var query = ApplyTicketFilters(dbContext.JobTickets.AsQueryable(), filters);

        return await query
            .Where(x => x.Parts.Any(p => p.ApprovalStatus == JobPartApprovalStatus.Approved))
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(filters.Paged.NormalizedOffset)
            .Take(filters.Paged.NormalizedLimit)
            .Select(x => new PartsByJobDto(
                x.Id,
                x.TicketNumber,
                x.Customer.Name,
                x.Parts.Where(p => p.ApprovalStatus == JobPartApprovalStatus.Approved).Sum(p => p.Quantity),
                x.Parts.Where(p => p.ApprovalStatus == JobPartApprovalStatus.Approved).Sum(p => p.Quantity * p.UnitCostSnapshot),
                x.Parts.Where(p => p.ApprovalStatus == JobPartApprovalStatus.Approved).Sum(p => p.Quantity * p.SalePriceSnapshot)))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ServiceHistoryItemDto>> GetCustomerServiceHistoryAsync(Guid customerId, ReportQueryFiltersDto filters, CancellationToken cancellationToken = default)
    {
        var query = ApplyTicketFilters(dbContext.JobTickets.AsQueryable(), filters)
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(filters.Paged.NormalizedOffset)
            .Take(filters.Paged.NormalizedLimit);

        return await query.Select(MapServiceHistoryProjection).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ServiceHistoryItemDto>> GetEquipmentServiceHistoryAsync(Guid equipmentId, ReportQueryFiltersDto filters, CancellationToken cancellationToken = default)
    {
        var query = ApplyTicketFilters(dbContext.JobTickets.AsQueryable(), filters)
            .Where(x => x.EquipmentId == equipmentId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(filters.Paged.NormalizedOffset)
            .Take(filters.Paged.NormalizedLimit);

        return await query.Select(MapServiceHistoryProjection).ToListAsync(cancellationToken);
    }

    private static IQueryable<JobTicket> ApplyTicketFilters(IQueryable<JobTicket> query, ReportQueryFiltersDto filters)
    {
        return query
            .Where(x => !filters.DateFromUtc.HasValue || x.CreatedAtUtc >= filters.DateFromUtc.Value)
            .Where(x => !filters.DateToUtc.HasValue || x.CreatedAtUtc <= filters.DateToUtc.Value)
            .Where(x => !filters.CustomerId.HasValue || x.CustomerId == filters.CustomerId.Value)
            .Where(x => !filters.BillingPartyCustomerId.HasValue || x.BillingPartyCustomerId == filters.BillingPartyCustomerId.Value)
            .Where(x => !filters.ServiceLocationId.HasValue || x.ServiceLocationId == filters.ServiceLocationId.Value)
            .Where(x => !filters.JobStatus.HasValue || x.Status == filters.JobStatus.Value)
            .Where(x => !filters.InvoiceStatus.HasValue || (x.InvoiceSummary != null && x.InvoiceSummary.Status == filters.InvoiceStatus.Value))
            .Where(x => !filters.EmployeeId.HasValue || x.TimeEntries.Any(t => t.EmployeeId == filters.EmployeeId.Value));
    }

    private static readonly System.Linq.Expressions.Expression<Func<JobTicket, ServiceHistoryItemDto>> MapServiceHistoryProjection = x =>
        new ServiceHistoryItemDto(x.Id, x.TicketNumber, x.CustomerId, x.Customer.Name, x.EquipmentId, x.Equipment != null ? x.Equipment.Name : null, x.Title, x.Status, x.CreatedAtUtc, x.CompletedAtUtc);
}
