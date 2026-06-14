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

  it('prefills blank part create forms from active category and vendor filters', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([{ id: 'v1', name: 'Vendor A', isArchived: false }, { id: 'v2', name: 'Vendor B', isArchived: false }] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Filters', isArchived: false }, { id: 'pc2', name: 'Belts', isArchived: false }] as any)
    vi.mocked(masterDataApi.createPart).mockResolvedValue({ id: 'p-new', partNumber: 'BLT-2', name: 'Belt' } as any)

    render(<PartsPage />)
    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    fireEvent.change(await within(partsCard).findByLabelText('Category'), { target: { value: 'pc2' } })
    fireEvent.change(within(partsCard).getByLabelText('Vendor'), { target: { value: 'v2' } })

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
    fireEvent.click(await within(partsCard).findAllByRole('button', { name: 'Edit' }).then((buttons) => buttons[0]))
    fireEvent.change(within(partsCard).getByLabelText('Category'), { target: { value: 'pc2' } })
    fireEvent.change(within(partsCard).getByLabelText('Vendor'), { target: { value: 'v2' } })

    expect(within(partsCard).getByLabelText('Part category')).toHaveValue('pc1')
    expect(within(partsCard).getByLabelText('Preferred vendor')).toHaveValue('v1')
    expect(within(partsCard).getByLabelText('Part number')).toHaveValue('FLT-1')
  })
})