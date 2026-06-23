import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ticketStatusFiltersApi } from '../../../api/ticketStatusFiltersApi'
import { TicketStatusFiltersPage } from './TicketStatusFiltersPage'

vi.mock('../../../api/ticketStatusFiltersApi', () => ({
  ticketStatusFiltersApi: {
    list: vi.fn(),
    save: vi.fn()
  }
}))

describe('TicketStatusFiltersPage', () => {
  it('lets Admin users create, edit, reorder, activate, deactivate, and save status filter options', async () => {
    vi.mocked(ticketStatusFiltersApi.list).mockResolvedValue([
      { id: 'filter-1', displayLabel: 'Submitted', status: 2, displayOrder: 10, isActive: true },
      { id: 'filter-2', displayLabel: 'Assigned', status: 3, displayOrder: 20, isActive: true }
    ] as any)
    vi.mocked(ticketStatusFiltersApi.save).mockResolvedValue([
      { id: 'filter-1', displayLabel: 'Submitted Intake', status: 2, displayOrder: 30, isActive: false },
      { id: 'filter-2', displayLabel: 'Assigned', status: 3, displayOrder: 20, isActive: true },
      { id: 'filter-3', displayLabel: 'Field Work', status: 4, displayOrder: 40, isActive: true }
    ] as any)

    render(<TicketStatusFiltersPage />)

    expect(await screen.findByDisplayValue('Submitted')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Display label 1'), { target: { value: 'Submitted Intake' } })
    fireEvent.change(screen.getByLabelText('Display order 1'), { target: { value: '30' } })
    fireEvent.click(screen.getAllByLabelText('Active')[0])
    fireEvent.click(screen.getByRole('button', { name: 'Add filter' }))
    fireEvent.change(screen.getByLabelText('Display label 3'), { target: { value: 'Field Work' } })
    fireEvent.change(screen.getByLabelText('Status value 3'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Display order 3'), { target: { value: '40' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save ticket filters' }))

    await waitFor(() => expect(ticketStatusFiltersApi.save).toHaveBeenCalledWith({
      options: [
        { id: 'filter-2', displayLabel: 'Assigned', status: 3, displayOrder: 20, isActive: true },
        { id: 'filter-1', displayLabel: 'Submitted Intake', status: 2, displayOrder: 30, isActive: false },
        { id: null, displayLabel: 'Field Work', status: 4, displayOrder: 40, isActive: true }
      ]
    }))
    expect(await screen.findByText('Ticket status filters saved.')).toBeInTheDocument()
  })
})
