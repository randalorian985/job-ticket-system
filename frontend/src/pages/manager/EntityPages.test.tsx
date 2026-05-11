import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    createServiceLocation: vi.fn(),
    updateServiceLocation: vi.fn(),
    createEquipment: vi.fn(),
    updateEquipment: vi.fn(),
    createPart: vi.fn(),
    updatePart: vi.fn(),
    createVendor: vi.fn(),
    updateVendor: vi.fn(),
    createPartCategory: vi.fn(),
    updatePartCategory: vi.fn(),
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
    expect(await screen.findByText(/Acme/)).toBeInTheDocument()
    expect(screen.getByText(/No account/)).toBeInTheDocument()
    expect(screen.getByText('Create Customer')).toBeInTheDocument()
  })


  it('surfaces API validation errors when customer save fails', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.createCustomer).mockRejectedValue(new ApiError('Name is required.', 400))

    render(<CustomersPage />)
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Bad Customer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Customer' }))

    await waitFor(() => expect(masterDataApi.createCustomer).toHaveBeenCalledWith({ name: 'Bad Customer' }))
    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
  })



  it('filters customers by search/status, resets filters, and shows no-match state', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c1', name: 'Acme', contactName: 'Alex', email: 'alex@example.com', isArchived: false },
      { id: 'c2', name: 'Beta', contactName: 'Bea', email: 'bea@example.com', isArchived: true }
    ] as any)

    render(<CustomersPage />)
    expect(await screen.findByText(/Acme/)).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 loaded customers.')).toBeInTheDocument()
    expect(screen.getByText('1 active / 1 archived visible.')).toBeInTheDocument()
    expect(screen.getByText('1 archived record visible.')).toBeInTheDocument()
    expect(screen.getByText(/Counts use currently loaded records only/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search customers'), { target: { value: 'bea' } })
    expect(screen.queryByText(/Acme/)).not.toBeInTheDocument()
    expect(screen.getByText(/Beta/)).toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 2 loaded customers.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } })
    expect(screen.getByText('No customers match the current filters.')).toBeInTheDocument()
    expect(screen.getByText('Showing 0 of 2 loaded customers.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(screen.getByText('Showing 2 of 2 loaded customers.')).toBeInTheDocument()
    expect(screen.getByText(/Acme/)).toBeInTheDocument()
    expect(screen.getByText(/Beta/)).toBeInTheDocument()
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

  it('filters service locations by customer and search', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }, { id: 'c2', name: 'Beta' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 'l1', customerId: 'c1', companyName: 'Acme', locationName: 'HQ', addressLine1: '1 Main', city: 'Tulsa', state: 'OK', postalCode: '74101', country: 'US', isActive: true, isArchived: false },
      { id: 'l2', customerId: 'c2', companyName: 'Beta', locationName: 'Depot', addressLine1: '2 Oak', city: 'Dallas', state: 'TX', postalCode: '75001', country: 'US', isActive: true, isArchived: false }
    ] as any)

    render(<ServiceLocationsPage />)
    expect(await screen.findByText(/HQ/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c2' } })
    expect(screen.queryByText(/HQ/)).not.toBeInTheDocument()
    expect(screen.getByText(/Depot/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search service locations'), { target: { value: 'missing' } })
    expect(screen.getByText('No service locations match the current filters.')).toBeInTheDocument()
  })

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


  it('validates required service-location fields before create', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)

    render(<ServiceLocationsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create Location' }))

    expect(await screen.findByText('All address fields are required.')).toBeInTheDocument()
    expect(masterDataApi.createServiceLocation).not.toHaveBeenCalled()
  })

describe('EquipmentPage', () => {

  it('filters equipment by customer and archived status', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }, { id: 'c2', name: 'Beta' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 'l1', locationName: 'HQ' }, { id: 'l2', locationName: 'Depot' }] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([
      { id: 'e1', name: 'Pump', customerId: 'c1', serviceLocationId: 'l1', isArchived: false },
      { id: 'e2', name: 'Motor', customerId: 'c2', serviceLocationId: 'l2', serialNumber: 'SN-2', isArchived: true }
    ] as any)

    render(<EquipmentPage />)
    expect(await screen.findByText(/Pump/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c2' } })
    expect(screen.queryByText(/Pump/)).not.toBeInTheDocument()
    expect(screen.getByText(/Motor/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } })
    expect(screen.getByText('No equipment records match the current filters.')).toBeInTheDocument()
  })

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

  it('filters parts, vendors, and categories with reset controls', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([
      { id: 'p1', partCategoryId: 'pc1', vendorId: 'v1', partNumber: 'FLT-1', name: 'Filter', description: 'Air filter', unitCost: 1, unitPrice: 2, isArchived: false },
      { id: 'p2', partCategoryId: 'pc2', vendorId: 'v2', partNumber: 'BLT-2', name: 'Belt', description: 'Drive belt', unitCost: 3, unitPrice: 4, isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: false }, { id: 'v2', name: 'Vendor B', isArchived: true }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Filters', isArchived: false }, { id: 'pc2', name: 'Belts', description: 'Drive parts', isArchived: true }] as any)

    render(<PartsPage />)
    expect(await screen.findByText(/FLT-1/)).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 loaded parts.')).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 loaded vendors.')).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 loaded part categories.')).toBeInTheDocument()
    expect(screen.getAllByText('1 active / 1 archived visible.').length).toBeGreaterThanOrEqual(3)
    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    fireEvent.change(within(partsCard).getByLabelText('Category'), { target: { value: 'pc2' } })
    expect(screen.queryByText(/FLT-1/)).not.toBeInTheDocument()
    expect(screen.getByText(/BLT-2/)).toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 2 loaded parts.')).toBeInTheDocument()
    fireEvent.change(within(partsCard).getByLabelText('Vendor'), { target: { value: 'v1' } })
    expect(screen.getByText('No parts match the current filters.')).toBeInTheDocument()
    fireEvent.click(within(partsCard).getByRole('button', { name: 'Reset filters' }))
    expect(screen.getByText('Showing 2 of 2 loaded parts.')).toBeInTheDocument()
    expect(screen.getByText(/FLT-1/)).toBeInTheDocument()

    const vendorsCard = screen.getByRole('heading', { name: 'Vendors' }).closest('article')!
    fireEvent.change(within(vendorsCard).getByLabelText('Search vendors'), { target: { value: 'Vendor B' } })
    expect(within(vendorsCard).queryByText(/Vendor A/)).not.toBeInTheDocument()
    expect(within(vendorsCard).getByText(/Vendor B/)).toBeInTheDocument()

    const categoriesCard = screen.getByRole('heading', { name: 'Part Categories' }).closest('article')!
    fireEvent.change(within(categoriesCard).getByLabelText('Search part categories'), { target: { value: 'Drive' } })
    expect(within(categoriesCard).queryByText(/Filters/)).not.toBeInTheDocument()
    expect(within(categoriesCard).getByText(/Belts/)).toBeInTheDocument()
  })


  it('surfaces part save validation errors from the API', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Category A', isArchived: false }] as any)
    vi.mocked(masterDataApi.createPart).mockRejectedValue(new ApiError('Part number must be unique.', 400))

    render(<PartsPage />)
    fireEvent.change(await screen.findByPlaceholderText('Part Number'), { target: { value: 'PN-1' } })
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Filter' } })
    fireEvent.change(screen.getByDisplayValue('Category'), { target: { value: 'pc1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Part' }))

    expect(await screen.findByText('Part number must be unique.')).toBeInTheDocument()
  })

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
