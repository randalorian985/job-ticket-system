import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { useAuth } from '../../features/auth/AuthContext'
import { AppRouter } from '../AppRouter'

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listMine: vi.fn(),
    listAll: vi.fn()
  }
}))

describe('AppRouter authentication rendering', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users from protected routes to login', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Employee Login' })).toBeInTheDocument()
  })

  it('renders protected jobs route for authenticated employee role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { employeeId: 'employee-1', username: 'employee', firstName: 'Casey', lastName: 'Tech', role: 'Employee', email: 'employee@example.com' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })
    vi.mocked(jobTicketsApi.listMine).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'My Jobs' })).toBeInTheDocument()
  })

  it('employee users cannot access manager routes', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { employeeId: 'employee-1', username: 'employee', firstName: 'Casey', lastName: 'Tech', role: 'Employee', email: 'employee@example.com' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    render(
      <MemoryRouter initialEntries={['/manage']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()
  })

  it('manager dashboard renders and manager cannot access admin user route', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { employeeId: 'manager-1', username: 'manager', firstName: 'Mina', lastName: 'Supervisor', role: 'Manager', email: 'manager@example.com' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    render(
      <MemoryRouter initialEntries={['/manage']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Operations Dashboard' })).toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()

    render(
      <MemoryRouter initialEntries={['/manage/users']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()
  })
})
