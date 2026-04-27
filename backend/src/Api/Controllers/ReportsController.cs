using JobTicketSystem.Application.Reporting;
using JobTicketSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Policy = "ManagerOrAdmin")]
public sealed class ReportsController(IReportingService reportingService) : ControllerBase
{
    [HttpGet("job-tickets/{jobTicketId:guid}/invoice-ready")]
    public async Task<ActionResult<InvoiceReadySummaryDto>> GetInvoiceReadyAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        var summary = await reportingService.GetInvoiceReadySummaryAsync(jobTicketId, cancellationToken);
        return summary is null ? NotFound() : Ok(summary);
    }

    [HttpGet("job-tickets/{jobTicketId:guid}/cost-summary")]
    public async Task<ActionResult<JobCostSummaryDto>> GetCostSummaryAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        var summary = await reportingService.GetJobCostSummaryAsync(jobTicketId, cancellationToken);
        return summary is null ? NotFound() : Ok(summary);
    }

    [HttpGet("jobs-ready-to-invoice")]
    public async Task<ActionResult<IReadOnlyList<JobsReadyToInvoiceItemDto>>> GetJobsReadyToInvoiceAsync(
        [FromQuery] DateTime? dateFromUtc,
        [FromQuery] DateTime? dateToUtc,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? billingPartyCustomerId,
        [FromQuery] Guid? serviceLocationId,
        [FromQuery] Guid? employeeId,
        [FromQuery] JobTicketStatus? jobStatus,
        [FromQuery] InvoiceStatus? invoiceStatus,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
        => Ok(await reportingService.GetJobsReadyToInvoiceAsync(CreateFilters(dateFromUtc, dateToUtc, customerId, billingPartyCustomerId, serviceLocationId, employeeId, jobStatus, invoiceStatus, offset, limit), cancellationToken));

    [HttpGet("labor/by-job")]
    public async Task<ActionResult<IReadOnlyList<LaborByJobDto>>> GetLaborByJobAsync(
        [FromQuery] DateTime? dateFromUtc,
        [FromQuery] DateTime? dateToUtc,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? billingPartyCustomerId,
        [FromQuery] Guid? serviceLocationId,
        [FromQuery] Guid? employeeId,
        [FromQuery] JobTicketStatus? jobStatus,
        [FromQuery] InvoiceStatus? invoiceStatus,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
        => Ok(await reportingService.GetLaborByJobAsync(CreateFilters(dateFromUtc, dateToUtc, customerId, billingPartyCustomerId, serviceLocationId, employeeId, jobStatus, invoiceStatus, offset, limit), cancellationToken));

    [HttpGet("labor/by-employee")]
    public async Task<ActionResult<IReadOnlyList<LaborByEmployeeDto>>> GetLaborByEmployeeAsync(
        [FromQuery] DateTime? dateFromUtc,
        [FromQuery] DateTime? dateToUtc,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? billingPartyCustomerId,
        [FromQuery] Guid? serviceLocationId,
        [FromQuery] Guid? employeeId,
        [FromQuery] JobTicketStatus? jobStatus,
        [FromQuery] InvoiceStatus? invoiceStatus,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
        => Ok(await reportingService.GetLaborByEmployeeAsync(CreateFilters(dateFromUtc, dateToUtc, customerId, billingPartyCustomerId, serviceLocationId, employeeId, jobStatus, invoiceStatus, offset, limit), cancellationToken));

    [HttpGet("parts/by-job")]
    public async Task<ActionResult<IReadOnlyList<PartsByJobDto>>> GetPartsByJobAsync(
        [FromQuery] DateTime? dateFromUtc,
        [FromQuery] DateTime? dateToUtc,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? billingPartyCustomerId,
        [FromQuery] Guid? serviceLocationId,
        [FromQuery] Guid? employeeId,
        [FromQuery] JobTicketStatus? jobStatus,
        [FromQuery] InvoiceStatus? invoiceStatus,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
        => Ok(await reportingService.GetPartsByJobAsync(CreateFilters(dateFromUtc, dateToUtc, customerId, billingPartyCustomerId, serviceLocationId, employeeId, jobStatus, invoiceStatus, offset, limit), cancellationToken));

    [HttpGet("customers/{customerId:guid}/service-history")]
    public async Task<ActionResult<IReadOnlyList<ServiceHistoryItemDto>>> GetCustomerServiceHistoryAsync(
        Guid customerId,
        [FromQuery] DateTime? dateFromUtc,
        [FromQuery] DateTime? dateToUtc,
        [FromQuery] Guid? billingPartyCustomerId,
        [FromQuery] Guid? serviceLocationId,
        [FromQuery] Guid? employeeId,
        [FromQuery] JobTicketStatus? jobStatus,
        [FromQuery] InvoiceStatus? invoiceStatus,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
        => Ok(await reportingService.GetCustomerServiceHistoryAsync(customerId, CreateFilters(dateFromUtc, dateToUtc, customerId, billingPartyCustomerId, serviceLocationId, employeeId, jobStatus, invoiceStatus, offset, limit), cancellationToken));

    [HttpGet("equipment/{equipmentId:guid}/service-history")]
    public async Task<ActionResult<IReadOnlyList<ServiceHistoryItemDto>>> GetEquipmentServiceHistoryAsync(
        Guid equipmentId,
        [FromQuery] DateTime? dateFromUtc,
        [FromQuery] DateTime? dateToUtc,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? billingPartyCustomerId,
        [FromQuery] Guid? serviceLocationId,
        [FromQuery] Guid? employeeId,
        [FromQuery] JobTicketStatus? jobStatus,
        [FromQuery] InvoiceStatus? invoiceStatus,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
        => Ok(await reportingService.GetEquipmentServiceHistoryAsync(equipmentId, CreateFilters(dateFromUtc, dateToUtc, customerId, billingPartyCustomerId, serviceLocationId, employeeId, jobStatus, invoiceStatus, offset, limit), cancellationToken));

    private static ReportQueryFiltersDto CreateFilters(
        DateTime? dateFromUtc,
        DateTime? dateToUtc,
        Guid? customerId,
        Guid? billingPartyCustomerId,
        Guid? serviceLocationId,
        Guid? employeeId,
        JobTicketStatus? jobStatus,
        InvoiceStatus? invoiceStatus,
        int offset,
        int limit)
        => new(dateFromUtc, dateToUtc, customerId, billingPartyCustomerId, serviceLocationId, employeeId, jobStatus, invoiceStatus, offset, limit);
}
