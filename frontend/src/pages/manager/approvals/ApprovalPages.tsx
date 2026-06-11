import { useEffect, useState } from 'react'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import type { JobTicketListItemDto, JobTicketPartDto } from '../../../types'
import { Errorable } from '../common/Errorable'
import { JobTicketCombobox } from '../common/JobTicketCombobox'
import { getApprovalLabel } from '../managerDisplay'

export function PartsApprovalPage() {
  const [jobId, setJobId] = useState('')
  const [jobTickets, setJobTickets] = useState<JobTicketListItemDto[]>([])
  const [parts, setParts] = useState<JobTicketPartDto[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    jobTicketsApi.listAll()
      .then(setJobTickets)
      .catch(() => setError('Unable to load job ticket choices.'))
  }, [])

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
      <button disabled={!jobId} onClick={() => void load()}>Load Job Parts</button>
      <Errorable error={error} />
      {!jobId ? <p className="muted">Choose a job ticket by number or job name to review its parts.</p> : null}
      <ul>
        {parts.map((part) => (
          <li key={part.id}>
            {(part.partNumber && part.partName) ? `${part.partNumber} - ${part.partName}` : `Part ${part.partId ? 'record unavailable' : 'unlisted'}`}
            {part.isUnlistedPart ? ' (unlisted)' : ''} - Qty {part.quantity} - Cost {part.unitCostSnapshot} - Sale {part.salePriceSnapshot} - {getApprovalLabel(part.approvalStatus)}{' '}
            {part.officeOrderRequested ? 'Office order requested ' : ''}
            <button onClick={() => void approve(part.id)}>Approve</button>{' '}
            <button onClick={() => void reject(part.id)}>Reject</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
