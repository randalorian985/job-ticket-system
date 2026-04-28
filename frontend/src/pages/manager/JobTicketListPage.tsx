import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { ApiError } from '../../api/httpClient'
import type { CustomerDto, JobTicketListItemDto, ServiceLocationDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from '../employee/jobDisplay'
import { formatDate } from './managerDisplay'

export function JobTicketListPage() {
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
  const [customers, setCustomers] = useState<Record<string, CustomerDto>>({})
  const [locations, setLocations] = useState<Record<string, ServiceLocationDto>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([jobTicketsApi.listAll(), masterDataApi.listCustomers(), masterDataApi.listServiceLocations()])
      .then(([tickets, customersResponse, locationsResponse]) => {
        setJobs(tickets)
        setCustomers(Object.fromEntries(customersResponse.map((item) => [item.id, item])))
        setLocations(Object.fromEntries(locationsResponse.map((item) => [item.id, item])))
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
          setError('You do not have permission to load this manager view.')
          return
        }

        setError('Unable to load manager job tickets.')
      })
  }, [])

  return (
    <section className="card">
      <div className="row"><h2>Job Tickets</h2><Link to="/manage/job-tickets/new">Create Ticket</Link></div>
      {error ? <p className="error">{error}</p> : null}
      {!jobs.length && !error ? <p className="muted">No job tickets found.</p> : null}
      <ul>
        {jobs.map((job) => (
          <li key={job.id}>
            <Link to={`/manage/job-tickets/${job.id}`}>{job.ticketNumber}</Link> · {getJobTicketStatusLabel(job.status)} · {getJobTicketPriorityLabel(job.priority)}
            <div className="muted">
              {customers[job.customerId]?.name ?? job.customerId} / {locations[job.serviceLocationId]?.locationName ?? job.serviceLocationId}
            </div>
            <div className="muted">Created {formatDate(job.requestedAtUtc)} · Scheduled {formatDate(job.scheduledStartAtUtc)} · Completed {formatDate(job.completedAtUtc)}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
