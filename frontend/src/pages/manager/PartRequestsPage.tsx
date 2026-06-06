import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/httpClient'
import { masterDataApi } from '../../api/masterDataApi'
import { partRequestsApi, type PartRequestDto } from '../../api/partRequestsApi'
import type { PartDto } from '../../types'
import { formatDate, getApprovalLabel, JOB_PART_APPROVAL_STATUS } from './managerDisplay'

const statusOptions = [
  { value: JOB_PART_APPROVAL_STATUS.Pending, label: 'Pending' },
  { value: JOB_PART_APPROVAL_STATUS.Approved, label: 'Approved' },
  { value: JOB_PART_APPROVAL_STATUS.Rejected, label: 'Rejected' }
]

const moneyValue = (value?: number | null) => (Number.isFinite(value) ? String(value) : '0')

export function PartRequestsPage() {
  const [requests, setRequests] = useState<PartRequestDto[]>([])
  const [parts, setParts] = useState<PartDto[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [partDescription, setPartDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [status, setStatus] = useState(String(JOB_PART_APPROVAL_STATUS.Pending))
  const [internalStatusNotes, setInternalStatusNotes] = useState('')
  const [unitCostSnapshot, setUnitCostSnapshot] = useState('0')
  const [salePriceSnapshot, setSalePriceSnapshot] = useState('0')
  const [isBillable, setIsBillable] = useState(false)
  const [partId, setPartId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? requests[0] ?? null,
    [requests, selectedId]
  )

  const openRequests = requests.filter((request) => request.status === JOB_PART_APPROVAL_STATUS.Pending)

  const load = async () => {
    setIsLoading(true)
    const [requestResponse, partResponse] = await Promise.all([
      partRequestsApi.listQueue(),
      masterDataApi.listParts()
    ])
    setRequests(requestResponse)
    setParts(partResponse)
    setSelectedId((current) => current ?? requestResponse[0]?.id ?? null)
    setError(null)
    setIsLoading(false)
  }

  useEffect(() => {
    load().catch((requestError) => {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load part requests.')
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedRequest) {
      return
    }

    setPartDescription(selectedRequest.partName)
    setQuantity(String(selectedRequest.quantity))
    setStatus(String(selectedRequest.status))
    setInternalStatusNotes(selectedRequest.internalStatusNotes ?? '')
    setUnitCostSnapshot(moneyValue(selectedRequest.unitCostSnapshot))
    setSalePriceSnapshot(moneyValue(selectedRequest.salePriceSnapshot))
    setIsBillable(selectedRequest.isBillable)
    setPartId(selectedRequest.partId ?? '')
  }, [selectedRequest])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedRequest) {
      return
    }

    const quantityNumber = Number(quantity)
    const unitCost = Number(unitCostSnapshot)
    const salePrice = Number(salePriceSnapshot)
    if (!partDescription.trim()) {
      setError('Part description is required.')
      return
    }

    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }

    if (!Number.isFinite(unitCost) || unitCost < 0 || !Number.isFinite(salePrice) || salePrice < 0) {
      setError('Cost and billable price must be zero or greater.')
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await partRequestsApi.update(selectedRequest.id, {
        partDescription: partDescription.trim(),
        quantity: quantityNumber,
        status: Number(status),
        internalStatusNotes: internalStatusNotes || null,
        unitCostSnapshot: unitCost,
        salePriceSnapshot: salePrice,
        isBillable,
        partId: partId || null
      })
      setRequests((current) => current.map((request) => request.id === updated.id ? updated : request))
      setMessage('Part request updated.')
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to update part request.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="stack">
      <article className="card stack">
        <div className="review-heading">
          <div>
            <h2>Parts Request Queue</h2>
            <p className="muted">Back-office review for technician-submitted ticket parts.</p>
          </div>
          <div className="review-grid" aria-label="parts request summary">
            <div>
              <span className="muted">Open Requests</span>
              <strong>{openRequests.length}</strong>
            </div>
            <div>
              <span className="muted">Loaded Requests</span>
              <strong>{requests.length}</strong>
            </div>
          </div>
        </div>
        {isLoading ? <p className="muted" role="status">Loading part requests...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {message ? <p>{message}</p> : null}
      </article>

      <div className="manager-workspace-grid">
        <article className="card stack">
          <h3>Queue</h3>
          {requests.length ? (
            <ul>
              {requests.map((request) => (
                <li key={request.id}>
                  <button
                    type="button"
                    className={selectedRequest?.id === request.id ? 'secondary-button active-nav-link' : 'secondary-button'}
                    onClick={() => setSelectedId(request.id)}
                  >
                    {request.jobTicketNumber} · {request.partName} · {getApprovalLabel(request.status)}
                  </button>
                  <div className="muted">Qty {request.quantity} · Requested {formatDate(request.requestedAtUtc)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No part requests are waiting for review.</p>
          )}
        </article>

        <article className="card stack">
          <h3>Request Details</h3>
          {selectedRequest ? (
            <>
              <div className="review-grid">
                <div>
                  <span className="muted">Ticket</span>
                  <strong>{selectedRequest.jobTicketNumber}</strong>
                </div>
                <div>
                  <span className="muted">Job</span>
                  <strong>{selectedRequest.jobTicketTitle}</strong>
                </div>
                <div>
                  <span className="muted">Current Status</span>
                  <strong>{getApprovalLabel(selectedRequest.status)}</strong>
                </div>
                <div>
                  <span className="muted">Technician Notes</span>
                  <strong>{selectedRequest.requestNotes ?? selectedRequest.notes ?? 'None'}</strong>
                </div>
              </div>
              <form onSubmit={onSubmit} className="stack" aria-label="parts request review form">
                <label>
                  Part description
                  <input value={partDescription} onChange={(event) => setPartDescription(event.target.value)} required />
                </label>
                <label>
                  Catalog part match
                  <select value={partId} onChange={(event) => setPartId(event.target.value)}>
                    <option value="">No catalog match yet</option>
                    {parts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.partNumber} - {part.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input type="number" min="0.01" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
                </label>
                <label>
                  Status
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Internal status notes
                  <textarea value={internalStatusNotes} onChange={(event) => setInternalStatusNotes(event.target.value)} />
                </label>
                <label>
                  Part cost
                  <input type="number" min="0" step="0.01" value={unitCostSnapshot} onChange={(event) => setUnitCostSnapshot(event.target.value)} />
                </label>
                <label>
                  Billable price
                  <input type="number" min="0" step="0.01" value={salePriceSnapshot} onChange={(event) => setSalePriceSnapshot(event.target.value)} />
                </label>
                <label className="row">
                  <input type="checkbox" checked={isBillable} onChange={(event) => setIsBillable(event.target.checked)} />
                  Billable after back-office review
                </label>
                <button type="submit" disabled={isSaving}>{isSaving ? 'Saving request...' : 'Save Request Review'}</button>
              </form>
            </>
          ) : (
            <p className="muted">Select a part request to review.</p>
          )}
        </article>
      </div>
    </section>
  )
}
