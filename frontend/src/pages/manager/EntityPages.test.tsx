import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { reportsApi } from '../../api/reportsApi'
import { usersApi } from '../../api/usersApi'
import { renderWithRouter } from '../../test/renderWithRouter'
import { CustomersPage, EquipmentPage, PartsPage, ReportsPage, ServiceLocationsPage } from './EntityPages'

vi.mock('../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listAll: vi.fn()
  }
}))

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

vi.mock('../../api/usersApi', () => ({
  usersApi: {
    listAssignableEmployees: vi.fn()
  }
}))

const confirmSpy = vi.spyOn(window, 'confirm')

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  confirmSpy.mockReturnValue(true)
  vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
    { id: 'j2', ticketNumber: 'JT-200', title: 'Gamma invoice summary', status: 7, priority: 2, customerId: 'c1', serviceLocationId: 'loc-1' }
  ] as any)
  vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
    { id: 'cust-bill-1', name: 'Acme Billing', accountNumber: 'BILL', isArchived: false }
  ] as any)
  vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
    { id: 'loc-1', customerId: 'c1', companyName: 'Acme', locationName: 'Plant', addressLine1: '100 Main', city: 'Austin', state: 'TX', postalCode: '78701', country: 'USA', isActive: true, isArchived: false }
  ] as any)
  vi.mocked(masterDataApi.listEquipment).mockResolvedValue([
    { id: 'eq-1', customerId: 'c1', serviceLocationId: 'loc-1', name: 'Pump', equipmentNumber: 'EQ-1', isArchived: false }
  ] as any)
  vi.mocked(usersApi.listAssignableEmployees).mockResolvedValue([
    { id: 'emp-1', firstName: 'Casey', lastName: 'Tech' }
  ])
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

  it('saves customer contact and account details from the expanded form', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.createCustomer).mockResolvedValue({ id: 'c-new', name: 'Acme' } as any)

    render(<CustomersPage />)
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText('Account number'), { target: { value: 'AC-100' } })
    fireEvent.change(screen.getByLabelText('Contact name'), { target: { value: 'Alex Manager' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } })
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '555-0100' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Customer' }))

    await waitFor(() => expect(masterDataApi.createCustomer).toHaveBeenCalledWith({
      name: 'Acme',
      accountNumber: 'AC-100',
      contactName: 'Alex Manager',
      email: 'alex@example.com',
      phone: '555-0100'
    }))
  })

  it('lets managers cancel customer edits and return to create mode', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme', accountNumber: 'AC-1', isArchived: false }] as any)

    render(<CustomersPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))

    expect(screen.getByText('Editing customer. Save changes or cancel to create a new customer.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Customer' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel customer edit' }))

    expect(screen.getByRole('button', { name: 'Create Customer' })).toBeInTheDocument()
    expect(screen.queryByText('Editing customer. Save changes or cancel to create a new customer.')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(masterDataApi.updateCustomer).not.toHaveBeenCalled()
  })

  it('validates whitespace-only customer names before create', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)

    render(<CustomersPage />)
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Customer' }))

    expect(await screen.findByText('Customer name is required.')).toBeInTheDocument()
    expect(masterDataApi.createCustomer).not.toHaveBeenCalled()
  })

  it('filters customers by search/status, resets filters, and shows no-match state', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c1', name: 'Acme', contactName: 'Alex', email: 'alex@example.com', isArchived: false },
      { id: 'c2', name: 'Beta', contactName: 'Bea', email: 'bea@example.com', isArchived: true }
    ] as any)

    const { container } = render(<CustomersPage />)
    expect(await screen.findByText(/Acme/)).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 loaded customers.')).toBeInTheDocument()
    expect(screen.getByText('1 active / 1 archived visible.')).toBeInTheDocument()
    expect(screen.getByText('Counts reflect currently loaded records only.')).toBeInTheDocument()
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

  it('creates service locations with customer, address, and active status fields', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.createServiceLocation).mockResolvedValue({ id: 'l-new', locationName: 'HQ' } as any)

    const { container } = render(<ServiceLocationsPage />)
    fireEvent.change(await screen.findByPlaceholderText('Company'), { target: { value: 'Acme Crane' } })
    fireEvent.change(screen.getByPlaceholderText('Location Name'), { target: { value: 'North Yard' } })
    fireEvent.change(screen.getByPlaceholderText('Address'), { target: { value: '100 Main St' } })
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Tulsa' } })
    fireEvent.change(screen.getByPlaceholderText('State'), { target: { value: 'OK' } })
    fireEvent.change(screen.getByPlaceholderText('Postal'), { target: { value: '74101' } })
    fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'USA' } })
    fireEvent.change(container.querySelector('form select')!, { target: { value: 'c1' } })
    fireEvent.click(screen.getByLabelText('Active'))
    fireEvent.click(screen.getByRole('button', { name: 'Create Location' }))

    await waitFor(() => expect(masterDataApi.createServiceLocation).toHaveBeenCalledWith({
      companyName: 'Acme Crane',
      locationName: 'North Yard',
      addressLine1: '100 Main St',
      city: 'Tulsa',
      state: 'OK',
      postalCode: '74101',
      country: 'USA',
      customerId: 'c1',
      isActive: false
    }))
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

