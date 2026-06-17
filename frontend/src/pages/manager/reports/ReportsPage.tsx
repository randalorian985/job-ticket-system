import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/httpClient'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { masterDataApi } from '../../../api/masterDataApi'
import { reportsApi } from '../../../api/reportsApi'
import { usersApi } from '../../../api/usersApi'
import { csvDataUri, toCsv, type CsvColumn } from '../../../utils/csv'
import type {
  AssignableEmployeeDto,
  CustomerDto,
  EquipmentDto,
  InvoiceReadySummaryDto,
  JobCostSummaryDto,
  JobTicketListItemDto,
  JobsReadyToInvoiceItemDto,
  LaborByEmployeeDto,
  LaborByJobDto,
  PartsByJobDto,
  ReportQueryFilters,
  ReportServiceHistoryItemDto,
  ServiceLocationDto
} from '../../../types'
import { Errorable } from '../common/Errorable'

type ReportMode =
  | 'invoiceReady'
  | 'jobCost'
  | 'jobsReady'
  | 'laborJob'
  | 'laborEmployee'
  | 'partsJob'
  | 'customerHistory'
  | 'equipmentHistory'

type ReportRow =
  | InvoiceReadySummaryDto
  | JobCostSummaryDto
  | JobsReadyToInvoiceItemDto
  | LaborByJobDto
  | LaborByEmployeeDto
  | PartsByJobDto
  | ReportServiceHistoryItemDto

type ReportColumn<T extends ReportRow> = CsvColumn<T> & {
  render?: (row: T) => string | JSX.Element
  align?: 'text' | 'number'
}

type FilterField =
  | 'dateRange'
  | 'customer'
  | 'billingParty'
  | 'serviceLocation'
  | 'employee'
  | 'jobStatus'
  | 'invoiceStatus'
  | 'paging'

const defaultFilters: ReportQueryFilters = { offset: 0, limit: 50 }
const snapshotLabel = 'time-entry labor-rate snapshot'

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
  invoiceReady: 'One invoice-ready job summary using the implemented job-ticket reporting API.',
  jobCost: 'One job cost summary using approved labor, approved parts, and the current API totals.',
  jobsReady: 'Jobs that have approved billable activity and are ready for invoice review.',
  laborJob: `Approved labor totals grouped by job ticket with ${snapshotLabel} values.`,
  laborEmployee: `Approved labor totals grouped by employee with ${snapshotLabel} values.`,
  partsJob: 'Approved job-part quantity and snapshot price totals grouped by job.',
  customerHistory: 'Service history for a selected customer.',
  equipmentHistory: 'Service history for selected equipment.'
}

const reportSections: Array<{ title: string, description: string, modes: ReportMode[] }> = [
  {
    title: 'Invoice and Closeout',
    description: 'Review invoice-ready jobs and single-ticket invoice/cost summaries from existing report APIs.',
    modes: ['invoiceReady', 'jobCost', 'jobsReady']
  },
  {
    title: 'Labor and Parts',
    description: 'Audit approved time and parts totals with export-friendly columns for operational review.',
    modes: ['laborJob', 'laborEmployee', 'partsJob']
  },
  {
    title: 'Service History',
    description: 'Review service history for a selected customer or piece of equipment.',
    modes: ['customerHistory', 'equipmentHistory']
  }
]

const reportFilterFields: Record<ReportMode, FilterField[]> = {
  invoiceReady: [],
  jobCost: [],
  jobsReady: ['dateRange', 'customer', 'billingParty', 'serviceLocation', 'jobStatus', 'invoiceStatus', 'paging'],
  laborJob: ['dateRange', 'customer', 'serviceLocation', 'employee', 'jobStatus', 'paging'],
  laborEmployee: ['dateRange', 'customer', 'employee', 'jobStatus', 'paging'],
  partsJob: ['dateRange', 'customer', 'serviceLocation', 'jobStatus', 'paging'],
  customerHistory: ['dateRange', 'jobStatus', 'paging'],
  equipmentHistory: ['dateRange', 'jobStatus', 'paging']
}

