import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { partsUsageHistoryApi } from '../../api/partsUsageHistoryApi'
import { masterDataApi } from '../../api/masterDataApi'
import type { CustomerDto, EquipmentDto, PartDto, PartsUsageHistoryItemDto } from '../../types'
import { formatDate, getApprovalLabel } from './managerDisplay'

export function PartsUsageHistoryPage() {
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [equipment, setEquipment] = useState<EquipmentDto[]>([])
  const [parts, setParts] = useState<PartDto[]>([])
  const [history, setHistory] = useState<PartsUsageHistoryItemDto[]>([])
  const [customerId, setCustomerId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [partId, setPartId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeCustomers = useMemo(() => customers.filter((c) => !c.isArchived), [customers])
  const activeEquipment = useMemo(() => equipment.filter((item) => !item.isArchived), [equipment])
  const activeParts = useMemo(() => parts.filter((item) => !item.isArchived), [parts])
  const approvedCount = useMemo(() => history.filter((item) => item.approvalStatus === 2).length, [history])
  const pendingCount = useMemo(() => history.filter((item) => item.approvalStatus === 1).length, [history])
  const evidenceTagCount = useMemo(() => history.reduce((sum, item) => sum + item.evidenceTags.length, 0), [history])

  const load = async (filters = { customerId, equipmentId, partId }) => {
    setIsLoading(true)
    const [historyResponse, customersResponse, equipmentResponse, partsResponse] = await Promise.all([
      partsUsageHistoryApi.list({
        customerId: filters.customerId || undefined,
        equipmentId: filters.equipmentId || undefined,
        partId: filters.partId || undefined,
        limit: 50
      }),
      masterDataApi.listCustomers(),
      masterDataApi.listEquipment(),
      masterDataApi.listParts()
    ])
    setHistory(historyResponse)
    setCustomers(customersResponse)
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
    load({ customerId, equipmentId, partId }).catch(() => {
      setError('Unable to load parts usage history.')
      setIsLoading(false)
    })
  }

  return (
    <section className="stack parts-history-page">
      <div className="card stack parts-history-topbar">
        <div className="review-heading">
          <div>
            <h2>Parts Usage History</h2>
            <p className="muted">
              Visibility-only history for Manager/Admin review. Entries use cautious wording and are not compatibility guarantees or automatic recommendations.
            </p>
          </div>
          <div className="parts-request-summary-badges" aria-label="parts history summary">
            <span>{history.length} visible</span>
            <span>{approvedCount} approved installs</span>
            <span>{pendingCount} pending review</span>
            <span>{evidenceTagCount} evidence tags</span>
          </div>
        </div>
        <form className="review-grid parts-history-filter-grid" onSubmit={onSubmit} aria-label="parts usage history filters">
          <label>
            Customer
            <select aria-label="Customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">All customers</option>
              {activeCustomers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
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
          <div className="parts-history-filter-actions">
            <button type="submit">Review History</button>
            <p className="muted">Use equipment + part together to narrow down repeat repairs before approving new requests.</p>
          </div>
        </form>
        <p className="muted">Deferred: AI/scoring logic, automatic recommendations, confidence scores, purchasing, vendor cost tracking, and advanced inventory.</p>
      </div>

      {isLoading ? <p className="muted" role="status">Loading parts usage history…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <article className="card stack parts-history-results">
        <h3>Historical usage</h3>
        {history.length ? (
          <ul className="stack supply-history-list">
            {history.map((item) => (
              <li key={item.jobTicketPartId} className="supply-history-item">
                <div className="supply-history-item-heading">
                  <strong>{item.partNumber} · {item.partName}</strong>
                  <p className="muted">{item.ticketNumber} · Qty {item.quantity} · {getApprovalLabel(item.approvalStatus)} · {formatDate(item.installedAtUtc ?? item.addedAtUtc)}</p>
                  {item.customerName ? <p className="muted">Customer: {item.customerName}</p> : null}
                  <p className="muted">Equipment: {item.equipmentName ?? (item.equipmentId ? 'Equipment unavailable' : '—')}{item.modelNumber ? ` · Model ${item.modelNumber}` : ''}</p>
                </div>
                <div className="inline-links supply-history-tags" aria-label={`evidence for ${item.partNumber}`}>
                  {item.evidenceTags.map((tag) => <span className="badge" key={tag}>{tag}</span>)}
                </div>
                {item.componentCategory ? <p>Component: {item.componentCategory}</p> : null}
                {item.repairDescription ? <p>Repair notes: {item.repairDescription}</p> : null}
                {item.technicianNotes ? <p>Technician notes: {item.technicianNotes}</p> : null}
                {item.compatibilityNotes ? <p>Verification notes: {item.compatibilityNotes}</p> : null}
                <Link className="button-link secondary-link parts-history-open-ticket" to={`/manage/job-tickets/${item.jobTicketId}`}>Open job ticket</Link>
              </li>
            ))}
          </ul>
        ) : !isLoading ? (
          <p className="muted">No parts usage history matches the current filters.</p>
        ) : null}
      </article>
    </section>
  )
}
