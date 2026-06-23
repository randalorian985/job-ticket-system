import { useEffect, useState } from 'react'
import type { AdjustTimeEntryRequestDto, TimeApprovalQueueItemDto } from '../../../types'
import { formatDate, getApprovalLabel } from '../managerDisplay'
import { managerLocationText, toLocalDateTimeInput } from './timeApprovalShared'

type Props = {
  entry: TimeApprovalQueueItemDto
  onClose: () => void
  onApprove: (id: string) => Promise<unknown>
  onReject: (id: string, reason: string) => Promise<unknown>
  onSaveEdit: (id: string, request: AdjustTimeEntryRequestDto) => Promise<unknown>
  onEditAndApprove: (id: string, request: AdjustTimeEntryRequestDto) => Promise<unknown>
  onDelete: (id: string, reason: string) => Promise<unknown>
  onValidationError: (message: string) => void
}

export function TimeEntryReviewPanel({ entry, onClose, onApprove, onReject, onSaveEdit, onEditAndApprove, onDelete, onValidationError }: Props) {
  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')
  const [laborHours, setLaborHours] = useState('')
  const [billableHours, setBillableHours] = useState('')
  const [managerNote, setManagerNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState(entry.rejectionReason ?? '')
  const [deleteReason, setDeleteReason] = useState('')

  useEffect(() => {
    setStartedAt(toLocalDateTimeInput(entry.startedAtUtc))
    setEndedAt(toLocalDateTimeInput(entry.endedAtUtc))
    setLaborHours(String(entry.laborHours))
    setBillableHours(String(entry.billableHours))
    setManagerNote('')
    setRejectionReason(entry.rejectionReason ?? '')
    setDeleteReason('')
  }, [entry])

  const reject = () => {
    if (!rejectionReason.trim()) return onValidationError('A rejection reason is required.')
    void onReject(entry.id, rejectionReason.trim())
  }

  const buildAdjustmentRequest = (requiresClosedEntry: boolean) => {
    const approvedStart = startedAt ? new Date(startedAt) : null
    const approvedEnd = endedAt ? new Date(endedAt) : null
    const approvedLaborHours = Number(laborHours)
    const approvedBillableHours = Number(billableHours)

    if (!approvedStart || Number.isNaN(approvedStart.getTime())) return onValidationError('Start time is required.')
    if (requiresClosedEntry && !approvedEnd) return onValidationError('End time is required before approval.')
    if (approvedEnd && Number.isNaN(approvedEnd.getTime())) return onValidationError('End time must be a valid date and time.')
    if (approvedEnd && approvedEnd <= approvedStart) return onValidationError('End time must be after start time.')
    if (!Number.isFinite(approvedLaborHours) || approvedLaborHours < 0) return onValidationError('Total hours cannot be negative.')
    if (!Number.isFinite(approvedBillableHours) || approvedBillableHours < 0 || approvedBillableHours > approvedLaborHours) {
      return onValidationError('Billable hours must be between zero and total hours.')
    }
    if (!managerNote.trim()) return onValidationError('A manager edit note is required when saving changes.')

    return {
      reason: managerNote.trim(),
      startedAtUtc: approvedStart.toISOString(),
      endedAtUtc: approvedEnd ? approvedEnd.toISOString() : null,
      laborHours: approvedLaborHours,
      billableHours: approvedBillableHours,
      notes: managerNote.trim()
    }
  }

  const saveEdit = () => {
    const request = buildAdjustmentRequest(false)
    if (request) void onSaveEdit(entry.id, request)
  }

  const editAndApprove = () => {
    const request = buildAdjustmentRequest(true)
    if (request) void onEditAndApprove(entry.id, request)
  }

  const deleteEntry = () => {
    if (!deleteReason.trim()) return onValidationError('A delete reason is required.')
    void onDelete(entry.id, deleteReason.trim())
  }

  return (
    <article className="card stack" aria-label="Time entry review">
      <div className="report-results-heading">
        <div><h3>Review Time Entry</h3><p className="muted">{entry.employeeName} · {entry.jobTicketNumber}</p></div>
        <button type="button" onClick={onClose}>Close Review</button>
      </div>
      <dl className="detail-grid">
        <div><dt>Employee</dt><dd>{entry.employeeName}</dd></div>
        <div><dt>Work date</dt><dd>{new Date(entry.startedAtUtc).toLocaleDateString()}</dd></div>
        <div><dt>Job ticket</dt><dd>{entry.jobTicketNumber} · {entry.jobName}</dd></div>
        <div><dt>Customer / site / location</dt><dd>{managerLocationText(entry)}</dd></div>
        <div><dt>Original submitted start</dt><dd>{formatDate(entry.startedAtUtc)}</dd></div>
        <div><dt>Original submitted end</dt><dd>{formatDate(entry.endedAtUtc)}</dd></div>
        <div><dt>Original total hours</dt><dd>{entry.laborHours}</dd></div>
        <div><dt>Original billable hours</dt><dd>{entry.billableHours}</dd></div>
        <div><dt>Employee notes</dt><dd>{[entry.workSummary, entry.clockInNote, entry.clockOutNote].filter(Boolean).join(' · ') || '—'}</dd></div>
        <div><dt>Status</dt><dd>{getApprovalLabel(entry.approvalStatus)}</dd></div>
      </dl>
      <div className="report-filters">
        <label>Approved start<input aria-label="Approved start time" type="datetime-local" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} /></label>
        <label>Approved end<input aria-label="Approved end time" type="datetime-local" value={endedAt} onChange={(event) => setEndedAt(event.target.value)} /></label>
        <label>Total hours<input aria-label="Approved total hours" type="number" min="0" step="0.25" value={laborHours} onChange={(event) => setLaborHours(event.target.value)} /></label>
        <label>Billable hours<input aria-label="Approved billable hours" type="number" min="0" step="0.25" value={billableHours} onChange={(event) => setBillableHours(event.target.value)} /></label>
      </div>
      <label>Manager edit note<textarea aria-label="Manager edit note" value={managerNote} onChange={(event) => setManagerNote(event.target.value)} placeholder="Required when saving time changes" /></label>
      <label>Rejection reason<textarea aria-label="Rejection reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Required to reject" /></label>
      <label>Delete reason<textarea aria-label="Delete reason" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Required to delete this time entry" /></label>
      <div className="row">
        <button type="button" disabled={entry.approvalStatus !== 1} onClick={() => void onApprove(entry.id)}>Approve</button>
        <button type="button" onClick={saveEdit}>Save Edit</button>
        <button type="button" disabled={entry.approvalStatus !== 1} onClick={editAndApprove}>Save Changes &amp; Approve</button>
        <button type="button" disabled={entry.approvalStatus !== 1} onClick={reject}>Reject</button>
        <button className="danger-button" type="button" onClick={deleteEntry}>Delete</button>
      </div>
    </article>
  )
}
