import { useMemo, useState } from 'react'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { ApiError } from '../../../api/httpClient'
import { timeEntriesApi } from '../../../api/timeEntriesApi'
import type { JobTicketPartDto, TimeEntryDto } from '../../../types'
import { csvDataUri, toCsv, type CsvColumn } from '../../../utils/csv'
import { Errorable } from '../common/Errorable'
import { formatDate, getApprovalLabel } from '../managerDisplay'

type TimeApprovalFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'invoiced'

const timeApprovalColumns: CsvColumn<TimeEntryDto>[] = [
  { header: 'Employee Id', value: (entry) => entry.employeeId },
  { header: 'Started At UTC', value: (entry) => entry.startedAtUtc },
  { header: 'Ended At UTC', value: (entry) => entry.endedAtUtc ?? '' },
  { header: 'Labor Hours', value: (entry) => entry.laborHours },
  { header: 'Billable Hours', value: (entry) => entry.billableHours },
  { header: 'Approval Status', value: (entry) => getApprovalLabel(entry.approvalStatus) },
  { header: 'Work Summary', value: (entry) => entry.workSummary ?? '' },
  { header: 'Rejection Reason', value: (entry) => entry.rejectionReason ?? '' }
]

const getTimeApprovalFilterValue = (value: TimeApprovalFilter) => {
  switch (value) {
    case 'pending':
      return 1
    case 'approved':
      return 2
    case 'rejected':
      return 3
    case 'invoiced':
      return 4
    default:
      return null
  }
}

const managerTimeError = (requestError: unknown, fallback: string) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return requestError.message
    if (requestError.status === 401 || requestError.status === 403) return 'You do not have permission to review manager time entries.'
  }

  return fallback
}

