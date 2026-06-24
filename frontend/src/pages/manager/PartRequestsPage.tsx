import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/httpClient'
import { masterDataApi } from '../../api/masterDataApi'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { partRequestsApi, type PartRequestDto } from '../../api/partRequestsApi'
import type { JobTicketListItemDto, PartDto } from '../../types'
import { formatDate, getApprovalLabel, JOB_PART_APPROVAL_STATUS } from './managerDisplay'
import { JobTicketCombobox } from './common/JobTicketCombobox'

const statusOptions = [
  { value: JOB_PART_APPROVAL_STATUS.Pending, label: 'Pending' },
  { value: JOB_PART_APPROVAL_STATUS.Approved, label: 'Approved' },
  { value: JOB_PART_APPROVAL_STATUS.Rejected, label: 'Rejected' }
]

const moneyValue = (value?: number | null) => (Number.isFinite(value) ? String(value) : '0')

export function PartRequestsPage() {
  const [requests, setRequests] = useState<PartRequestDto[]>([])
  const [parts, setParts] = useState<PartDto[]>([])
  const [jobTickets, setJobTickets] = useState<JobTicketListItemDto[]>([])
  const [jobTicketId, setJobTicketId] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<number | ''>('')
  const [focusFilter, setFocusFilter] = useState<'all' | 'pending' | 'unlisted'>('all')
  const [search, setSearch] = useState('')
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

  const openRequests = requests.filter((request) => request.status === JOB_PART_APPROVAL_STATUS.Pending)
  const unlistedRequests = requests.filter((request) => !request.partId)
  const visibleRequests = useMemo(() => {
    if (focusFilter === 'pending') return requests.filter((request) => request.status === JOB_PART_APPROVAL_STATUS.Pending)
    if (focusFilter === 'unlisted') return requests.filter((request) => !request.partId)
    return requests
  }, [focusFilter, requests])
  const selectedRequest = useMemo(
    () => visibleRequests.find((request) => request.id === selectedId) ?? visibleRequests[0] ?? null,
    [visibleRequests, selectedId]
  )
  const selectedStatusLabel = statusOptions.find((option) => option.value === Number(status))?.label ?? 'Pending'
  const reviewGuidance = selectedRequest
    ? Number(status) === JOB_PART_APPROVAL_STATUS.Pending
      ? 'Pending keeps this request in the active queue until details are finalized.'
      : Number(status) === JOB_PART_APPROVAL_STATUS.Approved
        ? partId
          ? 'Approved with a catalog match. Purchasing and reporting will stay aligned.'
          : 'Approved without a catalog match. Add one when available for cleaner downstream reporting.'
        : 'Rejected will close this request from the pending queue while preserving history.'
    : ''

  const focusSummaryLabel =
    focusFilter === 'pending'
      ? 'Reviewing pending requests only.'
      : focusFilter === 'unlisted'
        ? 'Reviewing requests without catalog matches.'
        : 'Reviewing all visible part requests.'

  const load = async () => {
    setIsLoading(true)
    try {
      const [requestResponse, partResponse, jobTicketResponse] = await Promise.all([
        partRequestsApi.listQueue({ status: statusFilter, search, jobTicketId }),
        masterDataApi.listParts(),
        jobTicketsApi.listAll()
      ])
      setRequests(requestResponse)
      setParts(partResponse)
      setJobTickets(jobTicketResponse)
      setSelectedId((current) => requestResponse.some((request) => request.id === current) ? current : requestResponse[0]?.id ?? null)
      setError(null)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load part requests.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const onFilterSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    await load()
  }

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
    <section className="stack parts-request-page">
      <article className="card stack">
        <div className="review-heading">
          <div>
            <h2>Parts Request Queue</h2>
            <p className="muted">Optional back-office review workflow for ticket parts marked Needs ordered.</p>
          </div>
          <div className="parts-request-summary-badges" aria-label="queue summary">
            <span>{openRequests.length} pending</span>
            <span>{unlistedRequests.length} unlisted</span>
            <span>{requests.length} visible</span>
          </div>
        </div>
        <div className="parts-workflow-panel parts-request-focus-panel" aria-label="parts queue focus">
          <div className="parts-workflow-chips" role="group" aria-label="parts request focus filters">
            <button type="button" className={focusFilter === 'all' ? 'parts-workflow-chip-active' : 'secondary-button'} onClick={() => setFocusFilter('all')}>All requests ({requests.length})</button>
            <button type="button" className={focusFilter === 'pending' ? 'parts-workflow-chip-active' : 'secondary-button'} onClick={() => setFocusFilter('pending')}>Pending only ({openRequests.length})</button>
            <button type="button" className={focusFilter === 'unlisted' ? 'parts-workflow-chip-active' : 'secondary-button'} onClick={() => setFocusFilter('unlisted')}>Unlisted only ({unlistedRequests.length})</button>
          </div>
          <p className="muted parts-request-focus-note">{focusSummaryLabel}</p>
        </div>
        <form onSubmit={onFilterSubmit} className="review-grid parts-request-filter-grid" aria-label="parts request queue filters">
          <label>
            Job ticket
            <JobTicketCombobox
              tickets={jobTickets}
              selectedJobTicketId={jobTicketId}
              inputId="parts-request-job-ticket"
              label="Parts request job ticket filter"
              onSelect={(ticket) => setJobTicketId(ticket?.id ?? '')}
            />
          </label>
          <label>
            Search requests
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ticket, job, part number, or part name" />
          </label>
          <label>
            Status filter
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value ? Number(event.target.value) : '')}>
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <div className="parts-request-filter-actions">
            <button type="submit" disabled={isLoading}>Apply Filters</button>
            <p className="muted">Tip: Start with pending requests, then switch to unlisted to finish catalog matching.</p>
          </div>
        </form>
        {isLoading ? <p className="muted" role="status">Loading part requests...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {message ? <p>{message}</p> : null}
      </article>

      <div className="manager-workspace-grid parts-request-workspace">
        <article className="card stack parts-request-queue-card">
          <h3>Requests Awaiting Review</h3>
          {visibleRequests.length ? (
            <ul className="supply-queue-list">
              {visibleRequests.map((request) => (
                <li
                  key={request.id}
                  className={selectedRequest?.id === request.id ? 'supply-queue-list-item supply-queue-list-item-selected' : 'supply-queue-list-item'}
                >
                  <button
                    type="button"
                    className="secondary-button supply-queue-button"
                    onClick={() => setSelectedId(request.id)}
                  >
                    <span className="supply-queue-title">{request.jobTicketNumber} · {request.partName}</span>
                    <span className="supply-queue-status">{getApprovalLabel(request.status)}</span>
                  </button>
                  <div className="muted supply-queue-meta">Qty {request.quantity} · Needs ordered · Requested {formatDate(request.requestedAtUtc)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No part requests match the current filters.</p>
          )}
        </article>

        <article className="card stack parts-request-detail-card">
          <h3>Selected Part Request</h3>
          {selectedRequest ? (
            <>
              <div className="parts-request-detail-hero" aria-label="selected request review summary">
                <div>
                  <p className="parts-request-detail-eyebrow">Now reviewing</p>
                  <strong>{selectedRequest.partName}</strong>
                  <span>{selectedRequest.jobTicketTitle}</span>
                </div>
                <span className="parts-request-live-status">{selectedStatusLabel}</span>
              </div>
              <p className="muted parts-request-guidance">{reviewGuidance}</p>
              <div className="review-grid parts-request-context-grid">
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
                  <span className="muted">Request Type</span>
                  <strong>{selectedRequest.needsOrdered ? 'Needs ordered' : 'Ticket part only'}</strong>
                </div>
                <div>
                  <span className="muted">Technician Notes</span>
                  <strong>{selectedRequest.requestNotes ?? selectedRequest.notes ?? 'None'}</strong>
                </div>
              </div>
              <form onSubmit={onSubmit} className="stack" aria-label="parts request review form">
                <section className="parts-request-form-section" aria-label="part matching section">
                  <h4>Part Matching</h4>
                  <div className="parts-request-form-grid">
                    <label className="parts-request-form-span-2">
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
                  </div>
                </section>
                <section className="parts-request-form-section" aria-label="review decision section">
                  <h4>Review Decision</h4>
                  <div className="parts-request-form-grid">
                    <label>
                      Status
                      <select value={status} onChange={(event) => setStatus(event.target.value)}>
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Part cost
                      <input type="number" min="0" step="0.01" value={unitCostSnapshot} onChange={(event) => setUnitCostSnapshot(event.target.value)} />
                    </label>
                    <label>
                      Billable price
                      <input type="number" min="0" step="0.01" value={salePriceSnapshot} onChange={(event) => setSalePriceSnapshot(event.target.value)} />
                    </label>
                    <label className="row supply-inline-checkbox parts-request-billable-toggle">
                      <input type="checkbox" checked={isBillable} onChange={(event) => setIsBillable(event.target.checked)} />
                      Billable after back-office review
                    </label>
                    <label className="parts-request-form-span-2">
                      Internal status notes
                      <textarea value={internalStatusNotes} onChange={(event) => setInternalStatusNotes(event.target.value)} />
                    </label>
                  </div>
                </section>
                <div className="parts-request-actions">
                  <p className="muted">Save once details and status are aligned for purchasing or ticket-only handling.</p>
                  <button type="submit" disabled={isSaving}>{isSaving ? 'Saving request...' : 'Save Request Review'}</button>
                </div>
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
