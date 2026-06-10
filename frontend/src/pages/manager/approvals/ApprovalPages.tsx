import { useEffect, useMemo, useState } from 'react'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { ApiError } from '../../../api/httpClient'
import { timeEntriesApi, type TimeEntryReviewFilters } from '../../../api/timeEntriesApi'
import type { JobTicketPartDto, TimeEntryDto } from '../../../types'
import { csvDataUri, toCsv, type CsvColumn } from '../../../utils/csv'
import { Errorable } from '../common/Errorable'
import { formatDate, getApprovalLabel } from '../managerDisplay'

type TimeApprovalFilter = 'all' | 'pending' | 'approved' | 'rejected'

const timeApprovalColumns: CsvColumn<TimeEntryDto>[] = [
  { header: 'Job Ticket Id', value: (entry) => entry.jobTicketId },
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
    default:
      return undefined
  }
}

const managerTimeError = (requestError: unknown, fallback: string) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return requestError.message
    if (requestError.status === 401 || requestError.status === 403) return 'You do not have permission to review manager time entries.'
  }

  return fallback
}

const startOfUtcDay = (date: string) => date ? `${date}T00:00:00.000Z` : undefined
const endOfUtcDay = (date: string) => date ? `${date}T23:59:59.999Z` : undefined

export function TimeApprovalPage() {
  const [jobId, setJobId] = useState('')
  const [entries, setEntries] = useState<TimeEntryDto[]>([])
  const [approvalFilter, setApprovalFilter] = useState<TimeApprovalFilter>('pending')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<TimeEntryDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const currentFilters = (): TimeEntryReviewFilters => ({
    jobTicketId: jobId.trim() || undefined,
    employeeId: employeeFilter.trim() || undefined,
    approvalStatus: getTimeApprovalFilterValue(approvalFilter),
    dateFromUtc: startOfUtcDay(dateFrom),
    dateToUtc: endOfUtcDay(dateTo)
  })

  const load = async (filters: TimeEntryReviewFilters = currentFilters()) => {
    try {
      setLoading(true)
      setError(null)
      const data = await timeEntriesApi.listForReview(filters)
      setEntries(data)
      setSelectedEntry((current) => current ? data.find((entry) => entry.id === current.id) ?? null : null)
      setMessage(`Loaded ${data.length} time entr${data.length === 1 ? 'y' : 'ies'} for review.`)
    } catch (requestError) {
      setError(managerTimeError(requestError, 'Unable to load the time approval queue.'))
      setMessage(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load({ approvalStatus: 1 })
    // The initial queue intentionally loads once with the default pending status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const summary = useMemo(() => {
    const counts = { visible: entries.length, pending: 0, approved: 0, rejected: 0, hours: 0, billableHours: 0 }

    for (const entry of entries) {
      if (entry.approvalStatus === 1) counts.pending += 1
      if (entry.approvalStatus === 2) counts.approved += 1
      if (entry.approvalStatus === 3) counts.rejected += 1
      counts.hours += entry.laborHours
      counts.billableHours += entry.billableHours
    }

    return counts
  }, [entries])

  const csv = useMemo(() => toCsv(entries, timeApprovalColumns), [entries])
  const csvHref = useMemo(() => csvDataUri(csv), [csv])

  return (
    <section className="card stack">
      <h2>Time Approval</h2>
      <p className="muted">
        Review pending time entries across job tickets, narrow the queue with optional filters, open entry details, and approve or reject pending work.
      </p>

      <article className="card stack">
        <div className="report-results-heading">
          <div>
            <h3>Approval queue filters</h3>
            <p className="muted">Pending entries load automatically. Every filter below is optional.</p>
          </div>
          {entries.length ? <a className="button-link" href={csvHref} download="time-approval-review.csv">Export visible rows as CSV</a> : null}
        </div>
        <div className="report-filters">
          <label>
            Date from
            <input aria-label="Date from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label>
            Date to
            <input aria-label="Date to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <label>
            Employee id
            <input aria-label="Employee id filter" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} placeholder="Optional employee id" />
          </label>
          <label>
            Job ticket id
            <input aria-label="Job ticket id filter" value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="Optional job ticket id" />
          </label>
          <label>
            Approval status
            <select aria-label="Approval status filter" value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value as TimeApprovalFilter)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All statuses</option>
            </select>
          </label>
          <button type="button" onClick={() => void load()} disabled={loading}>{loading ? 'Loading…' : 'Apply Filters'}</button>
        </div>
      </article>

      <Errorable error={error} />
      {message ? <p className="muted">{message}</p> : null}

      <div className="report-grid" aria-label="Time review summary">
        <article className="report-card"><h3>{summary.visible}</h3><p className="muted">Queue entries</p></article>
        <article className="report-card"><h3>{summary.pending}</h3><p className="muted">Pending approvals</p></article>
        <article className="report-card"><h3>{summary.approved}</h3><p className="muted">Approved entries</p></article>
        <article className="report-card"><h3>{summary.rejected}</h3><p className="muted">Rejected entries</p></article>
        <article className="report-card"><h3>{summary.hours.toLocaleString(undefined, { maximumFractionDigits: 2 })} h</h3><p className="muted">Queue labor hours</p></article>
        <article className="report-card"><h3>{summary.billableHours.toLocaleString(undefined, { maximumFractionDigits: 2 })} h</h3><p className="muted">Queue billable hours</p></article>
      </div>

      <article className="card stack" aria-live="polite">
        <div className="report-results-heading">
          <div>
            <h3>Time Entry Approval Queue</h3>
            <p className="muted">{entries.length ? `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} match the current filters.` : 'No time entries match the current filters.'}</p>
          </div>
        </div>
        {entries.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Job Ticket</th><th>Employee</th><th>Started</th><th>Ended</th><th className="numeric-cell">Labor Hours</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.jobTicketId}</td>
                    <td>{entry.employeeId}</td>
                    <td>{formatDate(entry.startedAtUtc)}</td>
                    <td>{formatDate(entry.endedAtUtc)}</td>
                    <td className="numeric-cell">{entry.laborHours.toLocaleString(undefined, { maximumFractionDigits: 2 })} h</td>
                    <td>{getApprovalLabel(entry.approvalStatus)}</td>
                    <td><div className="row">
                      <button type="button" onClick={() => setSelectedEntry(entry)}>View Details</button>
                      <button type="button" disabled={entry.approvalStatus !== 1} onClick={() => void approve(entry.id)}>Approve</button>
                      <button type="button" disabled={entry.approvalStatus !== 1} onClick={() => void reject(entry.id)}>Reject</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>

      {selectedEntry ? (
        <article className="card stack" aria-label="Time entry details">
          <div className="report-results-heading"><div><h3>Time Entry Details</h3><p className="muted">Entry {selectedEntry.id}</p></div><button type="button" onClick={() => setSelectedEntry(null)}>Close Details</button></div>
          <dl className="detail-grid">
            <div><dt>Job ticket</dt><dd>{selectedEntry.jobTicketId}</dd></div>
            <div><dt>Employee</dt><dd>{selectedEntry.employeeId}</dd></div>
            <div><dt>Started</dt><dd>{formatDate(selectedEntry.startedAtUtc)}</dd></div>
            <div><dt>Ended</dt><dd>{formatDate(selectedEntry.endedAtUtc)}</dd></div>
            <div><dt>Labor hours</dt><dd>{selectedEntry.laborHours}</dd></div>
            <div><dt>Billable hours</dt><dd>{selectedEntry.billableHours}</dd></div>
            <div><dt>Status</dt><dd>{getApprovalLabel(selectedEntry.approvalStatus)}</dd></div>
            <div><dt>Work summary</dt><dd>{selectedEntry.workSummary ?? '—'}</dd></div>
            <div><dt>Clock-in note</dt><dd>{selectedEntry.clockInNote ?? '—'}</dd></div>
            <div><dt>Clock-out note</dt><dd>{selectedEntry.clockOutNote ?? '—'}</dd></div>
            <div><dt>Rejection reason</dt><dd>{selectedEntry.rejectionReason ?? '—'}</dd></div>
          </dl>
          <div className="row">
            <button type="button" disabled={selectedEntry.approvalStatus !== 1} onClick={() => void approve(selectedEntry.id)}>Approve Entry</button>
            <button type="button" disabled={selectedEntry.approvalStatus !== 1} onClick={() => void reject(selectedEntry.id)}>Reject Entry</button>
          </div>
        </article>
      ) : null}
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
            {(part.partNumber && part.partName) ? `${part.partNumber} - ${part.partName}` : `Part ${part.partId ?? 'unlisted'}`}
            {part.isUnlistedPart ? ' (unlisted)' : ''} · Qty {part.quantity} · Added by {part.addedByEmployeeId ?? 'n/a'} · Cost {part.unitCostSnapshot} · Sale {part.salePriceSnapshot} · {getApprovalLabel(part.approvalStatus)}{' '}
            {part.officeOrderRequested ? 'Office order requested ' : ''}
            <button onClick={() => void approve(part.id)}>Approve</button>{' '}
            <button onClick={() => void reject(part.id)}>Reject</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
