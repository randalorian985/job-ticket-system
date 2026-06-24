import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { masterDataApi } from '../../api/masterDataApi'
import { usersApi } from '../../api/usersApi'
import { JobTicketCreatePage } from './JobTicketCreatePage'
import { routerFuture } from '../../routes/routerFuture'

vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { create: vi.fn() } }))
vi.mock('../../api/masterDataApi', () => ({ masterDataApi: { listCustomers: vi.fn(), listServiceLocations: vi.fn(), listEquipment: vi.fn() } }))
vi.mock('../../api/usersApi', () => ({ usersApi: { listAssignableEmployees: vi.fn() } }))

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.resetAllMocks()
})

describe('JobTicketCreatePage', () => {
  const createAssignableEmployees = () => [
    { id: 'tech-1', firstName: 'Alex', lastName: 'Rivera' },
    { id: 'tech-2', firstName: 'Jamie', lastName: 'Chen' }
  ] as any

  it('renders manager create form with richer job information fields', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)
    vi.mocked(usersApi.listAssignableEmployees).mockResolvedValue([] as any)
    render(<MemoryRouter future={routerFuture}><JobTicketCreatePage /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Create Job Ticket' })).toBeInTheDocument()
    expect(screen.getByLabelText('Job Type')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'ticket edit sections' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Billing' }))
    expect(screen.getByLabelText('Purchase Order Number')).toBeInTheDocument()
    expect(screen.getByLabelText('Billing Contact Name')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }))
    expect(screen.getByRole('heading', { name: 'Assign Technicians (Optional)' })).toBeInTheDocument()
    expect(screen.getByText('No assignable technicians are currently available.')).toBeInTheDocument()
    expect(screen.getByText('Create Ticket')).toBeInTheDocument()
  })

  it('keeps one lead selected when multiple technicians are assigned during schedule setup', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)
    vi.mocked(usersApi.listAssignableEmployees).mockImplementation(async () => createAssignableEmployees())

    render(<MemoryRouter future={routerFuture}><JobTicketCreatePage /></MemoryRouter>)

    await screen.findByRole('heading', { name: 'Create Job Ticket' })
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }))

    const technicianChecks = await screen.findAllByRole('checkbox')
    fireEvent.click(technicianChecks[0])
    fireEvent.click(technicianChecks[1])

    expect(screen.getByText('Selected technicians: Alex Rivera, Jamie Chen')).toBeInTheDocument()
    expect(screen.getByText('Lead')).toBeInTheDocument()

    fireEvent.click(technicianChecks[0])

    const leadSelect = screen.getByLabelText('Lead Technician') as HTMLSelectElement
    expect(leadSelect.value).toBe('tech-2')
  })
})
