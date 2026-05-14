import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { masterDataApi } from '../../api/masterDataApi'
import { renderWithRouter } from '../../test/renderWithRouter'
import { PurchasingWorkbenchPage } from './PurchasingWorkbenchPage'

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listPartCategories: vi.fn(),
    listParts: vi.fn(),
    listVendors: vi.fn()
  }
}))

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PurchasingWorkbenchPage', () => {
  it('renders reorder-ready purchasing summary from existing part master data', async () => {
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([
      { id: 'cat-a', name: 'Hydraulic', isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([
      { id: 'vendor-a', name: 'Delta Supply', isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listParts).mockResolvedValue([
      {
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
      },
      {
        id: 'part-b',
        partCategoryId: 'cat-a',
        vendorId: 'vendor-a',
        partNumber: 'HOSE-2',
        name: 'Hydraulic Hose',
        unitCost: 25,
        unitPrice: 40,
        quantityOnHand: 2,
        reorderThreshold: 5,
        isArchived: false
      }
    ] as any)

    renderWithRouter(<PurchasingWorkbenchPage />)

    expect(await screen.findByText('Purchasing Workbench')).toBeInTheDocument()
    expect(screen.getByText('Reorder-ready parts')).toBeInTheDocument()
    expect(screen.getByText('Estimated reorder spend')).toBeInTheDocument()
    expect(screen.getByText('SEAL-1 · Seal Kit')).toBeInTheDocument()
    expect(screen.getByText('HOSE-2 · Hydraulic Hose')).toBeInTheDocument()
    expect(screen.getByText(/purchase orders, receiving, vendor invoice tracking, or advanced inventory transactions/i)).toBeInTheDocument()
  })

  it('filters the workbench by vendor and stock status', async () => {
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([
      { id: 'cat-a', name: 'Hydraulic', isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([
      { id: 'vendor-a', name: 'Delta Supply', isArchived: false },
      { id: 'vendor-b', name: 'North Crane Parts', isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listParts).mockResolvedValue([
      {
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
      },
      {
        id: 'part-b',
        partCategoryId: 'cat-a',
        vendorId: 'vendor-b',
        partNumber: 'FILTER-9',
        name: 'Hydraulic Filter',
        unitCost: 5,
        unitPrice: 8,
        quantityOnHand: 6,
        reorderThreshold: 3,
        isArchived: false
      }
    ] as any)

    renderWithRouter(<PurchasingWorkbenchPage />)

    await screen.findByText('FILTER-9 · Hydraulic Filter')

    const user = userEvent.setup()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Vendor' }), 'vendor-a')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Stock status' }), 'out')

    await waitFor(() => {
      const list = screen.getByRole('heading', { name: 'Reorder candidates and stock watch' }).closest('article')
      expect(list).not.toBeNull()
      if (!list) {
        throw new Error('List container not found')
      }
      expect(within(list).getByText('SEAL-1 · Seal Kit')).toBeInTheDocument()
      expect(within(list).queryByText('FILTER-9 · Hydraulic Filter')).not.toBeInTheDocument()
    })
  })
})
