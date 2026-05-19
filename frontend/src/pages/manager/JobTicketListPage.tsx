import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { ApiError } from '../../api/httpClient'
import type { CustomerDto, JobTicketListItemDto, ServiceLocationDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from '../employee/jobDisplay'
import { formatDate, jobStatusOptions, priorityOptions } from './managerDisplay'

const allFilterValue = 'all'
const activeStatusValues = new Set([2, 3, 4, 5, 6])
const waitingStatusValues = new Set([5, 6])

export function JobTicketListPage() {
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
  const [customers, setCustomers] = useState<Record<string, CustomerDto>>({})
  const [locations, setLocations] = useState<Record<string, ServiceLocationDto>>({})
  const [statusFilter, setStatusFilter] = useState(allFilterValue)
  const [priorityFilter, setPriorityFilter] = useState(allFilterValue)
  const [customerFilter, setCustomerFilter] = useState(allFilterValue)
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([jobTicketsApi.listAll(), masterDataApi.listCustomers(), masterDataApi.listServiceLocations()])
      .then(([tickets, customersResponse, locationsResponse]) => {
        setJobs(tickets)
        setCustomers(Object.fromEntries(customersResponse.map((item) => [item.id, item])))
        setLocations(Object.fromEntries(locationsResponse.map((item) => [item.id, item])))
        setError(null)
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
          setError('You do not have permission to load this manager view.')
          return
        }

        setError('Unable to load manager job tickets.')
      })
      .finally(() => setIsLoading(false))
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
      const matchesStatus = statusFilter === allFilterValue || String(job.status) === statusFilter
      const matchesPriority = priorityFilter === allFilterValue || String(job.priority) === priorityFilter
      const matchesCustomer = customerFilter === allFilterValue || job.customerId === customerFilter
      const matchesSearch = !normalizedSearch || [job.ticketNumber, job.title, customerName, locationName]
        .some((value) => value.toLocaleLowerCase().includes(normalizedSearch))

      return matchesStatus && matchesPriority && matchesCustomer && matchesSearch
    })
  }, [customerFilter, customers, jobs, locations, priorityFilter, searchText, statusFilter])

  const triageSummary = useMemo(() => {
    const activeJobs = filteredJobs.filter((job) => activeStatusValues.has(job.status))
    const urgentJobs = filteredJobs.filter((job) => job.priority === 4 && activeStatusValues.has(job.status))
    const waitingJobs = filteredJobs.filter((job) => waitingStatusValues.has(job.status))
    const unscheduledJobs = activeJobs.filter((job) => !job.scheduledStartAtUtc)

    return {
      activeCount: activeJobs.length,
      urgentCount: urgentJobs.length,
      waitingCount: waitingJobs.length,
      unscheduledCount: unscheduledJobs.length
    }
  }, [filteredJobs])

  const hasActiveFilters = statusFilter !== allFilterValue || priorityFilter !== allFilterValue || customerFilter !== allFilterValue || Boolean(searchText.trim())

  const resetFilters = () => {
    setStatusFilter(allFilterValue)
    setPriorityFilter(allFilterValue)
    setCustomerFilter(allFilterValue)
    setSearchText('')
  }

  return (
    <section className="card stack">
      <div className="row"><h2>Job Tickets</h2><Link to="/manage/job-tickets/new">Create Ticket</Link></div>
      <p className="muted">Search and filter the current manager job list using existing ticket data.</p>

      {!isLoading && !error && jobs.length ? (
        <section className="summary-grid" aria-label="queue summary">
          <div className="summary-card"><span>Active tickets</span><strong>{triageSummary.activeCount}</strong><span className="muted">Submitted through waiting statuses.</span></div>
          <div className="summary-card"><span>Urgent active</span><strong>{triageSummary.urgentCount}</strong><span className="muted">Urgent priority tickets still active.</span></div>
          <div className="summary-card"><span>Waiting</span><strong>{triageSummary.waitingCount}</strong><span className="muted">Waiting on parts or customer.</span></div>
          <div className="summary-card"><span>Unscheduled active</span><strong>{triageSummary.unscheduledCount}</strong><span className="muted">Active tickets without a start time.</span></div>
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
            {filteredJobs.map((job) => (
              <li key={job.id}>
                <Link to={`/manage/job-tickets/${job.id}`}>{job.ticketNumber}</Link> · {getJobTicketStatusLabel(job.status)} · {getJobTicketPriorityLabel(job.priority)}
                <div>{job.title}</div>
                <div className="muted">
                  {customers[job.customerId]?.name ?? job.customerId} / {locations[job.serviceLocationId]?.locationName ?? job.serviceLocationId}
                </div>
                <div className="muted">Created {formatDate(job.requestedAtUtc)} · Scheduled {formatDate(job.scheduledStartAtUtc)} · Completed {formatDate(job.completedAtUtc)}</div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}
