import type { TimeApprovalQueueItemDto } from '../../../types'
import { getApprovalLabel } from '../managerDisplay'
import { isEligibleForApproval } from './timeApprovalShared'

type Props = {
  entries: TimeApprovalQueueItemDto[]
  selectedIds: string[]
  loading: boolean
  onSelectionChange: (ids: string[]) => void
  onBulkApprove: () => void
  onReview: (entry: TimeApprovalQueueItemDto) => void
  exportHref?: string
}

export function TimeApprovalQueue({ entries, selectedIds, loading, onSelectionChange, onBulkApprove, onReview, exportHref }: Props) {
  const eligibleEntries = entries.filter(isEligibleForApproval)
  const allEligibleSelected = eligibleEntries.length > 0 && eligibleEntries.every((entry) => selectedIds.includes(entry.id))
  const selectedEntry = selectedIds.length === 1 ? entries.find((entry) => entry.id === selectedIds[0]) : null

  const toggleEntry = (entryId: string, selected: boolean) => {
    onSelectionChange(selected ? [...selectedIds, entryId] : selectedIds.filter((id) => id !== entryId))
  }

  return (
    <article className="card stack">
      <div className="report-results-heading">
        <div>
          <h3>Time Entry Approval Queue</h3>
          <p className="muted">{entries.length ? `${entries.length} entries match the current filters.` : 'No time entries match the current filters.'}</p>
        </div>
        <div className="row">
          {exportHref ? <a className="button-link" href={exportHref} download="time-approval-review.csv">Export</a> : null}
          <button type="button" disabled={selectedIds.length === 0 || loading} onClick={onBulkApprove}>Approve Selected ({selectedIds.length})</button>
          {selectedEntry ? <button type="button" disabled={loading} onClick={() => onReview(selectedEntry)}>Edit Selected</button> : null}
        </div>
      </div>
      {entries.length ? (
        <div className="table-scroll">
          <table className="time-approval-table">
            <thead>
              <tr>
                <th><input aria-label="Select all eligible entries" type="checkbox" checked={allEligibleSelected} onChange={(event) => onSelectionChange(event.target.checked ? eligibleEntries.map((entry) => entry.id) : [])} /></th>
                <th>Employee</th>
                <th>Work date</th>
                <th>Job ticket</th>
                <th>Location</th>
                <th>Labor type</th>
                <th>Start</th>
                <th>End</th>
                <th>Total</th>
                <th>Billable</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>{entries.map((entry) => (
              <tr key={entry.id}>
                <td><input aria-label={`Select ${entry.employeeName}`} type="checkbox" disabled={!isEligibleForApproval(entry)} checked={selectedIds.includes(entry.id)} onChange={(event) => toggleEntry(entry.id, event.target.checked)} /></td>
                <td>{entry.employeeName}</td>
                <td>{new Date(entry.startedAtUtc).toLocaleDateString()}</td>
                <td><strong>{entry.jobTicketNumber}</strong><br /><span className="muted">{entry.jobName}</span></td>
                <td>{entry.locationName || '—'}</td>
                <td>{entry.laborType ?? '—'}</td>
                <td>{new Date(entry.startedAtUtc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</td>
                <td>{entry.endedAtUtc ? new Date(entry.endedAtUtc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Open'}</td>
                <td>{entry.laborHours.toFixed(2)}</td>
                <td>{entry.billableHours.toFixed(2)}</td>
                <td>{getApprovalLabel(entry.approvalStatus)}</td>
                <td>{entry.workSummary || entry.clockInNote || entry.clockOutNote || entry.managerNotes ? '●' : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : null}
    </article>
  )
}
