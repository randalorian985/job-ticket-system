import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { inventoryApi } from '../../api/inventoryApi'
import { masterDataApi } from '../../api/masterDataApi'
import { renderWithRouter } from '../../test/renderWithRouter'
import { InventoryPage } from './InventoryPage'

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listParts: vi.fn()
  }
}))

vi.mock('../../api/inventoryApi', () => ({
  inventoryApi: {
    archiveStockLocation: vi.fn(),
    createManualAdjustment: vi.fn(),
    createStockLocation: vi.fn(),
    listStockLocations: vi.fn(),
    listStockSummary: vi.fn(),
    listTransactions: vi.fn(),
    unarchiveStockLocation: vi.fn(),
    updateStockLocation: vi.fn()
  }
}))

const stockLocation = {
  id: 'loc-1',
  name: 'Main Warehouse',
  code: 'WH1',
  description: 'Primary warehouse',
  isActive: true,
  isArchived: false
}

const archivedLocation = {
  id: 'loc-2',
  name: 'Overflow Cage',
  code: 'WH2',
  description: null,
  isActive: false,
  isArchived: true
}

const part = {
  id: 'part-1',
  partCategoryId: 'cat-1',
  vendorId: 'vendor-1',
  partNumber: 'BELT-1',
  name: 'Drive Belt',
  unitCost: 15,
  unitPrice: 24,
  quantityOnHand: 6,
  reorderThreshold: 2,
  isArchived: false
}

const stockRow = {
  stockLocationId: 'loc-1',
  stockLocationName: 'Main Warehouse',
  partId: 'part-1',
  partNumber: 'BELT-1',
  partName: 'Drive Belt',
  quantityOnHand: 6,
  lastTransactionAtUtc: '2026-05-26T13:00:00.000Z'
}

const transaction = {
  id: 'txn-1',
  stockLocationId: 'loc-1',
  stockLocationName: 'Main Warehouse',
  partId: 'part-1',
  partNumber: 'BELT-1',
  partName: 'Drive Belt',
  transactionType: 2,
  quantityDelta: 3,
  occurredAtUtc: '2026-05-26T13:15:00.000Z',
  reason: 'Cycle count',
  notes: 'Adjusted after shelf count',
  purchaseOrderNumber: null
}

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.mocked(masterDataApi.listParts).mockResolvedValue([part] as any)
  vi.mocked(inventoryApi.listStockLocations).mockResolvedValue([stockLocation, archivedLocation] as any)
  vi.mocked(inventoryApi.listStockSummary).mockResolvedValue([stockRow] as any)
  vi.mocked(inventoryApi.listTransactions).mockResolvedValue([transaction] as any)
})

describe('InventoryPage', () => {
  it('renders warehouse-first inventory workflow content', async () => {
    renderWithRouter(<InventoryPage />)

    expect(await screen.findByText('Inventory Operations')).toBeInTheDocument()
    expect(screen.getByText(/warehouse-first manager\/admin workflow/i)).toBeInTheDocument()
    expect(screen.getByText(/Deferred: truck inventory, cross-location transfers/i)).toBeInTheDocument()
    expect(screen.getByText('WH1')).toBeInTheDocument()
    expect(screen.getAllByText(/BELT-1 · Drive Belt/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Cycle count')).toBeInTheDocument()
  })

  it('creates a stock location from the form', async () => {
    vi.mocked(inventoryApi.createStockLocation).mockResolvedValue(stockLocation as any)
    const user = userEvent.setup()
    renderWithRouter(<InventoryPage />)

    await screen.findByText('Inventory Operations')

    await user.type(screen.getByRole('textbox', { name: 'Stock location name' }), 'Receiving Rack')
    await user.type(screen.getByRole('textbox', { name: 'Stock location code' }), 'RR1')
    await user.type(screen.getByRole('textbox', { name: 'Stock location description' }), 'Inbound staging')
    await user.click(screen.getByRole('button', { name: 'Create stock location' }))

    await waitFor(() => expect(inventoryApi.createStockLocation).toHaveBeenCalledWith({
      name: 'Receiving Rack',
      code: 'RR1',
      description: 'Inbound staging'
    }))
  })

  it('reviews filtered inventory rows by location and part', async () => {
    const user = userEvent.setup()
    renderWithRouter(<InventoryPage />)

    await screen.findByText('Inventory Operations')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Inventory stock location filter' }), 'loc-1')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Inventory part filter' }), 'part-1')
    await user.click(screen.getByRole('button', { name: 'Review inventory' }))

    await waitFor(() => expect(inventoryApi.listStockSummary).toHaveBeenLastCalledWith({ stockLocationId: 'loc-1', partId: 'part-1' }))
    await waitFor(() => expect(inventoryApi.listTransactions).toHaveBeenLastCalledWith({ stockLocationId: 'loc-1', partId: 'part-1', limit: 50 }))
  })

  it('posts a manual adjustment for the selected part and location', async () => {
    vi.mocked(inventoryApi.createManualAdjustment).mockResolvedValue(transaction as any)
    const user = userEvent.setup()
    renderWithRouter(<InventoryPage />)

    await screen.findByText('Inventory Operations')

    const quantityInput = screen.getByRole('spinbutton', { name: 'Adjustment quantity delta' })
    await user.clear(quantityInput)
    await user.type(quantityInput, '3')
    await user.type(screen.getByRole('textbox', { name: 'Adjustment reason' }), 'Cycle count')
    await user.type(screen.getByRole('textbox', { name: 'Adjustment notes' }), 'Adjusted after shelf count')
    await user.click(screen.getByRole('button', { name: 'Post adjustment' }))

    await waitFor(() => expect(inventoryApi.createManualAdjustment).toHaveBeenCalledWith(expect.objectContaining({
      stockLocationId: 'loc-1',
      partId: 'part-1',
      quantityDelta: 3,
      reason: 'Cycle count',
      notes: 'Adjusted after shelf count'
    })))
  })
})
