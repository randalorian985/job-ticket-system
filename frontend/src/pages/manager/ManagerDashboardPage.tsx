import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { useAuth } from '../../features/auth/AuthContext'
import type { JobTicketAssignmentDto, JobTicketListItemDto } from '../../types'

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
      open: jobs.filter((job) => openStatuses.has(job.status)).length,
      assigned: jobs.filter((job) => job.status === 3).length,
      inProgress: jobs.filter((job) => job.status === 4).length,
      waitingOnParts: jobs.filter((job) => job.status === 5).length,
      completedReviewReady: jobs.filter((job) => job.status === 7).length,
      invoiceReady: jobs.filter((job) => job.status === 10).length,
      dispatchReady: activeDispatchReadiness.filter((item) => !item.openItems.length).length,
      needsDispatchReview: activeDispatchReadiness.filter((item) => item.openItems.length).length,
      nextDispatchFocus: nextDispatchFocus
        ? `${nextDispatchFocus.job.ticketNumber}: ${nextDispatchFocus.openItems[0]}`
        : 'No dispatch blockers are visible from the dashboard data.'
    }
  }, [assignmentMap, jobs])

  return (
    <section className="stack">
      <article className="card">
        <h2>Operations Dashboard</h2>
        <p className="muted">Read-first operational visibility for manager and admin users.</p>
      </article>

      <article className="card stack" aria-label="operations summary">
        <div className="page-heading">
          <h3>Job Summary</h3>
          <div className="row dashboard-actions">
            <Link className="button-link" to="/manage/job-tickets/new">Create Job Ticket</Link>
            <Link to="/manage/job-tickets">Review jobs</Link>
          </div>
        </div>
        {isLoadingSummary ? <p className="muted" role="status">Loading operations summary…</p> : null}
        {summaryError ? <p className="error">{summaryError}</p> : null}
        {!isLoadingSummary && !summaryError ? (
          <div className="summary-grid">
            <div className="summary-card"><strong>{summary.open}</strong><span>Open jobs</span></div>
            <div className="summary-card"><strong>{summary.assigned}</strong><span>Assigned</span></div>
            <div className="summary-card"><strong>{summary.inProgress}</strong><span>In progress</span></div>
            <div className="summary-card"><strong>{summary.waitingOnParts}</strong><span>Waiting on parts</span></div>
            <div className="summary-card"><strong>{summary.completedReviewReady}</strong><span>Completed / review-ready</span></div>
            <div className="summary-card"><strong>{summary.invoiceReady}</strong><span>Invoice-ready</span></div>
            <div className="summary-card"><strong>{summary.dispatchReady}</strong><span>Dispatch-ready</span></div>
            <div className="summary-card"><strong>{summary.needsDispatchReview}</strong><span>Needs dispatch review</span></div>
          </div>
        ) : null}
        {!isLoadingSummary && !summaryError ? (
          <p className="muted">Next dispatch focus: {summary.nextDispatchFocus}</p>
        ) : null}
      </article>

      <section className="dashboard-grid">
        {links.map((item) => (
          <Link key={item.to} className="card nav-card" to={item.to}>
            <h3>{item.label}</h3>
          </Link>
        ))}
      </section>
    </section>
  )
}
