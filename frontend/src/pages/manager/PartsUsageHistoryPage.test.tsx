import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { masterDataApi } from '../../api/masterDataApi'
import { partsUsageHistoryApi } from '../../api/partsUsageHistoryApi'
import { renderWithRouter } from '../../test/renderWithRouter'
import { PartsUsageHistoryPage } from './PartsUsageHistoryPage'

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listEquipment: vi.fn(),
    listParts: vi.fn(),
    listCustomers: vi.fn()
  }
}))

vi.mock('../../api/partsUsageHistoryApi', () => ({
  partsUsageHistoryApi: {
    list: vi.fn()
  }
}))

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PartsUsageHistoryPage', () => {
  it('waits for filters before rendering cautious parts usage history evidence', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([{ id: 'eq1', name: 'Crane A', isArchived: false }] as any)
    vi.mocked(masterDataApi.listParts).mockResolvedValue([{ id: 'p1', partNumber: 'SEAL-1', name: 'Seal Kit', isArchived: false }] as any)
    vi.mocked(partsUsageHistoryApi.list).mockResolvedValue([
      {
        jobTicketPartId: 'jtp1',
        jobTicketId: 'job1',
        ticketNumber: 'JT-2026-000101',
        partId: 'p1',
        partNumber: 'SEAL-1',
        partName: 'Seal Kit',
        equipmentId: 'eq1',
        equipmentName: 'Crane A',
        modelNumber: 'X100',
        quantity: 1,
        componentCategory: 'Hydraulic',
        repairDescription: 'Replaced leaking seal',
        technicianNotes: 'Observed after install',
        compatibilityNotes: 'Verify before reuse',
        addedAtUtc: '2026-05-01T12:00:00Z',
        approvalStatus: 2,
        evidenceTags: ['previously used on this equipment', 'technician-confirmed']
      }
    ] as any)

    renderWithRouter(<PartsUsageHistoryPage />)

    expect(await screen.findByText('Set filters to review usage history.')).toBeInTheDocument()
    expect(partsUsageHistoryApi.list).not.toHaveBeenCalled()
    expect(screen.queryByText('previously used on this equipment')).not.toBeInTheDocument()

    const filters = screen.getByRole('form', { name: 'parts usage history filters' })
    const equipmentSelect = within(filters).getByRole('combobox', { name: 'Equipment' })
    const partSelect = within(filters).getByRole('combobox', { name: 'Part' })
    const user = userEvent.setup()

    await user.selectOptions(equipmentSelect, 'eq1')
    await user.selectOptions(partSelect, 'p1')
    fireEvent.submit(filters)

    expect(await screen.findByText('SEAL-1 - Seal Kit')).toBeInTheDocument()
    expect(screen.getByText('previously used on this equipment')).toBeInTheDocument()
    expect(screen.getByText('technician-confirmed')).toBeInTheDocument()
    expect(screen.getByText(/not compatibility guarantees or automatic recommendations/i)).toBeInTheDocument()
    expect(screen.queryByText(/recommended part/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/guaranteed compatible/i)).not.toBeInTheDocument()
  })

  it('passes selected equipment and part filters to history API', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([{ id: 'eq1', name: 'Crane A', isArchived: false }] as any)
    vi.mocked(masterDataApi.listParts).mockResolvedValue([{ id: 'p1', partNumber: 'SEAL-1', name: 'Seal Kit', isArchived: false }] as any)
    vi.mocked(partsUsageHistoryApi.list).mockResolvedValue([] as any)

    renderWithRouter(<PartsUsageHistoryPage />)

    await screen.findByText('Set filters to review usage history.')
    const filters = screen.getByRole('form', { name: 'parts usage history filters' })
    const equipmentSelect = within(filters).getByRole('combobox', { name: 'Equipment' })
    const partSelect = within(filters).getByRole('combobox', { name: 'Part' })
    const user = userEvent.setup()

    await user.selectOptions(equipmentSelect, 'eq1')
    await user.selectOptions(partSelect, 'p1')

    expect(equipmentSelect).toHaveValue('eq1')
    expect(partSelect).toHaveValue('p1')

    fireEvent.submit(filters)

    await waitFor(() => expect(partsUsageHistoryApi.list).toHaveBeenLastCalledWith({ equipmentId: 'eq1', partId: 'p1', limit: 50 }))
  })

  it('does not request history when no filters are selected', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(partsUsageHistoryApi.list).mockResolvedValue([] as any)

    renderWithRouter(<PartsUsageHistoryPage />)

    await screen.findByText('Set filters to review usage history.')
    fireEvent.submit(screen.getByRole('form', { name: 'parts usage history filters' }))

    expect(screen.getByText('Choose at least one filter before reviewing parts usage history.')).toBeInTheDocument()
    expect(partsUsageHistoryApi.list).not.toHaveBeenCalled()
    expect(screen.queryByText('No parts usage history matches the current filters.')).not.toBeInTheDocument()
  })
})
