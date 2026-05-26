import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/httpClient'
import {
  inventoryApi,
  type CreateInventoryTransferDto,
  type CreateManualInventoryAdjustmentDto,
  type InventoryStockSummaryDto,
  type InventoryTransactionDto,
  type StockLocationDto
} from '../../api/inventoryApi'
import { masterDataApi } from '../../api/masterDataApi'
import type { PartDto } from '../../types'
import { Errorable } from './common/Errorable'

type StockLocationFormState = {
  name: string
  code: string
  description: string
}

type AdjustmentFormState = {
  stockLocationId: string
  partId: string
  quantityDelta: string
  reason: string
  notes: string
}

type TransferFormState = {
  sourceStockLocationId: string
  destinationStockLocationId: string
  partId: string
  quantity: string
  reason: string
  notes: string
}

const quantityFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 })

const transactionTypeLabels: Record<number, string> = {
  1: 'Receipt',
  2: 'Manual adjustment',
  3: 'Warehouse transfer'
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '—'
}

function getInventoryErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return error.message
    }

    if (error.status === 401 || error.status === 403) {
      return 'You do not have permission to manage inventory.'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function InventoryPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [parts, setParts] = useState<PartDto[]>([])
  const [stockLocations, setStockLocations] = useState<StockLocationDto[]>([])
  const [stockSummary, setStockSummary] = useState<InventoryStockSummaryDto[]>([])
  const [transactions, setTransactions] = useState<InventoryTransactionDto[]>([])
  const [selectedStockLocationId, setSelectedStockLocationId] = useState('')
  const [selectedPartId, setSelectedPartId] = useState('')
  const [locationForm, setLocationForm] = useState<StockLocationFormState>({ name: '', code: '', description: '' })
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentFormState>({ stockLocationId: '', partId: '', quantityDelta: '0', reason: '', notes: '' })
  const [transferForm, setTransferForm] = useState<TransferFormState>({
    sourceStockLocationId: '',
    destinationStockLocationId: '',
    partId: '',
    quantity: '0',
    reason: '',
    notes: ''
  })

  const activeStockLocations = useMemo(() => stockLocations.filter((location) => !location.isArchived), [stockLocations])
  const activeParts = useMemo(() => parts.filter((part) => !part.isArchived), [parts])

  const refresh = async (filters = { stockLocationId: selectedStockLocationId, partId: selectedPartId }) => {
    const [locationList, partList, summaryList, transactionList] = await Promise.all([
      inventoryApi.listStockLocations({ includeArchived: true, limit: 200 }),
      masterDataApi.listParts(),
      inventoryApi.listStockSummary({
        stockLocationId: filters.stockLocationId || undefined,
        partId: filters.partId || undefined
      }),
      inventoryApi.listTransactions({
        stockLocationId: filters.stockLocationId || undefined,
        partId: filters.partId || undefined,
        limit: 50
      })
    ])

    setStockLocations(locationList)
    setParts(partList)
    setStockSummary(summaryList)
    setTransactions(transactionList)

    const firstActiveLocation = locationList.find((location) => !location.isArchived)
    const secondActiveLocation = locationList.find((location) => !location.isArchived && location.id !== firstActiveLocation?.id)
    const firstActivePart = partList.find((part) => !part.isArchived)

    setAdjustmentForm((current) => ({
      ...current,
      stockLocationId: current.stockLocationId || firstActiveLocation?.id || '',
      partId: current.partId || firstActivePart?.id || ''
    }))
    setTransferForm((current) => ({
      ...current,
      sourceStockLocationId: current.sourceStockLocationId || firstActiveLocation?.id || '',
      destinationStockLocationId: current.destinationStockLocationId || secondActiveLocation?.id || '',
      partId: current.partId || firstActivePart?.id || ''
    }))
    setError(null)
  }

  useEffect(() => {
    refresh()
      .catch((requestError) => setError(getInventoryErrorMessage(requestError, 'Unable to load inventory workflow data.')))
      .finally(() => setIsLoading(false))
  }, [])

  const submitFilters = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await refresh({ stockLocationId: selectedStockLocationId, partId: selectedPartId })
    } catch (requestError) {
      setError(getInventoryErrorMessage(requestError, 'Unable to review filtered inventory data.'))
    }
  }

  const submitStockLocation = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await inventoryApi.createStockLocation({
        name: locationForm.name,
        code: locationForm.code,
        description: locationForm.description || null
      })
      setLocationForm({ name: '', code: '', description: '' })
      await refresh()
    } catch (requestError) {
      setError(getInventoryErrorMessage(requestError, 'Unable to create stock location.'))
    }
  }

  const toggleArchive = async (location: StockLocationDto) => {
    try {
      if (location.isArchived) {
        await inventoryApi.unarchiveStockLocation(location.id)
      } else {
        await inventoryApi.archiveStockLocation(location.id)
      }
      await refresh()
    } catch (requestError) {
      setError(getInventoryErrorMessage(requestError, 'Unable to update stock location archive status.'))
    }
  }

  const submitAdjustment = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const payload: CreateManualInventoryAdjustmentDto = {
        stockLocationId: adjustmentForm.stockLocationId,
        partId: adjustmentForm.partId,
        quantityDelta: Number(adjustmentForm.quantityDelta),
        reason: adjustmentForm.reason,
        notes: adjustmentForm.notes || null,
        occurredAtUtc: new Date().toISOString()
      }
      await inventoryApi.createManualAdjustment(payload)
      setAdjustmentForm((current) => ({ ...current, quantityDelta: '0', reason: '', notes: '' }))
      await refresh()
    } catch (requestError) {
      setError(getInventoryErrorMessage(requestError, 'Unable to post manual inventory adjustment.'))
    }
  }

  const submitTransfer = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const payload: CreateInventoryTransferDto = {
        sourceStockLocationId: transferForm.sourceStockLocationId,
        destinationStockLocationId: transferForm.destinationStockLocationId,
        partId: transferForm.partId,
        quantity: Number(transferForm.quantity),
        reason: transferForm.reason,
        notes: transferForm.notes || null,
        occurredAtUtc: new Date().toISOString()
      }
      await inventoryApi.createTransfer(payload)
      setTransferForm((current) => ({ ...current, quantity: '0', reason: '', notes: '' }))
      await refresh()
    } catch (requestError) {
      setError(getInventoryErrorMessage(requestError, 'Unable to post warehouse transfer.'))
    }
  }

  if (isLoading) {
    return <section className="card"><p>Loading inventory workflow…</p></section>
  }

  return (
    <section className="stack">
      <article className="card stack">
        <div>
          <h2>Inventory Operations</h2>
          <p className="muted">Warehouse-first Manager/Admin workflow for stock-location management, stock visibility, warehouse transfers, recent transaction review, and manual adjustments.</p>
          <p className="muted">Deferred: truck inventory, transfers outside this warehouse-to-warehouse lane, replenishment automation, pick or reserve automation, compatibility recommendations, and AI/scoring.</p>
        </div>
        <Errorable error={error} />
        <form className="row" onSubmit={submitFilters} aria-label="inventory filters">
          <label>
            Stock location
            <select aria-label="Inventory stock location filter" value={selectedStockLocationId} onChange={(event) => setSelectedStockLocationId(event.target.value)}>
              <option value="">All stock locations</option>
              {activeStockLocations.map((location) => (
                <option key={location.id} value={location.id}>{location.code} · {location.name}</option>
              ))}
            </select>
          </label>
          <label>
            Part
            <select aria-label="Inventory part filter" value={selectedPartId} onChange={(event) => setSelectedPartId(event.target.value)}>
              <option value="">All parts</option>
              {activeParts.map((part) => (
                <option key={part.id} value={part.id}>{part.partNumber} · {part.name}</option>
              ))}
            </select>
          </label>
          <button type="submit">Review inventory</button>
        </form>
      </article>

      <article className="card stack">
        <h3>Stock locations</h3>
        <form className="form-grid" onSubmit={submitStockLocation}>
          <label>Name
            <input aria-label="Stock location name" required value={locationForm.name} onChange={(event) => setLocationForm({ ...locationForm, name: event.target.value })} />
          </label>
          <label>Code
            <input aria-label="Stock location code" required value={locationForm.code} onChange={(event) => setLocationForm({ ...locationForm, code: event.target.value })} />
          </label>
          <label>Description
            <textarea aria-label="Stock location description" value={locationForm.description} onChange={(event) => setLocationForm({ ...locationForm, description: event.target.value })} />
          </label>
          <button type="submit">Create stock location</button>
        </form>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Status</th><th>Description</th><th></th></tr></thead>
            <tbody>
              {stockLocations.map((location) => (
                <tr key={location.id} className={location.isArchived ? 'muted' : undefined}>
                  <td>{location.code}</td>
                  <td>{location.name}{location.isArchived ? ' (archived)' : ''}</td>
                  <td>{location.isArchived ? 'Archived' : location.isActive ? 'Active' : 'Inactive'}</td>
                  <td>{location.description || '—'}</td>
                  <td><button type="button" onClick={() => toggleArchive(location)}>{location.isArchived ? 'Unarchive' : 'Archive'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card stack">
        <h3>Stock visibility</h3>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Location</th><th>Part</th><th>On hand</th><th>Last movement</th></tr></thead>
            <tbody>
              {stockSummary.map((row) => (
                <tr key={`${row.stockLocationId}:${row.partId}`}>
                  <td>{row.stockLocationName}</td>
                  <td>{row.partNumber} · {row.partName}</td>
                  <td>{quantityFormatter.format(row.quantityOnHand)}</td>
                  <td>{formatDateTime(row.lastTransactionAtUtc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!stockSummary.length ? <p className="muted">No stock rows match the current filters.</p> : null}
      </article>

      <article className="card stack">
        <h3>Warehouse transfer</h3>
        <p className="muted">Move stock between existing active warehouse locations while keeping transfer activity visible in the shared inventory history.</p>
        <form className="form-grid" onSubmit={submitTransfer}>
          <label>Source stock location
            <select aria-label="Transfer source location" required value={transferForm.sourceStockLocationId} onChange={(event) => setTransferForm({ ...transferForm, sourceStockLocationId: event.target.value })}>
              <option value="">Select source stock location</option>
              {activeStockLocations.map((location) => (
                <option key={location.id} value={location.id}>{location.code} · {location.name}</option>
              ))}
            </select>
          </label>
          <label>Destination stock location
            <select aria-label="Transfer destination location" required value={transferForm.destinationStockLocationId} onChange={(event) => setTransferForm({ ...transferForm, destinationStockLocationId: event.target.value })}>
              <option value="">Select destination stock location</option>
              {activeStockLocations.map((location) => (
                <option key={location.id} value={location.id}>{location.code} · {location.name}</option>
              ))}
            </select>
          </label>
          <label>Part
            <select aria-label="Transfer part" required value={transferForm.partId} onChange={(event) => setTransferForm({ ...transferForm, partId: event.target.value })}>
              <option value="">Select part</option>
              {activeParts.map((part) => (
                <option key={part.id} value={part.id}>{part.partNumber} · {part.name}</option>
              ))}
            </select>
          </label>
          <label>Quantity
            <input aria-label="Transfer quantity" required step="0.0001" min="0.0001" type="number" value={transferForm.quantity} onChange={(event) => setTransferForm({ ...transferForm, quantity: event.target.value })} />
          </label>
          <label>Reason
            <input aria-label="Transfer reason" required value={transferForm.reason} onChange={(event) => setTransferForm({ ...transferForm, reason: event.target.value })} />
          </label>
          <label>Notes
            <textarea aria-label="Transfer notes" value={transferForm.notes} onChange={(event) => setTransferForm({ ...transferForm, notes: event.target.value })} />
          </label>
          <button type="submit">Post transfer</button>
        </form>
      </article>

      <article className="card stack">
        <h3>Recent transactions</h3>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>When</th><th>Location</th><th>Part</th><th>Type</th><th>Quantity</th><th>Reason</th><th>Notes</th><th>Purchase order</th></tr></thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDateTime(transaction.occurredAtUtc)}</td>
                  <td>{transaction.stockLocationName}</td>
                  <td>{transaction.partNumber} · {transaction.partName}</td>
                  <td>{transactionTypeLabels[transaction.transactionType] ?? `Type ${transaction.transactionType}`}</td>
                  <td>{quantityFormatter.format(transaction.quantityDelta)}</td>
                  <td>{transaction.reason}</td>
                  <td>{transaction.notes ?? '—'}</td>
                  <td>{transaction.purchaseOrderNumber ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!transactions.length ? <p className="muted">No recent inventory transactions match the current filters.</p> : null}
      </article>

      <article className="card stack">
        <h3>Manual adjustment</h3>
        <form className="form-grid" onSubmit={submitAdjustment}>
          <label>Stock location
            <select aria-label="Adjustment stock location" required value={adjustmentForm.stockLocationId} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, stockLocationId: event.target.value })}>
              <option value="">Select stock location</option>
              {activeStockLocations.map((location) => (
                <option key={location.id} value={location.id}>{location.code} · {location.name}</option>
              ))}
            </select>
          </label>
          <label>Part
            <select aria-label="Adjustment part" required value={adjustmentForm.partId} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, partId: event.target.value })}>
              <option value="">Select part</option>
              {activeParts.map((part) => (
                <option key={part.id} value={part.id}>{part.partNumber} · {part.name}</option>
              ))}
            </select>
          </label>
          <label>Quantity delta
            <input aria-label="Adjustment quantity delta" required step="0.0001" type="number" value={adjustmentForm.quantityDelta} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, quantityDelta: event.target.value })} />
          </label>
          <label>Reason
            <input aria-label="Adjustment reason" required value={adjustmentForm.reason} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, reason: event.target.value })} />
          </label>
          <label>Notes
            <textarea aria-label="Adjustment notes" value={adjustmentForm.notes} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, notes: event.target.value })} />
          </label>
          <button type="submit">Post adjustment</button>
        </form>
      </article>
    </section>
  )
}
