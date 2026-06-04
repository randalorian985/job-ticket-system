import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { useAuth } from '../../features/auth/AuthContext'
import { routerFuture } from '../../routes/routerFuture'
import { ManagerDashboardPage } from './ManagerDashboardPage'

vi.mock('../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { listAll: vi.fn(), listAssignments: vi.fn() } }))

describe('ManagerDashboardPage', () => {
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

  it('renders operational and dispatch readiness summary from loaded manager job data', async () => {
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
    expect(await screen.findByLabelText('operations summary')).toHaveTextContent('Open jobs')
    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('Waiting on parts')).toBeInTheDocument()
    expect(screen.getByText('Completed / review-ready')).toBeInTheDocument()
    expect(screen.getByText('Invoice-ready')).toBeInTheDocument()
    expect(screen.getByText('Dispatch-ready')).toBeInTheDocument()
    expect(screen.getByText('Needs dispatch review')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch focus: JT-1: Assign at least one employee before dispatch.')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(6)
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

    expect(await screen.findByText('Dispatch-ready')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch focus: No dispatch blockers are visible from the dashboard data.')).toBeInTheDocument()
  })

  it('shows an error instead of dispatch readiness totals when assignment loading fails', async () => {
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
    expect(screen.queryByText('Dispatch-ready')).not.toBeInTheDocument()
    expect(screen.queryByText('Needs dispatch review')).not.toBeInTheDocument()
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