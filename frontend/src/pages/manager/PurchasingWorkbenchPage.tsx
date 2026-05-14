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

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : ''
}

function toUtcIsoDate(value: string) {
  return value ? `${value}T00:00:00.000Z` : null
}

function getStockStatus(part: PartDto) {
  if (part.quantityOnHand <= 0) return 'Out of stock'
  if (part.quantityOnHand < part.reorderThreshold) return 'Below reorder threshold'
  if (part.quantityOnHand === part.reorderThreshold) return 'At reorder threshold'
  return 'Healthy'
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
  const [isLoading, setIsLoading] = useState(true)
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

  const reorderCandidates = useMemo(() => activeParts
    .filter((part) => part.quantityOnHand <= part.reorderThreshold)
    .map((part) => ({ ...part, recommendedReorderQuantity: Math.max(part.reorderThreshold - part.quantityOnHand, 1), statusLabel: getStockStatus(part) })), [activeParts])

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
      const firstCandidate = reorderCandidates[0] ?? activeParts[0]
      setForm((current) => ({
        ...current,
        vendorId: current.vendorId || firstCandidate.vendorId || activeVendors[0]?.id || '',
        partId: firstCandidate.id,
        quantityOrdered: String('recommendedReorderQuantity' in firstCandidate ? firstCandidate.recommendedReorderQuantity : 1),
        unitCost: String(firstCandidate.unitCost ?? 0)
      }))
    }
  }, [activeParts, activeVendors, form.partId, reorderCandidates])

  const loadOrder = async (id: string) => {
    const order = await purchasingApi.getPurchaseOrder(id)
    setSelectedOrder(order)
    setInvoiceForm(createInvoiceState(order))
    setReceiveQuantities(Object.fromEntries(order.lines.map((line) => [line.id, String(line.quantityReceived)])))
  }

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault()
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
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to create purchase order.')
    }
  }

  const submitOrder = async () => {
    if (!selectedOrder) return
    await purchasingApi.submitPurchaseOrder(selectedOrder.id)
    await refresh()
    await loadOrder(selectedOrder.id)
  }

  const submitReceive = async () => {
    if (!selectedOrder) return
    try {
      await purchasingApi.receivePurchaseOrder(selectedOrder.id, {
        receivedAtUtc: new Date().toISOString(),
        lines: selectedOrder.lines.map((line) => ({ lineId: line.id, receivedQuantity: Number(receiveQuantities[line.id] ?? line.quantityReceived) }))
      })
      await refresh()
      await loadOrder(selectedOrder.id)
      setError(null)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to receive purchase order.')
    }
  }

  const submitInvoice = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedOrder) return
    try {
      await purchasingApi.updatePurchaseOrder(selectedOrder.id, {
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
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to update vendor invoice and landed costs.')
    }
  }

  const archiveSelected = async () => {
    if (!selectedOrder) return
    if (selectedOrder.isArchived) {
      await purchasingApi.unarchivePurchaseOrder(selectedOrder.id)
    } else {
      await purchasingApi.archivePurchaseOrder(selectedOrder.id)
    }
    await refresh()
    await loadOrder(selectedOrder.id)
  }

  if (isLoading) return <section className="card"><p>Loading purchasing workflow…</p></section>

  return (
    <section className="stack">
      <article className="card">
        <h2>Purchasing Workbench</h2>
        <p className="muted">Manager/Admin workflow for purchase orders, receiving, vendor invoice tracking, and landed-cost recording. This phase records purchasing costs without adding warehouse, truck inventory, recommendations, or transaction-ledger workflows.</p>
        {error ? <p role="alert" className="error">{error}</p> : null}
      </article>

      <article className="card">
        <h3>Create purchase order</h3>
        <form className="form-grid" onSubmit={submitCreate}>
          <label>Vendor
            <select aria-label="Purchase order vendor" required value={form.vendorId} onChange={(event) => setForm({ ...form, vendorId: event.target.value })}>
              <option value="">Select vendor</option>
              {activeVendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
            </select>
          </label>
          <label>PO number
            <input aria-label="Purchase order number" value={form.purchaseOrderNumber} onChange={(event) => setForm({ ...form, purchaseOrderNumber: event.target.value })} placeholder="Auto-generated if blank" />
          </label>
          <label>Expected date
            <input aria-label="Expected date" type="date" value={form.expectedAtUtc} onChange={(event) => setForm({ ...form, expectedAtUtc: event.target.value })} />
          </label>
          <label>Part
            <select aria-label="Purchase order part" required value={form.partId} onChange={(event) => {
              const part = activeParts.find((item) => item.id === event.target.value)
              setForm({ ...form, partId: event.target.value, vendorId: part?.vendorId ?? form.vendorId, unitCost: String(part?.unitCost ?? 0) })
            }}>
              <option value="">Select part</option>
              {activeParts.map((part) => <option key={part.id} value={part.id}>{part.partNumber} · {part.name}</option>)}
            </select>
          </label>
          <label>Quantity
            <input aria-label="Quantity ordered" required min="0.0001" step="0.0001" type="number" value={form.quantityOrdered} onChange={(event) => setForm({ ...form, quantityOrdered: event.target.value })} />
          </label>
          <label>Unit cost
            <input aria-label="Unit cost" required min="0" step="0.01" type="number" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} />
          </label>
          <label>Notes
            <textarea aria-label="Purchase order notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          <button type="submit">Create purchase order</button>
        </form>
        {selectedPart ? <p className="muted">Selected part status: {getStockStatus(selectedPart)} · on hand {quantityFormatter.format(selectedPart.quantityOnHand)} · reorder threshold {quantityFormatter.format(selectedPart.reorderThreshold)}</p> : null}
      </article>

      <article className="card">
        <h3>Purchase orders</h3>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>PO</th><th>Vendor</th><th>Status</th><th>Received</th><th>Invoice</th><th>Costs</th><th></th></tr></thead>
            <tbody>
              {purchaseOrders.map((order) => (
                <tr key={order.id} className={order.isArchived ? 'muted' : undefined}>
                  <td>{order.purchaseOrderNumber}{order.isArchived ? ' (archived)' : ''}</td>
                  <td>{order.vendorName}</td>
                  <td>{purchaseOrderStatusLabels[order.status]}</td>
                  <td>{quantityFormatter.format(order.quantityReceived)} / {quantityFormatter.format(order.quantityOrdered)}</td>
                  <td>{order.vendorInvoiceNumber || 'No invoice'} · {invoiceStatusLabels[order.invoiceStatus]}</td>
                  <td>{currencyFormatter.format(order.orderedSubtotal)} + {currencyFormatter.format(order.landedCostTotal)} landed</td>
                  <td><button type="button" onClick={() => loadOrder(order.id)}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {selectedOrder ? (
        <article className="card">
          <h3>Review {selectedOrder.purchaseOrderNumber}</h3>
          <p><strong>{selectedOrder.vendorName}</strong> · {purchaseOrderStatusLabels[selectedOrder.status]} · Invoice {invoiceStatusLabels[selectedOrder.invoiceStatus]}</p>
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
            {selectedOrder.status === 1 ? <button type="button" onClick={submitOrder}>Submit PO</button> : null}
            {selectedOrder.status !== 1 && selectedOrder.status !== 7 ? <button type="button" onClick={submitReceive}>Save receiving</button> : null}
            <button type="button" onClick={archiveSelected}>{selectedOrder.isArchived ? 'Unarchive' : 'Archive'}</button>
          </div>

          <form className="form-grid" onSubmit={submitInvoice}>
            <h4>Vendor invoice and landed costs</h4>
            <label>Vendor invoice #
              <input aria-label="Vendor invoice number" value={invoiceForm.vendorInvoiceNumber} onChange={(event) => setInvoiceForm({ ...invoiceForm, vendorInvoiceNumber: event.target.value })} />
            </label>
            <label>Invoice date
              <input aria-label="Vendor invoice date" type="date" value={invoiceForm.vendorInvoiceDateUtc} onChange={(event) => setInvoiceForm({ ...invoiceForm, vendorInvoiceDateUtc: event.target.value })} />
            </label>
            <label>Invoice status
              <select aria-label="Vendor invoice status" value={invoiceForm.invoiceStatus} onChange={(event) => setInvoiceForm({ ...invoiceForm, invoiceStatus: event.target.value })}>
                {Object.entries(invoiceStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>Freight
              <input aria-label="Freight cost" type="number" min="0" step="0.01" value={invoiceForm.freightCost} onChange={(event) => setInvoiceForm({ ...invoiceForm, freightCost: event.target.value })} />
            </label>
            <label>Tax
              <input aria-label="Tax amount" type="number" min="0" step="0.01" value={invoiceForm.taxAmount} onChange={(event) => setInvoiceForm({ ...invoiceForm, taxAmount: event.target.value })} />
            </label>
            <label>Other landed cost
              <input aria-label="Other landed cost" type="number" min="0" step="0.01" value={invoiceForm.otherLandedCost} onChange={(event) => setInvoiceForm({ ...invoiceForm, otherLandedCost: event.target.value })} />
            </label>
            <label>Landed-cost notes
              <textarea aria-label="Landed-cost notes" value={invoiceForm.landedCostNotes} onChange={(event) => setInvoiceForm({ ...invoiceForm, landedCostNotes: event.target.value })} />
            </label>
            <button type="submit">Save invoice and landed costs</button>
          </form>
          <p className="muted">Invoice subtotal {currencyFormatter.format(selectedOrder.invoiceSubtotal)} · landed costs {currencyFormatter.format(selectedOrder.landedCostTotal)}</p>
        </article>
      ) : null}

      <article className="card">
        <h3>Reorder candidates from parts master data</h3>
        <p className="muted">Used only as purchasing context; no replenishment automation or recommendation scoring is performed.</p>
        <ul>
          {reorderCandidates.map((part) => <li key={part.id}>{part.partNumber} · {part.name}: {part.statusLabel}, suggested manual order quantity {quantityFormatter.format(part.recommendedReorderQuantity)}</li>)}
        </ul>
      </article>
    </section>
  )
}
