import { FormEvent, useEffect, useMemo, useState } from 'react'
import { masterDataApi } from '../../api/masterDataApi'
import { purchasingApi } from '../../api/purchasingApi'
import type { PartDto, PurchaseOrderDto, PurchaseOrderListItemDto, VendorDto } from '../../types'

type PurchaseOrderFormState = {
  vendorId: string
  purchaseOrderNumber: string
  partId: string
  quantityOrdered: string
  unitCost: string
  expectedAtUtc: string
  notes: string
}

type InvoiceFormState = {
  vendorInvoiceNumber: string
  vendorInvoiceDateUtc: string
  invoiceStatus: string
  freightCost: string
  taxAmount: string
  otherLandedCost: string
  landedCostNotes: string
}

type PurchasingAction = 'create' | 'submit' | 'receive' | 'close' | 'invoice' | 'archive'

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const quantityFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 })

const purchaseOrderStatusLabels: Record<number, string> = {
  1: 'Draft',
  2: 'Submitted',
  3: 'Partially received',
  4: 'Received',
  5: 'Invoiced',
  6: 'Closed',
  7: 'Cancelled'
}

const invoiceStatusLabels: Record<number, string> = {
  1: 'Pending',
  2: 'Matched',
  3: 'Approved',
  4: 'Paid',
  5: 'Void'
}

const purchaseOrderStatusClasses: Record<number, string> = {
  1: 'po-status-draft',
  2: 'po-status-submitted',
  3: 'po-status-partial',
  4: 'po-status-received',
  5: 'po-status-invoiced',
  6: 'po-status-closed',
  7: 'po-status-cancelled'
}

const invoiceStatusClasses: Record<number, string> = {
  1: 'invoice-status-pending',
  2: 'invoice-status-matched',
  3: 'invoice-status-approved',
  4: 'invoice-status-paid',
  5: 'invoice-status-void'
}

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : ''
}

function toUtcIsoDate(value: string) {
  return value ? `${value}T00:00:00.000Z` : null
}

function getCatalogStatus(part: PartDto) {
  if (!part.vendorId) return 'Missing vendor link'
  if (!part.description?.trim()) return 'Needs part details'
  return 'Ready for ticket use'
}

function createInvoiceState(order?: PurchaseOrderDto | null): InvoiceFormState {
  return {
    vendorInvoiceNumber: order?.vendorInvoiceNumber ?? '',
    vendorInvoiceDateUtc: toDateInputValue(order?.vendorInvoiceDateUtc),
    invoiceStatus: String(order?.invoiceStatus ?? 1),
    freightCost: String(order?.freightCost ?? 0),
    taxAmount: String(order?.taxAmount ?? 0),
    otherLandedCost: String(order?.otherLandedCost ?? 0),
    landedCostNotes: order?.landedCostNotes ?? ''
  }
}

