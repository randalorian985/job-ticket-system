import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { masterDataApi } from '../../api/masterDataApi'
import { reportsApi } from '../../api/reportsApi'
import { CustomersPage, EquipmentPage, PartsPage, ReportsPage, ServiceLocationsPage } from './EntityPages'

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listCustomers: vi.fn(),
    listParts: vi.fn(),
    listVendors: vi.fn(),
    listPartCategories: vi.fn(),
    createVendor: vi.fn(),
    createPartCategory: vi.fn(),
    listServiceLocations: vi.fn(),
    listEquipment: vi.fn(),
    archiveCustomer: vi.fn(),
    unarchiveCustomer: vi.fn(),
    archiveServiceLocation: vi.fn(),
    unarchiveServiceLocation: vi.fn(),
    archiveEquipment: vi.fn(),
    unarchiveEquipment: vi.fn(),
    archiveVendor: vi.fn(),
    unarchiveVendor: vi.fn(),
    archivePartCategory: vi.fn(),
    unarchivePartCategory: vi.fn(),
    archivePart: vi.fn(),
    unarchivePart: vi.fn()
  }
}))

vi.mock('../../api/reportsApi', () => ({
  reportsApi: {
    getJobsReadyToInvoice: vi.fn(),
    getLaborByJob: vi.fn(),
    getLaborByEmployee: vi.fn(),
    getPartsByJob: vi.fn(),
    getCostSummary: vi.fn(),
    getCustomerHistory: vi.fn(),
    getEquipmentHistory: vi.fn()
  }
}))

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CustomersPage', () => {
  it('renders master-data create/edit workflow shell', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }] as any)
    render(<CustomersPage />)
    expect(await screen.findByText('Acme (No account)')).toBeInTheDocument()
    expect(screen.getByText('Create Customer')).toBeInTheDocument()
  })
})

describe('PartsPage', () => {
  it('renders vendor/category management and submits create', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.createVendor).mockResolvedValue({ id: 'v1', name: 'Vendor A' } as any)
    render(<PartsPage />)
    const input = await screen.findByPlaceholderText('Vendor name')
    fireEvent.change(input, { target: { value: 'Vendor A' } })
    fireEvent.click(screen.getByText('Create Vendor'))
    expect(masterDataApi.createVendor).toHaveBeenCalled()
    expect(screen.getByText('Create Category')).toBeInTheDocument()
  })
})



