import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { useAuth } from '../../features/auth/AuthContext'
import { routerFuture } from '../../routes/routerFuture'
import { ManagerDashboardPage } from './ManagerDashboardPage'

vi.mock('../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { listAll: vi.fn() } }))

describe('ManagerDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Manager' } } as any)
  })

  it('renders operational job summary from loaded manager job data', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'j1', status: 3 },
      { id: 'j2', status: 4 },
      { id: 'j3', status: 5 },
      { id: 'j4', status: 7 },
      { id: 'j5', status: 10 }
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
    expect(screen.getByText('3')).toBeInTheDocument()
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
