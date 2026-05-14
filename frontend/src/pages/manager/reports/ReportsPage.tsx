import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/httpClient'
import { reportsApi } from '../../../api/reportsApi'
import { csvDataUri, toCsv, type CsvColumn } from '../../../utils/csv'
import type {
  InvoiceReadySummaryDto,
  JobCostSummaryDto,
  JobsReadyToInvoiceItemDto,
  LaborByEmployeeDto,
  LaborByJobDto,
  PartsByJobDto,
  ReportQueryFilters,
  ReportServiceHistoryItemDto
} from '../../../types'
import { Errorable } from '../common/Errorable'

type ReportMode = 'invoiceReady' | 'jobCost' | 'jobsReady' | 'laborJob' | 'laborEmployee' | 'partsJob' | 'customerHistory' | 'equipmentHistory'
type ReportRow = InvoiceReadySummaryDto | JobCostSummaryDto | JobsReadyToInvoiceItemDto | LaborByJobDto | LaborByEmployeeDto | PartsByJobDto | ReportServiceHistoryItemDto

type ReportColumn<T extends ReportRow> = CsvColumn<T> & {
  render?: (row: T) => string | JSX.Element
  align?: 'text' | 'number'
}

const reportTitleMap: Record<ReportMode, string> = {
  invoiceReady: 'Invoice-ready Summary',
  jobCost: 'Job Cost Summary',
  jobsReady: 'Jobs Ready to Invoice',
  laborJob: 'Labor by Job',
  laborEmployee: 'Labor by Employee',
  partsJob: 'Parts by Job',
  customerHistory: 'Customer Service History',
  equipmentHistory: 'Equipment Service History'
}

const reportDescriptions: Record<ReportMode, string> = {
  invoiceReady: 'One invoice-ready job summary with approved labor and approved parts totals.',
  jobCost: 'One job cost summary showing labor, parts, and grand total.',
  jobsReady: 'Jobs that have approved billable activity and are ready for invoice review.',
  laborJob: 'Approved labor totals grouped by job ticket.',
  laborEmployee: 'Approved labor totals grouped by employee.',
  partsJob: 'Approved job-part quantity and snapshot price totals grouped by job.',
  customerHistory: 'Service history for a selected customer.',
  equipmentHistory: 'Service history for selected equipment.'
}

