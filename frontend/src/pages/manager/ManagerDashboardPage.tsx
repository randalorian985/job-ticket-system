import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { useAuth } from '../../features/auth/AuthContext'
import type { JobTicketListItemDto } from '../../types'

const openStatuses = new Set([1, 2, 3, 4, 5, 6])

export function ManagerDashboardPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
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
    setIsLoadingSummary(true)
    jobTicketsApi.listAll()
      .then((response) => {
        setJobs(response)
        setSummaryError(null)
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
          setSummaryError('You do not have permission to load the operations summary.')
          return
        }

        setSummaryError('Unable to load the operations summary.')
      })
      .finally(() => setIsLoadingSummary(false))
  }, [])

  const summary = useMemo(() => ({
    open: jobs.filter((job) => openStatuses.has(job.status)).length,
    assigned: jobs.filter((job) => job.status === 3).length,
    inProgress: jobs.filter((job) => job.status === 4).length,
    waitingOnParts: jobs.filter((job) => job.status === 5).length,
    completedReviewReady: jobs.filter((job) => job.status === 7).length,
    invoiceReady: jobs.filter((job) => job.status === 10).length
  }), [jobs])

  return (
    <section className="stack">
      <article className="card">
        <h2>Operations Dashboard</h2>
        <p className="muted">Read-first operational visibility for manager and admin users.</p>
      </article>

      <article className="card stack" aria-label="operations summary">
        <div className="row">
          <h3>Job Summary</h3>
          <Link to="/manage/job-tickets">Review jobs</Link>
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
          </div>
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
