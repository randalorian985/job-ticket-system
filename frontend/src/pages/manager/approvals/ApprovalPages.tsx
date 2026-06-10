import { useState } from 'react'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import type { JobTicketPartDto } from '../../../types'
import { Errorable } from '../common/Errorable'
import { getApprovalLabel } from '../managerDisplay'

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
