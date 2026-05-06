import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
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
    getInvoiceReadySummary: vi.fn(),
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

  it('archives and unarchives customers and surfaces archive failure', async () => {
    vi.mocked(masterDataApi.listCustomers)
      .mockResolvedValueOnce([{ id: 'c1', name: 'Acme', isArchived: false }] as any)
      .mockResolvedValueOnce([{ id: 'c1', name: 'Acme', isArchived: true }] as any)
      .mockResolvedValueOnce([{ id: 'c1', name: 'Acme', isArchived: false }] as any)
      .mockResolvedValueOnce([{ id: 'c2', name: 'Beta', isArchived: false }] as any)
    vi.mocked(masterDataApi.archiveCustomer).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchiveCustomer).mockResolvedValue(undefined as any)

    const view = render(<CustomersPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Archive' }))
    await waitFor(() => expect(masterDataApi.archiveCustomer).toHaveBeenCalledWith('c1'))
    expect(await screen.findByRole('button', { name: 'Unarchive' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }))
    await waitFor(() => expect(masterDataApi.unarchiveCustomer).toHaveBeenCalledWith('c1'))
    expect(await screen.findByRole('button', { name: 'Archive' })).toBeInTheDocument()

    vi.mocked(masterDataApi.archiveCustomer).mockRejectedValueOnce(new Error('failed'))
    view.rerender(<CustomersPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Archive' }))
    expect(await screen.findByText('Unable to update customer archive state.')).toBeInTheDocument()
  })
})

describe('ServiceLocationsPage', () => {
  it('archives and unarchives service locations and surfaces archive failure', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations)
      .mockResolvedValueOnce([{ id: 'l1', companyName: 'Acme', locationName: 'HQ', isActive: true, isArchived: false }] as any)
      .mockResolvedValueOnce([{ id: 'l1', companyName: 'Acme', locationName: 'HQ', isActive: true, isArchived: true }] as any)
      .mockResolvedValueOnce([{ id: 'l1', companyName: 'Acme', locationName: 'HQ', isActive: true, isArchived: false }] as any)
      .mockResolvedValueOnce([{ id: 'l2', companyName: 'Beta', locationName: 'Depot', isActive: true, isArchived: false }] as any)

    vi.mocked(masterDataApi.archiveServiceLocation).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchiveServiceLocation).mockResolvedValue(undefined as any)

    const view = render(<ServiceLocationsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Archive' }))
    await waitFor(() => expect(masterDataApi.archiveServiceLocation).toHaveBeenCalledWith('l1'))
    fireEvent.click(await screen.findByRole('button', { name: 'Unarchive' }))
    await waitFor(() => expect(masterDataApi.unarchiveServiceLocation).toHaveBeenCalledWith('l1'))

    vi.mocked(masterDataApi.archiveServiceLocation).mockRejectedValueOnce(new Error('failed'))
    view.rerender(<ServiceLocationsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Archive' }))
    expect(await screen.findByText('Unable to update service location archive state.')).toBeInTheDocument()
  })
})

describe('EquipmentPage', () => {
  it('archives and unarchives equipment and surfaces unarchive failure', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listEquipment)
      .mockResolvedValueOnce([{ id: 'e1', name: 'Pump', customerId: 'c1', serviceLocationId: 'l1', isArchived: false }] as any)
      .mockResolvedValueOnce([{ id: 'e1', name: 'Pump', customerId: 'c1', serviceLocationId: 'l1', isArchived: true }] as any)
      .mockResolvedValueOnce([{ id: 'e2', name: 'Filter', customerId: 'c2', serviceLocationId: 'l2', isArchived: true }] as any)

    vi.mocked(masterDataApi.archiveEquipment).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchiveEquipment).mockRejectedValueOnce(new Error('bad request'))

    render(<EquipmentPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Archive' }))
    await waitFor(() => expect(masterDataApi.archiveEquipment).toHaveBeenCalledWith('e1'))
    fireEvent.click(await screen.findByRole('button', { name: 'Unarchive' }))
    await waitFor(() => expect(masterDataApi.unarchiveEquipment).toHaveBeenCalledWith('e1'))
    expect(await screen.findByText('Unable to update equipment archive state.')).toBeInTheDocument()
  })
})