type ReportSourceSelections = Partial<Record<ReportMode, string>>
type ReportFiltersByMode = Partial<Record<ReportMode, ReportQueryFilters>>

const money = (value?: number | null) =>
  typeof value === 'number' ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '-'
const quantity = (value?: number | null) =>
  typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'
const hours = (value?: number | null) =>
  typeof value === 'number' ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} h` : '-'
const dateForExport = (value?: string | null) => (value ? value.slice(0, 10) : '')
const dateUtc = (value?: string | null) => (value ? dateForExport(value) : '-')

const getJobStatusLabel = (value: number) => {
  switch (value) {
    case 1:
      return 'Draft'
    case 2:
      return 'Submitted'
    case 3:
      return 'Assigned'
    case 4:
      return 'In Progress'
    case 5:
      return 'Waiting on Parts'
    case 6:
      return 'Waiting on Customer'
    case 7:
      return 'Completed'
    case 8:
      return 'Cancelled'
    case 9:
      return 'Invoiced'
    case 10:
      return 'Reviewed'
    default:
      return `Status ${value}`
  }
}

const getInvoiceStatusLabel = (value: number) => {
  switch (value) {
    case 1:
      return 'Not Ready'
    case 2:
      return 'Ready'
    case 3:
      return 'Drafted'
    case 4:
      return 'Sent'
    case 5:
      return 'Paid'
    case 6:
      return 'Void'
    default:
      return `Status ${value}`
  }
}

const jobLink = (id: string, label: string) => <Link to={`/manage/job-tickets/${id}`}>{label}</Link>
const managerListLink = (to: string, label?: string | null) => (label ? <Link to={to}>{label}</Link> : '-')

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
    { header: 'Labor Billable (time-entry labor-rate snapshot)', value: (row: InvoiceReadySummaryDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
    { header: 'Parts Billable', value: (row: InvoiceReadySummaryDto) => row.partsBillableTotal, render: (row) => money(row.partsBillableTotal), align: 'number' },
    { header: 'Tax', value: (row: InvoiceReadySummaryDto) => row.tax, render: (row) => money(row.tax), align: 'number' },
    { header: 'Grand Total', value: (row: InvoiceReadySummaryDto) => row.grandTotal, render: (row) => money(row.grandTotal), align: 'number' }
  ],
  jobCost: [
    { header: 'Job Ticket', value: (row: JobCostSummaryDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Approved Labor Hours', value: (row: JobCostSummaryDto) => row.laborHours, render: (row) => hours(row.laborHours), align: 'number' },
    { header: 'Labor Cost (time-entry labor-rate snapshot)', value: (row: JobCostSummaryDto) => row.laborCostTotal, render: (row) => money(row.laborCostTotal), align: 'number' },
    { header: 'Labor Billable (time-entry labor-rate snapshot)', value: (row: JobCostSummaryDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
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
    { header: 'Labor Cost (time-entry labor-rate snapshot)', value: (row: LaborByJobDto) => row.laborCostTotal, render: (row) => money(row.laborCostTotal), align: 'number' },
    { header: 'Labor Billable (time-entry labor-rate snapshot)', value: (row: LaborByJobDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
    { header: 'Created (UTC)', value: (row: LaborByJobDto) => dateForExport(row.createdAtUtc), render: (row) => dateUtc(row.createdAtUtc) },
    { header: 'Completed (UTC)', value: (row: LaborByJobDto) => dateForExport(row.completedAtUtc), render: (row) => dateUtc(row.completedAtUtc) }
  ],
  laborEmployee: [
    { header: 'Employee', value: (row: LaborByEmployeeDto) => row.employeeName },
    { header: 'Approved Labor Hours', value: (row: LaborByEmployeeDto) => row.approvedLaborHours, render: (row) => hours(row.approvedLaborHours), align: 'number' },
    { header: 'Labor Cost (time-entry labor-rate snapshot)', value: (row: LaborByEmployeeDto) => row.laborCostTotal, render: (row) => money(row.laborCostTotal), align: 'number' },
    { header: 'Labor Billable (time-entry labor-rate snapshot)', value: (row: LaborByEmployeeDto) => row.laborBillableTotal, render: (row) => money(row.laborBillableTotal), align: 'number' },
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

const userMessageForReportError = (requestError: unknown) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return 'The report filters could not be applied. Check IDs, dates, and status values, then try again.'
    if (requestError.status === 401 || requestError.status === 403) return 'You do not have permission to run manager reports.'
    if (requestError.status === 404) return 'No report source was found for the selected ID.'
    if (requestError.status >= 500) return 'The server could not generate this report right now. Please try again later.'
  }

  return 'Unable to load report data.'
}

const reportUsesField = (mode: ReportMode, field: FilterField) => reportFilterFields[mode].includes(field)

const filtersForMode = (mode: ReportMode, filters: ReportQueryFilters): ReportQueryFilters => {
  if (!reportFilterFields[mode].length) return {}

  const scoped: ReportQueryFilters = {
    offset: filters.offset ?? defaultFilters.offset,
    limit: filters.limit ?? defaultFilters.limit
  }

  if (reportUsesField(mode, 'dateRange')) {
    scoped.dateFromUtc = filters.dateFromUtc
    scoped.dateToUtc = filters.dateToUtc
  }
  if (reportUsesField(mode, 'customer')) scoped.customerId = filters.customerId
  if (reportUsesField(mode, 'billingParty')) scoped.billingPartyCustomerId = filters.billingPartyCustomerId
  if (reportUsesField(mode, 'serviceLocation')) scoped.serviceLocationId = filters.serviceLocationId
  if (reportUsesField(mode, 'employee')) scoped.employeeId = filters.employeeId
  if (reportUsesField(mode, 'jobStatus')) scoped.jobStatus = filters.jobStatus
  if (reportUsesField(mode, 'invoiceStatus')) scoped.invoiceStatus = filters.invoiceStatus

  return scoped
}

type ReportFilterLabels = {
  customers: Map<string, string>
  serviceLocations: Map<string, string>
  employees: Map<string, string>
}

const buildFilterSummary = (
  mode: ReportMode,
  filters: ReportQueryFilters,
  labels: ReportFilterLabels,
  sourceLabel?: string
) => {
  const summary: string[] = []

  if (sourceLabel) summary.push(`Source: ${sourceLabel}`)
  if (filters.dateFromUtc || filters.dateToUtc) {
    summary.push(`Dates: ${dateUtc(filters.dateFromUtc)} to ${dateUtc(filters.dateToUtc)}`)
  }
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
      ? 'No optional filters are active. Results reflect the default visible window of loaded rows.'
      : 'This report is scoped to the selected source record.'
}

const csvFileName = (title: string) =>
  `report-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loaded-rows'}.csv`
