import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { ApiError } from '../../api/httpClient'
import type { CustomerDto, JobTicketAssignmentDto, JobTicketListItemDto, ServiceLocationDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from '../employee/jobDisplay'
import { formatDate, jobStatusOptions, priorityOptions } from './managerDisplay'
import { activeDispatchStatusValues, buildJobTicketDetailPath, normalizeJobTicketQueueSearchParams, readJobTicketQueueFilters } from './managerTaskNavigation'

const allFilterValue = 'all'
const activeStatusValues = activeDispatchStatusValues
const waitingStatusValues = new Set([5, 6])
const dispatchReadinessFilterOptions = [
  { value: allFilterValue, label: 'All dispatch readiness' },
  { value: 'ready', label: 'Dispatch-ready' },
  { value: 'needs-review', label: 'Needs dispatch review' },
  { value: 'not-active', label: 'Not active dispatch' }
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

const getDispatchReadiness = (job: JobTicketListItemDto, assignments: JobTicketAssignmentDto[] | null): DispatchReadiness => {
  if (!activeStatusValues.has(job.status)) {
    return {
      label: 'Not active dispatch',
      detail: 'Ticket is outside the active dispatch queue.',
      nextStep: 'No dispatch validation is needed until the ticket returns to an active status.',
      openItems: 0,
      isReady: false
    }
  }

  if (!assignments) {
    return {
      label: 'Assignment data unavailable',
      detail: 'Assignment data could not be loaded for this ticket.',
      nextStep: 'Reload assignments before using dispatch readiness to make assignment decisions.',
      openItems: 0,
      isReady: false
    }
  }

  const openItems: Array<{ label: string, nextStep: string }> = []

  if (!assignments.length) {
    openItems.push({
      label: 'assignment',
      nextStep: 'Assign at least one employee before dispatch.'
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
      nextStep: 'Set a scheduled start time before dispatch.'
    })
  }

  if (!job.dueAtUtc) {
    openItems.push({
      label: 'due date',
      nextStep: 'Add a due date so dispatch can see timing expectations.'
    })
  }

  if (!openItems.length) {
    return {
      label: 'Ready for dispatch',
      detail: 'Assignment, lead tech, schedule, and due date are present.',
      nextStep: 'No dispatch blockers are visible from the loaded list data.',
      openItems: 0,
      isReady: true
    }
  }

  return {
    label: 'Needs dispatch review',
    detail: `Missing ${openItems.map((item) => item.label).join(', ')}.`,
    nextStep: openItems[0].nextStep,
    openItems: openItems.length,
    isReady: false
  }
}

const getAssignmentDisplayName = (assignment: JobTicketAssignmentDto) => assignment.employeeName?.trim() || assignment.employeeId

export function JobTicketListPage() {
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
  const [assignmentMap, setAssignmentMap] = useState<Record<string, JobTicketAssignmentDto[]>>({})
  const [assignmentDataUnavailable, setAssignmentDataUnavailable] = useState(false)
  const [customers, setCustomers] = useState<Record<string, CustomerDto>>({})
  const [locations, setLocations] = useState<Record<string, ServiceLocationDto>>({})
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

  const resetFilters = () => setSearchParams({}, { replace: true })

  const queuePath = `${location.pathname}${normalizedSearch ? `?${normalizedSearch}` : ''}`
  const getTicketDetailPath = (jobTicketId: string) =>
    buildJobTicketDetailPath(jobTicketId, queuePath)

  return (
    <section className="job-ticket-queue-page stack" aria-label="manager job ticket queue">
      <header className="job-ticket-queue-header">
        <div>
          <h2>Job Tickets</h2>
          <p className="muted">Search, filter, and isolate dispatch-ready or dispatch-review tickets using existing ticket and assignment data.</p>
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
            {jobStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
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
          Dispatch readiness
          <select value={dispatchReadinessFilter} onChange={(event) => updateFilter('readiness', event.target.value)} disabled={assignmentDataUnavailable}>
            {dispatchReadinessFilterOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <button type="button" className="secondary-button" onClick={resetFilters} disabled={!hasActiveFilters}>Reset Filters</button>
      </section>

      {!isLoading && !error && jobs.length ? (
        <section className="queue-shortcuts" aria-label="queue summary">
          <div className="queue-shortcuts-heading">
            <div>
              <h3>Queue shortcuts</h3>
              <p className="muted">Select a count to filter the ticket list.</p>
            </div>
            {hasActiveFilters ? <span className="status-pill">Filtered view</span> : null}
          </div>
          <div className="queue-kpi-grid">
            <button aria-pressed={statusFilter === 'active' && priorityFilter === allFilterValue && dispatchReadinessFilter === allFilterValue && attentionFilter === allFilterValue} className="queue-kpi-card" onClick={() => applyQueuePreset({ status: 'active' })} title="Show submitted through waiting statuses" type="button"><span>Active tickets</span><strong>{triageSummary.activeCount}</strong></button>
            <button aria-pressed={statusFilter === 'active' && priorityFilter === '4'} className="queue-kpi-card queue-kpi-card-alert" onClick={() => applyQueuePreset({ status: 'active', priority: '4' })} title="Show urgent active tickets" type="button"><span>Urgent active</span><strong>{triageSummary.urgentCount}</strong></button>
            <button aria-pressed={statusFilter === 'waiting'} className="queue-kpi-card" onClick={() => applyQueuePreset({ status: 'waiting' })} title="Show tickets waiting on parts or customers" type="button"><span>Waiting</span><strong>{triageSummary.waitingCount}</strong></button>
            <button aria-pressed={attentionFilter === 'unscheduled'} className="queue-kpi-card" onClick={() => applyQueuePreset({ attention: 'unscheduled' })} title="Show active tickets without a scheduled start" type="button"><span>Unscheduled</span><strong>{triageSummary.unscheduledCount}</strong></button>
            <button aria-pressed={attentionFilter === 'missing-due'} className="queue-kpi-card" onClick={() => applyQueuePreset({ attention: 'missing-due' })} title="Show active tickets without a due date" type="button"><span>Missing due</span><strong>{triageSummary.missingDueDateCount}</strong></button>
            {assignmentDataUnavailable ? (
              <div className="queue-kpi-card queue-kpi-card-review queue-kpi-card-static"><span>Assignments</span><strong>Unavailable</strong></div>
            ) : (
              <>
                <button aria-pressed={attentionFilter === 'unassigned'} className="queue-kpi-card" onClick={() => applyQueuePreset({ attention: 'unassigned' })} title="Show active tickets that need an assigned technician" type="button"><span>Unassigned</span><strong>{triageSummary.unassignedCount}</strong></button>
                <button aria-pressed={attentionFilter === 'needs-lead'} className="queue-kpi-card" onClick={() => applyQueuePreset({ attention: 'needs-lead' })} title="Show active tickets without a lead technician" type="button"><span>Needs lead</span><strong>{triageSummary.needsLeadCount}</strong></button>
                <button aria-pressed={dispatchReadinessFilter === 'ready'} className="queue-kpi-card queue-kpi-card-ready" onClick={() => applyQueuePreset({ status: 'active', readiness: 'ready' })} title="Show dispatch-ready tickets" type="button"><span>Dispatch-ready</span><strong>{triageSummary.dispatchReadyCount}</strong></button>
                <button aria-pressed={dispatchReadinessFilter === 'needs-review'} className="queue-kpi-card queue-kpi-card-review" onClick={() => applyQueuePreset({ status: 'active', readiness: 'needs-review' })} title="Show tickets that need dispatch review" type="button"><span>Needs review</span><strong>{triageSummary.needsDispatchReviewCount}</strong></button>
              </>
            )}
          </div>
        </section>
      ) : null}

      {!isLoading && !error && assignmentDataUnavailable ? (
        <p className="queue-warning warning" role="status">Assignment data could not be loaded for one or more tickets. Assignment ownership, lead-tech status, and dispatch-readiness filters are unavailable until assignments reload.</p>
      ) : null}

      {isLoading ? <p className="muted" role="status">Loading manager job tickets…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!isLoading && !error && !jobs.length ? <p className="muted">No job tickets found. Create a ticket to start the pilot workflow.</p> : null}
      {!isLoading && !error && jobs.length > 0 && !filteredJobs.length ? <p className="muted">No job tickets match the current filters. Reset filters to see all tickets.</p> : null}

      {!isLoading && !error && filteredJobs.length ? (
        <section className="queue-results-panel" aria-label="job ticket results">
          <div className="queue-results-heading">
            <h3>Ticket Queue</h3>
            <span className="muted">Showing {filteredJobs.length} of {jobs.length} tickets.</span>
          </div>
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
                    <div><strong>Customer</strong><span>{customers[job.customerId]?.name ?? 'Customer unavailable'}</span></div>
                    <div><strong>Location</strong><span>{locations[job.serviceLocationId]?.locationName ?? 'Location unavailable'}</span></div>
                    <div><strong>Assigned</strong><span>{assignmentSummary}</span></div>
                    <div><strong>Lead</strong><span>{leadSummary}</span></div>
                  </div>
                  <div className="readiness-panel">
                    <div>Assigned: {assignmentSummary} · Lead: {leadSummary}</div>
                    <div>Dispatch readiness: {readiness.label} · {readiness.detail}</div>
                    <div>Next dispatch fix: {readiness.nextStep}</div>
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
        </section>
      ) : null}
    </section>
  )
}
