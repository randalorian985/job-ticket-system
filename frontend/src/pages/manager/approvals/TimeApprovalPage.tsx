import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../../api/httpClient'
import { timeEntriesApi } from '../../../api/timeEntriesApi'
import { usersApi } from '../../../api/usersApi'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import type { AdjustTimeEntryRequestDto, AssignableEmployeeDto, JobTicketListItemDto, TimeApprovalQueueItemDto } from '../../../types'
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
  const [jobTickets, setJobTickets] = useState<JobTicketListItemDto[]>([])
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
      usersApi.listAssignableEmployees().then(setEmployees),
      jobTicketsApi.listAll().then(setJobTickets)
    ]).catch((requestError) => setError(managerTimeError(requestError, 'Unable to load time approval filters.')))
    // Initial pending queue and employee choices load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action()
      setError(null)
      setReviewEntry(null)
      await load()
      setMessage(successMessage)
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
  const saveEdit = (id: string, request: AdjustTimeEntryRequestDto) => runAction(() => timeEntriesApi.adjust(id, request), 'Time entry changes were saved.')
  const editAndApprove = (id: string, request: AdjustTimeEntryRequestDto) => runAction(() => timeEntriesApi.editAndApprove(id, request), 'Time entry changes were saved and approved.')
  const deleteEntry = (id: string, reason: string) => runAction(() => timeEntriesApi.deleteEntry(id, { reason }), 'Time entry deleted.')
  const bulkApprove = async () => {
    if (await runAction(() => timeEntriesApi.bulkApprove(selectedIds), 'Selected time entries approved.')) setSelectedIds([])
  }

  if (reviewEntry) {
    return (
      <section className="card stack" aria-label="Time approval edit screen">
        <div>
          <h2>Edit Time Approval</h2>
          <p className="muted">Review the selected time entry, save manager edits, approve it, reject it, or delete it without returning to the queue first.</p>
        </div>
        <Errorable error={error} />
        {message ? <p className="muted">{message}</p> : null}
        <TimeEntryReviewPanel
          entry={reviewEntry}
          onClose={() => setReviewEntry(null)}
          onApprove={approve}
          onReject={reject}
          onSaveEdit={saveEdit}
          onEditAndApprove={editAndApprove}
          onDelete={deleteEntry}
          onValidationError={setError}
        />
      </section>
    )
  }

  return (
    <section className="card stack time-approval-page">
      <div className="time-approval-topbar">
        <div>
          <h2>Time Approval</h2>
          <p className="muted">Filter the queue, select pending rows, then approve or edit selected entries.</p>
        </div>
        <div className="time-approval-summary time-approval-summary-compact" aria-label="Time review summary">
          <div className="time-approval-summary-primary"><strong>{summary.pending}</strong><span>Pending</span></div>
          <div><strong>{summary.laborHours.toFixed(2)}</strong><span>Labor hrs</span></div>
          <div><strong>{summary.billableHours.toFixed(2)}</strong><span>Billable hrs</span></div>
          <div><strong>{selectedIds.length}</strong><span>Selected</span></div>
        </div>
      </div>
      <Errorable error={error} />
      {message ? <p className="muted time-approval-status-line">{message}</p> : null}
      <TimeApprovalFilters employees={employees} jobTickets={jobTickets} filters={filters} loading={loading} onChange={setFilters} onApply={() => void load()} />
      <TimeApprovalQueue
        entries={entries}
        selectedIds={selectedIds}
        loading={loading}
        onSelectionChange={setSelectedIds}
        onBulkApprove={() => void bulkApprove()}
        onReview={setReviewEntry}
        exportHref={exportHref}
      />
    </section>
  )
}
