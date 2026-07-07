import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { ticketStatusFiltersApi } from '../../api/ticketStatusFiltersApi'
import { ApiError } from '../../api/httpClient'
import type { CustomerDto, JobTicketAssignmentDto, JobTicketListItemDto, ServiceLocationDto, TicketStatusFilterOptionDto } from '../../types'
import { csvDataUri, toCsv, type CsvColumn } from '../../utils/csv'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from '../employee/jobDisplay'
import { defaultTicketStatusFilterOptions, formatDate, priorityOptions } from './managerDisplay'
import { activeDispatchStatusValues, buildJobTicketDetailPath, closedJobTicketStatusValues, normalizeJobTicketQueueSearchParams, readJobTicketQueueFilters } from './managerTaskNavigation'

const allFilterValue = 'all'
const activeStatusValues = activeDispatchStatusValues
const closedStatusValues = closedJobTicketStatusValues
const waitingStatusValues = new Set([5, 6])
const dispatchReadinessFilterOptions = [
  { value: allFilterValue, label: 'All work readiness' },
  { value: 'ready', label: 'Ready to work' },
  { value: 'needs-review', label: 'Needs assignment review' },
  { value: 'not-active', label: 'Not active work' }
]

type DispatchReadiness = {
  label: string
  detail: string
  nextStep: string
  openItems: number
  isReady: boolean
}

type QueuePreset = {
  status?: string
  priority?: string
  readiness?: string
  attention?: string
}

type SavedQueueViewKey = 'custom' | 'all-tickets' | 'open-tickets' | 'closed-tickets' | 'today' | 'waiting-parts' | 'ready-invoice' | 'needs-assignment' | 'completed-review'

type SavedQueueView = {
  value: SavedQueueViewKey
  label: string
  preset?: QueuePreset
}

type QueueExportRow = {
  ticketNumber: string
  title: string
  status: string
  priority: string
  customer: string
  serviceLocation: string
  assignedEmployees: string
  leadEmployees: string
  dispatchReadiness: string
  dispatchDetail: string
  nextRequiredUpdate: string
  requestedAtUtc: string
  scheduledStartAtUtc: string
  dueAtUtc: string
  completedAtUtc: string
}

type TicketViewMode = 'rich' | 'compact'

const queueExportColumns: CsvColumn<QueueExportRow>[] = [
  { header: 'Ticket Number', value: (row) => row.ticketNumber },
  { header: 'Title', value: (row) => row.title },
  { header: 'Status', value: (row) => row.status },
  { header: 'Priority', value: (row) => row.priority },
  { header: 'Customer', value: (row) => row.customer },
  { header: 'Service Location', value: (row) => row.serviceLocation },
  { header: 'Assigned Employees', value: (row) => row.assignedEmployees },
  { header: 'Lead Employees', value: (row) => row.leadEmployees },
  { header: 'Work Readiness', value: (row) => row.dispatchReadiness },
  { header: 'Work Readiness Detail', value: (row) => row.dispatchDetail },
  { header: 'Next Required Update', value: (row) => row.nextRequiredUpdate },
  { header: 'Requested Date (UTC)', value: (row) => row.requestedAtUtc },
  { header: 'Scheduled Start (UTC)', value: (row) => row.scheduledStartAtUtc },
  { header: 'Due Date (UTC)', value: (row) => row.dueAtUtc },
  { header: 'Completed Date (UTC)', value: (row) => row.completedAtUtc }
]

const ticketViewModeStorageKey = 'job-ticket-manager-queue-view-mode'
const dateForExport = (value?: string | null) => value ? value.slice(0, 10) : ''

const deriveSavedQueueView = (sp: URLSearchParams): SavedQueueViewKey => {
  const status = sp.get('status')
  const readiness = sp.get('readiness')
  if (!status || status === 'active') {
    if (readiness === 'needs-review') return 'needs-assignment'
    return 'open-tickets'
  }
  if (status === 'closed') return 'closed-tickets'
  if (status === '5') return 'waiting-parts'
  if (status === '10') return 'ready-invoice'
  if (status === '7') return 'completed-review'
  return 'custom'
}

const savedQueueViews: SavedQueueView[] = [
  { value: 'custom', label: 'Custom filters' },
  { value: 'all-tickets', label: 'All Tickets', preset: {} },
  { value: 'open-tickets', label: 'Open Tickets', preset: { status: 'active' } },
  { value: 'closed-tickets', label: 'Closed Tickets', preset: { status: 'closed' } },
  { value: 'today', label: 'Today', preset: { status: 'active' } },
  { value: 'waiting-parts', label: 'Waiting on Parts', preset: { status: '5' } },
  { value: 'ready-invoice', label: 'Ready to Invoice', preset: { status: '10' } },
  { value: 'needs-assignment', label: 'Needs Assignment', preset: { status: 'active', readiness: 'needs-review' } },
  { value: 'completed-review', label: 'Completed Review', preset: { status: '7' } }
]

