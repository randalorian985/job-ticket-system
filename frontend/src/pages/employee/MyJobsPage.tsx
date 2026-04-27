import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { ApiError } from '../../api/httpClient'
import { useAuth } from '../../features/auth/AuthContext'
import type { JobTicketListItemDto } from '../../types'

const statusLabels: Record<number, string> = {
  1: 'Draft',
  2: 'Submitted',
  3: 'Assigned',
  4: 'In Progress',
  5: 'Waiting on Parts',
  6: 'Waiting on Customer',
  7: 'Completed',
  8: 'Cancelled',
  9: 'Invoiced',
  10: 'Reviewed'
}

const priorityLabels: Record<number, string> = {
  1: 'Low',
  2: 'Normal',
  3: 'High',
  4: 'Urgent'
}

export function MyJobsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    jobTicketsApi
      .listMine()
      .then((items) => {
        if (isMounted) {
          setJobs(items)
        }
      })
      .catch((requestError) => {
        if (!(requestError instanceof ApiError)) {
          setError('Unable to load your jobs.')
          return
        }

        if (requestError.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }

        if (requestError.status === 403) {
          setError('Access denied. Your account is not allowed to view job tickets.')
          return
        }

        setError(requestError.message)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [logout, navigate])

  return (
    <main className="mobile-shell">
      <header className="card">
        <h1>My Jobs</h1>
        <p className="muted">
          {user?.firstName} {user?.lastName}
        </p>
        <button onClick={logout}>Logout</button>
      </header>

      {isLoading ? <p>Loading assigned jobs...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section className="stack">
        {jobs.map((job) => (
          <article key={job.id} className="card">
            <h2>{job.ticketNumber}</h2>
            <p>{job.title}</p>
            <p className="muted">
              Status: {statusLabels[job.status] ?? String(job.status)} | Priority: {priorityLabels[job.priority] ?? String(job.priority)}
            </p>
            <p className="muted">Customer ID: {job.customerId}</p>
            <p className="muted">Service Location ID: {job.serviceLocationId}</p>
            <p className="muted">Scheduled: {job.scheduledStartAtUtc ? new Date(job.scheduledStartAtUtc).toLocaleString() : 'Not set'}</p>
            <p className="muted">Due: {job.dueAtUtc ? new Date(job.dueAtUtc).toLocaleString() : 'Not set'}</p>
            <Link to={`/jobs/${job.id}`}>Open Job</Link>
          </article>
        ))}

        {!isLoading && !jobs.length ? <p>No assigned jobs found.</p> : null}
      </section>
    </main>
  )
}
