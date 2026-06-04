import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { ApiError } from '../../api/httpClient'
import { useAuth } from '../../features/auth/AuthContext'
import type { JobTicketListItemDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from './jobDisplay'

function formatOptionalDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not set'
}

const activeFieldWorkStatuses = new Set([2, 3, 4, 5, 6])

function getAssignedJobListFieldContext(job: JobTicketListItemDto) {
  const isActiveFieldWork = activeFieldWorkStatuses.has(job.status)
  const warnings = [
    isActiveFieldWork ? null : 'Ticket is outside the active field-work queue.',
    job.scheduledStartAtUtc ? null : 'No scheduled start is visible from the assigned-jobs list.',
    job.dueAtUtc ? null : 'No due date is visible from the assigned-jobs list.',
    job.customerId ? null : 'No customer reference is visible from the assigned-jobs list.',
    job.serviceLocationId ? null : 'No service-location reference is visible from the assigned-jobs list.'
  ].filter((item): item is string => Boolean(item))

  return {
    label: !isActiveFieldWork
      ? 'Not active field work'
      : warnings.length ? 'Needs field-context review' : 'Ready for field-context review',
    nextStep: warnings[0] ?? 'No field-context blockers are visible from the assigned-jobs list.'
  }
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
        {jobs.map((job) => {
          const fieldContext = getAssignedJobListFieldContext(job)

          return (
            <article key={job.id} className="card">
              <h2>{job.ticketNumber}</h2>
              <p>{job.title}</p>
              <p className="muted">
                Status: {getJobTicketStatusLabel(job.status)} | Priority: {getJobTicketPriorityLabel(job.priority)}
              </p>
              <p className="muted">Customer ID: {job.customerId}</p>
              <p className="muted">Service Location ID: {job.serviceLocationId}</p>
              <p className="muted">Scheduled: {formatOptionalDateTime(job.scheduledStartAtUtc)}</p>
              <p className="muted">Due: {formatOptionalDateTime(job.dueAtUtc)}</p>
              <p className="muted">Field context: {fieldContext.label}</p>
              <p className="muted">Next field-context fix: {fieldContext.nextStep}</p>
              <p className="muted">Equipment: Summary unavailable from assigned-jobs API</p>
              <Link to={`/jobs/${job.id}`}>Open Job</Link>
            </article>
          )
        })}

        {!isLoading && !jobs.length ? <p>No assigned jobs found.</p> : null}
      </section>
    </main>
  )
}
