import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { useAuth } from '../../features/auth/AuthContext'
import type { JobTicketAssignmentDto, JobTicketListItemDto } from '../../types'
import { buildJobTicketDetailPath } from './managerTaskNavigation'
import './ManagerDashboardPage.css'

const openStatuses = new Set([1, 2, 3, 4, 5, 6])
const activeDispatchStatuses = new Set([2, 3, 4, 5, 6])

function getDispatchOpenItems(job: JobTicketListItemDto, assignments: JobTicketAssignmentDto[]) {
  if (!activeDispatchStatuses.has(job.status)) {
    return []
  }

  return [
    assignments.length ? null : 'Assign at least one employee before dispatch.',
    assignments.some((assignment) => assignment.isLead) ? null : 'Mark one assigned employee as the lead tech.',
    job.scheduledStartAtUtc ? null : 'Set a scheduled start time before dispatch.',
    job.dueAtUtc ? null : 'Add a due date so dispatch can see timing expectations.'
  ].filter((item): item is string => Boolean(item))
}

function getPercent(count: number, max: number) {
  if (max <= 0) {
    return 0
  }

  return Math.round((count / max) * 100)
}

export function ManagerDashboardPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
  const [assignmentMap, setAssignmentMap] = useState<Record<string, JobTicketAssignmentDto[]>>({})
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const links = [
    { to: '/manage/job-tickets', label: 'Job Tickets' },
    { to: '/manage/customers', label: 'Customers' },
    { to: '/manage/service-locations', label: 'Service Locations' },
    { to: '/manage/equipment', label: 'Equipment' },
    { to: '/manage/parts', label: 'Parts' },
    { to: '/manage/time-approval', label: 'Time Approval' },
    { to: '/manage/parts-approval', label: 'Parts Approval' },
    { to: '/manage/reports', label: 'Reports' }
  ]

  if (user?.role === 'Admin') {
    links.push({ to: '/manage/users', label: 'Users' })
  }

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
    const activeDispatchJobs = jobs.filter((job) => activeDispatchStatuses.has(job.status))
    const activeDispatchReadiness = activeDispatchJobs.map((job) => ({
      job,
      openItems: getDispatchOpenItems(job, assignmentMap[job.id] ?? [])
    }))
    const nextDispatchFocus = activeDispatchReadiness.find((item) => item.openItems.length)

    return {
      allJobs: jobs.length,
      open: jobs.filter((job) => openStatuses.has(job.status)).length,
      submitted: jobs.filter((job) => job.status === 2).length,
      assigned: jobs.filter((job) => job.status === 3).length,
      inProgress: jobs.filter((job) => job.status === 4).length,
      waitingOnParts: jobs.filter((job) => job.status === 5).length,
      completedReviewReady: jobs.filter((job) => job.status === 7).length,
      invoiceReady: jobs.filter((job) => job.status === 10).length,
      dispatchReady: activeDispatchReadiness.filter((item) => !item.openItems.length).length,
      needsDispatchReview: activeDispatchReadiness.filter((item) => item.openItems.length).length,
      nextDispatchFocus: nextDispatchFocus
        ? `${nextDispatchFocus.job.ticketNumber}: ${nextDispatchFocus.openItems[0]}`
        : 'No dispatch blockers are visible from the dashboard data.',
      nextDispatchFocusId: nextDispatchFocus?.job.id ?? null
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
    { label: 'Dispatch-ready', count: summary.dispatchReady, to: '/manage/job-tickets?status=active&readiness=ready' },
    { label: 'Needs dispatch review', count: summary.needsDispatchReview, to: '/manage/job-tickets?status=active&readiness=needs-review' }
  ]
  const maxReadinessCount = Math.max(summary.dispatchReady, summary.needsDispatchReview, 1)

  return (
    <section className="manager-dashboard-board" aria-label="manager operations dashboard">
      <header className="dashboard-hero-strip">
        <div>
          <h2>Job ticket management dashboard</h2>
          <p className="muted">Manager/Admin view for dispatch readiness, open work, and back-office review queues.</p>
        </div>
        <div className="row dashboard-actions">
          <Link className="button-link" to="/manage/job-tickets/new">Create Job Ticket</Link>
          <Link to="/manage/job-tickets">Review jobs</Link>
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
            <Link className="operations-kpi-tile operations-queue-link" to="/manage/job-tickets?status=active&readiness=ready"><span>Dispatch-ready</span><strong>{summary.dispatchReady}</strong></Link>
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
            <h3>Dispatch Readiness</h3>
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
            <p className="muted">
              Next dispatch focus:{' '}
              {summary.nextDispatchFocusId ? (
                <Link to={buildJobTicketDetailPath(summary.nextDispatchFocusId, "/manage")}>{summary.nextDispatchFocus}</Link>
              ) : summary.nextDispatchFocus}
            </p>
          </article>

          <article className="operations-panel">
            <h3>Back Office Review</h3>
            <div className="operations-review-grid">
              <Link className="operations-queue-link" to="/manage/job-tickets?status=7"><strong>{summary.completedReviewReady}</strong><span>Completed / review-ready</span></Link>
              <Link className="operations-queue-link" to="/manage/job-tickets?status=10"><strong>{summary.invoiceReady}</strong><span>Invoice-ready</span></Link>
              <Link className="operations-queue-link" to="/manage/job-tickets?status=active&readiness=needs-review"><strong>{summary.needsDispatchReview}</strong><span>Needs dispatch review</span></Link>
            </div>
          </article>
        </section>
      ) : null}

      <section className="operations-panel operations-nav-panel" aria-label="manager workspace links">
        <h3>Manager Workspace</h3>
        <div className="dashboard-grid operations-link-grid">
          {links.map((item) => (
            <Link key={item.to} className="nav-card operations-link" to={item.to}>
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </section>
  )
}
