import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
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
  it('renders manager job ticket list with mocked API data', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix unit', status: 0, priority: 1, customerId: 'c-1', serviceLocationId: 's-1' }
    ] as any)
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c-1', name: 'Acme' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 's-1', locationName: 'HQ' }] as any)

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <JobTicketListPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText(/Acme/)).toBeInTheDocument()
  })
})
