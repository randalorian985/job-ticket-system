import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { ApiError } from '../../api/httpClient'
import { useAuth } from '../../features/auth/AuthContext'
import type { JobTicketListItemDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from './jobDisplay'

function formatOptionalDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not set'
}

const displayRelatedName = (value: string | null | undefined, unavailableLabel: string) =>
  value?.trim() || unavailableLabel

const activeFieldWorkStatuses = new Set([2, 3, 4, 5, 6])
const fullyClosedStatuses = new Set([7, 8, 9, 10])

function getAssignedJobReadiness(job: JobTicketListItemDto) {
  const isActiveFieldWork = activeFieldWorkStatuses.has(job.status)
  const warnings = [
    isActiveFieldWork ? null : 'Ticket is no longer available for field work.',
    job.scheduledStartAtUtc ? null : 'Scheduled start has not been set.',
    job.dueAtUtc ? null : 'Due date has not been set.',
    job.customerId ? null : 'Customer has not been assigned.',
    job.serviceLocationId ? null : 'Service location has not been assigned.'
  ].filter((item): item is string => Boolean(item))

  return {
    label: !isActiveFieldWork
      ? 'Not active field work'
      : warnings.length ? 'Needs job review' : 'Ready to start',
    nextStep: warnings[0] ?? 'This job has the information needed to start work.',
    openItems: warnings.length,
    isActiveFieldWork
  }
}

function getAssignedJobActionLabel(readiness: ReturnType<typeof getAssignedJobReadiness>) {
  if (!readiness.isActiveFieldWork || readiness.openItems > 0) {
    return 'Review Job'
  }

  return 'Open / Clock In'
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
          setJobs(items.filter((item) => !fullyClosedStatuses.has(item.status)))
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

  const jobSummaries = useMemo(
    () => jobs.map((job) => ({ job, readiness: getAssignedJobReadiness(job) })),
    [jobs]
  )

  return (
    <main className="mobile-shell employee-workspace">
      <header className="card employee-work-header">
        <div>
          <p className="muted employee-eyebrow">Assigned work</p>
          <h1>My Jobs</h1>
          <p className="muted">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
        <button className="secondary-button logout-button" onClick={logout}>Logout</button>
      </header>

      {isLoading ? <p className="muted" role="status">Loading assigned jobs...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section className="stack" aria-label="assigned job list">
        {jobSummaries.map(({ job, readiness }) => {
          const readinessClass = readiness.openItems ? 'readiness-review' : 'readiness-ready'
          const statusLabel = getJobTicketStatusLabel(job.status)
          const priorityLabel = getJobTicketPriorityLabel(job.priority)
          const scheduledLabel = formatOptionalDateTime(job.scheduledStartAtUtc)
          const dueLabel = formatOptionalDateTime(job.dueAtUtc)
          const primaryActionLabel = getAssignedJobActionLabel(readiness)

          return (
            <article key={job.id} className={`card assigned-job-card assigned-job-card-compact ${readinessClass}`}>
              <div className="assigned-job-heading">
                <div>
                  <h2>{job.ticketNumber}</h2>
                  <p className="assigned-job-title">{job.title}</p>
                  <p className="muted assigned-job-location">
                    {displayRelatedName(job.customerName, 'Customer unavailable')} | {displayRelatedName(job.serviceLocationName, 'Service location unavailable')}
                  </p>
                </div>
                <span className={`status-pill readiness-pill ${readinessClass}`}>{statusLabel}</span>
              </div>

              <div className="assigned-job-chip-row" aria-label={`${job.ticketNumber} quick facts`}>
                <div><strong>Priority</strong><span>{priorityLabel}</span></div>
                <div><strong>Scheduled</strong><span>{scheduledLabel}</span></div>
                <div><strong>Due</strong><span>{dueLabel}</span></div>
              </div>

              <div className="assigned-job-context-line">
                <strong>Equipment Being Serviced</strong>
                <span>{displayRelatedName(job.equipmentName, 'See job instructions')}</span>
              </div>
              <p className="muted assigned-job-summary-line">{readiness.label}: {readiness.nextStep}</p>
              <Link
                aria-label={`${primaryActionLabel} ${job.ticketNumber}`}
                className="button-link assigned-job-primary-action"
                to={`/jobs/${job.id}`}
              >
                {primaryActionLabel}
              </Link>
            </article>
          )
        })}

        {!isLoading && !jobs.length ? <p className="muted">No assigned jobs found.</p> : null}
      </section>
    </main>
  )
}