const generatedAtLabel = () => new Date().toLocaleString()

export function ReportsPage() {
  const [activeScreen, setActiveScreen] = useState<'catalog' | 'results'>('catalog')
  const [filtersByMode, setFiltersByMode] = useState<ReportFiltersByMode>({})
  const [sourceSelections, setSourceSelections] = useState<ReportSourceSelections>({})
  const [jobTickets, setJobTickets] = useState<JobTicketListItemDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [serviceLocations, setServiceLocations] = useState<ServiceLocationDto[]>([])
  const [equipment, setEquipment] = useState<EquipmentDto[]>([])
  const [employees, setEmployees] = useState<AssignableEmployeeDto[]>([])
  const [referenceLoading, setReferenceLoading] = useState(true)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [mode, setMode] = useState<ReportMode | null>(null)
  const [loadingMode, setLoadingMode] = useState<ReportMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reportMessage, setReportMessage] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadReferences = async () => {
      try {
        setReferenceError(null)
        const [jobTicketRows, customerRows, serviceLocationRows, equipmentRows, employeeRows] = await Promise.all([
          jobTicketsApi.listAll(),
          masterDataApi.listCustomers(),
          masterDataApi.listServiceLocations(),
          masterDataApi.listEquipment(),
          usersApi.listAssignableEmployees()
        ])

        if (!isMounted) return
        setJobTickets(jobTicketRows)
        setCustomers(customerRows)
        setServiceLocations(serviceLocationRows)
        setEquipment(equipmentRows)
        setEmployees(employeeRows)
      } catch {
        if (isMounted) {
          setReferenceError('Report selectors could not be loaded. Refresh the page before running source-specific reports.')
        }
      } finally {
        if (isMounted) setReferenceLoading(false)
      }
    }

    loadReferences()

    return () => {
      isMounted = false
    }
  }, [])

  const activeCustomers = useMemo(() => customers.filter((customer) => !customer.isArchived), [customers])
  const activeServiceLocations = useMemo(() => serviceLocations.filter((location) => !location.isArchived && location.isActive), [serviceLocations])
  const activeEquipment = useMemo(() => equipment.filter((item) => !item.isArchived), [equipment])

  const jobTicketLabelById = useMemo(
    () => new Map(jobTickets.map((job) => [job.id, `${job.ticketNumber} - ${job.title}`])),
    [jobTickets]
  )
  const customerLabelById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.accountNumber ? `${customer.name} (${customer.accountNumber})` : customer.name])),
    [customers]
  )
  const equipmentLabelById = useMemo(
    () => new Map(equipment.map((item) => [item.id, item.equipmentNumber ? `${item.name} (${item.equipmentNumber})` : item.name])),
    [equipment]
  )
  const serviceLocationLabelById = useMemo(
    () => new Map(serviceLocations.map((location) => [
      location.id,
      [location.companyName, location.locationName].filter(Boolean).join(' - ')
    ])),
    [serviceLocations]
  )
  const employeeLabelById = useMemo(
    () => new Map(employees.map((employee) => [
      employee.id,
      `${employee.firstName} ${employee.lastName}`.trim()
    ])),
    [employees]
  )

  const clearFilters = () => {
    setFiltersByMode({})
    setSourceSelections({})
    setRows([])
    setMode(null)
    setError(null)
    setReportMessage(null)
    setGeneratedAt(null)
    setActiveScreen('catalog')
  }

  const requireSourceId = (message: string) => {
    setRows([])
    setMode(null)
    setError(message)
    setReportMessage(null)
    setGeneratedAt(null)
  }

  const validateScopedFilters = (nextMode: ReportMode) => {
    const scopedFilters = filtersForMode(nextMode, filtersByMode[nextMode] ?? defaultFilters)

    if (scopedFilters.dateFromUtc && scopedFilters.dateToUtc && scopedFilters.dateFromUtc > scopedFilters.dateToUtc) {
      return 'From date must be on or before the to date.'
    }

    if (typeof scopedFilters.offset === 'number' && scopedFilters.offset < 0) {
      return 'Offset must be zero or greater.'
    }

    if (typeof scopedFilters.limit === 'number' && scopedFilters.limit < 1) {
      return 'Limit must be at least 1.'
    }

    return null
  }

  const apply = async (nextMode: ReportMode) => {
    const selectedSourceId = sourceSelections[nextMode]?.trim() ?? ''

    if ((nextMode === 'invoiceReady' || nextMode === 'jobCost') && !selectedSourceId) {
      requireSourceId(`Select a job ticket before running ${reportTitleMap[nextMode]}.`)
      return
    }

    if (nextMode === 'customerHistory' && !selectedSourceId) {
      requireSourceId('Select a customer before running Customer Service History.')
      return
    }

    if (nextMode === 'equipmentHistory' && !selectedSourceId) {
      requireSourceId('Select equipment before running Equipment Service History.')
      return
    }

    const filterValidationError = validateScopedFilters(nextMode)
    if (filterValidationError) {
      setRows([])
      setMode(null)
      setError(filterValidationError)
      setReportMessage(null)
      setGeneratedAt(null)
      setActiveScreen('catalog')
      return
    }

    try {
      setError(null)
      setReportMessage(null)
      setLoadingMode(nextMode)
      setRows([])
      setMode(nextMode)
      setActiveScreen('results')
      setGeneratedAt(null)

      const scopedFilters = filtersForMode(nextMode, filtersByMode[nextMode] ?? defaultFilters)
      const data =
        nextMode === 'invoiceReady'
          ? [await reportsApi.getInvoiceReadySummary(selectedSourceId)]
          : nextMode === 'jobsReady'
            ? await reportsApi.getJobsReadyToInvoice(scopedFilters)
            : nextMode === 'laborJob'
              ? await reportsApi.getLaborByJob(scopedFilters)
              : nextMode === 'laborEmployee'
                ? await reportsApi.getLaborByEmployee(scopedFilters)
                : nextMode === 'partsJob'
                  ? await reportsApi.getPartsByJob(scopedFilters)
                  : nextMode === 'jobCost'
                    ? [await reportsApi.getCostSummary(selectedSourceId)]
                    : nextMode === 'customerHistory'
                      ? await reportsApi.getCustomerHistory(selectedSourceId, scopedFilters)
                      : await reportsApi.getEquipmentHistory(selectedSourceId, scopedFilters)

      setRows(data as ReportRow[])
      setReportMessage(`${reportTitleMap[nextMode]} loaded with ${data.length} visible row${data.length === 1 ? '' : 's'}.`)
      setGeneratedAt(generatedAtLabel())
    } catch (requestError) {
      setRows([])
      setError(userMessageForReportError(requestError))
      setReportMessage(null)
      setGeneratedAt(null)
    } finally {
      setLoadingMode(null)
    }
  }

  const columns = mode ? columnsByMode[mode] : []
  const title = mode ? reportTitleMap[mode] : ''
  const csv = useMemo(() => toCsv(rows, columns), [rows, columns])
  const csvHref = useMemo(() => csvDataUri(csv), [csv])
  const hasRows = rows.length > 0
  const activeSourceId = mode ? sourceSelections[mode] : undefined
  const sourceLabel = mode === 'invoiceReady' || mode === 'jobCost'
    ? jobTicketLabelById.get(activeSourceId ?? '')
    : mode === 'customerHistory'
      ? customerLabelById.get(activeSourceId ?? '')
      : mode === 'equipmentHistory'
        ? equipmentLabelById.get(activeSourceId ?? '')
        : undefined
  const filterSummary = useMemo(
    () => (mode
      ? buildFilterSummary(mode, filtersForMode(mode, filtersByMode[mode] ?? defaultFilters), {
        customers: customerLabelById,
        serviceLocations: serviceLocationLabelById,
        employees: employeeLabelById
      }, sourceLabel)
      : ''),
    [customerLabelById, employeeLabelById, filtersByMode, mode, serviceLocationLabelById, sourceLabel]
  )

  const updateFilters = (reportMode: ReportMode, nextFilters: Partial<ReportQueryFilters>) => {
    setFiltersByMode((current) => ({
      ...current,
      [reportMode]: { ...(current[reportMode] ?? defaultFilters), ...nextFilters }
    }))
  }

  const updateSourceSelection = (reportMode: ReportMode, value: string) => {
    setSourceSelections((current) => ({ ...current, [reportMode]: value }))
  }

  const renderSourceControl = (reportMode: ReportMode) => {
    const titleForMode = reportTitleMap[reportMode]
    const selectedSourceId = sourceSelections[reportMode] ?? ''

    if (reportMode === 'invoiceReady' || reportMode === 'jobCost') {
      return (
        <div className="report-card-controls">
          <label>
            Job ticket
            <select
              aria-label={`${titleForMode} job ticket`}
              value={selectedSourceId}
              onChange={(event) => updateSourceSelection(reportMode, event.target.value)}
              disabled={referenceLoading}
            >
              <option value="">{referenceLoading ? 'Loading job tickets...' : 'Select job ticket'}</option>
              {jobTickets.map((job) => (
                <option key={job.id} value={job.id}>{job.ticketNumber} - {job.title}</option>
              ))}
            </select>
          </label>
          <small className="muted">Required for this single-ticket report.</small>
        </div>
      )
    }

    if (reportMode === 'customerHistory') {
      return (
        <div className="report-card-controls">
          <label>
            Customer
            <select
              aria-label="Customer Service History customer"
              value={selectedSourceId}
              onChange={(event) => updateSourceSelection(reportMode, event.target.value)}
              disabled={referenceLoading}
            >
              <option value="">{referenceLoading ? 'Loading customers...' : 'Select customer'}</option>
              {activeCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.accountNumber ? `${customer.name} (${customer.accountNumber})` : customer.name}
                </option>
              ))}
            </select>
          </label>
          <small className="muted">Required for this service-history report.</small>
        </div>
      )
    }

    if (reportMode === 'equipmentHistory') {
      return (
        <div className="report-card-controls">
          <label>
            Equipment
            <select
              aria-label="Equipment Service History equipment"
              value={selectedSourceId}
              onChange={(event) => updateSourceSelection(reportMode, event.target.value)}
              disabled={referenceLoading}
            >
              <option value="">{referenceLoading ? 'Loading equipment...' : 'Select equipment'}</option>
              {activeEquipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.equipmentNumber ? `${item.name} (${item.equipmentNumber})` : item.name}
                </option>
              ))}
            </select>
          </label>
          <small className="muted">Required for this service-history report.</small>
        </div>
      )
    }

    return null
  }

  const renderFilterControls = (reportMode: ReportMode) => {
    const fields = reportFilterFields[reportMode]
    if (!fields.length) return null

    const titleForMode = reportTitleMap[reportMode]
    const filters = filtersByMode[reportMode] ?? defaultFilters
    const controls: JSX.Element[] = []

    if (fields.includes('dateRange')) {
      controls.push(
        <label key="dateFrom">
          From date
          <input
            aria-label={`${titleForMode} from date filter`}
            type="date"
            value={filters.dateFromUtc?.slice(0, 10) ?? ''}
            onChange={(event) => updateFilters(reportMode, { dateFromUtc: event.target.value ? `${event.target.value}T00:00:00Z` : undefined })}
          />
        </label>,
        <label key="dateTo">
          To date
          <input
            aria-label={`${titleForMode} to date filter`}
            type="date"
            value={filters.dateToUtc?.slice(0, 10) ?? ''}
            onChange={(event) => updateFilters(reportMode, { dateToUtc: event.target.value ? `${event.target.value}T23:59:59Z` : undefined })}
          />
        </label>
      )
    }

    if (fields.includes('customer')) {
      controls.push(
        <label key="customer">
          Customer
          <select
            aria-label={`${titleForMode} customer filter`}
            value={filters.customerId ?? ''}
            onChange={(event) => updateFilters(reportMode, { customerId: event.target.value || undefined })}
            disabled={referenceLoading}
          >
            <option value="">Any customer</option>
            {activeCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.accountNumber ? `${customer.name} (${customer.accountNumber})` : customer.name}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (fields.includes('billingParty')) {
      controls.push(
        <label key="billingParty">
          Billing party
          <select
            aria-label={`${titleForMode} billing party filter`}
            value={filters.billingPartyCustomerId ?? ''}
            onChange={(event) => updateFilters(reportMode, { billingPartyCustomerId: event.target.value || undefined })}
            disabled={referenceLoading}
          >
            <option value="">Any billing party</option>
            {activeCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.accountNumber ? `${customer.name} (${customer.accountNumber})` : customer.name}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (fields.includes('serviceLocation')) {
      controls.push(
        <label key="serviceLocation">
          Service location
          <select
            aria-label={`${titleForMode} service location filter`}
            value={filters.serviceLocationId ?? ''}
            onChange={(event) => updateFilters(reportMode, { serviceLocationId: event.target.value || undefined })}
            disabled={referenceLoading}
          >
            <option value="">Any service location</option>
            {activeServiceLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.companyName} - {location.locationName}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (fields.includes('employee')) {
      controls.push(
        <label key="employee">
          Technician
          <select
            aria-label={`${titleForMode} employee filter`}
            value={filters.employeeId ?? ''}
            onChange={(event) => updateFilters(reportMode, { employeeId: event.target.value || undefined })}
            disabled={referenceLoading}
          >
            <option value="">Any technician</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>
            ))}
          </select>
        </label>
      )
    }

    if (fields.includes('jobStatus')) {
      controls.push(
        <label key="jobStatus">
          Job status
          <select
            aria-label={`${titleForMode} job status filter`}
            value={filters.jobStatus ?? ''}
            onChange={(event) => updateFilters(reportMode, { jobStatus: event.target.value ? Number(event.target.value) : undefined })}
          >
            <option value="">Any job status</option>
            <option value="7">Completed</option>
            <option value="9">Invoiced</option>
            <option value="10">Reviewed</option>
          </select>
        </label>
      )
    }

    if (fields.includes('invoiceStatus')) {
      controls.push(
        <label key="invoiceStatus">
          Invoice status
          <select
            aria-label={`${titleForMode} invoice status filter`}
            value={filters.invoiceStatus ?? ''}
            onChange={(event) => updateFilters(reportMode, { invoiceStatus: event.target.value ? Number(event.target.value) : undefined })}
          >
            <option value="">Any invoice status</option>
            <option value="1">Not Ready</option>
            <option value="2">Ready</option>
            <option value="3">Drafted</option>
            <option value="4">Sent</option>
            <option value="5">Paid</option>
            <option value="6">Void</option>
          </select>
        </label>
      )
    }

    if (fields.includes('paging')) {
      controls.push(
        <label key="offset">
          Offset
          <input
            aria-label={`${titleForMode} offset filter`}
            type="number"
            min={0}
            value={filters.offset ?? 0}
            onChange={(event) => updateFilters(reportMode, { offset: Number(event.target.value) || 0 })}
          />
        </label>,
        <label key="limit">
          Limit
          <input
            aria-label={`${titleForMode} limit filter`}
            type="number"
            min={1}
            value={filters.limit ?? 50}
            onChange={(event) => updateFilters(reportMode, { limit: Number(event.target.value) || 50 })}
          />
        </label>
      )
    }

    return (
      <details className="report-filter-details">
        <summary>Optional filters</summary>
        <div className="report-inline-filters">
          {controls}
        </div>
      </details>
    )
  }

  return (
    <section className="report-hub stack">
      <header className="card stack report-hub-hero">
        <div className="report-hero-layout">
          <div>
            <p className="eyebrow">Manager/Admin reporting</p>
            <h2>Reports</h2>
            <p className="muted">
              Pick the report you need, set its source or optional filters in the same panel, then run it.
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={clearFilters}>Reset report inputs</button>
        </div>
        <div className="report-hero-metrics" aria-label="report hub summary">
          <div><span>Report types</span><strong>{Object.keys(reportTitleMap).length}</strong></div>
          <div><span>Groups</span><strong>{reportSections.length}</strong></div>
          <div><span>Output</span><strong>CSV / PDF</strong></div>
        </div>
        <div className="report-note-panel">
          <strong>Labor totals</strong>
          <span>Labor totals are labeled as time-entry labor-rate snapshot values. The implemented API uses captured time-entry cost and bill rates first, then falls back only for legacy entries without snapshots.</span>
        </div>
        {referenceLoading ? <p className="muted" role="status">Loading report selectors...</p> : null}
      </header>
      <Errorable error={referenceError} />
      {activeScreen === 'catalog' ? <Errorable error={error} /> : null}

      <section className="card stack report-preview-panel print-report-surface" aria-label="report preview" aria-live="polite" aria-busy={loadingMode !== null} hidden={activeScreen !== 'results'}>
        <div className="report-results-heading report-results-toolbar">
          <div>
            <p className="eyebrow">Generated report</p>
            <h3>{title || 'Report Preview'}</h3>
            <p className="muted">
              {mode
                ? `${rows.length} visible row${rows.length === 1 ? '' : 's'} loaded for review.`
                : 'Run a report from the hub to load export-friendly rows here.'}
            </p>
          </div>
          <div className="row report-result-actions no-print">
            <button type="button" className="secondary-button" onClick={() => setActiveScreen('catalog')}>
              Back to report catalog
            </button>
            {hasRows ? (
              <button type="button" className="secondary-button" onClick={() => window.print()}>
                Print / Save PDF
              </button>
            ) : null}
            {hasRows ? (
              <a className="button-link" href={csvHref} download={csvFileName(title)}>
                Export loaded rows as CSV
              </a>
            ) : null}
          </div>
        </div>
        {mode ? (
          <div className="report-result-meta" aria-label="generated report metadata">
            <div>
              <span>Rows</span>
              <strong>{rows.length}</strong>
            </div>
            <div>
              <span>Columns</span>
              <strong>{columns.length}</strong>
            </div>
            <div>
              <span>Generated</span>
              <strong>{generatedAt ?? 'Pending'}</strong>
            </div>
          </div>
        ) : null}
        {mode ? (
          <div className="report-print-heading">
            <p className="eyebrow">Manager/Admin Report</p>
            <h2>{title}</h2>
            <p>{generatedAt ? `Generated ${generatedAt}` : 'Generated report preview'}</p>
          </div>
        ) : null}
        {reportMessage ? <p className="success action-feedback-panel report-result-feedback">{reportMessage}</p> : null}
        {activeScreen === 'results' ? <Errorable error={error} /> : null}
        {mode ? (
          <div className="report-state-panel report-result-summary">
            <span>Applied scope</span>
            <strong>{filterSummary}</strong>
          </div>
        ) : null}
        {loadingMode ? (
          <div className="report-result-state" role="status">
            <strong>Loading {reportTitleMap[loadingMode]}</strong>
            <span>Preparing rows for review and export.</span>
          </div>
        ) : null}
        {mode && !loadingMode && !hasRows && !error ? (
          <div className="report-result-state">
            <strong>No rows found</strong>
            <span>No rows match the current report and filters. Adjust the filters or selected record, then run the report again.</span>
          </div>
        ) : null}
        {hasRows ? (
          <div className="table-scroll report-results-table">
            <table aria-label={`${title} results`}>
              <caption>{title} results table with {rows.length} visible row{rows.length === 1 ? '' : 's'}.</caption>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.header} className={column.align === 'number' ? 'numeric-cell' : undefined}>
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td key={column.header} className={column.align === 'number' ? 'numeric-cell' : undefined}>
                        {column.render ? column.render(row as never) : column.value(row as never)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="stack" hidden={activeScreen !== 'catalog'}>
        {reportSections.map((section) => (
          <section className="report-section report-section-panel stack" key={section.title} aria-label={section.title}>
            <div className="report-section-heading">
              <div>
                <p className="eyebrow">Report group</p>
                <h3>{section.title}</h3>
                <p className="muted">{section.description}</p>
              </div>
              <span className="report-section-count">{section.modes.length} reports</span>
            </div>
            <div className="report-action-grid">
              {section.modes.map((reportMode) => (
                <article className="report-card report-run-card" key={reportMode} aria-label={`${reportTitleMap[reportMode]} report`} aria-busy={loadingMode === reportMode}>
                  <div className="report-card-top">
                    <h4>{reportTitleMap[reportMode]}</h4>
                    <span>{reportFilterFields[reportMode].length ? 'Filterable' : 'Source required'}</span>
                  </div>
                  <p className="muted">{reportDescriptions[reportMode]}</p>
                  <div className="report-card-inputs">
                    {renderSourceControl(reportMode)}
                    {renderFilterControls(reportMode)}
                  </div>
                  <button type="button" onClick={() => apply(reportMode)} disabled={loadingMode !== null}>
                    {loadingMode === reportMode ? 'Loading...' : `Run ${reportTitleMap[reportMode]}`}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
