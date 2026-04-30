import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { masterDataApi } from '../../api/masterDataApi'
import { reportsApi } from '../../api/reportsApi'
import { CustomersPage, PartsPage, ReportsPage } from './EntityPages'

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listCustomers: vi.fn(),
    listParts: vi.fn(),
    listVendors: vi.fn(),
    listPartCategories: vi.fn(),
    createVendor: vi.fn(),
    createPartCategory: vi.fn()
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
