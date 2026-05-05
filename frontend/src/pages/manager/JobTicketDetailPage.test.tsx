import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { filesApi } from '../../api/filesApi'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { usersApi } from '../../api/usersApi'
import { useAuth } from '../../features/auth/AuthContext'
import { JobTicketDetailPage } from './JobTicketDetailPage'
import { routerFuture } from '../../routes/routerFuture'

vi.mock('../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../api/timeEntriesApi', () => ({ timeEntriesApi: { listByJob: vi.fn() } }))
vi.mock('../../api/filesApi', () => ({ filesApi: { list: vi.fn(), getDownloadUrl: vi.fn(() => '#') } }))
vi.mock('../../api/usersApi', () => ({ usersApi: { list: vi.fn() } }))
vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { get: vi.fn(), listAssignments: vi.fn(), listWorkEntries: vi.fn(), listParts: vi.fn(), changeStatus: vi.fn(), archive: vi.fn(), addAssignment: vi.fn(), removeAssignment: vi.fn(), update: vi.fn() } }))
vi.mock('../../api/masterDataApi', () => ({ masterDataApi: { listCustomers: vi.fn(), listServiceLocations: vi.fn(), listEquipment: vi.fn() } }))

describe('JobTicketDetailPage', () => {
  const setupBaseMocks = () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Manager' } } as any)
    vi.mocked(jobTicketsApi.get).mockResolvedValue({ id: 'j1', ticketNumber: 'JT-1', customerId: 'c1', serviceLocationId: 's1', billingPartyCustomerId: 'c1', title: 'Issue', priority: 2, status: 3 } as any)
    vi.mocked(jobTicketsApi.listAssignments).mockResolvedValue([{ employeeId: 'e1', isLead: false }] as any)
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([] as any)
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([] as any)
    vi.mocked(timeEntriesApi.listByJob).mockResolvedValue([] as any)
    vi.mocked(filesApi.list).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 's1', locationName: 'HQ' }] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([] as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupBaseMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const renderPage = () => {
    render(<MemoryRouter future={routerFuture} initialEntries={['/manage/job-tickets/j1']}><Routes><Route path="/manage/job-tickets/:jobTicketId" element={<JobTicketDetailPage />} /></Routes></MemoryRouter>)
  }

  it('renders assignment and status/archive actions', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('assignment employee'), { target: { value: 'e2' } })
    fireEvent.click(screen.getByText('Assign Employee'))
    expect(jobTicketsApi.addAssignment).toHaveBeenCalled()
  })

  it('shows confirmation before archive API call', async () => {
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Archive reason'), { target: { value: 'Duplicate ticket' } })
    fireEvent.click(screen.getByText('Archive Ticket'))

    expect(screen.getByLabelText('archive confirmation')).toBeInTheDocument()
    expect(jobTicketsApi.archive).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Confirm Archive'))
    expect(jobTicketsApi.archive).toHaveBeenCalledWith('j1', { archiveReason: 'Duplicate ticket' })
  })

  it('shows success feedback after archive confirmation succeeds', async () => {
    vi.mocked(jobTicketsApi.archive).mockResolvedValue({} as any)
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Archive reason'), { target: { value: 'Completed and closed' } })
    fireEvent.click(screen.getByText('Archive Ticket'))
    fireEvent.click(screen.getByText('Confirm Archive'))

    expect(await screen.findByText('Ticket archived.')).toBeInTheDocument()
  })

  it('shows error feedback after archive confirmation fails', async () => {
    vi.mocked(jobTicketsApi.archive).mockRejectedValue(new Error('request failed'))
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Archive reason'), { target: { value: 'Invalid closure' } })
    fireEvent.click(screen.getByText('Archive Ticket'))
    fireEvent.click(screen.getByText('Confirm Archive'))

    expect(await screen.findByText('Unable to archive ticket.')).toBeInTheDocument()
  })
})