const money = (value?: number | null) => typeof value === 'number' ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—'
const quantity = (value?: number | null) => typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'
const hours = (value?: number | null) => typeof value === 'number' ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} h` : '—'
const dateOnly = (value?: string | null) => value ? new Date(value).toLocaleDateString() : '—'
const dateForExport = (value?: string | null) => value ? value.slice(0, 10) : ''

const getJobStatusLabel = (value: number) => {
  switch (value) {
    case 1: return 'Draft'
    case 2: return 'Submitted'
    case 3: return 'Assigned'
    case 4: return 'In Progress'
    case 5: return 'Waiting on Parts'
    case 6: return 'Waiting on Customer'
    case 7: return 'Completed'
    case 8: return 'Cancelled'
    case 9: return 'Invoiced'
    case 10: return 'Reviewed'
    default: return `Status ${value}`
  }
}

const getInvoiceStatusLabel = (value: number) => {
  switch (value) {
    case 1: return 'Not Ready'
    case 2: return 'Ready'
    case 3: return 'Drafted'
    case 4: return 'Sent'
    case 5: return 'Paid'
    case 6: return 'Void'
    default: return `Status ${value}`
  }
}

const jobLink = (id: string, label: string) => <Link to={`/manage/job-tickets/${id}`}>{label}</Link>
const managerListLink = (to: string, label?: string | null) => label ? <Link to={to}>{label}</Link> : '—'

const columnsByMode: Record<ReportMode, ReportColumn<any>[]> = {
  invoiceReady: [
    { header: 'Job Ticket', value: (row: InvoiceReadySummaryDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: InvoiceReadySummaryDto) => row.customer },
    { header: 'Billing Party', value: (row: InvoiceReadySummaryDto) => row.billingPartyCustomer },
    { header: 'Service Location', value: (row: InvoiceReadySummaryDto) => row.serviceLocation },
    { header: 'Equipment', value: (row: InvoiceReadySummaryDto) => row.equipment ?? '' },
    { header: 'Job Status', value: (row: InvoiceReadySummaryDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Invoice Status', value: (row: InvoiceReadySummaryDto) => getInvoiceStatusLabel(row.invoiceStatus) },
    { header: 'Approved Labor Hours', value: (row: InvoiceReadySummaryDto) => row.laborHours, render: (row) => hours(row.laborHours), align: 'number' },
    { header: 'Labor Billable (Snapshot/Fallback)', value: (row: InvoiceReadySummaryDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
    { header: 'Parts Billable', value: (row: InvoiceReadySummaryDto) => row.partsBillableTotal, render: (row) => money(row.partsBillableTotal), align: 'number' },
    { header: 'Tax', value: (row: InvoiceReadySummaryDto) => row.tax, render: (row) => money(row.tax), align: 'number' },
    { header: 'Grand Total', value: (row: InvoiceReadySummaryDto) => row.grandTotal, render: (row) => money(row.grandTotal), align: 'number' }
  ],
  jobCost: [
    { header: 'Job Ticket', value: (row: JobCostSummaryDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Approved Labor Hours', value: (row: JobCostSummaryDto) => row.laborHours, render: (row) => hours(row.laborHours), align: 'number' },
    { header: 'Labor Cost (Snapshot/Fallback)', value: (row: JobCostSummaryDto) => row.laborCostTotal, render: (row) => money(row.laborCostTotal), align: 'number' },
    { header: 'Labor Billable (Snapshot/Fallback)', value: (row: JobCostSummaryDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
    { header: 'Parts Cost', value: (row: JobCostSummaryDto) => row.partsCostTotal, render: (row) => money(row.partsCostTotal), align: 'number' },
    { header: 'Parts Billable', value: (row: JobCostSummaryDto) => row.partsBillableTotal, render: (row) => money(row.partsBillableTotal), align: 'number' },
    { header: 'Grand Total', value: (row: JobCostSummaryDto) => row.grandTotal, render: (row) => money(row.grandTotal), align: 'number' }
  ],
  jobsReady: [
    { header: 'Job Ticket', value: (row: JobsReadyToInvoiceItemDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: JobsReadyToInvoiceItemDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Billing Party', value: (row: JobsReadyToInvoiceItemDto) => row.billingPartyCustomer },
    { header: 'Job Status', value: (row: JobsReadyToInvoiceItemDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Invoice Status', value: (row: JobsReadyToInvoiceItemDto) => getInvoiceStatusLabel(row.invoiceStatus) },
    { header: 'Approved Labor Hours', value: (row: JobsReadyToInvoiceItemDto) => row.approvedLaborHours, render: (row) => hours(row.approvedLaborHours), align: 'number' },
    { header: 'Approved Parts Qty', value: (row: JobsReadyToInvoiceItemDto) => row.approvedPartsCount, render: (row) => quantity(row.approvedPartsCount), align: 'number' },
    { header: 'Estimated Billable Total', value: (row: JobsReadyToInvoiceItemDto) => row.estimatedBillableTotal, render: (row) => money(row.estimatedBillableTotal), align: 'number' },
    { header: 'Created (UTC)', value: (row: JobsReadyToInvoiceItemDto) => dateForExport(row.createdAtUtc), render: (row) => dateOnly(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: JobsReadyToInvoiceItemDto) => dateForExport(row.completedAtUtc), render: (row) => dateOnly(row.completedAtUtc) }
  ],
  laborJob: [
    { header: 'Job Ticket', value: (row: LaborByJobDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: LaborByJobDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Approved Labor Hours', value: (row: LaborByJobDto) => row.approvedLaborHours, render: (row) => hours(row.approvedLaborHours), align: 'number' },
    { header: 'Labor Cost (Snapshot/Fallback)', value: (row: LaborByJobDto) => row.laborCostTotal, render: (row) => money(row.laborCostTotal), align: 'number' },
    { header: 'Labor Billable (Snapshot/Fallback)', value: (row: LaborByJobDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
    { header: 'Created (UTC)', value: (row: LaborByJobDto) => dateForExport(row.createdAtUtc), render: (row) => dateOnly(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: LaborByJobDto) => dateForExport(row.completedAtUtc), render: (row) => dateOnly(row.completedAtUtc) }
  ],
  laborEmployee: [
    { header: 'Employee', value: (row: LaborByEmployeeDto) => row.employeeName },
    { header: 'Approved Labor Hours', value: (row: LaborByEmployeeDto) => row.approvedLaborHours, render: (row) => hours(row.approvedLaborHours), align: 'number' },
    { header: 'Labor Cost (Snapshot/Fallback)', value: (row: LaborByEmployeeDto) => row.laborCostTotal, render: (row) => money(row.laborCostTotal), align: 'number' },
    { header: 'Labor Billable (Snapshot/Fallback)', value: (row: LaborByEmployeeDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
    { header: 'Job Count', value: (row: LaborByEmployeeDto) => row.jobCount, align: 'number' }
  ],
  partsJob: [
    { header: 'Job Ticket', value: (row: PartsByJobDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: PartsByJobDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Approved Part Quantity', value: (row: PartsByJobDto) => row.approvedPartQuantity, render: (row) => quantity(row.approvedPartQuantity), align: 'number' },
    { header: 'Parts Cost', value: (row: PartsByJobDto) => row.partsCostTotal, render: (row) => money(row.partsCostTotal), align: 'number' },
    { header: 'Parts Billable', value: (row: PartsByJobDto) => row.partsBillableTotal, render: (row) => money(row.partsBillableTotal), align: 'number' },
    { header: 'Created (UTC)', value: (row: PartsByJobDto) => dateForExport(row.createdAtUtc), render: (row) => dateOnly(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: PartsByJobDto) => dateForExport(row.completedAtUtc), render: (row) => dateOnly(row.completedAtUtc) }
  ],
  customerHistory: [
    { header: 'Job Ticket', value: (row: ReportServiceHistoryItemDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: ReportServiceHistoryItemDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Equipment', value: (row: ReportServiceHistoryItemDto) => row.equipment ?? '', render: (row) => managerListLink('/manage/equipment', row.equipment) },
    { header: 'Title', value: (row: ReportServiceHistoryItemDto) => row.title },
    { header: 'Job Status', value: (row: ReportServiceHistoryItemDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Created (UTC)', value: (row: ReportServiceHistoryItemDto) => dateForExport(row.createdAtUtc), render: (row) => dateOnly(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: ReportServiceHistoryItemDto) => dateForExport(row.completedAtUtc), render: (row) => dateOnly(row.completedAtUtc) }
  ],
  equipmentHistory: [
    { header: 'Job Ticket', value: (row: ReportServiceHistoryItemDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: ReportServiceHistoryItemDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Equipment', value: (row: ReportServiceHistoryItemDto) => row.equipment ?? '', render: (row) => managerListLink('/manage/equipment', row.equipment) },
    { header: 'Title', value: (row: ReportServiceHistoryItemDto) => row.title },
    { header: 'Job Status', value: (row: ReportServiceHistoryItemDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Created (UTC)', value: (row: ReportServiceHistoryItemDto) => dateForExport(row.createdAtUtc), render: (row) => dateOnly(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: ReportServiceHistoryItemDto) => dateForExport(row.completedAtUtc), render: (row) => dateOnly(row.completedAtUtc) }
  ]
}

const reportModes: ReportMode[] = ['invoiceReady', 'jobCost', 'jobsReady', 'laborJob', 'laborEmployee', 'partsJob', 'customerHistory', 'equipmentHistory']

const userMessageForReportError = (requestError: unknown) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return 'The report filters could not be applied. Check IDs, dates, and status values, then try again.'
    if (requestError.status === 401 || requestError.status === 403) return 'You do not have permission to run manager reports.'
    if (requestError.status === 404) return 'No report source was found for the selected ID.'
    if (requestError.status >= 500) return 'The server could not generate this report right now. Please try again later.'
  }

  return 'Unable to load report data.'
}

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportQueryFilters>({ offset: 0, limit: 50 })
  const [customerId, setCustomerId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [jobId, setJobId] = useState('')
  const [rows, setRows] = useState<ReportRow[]>([])
  const [mode, setMode] = useState<ReportMode | null>(null)
  const [loadingMode, setLoadingMode] = useState<ReportMode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apply = async (nextMode: ReportMode) => {
    if ((nextMode === 'invoiceReady' || nextMode === 'jobCost') && !jobId.trim()) {
      setError('Enter a job ticket id before running this report.')
      return
    }

    if (nextMode === 'customerHistory' && !customerId.trim()) {
      setError('Enter a customer id before running customer service history.')
      return
    }

    if (nextMode === 'equipmentHistory' && !equipmentId.trim()) {
      setError('Enter an equipment id before running equipment service history.')
      return
    }

    try {
      setError(null)
      setLoadingMode(nextMode)
      setRows([])
      setMode(nextMode)

      const data = nextMode === 'invoiceReady' ? [await reportsApi.getInvoiceReadySummary(jobId.trim())]
        : nextMode === 'jobsReady' ? await reportsApi.getJobsReadyToInvoice(filters)
        : nextMode === 'laborJob' ? await reportsApi.getLaborByJob(filters)
        : nextMode === 'laborEmployee' ? await reportsApi.getLaborByEmployee(filters)
        : nextMode === 'partsJob' ? await reportsApi.getPartsByJob(filters)
        : nextMode === 'jobCost' ? [await reportsApi.getCostSummary(jobId.trim())]
        : nextMode === 'customerHistory' ? await reportsApi.getCustomerHistory(customerId.trim(), filters)
        : await reportsApi.getEquipmentHistory(equipmentId.trim(), filters)

      setRows(data as ReportRow[])
    } catch (requestError) {
      setError(userMessageForReportError(requestError))
    } finally {
      setLoadingMode(null)
    }
  }

  const columns = mode ? columnsByMode[mode] : []
  const title = mode ? reportTitleMap[mode] : ''
  const csv = useMemo(() => toCsv(rows, columns), [rows, columns])
  const csvHref = useMemo(() => csvDataUri(csv), [csv])
  const hasRows = rows.length > 0

  return <section className="card stack"><h2>Reports</h2><p className="muted">Manager/Admin report hub for invoice readiness, job costs, labor, parts, customer history, and equipment history.</p><p className="muted">Labor totals are labeled as Snapshot/Fallback because approved time entries use captured cost/bill rates first; legacy entries with null snapshots fall back to documented employee rates.</p><Errorable error={error} /><div className="report-grid" aria-label="Available reports">{reportModes.map((reportMode) => <article className="report-card" key={reportMode}><h3>{reportTitleMap[reportMode]}</h3><p className="muted">{reportDescriptions[reportMode]}</p><button type="button" onClick={() => apply(reportMode)} disabled={loadingMode !== null}>{loadingMode === reportMode ? 'Loading…' : `Run ${reportTitleMap[reportMode]}`}</button></article>)}</div><article className="card stack"><h3>Supported filters</h3><p className="muted">Shared report endpoints support UTC date range, customer, billing party, service location, employee, job status, invoice status, offset, and limit. Invoice-ready and job cost summaries use the selected job ticket id. Customer and equipment history require their source IDs.</p><div className="report-filters"><label>From date<input aria-label="From date" type="date" value={filters.dateFromUtc?.slice(0, 10) ?? ''} onChange={(e) => setFilters({ ...filters, dateFromUtc: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })} /></label><label>To date<input aria-label="To date" type="date" value={filters.dateToUtc?.slice(0, 10) ?? ''} onChange={(e) => setFilters({ ...filters, dateToUtc: e.target.value ? `${e.target.value}T23:59:59Z` : undefined })} /></label><label>Customer id<input aria-label="Customer id" placeholder="Customer id" value={filters.customerId ?? ''} onChange={(e) => setFilters({ ...filters, customerId: e.target.value || undefined })} /></label><label>Billing customer id<input aria-label="Billing customer id" placeholder="Billing customer id" value={filters.billingPartyCustomerId ?? ''} onChange={(e) => setFilters({ ...filters, billingPartyCustomerId: e.target.value || undefined })} /></label><label>Service location id<input aria-label="Service location id" placeholder="Service location id" value={filters.serviceLocationId ?? ''} onChange={(e) => setFilters({ ...filters, serviceLocationId: e.target.value || undefined })} /></label><label>Employee id<input aria-label="Employee id" placeholder="Employee id" value={filters.employeeId ?? ''} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value || undefined })} /></label><label>Job status<select aria-label="Job status" value={filters.jobStatus ?? ''} onChange={(e) => setFilters({ ...filters, jobStatus: e.target.value ? Number(e.target.value) : undefined })}><option value="">Any job status</option><option value="7">Completed</option><option value="9">Invoiced</option><option value="10">Reviewed</option></select></label><label>Invoice status<select aria-label="Invoice status" value={filters.invoiceStatus ?? ''} onChange={(e) => setFilters({ ...filters, invoiceStatus: e.target.value ? Number(e.target.value) : undefined })}><option value="">Any invoice status</option><option value="1">Not Ready</option><option value="2">Ready</option><option value="3">Drafted</option><option value="4">Sent</option><option value="5">Paid</option><option value="6">Void</option></select></label><label>Offset<input aria-label="Offset" type="number" min={0} value={filters.offset ?? 0} onChange={(e) => setFilters({ ...filters, offset: Number(e.target.value) || 0 })} /></label><label>Limit<input aria-label="Limit" type="number" min={1} value={filters.limit ?? 50} onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) || 50 })} /></label></div><div className="report-filters"><label>Job ticket id<input aria-label="Job ticket id" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id" /></label><label>Customer history id<input aria-label="Customer history id" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer id for service history" /></label><label>Equipment history id<input aria-label="Equipment history id" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} placeholder="Equipment id for service history" /></label></div></article><article className="card stack" aria-live="polite"><div className="report-results-heading"><div><h3>{title || 'Select a report'}</h3><p className="muted">{mode ? `${rows.length} visible row${rows.length === 1 ? '' : 's'}` : 'Run a report from the hub to load export-friendly rows.'}</p></div>{hasRows ? <a className="button-link" href={csvHref} download={`report-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`}>Export loaded rows as CSV</a> : null}</div>{loadingMode ? <p className="muted">Loading {reportTitleMap[loadingMode]}…</p> : null}{mode && !loadingMode && !hasRows && !error ? <p className="muted">No rows match the current report and filters.</p> : null}{hasRows ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.header} className={column.align === 'number' ? 'numeric-cell' : undefined}>{column.header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column.header} className={column.align === 'number' ? 'numeric-cell' : undefined}>{column.render ? column.render(row as never) : column.value(row as never)}</td>)}</tr>)}</tbody></table></div> : null}</article></section>
}

