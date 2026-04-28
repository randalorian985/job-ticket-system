import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { masterDataApi } from '../../api/masterDataApi'
import { JobTicketCreatePage } from './JobTicketCreatePage'

vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { create: vi.fn() } }))
vi.mock('../../api/masterDataApi', () => ({ masterDataApi: { listCustomers: vi.fn(), listServiceLocations: vi.fn(), listEquipment: vi.fn() } }))

describe('JobTicketCreatePage', () => {
  it('renders manager create form', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)
    render(<MemoryRouter><JobTicketCreatePage /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Create Job Ticket' })).toBeInTheDocument()
    expect(screen.getByText('Create Ticket')).toBeInTheDocument()
  })
})
