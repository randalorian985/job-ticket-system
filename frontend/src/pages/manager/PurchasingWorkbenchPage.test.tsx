import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { masterDataApi } from '../../api/masterDataApi'
import { purchasingApi } from '../../api/purchasingApi'
import { renderWithRouter } from '../../test/renderWithRouter'
import { PurchasingWorkbenchPage } from './PurchasingWorkbenchPage'

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listParts: vi.fn(),
    listVendors: vi.fn()
  }
}))

vi.mock('../../api/purchasingApi', () => ({
  purchasingApi: {
    archivePurchaseOrder: vi.fn(),
    createPurchaseOrder: vi.fn(),
    getPurchaseOrder: vi.fn(),
    listPurchaseOrders: vi.fn(),
    receivePurchaseOrder: vi.fn(),
    submitPurchaseOrder: vi.fn(),
    unarchivePurchaseOrder: vi.fn(),
    updatePurchaseOrder: vi.fn()
  }
}))

const part = {
  id: 'part-a',
  partCategoryId: 'cat-a',
  vendorId: 'vendor-a',
  partNumber: 'SEAL-1',
  name: 'Seal Kit',
  unitCost: 12,
  unitPrice: 20,
  quantityOnHand: 0,
  reorderThreshold: 4,
  isArchived: false
}

const purchaseOrder = {
  id: 'po-a',
  purchaseOrderNumber: 'PO-1001',
  vendorId: 'vendor-a',
  vendorName: 'Delta Supply',
  status: 2,
  orderedAtUtc: '2026-05-01T00:00:00.000Z',
  expectedAtUtc: '2026-05-10T00:00:00.000Z',
  receivedAtUtc: null,
  vendorInvoiceNumber: null,
  vendorInvoiceDateUtc: null,
  invoiceStatus: 1,
  invoiceSubtotal: 48,
  freightCost: 0,
  taxAmount: 0,
  otherLandedCost: 0,
  landedCostTotal: 0,
  landedCostNotes: null,
  notes: null,
  isArchived: false,
  lines: [{
    id: 'line-a',
    purchaseOrderId: 'po-a',
    partId: 'part-a',
    partNumber: 'SEAL-1',
    partName: 'Seal Kit',
    quantityOrdered: 4,
    quantityReceived: 0,
    unitCost: 12,
    lineSubtotal: 48,
    notes: null,
    isArchived: false
  }]
}

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'vendor-a', name: 'Delta Supply', isArchived: false }] as any)
  vi.mocked(masterDataApi.listParts).mockResolvedValue([part] as any)
  vi.mocked(purchasingApi.listPurchaseOrders).mockResolvedValue([{ ...purchaseOrder, orderedSubtotal: 48, quantityOrdered: 4, quantityReceived: 0 }] as any)
  vi.mocked(purchasingApi.getPurchaseOrder).mockResolvedValue(purchaseOrder as any)
})

describe('PurchasingWorkbenchPage', () => {
  it('renders purchase order workflow and reorder context without inventory automation language', async () => {
    renderWithRouter(<PurchasingWorkbenchPage />)

    expect(await screen.findByText('Purchasing Workbench')).toBeInTheDocument()
    expect(screen.getByText(/purchase orders, receiving, vendor invoice tracking, and landed-cost recording/i)).toBeInTheDocument()
    expect(screen.getByText('PO-1001')).toBeInTheDocument()
    expect(screen.getByText(/replenishment automation or recommendation scoring/i)).toBeInTheDocument()
    expect(screen.getByText(/SEAL-1 · Seal Kit: Out of stock/i)).toBeInTheDocument()
  })

  it('creates a purchase order from selected vendor and part fields', async () => {
    vi.mocked(purchasingApi.createPurchaseOrder).mockResolvedValue(purchaseOrder as any)
    const user = userEvent.setup()
    renderWithRouter(<PurchasingWorkbenchPage />)

    await screen.findByText('PO-1001')
    await user.clear(screen.getByRole('spinbutton', { name: 'Quantity ordered' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Quantity ordered' }), '6')
    await user.click(screen.getByRole('button', { name: 'Create purchase order' }))

    await waitFor(() => expect(purchasingApi.createPurchaseOrder).toHaveBeenCalledWith(expect.objectContaining({
      vendorId: 'vendor-a',
      lines: [expect.objectContaining({ partId: 'part-a', quantityOrdered: 6, unitCost: 12 })]
    })))
  })

  it('reviews a purchase order and saves receiving plus invoice landed costs', async () => {
    vi.mocked(purchasingApi.receivePurchaseOrder).mockResolvedValue({ ...purchaseOrder, status: 4 } as any)
    vi.mocked(purchasingApi.updatePurchaseOrder).mockResolvedValue({ ...purchaseOrder, vendorInvoiceNumber: 'INV-77' } as any)
    const user = userEvent.setup()
    renderWithRouter(<PurchasingWorkbenchPage />)

    await user.click(await screen.findByRole('button', { name: 'Review' }))
    const review = screen.getByRole('heading', { name: 'Review PO-1001' }).closest('article')
    expect(review).not.toBeNull()
    if (!review) throw new Error('Review article not found')

    await user.clear(within(review).getByRole('spinbutton', { name: 'Received quantity for SEAL-1' }))
    await user.type(within(review).getByRole('spinbutton', { name: 'Received quantity for SEAL-1' }), '4')
    await user.click(within(review).getByRole('button', { name: 'Save receiving' }))

    await waitFor(() => expect(purchasingApi.receivePurchaseOrder).toHaveBeenCalledWith('po-a', expect.objectContaining({
      lines: [{ lineId: 'line-a', receivedQuantity: 4 }]
    })))

    await user.type(within(review).getByRole('textbox', { name: 'Vendor invoice number' }), 'INV-77')
    await user.clear(within(review).getByRole('spinbutton', { name: 'Freight cost' }))
    await user.type(within(review).getByRole('spinbutton', { name: 'Freight cost' }), '7')
    await user.click(within(review).getByRole('button', { name: 'Save invoice and landed costs' }))

    await waitFor(() => expect(purchasingApi.updatePurchaseOrder).toHaveBeenCalledWith('po-a', expect.objectContaining({
      purchaseOrderNumber: 'PO-1001',
      vendorInvoiceNumber: 'INV-77',
      freightCost: 7,
      lines: [expect.objectContaining({ partId: 'part-a' })]
    })))
  })

  it('keeps archived purchase orders reviewable and supports unarchive from detail', async () => {
    vi.mocked(purchasingApi.listPurchaseOrders).mockResolvedValue([{
      ...purchaseOrder,
      isArchived: true,
      orderedSubtotal: 48,
      quantityOrdered: 4,
      quantityReceived: 0
    }] as any)
    vi.mocked(purchasingApi.getPurchaseOrder).mockResolvedValue({ ...purchaseOrder, isArchived: true } as any)
    vi.mocked(purchasingApi.unarchivePurchaseOrder).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithRouter(<PurchasingWorkbenchPage />)

    expect(await screen.findByText('PO-1001 (archived)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Review' }))
    expect(await screen.findByRole('heading', { name: 'Review PO-1001' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Unarchive' }))

    await waitFor(() => expect(purchasingApi.unarchivePurchaseOrder).toHaveBeenCalledWith('po-a'))
  })
})
