import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { routerFuture } from '../../routes/routerFuture'
import { JobTicketListPage } from './JobTicketListPage'

vi.mock('../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listAll: vi.fn()
  }
}))

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listCustomers: vi.fn(),
    listServiceLocations: vi.fn()
  }
}))

describe('Manager list pages', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c-1', name: 'Acme' },
      { id: 'c-2', name: 'Bravo' }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 's-1', locationName: 'HQ' },
      { id: 's-2', locationName: 'Field Shop' }
    ] as any)
  })

  const renderPage = () => {
    render(
      <MemoryRouter future={routerFuture}>
        <JobTicketListPage />
      </MemoryRouter>
    )
  }

  it('renders manager job ticket list with loading state and readable labels', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix unit', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1' }
    ] as any)

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading manager job tickets')
    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText(/In Progress · High/)).toBeInTheDocument()
    expect(screen.getAllByText(/Acme/).length).toBeGreaterThan(0)
  })

  it('filters by search text, status, priority, and customer, then resets filters', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1' },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Inspect pump', status: 5, priority: 2, customerId: 'c-2', serviceLocationId: 's-2' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(await screen.findByText('JT-2')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Search tickets/i), { target: { value: 'compressor' } })
    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.queryByText('JT-2')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '5' } })
    expect(screen.getByText('No job tickets match the current filters. Reset filters to see all tickets.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c-1' } })
    expect(screen.getByText('JT-1')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Reset Filters'))
    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('JT-2')).toBeInTheDocument()
  })

  it('shows empty and error states', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([])
    const view = render(
      <MemoryRouter future={routerFuture}>
        <JobTicketListPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('No job tickets found. Create a ticket to start the pilot workflow.')).toBeInTheDocument()

    vi.mocked(jobTicketsApi.listAll).mockRejectedValue(new Error('network'))
    view.unmount()
    renderPage()

    await waitFor(() => expect(screen.getByText('Unable to load manager job tickets.')).toBeInTheDocument())
  })
})
