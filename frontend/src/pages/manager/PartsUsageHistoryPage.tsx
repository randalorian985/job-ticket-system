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
  const [isLoadingReferences, setIsLoadingReferences] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeCustomers = useMemo(() => customers.filter((customer) => !customer.isArchived), [customers])
  const activeEquipment = useMemo(() => equipment.filter((item) => !item.isArchived), [equipment])
  const filteredEquipment = useMemo(() => activeEquipment.filter((item) => {
    if (!customerId) return true
    return item.customerId === customerId || item.ownerCustomerId === customerId || item.responsibleBillingCustomerId === customerId
  }), [activeEquipment, customerId])
  const activeParts = useMemo(() => parts.filter((item) => !item.isArchived), [parts])
  const approvedCount = useMemo(() => history.filter((item) => item.approvalStatus === 2).length, [history])
  const pendingCount = useMemo(() => history.filter((item) => item.approvalStatus === 1).length, [history])
  const evidenceTagCount = useMemo(() => history.reduce((sum, item) => sum + item.evidenceTags.length, 0), [history])
  const hasDraftFilters = Boolean(customerId || equipmentId || partId)

  const loadReferences = async () => {
    setIsLoadingReferences(true)
    const [customersResponse, equipmentResponse, partsResponse] = await Promise.all([
      masterDataApi.listCustomers(),
      masterDataApi.listEquipment(),
      masterDataApi.listParts()
    ])
    setCustomers(customersResponse)
    setEquipment(equipmentResponse)
    setParts(partsResponse)
    setError(null)
    setIsLoadingReferences(false)
  }

  const loadHistory = async (filters = { customerId, equipmentId, partId }) => {
    setIsLoadingHistory(true)
    const historyResponse = await partsUsageHistoryApi.list({
      customerId: filters.customerId || undefined,
      equipmentId: filters.equipmentId || undefined,
      partId: filters.partId || undefined,
      limit: 50
    })
    setHistory(historyResponse)
    setHasSearched(true)
    setError(null)
    setIsLoadingHistory(false)
  }

  useEffect(() => {
    loadReferences().catch(() => {
      setError('Unable to load parts usage filters.')
      setIsLoadingReferences(false)
    })
  }, [])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!hasDraftFilters) {
      setHistory([])
      setHasSearched(false)
      setError('Choose at least one filter before reviewing parts usage history.')
      return
    }

    loadHistory({ customerId, equipmentId, partId }).catch(() => {
      setHistory([])
      setHasSearched(true)
      setError('Unable to load parts usage history.')
      setIsLoadingHistory(false)
    })
  }

  const onCustomerChange = (nextCustomerId: string) => {
    setCustomerId(nextCustomerId)
    if (!nextCustomerId || !equipmentId) return

    const selectedEquipment = equipment.find((item) => item.id === equipmentId)
    if (
      selectedEquipment &&
      selectedEquipment.customerId !== nextCustomerId &&
      selectedEquipment.ownerCustomerId !== nextCustomerId &&
      selectedEquipment.responsibleBillingCustomerId !== nextCustomerId
    ) {
      setEquipmentId('')
    }
  }

  const clearFilters = () => {
    setCustomerId('')
    setEquipmentId('')
    setPartId('')
    setHistory([])
    setHasSearched(false)
    setError(null)
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
            <span>{hasSearched ? `${history.length} visible` : 'Filter required'}</span>
            <span>{hasSearched ? `${approvedCount} approved installs` : `${activeEquipment.length} active equipment`}</span>
            <span>{hasSearched ? `${pendingCount} pending review` : `${activeParts.length} active parts`}</span>
            <span>{hasSearched ? `${evidenceTagCount} evidence tags` : 'No auto recommendations'}</span>
          </div>
        </div>
        <form className="review-grid parts-history-filter-grid" onSubmit={onSubmit} aria-label="parts usage history filters">
          <label>
            Customer
            <select aria-label="Customer" value={customerId} onChange={(event) => onCustomerChange(event.target.value)} disabled={isLoadingReferences}>
              <option value="">All customers</option>
              {activeCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </label>
          <label>
            Equipment
            <select aria-label="Equipment" value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)} disabled={isLoadingReferences}>
              <option value="">{customerId ? 'All matching equipment' : 'All equipment'}</option>
              {filteredEquipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {[item.name, item.equipmentNumber].filter(Boolean).join(' - ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Part
            <select aria-label="Part" value={partId} onChange={(event) => setPartId(event.target.value)} disabled={isLoadingReferences}>
              <option value="">All parts</option>
              {activeParts.map((item) => (
                <option key={item.id} value={item.id}>{item.partNumber} - {item.name}</option>
              ))}
            </select>
          </label>
          <div className="parts-history-filter-actions">
            <div className="parts-history-button-row">
              <button type="submit" disabled={isLoadingReferences || isLoadingHistory}>
                {isLoadingHistory ? 'Loading history...' : 'Review History'}
              </button>
              <button type="button" className="secondary-button" onClick={clearFilters} disabled={isLoadingReferences || isLoadingHistory || (!hasDraftFilters && !hasSearched)}>
                Clear
              </button>
            </div>
            <p className="muted">Choose at least one filter. Use equipment + part together to narrow repeat repairs before approving new requests.</p>
          </div>
        </form>
        <p className="muted">Deferred: AI/scoring logic, automatic recommendations, confidence scores, purchasing, vendor cost tracking, and advanced inventory.</p>
      </div>

      {isLoadingReferences ? <p className="muted" role="status">Loading parts usage filters...</p> : null}
      {isLoadingHistory ? <p className="muted" role="status">Loading parts usage history...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <article className="card stack parts-history-results">
        <h3>Historical usage</h3>
        {!hasSearched && !isLoadingHistory ? (
          <div className="empty-state parts-history-empty">
            <strong>Set filters to review usage history.</strong>
            <p>Results stay hidden until you run a filtered search by customer, equipment, part, or a combination of those filters.</p>
          </div>
        ) : history.length ? (
          <ul className="stack supply-history-list">
            {history.map((item) => (
              <li key={item.jobTicketPartId} className="supply-history-item">
                <div className="supply-history-item-heading">
                  <strong>{item.partNumber} - {item.partName}</strong>
                  <p className="muted">{item.ticketNumber} - Qty {item.quantity} - {getApprovalLabel(item.approvalStatus)} - {formatDate(item.installedAtUtc ?? item.addedAtUtc)}</p>
                  {item.customerName ? <p className="muted">Customer: {item.customerName}</p> : null}
                  <p className="muted">Equipment: {item.equipmentName ?? (item.equipmentId ? 'Equipment unavailable' : '-')}{item.modelNumber ? ` - Model ${item.modelNumber}` : ''}</p>
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
        ) : hasSearched && !isLoadingHistory ? (
          <p className="muted">No parts usage history matches the current filters.</p>
        ) : null}
      </article>
    </section>
  )
}
