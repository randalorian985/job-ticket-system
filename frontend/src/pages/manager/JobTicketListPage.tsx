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
import { activeDispatchStatusValues, buildJobTicketDetailPath, normalizeJobTicketQueueSearchParams, readJobTicketQueueFilters } from './managerTaskNavigation'

const allFilterValue = 'all'
const activeStatusValues = activeDispatchStatusValues
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

const normalizeStatusFilterOptions = (options: TicketStatusFilterOptionDto[]) =>
  options
    .filter((option) => option.isActive && Number.isInteger(option.status) && option.status >= 1 && option.status <= 10)
    .sort((left, right) => left.displayOrder - right.displayOrder || left.displayLabel.localeCompare(right.displayLabel))

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

    return jobs.filter((job) => {
      const customerName = customers[job.customerId]?.name ?? 'Customer unavailable'
      const locationName = locations[job.serviceLocationId]?.locationName ?? 'Location unavailable'
      const assignments = assignmentDataUnavailable ? null : assignmentMap[job.id] ?? []
      const assignmentNames = assignments?.map((item) => getAssignmentDisplayName(item)) ?? []
      const readiness = getDispatchReadiness(job, assignments)
      const matchesStatus = statusFilter === allFilterValue
        || (statusFilter === 'active' && activeStatusValues.has(job.status))
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

      return matchesStatus && matchesPriority && matchesCustomer && matchesDispatchReadiness && matchesAttention && matchesSearch
    })
  }, [assignmentDataUnavailable, assignmentMap, attentionFilter, customerFilter, customers, dispatchReadinessFilter, jobs, locations, priorityFilter, searchText, statusFilter])

  const triageSummary = useMemo(() => {
    const activeJobs = jobs.filter((job) => activeStatusValues.has(job.status))
    const urgentJobs = jobs.filter((job) => job.priority === 4 && activeStatusValues.has(job.status))
    const waitingJobs = jobs.filter((job) => waitingStatusValues.has(job.status))
    const unscheduledJobs = activeJobs.filter((job) => !job.scheduledStartAtUtc)
    const missingDueDateJobs = activeJobs.filter((job) => !job.dueAtUtc)
    const unassignedJobs = assignmentDataUnavailable ? [] : activeJobs.filter((job) => !(assignmentMap[job.id]?.length))
    const needsLeadJobs = assignmentDataUnavailable ? [] : activeJobs.filter((job) => !(assignmentMap[job.id] ?? []).some((assignment) => assignment.isLead))
    const activeReadiness = assignmentDataUnavailable ? [] : activeJobs.map((job) => getDispatchReadiness(job, assignmentMap[job.id] ?? []))
    const dispatchReadyJobs = activeReadiness.filter((item) => item.isReady)
    const needsDispatchReviewJobs = activeReadiness.filter((item) => item.openItems > 0)

    return {
      activeCount: activeJobs.length,
      urgentCount: urgentJobs.length,
      waitingCount: waitingJobs.length,
      unscheduledCount: unscheduledJobs.length,
      missingDueDateCount: missingDueDateJobs.length,
      unassignedCount: unassignedJobs.length,
      needsLeadCount: needsLeadJobs.length,
      dispatchReadyCount: dispatchReadyJobs.length,
      needsDispatchReviewCount: needsDispatchReviewJobs.length
    }
  }, [assignmentDataUnavailable, assignmentMap, jobs])

  const hasActiveFilters = statusFilter !== allFilterValue ||
    priorityFilter !== allFilterValue ||
    customerFilter !== allFilterValue ||
    dispatchReadinessFilter !== allFilterValue ||
    attentionFilter !== allFilterValue ||
    Boolean(searchText.trim())

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
          : `Showing all ${jobs.length} loaded tickets.`

  const resetFilters = () => setSearchParams({}, { replace: true })

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
        <section className="queue-shortcuts" aria-label="queue summary">
          <div className="queue-shortcuts-heading">
            <div>
              <h3>Quick Views</h3>
              <p className="muted">Use a few common views. Full status options stay in the filters above.</p>
            </div>
            {hasActiveFilters ? <span className="status-pill">Filtered view</span> : null}
          </div>
          <div className="queue-kpi-grid">
            <button aria-pressed={statusFilter === 'active' && priorityFilter === allFilterValue && dispatchReadinessFilter === allFilterValue && attentionFilter === allFilterValue} className="queue-kpi-card" onClick={() => applyQueuePreset({ status: 'active' })} title="Show submitted through waiting statuses" type="button"><span>Active tickets</span><strong>{triageSummary.activeCount}</strong></button>
            <button aria-pressed={statusFilter === 'waiting'} className="queue-kpi-card" onClick={() => applyQueuePreset({ status: 'waiting' })} title="Show tickets waiting on parts or customers" type="button"><span>Waiting</span><strong>{triageSummary.waitingCount}</strong></button>
            <button aria-pressed={attentionFilter === 'missing-due'} className="queue-kpi-card" onClick={() => applyQueuePreset({ attention: 'missing-due' })} title="Show active tickets without a due date" type="button"><span>Missing due</span><strong>{triageSummary.missingDueDateCount}</strong></button>
            {assignmentDataUnavailable ? (
              <div className="queue-kpi-card queue-kpi-card-review queue-kpi-card-static"><span>Technician Assignments</span><strong>Unavailable</strong></div>
            ) : (
              <>
                <button aria-pressed={attentionFilter === 'unassigned'} className="queue-kpi-card" onClick={() => applyQueuePreset({ attention: 'unassigned' })} title="Show active tickets that need an assigned technician" type="button"><span>Unassigned</span><strong>{triageSummary.unassignedCount}</strong></button>
                <button aria-pressed={dispatchReadinessFilter === 'needs-review'} className="queue-kpi-card queue-kpi-card-review" onClick={() => applyQueuePreset({ status: 'active', readiness: 'needs-review' })} title="Show tickets that need assignment or schedule review" type="button"><span>Needs review</span><strong>{triageSummary.needsDispatchReviewCount}</strong></button>
                <button aria-pressed={dispatchReadinessFilter === 'ready'} className="queue-kpi-card queue-kpi-card-ready" onClick={() => applyQueuePreset({ status: 'active', readiness: 'ready' })} title="Show tickets ready for work" type="button"><span>Ready to work</span><strong>{triageSummary.dispatchReadyCount}</strong></button>
              </>
            )}
          </div>
        </section>
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
                <span>Assigned Tech</span>
                <span>Status / Priority</span>
                <span>Schedule</span>
                <span>Due</span>
                <span>Action</span>
              </div>
              {filteredJobs.map((job) => {
                const assignments = assignmentDataUnavailable ? null : assignmentMap[job.id] ?? []
                const leadAssignments = assignments?.filter((item) => item.isLead) ?? []
                const leadSummary = assignmentDataUnavailable ? 'Assignment data unavailable' : leadAssignments.length ? leadAssignments.map(getAssignmentDisplayName).join(', ') : 'Needs lead'
                const assignmentSummary = assignmentDataUnavailable ? 'Assignment data unavailable' : assignments?.length ? assignments.map(getAssignmentDisplayName).join(', ') : 'Unassigned'
                const readiness = getDispatchReadiness(job, assignments)
                const readinessClass = readiness.isReady ? 'readiness-ready' : readiness.openItems > 0 || assignmentDataUnavailable ? 'readiness-review' : 'readiness-inactive'
                const customerName = customers[job.customerId]?.name ?? job.customerName ?? 'Customer unavailable'
                const locationName = locations[job.serviceLocationId]?.locationName ?? job.serviceLocationName ?? 'Location unavailable'

                return (
                  <article key={job.id} className={`compact-ticket-row ${readinessClass}`} aria-label={`${job.ticketNumber} compact ticket`}>
                    <div className="compact-ticket-primary">
                      <Link className="ticket-number-link" to={getTicketDetailPath(job.id)}>{job.ticketNumber}</Link>
                      <span>{job.title}</span>
                    </div>
                    <div><strong>{customerName}</strong><span>{locationName}</span></div>
                    <div><strong>{leadSummary}</strong><span>{assignmentSummary}</span></div>
                    <div><strong>{getJobTicketStatusLabel(job.status)}</strong><span>{getJobTicketPriorityLabel(job.priority)}</span></div>
                    <div><strong>{formatDate(job.scheduledStartAtUtc)}</strong><span>{readiness.label}</span></div>
                    <div><strong>{formatDate(job.dueAtUtc)}</strong><span>{readiness.openItems ? readiness.nextStep : 'Ready for work.'}</span></div>
                    <Link className="button-link secondary-link compact-ticket-open" to={getTicketDetailPath(job.id)}>Open</Link>
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

              return (
                <li key={job.id} className={`ticket-list-item ${readinessClass}`}>
                  <div className="ticket-list-main">
                    <div>
                      <Link className="ticket-number-link" to={getTicketDetailPath(job.id)}>{job.ticketNumber}</Link>
                      <div className="ticket-title">{job.title}</div>
                      <div className="muted">{getJobTicketStatusLabel(job.status)} · {getJobTicketPriorityLabel(job.priority)}</div>
                    </div>
                    <span className={`status-pill readiness-pill ${readinessClass}`}>{readiness.label}</span>
                  </div>
                  <div className="ticket-meta-grid">
                    <div><strong>Customer</strong><span>{customers[job.customerId]?.name ?? job.customerName ?? 'Customer unavailable'}</span></div>
                    <div><strong>Location</strong><span>{locations[job.serviceLocationId]?.locationName ?? job.serviceLocationName ?? 'Location unavailable'}</span></div>
                    <div><strong>Assigned</strong><span>{assignmentSummary}</span></div>
                    <div><strong>Lead</strong><span>{leadSummary}</span></div>
                  </div>
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
