/**
 * Static definitions for the reports module:
 * report modes, column configs, filter configs, and pure helper functions.
 * Imported by ReportsPage — not part of any public barrel export.
 */
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/httpClient'
import { escapeCsvValue, toCsv, type CsvColumn } from '../../../utils/csv'
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

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReportMode =
  | 'invoiceReady'
  | 'jobCost'
  | 'jobsReady'
  | 'laborJob'
  | 'laborEmployee'
  | 'partsJob'
  | 'customerHistory'
  | 'equipmentHistory'

export type ReportRow =
  | InvoiceReadySummaryDto
  | JobCostSummaryDto
  | JobsReadyToInvoiceItemDto
  | LaborByJobDto
  | LaborByEmployeeDto
  | PartsByJobDto
  | ReportServiceHistoryItemDto

export type ReportColumn<T extends ReportRow> = CsvColumn<T> & {
  render?: (row: T) => string | JSX.Element
  align?: 'text' | 'number'
}

export type FilterField =
  | 'dateRange'
  | 'customer'
  | 'billingParty'
  | 'serviceLocation'
  | 'employee'
  | 'jobStatus'
  | 'invoiceStatus'
  | 'paging'

export type ReportSourceSelections = Partial<Record<ReportMode, string>>
export type ReportFiltersByMode = Partial<Record<ReportMode, ReportQueryFilters>>
export type ReportSavedDefaults = {
  filtersByMode?: ReportFiltersByMode
  sourceSelections?: ReportSourceSelections
}
export type ReportFilterLabels = {
  customers: Map<string, string>
  serviceLocations: Map<string, string>
  employees: Map<string, string>
}

// ── Report catalog ────────────────────────────────────────────────────────────

export const defaultFilters: ReportQueryFilters = { offset: 0, limit: 50 }

export const reportTitleMap: Record<ReportMode, string> = {
  invoiceReady: 'Invoice-ready Summary',
  jobCost: 'Job Cost Summary',
  jobsReady: 'Jobs Ready to Invoice',
  laborJob: 'Labor by Job',
  laborEmployee: 'Labor by Employee',
  partsJob: 'Parts by Job',
  customerHistory: 'Customer Service History',
  equipmentHistory: 'Equipment Service History'
}

export const reportDescriptions: Record<ReportMode, string> = {
  invoiceReady: 'Invoice-ready totals for a single job ticket — approved labor, parts used, and billable amounts.',
  jobCost: 'Cost breakdown for a single job ticket — approved labor hours, parts used, and running totals.',
  jobsReady: 'Jobs with approved billable activity that are ready for invoice review. Filter by date, customer, status, or billing party.',
  laborJob: 'Approved time entries grouped by job ticket, with hours and billable totals for each assignment.',
  laborEmployee: 'Approved time entries grouped by employee, showing total hours and billable time per worker.',
  partsJob: 'Approved parts used on each job, with quantities and billable price totals per ticket.',
  customerHistory: 'Complete service record for a selected customer — all tickets, statuses, and dates.',
  equipmentHistory: 'Complete service record for a selected piece of equipment — all tickets, statuses, and dates.'
}

export const reportSections: Array<{ title: string; description: string; modes: ReportMode[] }> = [
  {
    title: 'Invoice and Closeout',
    description: 'Review jobs ready for invoicing and pull cost summaries for individual tickets.',
    modes: ['invoiceReady', 'jobCost', 'jobsReady']
  },
  {
    title: 'Labor and Parts',
    description: 'Review approved time and parts totals by job or employee, ready to export.',
    modes: ['laborJob', 'laborEmployee', 'partsJob']
  },
  {
    title: 'Service History',
    description: 'Look up the complete service record for a customer or piece of equipment.',
    modes: ['customerHistory', 'equipmentHistory']
  }
]

export const reportFilterFields: Record<ReportMode, FilterField[]> = {
  invoiceReady: [],
  jobCost: [],
  jobsReady: ['dateRange', 'customer', 'billingParty', 'serviceLocation', 'jobStatus', 'invoiceStatus', 'paging'],
  laborJob: ['dateRange', 'customer', 'serviceLocation', 'employee', 'jobStatus', 'paging'],
  laborEmployee: ['dateRange', 'customer', 'employee', 'jobStatus', 'paging'],
  partsJob: ['dateRange', 'customer', 'serviceLocation', 'jobStatus', 'paging'],
  customerHistory: ['dateRange', 'jobStatus', 'paging'],
  equipmentHistory: ['dateRange', 'customer', 'jobStatus', 'paging']
}