describe('PartsPage', () => {
  it('archives and unarchives part/vendor/category and surfaces API errors', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([{ id: 'p1', partNumber: 'PN-1', name: 'Filter', unitCost: 1, unitPrice: 2, isArchived: false }] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: false }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Category A', isArchived: false }] as any)
    vi.mocked(masterDataApi.archivePart).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.archiveVendor).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.archivePartCategory).mockResolvedValue(undefined as any)

    const view = render(<PartsPage />)
    const archiveButtons = await screen.findAllByRole('button', { name: 'Archive' })
    fireEvent.click(archiveButtons[0])
    fireEvent.click(archiveButtons[1])
    fireEvent.click(archiveButtons[2])
    await waitFor(() => expect(masterDataApi.archivePart).toHaveBeenCalledWith('p1'))
    await waitFor(() => expect(masterDataApi.archiveVendor).toHaveBeenCalledWith('v1'))
    await waitFor(() => expect(masterDataApi.archivePartCategory).toHaveBeenCalledWith('pc1'))

    vi.mocked(masterDataApi.listParts).mockResolvedValue([{ id: 'p1', partNumber: 'PN-1', name: 'Filter', unitCost: 1, unitPrice: 2, isArchived: true }] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: true }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Category A', isArchived: true }] as any)
    vi.mocked(masterDataApi.unarchivePart).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchiveVendor).mockResolvedValue(undefined as any)
    vi.mocked(masterDataApi.unarchivePartCategory).mockRejectedValueOnce(new Error('nope'))

    view.unmount()
    render(<PartsPage />)
    const unarchiveButtons = await screen.findAllByRole('button', { name: 'Unarchive' })
    fireEvent.click(unarchiveButtons[0])
    fireEvent.click(unarchiveButtons[1])
    fireEvent.click(unarchiveButtons[2])
    await waitFor(() => expect(masterDataApi.unarchivePart).toHaveBeenCalledWith('p1'))
    await waitFor(() => expect(masterDataApi.unarchiveVendor).toHaveBeenCalled())
    expect(await screen.findByText('Unable to update archive state.')).toBeInTheDocument()
  })
})

