import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../../api/httpClient'
import { timeEntriesApi } from '../../../api/timeEntriesApi'
import { usersApi } from '../../../api/usersApi'
import type { AdjustTimeEntryRequestDto, AssignableEmployeeDto, TimeApprovalQueueItemDto } from '../../../types'
import { csvDataUri, toCsv, type CsvColumn } from '../../../utils/csv'
import { Errorable } from '../common/Errorable'
import { getApprovalLabel } from '../managerDisplay'
import { TimeApprovalFilters } from './TimeApprovalFilters'
import { TimeApprovalQueue } from './TimeApprovalQueue'
import { TimeEntryReviewPanel } from './TimeEntryReviewPanel'
import { defaultTimeApprovalFilters, isEligibleForApproval, toReviewFilters, type TimeApprovalFilterState } from './timeApprovalShared'

const managerTimeError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    if (error.status === 400) return error.message
    if (error.status === 401 || error.status === 403) return 'You do not have permission to review manager time entries.'
  }
  return fallback
}

const exportColumns: CsvColumn<TimeApprovalQueueItemDto>[] = [
  { header: 'Employee', value: (entry) => entry.employeeName },
  { header: 'Job Ticket', value: (entry) => entry.jobTicketNumber },
  { header: 'Job Name', value: (entry) => entry.jobName },
  { header: 'Customer', value: (entry) => entry.customerName },
  { header: 'Site / Location', value: (entry) => entry.siteName || entry.locationName },
  { header: 'Started At UTC', value: (entry) => entry.startedAtUtc },
  { header: 'Ended At UTC', value: (entry) => entry.endedAtUtc ?? '' },
  { header: 'Labor Hours', value: (entry) => entry.laborHours },
  { header: 'Billable Hours', value: (entry) => entry.billableHours },
  { header: 'Approval Status', value: (entry) => getApprovalLabel(entry.approvalStatus) },
  { header: 'Work Summary', value: (entry) => entry.workSummary ?? '' },
  { header: 'Rejection Reason', value: (entry) => entry.rejectionReason ?? '' }
]

export function TimeApprovalPage() {
  const [entries, setEntries] = useState<TimeApprovalQueueItemDto[]>([])
  const [employees, setEmployees] = useState<AssignableEmployeeDto[]>([])
  const [filters, setFilters] = useState<TimeApprovalFilterState>(defaultTimeApprovalFilters)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [reviewEntry, setReviewEntry] = useState<TimeApprovalQueueItemDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = async (nextFilters: TimeApprovalFilterState = filters) => {
    try {
      setLoading(true)
      setError(null)
      const data = await timeEntriesApi.listForReview(toReviewFilters(nextFilters))
      setEntries(data)
      setSelectedIds((current) => current.filter((id) => data.some((entry) => entry.id === id && isEligibleForApproval(entry))))
      setReviewEntry((current) => current ? data.find((entry) => entry.id === current.id) ?? null : null)
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
      load(defaultTimeApprovalFilters),
      usersApi.listAssignableEmployees().then(setEmployees)
    ]).catch((requestError) => setError(managerTimeError(requestError, 'Unable to load time approval filters.')))
    // Initial pending queue and employee choices load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action()
      setError(null)
      setMessage(successMessage)
      setReviewEntry(null)
      await load()
      return true
    } catch (requestError) {
      setError(managerTimeError(requestError, 'Unable to update the time entry.'))
      return false
    }
  }

  const exportHref = useMemo(() => csvDataUri(toCsv(entries, exportColumns)), [entries])
  const summary = useMemo(() => entries.reduce((result, entry) => ({
    entries: result.entries + 1,
    pending: result.pending + (entry.approvalStatus === 1 ? 1 : 0),
    approved: result.approved + (entry.approvalStatus === 2 ? 1 : 0),
    rejected: result.rejected + (entry.approvalStatus === 3 ? 1 : 0),
    laborHours: result.laborHours + entry.laborHours,
    billableHours: result.billableHours + entry.billableHours
  }), { entries: 0, pending: 0, approved: 0, rejected: 0, laborHours: 0, billableHours: 0 }), [entries])

  const approve = (id: string) => runAction(() => timeEntriesApi.approve(id), 'Time entry approved.')
  const reject = (id: string, reason: string) => runAction(() => timeEntriesApi.reject(id, { reason }), 'Time entry rejected.')
  const editAndApprove = (id: string, request: AdjustTimeEntryRequestDto) => runAction(() => timeEntriesApi.editAndApprove(id, request), 'Time entry changes were saved and approved.')
  const bulkApprove = async () => {
    if (await runAction(() => timeEntriesApi.bulkApprove(selectedIds), 'Selected time entries approved.')) setSelectedIds([])
  }

  return (
    <section className="card stack">
      <h2>Time Approval</h2>
      <div className="report-results-heading">
        <p className="muted">Pending work loads automatically so managers can understand, review, and approve the queue without knowing internal IDs.</p>
        {entries.length ? <a className="button-link" href={exportHref} download="time-approval-review.csv">Export visible rows as CSV</a> : null}
      </div>
      <TimeApprovalFilters employees={employees} filters={filters} loading={loading} onChange={setFilters} onApply={() => void load()} />
      <Errorable error={error} />
      {message ? <p className="muted">{message}</p> : null}
      <div className="report-grid" aria-label="Time review summary">
        <article className="report-card"><h3>{summary.entries}</h3><p className="muted">Queue entries</p></article>
        <article className="report-card"><h3>{summary.pending}</h3><p className="muted">Pending approvals</p></article>
        <article className="report-card"><h3>{summary.approved}</h3><p className="muted">Approved entries</p></article>
        <article className="report-card"><h3>{summary.rejected}</h3><p className="muted">Rejected entries</p></article>
        <article className="report-card"><h3>{summary.laborHours.toFixed(2)}</h3><p className="muted">Queue labor hours</p></article>
        <article className="report-card"><h3>{summary.billableHours.toFixed(2)}</h3><p className="muted">Queue billable hours</p></article>
      </div>
      <TimeApprovalQueue
        entries={entries}
        selectedIds={selectedIds}
        loading={loading}
        onSelectionChange={setSelectedIds}
        onBulkApprove={() => void bulkApprove()}
        onReview={setReviewEntry}
      />
      {reviewEntry ? (
        <TimeEntryReviewPanel
          entry={reviewEntry}
          onClose={() => setReviewEntry(null)}
          onApprove={approve}
          onReject={reject}
          onEditAndApprove={editAndApprove}
          onValidationError={setError}
        />
      ) : null}
    </section>
  )
}
