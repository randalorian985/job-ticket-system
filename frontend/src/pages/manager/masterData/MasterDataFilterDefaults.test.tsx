import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { masterDataApi } from '../../../api/masterDataApi'
import { EquipmentPage, PartsPage, ServiceLocationsPage } from './MasterDataPages'

vi.mock('../../../api/masterDataApi', () => ({
  masterDataApi: {
    listCustomers: vi.fn(),
    listServiceLocations: vi.fn(),
    listEquipment: vi.fn(),
    listParts: vi.fn(),
    listVendors: vi.fn(),
    listPartCategories: vi.fn(),
    createServiceLocation: vi.fn(),
    createEquipment: vi.fn(),
    createPart: vi.fn()
  }
}))

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Manager/Admin master-data filter defaults', () => {
  it('prefills blank service-location create forms from the active customer filter', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }, { id: 'c2', name: 'Beta' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.createServiceLocation).mockResolvedValue({ id: 'l-new', locationName: 'East Yard' } as any)

    const { container } = render(<ServiceLocationsPage />)
    fireEvent.change(await screen.findByLabelText('Customer'), { target: { value: 'c2' } })
    fireEvent.change(screen.getByPlaceholderText('Company'), { target: { value: 'Beta Crane' } })
    fireEvent.change(screen.getByPlaceholderText('Location Name'), { target: { value: 'East Yard' } })
    fireEvent.change(screen.getByPlaceholderText('Address'), { target: { value: '200 Main St' } })
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Tulsa' } })
    fireEvent.change(screen.getByPlaceholderText('State'), { target: { value: 'OK' } })
    fireEvent.change(screen.getByPlaceholderText('Postal'), { target: { value: '74101' } })
    fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'USA' } })

    await waitFor(() => expect(container.querySelector('form select')).toHaveValue('c2'))
    fireEvent.click(screen.getByRole('button', { name: 'Create Location' }))

    await waitFor(() => expect(masterDataApi.createServiceLocation).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'c2',
      locationName: 'East Yard'
    })))
  })

  it('preserves the selected service-location record while list filters change in edit mode', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }, { id: 'c2', name: 'Beta' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 'l1', customerId: 'c1', companyName: 'Acme', locationName: 'HQ', addressLine1: '100 Main', city: 'Tulsa', state: 'OK', postalCode: '74101', country: 'USA', isActive: true, isArchived: false },
      { id: 'l2', customerId: 'c2', companyName: 'Beta', locationName: 'Depot', addressLine1: '200 Main', city: 'Tulsa', state: 'OK', postalCode: '74101', country: 'USA', isActive: true, isArchived: false }
    ] as any)

    const { container } = render(<ServiceLocationsPage />)
    fireEvent.click(await screen.findAllByRole('button', { name: 'Edit' }).then((buttons) => buttons[0]))
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c2' } })

    expect(container.querySelector('form select')).toHaveValue('c1')
    expect(screen.getByPlaceholderText('Location Name')).toHaveValue('HQ')
  })

  it('keeps archived customers out of blank service-location create forms but preserves them while editing', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c1', name: 'Acme', isArchived: false },
      { id: 'c-archived', name: 'Archived Customer', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 'l1', customerId: 'c-archived', companyName: 'Archived Customer', locationName: 'Old Yard', addressLine1: '100 Main', city: 'Tulsa', state: 'OK', postalCode: '74101', country: 'USA', isActive: true, isArchived: false }
    ] as any)

    const { container } = render(<ServiceLocationsPage />)
    const serviceLocationCustomerSelect = await waitFor(() => {
      const select = container.querySelector('form select')
      expect(select).not.toBeNull()
      return select as HTMLSelectElement
    })
    expect(within(serviceLocationCustomerSelect).queryByRole('option', { name: 'Archived Customer' })).not.toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))

    expect(serviceLocationCustomerSelect).toHaveValue('c-archived')
    expect(within(serviceLocationCustomerSelect).getByRole('option', { name: 'Archived Customer' })).toBeInTheDocument()
  })

  it('does not prefill blank service-location create forms from archived customer filters', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c1', name: 'Acme', isArchived: false },
      { id: 'c-archived', name: 'Archived Customer', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)

    const { container } = render(<ServiceLocationsPage />)
    fireEvent.change(await screen.findByLabelText('Customer'), { target: { value: 'c-archived' } })

    await waitFor(() => expect(container.querySelector('form select')).toHaveValue(''))
  })

  it('does not seed service-location create buttons from archived customer filters', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c1', name: 'Acme', isArchived: false },
      { id: 'c-archived', name: 'Archived Customer', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 'l1', customerId: 'c1', companyName: 'Acme', locationName: 'HQ', addressLine1: '100 Main', city: 'Tulsa', state: 'OK', postalCode: '74101', country: 'USA', isActive: true, isArchived: false }
    ] as any)

    render(<ServiceLocationsPage />)
    fireEvent.change(await screen.findByLabelText('Customer'), { target: { value: 'c-archived' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Location' }))

    const serviceLocationCustomerSelect = screen.getByLabelText('Related customer')
    expect(serviceLocationCustomerSelect).toHaveValue('')
    expect(within(serviceLocationCustomerSelect).queryByRole('option', { name: 'Archived Customer' })).not.toBeInTheDocument()
  })

  it('prefills blank equipment create forms from the active customer filter', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }, { id: 'c2', name: 'Beta' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 'l2', customerId: 'c2', locationName: 'Depot' }] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.createEquipment).mockResolvedValue({ id: 'e-new', name: 'Motor' } as any)

    render(<EquipmentPage />)
    fireEvent.change(await screen.findByLabelText('Customer'), { target: { value: 'c2' } })
    await waitFor(() => expect(screen.getByLabelText('Primary customer')).toHaveValue('c2'))
    fireEvent.change(screen.getByLabelText('Service location'), { target: { value: 'l2' } })
    fireEvent.change(screen.getByLabelText('Equipment name'), { target: { value: 'Motor' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Equipment' }))

    await waitFor(() => expect(masterDataApi.createEquipment).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'c2',
      serviceLocationId: 'l2',
      name: 'Motor'
    })))
  })

  it('preserves the selected equipment record while list filters change in edit mode', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }, { id: 'c2', name: 'Beta' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 'l1', customerId: 'c1', locationName: 'HQ' }, { id: 'l2', customerId: 'c2', locationName: 'Depot' }] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([
      { id: 'e1', name: 'Pump', customerId: 'c1', serviceLocationId: 'l1', isArchived: false },
      { id: 'e2', name: 'Motor', customerId: 'c2', serviceLocationId: 'l2', isArchived: false }
    ] as any)

    render(<EquipmentPage />)
    fireEvent.click(await screen.findAllByRole('button', { name: 'Edit' }).then((buttons) => buttons[0]))
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c2' } })

    expect(screen.getByLabelText('Primary customer')).toHaveValue('c1')
    expect(screen.getByLabelText('Service location')).toHaveValue('l1')
    expect(screen.getByLabelText('Equipment name')).toHaveValue('Pump')
  })

  it('uses active equipment relationship options for creates and keeps archived selected relationships in edit mode', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c1', name: 'Acme', isArchived: false },
      { id: 'c-archived', name: 'Archived Customer', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 'l1', customerId: 'c1', locationName: 'Acme shop', isArchived: false },
      { id: 'l-archived', customerId: 'c-archived', locationName: 'Old yard', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([
      { id: 'e1', name: 'Pump', customerId: 'c-archived', serviceLocationId: 'l-archived', isArchived: false }
    ] as any)

    render(<EquipmentPage />)
    const equipmentForm = screen.getByRole('form', { name: 'equipment form' })
    const customerSelect = await within(equipmentForm).findByLabelText('Primary customer')
    const locationSelect = within(equipmentForm).getByLabelText('Service location')

    expect(within(customerSelect).queryByRole('option', { name: 'Archived Customer' })).not.toBeInTheDocument()
    fireEvent.change(customerSelect, { target: { value: 'c1' } })
    expect(within(locationSelect).queryByRole('option', { name: 'Old yard' })).not.toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))

    expect(customerSelect).toHaveValue('c-archived')
    expect(locationSelect).toHaveValue('l-archived')
    expect(within(customerSelect).getByRole('option', { name: 'Archived Customer' })).toBeInTheDocument()
    expect(within(locationSelect).getByRole('option', { name: 'Old yard' })).toBeInTheDocument()
  })

  it('does not prefill blank equipment create forms from archived customer filters', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c1', name: 'Acme', isArchived: false },
      { id: 'c-archived', name: 'Archived Customer', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 'l-archived', customerId: 'c-archived', locationName: 'Old yard', isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)

    render(<EquipmentPage />)
    fireEvent.change(await screen.findByLabelText('Customer'), { target: { value: 'c-archived' } })

    await waitFor(() => expect(screen.getByLabelText('Primary customer')).toHaveValue(''))
    expect(screen.getByLabelText('Service location')).toHaveValue('')
  })

  it('does not seed equipment create buttons from archived customer filters', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c1', name: 'Acme', isArchived: false },
      { id: 'c-archived', name: 'Archived Customer', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 'l1', customerId: 'c1', locationName: 'Acme shop', isArchived: false },
      { id: 'l-archived', customerId: 'c-archived', locationName: 'Old yard', isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([
      { id: 'e1', name: 'Pump', customerId: 'c1', serviceLocationId: 'l1', isArchived: false }
    ] as any)

    render(<EquipmentPage />)
    fireEvent.change(await screen.findByLabelText('Customer'), { target: { value: 'c-archived' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Equipment' }))

    const customerSelect = screen.getByLabelText('Primary customer')
    expect(customerSelect).toHaveValue('')
    expect(within(customerSelect).queryByRole('option', { name: 'Archived Customer' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Service location')).toHaveValue('')
  })

  it('prefills blank part create forms from active category and vendor filters', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: false }, { id: 'v2', name: 'Vendor B', isArchived: false }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Filters', isArchived: false }, { id: 'pc2', name: 'Belts', isArchived: false }] as any)
    vi.mocked(masterDataApi.createPart).mockResolvedValue({ id: 'p-new', partNumber: 'BLT-2', name: 'Belt' } as any)

    render(<PartsPage />)
    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    fireEvent.change(await within(partsCard).findByLabelText('Part category filter'), { target: { value: 'pc2' } })
    fireEvent.change(within(partsCard).getByLabelText('Part vendor filter'), { target: { value: 'v2' } })

    await waitFor(() => expect(within(partsCard).getByLabelText('Part category')).toHaveValue('pc2'))
    expect(within(partsCard).getByLabelText('Preferred vendor')).toHaveValue('v2')
    fireEvent.change(within(partsCard).getByLabelText('Part number'), { target: { value: 'BLT-2' } })
    fireEvent.change(within(partsCard).getByLabelText('Name'), { target: { value: 'Belt' } })
    fireEvent.click(within(partsCard).getByRole('button', { name: 'Create Part' }))

    await waitFor(() => expect(masterDataApi.createPart).toHaveBeenCalledWith(expect.objectContaining({
      partCategoryId: 'pc2',
      vendorId: 'v2',
      partNumber: 'BLT-2',
      name: 'Belt'
    })))
  })

  it('preserves the selected part record while list filters change in edit mode', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([
      { id: 'p1', partCategoryId: 'pc1', vendorId: 'v1', partNumber: 'FLT-1', name: 'Filter', unitCost: 1, unitPrice: 2, quantityOnHand: 3, reorderThreshold: 1, isArchived: false },
      { id: 'p2', partCategoryId: 'pc2', vendorId: 'v2', partNumber: 'BLT-2', name: 'Belt', unitCost: 3, unitPrice: 4, quantityOnHand: 5, reorderThreshold: 2, isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: false }, { id: 'v2', name: 'Vendor B', isArchived: false }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Filters', isArchived: false }, { id: 'pc2', name: 'Belts', isArchived: false }] as any)

    render(<PartsPage />)
    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    const filterPartRow = (await within(partsCard).findByText('FLT-1 - Filter')).closest('li')!
    fireEvent.click(within(filterPartRow).getByRole('button', { name: 'Edit' }))
    await waitFor(() => expect(within(partsCard).getByLabelText('Part category')).toHaveValue('pc1'))

    fireEvent.change(within(partsCard).getByLabelText('Part category filter'), { target: { value: 'pc2' } })
    fireEvent.change(within(partsCard).getByLabelText('Part vendor filter'), { target: { value: 'v2' } })

    expect(within(partsCard).getByLabelText('Part category')).toHaveValue('pc1')
    expect(within(partsCard).getByLabelText('Preferred vendor')).toHaveValue('v1')
    expect(within(partsCard).getByLabelText('Part number')).toHaveValue('FLT-1')
  })

  it('uses active part category and vendor options for creates and keeps archived selections in edit mode', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([
      { id: 'p1', partCategoryId: 'pc-archived', vendorId: 'v-archived', partNumber: 'OLD-1', name: 'Old Part', unitCost: 1, unitPrice: 2, quantityOnHand: 3, reorderThreshold: 1, isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([
      { id: 'v1', name: 'Vendor A', isArchived: false },
      { id: 'v-archived', name: 'Archived Vendor', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([
      { id: 'pc1', name: 'Filters', isArchived: false },
      { id: 'pc-archived', name: 'Archived Category', isArchived: true }
    ] as any)

    render(<PartsPage />)
    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    const categorySelect = await within(partsCard).findByLabelText('Part category')
    const vendorSelect = within(partsCard).getByLabelText('Preferred vendor')

    expect(within(categorySelect).queryByRole('option', { name: 'Archived Category' })).not.toBeInTheDocument()
    expect(within(vendorSelect).queryByRole('option', { name: 'Archived Vendor' })).not.toBeInTheDocument()

    fireEvent.click(await within(partsCard).findByRole('button', { name: 'Edit' }))

    expect(categorySelect).toHaveValue('pc-archived')
    expect(vendorSelect).toHaveValue('v-archived')
    expect(within(categorySelect).getByRole('option', { name: 'Archived Category' })).toBeInTheDocument()
    expect(within(vendorSelect).getByRole('option', { name: 'Archived Vendor' })).toBeInTheDocument()
  })

  it('does not prefill blank part create forms from archived category or vendor filters', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([
      { id: 'v1', name: 'Vendor A', isArchived: false },
      { id: 'v-archived', name: 'Archived Vendor', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([
      { id: 'pc1', name: 'Filters', isArchived: false },
      { id: 'pc-archived', name: 'Archived Category', isArchived: true }
    ] as any)

    render(<PartsPage />)
    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    fireEvent.change(await within(partsCard).findByLabelText('Part category filter'), { target: { value: 'pc-archived' } })
    fireEvent.change(within(partsCard).getByLabelText('Part vendor filter'), { target: { value: 'v-archived' } })

    await waitFor(() => expect(within(partsCard).getByLabelText('Part category')).toHaveValue(''))
    expect(within(partsCard).getByLabelText('Preferred vendor')).toHaveValue('')
  })

  it('does not seed part create buttons from archived category or vendor filters', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([
      { id: 'p1', partCategoryId: 'pc1', vendorId: 'v1', partNumber: 'FLT-1', name: 'Filter', unitCost: 1, unitPrice: 2, quantityOnHand: 3, reorderThreshold: 1, isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([
      { id: 'v1', name: 'Vendor A', isArchived: false },
      { id: 'v-archived', name: 'Archived Vendor', isArchived: true }
    ] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([
      { id: 'pc1', name: 'Filters', isArchived: false },
      { id: 'pc-archived', name: 'Archived Category', isArchived: true }
    ] as any)

    render(<PartsPage />)
    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    fireEvent.change(await within(partsCard).findByLabelText('Part category filter'), { target: { value: 'pc-archived' } })
    fireEvent.change(within(partsCard).getByLabelText('Part vendor filter'), { target: { value: 'v-archived' } })
    fireEvent.click(within(partsCard).getByRole('button', { name: 'Create Part' }))

    const categorySelect = within(partsCard).getByLabelText('Part category')
    const vendorSelect = within(partsCard).getByLabelText('Preferred vendor')
    expect(categorySelect).toHaveValue('')
    expect(vendorSelect).toHaveValue('')
    expect(within(categorySelect).queryByRole('option', { name: 'Archived Category' })).not.toBeInTheDocument()
    expect(within(vendorSelect).queryByRole('option', { name: 'Archived Vendor' })).not.toBeInTheDocument()
  })
})