export const reportBrandName = 'Job Ticket System'

// ── Saved defaults (localStorage) ────────────────────────────────────────────

const reportDefaultsStorageKey = 'job-ticket-system:manager-reports:defaults:v1'

export const isReportMode = (value: string): value is ReportMode =>
  Object.prototype.hasOwnProperty.call(reportTitleMap, value)

const hasSavedDefaults = (defaults: ReportSavedDefaults) =>
  Object.keys(defaults.filtersByMode ?? {}).length > 0 ||
  Object.keys(defaults.sourceSelections ?? {}).length > 0

export const readSavedReportDefaults = (): ReportSavedDefaults => {
  if (typeof localStorage === 'undefined') return {}
  try {
    const saved = localStorage.getItem(reportDefaultsStorageKey)
    if (!saved) return {}
    const parsed = JSON.parse(saved) as ReportSavedDefaults
    const filtersByMode = Object.fromEntries(
      Object.entries(parsed.filtersByMode ?? {}).filter(([mode]) => isReportMode(mode))
    ) as ReportFiltersByMode
    const sourceSelections = Object.fromEntries(
      Object.entries(parsed.sourceSelections ?? {}).filter(([mode, value]) => isReportMode(mode) && typeof value === 'string')
    ) as ReportSourceSelections
    return { filtersByMode, sourceSelections }
  } catch {
    return {}
  }
}

export const writeSavedReportDefaults = (defaults: ReportSavedDefaults) => {
  if (typeof localStorage === 'undefined') return
  if (!hasSavedDefaults(defaults)) {
    localStorage.removeItem(reportDefaultsStorageKey)
    return
  }
  localStorage.setItem(reportDefaultsStorageKey, JSON.stringify(defaults))
}

export const clearSavedReportDefaults = () => {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(reportDefaultsStorageKey)
}

// ── Formatters ────────────────────────────────────────────────────────────────

export const money = (value?: number | null) =>
  typeof value === 'number' ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '-'

export const quantity = (value?: number | null) =>
  typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'