describe('ReportsPage', () => {
  const renderReports = () => render(<MemoryRouter><ReportsPage /></MemoryRouter>)

  it('renders the Manager/Admin reports hub and supported report cards', () => {
    renderReports()

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.getByText('Invoice-ready Summary')).toBeInTheDocument()
    expect(screen.getByText('Job Cost Summary')).toBeInTheDocument()
    expect(screen.getByText('Jobs Ready to Invoice')).toBeInTheDocument()
    expect(screen.getByText('Labor by Job')).toBeInTheDocument()
    expect(screen.getByText('Labor by Employee')).toBeInTheDocument()
    expect(screen.getByText('Parts by Job')).toBeInTheDocument()
    expect(screen.getByText('Customer Service History')).toBeInTheDocument()
    expect(screen.getByText('Equipment Service History')).toBeInTheDocument()
    expect(screen.getByText(/Labor totals use time-entry labor-rate snapshots first/i)).toBeInTheDocument()
  })

  it('applies supported filters, renders jobs ready to invoice rows, and exports escaped CSV', async () => {
    vi.mocked(reportsApi.getJobsReadyToInvoice).mockResolvedValue([{ jobTicketId: 'j1', jobTicketNumber: 'JT-100', customer: 'Acme, "North"\nRegion', billingPartyCustomer: 'Acme Billing', jobStatus: 7, invoiceStatus: 2, approvedLaborHours: 2.5, approvedPartsCount: 3, estimatedBillableTotal: 120.5, completedAtUtc: '2026-04-01T12:00:00Z' }] as any)
    renderReports()

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-04-01' } })
    fireEvent.change(screen.getByLabelText('Billing customer id'), { target: { value: 'cust-bill-1' } })
    fireEvent.change(screen.getByLabelText('Service location id'), { target: { value: 'loc-1' } })
    fireEvent.change(screen.getByLabelText('Invoice status'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run Jobs Ready to Invoice' }))

    expect(await screen.findByRole('link', { name: 'JT-100' })).toHaveAttribute('href', '/manage/job-tickets/j1')
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0)
    expect(screen.getByText('$120.50')).toBeInTheDocument()
    expect(reportsApi.getJobsReadyToInvoice).toHaveBeenCalledWith(expect.objectContaining({
      dateFromUtc: '2026-04-01T00:00:00Z',
      billingPartyCustomerId: 'cust-bill-1',
      serviceLocationId: 'loc-1',
      invoiceStatus: 2
    }))

    const csvHref = screen.getByRole('link', { name: 'Export CSV' }).getAttribute('href') ?? ''
    const csv = decodeURIComponent(csvHref.replace('data:text/csv;charset=utf-8,', ''))
    expect(csv).toContain('Job Ticket,Customer,Billing Party')
    expect(csv).toContain('"Acme, ""North""\nRegion"')
  })

  it('shows loading and empty states for labor by employee', async () => {
    let resolveReport: (value: any[]) => void = () => undefined
    vi.mocked(reportsApi.getLaborByEmployee).mockReturnValue(new Promise((resolve) => { resolveReport = resolve }) as any)
    renderReports()

    fireEvent.click(screen.getByRole('button', { name: 'Run Labor by Employee' }))
    expect(await screen.findByText('Loading Labor by Employee…')).toBeInTheDocument()

    resolveReport([])
    expect(await screen.findByText('No rows match the current report and filters.')).toBeInTheDocument()
  })

  it('renders labor by employee success data with snapshot labeling', async () => {
    vi.mocked(reportsApi.getLaborByEmployee).mockResolvedValue([{ employeeId: 'e1', employeeName: 'Casey Tech', approvedLaborHours: 4, laborCostTotal: 80, laborBillableTotal: 160, jobCount: 2 }] as any)
    renderReports()

    fireEvent.click(screen.getByRole('button', { name: 'Run Labor by Employee' }))

    expect(await screen.findByText('Casey Tech')).toBeInTheDocument()
    expect(screen.getByText('4 h')).toBeInTheDocument()
    expect(screen.getByText('$160.00')).toBeInTheDocument()
    expect(screen.getByText(/Legacy entries with null snapshots fall back/i)).toBeInTheDocument()
  })

  it('renders parts by job rows with job detail drill-in', async () => {
    vi.mocked(reportsApi.getPartsByJob).mockResolvedValue([{ jobTicketId: 'job-parts-1', jobTicketNumber: 'JT-PARTS', customer: 'Beta', approvedPartQuantity: 2, partsCostTotal: 10, partsBillableTotal: 25 }] as any)
    renderReports()

    fireEvent.click(screen.getByRole('button', { name: 'Run Parts by Job' }))

    expect(await screen.findByRole('link', { name: 'JT-PARTS' })).toHaveAttribute('href', '/manage/job-tickets/job-parts-1')
    expect(screen.getByText('$25.00')).toBeInTheDocument()
  })

  it('runs invoice-ready summary by job ticket id', async () => {
    vi.mocked(reportsApi.getInvoiceReadySummary).mockResolvedValue({ jobTicketId: 'j2', jobTicketNumber: 'JT-200', customer: 'Gamma', billingPartyCustomer: 'Gamma AP', serviceLocation: 'Plant', equipment: 'Pump', jobStatus: 7, invoiceStatus: 1, workDescriptions: [], approvedLaborEntries: [], approvedParts: [], laborHours: 1, laborCostTotal: 40, laborBillableTotal: 95, partsCostTotal: 10, partsBillableTotal: 20, miscCharges: 0, tax: 2, grandTotal: 117 } as any)
    renderReports()

    fireEvent.change(screen.getByLabelText('Job ticket id'), { target: { value: 'j2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run Invoice-ready Summary' }))

    expect(await screen.findByRole('link', { name: 'JT-200' })).toBeInTheDocument()
    expect(reportsApi.getInvoiceReadySummary).toHaveBeenCalledWith('j2')
    expect(screen.getByText('$117.00')).toBeInTheDocument()
  })

  it('surfaces user-friendly report failures', async () => {
    vi.mocked(reportsApi.getPartsByJob).mockRejectedValue(new ApiError('Forbidden', 403))
    renderReports()

    fireEvent.click(screen.getByRole('button', { name: 'Run Parts by Job' }))

    expect(await screen.findByText('You do not have permission to run manager reports.')).toBeInTheDocument()
  })
})
