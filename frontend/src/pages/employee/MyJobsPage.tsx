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
    nextStep: warnings[0] ?? 'No field-context blockers are visible from the assigned-jobs list.',
    openItems: warnings.length,
    isActiveFieldWork
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

  const jobSummaries = useMemo(
    () => jobs.map((job) => ({ job, fieldContext: getAssignedJobListFieldContext(job) })),
    [jobs]
  )

  const activeCount = jobSummaries.filter((item) => item.fieldContext.isActiveFieldWork).length
  const needsReviewCount = jobSummaries.filter(
    (item) => item.fieldContext.isActiveFieldWork && item.fieldContext.openItems > 0
  ).length
  const nextJob = jobSummaries[0]

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

      {!isLoading && !error && jobs.length ? (
        <section className="employee-work-summary" aria-label="assigned jobs summary">
          <div><span>Assigned</span><strong>{jobs.length}</strong></div>
          <div><span>Active field work</span><strong>{activeCount}</strong></div>
          <div><span>Needs context review</span><strong>{needsReviewCount}</strong></div>
        </section>
      ) : null}

      {nextJob && !error ? (
        <section className="card employee-next-job" aria-label="next assigned job">
          <span className="muted employee-eyebrow">Next up</span>
          <h2>Start with the first assigned job</h2>
          <p className="muted">{nextJob.fieldContext.label}: {nextJob.fieldContext.nextStep}</p>
          <Link className="button-link" to={`/jobs/${nextJob.job.id}`}>Open First Job</Link>
        </section>
      ) : null}

      <section className="stack" aria-label="assigned job list">
        {jobSummaries.map(({ job, fieldContext }) => {
          const readinessClass = fieldContext.openItems ? 'readiness-review' : 'readiness-ready'
          const statusLabel = getJobTicketStatusLabel(job.status)
          const priorityLabel = getJobTicketPriorityLabel(job.priority)
          const dueLabel = formatOptionalDateTime(job.dueAtUtc)

          return (
            <article key={job.id} className={`card assigned-job-card ${readinessClass}`}>
              <div className="assigned-job-heading">
                <div>
                  <h2>{job.ticketNumber}</h2>
                  <p>{job.title}</p>
                </div>
                <span className={`status-pill readiness-pill ${readinessClass}`}>{fieldContext.label}</span>
              </div>
              <p className="muted assigned-job-summary-line">Status: {statusLabel} | Priority: {priorityLabel}</p>
              <p className="muted assigned-job-summary-line">Due: {dueLabel}</p>
              <p className="muted assigned-job-summary-line">Field context: {fieldContext.label}</p>
              <div className="assigned-job-meta">
                <div><strong>Status</strong><span>{statusLabel}</span></div>
                <div><strong>Priority</strong><span>{priorityLabel}</span></div>
                <div><strong>Scheduled</strong><span>{formatOptionalDateTime(job.scheduledStartAtUtc)}</span></div>
                <div><strong>Due</strong><span>{dueLabel}</span></div>
              </div>
              <div className="assigned-job-context">
                <div><strong>Customer ref</strong><span>{job.customerId}</span></div>
                <div><strong>Location ref</strong><span>{job.serviceLocationId}</span></div>
                <div><strong>Equipment</strong><span>Summary unavailable from assigned-jobs API</span></div>
              </div>
              <p className="muted">Next field-context fix: {fieldContext.nextStep}</p>
              <Link className="button-link secondary-link" to={`/jobs/${job.id}`}>Open Job</Link>
            </article>
          )
        })}

        {!isLoading && !jobs.length ? <p className="muted">No assigned jobs found.</p> : null}
      </section>
    </main>
  )
}