export function PurchasingWorkbenchPage() {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<PurchasingAction | null>(null)
  const [parts, setParts] = useState<PartDto[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderListItemDto[]>([])
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDto | null>(null)
  const [vendors, setVendors] = useState<VendorDto[]>([])
  const [form, setForm] = useState<PurchaseOrderFormState>({ vendorId: '', purchaseOrderNumber: '', partId: '', quantityOrdered: '1', unitCost: '0', expectedAtUtc: '', notes: '' })
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>(createInvoiceState())
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, string>>({})

  const activeVendors = useMemo(() => vendors.filter((vendor) => !vendor.isArchived), [vendors])
  const activeParts = useMemo(() => parts.filter((part) => !part.isArchived), [parts])
  const selectedPart = activeParts.find((part) => part.id === form.partId)
  const submittedOrReceivingCount = useMemo(() => purchaseOrders.filter((order) => order.status === 2 || order.status === 3).length, [purchaseOrders])
  const draftCount = useMemo(() => purchaseOrders.filter((order) => order.status === 1).length, [purchaseOrders])
  const archivedCount = useMemo(() => purchaseOrders.filter((order) => order.isArchived).length, [purchaseOrders])

  const optionalOrderCandidates = useMemo(() => activeParts
    .filter((part) => !part.vendorId || !part.description?.trim())
    .map((part) => ({ ...part, statusLabel: getCatalogStatus(part) })), [activeParts])

  const refresh = async () => {
    const [partList, vendorList, orderList] = await Promise.all([
      masterDataApi.listParts(),
      masterDataApi.listVendors(),
      purchasingApi.listPurchaseOrders()
    ])
    setParts(partList)
    setVendors(vendorList)
    setPurchaseOrders(orderList)
  }

  useEffect(() => {
    refresh()
      .then(() => setError(null))
      .catch(() => setError('Unable to load purchasing workflow data.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!form.partId && activeParts.length > 0) {
      const firstCandidate = optionalOrderCandidates[0] ?? activeParts[0]
      setForm((current) => ({
        ...current,
        vendorId: current.vendorId || firstCandidate.vendorId || activeVendors[0]?.id || '',
        partId: firstCandidate.id,
        quantityOrdered: '1',
        unitCost: String(firstCandidate.unitCost ?? 0)
      }))
    }
  }, [activeParts, activeVendors, form.partId, optionalOrderCandidates])

  const loadOrder = async (id: string) => {
    const order = await purchasingApi.getPurchaseOrder(id)
    setSelectedOrder(order)
    setInvoiceForm(createInvoiceState(order))
    setReceiveQuantities(Object.fromEntries(order.lines.map((line) => [line.id, String(line.quantityReceived)])))
  }

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setBusyAction('create')
    try {
      const created = await purchasingApi.createPurchaseOrder({
        vendorId: form.vendorId,
        purchaseOrderNumber: form.purchaseOrderNumber || null,
        orderedAtUtc: new Date().toISOString(),
        expectedAtUtc: toUtcIsoDate(form.expectedAtUtc),
        notes: form.notes || null,
        lines: [{ partId: form.partId, quantityOrdered: Number(form.quantityOrdered), unitCost: Number(form.unitCost), notes: form.notes || null }]
      })
      await refresh()
      await loadOrder(created.id)
      setError(null)
      setMessage('Purchase order created.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to create purchase order.')
      setMessage(null)
    } finally {
      setBusyAction(null)
    }
  }

  const submitOrder = async () => {
    if (!selectedOrder) return
    setMessage(null)
    setError(null)
    setBusyAction('submit')
    try {
      await purchasingApi.submitPurchaseOrder(selectedOrder.id)
      await refresh()
      await loadOrder(selectedOrder.id)
      setError(null)
      setMessage('Purchase order submitted.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to submit purchase order.')
      setMessage(null)
    } finally {
      setBusyAction(null)
    }
  }

  const submitReceive = async () => {
    if (!selectedOrder) return
    setMessage(null)
    setError(null)
    setBusyAction('receive')
    try {
      await purchasingApi.receivePurchaseOrder(selectedOrder.id, {
        receivedAtUtc: new Date().toISOString(),
        lines: selectedOrder.lines.map((line) => ({ lineId: line.id, receivedQuantity: Number(receiveQuantities[line.id] ?? line.quantityReceived) }))
      })
      await refresh()
      await loadOrder(selectedOrder.id)
      setError(null)
      setMessage('Receiving saved.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to receive purchase order.')
      setMessage(null)
    } finally {
      setBusyAction(null)
    }
  }

  const closeSelected = async () => {
    if (!selectedOrder) return
    setMessage(null)
    setError(null)
    setBusyAction('close')
    try {
      await purchasingApi.closePurchaseOrder(selectedOrder.id)
      await refresh()
      await loadOrder(selectedOrder.id)
      setError(null)
      setMessage('Purchase order closed.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to close purchase order.')
      setMessage(null)
    } finally {
      setBusyAction(null)
    }
  }

  const submitInvoice = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedOrder) return
    setMessage(null)
    setError(null)
    setBusyAction('invoice')
    try {
      await purchasingApi.updatePurchaseOrder(selectedOrder.id, {
        purchaseOrderNumber: selectedOrder.purchaseOrderNumber,
        expectedAtUtc: selectedOrder.expectedAtUtc,
        vendorInvoiceNumber: invoiceForm.vendorInvoiceNumber || null,
        vendorInvoiceDateUtc: toUtcIsoDate(invoiceForm.vendorInvoiceDateUtc),
        invoiceStatus: Number(invoiceForm.invoiceStatus),
        freightCost: Number(invoiceForm.freightCost),
        taxAmount: Number(invoiceForm.taxAmount),
        otherLandedCost: Number(invoiceForm.otherLandedCost),
        landedCostNotes: invoiceForm.landedCostNotes || null,
        notes: selectedOrder.notes ?? null,
        lines: selectedOrder.lines.map((line) => ({ partId: line.partId, quantityOrdered: line.quantityOrdered, unitCost: line.unitCost, notes: line.notes ?? null }))
      })
      await refresh()
      await loadOrder(selectedOrder.id)
      setError(null)
      setMessage('Vendor invoice and landed costs saved.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to update vendor invoice and landed costs.')
      setMessage(null)
    } finally {
      setBusyAction(null)
    }
  }

  const archiveSelected = async () => {
    if (!selectedOrder) return
    setMessage(null)
    setError(null)
    setBusyAction('archive')
    try {
      if (selectedOrder.isArchived) {
        await purchasingApi.unarchivePurchaseOrder(selectedOrder.id)
      } else {
        await purchasingApi.archivePurchaseOrder(selectedOrder.id)
      }
      await refresh()
      await loadOrder(selectedOrder.id)
      setError(null)
      setMessage(selectedOrder.isArchived ? 'Purchase order unarchived.' : 'Purchase order archived.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to update purchase order archive status.')
      setMessage(null)
    } finally {
      setBusyAction(null)
    }
  }

  if (isLoading) return <section className="card"><p>Loading purchasing workflow…</p></section>

  return (
    <section className="stack">
      <article className="card">
        <h2>Purchasing Workbench</h2>
        <p className="muted">Manager/Admin workflow for purchase orders, receiving, close review, vendor invoice tracking, and landed-cost recording. Techs can add parts directly to tickets; order requests remain optional.</p>
        {message ? <p role="status" className="success">{message}</p> : null}
        {error ? <p role="alert" className="error">{error}</p> : null}
      </article>

      <div className="purchasing-kpi-grid">
        <div className="queue-kpi-card">
          <span>Visible POs</span>
          <strong>{purchaseOrders.length}</strong>
          <p className="muted">Purchase orders in this list</p>
        </div>
        <div className={submittedOrReceivingCount > 0 ? 'queue-kpi-card queue-kpi-card-review' : 'queue-kpi-card'}>
          <span>Need receiving</span>
          <strong>{submittedOrReceivingCount}</strong>
          <p className="muted">Submitted or partially received</p>
        </div>
        <div className="queue-kpi-card">
          <span>Drafts</span>
          <strong>{draftCount}</strong>
          <p className="muted">Waiting to be submitted</p>
        </div>
        <div className="queue-kpi-card">
          <span>Archived</span>
          <strong>{archivedCount}</strong>
          <p className="muted">Hidden from day-to-day work</p>
        </div>
      </div>

      <article className="card">
        <h3>Create purchase order</h3>
        <form className="form-grid" onSubmit={submitCreate}>
          <label className="sr-label">Vendor
            <select aria-label="Purchase order vendor" required value={form.vendorId} onChange={(event) => setForm({ ...form, vendorId: event.target.value })}>
              <option value="">Select vendor</option>
              {activeVendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
            </select>
          </label>
          <label className="sr-label">PO number
            <input aria-label="Purchase order number" maxLength={100} value={form.purchaseOrderNumber} onChange={(event) => setForm({ ...form, purchaseOrderNumber: event.target.value })} placeholder="Auto-generated if blank" />
          </label>
          <label className="sr-label">Expected date
            <input aria-label="Expected date" type="date" value={form.expectedAtUtc} onChange={(event) => setForm({ ...form, expectedAtUtc: event.target.value })} />
          </label>
          <label className="sr-label">Part
            <select aria-label="Purchase order part" required value={form.partId} onChange={(event) => {
              const part = activeParts.find((item) => item.id === event.target.value)
              setForm({ ...form, partId: event.target.value, vendorId: part?.vendorId ?? form.vendorId, unitCost: String(part?.unitCost ?? 0) })
            }}>
              <option value="">Select part</option>
              {activeParts.map((part) => <option key={part.id} value={part.id}>{part.partNumber} · {part.name}</option>)}
            </select>
            {selectedPart ? (
              <span className={`field-char-count${getCatalogStatus(selectedPart) !== 'Ready for ticket use' ? ' field-char-count--warn' : ''}`}>
                {getCatalogStatus(selectedPart)}{selectedPart.vendorId ? ' · vendor linked' : ' · no vendor linked'}
              </span>
            ) : null}
          </label>
          <label className="sr-label">Quantity
            <input aria-label="Quantity ordered" required min="0.0001" step="0.0001" type="number" value={form.quantityOrdered} onChange={(event) => setForm({ ...form, quantityOrdered: event.target.value })} />
          </label>
          <label className="sr-label">Unit cost
            <input aria-label="Unit cost" required min="0" step="0.01" type="number" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} />
          </label>
          <label className="sr-label form-field-full">Notes
            <textarea aria-label="Purchase order notes" rows={3} maxLength={2000} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <span className={`field-char-count${form.notes.length > 1800 ? ' field-char-count--warn' : ''}`}>{form.notes.length} / 2,000</span>
          </label>
          <button type="submit" disabled={busyAction !== null}>{busyAction === 'create' ? 'Creating...' : 'Create purchase order'}</button>
        </form>
      </article>

      <article className="card">
        <h3>Purchase orders</h3>
        {purchaseOrders.length === 0 ? (
          <p className="muted">No purchase orders yet. Create your first purchase order above.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>PO</th><th>Vendor</th><th>Status</th><th>Received</th><th>Invoice</th><th>Costs</th><th></th></tr></thead>
              <tbody>
                {purchaseOrders.map((order) => {
                  const rowClasses = [
                    order.isArchived ? 'muted' : '',
                    selectedOrder?.id === order.id ? 'po-row-selected' : ''
                  ].filter(Boolean).join(' ')
                  return (
                    <tr key={order.id} className={rowClasses || undefined}>
                      <td><strong>{order.purchaseOrderNumber}{order.isArchived ? ' (archived)' : ''}</strong></td>
                      <td>{order.vendorName}</td>
                      <td><span className={`status-pill ${purchaseOrderStatusClasses[order.status] ?? ''}`}>{purchaseOrderStatusLabels[order.status]}</span></td>
                      <td>{quantityFormatter.format(order.quantityReceived)} / {quantityFormatter.format(order.quantityOrdered)}</td>
                      <td>
                        {order.vendorInvoiceNumber ? order.vendorInvoiceNumber : <span className="muted">No invoice</span>}
                        {' '}
                        <span className={`status-pill ${invoiceStatusClasses[order.invoiceStatus] ?? ''}`}>{invoiceStatusLabels[order.invoiceStatus]}</span>
                      </td>
                      <td>{currencyFormatter.format(order.orderedSubtotal)} <span className="muted">+ {currencyFormatter.format(order.landedCostTotal)} landed</span></td>
                      <td><button type="button" onClick={() => loadOrder(order.id)}>Review</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {selectedOrder ? (
        <article className="card">
          <h3>Review {selectedOrder.purchaseOrderNumber}</h3>
          <p className="po-review-summary">
            <strong>{selectedOrder.vendorName}</strong>
            <span className={`status-pill ${purchaseOrderStatusClasses[selectedOrder.status] ?? ''}`}>{purchaseOrderStatusLabels[selectedOrder.status]}</span>
            <span className={`status-pill ${invoiceStatusClasses[selectedOrder.invoiceStatus] ?? ''}`}>Invoice {invoiceStatusLabels[selectedOrder.invoiceStatus]}</span>
          </p>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Part</th><th>Ordered</th><th>Received</th><th>Unit cost</th><th>Line subtotal</th></tr></thead>
              <tbody>{selectedOrder.lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.partNumber} · {line.partName}</td>
                  <td>{quantityFormatter.format(line.quantityOrdered)}</td>
                  <td><input aria-label={`Received quantity for ${line.partNumber}`} type="number" min="0" max={line.quantityOrdered} step="0.0001" value={receiveQuantities[line.id] ?? String(line.quantityReceived)} onChange={(event) => setReceiveQuantities({ ...receiveQuantities, [line.id]: event.target.value })} /></td>
                  <td>{currencyFormatter.format(line.unitCost)}</td>
                  <td>{currencyFormatter.format(line.lineSubtotal)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="inline-links">
            {selectedOrder.status === 1 ? <button type="button" disabled={busyAction !== null} onClick={submitOrder}>{busyAction === 'submit' ? 'Submitting...' : 'Submit PO'}</button> : null}
            {selectedOrder.status !== 1 && selectedOrder.status !== 6 && selectedOrder.status !== 7 ? <button type="button" disabled={busyAction !== null} onClick={submitReceive}>{busyAction === 'receive' ? 'Saving receiving...' : 'Save receiving'}</button> : null}
            {!selectedOrder.isArchived && (selectedOrder.status === 4 || selectedOrder.status === 5) ? <button type="button" disabled={busyAction !== null} onClick={closeSelected}>{busyAction === 'close' ? 'Closing...' : 'Close PO'}</button> : null}
            <button type="button" disabled={busyAction !== null} onClick={archiveSelected}>{busyAction === 'archive' ? 'Working...' : selectedOrder.isArchived ? 'Unarchive' : 'Archive'}</button>
          </div>

          <form className="form-grid" onSubmit={submitInvoice}>
            <h4 className="form-field-full">Vendor invoice and landed costs</h4>
            <label className="sr-label">Vendor invoice #
              <input aria-label="Vendor invoice number" maxLength={100} value={invoiceForm.vendorInvoiceNumber} onChange={(event) => setInvoiceForm({ ...invoiceForm, vendorInvoiceNumber: event.target.value })} />
              <span className={`field-char-count${invoiceForm.vendorInvoiceNumber.length > 85 ? ' field-char-count--warn' : ''}`}>{invoiceForm.vendorInvoiceNumber.length} / 100</span>
            </label>
            <label className="sr-label">Invoice date
              <input aria-label="Vendor invoice date" type="date" value={invoiceForm.vendorInvoiceDateUtc} onChange={(event) => setInvoiceForm({ ...invoiceForm, vendorInvoiceDateUtc: event.target.value })} />
            </label>
            <label className="sr-label">Invoice status
              <select aria-label="Vendor invoice status" value={invoiceForm.invoiceStatus} onChange={(event) => setInvoiceForm({ ...invoiceForm, invoiceStatus: event.target.value })}>
                {Object.entries(invoiceStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="sr-label">Freight
              <input aria-label="Freight cost" type="number" min="0" step="0.01" value={invoiceForm.freightCost} onChange={(event) => setInvoiceForm({ ...invoiceForm, freightCost: event.target.value })} />
            </label>
            <label className="sr-label">Tax
              <input aria-label="Tax amount" type="number" min="0" step="0.01" value={invoiceForm.taxAmount} onChange={(event) => setInvoiceForm({ ...invoiceForm, taxAmount: event.target.value })} />
            </label>
            <label className="sr-label">Other landed cost
              <input aria-label="Other landed cost" type="number" min="0" step="0.01" value={invoiceForm.otherLandedCost} onChange={(event) => setInvoiceForm({ ...invoiceForm, otherLandedCost: event.target.value })} />
            </label>
            <label className="sr-label form-field-full">Landed-cost notes
              <textarea aria-label="Landed-cost notes" rows={3} maxLength={2000} value={invoiceForm.landedCostNotes} onChange={(event) => setInvoiceForm({ ...invoiceForm, landedCostNotes: event.target.value })} />
              <span className={`field-char-count${invoiceForm.landedCostNotes.length > 1800 ? ' field-char-count--warn' : ''}`}>{invoiceForm.landedCostNotes.length} / 2,000</span>
            </label>
            <button type="submit" disabled={busyAction !== null}>{busyAction === 'invoice' ? 'Saving invoice...' : 'Save invoice and landed costs'}</button>
          </form>
          <div className="po-review-summary muted">
            <span>Invoice subtotal <strong>{currencyFormatter.format(selectedOrder.invoiceSubtotal)}</strong></span>
            <span>Landed costs <strong>{currencyFormatter.format(selectedOrder.landedCostTotal)}</strong></span>
            <span>Total <strong>{currencyFormatter.format(selectedOrder.invoiceSubtotal + selectedOrder.landedCostTotal)}</strong></span>
          </div>
        </article>
      ) : null}

      <article className="card">
        <h3>Parts Needing Catalog Cleanup</h3>
        <p className="muted">Reference list only for optional order-request workflow support; no replenishment automation or recommendation scoring is performed.</p>
        {optionalOrderCandidates.length === 0 ? (
          <p className="muted">All active parts have vendor links and details. Nothing needs cleanup.</p>
        ) : (
          <ul className="supply-reorder-list">
            {optionalOrderCandidates.map((part) => <li key={part.id} className="supply-reorder-item">{part.partNumber} · {part.name}: {part.statusLabel}</li>)}
          </ul>
        )}
      </article>
    </section>
  )
}