export function TimeApprovalPage() {
  const [jobId, setJobId] = useState('')
  const [entries, setEntries] = useState<TimeEntryDto[]>([])
  const [approvalFilter, setApprovalFilter] = useState<TimeApprovalFilter>('all')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    if (!jobId.trim()) {
      setError('Enter a job ticket id before loading time review.')
      setMessage(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await timeEntriesApi.listByJob(jobId.trim())
      setEntries(data)
      setMessage(`Loaded ${data.length} time entr${data.length === 1 ? 'y' : 'ies'} for review.`)
    } catch (requestError) {
      setError(managerTimeError(requestError, 'Unable to load time entries for job.'))
      setMessage(null)
    } finally {
      setLoading(false)
    }
  }

  const approve = async (id: string) => {
    try {
      await timeEntriesApi.approve(id, { approvedByUserId: '' })
      setError(null)
      setMessage('Time entry approved.')
      await load()
    } catch (requestError) {
      setError(managerTimeError(requestError, 'Unable to approve time entry.'))
      setMessage(null)
    }
  }

  const reject = async (id: string) => {
    try {
      await timeEntriesApi.reject(id, { rejectedByUserId: '', reason: 'Rejected in manager review' })
      setError(null)
      setMessage('Time entry rejected.')
      await load()
    } catch (requestError) {
      setError(managerTimeError(requestError, 'Unable to reject time entry.'))
      setMessage(null)
    }
  }

  const visibleEntries = useMemo(() => {
    const approvalStatus = getTimeApprovalFilterValue(approvalFilter)
    const normalizedEmployee = employeeFilter.trim().toLowerCase()

    return entries.filter((entry) => {
      if (approvalStatus !== null && entry.approvalStatus !== approvalStatus) return false
      if (normalizedEmployee && !entry.employeeId.toLowerCase().includes(normalizedEmployee)) return false
      return true
    })
  }, [approvalFilter, employeeFilter, entries])

  const summary = useMemo(() => {
    const counts = {
      visible: visibleEntries.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      hours: 0,
      billableHours: 0
    }

    for (const entry of visibleEntries) {
      if (entry.approvalStatus === 1) counts.pending += 1
      if (entry.approvalStatus === 2) counts.approved += 1
      if (entry.approvalStatus === 3) counts.rejected += 1
      counts.hours += entry.laborHours
      counts.billableHours += entry.billableHours
    }

    return counts
  }, [visibleEntries])

  const csv = useMemo(() => toCsv(visibleEntries, timeApprovalColumns), [visibleEntries])
  const csvHref = useMemo(() => csvDataUri(csv), [csv])

  return (
    <section className="card stack">
      <h2>Time Approval</h2>
      <p className="muted">
        Load a job ticket, review the visible time-entry slice, filter the rows you care about, export that same slice to CSV, and approve or reject pending entries.
      </p>
      <div className="report-filters">
        <label>
          Job ticket id
          <input value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="Job ticket id" />
        </label>
        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Load Time Entries'}
        </button>
      </div>
      <Errorable error={error} />
      {message ? <p className="muted">{message}</p> : null}

      <article className="card stack">
        <div className="report-results-heading">
          <div>
            <h3>Visible review filters</h3>
            <p className="muted">Adjust the visible slice without reloading the job.</p>
          </div>
          {visibleEntries.length ? (
            <a className="button-link" href={csvHref} download={`time-review-${jobId.trim() || 'job'}.csv`}>
              Export visible rows as CSV
            </a>
          ) : null}
        </div>
        <div className="report-filters">
          <label>
            Approval status
            <select aria-label="Approval status filter" value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value as TimeApprovalFilter)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="invoiced">Invoiced</option>
            </select>
          </label>
          <label>
            Employee contains
            <input aria-label="Employee contains" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} placeholder="Employee id filter" />
          </label>
        </div>
        <div className="report-grid" aria-label="Time review summary">
          <article className="report-card"><h3>{summary.visible}</h3><p className="muted">Visible entries</p></article>
          <article className="report-card"><h3>{summary.pending}</h3><p className="muted">Pending approvals</p></article>
          <article className="report-card"><h3>{summary.approved}</h3><p className="muted">Approved entries</p></article>
          <article className="report-card"><h3>{summary.rejected}</h3><p className="muted">Rejected entries</p></article>
          <article className="report-card"><h3>{summary.hours.toLocaleString(undefined, { maximumFractionDigits: 2 })} h</h3><p className="muted">Visible labor hours</p></article>
          <article className="report-card"><h3>{summary.billableHours.toLocaleString(undefined, { maximumFractionDigits: 2 })} h</h3><p className="muted">Visible billable hours</p></article>
        </div>
      </article>

      <article className="card stack" aria-live="polite">
        <div className="report-results-heading">
          <div>
            <h3>Loaded Time Review</h3>
            <p className="muted">
              {visibleEntries.length
                ? `${visibleEntries.length} visible entr${visibleEntries.length === 1 ? 'y' : 'ies'} for manager review.`
                : 'Load a job ticket to review export-friendly time-entry rows.'}
            </p>
          </div>
        </div>
        {visibleEntries.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Started</th>
                  <th>Ended</th>
                  <th className="numeric-cell">Labor Hours</th>
                  <th className="numeric-cell">Billable Hours</th>
                  <th>Status</th>
                  <th>Work Summary</th>
                  <th>Rejection Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.employeeId}</td>
                    <td>{formatDate(entry.startedAtUtc)}</td>
                    <td>{formatDate(entry.endedAtUtc)}</td>
                    <td className="numeric-cell">{entry.laborHours.toLocaleString(undefined, { maximumFractionDigits: 2 })} h</td>
                    <td className="numeric-cell">{entry.billableHours.toLocaleString(undefined, { maximumFractionDigits: 2 })} h</td>
                    <td>{getApprovalLabel(entry.approvalStatus)}</td>
                    <td>{entry.workSummary ?? '—'}</td>
                    <td>{entry.rejectionReason ?? '—'}</td>
                    <td>
                      <div className="row">
                        <button type="button" disabled={entry.approvalStatus !== 1} onClick={() => void approve(entry.id)}>Approve</button>
                        <button type="button" disabled={entry.approvalStatus !== 1} onClick={() => void reject(entry.id)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No time entries match the current review filters.</p>
        )}
      </article>
    </section>
  )
}

export function PartsApprovalPage() {
  const [jobId, setJobId] = useState('')
  const [parts, setParts] = useState<JobTicketPartDto[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = () =>
    jobId ? jobTicketsApi.listParts(jobId).then(setParts).catch(() => setError('Unable to load job parts for approval.')) : Promise.resolve()

  const approve = async (id: string) => {
    await jobTicketsApi.approvePart(jobId, id)
    await load()
  }

  const reject = async (id: string) => {
    await jobTicketsApi.rejectPart(jobId, id, { rejectionReason: 'Rejected in manager review' })
    await load()
  }

  return (
    <section className="card stack">
      <h2>Parts Approval</h2>
      <input value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="Job ticket id" />
      <button onClick={() => void load()}>Load Job Parts</button>
      <Errorable error={error} />
      <ul>
        {parts.map((part) => (
          <li key={part.id}>
            Part {part.partId} · Qty {part.quantity} · Added by {part.addedByEmployeeId ?? 'n/a'} · Cost {part.unitCostSnapshot} · Sale {part.salePriceSnapshot} · {getApprovalLabel(part.approvalStatus)}{' '}
            <button onClick={() => void approve(part.id)}>Approve</button>{' '}
            <button onClick={() => void reject(part.id)}>Reject</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