const isSameLocalDate = (value: string | null | undefined, comparisonDate: Date) => {
  if (!value) {
    return false
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date.getFullYear() === comparisonDate.getFullYear() &&
    date.getMonth() === comparisonDate.getMonth() &&
    date.getDate() === comparisonDate.getDate()
}

const getStoredTicketViewMode = (): TicketViewMode => {
  if (typeof window === 'undefined') {
    return 'rich'
  }

  try {
    return window.localStorage.getItem(ticketViewModeStorageKey) === 'compact' ? 'compact' : 'rich'
  } catch {
    return 'rich'
  }
}

const getDispatchReadiness = (job: JobTicketListItemDto, assignments: JobTicketAssignmentDto[] | null): DispatchReadiness => {
  if (!activeStatusValues.has(job.status)) {
    return {
      label: 'Not active work',
      detail: 'Ticket is outside the active work queue.',
      nextStep: 'No assignment or schedule validation is needed until the ticket returns to an active status.',
      openItems: 0,
      isReady: false
    }
  }

  if (!assignments) {
    return {
      label: 'Assignment data unavailable',
      detail: 'Assignment data could not be loaded for this ticket.',
      nextStep: 'Reload technician assignments before making assignment or schedule decisions.',
      openItems: 0,
      isReady: false
    }
  }

  const openItems: Array<{ label: string, nextStep: string }> = []

  if (!assignments.length) {
    openItems.push({
      label: 'assignment',
      nextStep: 'Assign at least one employee.'
    })
  }

  if (!assignments.some((assignment) => assignment.isLead)) {
    openItems.push({
      label: 'lead tech',
      nextStep: 'Mark one assigned employee as the lead tech.'
    })
  }

  if (!job.scheduledStartAtUtc) {
    openItems.push({
      label: 'scheduled start',
      nextStep: 'Set a scheduled start time.'
    })
  }

  if (!job.dueAtUtc) {
    openItems.push({
      label: 'due date',
      nextStep: 'Add a due date for timing expectations.'
    })
  }

  if (!openItems.length) {
    return {
      label: 'Ready to work',
      detail: 'Assignment, lead tech, schedule, and due date are present.',
      nextStep: 'All assignment and schedule requirements are complete.',
      openItems: 0,
      isReady: true
    }
  }

  return {
    label: 'Needs assignment review',
    detail: `Missing ${openItems.map((item) => item.label).join(', ')}.`,
    nextStep: openItems[0].nextStep,
    openItems: openItems.length,
    isReady: false
  }
}

const getAssignmentDisplayName = (assignment: JobTicketAssignmentDto) =>
  assignment.employeeName?.trim() || 'Employee unavailable'

const getDataQualityWarnings = (
  job: JobTicketListItemDto,
  customer: CustomerDto | undefined,
  location: ServiceLocationDto | undefined,
  assignments: JobTicketAssignmentDto[] | null
) => {
  const warnings: string[] = []

  if (customer && !customer.phone?.trim()) {
    warnings.push('This customer has no phone.')
  }

  if (location && !location.postalCode?.trim()) {
    warnings.push('This job location has no ZIP.')
  }

  if (activeStatusValues.has(job.status) && assignments !== null && !assignments.some((assignment) => assignment.isLead)) {
    warnings.push('No lead tech assigned.')
  }

  if (activeStatusValues.has(job.status) && !job.dueAtUtc) {
    warnings.push('No due date set.')
  }

  return warnings
}

const normalizeStatusFilterOptions = (options: TicketStatusFilterOptionDto[]) =>
  options
    .filter((option) => option.isActive && Number.isInteger(option.status) && option.status >= 1 && option.status <= 10)
    .sort((left, right) => left.displayOrder - right.displayOrder || left.displayLabel.localeCompare(right.displayLabel))

/** Returns days old + a CSS class for visual urgency based on priority and age. */
const getTicketAgeInfo = (job: JobTicketListItemDto) => {
  const dateStr = job.requestedAtUtc
  if (!dateStr) return null
  const created = new Date(dateStr)
  const days = Math.floor((Date.now() - created.getTime()) / 86400000)
  // Response-target thresholds by priority (4=Urgent, 3=High, 2=Normal, 1=Low)
  const warnDays = job.priority === 4 ? 1 : job.priority === 3 ? 2 : job.priority === 2 ? 5 : 14
  const critDays = job.priority === 4 ? 2 : job.priority === 3 ? 4 : job.priority === 2 ? 10 : 30
  const cls = days >= critDays ? 'age-critical' : days >= warnDays ? 'age-warn' : 'age-ok'
  return { days, cls }
}

export function JobTicketListPage() {
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
  const [assignmentMap, setAssignmentMap] = useState<Record<string, JobTicketAssignmentDto[]>>({})
  const [assignmentDataUnavailable, setAssignmentDataUnavailable] = useState(false)
  const [customers, setCustomers] = useState<Record<string, CustomerDto>>({})
  const [locations, setLocations] = useState<Record<string, ServiceLocationDto>>({})
  const [ticketStatusFilters, setTicketStatusFilters] = useState<TicketStatusFilterOptionDto[]>(defaultTicketStatusFilterOptions)
  const [ticketViewMode, setTicketViewMode] = useState<TicketViewMode>(getStoredTicketViewMode)
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [savedQueueView, setSavedQueueView] = useState<SavedQueueViewKey>(() => deriveSavedQueueView(searchParams))
  const queueFilters = readJobTicketQueueFilters(searchParams)
  const statusFilter = queueFilters.status
  const priorityFilter = queueFilters.priority
  const customerFilter = queueFilters.customer
  const dispatchReadinessFilter = queueFilters.readiness
  const attentionFilter = queueFilters.attention
  const searchText = queueFilters.search

  const normalizedSearchParams = normalizeJobTicketQueueSearchParams(searchParams)
  const normalizedSearch = normalizedSearchParams.toString()
  const currentSearch = searchParams.toString()

  const updateFilter = (name: string, value: string) => {
    setSavedQueueView('custom')
    setSearchParams((currentParams) => {
      const nextParams = normalizeJobTicketQueueSearchParams(currentParams)
      if (!value || value === allFilterValue) {
        nextParams.delete(name)
      } else {
        nextParams.set(name, value)
      }
      return nextParams
    }, { replace: true })
  }
  const applyQueuePreset = (preset: QueuePreset) => {
    setSearchParams((currentParams) => {
      const nextParams = normalizeJobTicketQueueSearchParams(currentParams)
      nextParams.delete('status')
      nextParams.delete('priority')
      nextParams.delete('readiness')
      nextParams.delete('attention')

      Object.entries(preset).forEach(([name, value]) => {
        if (value) {
          nextParams.set(name, value)
        }
      })

      return nextParams
    }, { replace: true })
  }
  const applySavedQueueView = (value: SavedQueueViewKey) => {
    setSavedQueueView(value)
    const view = savedQueueViews.find((item) => item.value === value)
    if (view?.preset) {
      applyQueuePreset(view.preset)
    } else {
      setSearchParams((currentParams) => {
        const nextParams = normalizeJobTicketQueueSearchParams(currentParams)
        nextParams.delete('status')
        nextParams.delete('priority')
        nextParams.delete('readiness')
        nextParams.delete('attention')
        return nextParams
      }, { replace: true })
    }
  }
  const updateTicketViewMode = (mode: TicketViewMode) => {
    setTicketViewMode(mode)
    try {
      window.localStorage.setItem(ticketViewModeStorageKey, mode)
    } catch {
      // Local storage is optional; the view still changes for the current session.
    }
  }
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (normalizedSearch !== currentSearch) {
      setSearchParams(new URLSearchParams(normalizedSearch), { replace: true })
    }
  }, [currentSearch, normalizedSearch, setSearchParams])

  useEffect(() => {
    let isCancelled = false

    const load = async () => {
      setIsLoading(true)

      try {
        const [tickets, customersResponse, locationsResponse] = await Promise.all([
          jobTicketsApi.listAll(),
          masterDataApi.listCustomers(),
          masterDataApi.listServiceLocations()
        ])
        const statusFilterResponse = await ticketStatusFiltersApi.list().catch(() => defaultTicketStatusFilterOptions)

        const assignmentResults = await Promise.all(
          tickets.map(async (ticket) => {
            try {
              return {
                ticketId: ticket.id,
                assignments: await jobTicketsApi.listAssignments(ticket.id),
                failed: false
              }
            } catch {
              return {
                ticketId: ticket.id,
                assignments: [] as JobTicketAssignmentDto[],
                failed: true
              }
            }
          })
        )

        if (isCancelled) {
          return
        }

        setJobs(tickets)
        setAssignmentMap(Object.fromEntries(assignmentResults.map((item) => [item.ticketId, item.assignments])))
        setAssignmentDataUnavailable(assignmentResults.some((item) => item.failed))
        setCustomers(Object.fromEntries(customersResponse.map((item) => [item.id, item])))
        setLocations(Object.fromEntries(locationsResponse.map((item) => [item.id, item])))
        setTicketStatusFilters(statusFilterResponse.length ? statusFilterResponse : [])
        setError(null)
      } catch (requestError) {
        if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
          setError('You do not have permission to load this manager view.')
          return
        }

        setError('Unable to load manager job tickets.')
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [])

  const customerOptions = useMemo(
    () => Object.values(customers).sort((left, right) => left.name.localeCompare(right.name)),
    [customers]
  )
  const configuredStatusFilters = useMemo(() => normalizeStatusFilterOptions(ticketStatusFilters), [ticketStatusFilters])
  const selectedStatusFallback = useMemo(() => {
    const selectedStatus = Number(statusFilter)
    if (!Number.isInteger(selectedStatus) || selectedStatus < 1 || selectedStatus > 10) {
      return null
    }

    return configuredStatusFilters.some((filter) => filter.status === selectedStatus)
      ? null
      : { value: selectedStatus, label: getJobTicketStatusLabel(selectedStatus) }
  }, [configuredStatusFilters, statusFilter])

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase()
    const today = new Date()

    return jobs.filter((job) => {
      const customerName = customers[job.customerId]?.name ?? 'Customer unavailable'
      const locationName = locations[job.serviceLocationId]?.locationName ?? 'Location unavailable'
      const assignments = assignmentDataUnavailable ? null : assignmentMap[job.id] ?? []
      const assignmentNames = assignments?.map((item) => getAssignmentDisplayName(item)) ?? []
      const readiness = getDispatchReadiness(job, assignments)
      const matchesStatus = statusFilter === allFilterValue
        || (statusFilter === 'active' && activeStatusValues.has(job.status))
        || (statusFilter === 'closed' && closedStatusValues.has(job.status))
        || (statusFilter === 'waiting' && waitingStatusValues.has(job.status))
        || String(job.status) === statusFilter
      const matchesPriority = priorityFilter === allFilterValue || String(job.priority) === priorityFilter
      const matchesCustomer = customerFilter === allFilterValue || job.customerId === customerFilter
      const matchesDispatchReadiness = dispatchReadinessFilter === allFilterValue ||
        (dispatchReadinessFilter === 'ready' && readiness.isReady) ||
        (dispatchReadinessFilter === 'needs-review' && readiness.openItems > 0) ||
        (dispatchReadinessFilter === 'not-active' && !activeStatusValues.has(job.status))
      const matchesAttention = attentionFilter === allFilterValue ||
        (attentionFilter === 'unscheduled' && activeStatusValues.has(job.status) && !job.scheduledStartAtUtc) ||
        (attentionFilter === 'missing-due' && activeStatusValues.has(job.status) && !job.dueAtUtc) ||
        (attentionFilter === 'unassigned' && activeStatusValues.has(job.status) && assignments !== null && !assignments.length) ||
        (attentionFilter === 'needs-lead' && activeStatusValues.has(job.status) && assignments !== null && !assignments.some((assignment) => assignment.isLead))
      const matchesSearch = !normalizedSearch || [job.ticketNumber, job.title, customerName, locationName, ...assignmentNames]
        .some((value) => value.toLocaleLowerCase().includes(normalizedSearch))
      const matchesSavedQueueView = savedQueueView === 'custom' ||
        savedQueueView === 'all-tickets' ||
        (savedQueueView === 'open-tickets' && activeStatusValues.has(job.status)) ||
        (savedQueueView === 'closed-tickets' && closedStatusValues.has(job.status)) ||
        (savedQueueView === 'today' && activeStatusValues.has(job.status) && isSameLocalDate(job.scheduledStartAtUtc, today)) ||
        (savedQueueView === 'waiting-parts' && job.status === 5) ||
        (savedQueueView === 'ready-invoice' && job.status === 10) ||
        (savedQueueView === 'needs-assignment' && activeStatusValues.has(job.status) && readiness.openItems > 0) ||
        (savedQueueView === 'completed-review' && job.status === 7)

      return matchesStatus && matchesPriority && matchesCustomer && matchesDispatchReadiness && matchesAttention && matchesSearch && matchesSavedQueueView
    })
  }, [assignmentDataUnavailable, assignmentMap, attentionFilter, customerFilter, customers, dispatchReadinessFilter, jobs, locations, priorityFilter, savedQueueView, searchText, statusFilter])

  const triageSummary = useMemo(() => {
    const activeJobs = jobs.filter((job) => activeStatusValues.has(job.status))
    const closedJobs = jobs.filter((job) => closedStatusValues.has(job.status))
    const urgentJobs = jobs.filter((job) => job.priority === 4 && activeStatusValues.has(job.status))
    const waitingJobs = jobs.filter((job) => waitingStatusValues.has(job.status))
    const todayJobs = activeJobs.filter((job) => isSameLocalDate(job.scheduledStartAtUtc, new Date()))
    const waitingOnPartsJobs = jobs.filter((job) => job.status === 5)
    const readyToInvoiceJobs = jobs.filter((job) => job.status === 10)
    const completedReviewJobs = jobs.filter((job) => job.status === 7)
    const unscheduledJobs = activeJobs.filter((job) => !job.scheduledStartAtUtc)
    const missingDueDateJobs = activeJobs.filter((job) => !job.dueAtUtc)
    const unassignedJobs = assignmentDataUnavailable ? [] : activeJobs.filter((job) => !(assignmentMap[job.id]?.length))
    const needsLeadJobs = assignmentDataUnavailable ? [] : activeJobs.filter((job) => !(assignmentMap[job.id] ?? []).some((assignment) => assignment.isLead))
    const activeReadiness = assignmentDataUnavailable ? [] : activeJobs.map((job) => getDispatchReadiness(job, assignmentMap[job.id] ?? []))
    const dispatchReadyJobs = activeReadiness.filter((item) => item.isReady)
    const needsDispatchReviewJobs = activeReadiness.filter((item) => item.openItems > 0)

    return {
      activeCount: activeJobs.length,
      closedCount: closedJobs.length,
      urgentCount: urgentJobs.length,
      waitingCount: waitingJobs.length,
      todayCount: todayJobs.length,
      waitingOnPartsCount: waitingOnPartsJobs.length,
      readyToInvoiceCount: readyToInvoiceJobs.length,
      completedReviewCount: completedReviewJobs.length,
      unscheduledCount: unscheduledJobs.length,
      missingDueDateCount: missingDueDateJobs.length,
      unassignedCount: unassignedJobs.length,
      needsLeadCount: needsLeadJobs.length,
      dispatchReadyCount: dispatchReadyJobs.length,
      needsDispatchReviewCount: needsDispatchReviewJobs.length
    }
  }, [assignmentDataUnavailable, assignmentMap, jobs])

  const isDefaultView = savedQueueView === 'open-tickets' &&
    (statusFilter === allFilterValue || statusFilter === 'active') &&
    priorityFilter === allFilterValue &&
    customerFilter === allFilterValue &&
    dispatchReadinessFilter === allFilterValue &&
    attentionFilter === allFilterValue &&
    !searchText.trim()
  const hasActiveFilters = !isDefaultView

  const activeKpiCard = useMemo((): SavedQueueViewKey | null => {
    if (savedQueueView !== 'custom') return savedQueueView
    if (statusFilter === allFilterValue) return 'all-tickets'
    if (statusFilter === 'active') {
      if (dispatchReadinessFilter === 'needs-review') return 'needs-assignment'
      return 'open-tickets'
    }
    if (statusFilter === 'closed') return 'closed-tickets'
    if (statusFilter === '5') return 'waiting-parts'
    if (statusFilter === '10') return 'ready-invoice'
    if (statusFilter === '7') return 'completed-review'
    return null
  }, [dispatchReadinessFilter, savedQueueView, statusFilter])

  const queueExportRows = useMemo<QueueExportRow[]>(() => filteredJobs.map((job) => {
    const assignments = assignmentDataUnavailable ? null : assignmentMap[job.id] ?? []
    const leadAssignments = assignments?.filter((item) => item.isLead) ?? []
    const readiness = getDispatchReadiness(job, assignments)

    return {
      ticketNumber: job.ticketNumber,
      title: job.title,
      status: getJobTicketStatusLabel(job.status),
      priority: getJobTicketPriorityLabel(job.priority),
      customer: customers[job.customerId]?.name ?? job.customerName ?? 'Customer unavailable',
      serviceLocation: locations[job.serviceLocationId]?.locationName ?? job.serviceLocationName ?? 'Location unavailable',
      assignedEmployees: assignmentDataUnavailable
        ? 'Assignment data unavailable'
        : assignments?.length ? assignments.map(getAssignmentDisplayName).join('; ') : 'Unassigned',
      leadEmployees: assignmentDataUnavailable
        ? 'Assignment data unavailable'
        : leadAssignments.length ? leadAssignments.map(getAssignmentDisplayName).join('; ') : 'Needs lead',
      dispatchReadiness: readiness.label,
      dispatchDetail: readiness.detail,
      nextRequiredUpdate: readiness.nextStep,
      requestedAtUtc: dateForExport(job.requestedAtUtc),
      scheduledStartAtUtc: dateForExport(job.scheduledStartAtUtc),
      dueAtUtc: dateForExport(job.dueAtUtc),
      completedAtUtc: dateForExport(job.completedAtUtc)
    }
  }), [assignmentDataUnavailable, assignmentMap, customers, filteredJobs, locations])

  const queueCsv = useMemo(() => toCsv(queueExportRows, queueExportColumns), [queueExportRows])
  const queueCsvHref = useMemo(() => csvDataUri(queueCsv), [queueCsv])
  const queueCsvFileName = hasActiveFilters ? 'job-ticket-queue-filtered.csv' : 'job-ticket-queue.csv'

  const filterResultSummary = isLoading
    ? 'Loading ticket results...'
    : error
      ? 'Ticket results could not be loaded.'
      : jobs.length === 0
        ? 'No tickets are loaded yet.'
        : hasActiveFilters
          ? `Filtered view showing ${filteredJobs.length} of ${jobs.length} tickets.`
          : `Showing ${filteredJobs.length} open tickets. Search by ticket number to find closed tickets.`

  const resetFilters = () => {
    setSavedQueueView('open-tickets')
    setSearchParams({}, { replace: true })
  }

  const queuePath = `${location.pathname}${normalizedSearch ? `?${normalizedSearch}` : ''}`
  const getTicketDetailPath = (jobTicketId: string) =>
    buildJobTicketDetailPath(jobTicketId, queuePath)

  return (
    <section className="job-ticket-queue-page stack" aria-label="manager job ticket queue">
      <header className="job-ticket-queue-header">
        <div>
          <h2>Job Tickets</h2>
          <p className="muted">Search and filter job tickets by status, technician assignment, schedule, and due dates.</p>
        </div>
        <Link className="button-link" to="/manage/job-tickets/new">Create Ticket</Link>
      </header>

      <section className="filter-panel queue-filter-panel" aria-label="job ticket filters">
        <label className="sr-label queue-search-field">
          Search tickets
          <input value={searchText} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Ticket, title, customer, or location" />
        </label>
        <label className="sr-label">
          Status
          <select value={statusFilter} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value={allFilterValue}>All statuses</option>
            <option value="active">Active statuses</option>
            <option value="closed">Closed statuses</option>
            <option value="waiting">Waiting on parts or customer</option>
            {configuredStatusFilters.map((item) => <option key={item.id} value={item.status}>{item.displayLabel}</option>)}
            {selectedStatusFallback ? <option value={selectedStatusFallback.value}>{selectedStatusFallback.label}</option> : null}
          </select>
        </label>
        <label className="sr-label">
          Priority
          <select value={priorityFilter} onChange={(event) => updateFilter('priority', event.target.value)}>
            <option value={allFilterValue}>All priorities</option>
            {priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="sr-label">
          Customer
          <select value={customerFilter} onChange={(event) => updateFilter('customer', event.target.value)}>
            <option value={allFilterValue}>All customers</option>
            {customerOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="sr-label">
          Work readiness
          <select value={dispatchReadinessFilter} onChange={(event) => updateFilter('readiness', event.target.value)} disabled={assignmentDataUnavailable}>
            {dispatchReadinessFilterOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <div className="queue-filter-result" role="status" aria-live="polite">
          <strong>Results</strong>
          <span>{filterResultSummary}</span>
        </div>
        <button type="button" className="secondary-button" onClick={resetFilters} disabled={!hasActiveFilters}>Reset Filters</button>
      </section>

      {!isLoading && !error && jobs.length ? (
        <div className="queue-kpi-chip-row" role="group" aria-label="quick ticket views">
          <button type="button" aria-pressed={activeKpiCard === 'all-tickets'} className="queue-kpi-chip" onClick={() => applySavedQueueView('all-tickets')}>
            <strong>{jobs.length}</strong> All
          </button>
          <button type="button" aria-pressed={activeKpiCard === 'open-tickets'} className="queue-kpi-chip" onClick={() => applySavedQueueView('open-tickets')}>
            <strong>{triageSummary.activeCount}</strong> Open Tickets
          </button>
          <button type="button" aria-pressed={activeKpiCard === 'today'} className="queue-kpi-chip" onClick={() => applySavedQueueView('today')}>
            <strong>{triageSummary.todayCount}</strong> Today
          </button>
          <button type="button" aria-pressed={activeKpiCard === 'waiting-parts'} className="queue-kpi-chip" onClick={() => applySavedQueueView('waiting-parts')}>
            <strong>{triageSummary.waitingOnPartsCount}</strong> Waiting on Parts
          </button>
          <button type="button" aria-pressed={activeKpiCard === 'needs-assignment'} className="queue-kpi-chip queue-kpi-chip-alert" onClick={() => applySavedQueueView('needs-assignment')}>
            <strong>{triageSummary.needsDispatchReviewCount}</strong> Needs Assignment
          </button>
          <button type="button" aria-pressed={activeKpiCard === 'ready-invoice'} className="queue-kpi-chip" onClick={() => applySavedQueueView('ready-invoice')}>
            <strong>{triageSummary.readyToInvoiceCount}</strong> Ready to Invoice
          </button>
          <button type="button" aria-pressed={activeKpiCard === 'completed-review'} className="queue-kpi-chip" onClick={() => applySavedQueueView('completed-review')}>
            <strong>{triageSummary.completedReviewCount}</strong> Completed Review
          </button>
          <button type="button" aria-pressed={activeKpiCard === 'closed-tickets'} className="queue-kpi-chip" onClick={() => applySavedQueueView('closed-tickets')}>
            <strong>{triageSummary.closedCount}</strong> Closed Tickets
          </button>
          {assignmentDataUnavailable ? <span className="queue-kpi-chip queue-kpi-chip-warn">Assignments unavailable</span> : null}
        </div>
      ) : null}

      {!isLoading && !error && assignmentDataUnavailable ? (
        <p className="queue-warning warning" role="status">Assignment data could not be loaded for one or more tickets. Assignment ownership, lead-tech status, and work-readiness filters are unavailable until assignments reload.</p>
      ) : null}

      {isLoading ? <p className="muted" role="status">Loading manager job tickets...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!isLoading && !error && !jobs.length ? <p className="muted">No job tickets found. Create a ticket to start the pilot workflow.</p> : null}
      {!isLoading && !error && jobs.length > 0 && !filteredJobs.length ? <p className="muted">No job tickets match the current filters. Reset filters to see all tickets.</p> : null}

      {!isLoading && !error && filteredJobs.length ? (
        <section className="queue-results-panel" aria-label="job ticket results">
          <div className="queue-results-heading">
            <div>
              <h3>Ticket Queue</h3>
              <span className="muted">Showing {filteredJobs.length} of {jobs.length} tickets.</span>
            </div>
            <div className="queue-results-actions">
              <div className="ticket-view-toggle" role="group" aria-label="ticket queue view">
                <button
                  aria-pressed={ticketViewMode === 'rich'}
                  className="secondary-button compact-button"
                  onClick={() => updateTicketViewMode('rich')}
                  type="button"
                >
                  Rich cards
                </button>
                <button
                  aria-pressed={ticketViewMode === 'compact'}
                  className="secondary-button compact-button"
                  onClick={() => updateTicketViewMode('compact')}
                  type="button"
                >
                  Compact list
                </button>
              </div>
              <a className="button-link secondary-link" href={queueCsvHref} download={queueCsvFileName}>
                Export visible queue as CSV
              </a>
            </div>
          </div>
          {ticketViewMode === 'compact' ? (
            <div className="compact-ticket-list" aria-label="compact ticket list">
              <div className="compact-ticket-list-header" aria-hidden="true">
                <span>Ticket</span>
                <span>Customer / Location</span>
                <span>Lead / Team</span>
                <span>Readiness</span>
                <span>Timing</span>
                <span>Open</span>
              </div>
              {filteredJobs.map((job) => {
                const assignments = assignmentDataUnavailable ? null : assignmentMap[job.id] ?? []
                const leadAssignments = assignments?.filter((item) => item.isLead) ?? []
                const leadSummary = assignmentDataUnavailable ? 'Assignment data unavailable' : leadAssignments.length ? leadAssignments.map(getAssignmentDisplayName).join(', ') : 'Needs lead'
                const assignmentSummary = assignmentDataUnavailable ? 'Assignment data unavailable' : assignments?.length ? assignments.map(getAssignmentDisplayName).join(', ') : 'Unassigned'
                const readiness = getDispatchReadiness(job, assignments)
                const readinessClass = readiness.isReady ? 'readiness-ready' : readiness.openItems > 0 || assignmentDataUnavailable ? 'readiness-review' : 'readiness-inactive'
                const customer = customers[job.customerId]
                const locationRecord = locations[job.serviceLocationId]
                const customerName = customer?.name ?? job.customerName ?? 'Customer unavailable'
                const locationName = locationRecord?.locationName ?? job.serviceLocationName ?? 'Location unavailable'
                const dataQualityWarnings = getDataQualityWarnings(job, customer, locationRecord, assignments)

                return (
                  <article key={job.id} className={`compact-ticket-row ${readinessClass}`} aria-label={`${job.ticketNumber} compact ticket`}>
                    <div className="compact-ticket-primary">
                      <Link className="ticket-number-link" to={getTicketDetailPath(job.id)}>{job.ticketNumber}</Link>
                      <span>{job.title}</span>
                      <div className="compact-ticket-badges" aria-label={`${job.ticketNumber} status and priority`}>
                        <span className="compact-ticket-chip">{getJobTicketStatusLabel(job.status)}</span>
                        <span className="compact-ticket-chip compact-ticket-chip-priority">{getJobTicketPriorityLabel(job.priority)}</span>
                      </div>
                    </div>
                    <div><strong>{customerName}</strong><span>{locationName}</span></div>
                    <div><strong>Lead: {leadSummary}</strong><span>{assignmentSummary}</span></div>
                    <div className="compact-ticket-readiness">
                      <strong>{readiness.label}</strong>
                      <span>{readiness.isReady ? 'Ready for work.' : readiness.nextStep}</span>
                      {dataQualityWarnings.length ? (
                        <ul className="data-quality-warning-list compact-data-quality" aria-label={`${job.ticketNumber} data quality warnings`}>
                          {dataQualityWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                        </ul>
                      ) : null}
                    </div>
                    <div className="compact-ticket-timing"><strong>Scheduled: {formatDate(job.scheduledStartAtUtc)}</strong><span>Due: {formatDate(job.dueAtUtc)}</span></div>
                    <Link className="button-link secondary-link compact-ticket-open" to={getTicketDetailPath(job.id)}>Open Ticket</Link>
                  </article>
                )
              })}
            </div>
          ) : (
            <ul className="review-list ticket-queue-list">
            {filteredJobs.map((job) => {
              const assignments = assignmentDataUnavailable ? null : assignmentMap[job.id] ?? []
              const leadAssignments = assignments?.filter((item) => item.isLead) ?? []
              const leadSummary = assignmentDataUnavailable ? 'Assignment data unavailable' : leadAssignments.length ? leadAssignments.map(getAssignmentDisplayName).join(', ') : 'Needs lead'
              const assignmentSummary = assignmentDataUnavailable ? 'Assignment data unavailable' : assignments?.length ? assignments.map(getAssignmentDisplayName).join(', ') : 'Unassigned'
              const readiness = getDispatchReadiness(job, assignments)
              const readinessClass = readiness.isReady ? 'readiness-ready' : readiness.openItems > 0 || assignmentDataUnavailable ? 'readiness-review' : 'readiness-inactive'
              const customer = customers[job.customerId]
              const locationRecord = locations[job.serviceLocationId]
              const dataQualityWarnings = getDataQualityWarnings(job, customer, locationRecord, assignments)

              return (
                <li key={job.id} className={`ticket-list-item ${readinessClass}`}>
                  <div className="ticket-list-main">
                    <div>
                      <Link className="ticket-number-link" to={getTicketDetailPath(job.id)}>{job.ticketNumber}</Link>
                      <div className="ticket-title">{job.title}</div>
                      <div className="muted">{getJobTicketStatusLabel(job.status)} · {getJobTicketPriorityLabel(job.priority)}</div>
                    </div>
                    <div className="ticket-list-pills">
                      {(() => { const age = getTicketAgeInfo(job); return age && activeStatusValues.has(job.status) ? <span className={`status-pill ticket-age-pill ${age.cls}`}>{age.days}d old</span> : null })()}
                      <span className={`status-pill readiness-pill ${readinessClass}`}>{readiness.label}</span>
                    </div>
                  </div>
                  <div className="ticket-meta-grid">
                    <div><strong>Customer</strong><span>{customer?.name ?? job.customerName ?? 'Customer unavailable'}</span></div>
                    <div><strong>Location</strong><span>{locationRecord?.locationName ?? job.serviceLocationName ?? 'Location unavailable'}</span></div>
                    <div><strong>Assigned</strong><span>{assignmentSummary}</span></div>
                    <div><strong>Lead</strong><span>{leadSummary}</span></div>
                  </div>
                  {dataQualityWarnings.length ? (
                    <ul className="data-quality-warning-list" aria-label={`${job.ticketNumber} data quality warnings`}>
                      {dataQualityWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  ) : null}
                  <div className="readiness-panel">
                    <div>Assigned: {assignmentSummary} · Lead: {leadSummary}</div>
                    <div>Work status: {readiness.label} · {readiness.detail}</div>
                    <div>Next required update: {readiness.nextStep}</div>
                  </div>
                  <div className="ticket-meta-grid ticket-date-grid">
                    <div><strong>Created</strong><span>{formatDate(job.requestedAtUtc)}</span></div>
                    <div><strong>Scheduled</strong><span>{formatDate(job.scheduledStartAtUtc)}</span></div>
                    <div><strong>Due</strong><span>{formatDate(job.dueAtUtc)}</span></div>
                    <div><strong>Completed</strong><span>{formatDate(job.completedAtUtc)}</span></div>
                  </div>
                </li>
              )
            })}
            </ul>
          )}
        </section>
      ) : null}
    </section>
  )
}
