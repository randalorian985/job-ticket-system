import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { useAuth } from '../../features/auth/AuthContext'
import { routerFuture } from '../../routes/routerFuture'
import { ManagerDashboardPage } from './ManagerDashboardPage'

vi.mock('../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { listAll: vi.fn(), listAssignments: vi.fn() } }))

describe('ManagerDashboardPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Manager' } } as any)
    vi.mocked(jobTicketsApi.listAssignments).mockImplementation(async (jobTicketId: string) => {
      if (jobTicketId === 'j2') {
        return [{ jobTicketId, employeeId: 'e-1', assignedAtUtc: '2026-06-01T08:00:00Z', isLead: true }] as any
      }

      if (jobTicketId === 'j3') {
        return [{ jobTicketId, employeeId: 'e-2', assignedAtUtc: '2026-06-01T09:00:00Z', isLead: false }] as any
      }

      return [] as any
    })
  })

  it('renders the refreshed operations board and dispatch readiness summary from loaded manager job data', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'j1', ticketNumber: 'JT-1', status: 3 },
      { id: 'j2', ticketNumber: 'JT-2', status: 4, scheduledStartAtUtc: '2026-06-01T14:00:00Z', dueAtUtc: '2026-06-02T14:00:00Z' },
      { id: 'j3', ticketNumber: 'JT-3', status: 5, scheduledStartAtUtc: '2026-06-01T15:00:00Z', dueAtUtc: '2026-06-02T15:00:00Z' },
      { id: 'j4', ticketNumber: 'JT-4', status: 7 },
      { id: 'j5', ticketNumber: 'JT-5', status: 10 }
    ] as any)

    render(
      <MemoryRouter future={routerFuture}>
        <ManagerDashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading operations summary')
    expect(await screen.findByRole('heading', { name: 'Job ticket management dashboard' })).toBeInTheDocument()
    expect(screen.getByLabelText('manager operations dashboard')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Job Ticket' })).toHaveAttribute('href', '/manage/job-tickets/new')

    const kpis = screen.getByLabelText('operations summary')
    expect(within(kpis).getByText('Open Jobs')).toBeInTheDocument()
    expect(within(kpis).getByText('Assigned')).toBeInTheDocument()
    expect(within(kpis).getByText('In Progress')).toBeInTheDocument()
    expect(within(kpis).getByText('Waiting on Parts')).toBeInTheDocument()
    expect(within(kpis).getByText('Dispatch-ready')).toBeInTheDocument()
    expect(within(kpis).getByText('All Jobs')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Unresolved Jobs by Status' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dispatch Readiness' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Back Office Review' })).toBeInTheDocument()
    expect(screen.getByText('Next dispatch focus:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'JT-1: Assign at least one employee before dispatch.' })).toHaveAttribute(
      'href',
      '/manage/job-tickets/j1?returnTo=%2Fmanage'
    )
    expect(jobTicketsApi.listAssignments).toHaveBeenCalledTimes(5)
  })

  it('shows a ready dashboard dispatch focus when active tickets have assignment, lead, schedule, and due date', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'j2', ticketNumber: 'JT-2', status: 4, scheduledStartAtUtc: '2026-06-01T14:00:00Z', dueAtUtc: '2026-06-02T14:00:00Z' }
    ] as any)

    render(
      <MemoryRouter future={routerFuture}>
        <ManagerDashboardPage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Dispatch Readiness' })).toBeInTheDocument()
    expect(screen.getByText('Next dispatch focus: No dispatch blockers are visible from the dashboard data.')).toBeInTheDocument()
  })

  it('shows an error instead of dispatch readiness panels when assignment loading fails', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'j2', ticketNumber: 'JT-2', status: 4, scheduledStartAtUtc: '2026-06-01T14:00:00Z', dueAtUtc: '2026-06-02T14:00:00Z' }
    ] as any)
    vi.mocked(jobTicketsApi.listAssignments).mockRejectedValue(new Error('assignment load failed'))

    render(
      <MemoryRouter future={routerFuture}>
        <ManagerDashboardPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('Unable to load the operations summary.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dispatch Readiness' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Back Office Review' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Next dispatch focus:/)).not.toBeInTheDocument()
  })

  it('keeps admin-only user link limited to admin users', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Admin' } } as any)
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([])

    render(
      <MemoryRouter future={routerFuture}>
        <ManagerDashboardPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('Users')).toBeInTheDocument()
  })
})
