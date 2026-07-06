import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { masterDataApi } from '../../../api/masterDataApi'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { EquipmentPage } from './MasterDataPages'

vi.mock('../../../api/masterDataApi', () => ({
  masterDataApi: {
    listEquipment: vi.fn(),
    listCustomers: vi.fn(),
    listServiceLocations: vi.fn(),
    createEquipment: vi.fn()
  }
}))

describe('MasterData equipment year validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme', isArchived: false }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 'loc1', customerId: 'c1', locationName: 'Main shop', isArchived: false }] as any)
  })

  it('keeps out-of-range or fractional equipment years from submitting', async () => {
    renderWithRouter(<EquipmentPage />)

    const equipmentForm = screen.getByRole('form', { name: 'equipment form' })
    fireEvent.change(await within(equipmentForm).findByLabelText('Primary customer'), { target: { value: 'c1' } })
    fireEvent.change(within(equipmentForm).getByLabelText('Service location'), { target: { value: 'loc1' } })
    fireEvent.change(within(equipmentForm).getByLabelText('Equipment name'), { target: { value: 'Crane A' } })
    fireEvent.change(within(equipmentForm).getByLabelText('Year'), { target: { value: '1899' } })
    fireEvent.submit(equipmentForm)

    expect(await screen.findByText('Equipment year must be a whole year from 1900 through 2100.')).toBeInTheDocument()
    expect(masterDataApi.createEquipment).not.toHaveBeenCalled()

    fireEvent.change(within(equipmentForm).getByLabelText('Year'), { target: { value: '2024.5' } })
    fireEvent.submit(equipmentForm)

    expect(await screen.findByText('Equipment year must be a whole year from 1900 through 2100.')).toBeInTheDocument()
    expect(masterDataApi.createEquipment).not.toHaveBeenCalled()
    await waitFor(() => expect(masterDataApi.listEquipment).toHaveBeenCalled())
  })
})

