import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { partsUsageHistoryApi } from '../../api/partsUsageHistoryApi'
import { masterDataApi } from '../../api/masterDataApi'
import type { EquipmentDto, PartDto, PartsUsageHistoryItemDto } from '../../types'
import { formatDate, getApprovalLabel } from './managerDisplay'

export function PartsUsageHistoryPage() {
  const [equipment, setEquipment] = useState<EquipmentDto[]>([])
  const [parts, setParts] = useState<PartDto[]>([])
  const [history, setHistory] = useState<PartsUsageHistoryItemDto[]>([])
  const [equipmentId, setEquipmentId] = useState('')
  const [partId, setPartId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeEquipment = useMemo(() => equipment.filter((item) => !item.isArchived), [equipment])
  const activeParts = useMemo(() => parts.filter((item) => !item.isArchived), [parts])

  const load = async (filters = { equipmentId, partId }) => {
    setIsLoading(true)
    const [historyResponse, equipmentResponse, partsResponse] = await Promise.all([
      partsUsageHistoryApi.list({
        equipmentId: filters.equipmentId || undefined,
        partId: filters.partId || undefined,
        limit: 50
      }),
      masterDataApi.listEquipment(),
      masterDataApi.listParts()
    ])
    setHistory(historyResponse)
    setEquipment(equipmentResponse)
    setParts(partsResponse)
    setError(null)
    setIsLoading(false)
  }

  useEffect(() => {
    load().catch(() => {
      setError('Unable to load parts usage history.')
      setIsLoading(false)
    })
  }, [])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    load({ equipmentId, partId }).catch(() => {
      setError('Unable to load parts usage history.')
      setIsLoading(false)
    })
  }

  return (
    <section className="stack">
      <div className="card stack">
        <div>
          <h2>Parts Usage History</h2>
          <p className="muted">
            Visibility-only history for Manager/Admin review. Entries use cautious wording and are not compatibility guarantees or automatic recommendations.
          </p>
        </div>
        <form className="row" onSubmit={onSubmit} aria-label="parts usage history filters">
          <label>
            Equipment
            <select aria-label="Equipment" value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)}>
              <option value="">All equipment</option>
              {activeEquipment.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Part
            <select aria-label="Part" value={partId} onChange={(event) => setPartId(event.target.value)}>
              <option value="">All parts</option>
              {activeParts.map((item) => (
                <option key={item.id} value={item.id}>{item.partNumber} · {item.name}</option>
              ))}
            </select>
          </label>
          <button type="submit">Review History</button>
        </form>
        <p className="muted">Deferred: AI/scoring logic, automatic recommendations, confidence scores, purchasing, vendor cost tracking, and advanced inventory.</p>
      </div>

      {isLoading ? <p className="muted" role="status">Loading parts usage history…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <article className="card stack">
        <h3>Historical usage</h3>
        {history.length ? (
          <ul className="stack">
            {history.map((item) => (
              <li key={item.jobTicketPartId} className="card stack">
                <div>
                  <strong>{item.partNumber} · {item.partName}</strong>
                  <p className="muted">{item.ticketNumber} · Qty {item.quantity} · {getApprovalLabel(item.approvalStatus)} · {formatDate(item.installedAtUtc ?? item.addedAtUtc)}</p>
                  <p className="muted">Equipment: {item.equipmentName ?? item.equipmentId ?? '—'}{item.modelNumber ? ` · Model ${item.modelNumber}` : ''}</p>
                </div>
                <div className="inline-links" aria-label={`evidence for ${item.partNumber}`}>
                  {item.evidenceTags.map((tag) => <span className="badge" key={tag}>{tag}</span>)}
                </div>
                {item.componentCategory ? <p>Component: {item.componentCategory}</p> : null}
                {item.repairDescription ? <p>Repair notes: {item.repairDescription}</p> : null}
                {item.technicianNotes ? <p>Technician notes: {item.technicianNotes}</p> : null}
                {item.compatibilityNotes ? <p>Verification notes: {item.compatibilityNotes}</p> : null}
                <Link to={`/manage/job-tickets/${item.jobTicketId}`}>Open job ticket</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No parts usage history matches the current filters.</p>
        )}
      </article>
    </section>
  )
}
