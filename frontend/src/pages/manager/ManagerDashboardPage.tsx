import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import type { JobTicketAssignmentDto, JobTicketListItemDto } from '../../types'
import { buildJobTicketDetailPath } from './managerTaskNavigation'
import './ManagerDashboardPage.css'

const openStatuses = new Set([1, 2, 3, 4, 5, 6])
const activeWorkStatuses = new Set([2, 3, 4, 5, 6])

function getAssignmentOpenItems(job: JobTicketListItemDto, assignments: JobTicketAssignmentDto[]) {
  if (!activeWorkStatuses.has(job.status)) {
    return []
  }

  return [
    assignments.length ? null : 'Assign at least one employee.',
    assignments.some((assignment) => assignment.isLead) ? null : 'Mark one assigned employee as the lead tech.',
    job.scheduledStartAtUtc ? null : 'Set a scheduled start time.',
    job.dueAtUtc ? null : 'Add a due date for timing expectations.'
  ].filter((item): item is string => Boolean(item))
}

function getPercent(count: number, max: number) {
  if (max <= 0) {
    return 0
  }

  return Math.round((count / max) * 100)
}

function getAssignmentActionText(openItem: string) {
  switch (openItem) {
    case 'Assign at least one employee.':
      return 'needs at least one assigned employee.'
    case 'Mark one assigned employee as the lead tech.':
      return 'needs one assigned employee marked as lead tech.'
    case 'Set a scheduled start time.':
      return 'needs a scheduled start time.'
    case 'Add a due date for timing expectations.':
      return 'needs a due date.'
    default:
      return openItem
  }
}

