import { useEffect, useMemo, useState } from 'react'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import type { JobTicketListItemDto, JobTicketPartDto } from '../../../types'
import { Errorable } from '../common/Errorable'
import { JobTicketCombobox } from '../common/JobTicketCombobox'
import { getApprovalLabel } from '../managerDisplay'

const approvalStatusOptions = [
  { value: '', label: 'All statuses' },
  { value: 1, label: 'Pending' },
  { value: 2, label: 'Approved' },
  { value: 3, label: 'Rejected' },
  { value: 4, label: 'Invoiced' }
] as const

const formatMoney = (value?: number | null) => value == null ? 'Not set' : `$${value.toFixed(2)}`
const normalizeText = (value: string) => value.trim().toLowerCase()

const matchesPartSearch = (part: JobTicketPartDto, search: string) => {
  const query = normalizeText(search)

  if (!query) {
    return true
  }

  return [
    part.partNumber,
    part.partName,
    part.notes ?? '',
    part.officeOrderNotes ?? '',
    part.technicianNotes ?? '',
    part.rejectionReason ?? '',
    part.isUnlistedPart ? 'unlisted' : 'catalog',
    part.officeOrderRequested ? 'office order requested' : ''
  ]
    .join(' ')
    .toLowerCase()
    .includes(query)
}

