import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { ApiError } from '../../api/httpClient'
import type { CustomerDto, JobTicketAssignmentDto, JobTicketListItemDto, ServiceLocationDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from '../employee/jobDisplay'
import { formatDate, jobStatusOptions, priorityOptions } from './managerDisplay'

const allFilterValue = 'all'
const activeStatusValues = new Set([2, 3, 4, 5, 6])
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

const getDispatchReadiness = (job: JobTicketListItemDto, assignments: JobTicketAssignmentDto[]): DispatchReadiness => {
  if (!activeStatusValues.has(job.status)) {
    return {
      label: 'Not active dispatch',
      detail: 'Ticket is outside the active dispatch queue.',
      nextStep: 'No dispatch validation is needed until the ticket returns to an active status.',
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

export function JobTicketListPage() {
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
  const [assignmentMap, setAssignmentMap] = useState<Record<string, JobTicketAssignmentDto[]>>({})
  const [customers, setCustomers] = useState<Record<string, CustomerDto>>({})
  const [locations, setLocations] = useState<Record<string, ServiceLocationDto>>({})
  const [statusFilter, setStatusFilter] = useState(allFilterValue)
  const [priorityFilter, setPriorityFilter] = useState(allFilterValue)
  const [customerFilter, setCustomerFilter] = useState(allFilterValue)
  const [dispatchReadinessFilter, setDispatchReadinessFilter] = useState(allFilterValue)
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        const assignmentEntries = await Promise.all(
          tickets.map(async (ticket) => [
            ticket.id,
            await jobTicketsApi.listAssignments(ticket.id).catch(() => [])
          ] as const)
        )

        if (isCancelled) {
          return
        }

        setJobs(tickets)
        setAssignmentMap(Object.fromEntries(assignmentEntries))
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
      const customerName = customers[job.customerId]?.name ?? job.customerId
      const locationName = locations[job.serviceLocationId]?.locationName ?? job.serviceLocationId
      const readiness = getDispatchReadiness(job, assignmentMap[job.id] ?? [])
      const matchesStatus = statusFilter === allFilterValue || String(job.status) === statusFilter
      const matchesPriority = priorityFilter === allFilterValue || String(job.priority) === priorityFilter
      const matchesCustomer = customerFilter === allFilterValue || job.customerId === customerFilter
      const matchesDispatchReadiness = dispatchReadinessFilter === allFilterValue ||
        (dispatchReadinessFilter === 'ready' && readiness.isReady) ||
        (dispatchReadinessFilter === 'needs-review' && readiness.openItems > 0) ||
        (dispatchReadinessFilter === 'not-active' && !activeStatusValues.has(job.status))
      const matchesSearch = !normalizedSearch || [job.ticketNumber, job.title, customerName, locationName]
        .some((value) => value.toLocaleLowerCase().includes(normalizedSearch))

      return matchesStatus && matchesPriority && matchesCustomer && matchesDispatchReadiness && matchesSearch
    })
  }, [assignmentMap, customerFilter, customers, dispatchReadinessFilter, jobs, locations, priorityFilter, searchText, statusFilter])

  const triageSummary = useMemo(() => {
    const activeJobs = filteredJobs.filter((job) => activeStatusValues.has(job.status))
    const urgentJobs = filteredJobs.filter((job) => job.priority === 4 && activeStatusValues.has(job.status))
    const waitingJobs = filteredJobs.filter((job) => waitingStatusValues.has(job.status))
    const unscheduledJobs = activeJobs.filter((job) => !job.scheduledStartAtUtc)
    const missingDueDateJobs = activeJobs.filter((job) => !job.dueAtUtc)
    const unassignedJobs = activeJobs.filter((job) => !(assignmentMap[job.id]?.length))
    const needsLeadJobs = activeJobs.filter((job) => !(assignmentMap[job.id] ?? []).some((assignment) => assignment.isLead))
    const activeReadiness = activeJobs.map((job) => getDispatchReadiness(job, assignmentMap[job.id] ?? []))
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
  }, [assignmentMap, filteredJobs])

  const hasActiveFilters = statusFilter !== allFilterValue ||
    priorityFilter !== allFilterValue ||
    customerFilter !== allFilterValue ||
    dispatchReadinessFilter !== allFilterValue ||
    Boolean(searchText.trim())

  const resetFilters = () => {
    setStatusFilter(allFilterValue)
    setPriorityFilter(allFilterValue)
    setCustomerFilter(allFilterValue)
    setDispatchReadinessFilter(allFilterValue)
    setSearchText('')
  }

  return (
    <section className="card stack">
      <div className="row"><h2>Job Tickets</h2><Link to="/manage/job-tickets/new">Create Ticket</Link></div>
      <p className="muted">Search, filter, and isolate dispatch-ready or dispatch-review tickets using existing ticket and assignment data.</p>

      {!isLoading && !error && jobs.length ? (
        <section className="summary-grid" aria-label="queue summary">
          <div className="summary-card"><span>Active tickets</span><strong>{triageSummary.activeCount}</strong><span className="muted">Submitted through waiting statuses.</span></div>
          <div className="summary-card"><span>Urgent active</span><strong>{triageSummary.urgentCount}</strong><span className="muted">Urgent priority tickets still active.</span></div>
          <div className="summary-card"><span>Waiting</span><strong>{triageSummary.waitingCount}</strong><span className="muted">Waiting on parts or customer.</span></div>
          <div className="summary-card"><span>Unscheduled active</span><strong>{triageSummary.unscheduledCount}</strong><span className="muted">Active tickets without a start time.</span></div>
          <div className="summary-card"><span>Missing due date</span><strong>{triageSummary.missingDueDateCount}</strong><span className="muted">Active tickets without a due date.</span></div>
          <div className="summary-card"><span>Unassigned active</span><strong>{triageSummary.unassignedCount}</strong><span className="muted">Active tickets that still need an assigned tech.</span></div>
          <div className="summary-card"><span>Needs lead</span><strong>{triageSummary.needsLeadCount}</strong><span className="muted">Active tickets without a lead tech flag.</span></div>
          <div className="summary-card"><span>Dispatch-ready</span><strong>{triageSummary.dispatchReadyCount}</strong><span className="muted">Active tickets with assignment, lead, schedule, and due date.</span></div>
          <div className="summary-card"><span>Needs dispatch review</span><strong>{triageSummary.needsDispatchReviewCount}</strong><span className="muted">Active tickets missing assignment, lead, schedule, or due date context.</span></div>
        </section>
      ) : null}

      <section className="filter-panel" aria-label="job ticket filters">
        <label className="sr-label">
          Search tickets
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Ticket, title, customer, or location" />
        </label>
        <label className="sr-label">
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value={allFilterValue}>All statuses</option>
            {jobStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="sr-label">
          Priority
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value={allFilterValue}>All priorities</option>
            {priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="sr-label">
          Customer
          <select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}>
            <option value={allFilterValue}>All customers</option>
            {customerOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="sr-label">
          Dispatch readiness
          <select value={dispatchReadinessFilter} onChange={(event) => setDispatchReadinessFilter(event.target.value)}>
            {dispatchReadinessFilterOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <button type="button" className="secondary-button" onClick={resetFilters} disabled={!hasActiveFilters}>Reset Filters</button>
      </section>

      {isLoading ? <p className="muted" role="status">Loading manager job tickets…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!isLoading && !error && !jobs.length ? <p className="muted">No job tickets found. Create a ticket to start the pilot workflow.</p> : null}
      {!isLoading && !error && jobs.length > 0 && !filteredJobs.length ? <p className="muted">No job tickets match the current filters. Reset filters to see all tickets.</p> : null}

      {!isLoading && !error && filteredJobs.length ? (
        <>
          <p className="muted">Showing {filteredJobs.length} of {jobs.length} tickets.</p>
          <ul className="review-list">
            {filteredJobs.map((job) => {
              const assignments = assignmentMap[job.id] ?? []
              const leadAssignments = assignments.filter((item) => item.isLead)
              const leadSummary = leadAssignments.length ? leadAssignments.map((item) => item.employeeId).join(', ') : 'Needs lead'
              const assignmentSummary = assignments.length ? `${assignments.length} assigned` : 'Unassigned'
              const readiness = getDispatchReadiness(job, assignments)

              return (
                <li key={job.id}>
                  <Link to={`/manage/job-tickets/${job.id}`}>{job.ticketNumber}</Link> · {getJobTicketStatusLabel(job.status)} · {getJobTicketPriorityLabel(job.priority)}
                  <div>{job.title}</div>
                  <div className="muted">
                    {customers[job.customerId]?.name ?? job.customerId} / {locations[job.serviceLocationId]?.locationName ?? job.serviceLocationId}
                  </div>
                  <div className="muted">Dispatch {assignmentSummary} · Lead {leadSummary}</div>
                  <div className="muted">Dispatch readiness: {readiness.label} · {readiness.detail}</div>
                  <div className="muted">Next dispatch fix: {readiness.nextStep}</div>
                  <div className="muted">Created {formatDate(job.requestedAtUtc)} · Scheduled {formatDate(job.scheduledStartAtUtc)} · Due {formatDate(job.dueAtUtc)} · Completed {formatDate(job.completedAtUtc)}</div>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </section>
  )
}
