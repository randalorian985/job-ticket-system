import { useEffect, useState } from 'react'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import type { JobTicketListItemDto, JobTicketPartDto } from '../../../types'
import { Errorable } from '../common/Errorable'
import { JobTicketCombobox } from '../common/JobTicketCombobox'
import { getApprovalLabel } from '../managerDisplay'

const formatMoney = (value?: number | null) => value == null ? 'Not set' : `$${value.toFixed(2)}`

export function PartsApprovalPage() {
  const [jobId, setJobId] = useState('')
  const [jobTickets, setJobTickets] = useState<JobTicketListItemDto[]>([])
  const [parts, setParts] = useState<JobTicketPartDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activePartId, setActivePartId] = useState<string | null>(null)

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
      setParts(await jobTicketsApi.listParts(jobId))
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
            <span><strong>{parts.length}</strong> loaded</span>
            <span><strong>{pendingCount}</strong> pending</span>
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

      <Errorable error={error} />
      {!jobId ? <p className="muted">Choose a job ticket by number or job name to review its parts.</p> : null}
      {jobId && !isLoading && parts.length === 0 ? <p className="muted empty-state">No parts are recorded for this job ticket.</p> : null}

      <ul className="approval-review-list">
        {parts.map((part) => (
          <li key={part.id}>
            <div className="approval-review-main">
              <div className="approval-review-title">
                <strong>{part.partNumber || 'Unlisted part'}</strong>
                <span>{part.partName || 'Part record unavailable'}</span>
              </div>
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
    </section>
  )
}