export const hours = (value?: number | null) =>
  typeof value === 'number' ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} h` : '-'

export const dateForExport = (value?: string | null) => (value ? value.slice(0, 10) : '')

export const dateUtc = (value?: string | null) => (value ? dateForExport(value) : '-')

export const getJobStatusLabel = (value: number) => {
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

export const getInvoiceStatusLabel = (value: number) => {
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

// ── Column link renderers ─────────────────────────────────────────────────────

export const jobLink = (id: string, label: string) =>
  <Link to={`/manage/job-tickets/${id}`}>{label}</Link>

export const managerListLink = (to: string, label?: string | null) =>
  label ? <Link to={to}>{label}</Link> : '-'

// ── Column definitions ────────────────────────────────────────────────────────

export const columnsByMode: Record<ReportMode, ReportColumn<any>[]> = {
  invoiceReady: [
    { header: 'Job Ticket', value: (row: InvoiceReadySummaryDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: InvoiceReadySummaryDto) => row.customer },
    { header: 'Billing Party', value: (row: InvoiceReadySummaryDto) => row.billingPartyCustomer },
    { header: 'Service Location', value: (row: InvoiceReadySummaryDto) => row.serviceLocation },
    { header: 'Equipment', value: (row: InvoiceReadySummaryDto) => row.equipment ?? '' },
    { header: 'Job Status', value: (row: InvoiceReadySummaryDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Invoice Status', value: (row: InvoiceReadySummaryDto) => getInvoiceStatusLabel(row.invoiceStatus) },
    { header: 'Approved Labor Hours', value: (row: InvoiceReadySummaryDto) => row.laborHours, render: (row) => hours(row.laborHours), align: 'number' },
    { header: 'Labor Billable', value: (row: InvoiceReadySummaryDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
    { header: 'Parts Billable', value: (row: InvoiceReadySummaryDto) => row.partsBillableTotal, render: (row) => money(row.partsBillableTotal), align: 'number' },
    { header: 'Tax', value: (row: InvoiceReadySummaryDto) => row.tax, render: (row) => money(row.tax), align: 'number' },
    { header: 'Grand Total', value: (row: InvoiceReadySummaryDto) => row.grandTotal, render: (row) => money(row.grandTotal), align: 'number' }
  ],
  jobCost: [
    { header: 'Job Ticket', value: (row: JobCostSummaryDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Approved Labor Hours', value: (row: JobCostSummaryDto) => row.laborHours, render: (row) => hours(row.laborHours), align: 'number' },
    { header: 'Labor Cost', value: (row: JobCostSummaryDto) => row.laborCostTotal, render: (row) => money(row.laborCostTotal), align: 'number' },
    { header: 'Labor Billable', value: (row: JobCostSummaryDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
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
    { header: 'Created (UTC)', value: (row: JobsReadyToInvoiceItemDto) => dateForExport(row.createdAtUtc), render: (row) => dateUtc(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: JobsReadyToInvoiceItemDto) => dateForExport(row.completedAtUtc), render: (row) => dateUtc(row.completedAtUtc) }
  ],
  laborJob: [
    { header: 'Job Ticket', value: (row: LaborByJobDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: LaborByJobDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Approved Labor Hours', value: (row: LaborByJobDto) => row.approvedLaborHours, render: (row) => hours(row.approvedLaborHours), align: 'number' },
    { header: 'Labor Cost', value: (row: LaborByJobDto) => row.laborCostTotal, render: (row) => money(row.laborCostTotal), align: 'number' },
    { header: 'Labor Billable', value: (row: LaborByJobDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
    { header: 'Created (UTC)', value: (row: LaborByJobDto) => dateForExport(row.createdAtUtc), render: (row) => dateUtc(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: LaborByJobDto) => dateForExport(row.completedAtUtc), render: (row) => dateUtc(row.completedAtUtc) }
  ],
  laborEmployee: [
    { header: 'Employee', value: (row: LaborByEmployeeDto) => row.employeeName },
    { header: 'Approved Labor Hours', value: (row: LaborByEmployeeDto) => row.approvedLaborHours, render: (row) => hours(row.approvedLaborHours), align: 'number' },
    { header: 'Labor Cost', value: (row: LaborByEmployeeDto) => row.laborCostTotal, render: (row) => money(row.laborCostTotal), align: 'number' },
    { header: 'Labor Billable', value: (row: LaborByEmployeeDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
    { header: 'Job Count', value: (row: LaborByEmployeeDto) => row.jobCount, align: 'number' }
  ],
  partsJob: [
    { header: 'Job Ticket', value: (row: PartsByJobDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: PartsByJobDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Approved Part Quantity', value: (row: PartsByJobDto) => row.approvedPartQuantity, render: (row) => quantity(row.approvedPartQuantity), align: 'number' },
    { header: 'Parts Cost', value: (row: PartsByJobDto) => row.partsCostTotal, render: (row) => money(row.partsCostTotal), align: 'number' },
    { header: 'Parts Billable', value: (row: PartsByJobDto) => row.partsBillableTotal, render: (row) => money(row.partsBillableTotal), align: 'number' },
    { header: 'Created (UTC)', value: (row: PartsByJobDto) => dateForExport(row.createdAtUtc), render: (row) => dateUtc(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: PartsByJobDto) => dateForExport(row.completedAtUtc), render: (row) => dateUtc(row.completedAtUtc) }
  ],
  customerHistory: [
    { header: 'Job Ticket', value: (row: ReportServiceHistoryItemDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: ReportServiceHistoryItemDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Equipment', value: (row: ReportServiceHistoryItemDto) => row.equipment ?? '', render: (row) => managerListLink('/manage/equipment', row.equipment) },
    { header: 'Title', value: (row: ReportServiceHistoryItemDto) => row.title },
    { header: 'Job Status', value: (row: ReportServiceHistoryItemDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Created (UTC)', value: (row: ReportServiceHistoryItemDto) => dateForExport(row.createdAtUtc), render: (row) => dateUtc(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: ReportServiceHistoryItemDto) => dateForExport(row.completedAtUtc), render: (row) => dateUtc(row.completedAtUtc) }
  ],
  equipmentHistory: [
    { header: 'Job Ticket', value: (row: ReportServiceHistoryItemDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: ReportServiceHistoryItemDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Equipment', value: (row: ReportServiceHistoryItemDto) => row.equipment ?? '', render: (row) => managerListLink('/manage/equipment', row.equipment) },
    { header: 'Title', value: (row: ReportServiceHistoryItemDto) => row.title },
    { header: 'Job Status', value: (row: ReportServiceHistoryItemDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Created (UTC)', value: (row: ReportServiceHistoryItemDto) => dateForExport(row.createdAtUtc), render: (row) => dateUtc(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: ReportServiceHistoryItemDto) => dateForExport(row.completedAtUtc), render: (row) => dateUtc(row.completedAtUtc) }
  ]
}

// ── Filter utilities ──────────────────────────────────────────────────────────

export const userMessageForReportError = (requestError: unknown) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return 'The report filters could not be applied. Check IDs, dates, and status values, then try again.'
    if (requestError.status === 401 || requestError.status === 403) return 'You do not have permission to run manager reports.'
    if (requestError.status === 404) return 'No report source was found for the selected ID.'
    if (requestError.status >= 500) return 'The server could not generate this report right now. Please try again later.'
  }
  return 'Unable to load report data.'
}

export const reportUsesField = (mode: ReportMode, field: FilterField) =>
  reportFilterFields[mode].includes(field)

export const filtersForMode = (mode: ReportMode, filters: ReportQueryFilters): ReportQueryFilters => {
  if (!reportFilterFields[mode].length) return {}
  const scoped: ReportQueryFilters = {
    offset: filters.offset ?? defaultFilters.offset,
    limit: filters.limit ?? defaultFilters.limit
  }
  if (reportUsesField(mode, 'dateRange')) { scoped.dateFromUtc = filters.dateFromUtc; scoped.dateToUtc = filters.dateToUtc }
  if (reportUsesField(mode, 'customer')) scoped.customerId = filters.customerId
  if (reportUsesField(mode, 'billingParty')) scoped.billingPartyCustomerId = filters.billingPartyCustomerId
  if (reportUsesField(mode, 'serviceLocation')) scoped.serviceLocationId = filters.serviceLocationId
  if (reportUsesField(mode, 'employee')) scoped.employeeId = filters.employeeId
  if (reportUsesField(mode, 'jobStatus')) scoped.jobStatus = filters.jobStatus
  if (reportUsesField(mode, 'invoiceStatus')) scoped.invoiceStatus = filters.invoiceStatus
  return scoped
}

export const buildFilterSummary = (
  mode: ReportMode,
  filters: ReportQueryFilters,
  labels: ReportFilterLabels,
  sourceLabel?: string
) => {
  const summary: string[] = []
  if (sourceLabel) summary.push(`Source: ${sourceLabel}`)
  if (filters.dateFromUtc || filters.dateToUtc) summary.push(`Dates: ${dateUtc(filters.dateFromUtc)} to ${dateUtc(filters.dateToUtc)}`)
  if (filters.customerId) summary.push(`Customer: ${labels.customers.get(filters.customerId) ?? 'Customer unavailable'}`)
  if (filters.billingPartyCustomerId) summary.push(`Billing party: ${labels.customers.get(filters.billingPartyCustomerId) ?? 'Billing party unavailable'}`)
  if (filters.serviceLocationId) summary.push(`Service location: ${labels.serviceLocations.get(filters.serviceLocationId) ?? 'Location unavailable'}`)
  if (filters.employeeId) summary.push(`Employee: ${labels.employees.get(filters.employeeId) ?? 'Employee unavailable'}`)
  if (typeof filters.jobStatus === 'number') summary.push(`Job status: ${getJobStatusLabel(filters.jobStatus)}`)
  if (typeof filters.invoiceStatus === 'number') summary.push(`Invoice status: ${getInvoiceStatusLabel(filters.invoiceStatus)}`)
  if (filters.offset) summary.push(`Offset: ${filters.offset}`)
  if ((filters.limit ?? defaultFilters.limit) !== defaultFilters.limit) summary.push(`Limit: ${filters.limit}`)
  return summary.length
    ? summary.join(' | ')
    : reportFilterFields[mode].length
      ? 'No filters are active. Showing the default 50-row window.'
      : 'This report is scoped to the selected source record.'
}

// ── CSV / export helpers ──────────────────────────────────────────────────────

export const reportSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loaded-rows'

export const csvFileName = (title: string, dateStamp?: string | null) =>
  `report-${reportSlug(title)}${dateStamp ? `-${dateStamp}` : ''}.csv`

export const generatedAtLabel = () => new Date().toLocaleString()

export const generatedDateStamp = () => new Date().toISOString().slice(0, 10)

export const reportCsvWithMetadata = (
  title: string,
  generatedAt: string | null,
  filterSummary: string,
  companyName: string,
  companyDetails: string[],
  rows: ReportRow[],
  columns: Array<ReportColumn<ReportRow>>
) => {
  if (!rows.length || !columns.length) return ''
  const metadataRows = [
    ['Company', companyName],
    ['Company details', companyDetails.join(' | ')],
    ['Report', title],
    ['Generated', generatedAt ?? ''],
    ['Applied scope', filterSummary],
    ['Visible rows', rows.length]
  ].map((row) => row.map((value) => escapeCsvValue(value)).join(','))
  return [...metadataRows, '', toCsv(rows, columns)].join('\n')
}
