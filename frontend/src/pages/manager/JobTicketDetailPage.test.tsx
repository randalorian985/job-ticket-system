import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { filesApi } from '../../api/filesApi'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { usersApi } from '../../api/usersApi'
import { useAuth } from '../../features/auth/AuthContext'
import { JobTicketDetailPage } from './JobTicketDetailPage'

vi.mock('../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../api/timeEntriesApi', () => ({ timeEntriesApi: { listByJob: vi.fn() } }))
vi.mock('../../api/filesApi', () => ({ filesApi: { list: vi.fn(), getDownloadUrl: vi.fn(() => '#') } }))
vi.mock('../../api/usersApi', () => ({ usersApi: { list: vi.fn() } }))
vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { get: vi.fn(), listAssignments: vi.fn(), listWorkEntries: vi.fn(), listParts: vi.fn(), changeStatus: vi.fn(), archive: vi.fn(), addAssignment: vi.fn(), removeAssignment: vi.fn(), update: vi.fn() } }))
vi.mock('../../api/masterDataApi', () => ({ masterDataApi: { listCustomers: vi.fn(), listServiceLocations: vi.fn(), listEquipment: vi.fn() } }))

describe('JobTicketDetailPage', () => {
  it('renders assignment and status/archive actions', async () => {
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

    render(<MemoryRouter initialEntries={['/manage/job-tickets/j1']}><Routes><Route path="/manage/job-tickets/:jobTicketId" element={<JobTicketDetailPage />} /></Routes></MemoryRouter>)

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('assignment employee'), { target: { value: 'e2' } })
    fireEvent.click(screen.getByText('Assign Employee'))
    expect(jobTicketsApi.addAssignment).toHaveBeenCalled()
  })
})