describe('master-data archive and unarchive interactions', () => {
  it('archives and unarchives customers with refresh and error handling', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValueOnce([{ id: 'c1', name: 'Acme', isArchived: false }] as any).mockResolvedValueOnce([{ id: 'c1', name: 'Acme', isArchived: true }] as any).mockResolvedValueOnce([{ id: 'c1', name: 'Acme', isArchived: false }] as any)
    vi.mocked(masterDataApi.archiveCustomer).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchiveCustomer).mockResolvedValue(undefined as any)
    render(<CustomersPage />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Archive' }))[0])
    await waitFor(() => expect(masterDataApi.archiveCustomer).toHaveBeenCalledWith('c1'))
    expect(await screen.findByRole('button', { name: 'Unarchive' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }))
    await waitFor(() => expect(masterDataApi.unarchiveCustomer).toHaveBeenCalledWith('c1'))

    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c2', name: 'Beta', isArchived: false }] as any)
    vi.mocked(masterDataApi.archiveCustomer).mockRejectedValueOnce(new Error('failed'))
    render(<CustomersPage />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Archive' }))[0])
    expect(await screen.findByText('Unable to update customer archive state.')).toBeInTheDocument()
  })

  it('archives and unarchives service locations with refresh', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 'l1', companyName: 'Acme', locationName: 'HQ', isActive: true, isArchived: false }] as any)
    vi.mocked(masterDataApi.archiveServiceLocation).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchiveServiceLocation).mockResolvedValue(undefined as any)
    render(<ServiceLocationsPage />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Archive' }))[0])
    await waitFor(() => expect(masterDataApi.archiveServiceLocation).toHaveBeenCalledWith('l1'))
  })

  it('archives and unarchives equipment with refresh', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([{ id: 'e1', name: 'Pump', customerId: 'c1', serviceLocationId: 'l1', isArchived: false }] as any)
    vi.mocked(masterDataApi.archiveEquipment).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchiveEquipment).mockResolvedValue(undefined as any)
    render(<EquipmentPage />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Archive' }))[0])
    await waitFor(() => expect(masterDataApi.archiveEquipment).toHaveBeenCalledWith('e1'))
  })

  it('archives and unarchives parts, vendors, and categories', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([{ id: 'p1', partNumber: 'PN-1', name: 'Filter', unitCost: 1, unitPrice: 2, isArchived: false }] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: false }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Category A', isArchived: false }] as any)
    vi.mocked(masterDataApi.archivePart).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.archiveVendor).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.archivePartCategory).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchivePart).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchiveVendor).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchivePartCategory).mockResolvedValue(undefined as any)
    render(<PartsPage />)

    const archiveButtons = await screen.findAllByRole('button', { name: 'Archive' })
    fireEvent.click(archiveButtons[0])
    await waitFor(() => expect(masterDataApi.archivePart).toHaveBeenCalledWith('p1'))
    fireEvent.click(archiveButtons[1])
    await waitFor(() => expect(masterDataApi.archiveVendor).toHaveBeenCalledWith('v1'))
    fireEvent.click(archiveButtons[2])
    await waitFor(() => expect(masterDataApi.archivePartCategory).toHaveBeenCalledWith('pc1'))

    cleanup()
    vi.mocked(masterDataApi.listParts).mockResolvedValue([{ id: 'p1', partNumber: 'PN-1', name: 'Filter', unitCost: 1, unitPrice: 2, isArchived: true }] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: true }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Category A', isArchived: true }] as any)
    render(<PartsPage />)
    const unarchiveButtons = await screen.findAllByRole('button', { name: 'Unarchive' })
    fireEvent.click(unarchiveButtons[0]!)
    await waitFor(() => expect(masterDataApi.unarchivePart).toHaveBeenCalledWith('p1'))
    fireEvent.click(unarchiveButtons[1]!)
    await waitFor(() => expect(masterDataApi.unarchiveVendor).toHaveBeenCalledWith('v1'))
    fireEvent.click(unarchiveButtons[2]!)
    await waitFor(() => expect(masterDataApi.unarchivePartCategory).toHaveBeenCalledWith('pc1'))
  })

  it('shows user-friendly failures for service locations, equipment, and parts master data actions', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 'l1', companyName: 'Acme', locationName: 'HQ', isArchived: false }] as any)
    vi.mocked(masterDataApi.archiveServiceLocation).mockRejectedValueOnce(new Error('failed'))
    render(<ServiceLocationsPage />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Archive' }))[0]!)
    expect(await screen.findByText('Unable to update service location archive state.')).toBeInTheDocument()

    cleanup()
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([{ id: 'e1', name: 'Pump', customerId: 'c1', serviceLocationId: 'l1', isArchived: false }] as any)
    vi.mocked(masterDataApi.archiveEquipment).mockRejectedValueOnce(new Error('failed'))
    render(<EquipmentPage />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Archive' }))[0]!)
    expect(await screen.findByText('Unable to update equipment archive state.')).toBeInTheDocument()

    cleanup()
    vi.mocked(masterDataApi.listParts).mockResolvedValue([{ id: 'p1', partNumber: 'PN-1', name: 'Filter', unitCost: 1, unitPrice: 2, isArchived: true }] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: true }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Category A', isArchived: true }] as any)
    vi.mocked(masterDataApi.unarchivePartCategory).mockRejectedValueOnce(new Error('nope'))
    render(<PartsPage />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Unarchive' }))[2]!)
    expect(await screen.findByText('Unable to update archive state.')).toBeInTheDocument()
  })
})

describe('ReportsPage', () => {
  it('applies extended filters and renders export link', async () => {
    vi.mocked(reportsApi.getJobsReadyToInvoice).mockResolvedValue([{ jobTicketId: 'j1', laborRevenue: 120.5 }] as any)
    render(<ReportsPage />)

    fireEvent.change(screen.getByPlaceholderText('Billing customer id'), { target: { value: 'cust-bill-1' } })
    fireEvent.change(screen.getByPlaceholderText('Service location id'), { target: { value: 'loc-1' } })
    fireEvent.change(screen.getByPlaceholderText('Invoice status #'), { target: { value: '1' } })
    fireEvent.click(screen.getByText('Jobs Ready to Invoice'))

    expect(await screen.findByText('Showing Jobs Ready to Invoice (1 rows)')).toBeInTheDocument()
    expect(reportsApi.getJobsReadyToInvoice).toHaveBeenCalledWith(expect.objectContaining({
      billingPartyCustomerId: 'cust-bill-1',
      serviceLocationId: 'loc-1',
      invoiceStatus: 1
    }))
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
  })

  it('shows labor snapshot fallback label', () => {
    render(<ReportsPage />)
    expect(screen.getAllByText(/Labor totals use time-entry labor-rate snapshots/i).length).toBeGreaterThan(0)
  })
})
