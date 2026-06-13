import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { masterDataApi } from '../../../api/masterDataApi'
import { EquipmentPage } from './MasterDataPages'

vi.mock('../../../api/masterDataApi', () => ({
  masterDataApi: {
    listEquipment: vi.fn(),
    listCustomers: vi.fn(),
    listServiceLocations: vi.fn(),
    createEquipment: vi.fn(),
    updateEquipment: vi.fn()
  }
}))

describe('MasterData equipment customer/location validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c1', name: 'Acme', isArchived: false },
      { id: 'c2', name: 'Beta', isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 'loc1', customerId: 'c1', locationName: 'Acme shop', isArchived: false },
      { id: 'loc2', customerId: 'c2', locationName: 'Beta yard', isArchived: false }
    ] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)
  })

  it('limits equipment service-location choices to the selected customer', async () => {
    render(<EquipmentPage />)

    const equipmentForm = screen.getByRole('form', { name: 'equipment form' })
    const customerSelect = await within(equipmentForm).findByLabelText('Primary customer')
    fireEvent.change(customerSelect, { target: { value: 'c1' } })

    const locationSelect = within(equipmentForm).getByLabelText('Service location')
    expect(within(locationSelect).getByRole('option', { name: 'Acme shop' })).toBeInTheDocument()
    expect(within(locationSelect).queryByRole('option', { name: 'Beta yard' })).not.toBeInTheDocument()

    fireEvent.change(locationSelect, { target: { value: 'loc1' } })
    fireEvent.change(customerSelect, { target: { value: 'c2' } })

    expect(locationSelect).toHaveValue('')
    expect(within(locationSelect).queryByRole('option', { name: 'Acme shop' })).not.toBeInTheDocument()
    expect(within(locationSelect).getByRole('option', { name: 'Beta yard' })).toBeInTheDocument()
  })

  it('keeps mismatched equipment customer and service location from submitting', async () => {
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([
      { id: 'eq1', customerId: 'c1', serviceLocationId: 'loc2', name: 'Pump', isArchived: false }
    ] as any)

    render(<EquipmentPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    const equipmentForm = screen.getByRole('form', { name: 'equipment form' })
    fireEvent.submit(equipmentForm)

    expect(await screen.findByText('Equipment service location must belong to the selected customer.')).toBeInTheDocument()
    expect(masterDataApi.updateEquipment).not.toHaveBeenCalled()
    await waitFor(() => expect(masterDataApi.listEquipment).toHaveBeenCalled())
  })
})