it('validates whitespace-only service-location fields before create', async () => {
  vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
  vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)

  render(<ServiceLocationsPage />)
  fireEvent.change(await screen.findByPlaceholderText('Company'), { target: { value: '   ' } })
  fireEvent.change(screen.getByPlaceholderText('Location Name'), { target: { value: 'North Yard' } })
  fireEvent.change(screen.getByPlaceholderText('Address'), { target: { value: '100 Main St' } })
  fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Tulsa' } })
  fireEvent.change(screen.getByPlaceholderText('State'), { target: { value: 'OK' } })
  fireEvent.change(screen.getByPlaceholderText('Postal'), { target: { value: '74101' } })
  fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'US' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create Location' }))

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

  it('creates equipment with ownership, billing, model, serial, type, and year details', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }, { id: 'c2', name: 'Billing Co' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 'l1', customerId: 'c1', locationName: 'HQ' }] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.createEquipment).mockResolvedValue({ id: 'e-new', name: 'Pump' } as any)

    render(<EquipmentPage />)
    fireEvent.change(await screen.findByLabelText('Primary customer'), { target: { value: 'c1' } })
    fireEvent.change(screen.getByLabelText('Service location'), { target: { value: 'l1' } })
    fireEvent.change(screen.getByLabelText('Owner customer'), { target: { value: 'c1' } })
    fireEvent.change(screen.getByLabelText('Billing customer'), { target: { value: 'c2' } })
    fireEvent.change(screen.getByLabelText('Equipment name'), { target: { value: 'Pump' } })
    fireEvent.change(screen.getByLabelText('Equipment number'), { target: { value: 'EQ-9' } })
    fireEvent.change(screen.getByLabelText('Unit number'), { target: { value: 'Unit 4' } })
    fireEvent.change(screen.getByLabelText('Manufacturer'), { target: { value: 'CraneCo' } })
    fireEvent.change(screen.getByLabelText('Model number'), { target: { value: 'M-200' } })
    fireEvent.change(screen.getByLabelText('Serial number'), { target: { value: 'SN-200' } })
    fireEvent.change(screen.getByLabelText('Equipment type'), { target: { value: 'Hydraulic' } })
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2024' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Equipment' }))

    await waitFor(() => expect(masterDataApi.createEquipment).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'c1',
      serviceLocationId: 'l1',
      ownerCustomerId: 'c1',
      responsibleBillingCustomerId: 'c2',
      name: 'Pump',
      equipmentNumber: 'EQ-9',
      unitNumber: 'Unit 4',
      manufacturer: 'CraneCo',
      modelNumber: 'M-200',
      serialNumber: 'SN-200',
      equipmentType: 'Hydraulic',
      year: 2024
    })))
  })

  it('validates whitespace-only equipment names before create', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 'l1', customerId: 'c1', locationName: 'HQ' }] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)

    render(<EquipmentPage />)
    fireEvent.change(await screen.findByLabelText('Primary customer'), { target: { value: 'c1' } })
    fireEvent.change(screen.getByLabelText('Service location'), { target: { value: 'l1' } })
    fireEvent.change(screen.getByLabelText('Equipment name'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Equipment' }))

    expect(await screen.findByText('Customer, location, and equipment name are required.')).toBeInTheDocument()
    expect(masterDataApi.createEquipment).not.toHaveBeenCalled()
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

  it('validates whitespace-only part required fields before create', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Category A', isArchived: false }] as any)

    render(<PartsPage />)
    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    fireEvent.change(await within(partsCard).findByLabelText('Part category'), { target: { value: 'pc1' } })
    fireEvent.change(within(partsCard).getByLabelText('Part number'), { target: { value: '   ' } })
    fireEvent.change(within(partsCard).getByLabelText('Name'), { target: { value: 'Filter' } })
    fireEvent.click(within(partsCard).getByRole('button', { name: 'Create Part' }))

    expect(await screen.findByText('Category, part number, and name are required.')).toBeInTheDocument()
    expect(masterDataApi.createPart).not.toHaveBeenCalled()
  })

  it('validates whitespace-only vendor and category names before create', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([] as any)

    render(<PartsPage />)

    const vendorsCard = screen.getByRole('heading', { name: 'Vendors' }).closest('article')!
    fireEvent.change(await within(vendorsCard).findByLabelText('Vendor name'), { target: { value: '   ' } })
    fireEvent.click(within(vendorsCard).getByRole('button', { name: 'Create Vendor' }))

    expect(await screen.findByText('Vendor name is required.')).toBeInTheDocument()
    expect(masterDataApi.createVendor).not.toHaveBeenCalled()

    const categoriesCard = screen.getByRole('heading', { name: 'Part Categories' }).closest('article')!
    fireEvent.change(within(categoriesCard).getByLabelText('Category name'), { target: { value: '   ' } })
    fireEvent.click(within(categoriesCard).getByRole('button', { name: 'Create Category' }))

    expect(await screen.findByText('Part category name is required.')).toBeInTheDocument()
    expect(masterDataApi.createPartCategory).not.toHaveBeenCalled()
  })

  it('saves expanded part, vendor, and category form fields', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: false }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Category A', isArchived: false }] as any)
    vi.mocked(masterDataApi.createPart).mockResolvedValue({ id: 'p-new', partNumber: 'PN-9', name: 'Filter' } as any)
    vi.mocked(masterDataApi.createVendor).mockResolvedValue({ id: 'v-new', name: 'Vendor B' } as any)
    vi.mocked(masterDataApi.createPartCategory).mockResolvedValue({ id: 'pc-new', name: 'Hydraulics' } as any)

    render(<PartsPage />)

    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    fireEvent.change(await within(partsCard).findByLabelText('Part number'), { target: { value: 'PN-9' } })
    fireEvent.change(within(partsCard).getByLabelText('Name'), { target: { value: 'Filter' } })
    fireEvent.change(within(partsCard).getByLabelText('Description'), { target: { value: 'Hydraulic filter' } })
    fireEvent.change(within(partsCard).getByLabelText('Part category'), { target: { value: 'pc1' } })
    fireEvent.change(within(partsCard).getByLabelText('Preferred vendor'), { target: { value: 'v1' } })
    fireEvent.change(within(partsCard).getByLabelText('Unit cost'), { target: { value: '12.5' } })
    fireEvent.change(within(partsCard).getByLabelText('Billable price'), { target: { value: '25' } })
    fireEvent.change(within(partsCard).getByLabelText('Quantity on hand'), { target: { value: '7' } })
    fireEvent.change(within(partsCard).getByLabelText('Reorder threshold'), { target: { value: '2' } })
    fireEvent.click(within(partsCard).getByRole('button', { name: 'Create Part' }))

    await waitFor(() => expect(masterDataApi.createPart).toHaveBeenCalledWith({
      partCategoryId: 'pc1',
      vendorId: 'v1',
      partNumber: 'PN-9',
      name: 'Filter',
      description: 'Hydraulic filter',
      unitCost: 12.5,
      unitPrice: 25,
      quantityOnHand: 7,
      reorderThreshold: 2
    }))

    const vendorsCard = screen.getByRole('heading', { name: 'Vendors' }).closest('article')!
    fireEvent.change(within(vendorsCard).getByLabelText('Vendor name'), { target: { value: 'Vendor B' } })
    fireEvent.change(within(vendorsCard).getByLabelText('Account number'), { target: { value: 'VB-1' } })
    fireEvent.change(within(vendorsCard).getByLabelText('Contact name'), { target: { value: 'Vera Vendor' } })
    fireEvent.change(within(vendorsCard).getByLabelText('Email'), { target: { value: 'vera@example.com' } })
    fireEvent.change(within(vendorsCard).getByLabelText('Phone'), { target: { value: '555-0200' } })
    fireEvent.click(within(vendorsCard).getByRole('button', { name: 'Create Vendor' }))

    await waitFor(() => expect(masterDataApi.createVendor).toHaveBeenCalledWith({
      name: 'Vendor B',
      accountNumber: 'VB-1',
      contactName: 'Vera Vendor',
      email: 'vera@example.com',
      phone: '555-0200'
    }))

    const categoriesCard = screen.getByRole('heading', { name: 'Part Categories' }).closest('article')!
    fireEvent.change(within(categoriesCard).getByLabelText('Category name'), { target: { value: 'Hydraulics' } })
    fireEvent.change(within(categoriesCard).getByLabelText('Description'), { target: { value: 'Hydraulic service parts' } })
    fireEvent.click(within(categoriesCard).getByRole('button', { name: 'Create Category' }))

    await waitFor(() => expect(masterDataApi.createPartCategory).toHaveBeenCalledWith({
      name: 'Hydraulics',
      description: 'Hydraulic service parts'
    }))
  })

  it('lets managers cancel part, vendor, and category edits independently', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([{ id: 'p1', partCategoryId: 'pc1', vendorId: 'v1', partNumber: 'PN-1', name: 'Filter', unitCost: 1, unitPrice: 2, quantityOnHand: 3, reorderThreshold: 1, isArchived: false }] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', accountNumber: 'VA-1', isArchived: false }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Filters', description: 'Filter parts', isArchived: false }] as any)

    render(<PartsPage />)

    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    const vendorsCard = screen.getByRole('heading', { name: 'Vendors' }).closest('article')!
    const categoriesCard = screen.getByRole('heading', { name: 'Part Categories' }).closest('article')!

    fireEvent.click(await within(partsCard).findByRole('button', { name: 'Edit' }))
    expect(within(partsCard).getByText('Editing part. Save changes or cancel to create a new part.')).toBeInTheDocument()
    fireEvent.click(within(partsCard).getByRole('button', { name: 'Cancel part edit' }))
    expect(within(partsCard).getByRole('button', { name: 'Create Part' })).toBeInTheDocument()
    expect(within(partsCard).queryByText('Editing part. Save changes or cancel to create a new part.')).not.toBeInTheDocument()

    fireEvent.click(within(vendorsCard).getByRole('button', { name: 'Edit' }))
    expect(within(vendorsCard).getByText('Editing vendor. Save changes or cancel to create a new vendor.')).toBeInTheDocument()
    fireEvent.click(within(vendorsCard).getByRole('button', { name: 'Cancel vendor edit' }))
    expect(within(vendorsCard).getByRole('button', { name: 'Create Vendor' })).toBeInTheDocument()
    expect(within(vendorsCard).queryByText('Editing vendor. Save changes or cancel to create a new vendor.')).not.toBeInTheDocument()

    fireEvent.click(within(categoriesCard).getByRole('button', { name: 'Edit' }))
    expect(within(categoriesCard).getByText('Editing part category. Save changes or cancel to create a new part category.')).toBeInTheDocument()
    fireEvent.click(within(categoriesCard).getByRole('button', { name: 'Cancel category edit' }))
    expect(within(categoriesCard).getByRole('button', { name: 'Create Category' })).toBeInTheDocument()
    expect(within(categoriesCard).queryByText('Editing part category. Save changes or cancel to create a new part category.')).not.toBeInTheDocument()

    expect(masterDataApi.updatePart).not.toHaveBeenCalled()
    expect(masterDataApi.updateVendor).not.toHaveBeenCalled()
    expect(masterDataApi.updatePartCategory).not.toHaveBeenCalled()
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
  const renderReports = () => renderWithRouter(<ReportsPage />)

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
    expect(screen.getByText(/Labor totals are labeled as time-entry labor-rate snapshot values/i)).toBeInTheDocument()
  })

  it('applies supported filters, renders jobs ready to invoice rows, and exports escaped CSV', async () => {
    vi.mocked(reportsApi.getJobsReadyToInvoice).mockResolvedValue([{ jobTicketId: 'j1', jobTicketNumber: 'JT-100', customer: 'Acme, "North"\nRegion', billingPartyCustomer: 'Acme Billing', jobStatus: 7, invoiceStatus: 2, approvedLaborHours: 2.5, approvedPartsCount: 3, estimatedBillableTotal: 120.5, createdAtUtc: '2026-03-31T12:00:00Z', completedAtUtc: '2026-04-01T12:00:00Z' }] as any)
    renderReports()

    const jobsReadyCard = screen.getByLabelText('Jobs Ready to Invoice report')
    await waitFor(() => expect(within(jobsReadyCard).getByLabelText('Jobs Ready to Invoice billing party filter')).not.toBeDisabled())
    fireEvent.click(within(jobsReadyCard).getByText('Optional filters'))
    fireEvent.change(within(jobsReadyCard).getByLabelText('Jobs Ready to Invoice from date filter'), { target: { value: '2026-04-01' } })
    fireEvent.change(within(jobsReadyCard).getByLabelText('Jobs Ready to Invoice billing party filter'), { target: { value: 'cust-bill-1' } })
    fireEvent.change(within(jobsReadyCard).getByLabelText('Jobs Ready to Invoice service location filter'), { target: { value: 'loc-1' } })
    fireEvent.change(within(jobsReadyCard).getByLabelText('Jobs Ready to Invoice invoice status filter'), { target: { value: '2' } })
    fireEvent.click(within(jobsReadyCard).getByRole('button', { name: 'Run Jobs Ready to Invoice' }))

    expect(await screen.findByRole('link', { name: 'JT-100' })).toHaveAttribute('href', '/manage/job-tickets/j1')
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0)
    expect(screen.getByText('$120.50')).toBeInTheDocument()
    expect(reportsApi.getJobsReadyToInvoice).toHaveBeenCalledWith(expect.objectContaining({
      dateFromUtc: '2026-04-01T00:00:00Z',
      billingPartyCustomerId: 'cust-bill-1',
      serviceLocationId: 'loc-1',
      invoiceStatus: 2
    }))

    const csvHref = screen.getByRole('link', { name: 'Export loaded rows as CSV' }).getAttribute('href') ?? ''
    const csv = decodeURIComponent(csvHref.replace('data:text/csv;charset=utf-8,', ''))
    expect(csv).toContain('Job Ticket,Customer,Billing Party')
    expect(csv).toContain('"Acme, ""North""\nRegion"')
  })

  it('shows loading and empty states for labor by employee', async () => {
    let resolveReport: (value: any[]) => void = () => undefined
    vi.mocked(reportsApi.getLaborByEmployee).mockReturnValue(new Promise((resolve) => { resolveReport = resolve }) as any)
    renderReports()

    fireEvent.click(screen.getByRole('button', { name: 'Run Labor by Employee' }))
    expect(await screen.findByText('Loading Labor by Employee...')).toBeInTheDocument()

    resolveReport([])
    expect(await screen.findByText('No rows match the current report and filters. Adjust the filters or selected record, then run the report again.')).toBeInTheDocument()
  })

  it('renders labor by employee success data with snapshot labeling', async () => {
    vi.mocked(reportsApi.getLaborByEmployee).mockResolvedValue([{ employeeId: 'e1', employeeName: 'Casey Tech', approvedLaborHours: 4, laborCostTotal: 80, laborBillableTotal: 160, jobCount: 2 }] as any)
    renderReports()

    fireEvent.click(screen.getByRole('button', { name: 'Run Labor by Employee' }))

    const table = await screen.findByRole('table', { name: 'Labor by Employee results' })
    expect(within(table).getByRole('cell', { name: 'Casey Tech' })).toBeInTheDocument()
    expect(screen.getByText('4 h')).toBeInTheDocument()
    expect(screen.getByText('$160.00')).toBeInTheDocument()
    expect(screen.getByText(/then falls back only for legacy entries without snapshots/i)).toBeInTheDocument()
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

    const invoiceCard = screen.getByLabelText('Invoice-ready Summary report')
    expect(await within(invoiceCard).findByRole('option', { name: 'JT-200 - Gamma invoice summary' })).toBeInTheDocument()
    fireEvent.change(within(invoiceCard).getByLabelText('Invoice-ready Summary job ticket'), { target: { value: 'j2' } })
    fireEvent.click(within(invoiceCard).getByRole('button', { name: 'Run Invoice-ready Summary' }))

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
