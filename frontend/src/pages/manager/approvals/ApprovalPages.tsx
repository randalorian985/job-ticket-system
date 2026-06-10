import { useEffect, useMemo, useState } from 'react'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { ApiError } from '../../../api/httpClient'
import { timeEntriesApi, type TimeEntryReviewFilters } from '../../../api/timeEntriesApi'
import { usersApi } from '../../../api/usersApi'
import type { AssignableEmployeeDto, JobTicketPartDto, TimeEntryDto } from '../../../types'
import { csvDataUri, toCsv, type CsvColumn } from '../../../utils/csv'
import { Errorable } from '../common/Errorable'
import { formatDate, getApprovalLabel } from '../managerDisplay'

type TimeApprovalFilter = 'all' | 'pending' | 'approved' | 'rejected'

const timeApprovalColumns: CsvColumn<TimeEntryDto>[] = [
  { header: 'Employee', value: (entry) => entry.employeeName ?? '' },
  { header: 'Job Ticket', value: (entry) => entry.jobTicketNumber ?? entry.jobTicketId },
  { header: 'Job Name', value: (entry) => entry.jobName ?? '' },
  { header: 'Customer', value: (entry) => entry.customerName ?? '' },
  { header: 'Site / Location', value: (entry) => entry.siteName ?? entry.locationName ?? '' },
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
  const [entries, setEntries] = useState<TimeEntryDto[]>([])
  const [employees, setEmployees] = useState<AssignableEmployeeDto[]>([])
  const [approvalFilter, setApprovalFilter] = useState<TimeApprovalFilter>('pending')
  const [employeeName, setEmployeeName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<TimeEntryDto | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editStartedAt, setEditStartedAt] = useState('')
  const [editEndedAt, setEditEndedAt] = useState('')
  const [editLaborHours, setEditLaborHours] = useState('')
  const [editBillableHours, setEditBillableHours] = useState('')
  const [managerNote, setManagerNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const employeeDisplayName = (employee: AssignableEmployeeDto) => `${employee.firstName} ${employee.lastName}`
  const toLocalInput = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : ''
  const managerLocationText = (entry: TimeEntryDto) => [...new Set([entry.customerName, entry.siteName, entry.locationName, entry.locationAddress].filter(Boolean))].join(' · ') || '—'

  const currentFilters = (): TimeEntryReviewFilters => ({
    employeeId: employeeId || undefined,
    approvalStatus: getTimeApprovalFilterValue(approvalFilter),
    dateFromUtc: startOfUtcDay(dateFrom),
    dateToUtc: endOfUtcDay(dateTo),
    search: search.trim() || undefined
  })

  const load = async (filters: TimeEntryReviewFilters = currentFilters()) => {
    try {
      setLoading(true)
      setError(null)
      const data = await timeEntriesApi.listForReview(filters)
      setEntries(data)
      setSelectedIds((current) => current.filter((id) => data.some((entry) => entry.id === id && entry.approvalStatus === 1 && entry.endedAtUtc)))
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
    void Promise.all([
      load({ approvalStatus: 1 }),
      usersApi.listAssignableEmployees().then(setEmployees)
    ]).catch((requestError) => setError(managerTimeError(requestError, 'Unable to load time approval filters.')))
    // The initial queue intentionally loads once with the default pending status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openReview = (entry: TimeEntryDto) => {
    setSelectedEntry(entry)
    setEditStartedAt(toLocalInput(entry.startedAtUtc))
    setEditEndedAt(toLocalInput(entry.endedAtUtc))
    setEditLaborHours(String(entry.laborHours))
    setEditBillableHours(String(entry.billableHours))
    setManagerNote('')
    setRejectionReason(entry.rejectionReason ?? '')
    setError(null)
  }

  const approve = async (id: string) => {
    try {
      await timeEntriesApi.approve(id, { approvedByUserId: '' })
      setError(null)
      setMessage('Time entry approved.')
      setSelectedEntry(null)
      await load()
    } catch (requestError) {
      setError(managerTimeError(requestError, 'Unable to approve time entry.'))
    }
  }

  const reject = async (id: string) => {
    if (!rejectionReason.trim()) {
      setError('A rejection reason is required.')
      return
    }
    try {
      await timeEntriesApi.reject(id, { rejectedByUserId: '', reason: rejectionReason.trim() })
      setError(null)
      setMessage('Time entry rejected.')
      setSelectedEntry(null)
      await load()
    } catch (requestError) {
      setError(managerTimeError(requestError, 'Unable to reject time entry.'))
    }
  }

  const editAndApprove = async (id: string) => {
    const startedAt = new Date(editStartedAt)
    const endedAt = new Date(editEndedAt)
    const laborHours = Number(editLaborHours)
    const billableHours = Number(editBillableHours)
    if (!editStartedAt || !editEndedAt || endedAt <= startedAt) return setError('End time must be after start time.')
    if (laborHours < 0) return setError('Total hours cannot be negative.')
    if (billableHours < 0 || billableHours > laborHours) return setError('Billable hours must be between zero and total hours.')
    if (!managerNote.trim()) return setError('A manager approval note is required when editing time.')

    try {
      await timeEntriesApi.editAndApprove(id, {
        adjustedByUserId: '',
        reason: managerNote.trim(),
        managerOverride: true,
        startedAtUtc: startedAt.toISOString(),
        endedAtUtc: endedAt.toISOString(),
        laborHours,
        billableHours,
        notes: managerNote.trim()
      })
      setError(null)
      setMessage('Time entry changes were saved and approved.')
      setSelectedEntry(null)
      await load()
    } catch (requestError) {
      setError(managerTimeError(requestError, 'Unable to edit and approve time entry.'))
    }
  }

  const bulkApprove = async () => {
    try {
      await timeEntriesApi.bulkApprove(selectedIds)
      setSelectedIds([])
      setError(null)
      setMessage('Selected time entries approved.')
      await load()
    } catch (requestError) {
      setError(managerTimeError(requestError, 'Unable to approve selected time entries.'))
    }
  }

  const eligibleEntries = entries.filter((entry) => entry.approvalStatus === 1 && Boolean(entry.endedAtUtc))
  const allEligibleSelected = eligibleEntries.length > 0 && eligibleEntries.every((entry) => selectedIds.includes(entry.id))
  const summary = useMemo(() => entries.reduce((counts, entry) => ({
    visible: counts.visible + 1,
    pending: counts.pending + (entry.approvalStatus === 1 ? 1 : 0),
    approved: counts.approved + (entry.approvalStatus === 2 ? 1 : 0),
    rejected: counts.rejected + (entry.approvalStatus === 3 ? 1 : 0),
    hours: counts.hours + entry.laborHours,
    billableHours: counts.billableHours + entry.billableHours
  }), { visible: 0, pending: 0, approved: 0, rejected: 0, hours: 0, billableHours: 0 }), [entries])

  const csv = useMemo(() => toCsv(entries, timeApprovalColumns), [entries])
  const csvHref = useMemo(() => csvDataUri(csv), [csv])

  return (
    <section className="card stack">
      <h2>Time Approval</h2>
      <p className="muted">Pending work loads automatically so managers can understand, review, and approve the queue without knowing internal IDs.</p>

      <article className="card stack">
        <div className="report-results-heading">
          <div><h3>Approval queue filters</h3><p className="muted">Pending entries load automatically. Every filter below is optional.</p></div>
          {entries.length ? <a className="button-link" href={csvHref} download="time-approval-review.csv">Export visible rows as CSV</a> : null}
        </div>
        <div className="report-filters">
          <label>Date from<input aria-label="Date from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>Date to<input aria-label="Date to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
          <label>
            Employee
            <input
              aria-label="Employee filter"
              list="time-approval-employees"
              value={employeeName}
              placeholder="All employees"
              onChange={(event) => {
                const value = event.target.value
                setEmployeeName(value)
                setEmployeeId(employees.find((employee) => employeeDisplayName(employee) === value)?.id ?? '')
              }}
            />
            <datalist id="time-approval-employees">{employees.map((employee) => <option key={employee.id} value={employeeDisplayName(employee)} />)}</datalist>
          </label>
          <label>
            Approval status
            <select aria-label="Approval status filter" value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value as TimeApprovalFilter)}>
              <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All</option>
            </select>
          </label>
          <label>Search<input aria-label="Approval queue search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search job ticket, customer, site, location…" /></label>
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
        <article className="report-card"><h3>{summary.hours.toFixed(2)}</h3><p className="muted">Queue labor hours</p></article>
        <article className="report-card"><h3>{summary.billableHours.toFixed(2)}</h3><p className="muted">Queue billable hours</p></article>
      </div>

      <article className="card stack">
        <div className="report-results-heading">
          <div><h3>Time Entry Approval Queue</h3><p className="muted">{entries.length ? `${entries.length} entries match the current filters.` : 'No time entries match the current filters.'}</p></div>
          <button type="button" disabled={selectedIds.length === 0 || loading} onClick={() => void bulkApprove()}>Approve Selected ({selectedIds.length})</button>
        </div>
        {entries.length ? (
          <div className="table-scroll"><table className="time-approval-table"><thead><tr>
            <th><input aria-label="Select all eligible entries" type="checkbox" checked={allEligibleSelected} onChange={(event) => setSelectedIds(event.target.checked ? eligibleEntries.map((entry) => entry.id) : [])} /></th>
            <th>Employee</th><th>Work date</th><th>Job ticket</th><th>Customer / site / location</th><th>Labor type</th><th>Start</th><th>End</th><th>Total</th><th>Billable</th><th>Status</th><th>Notes</th><th>Action</th>
          </tr></thead><tbody>{entries.map((entry) => {
            const eligible = entry.approvalStatus === 1 && Boolean(entry.endedAtUtc)
            return <tr key={entry.id}>
              <td><input aria-label={`Select ${entry.employeeName ?? entry.id}`} type="checkbox" disabled={!eligible} checked={selectedIds.includes(entry.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))} /></td>
              <td>{entry.employeeName ?? 'Unknown employee'}</td><td>{new Date(entry.startedAtUtc).toLocaleDateString()}</td>
              <td><strong>{entry.jobTicketNumber ?? entry.jobTicketId}</strong><br /><span className="muted">{entry.jobName ?? ''}</span></td>
              <td>{managerLocationText(entry)}</td>
              <td>{entry.laborType ?? '—'}</td><td>{new Date(entry.startedAtUtc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</td><td>{entry.endedAtUtc ? new Date(entry.endedAtUtc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Open'}</td>
              <td>{entry.laborHours.toFixed(2)}</td><td>{entry.billableHours.toFixed(2)}</td><td>{getApprovalLabel(entry.approvalStatus)}</td>
              <td>{entry.workSummary || entry.clockInNote || entry.clockOutNote || entry.managerNotes ? '●' : '—'}</td><td><button type="button" onClick={() => openReview(entry)}>Review</button></td>
            </tr>
          })}</tbody></table></div>
        ) : null}
      </article>

      {selectedEntry ? (
        <article className="card stack" aria-label="Time entry review">
          <div className="report-results-heading"><div><h3>Review Time Entry</h3><p className="muted">{selectedEntry.employeeName} · {selectedEntry.jobTicketNumber}</p></div><button type="button" onClick={() => setSelectedEntry(null)}>Close Review</button></div>
          <dl className="detail-grid">
            <div><dt>Employee</dt><dd>{selectedEntry.employeeName ?? 'Unknown employee'}</dd></div><div><dt>Work date</dt><dd>{new Date(selectedEntry.startedAtUtc).toLocaleDateString()}</dd></div>
            <div><dt>Job ticket</dt><dd>{selectedEntry.jobTicketNumber ?? selectedEntry.jobTicketId} · {selectedEntry.jobName}</dd></div><div><dt>Customer / site / location</dt><dd>{managerLocationText(selectedEntry)}</dd></div>
            <div><dt>Original submitted start</dt><dd>{formatDate(selectedEntry.startedAtUtc)}</dd></div><div><dt>Original submitted end</dt><dd>{formatDate(selectedEntry.endedAtUtc)}</dd></div>
            <div><dt>Original total hours</dt><dd>{selectedEntry.laborHours}</dd></div><div><dt>Original billable hours</dt><dd>{selectedEntry.billableHours}</dd></div>
            <div><dt>Employee notes</dt><dd>{[selectedEntry.workSummary, selectedEntry.clockInNote, selectedEntry.clockOutNote].filter(Boolean).join(' · ') || '—'}</dd></div><div><dt>Status</dt><dd>{getApprovalLabel(selectedEntry.approvalStatus)}</dd></div>
          </dl>
          <div className="report-filters">
            <label>Approved start<input aria-label="Approved start time" type="datetime-local" value={editStartedAt} onChange={(event) => setEditStartedAt(event.target.value)} /></label>
            <label>Approved end<input aria-label="Approved end time" type="datetime-local" value={editEndedAt} onChange={(event) => setEditEndedAt(event.target.value)} /></label>
            <label>Total hours<input aria-label="Approved total hours" type="number" min="0" step="0.25" value={editLaborHours} onChange={(event) => setEditLaborHours(event.target.value)} /></label>
            <label>Billable hours<input aria-label="Approved billable hours" type="number" min="0" step="0.25" value={editBillableHours} onChange={(event) => setEditBillableHours(event.target.value)} /></label>
          </div>
          <label>Manager approval note<textarea aria-label="Manager approval note" value={managerNote} onChange={(event) => setManagerNote(event.target.value)} placeholder="Required when changing submitted time" /></label>
          <label>Rejection reason<textarea aria-label="Rejection reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Required to reject" /></label>
          <div className="row">
            <button type="button" disabled={selectedEntry.approvalStatus !== 1} onClick={() => void approve(selectedEntry.id)}>Approve</button>
            <button type="button" disabled={selectedEntry.approvalStatus !== 1} onClick={() => void editAndApprove(selectedEntry.id)}>Save Changes &amp; Approve</button>
            <button type="button" disabled={selectedEntry.approvalStatus !== 1} onClick={() => void reject(selectedEntry.id)}>Reject</button>
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
