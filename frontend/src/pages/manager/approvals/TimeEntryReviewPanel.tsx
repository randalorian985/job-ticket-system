import { useEffect, useState } from 'react'
import type { AdjustTimeEntryRequestDto, TimeApprovalQueueItemDto } from '../../../types'
import { formatDate, getApprovalLabel } from '../managerDisplay'
import { managerLocationText, toLocalDateTimeInput } from './timeApprovalShared'

type Props = {
  entry: TimeApprovalQueueItemDto
  onClose: () => void
  onApprove: (id: string) => Promise<unknown>
  onReject: (id: string, reason: string) => Promise<unknown>
  onEditAndApprove: (id: string, request: AdjustTimeEntryRequestDto) => Promise<unknown>
  onValidationError: (message: string) => void
}

export function TimeEntryReviewPanel({ entry, onClose, onApprove, onReject, onEditAndApprove, onValidationError }: Props) {
  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')
  const [laborHours, setLaborHours] = useState('')
  const [billableHours, setBillableHours] = useState('')
  const [managerNote, setManagerNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState(entry.rejectionReason ?? '')

  useEffect(() => {
    setStartedAt(toLocalDateTimeInput(entry.startedAtUtc))
    setEndedAt(toLocalDateTimeInput(entry.endedAtUtc))
    setLaborHours(String(entry.laborHours))
    setBillableHours(String(entry.billableHours))
    setManagerNote('')
    setRejectionReason(entry.rejectionReason ?? '')
  }, [entry])

  const reject = () => {
    if (!rejectionReason.trim()) return onValidationError('A rejection reason is required.')
    void onReject(entry.id, rejectionReason.trim())
  }

  const editAndApprove = () => {
    const approvedStart = new Date(startedAt)
    const approvedEnd = new Date(endedAt)
    const approvedLaborHours = Number(laborHours)
    const approvedBillableHours = Number(billableHours)

    if (!startedAt || !endedAt || approvedEnd <= approvedStart) return onValidationError('End time must be after start time.')
    if (!Number.isFinite(approvedLaborHours) || approvedLaborHours < 0) return onValidationError('Total hours cannot be negative.')
    if (!Number.isFinite(approvedBillableHours) || approvedBillableHours < 0 || approvedBillableHours > approvedLaborHours) {
      return onValidationError('Billable hours must be between zero and total hours.')
    }
    if (!managerNote.trim()) return onValidationError('A manager approval note is required when editing time.')

    void onEditAndApprove(entry.id, {
      reason: managerNote.trim(),
      startedAtUtc: approvedStart.toISOString(),
      endedAtUtc: approvedEnd.toISOString(),
      laborHours: approvedLaborHours,
      billableHours: approvedBillableHours,
      notes: managerNote.trim()
    })
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
      <label>Manager approval note<textarea aria-label="Manager approval note" value={managerNote} onChange={(event) => setManagerNote(event.target.value)} placeholder="Required when changing submitted time" /></label>
      <label>Rejection reason<textarea aria-label="Rejection reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Required to reject" /></label>
      <div className="row">
        <button type="button" disabled={entry.approvalStatus !== 1} onClick={() => void onApprove(entry.id)}>Approve</button>
        <button type="button" disabled={entry.approvalStatus !== 1} onClick={editAndApprove}>Save Changes &amp; Approve</button>
        <button type="button" disabled={entry.approvalStatus !== 1} onClick={reject}>Reject</button>
      </div>
    </article>
  )
}