export function ManagerDashboardPage() {
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
  const [assignmentMap, setAssignmentMap] = useState<Record<string, JobTicketAssignmentDto[]>>({})
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    setIsLoadingSummary(true)
    const load = async () => {
      try {
        const response = await jobTicketsApi.listAll()
        const assignmentEntries = await Promise.all(
          response.map(async (job) => [
            job.id,
            await jobTicketsApi.listAssignments(job.id)
          ] as const)
        )

        if (isCancelled) {
          return
        }

        setJobs(response)
        setAssignmentMap(Object.fromEntries(assignmentEntries))
        setSummaryError(null)
      } catch (requestError) {
        if (isCancelled) {
          return
        }

        if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
          setSummaryError('You do not have permission to load the operations summary.')
          return
        }

        setSummaryError('Unable to load the operations summary.')
      } finally {
        if (!isCancelled) {
          setIsLoadingSummary(false)
        }
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [])

  const summary = useMemo(() => {
    const activeWorkJobs = jobs.filter((job) => activeWorkStatuses.has(job.status))
    const activeWorkReadiness = activeWorkJobs.map((job) => ({
      job,
      openItems: getAssignmentOpenItems(job, assignmentMap[job.id] ?? [])
    }))
    const nextAssignmentFocus = activeWorkReadiness.find((item) => item.openItems.length)

    return {
      allJobs: jobs.length,
      open: jobs.filter((job) => openStatuses.has(job.status)).length,
      submitted: jobs.filter((job) => job.status === 2).length,
      assigned: jobs.filter((job) => job.status === 3).length,
      inProgress: jobs.filter((job) => job.status === 4).length,
      waitingOnParts: jobs.filter((job) => job.status === 5).length,
      completedReviewReady: jobs.filter((job) => job.status === 7).length,
      invoiceReady: jobs.filter((job) => job.status === 10).length,
      readyToWork: activeWorkReadiness.filter((item) => !item.openItems.length).length,
      needsAssignmentReview: activeWorkReadiness.filter((item) => item.openItems.length).length,
      nextAssignmentFocus: nextAssignmentFocus
        ? getAssignmentActionText(nextAssignmentFocus.openItems[0])
        : 'No assignment or schedule blockers are visible from the dashboard data.',
      nextAssignmentFocusId: nextAssignmentFocus?.job.id ?? null,
      nextAssignmentTicketNumber: nextAssignmentFocus?.job.ticketNumber ?? null
    }
  }, [assignmentMap, jobs])

  const maxStatusCount = Math.max(summary.open, summary.submitted, summary.assigned, summary.inProgress, summary.waitingOnParts, summary.completedReviewReady, summary.invoiceReady, 1)
  const statusRows = [
    { label: 'Open jobs', count: summary.open, to: '/manage/job-tickets?status=active' },
    { label: 'Submitted', count: summary.submitted, to: '/manage/job-tickets?status=2' },
    { label: 'Assigned', count: summary.assigned, to: '/manage/job-tickets?status=3' },
    { label: 'In progress', count: summary.inProgress, to: '/manage/job-tickets?status=4' },
    { label: 'Waiting on parts', count: summary.waitingOnParts, to: '/manage/job-tickets?status=5' },
    { label: 'Completed / review-ready', count: summary.completedReviewReady, to: '/manage/job-tickets?status=7' },
    { label: 'Invoice-ready', count: summary.invoiceReady, to: '/manage/job-tickets?status=10' }
  ]
  const readinessRows = [
    { label: 'Ready to work', count: summary.readyToWork, to: '/manage/job-tickets?status=active&readiness=ready' },
    { label: 'Needs assignment review', count: summary.needsAssignmentReview, to: '/manage/job-tickets?status=active&readiness=needs-review' }
  ]
  const maxReadinessCount = Math.max(summary.readyToWork, summary.needsAssignmentReview, 1)

  return (
    <section className="manager-dashboard-board" aria-label="manager operations dashboard">
      <header className="dashboard-hero-strip">
        <div>
          <h2>Job Ticket Management Dashboard</h2>
          <p className="muted">Manager/Admin summary for open work, technician assignment, scheduling, and back-office review queues.</p>
        </div>
        <div className="row dashboard-actions">
          <Link className="button-link" to="/manage/job-tickets/new">Create Job Ticket</Link>
          <Link className="button-link secondary-link" to="/manage/job-tickets">Review jobs</Link>
          <Link className="button-link secondary-link" to="/manage/wiki#manager-admin-workspace">Wiki</Link>
        </div>
      </header>

      <section className="operations-kpi-grid" aria-label="operations summary">
        {isLoadingSummary ? <p className="muted" role="status">Loading operations summary...</p> : null}
        {summaryError ? <p className="error">{summaryError}</p> : null}
        {!isLoadingSummary && !summaryError ? (
          <>
            <Link className="operations-kpi-tile operations-queue-link" to="/manage/job-tickets?status=active"><span>Open Jobs</span><strong>{summary.open}</strong></Link>
            <Link className="operations-kpi-tile operations-queue-link" to="/manage/job-tickets?status=3"><span>Assigned</span><strong>{summary.assigned}</strong></Link>
            <Link className="operations-kpi-tile operations-queue-link" to="/manage/job-tickets?status=4"><span>In Progress</span><strong>{summary.inProgress}</strong></Link>
            <Link className="operations-kpi-tile operations-queue-link" to="/manage/job-tickets?status=5"><span>Waiting on Parts</span><strong>{summary.waitingOnParts}</strong></Link>
            <Link className="operations-kpi-tile operations-queue-link" to="/manage/job-tickets?status=active&readiness=ready"><span>Ready to Work</span><strong>{summary.readyToWork}</strong></Link>
            <Link className="operations-kpi-tile operations-queue-link" to="/manage/job-tickets"><span>All Jobs</span><strong>{summary.allJobs}</strong></Link>
          </>
        ) : null}
      </section>

      {!isLoadingSummary && !summaryError ? (
        <section className="operations-panel-grid">
          <article className="operations-panel">
            <h3>Unresolved Jobs by Status</h3>
            <div className="operations-bar-list">
              {statusRows.map((row) => (
                <Link className="operations-bar-row operations-queue-link" key={row.label} to={row.to}>
                  <span>{row.label}</span>
                  <div className="operations-bar-track" aria-hidden="true">
                    <div className="operations-bar-fill" style={{ width: `${getPercent(row.count, maxStatusCount)}%` }} />
                  </div>
                  <strong>{row.count}</strong>
                </Link>
              ))}
            </div>
          </article>

          <article className="operations-panel">
            <h3>Scheduling</h3>
            <div className="operations-bar-list">
              {readinessRows.map((row) => (
                <Link className="operations-bar-row operations-queue-link" key={row.label} to={row.to}>
                  <span>{row.label}</span>
                  <div className="operations-bar-track" aria-hidden="true">
                    <div className="operations-bar-fill operations-bar-fill-accent" style={{ width: `${getPercent(row.count, maxReadinessCount)}%` }} />
                  </div>
                  <strong>{row.count}</strong>
                </Link>
              ))}
            </div>
            <div className="operations-next-assignment" aria-label="next scheduling action">
              <span>Next scheduling action</span>
              {summary.nextAssignmentFocusId ? (
                <div className="operations-next-assignment-body">
                  <Link className="operations-next-assignment-ticket" to={buildJobTicketDetailPath(summary.nextAssignmentFocusId, "/manage")}>
                    {summary.nextAssignmentTicketNumber}
                  </Link>
                  <p>{summary.nextAssignmentFocus}</p>
                  <Link className="button-link secondary-link operations-next-assignment-action" to={buildJobTicketDetailPath(summary.nextAssignmentFocusId, "/manage")}>
                    Schedule
                  </Link>
                </div>
              ) : (
                <p>{summary.nextAssignmentFocus}</p>
              )}
            </div>
          </article>

          <article className="operations-panel">
            <h3>Back Office Review</h3>
            <div className="operations-review-grid">
              <Link className="operations-queue-link" to="/manage/job-tickets?status=7"><strong>{summary.completedReviewReady}</strong><span>Completed / review-ready</span></Link>
              <Link className="operations-queue-link" to="/manage/job-tickets?status=10"><strong>{summary.invoiceReady}</strong><span>Invoice-ready</span></Link>
              <Link className="operations-queue-link" to="/manage/job-tickets?status=active&readiness=needs-review"><strong>{summary.needsAssignmentReview}</strong><span>Needs assignment review</span></Link>
            </div>
          </article>
        </section>
      ) : null}

    </section>
  )
}