export function PartsApprovalPage() {
  const [jobId, setJobId] = useState('')
  const [jobTickets, setJobTickets] = useState<JobTicketListItemDto[]>([])
  const [parts, setParts] = useState<JobTicketPartDto[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | ''>('')
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activePartId, setActivePartId] = useState<string | null>(null)

  const selectedJobTicket = jobTickets.find((ticket) => ticket.id === jobId) ?? null

  const visibleParts = useMemo(
    () => parts.filter((part) => (statusFilter === '' || part.approvalStatus === statusFilter) && matchesPartSearch(part, search)),
    [parts, search, statusFilter]
  )

  const selectedPart = visibleParts.find((part) => part.id === selectedPartId) ?? visibleParts[0] ?? null

  const statusCounts = useMemo(() => ({
    loaded: parts.length,
    visible: visibleParts.length,
    pending: parts.filter((part) => part.approvalStatus === 1).length,
    approved: parts.filter((part) => part.approvalStatus === 2).length,
    rejected: parts.filter((part) => part.approvalStatus === 3).length,
    officeOrder: parts.filter((part) => part.officeOrderRequested).length
  }), [parts, visibleParts.length])

  useEffect(() => {
    jobTicketsApi.listAll()
      .then(setJobTickets)
      .catch(() => setError('Unable to load job ticket choices.'))
  }, [])

  const load = async () => {
    if (!jobId) return

    setIsLoading(true)
    setError(null)
    try {
      const loadedParts = await jobTicketsApi.listParts(jobId)
      setParts(loadedParts)
      setSelectedPartId((current) => loadedParts.some((part) => part.id === current) ? current : loadedParts[0]?.id ?? null)
    } catch {
      setError('Unable to load job parts for approval.')
    } finally {
      setIsLoading(false)
    }
  }

  const approve = async (id: string) => {
    setActivePartId(id)
    setError(null)
    try {
      await jobTicketsApi.approvePart(jobId, id)
      await load()
    } catch {
      setError('Unable to approve this part.')
    } finally {
      setActivePartId(null)
    }
  }

  const reject = async (id: string) => {
    setActivePartId(id)
    setError(null)
    try {
      await jobTicketsApi.rejectPart(jobId, id, { rejectionReason: 'Rejected in manager review' })
      await load()
    } catch {
      setError('Unable to reject this part.')
    } finally {
      setActivePartId(null)
    }
  }

  const pendingCount = parts.filter((part) => part.approvalStatus === 1).length

  return (
    <section className="card stack parts-approval-page">
      <div className="review-heading">
        <div>
          <h2>Parts Approval</h2>
          <p className="muted">Review ticket parts, pricing snapshots, and approval status.</p>
        </div>
        {parts.length ? (
          <div className="approval-summary" aria-label="Parts approval summary">
            <span><strong>{statusCounts.loaded}</strong> loaded</span>
            <span><strong>{statusCounts.pending}</strong> pending</span>
            <span><strong>{statusCounts.visible}</strong> visible</span>
          </div>
        ) : null}
      </div>

      <div className="approval-filter-bar">
        <label>
          Job ticket
          <JobTicketCombobox
            tickets={jobTickets}
            selectedJobTicketId={jobId}
            inputId="parts-approval-job-ticket"
            label="Parts approval job ticket"
            onSelect={(ticket) => {
              setJobId(ticket?.id ?? '')
              setParts([])
            }}
          />
        </label>
        <button className="compact-button" disabled={!jobId || isLoading} onClick={() => void load()}>
          {isLoading ? 'Loading...' : 'Load Job Parts'}
        </button>
      </div>

      <div className="approval-control-bar" aria-label="Parts approval filters">
        <label>
          Search parts
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Part number, name, notes, or source"
          />
        </label>
        <label>
          Status filter
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value ? Number(event.target.value) : '')}>
            {approvalStatusOptions.map((option) => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <p className="muted approval-control-note">Use search to narrow to a single part, then open its details before approving or rejecting.</p>
      </div>

      <Errorable error={error} />
      {!jobId ? <p className="muted">Choose a job ticket by number or job name to review its parts.</p> : null}
      {jobId && !isLoading && parts.length === 0 ? <p className="muted empty-state">No parts are recorded for this job ticket.</p> : null}

      <div className="approval-workbench">
        <div className="approval-workbench-list">
          {jobId && !isLoading && parts.length > 0 && visibleParts.length === 0 ? (
            <p className="muted empty-state">No parts match the current filters.</p>
          ) : null}

          <ul className="approval-review-list">
            {visibleParts.map((part) => (
              <li key={part.id} className={selectedPart?.id === part.id ? 'approval-review-selected' : undefined}>
                <div className="approval-review-main">
                  <button type="button" className="approval-review-focus" onClick={() => setSelectedPartId(part.id)}>
                    <div className="approval-review-title">
                      <strong>{part.partNumber || 'Unlisted part'}</strong>
                      <span>{part.partName || 'Part record unavailable'}</span>
                    </div>
                  </button>
                  <span className={`status-chip approval-status-${part.approvalStatus}`}>{getApprovalLabel(part.approvalStatus)}</span>
                </div>
                <div className="approval-review-facts">
                  <span><small>Quantity</small><strong>{part.quantity}</strong></span>
                  <span><small>Cost snapshot</small><strong>{formatMoney(part.unitCostSnapshot)}</strong></span>
                  <span><small>Sale snapshot</small><strong>{formatMoney(part.salePriceSnapshot)}</strong></span>
                  <span><small>Source</small><strong>{part.isUnlistedPart ? 'Unlisted' : 'Catalog'}</strong></span>
                </div>
                {part.officeOrderRequested ? <p className="approval-note">Office order requested</p> : null}
                {part.approvalStatus === 1 ? (
                  <div className="action-group">
                    <button className="compact-button" disabled={activePartId === part.id} onClick={() => void approve(part.id)}>
                      {activePartId === part.id ? 'Saving...' : 'Approve'}
                    </button>
                    <button className="secondary-button compact-button danger-button" disabled={activePartId === part.id} onClick={() => void reject(part.id)}>
                      Reject
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <aside className="approval-detail-panel" aria-label="Selected part details">
          {selectedPart ? (
            <>
              <div className="approval-detail-hero">
                <div>
                  <p className="approval-detail-eyebrow">Selected part</p>
                  <strong>{selectedPart.partNumber || 'Unlisted part'}</strong>
                  <span>{selectedPart.partName || 'Part record unavailable'}</span>
                </div>
                <span className={`status-chip approval-status-${selectedPart.approvalStatus}`}>{getApprovalLabel(selectedPart.approvalStatus)}</span>
              </div>
              <div className="approval-detail-facts" aria-label="selected part review summary">
                <span><strong>Qty</strong>{selectedPart.quantity}</span>
                <span><strong>Cost</strong>{formatMoney(selectedPart.unitCostSnapshot)}</span>
                <span><strong>Sale</strong>{formatMoney(selectedPart.salePriceSnapshot)}</span>
                <span><strong>Source</strong>{selectedPart.isUnlistedPart ? 'Unlisted' : 'Catalog'}</span>
              </div>
              <div className="approval-detail-notes">
                <span>Review notes</span>
                <p>{selectedPart.notes ?? selectedPart.technicianNotes ?? selectedPart.officeOrderNotes ?? 'No review notes captured.'}</p>
              </div>
              {selectedPart.officeOrderRequested ? (
                <div className="approval-detail-notes approval-detail-notes-warning">
                  <span>Office order requested</span>
                  <p>{selectedPart.officeOrderNotes ?? 'The ticket requested an office order for this part.'}</p>
                </div>
              ) : null}
              {selectedPart.rejectionReason ? (
                <div className="approval-detail-notes">
                  <span>Rejection reason</span>
                  <p>{selectedPart.rejectionReason}</p>
                </div>
              ) : null}
              <div className="approval-detail-context">
                <span><strong>Ticket</strong>{selectedJobTicket ? `${selectedJobTicket.ticketNumber} · ${selectedJobTicket.title}` : jobId}</span>
                <span><strong>Visible</strong>{statusCounts.visible} of {statusCounts.loaded}</span>
                <span><strong>Pending</strong>{pendingCount}</span>
                <span><strong>Office orders</strong>{statusCounts.officeOrder}</span>
              </div>
            </>
          ) : (
            <div className="approval-detail-empty">
              <p className="muted">Select a part to review its details and notes.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
