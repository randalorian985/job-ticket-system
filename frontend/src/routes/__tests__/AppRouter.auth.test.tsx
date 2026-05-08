import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { usersApi } from '../../api/usersApi'
import { useAuth } from '../../features/auth/AuthContext'
import { AppRouter } from '../AppRouter'
import { routerFuture } from '../routerFuture'

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listMine: vi.fn(),
    listAll: vi.fn()
  }
}))

vi.mock('../../api/usersApi', () => ({
  usersApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    resetPassword: vi.fn()
  }
}))

const employeeUser = {
  employeeId: 'employee-1',
  username: 'employee',
  firstName: 'Casey',
  lastName: 'Tech',
  role: 'Employee' as const,
  email: 'employee@example.com'
}

const managerUser = {
  employeeId: 'manager-1',
  username: 'manager',
  firstName: 'Mina',
  lastName: 'Supervisor',
  role: 'Manager' as const,
  email: 'manager@example.com'
}

const adminUser = {
  employeeId: 'admin-1',
  username: 'admin',
  firstName: 'Alex',
  lastName: 'Admin',
  role: 'Admin' as const,
  email: 'admin@example.com'
}

describe('AppRouter authentication rendering', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([])
    vi.mocked(usersApi.list).mockResolvedValue([])
  })

  it('renders the public UX preview readiness route without authentication', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/preview']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Job Ticket System local demo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Employee login' })).toHaveAttribute('href', '/login')
  })

  it('redirects unauthenticated users from protected routes to login', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/jobs']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Employee Login' })).toBeInTheDocument()
  })

  it('routes unauthenticated users to login from root and unknown routes', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })

    const view = render(
      <MemoryRouter future={routerFuture} initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Employee Login' })).toBeInTheDocument()

    view.rerender(
      <MemoryRouter future={routerFuture} initialEntries={['/missing']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Employee Login' })).toBeInTheDocument()
  })

  it('routes employee users to employee workflow from root and unknown routes', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: employeeUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })
    vi.mocked(jobTicketsApi.listMine).mockResolvedValue([])

    const view = render(
      <MemoryRouter future={routerFuture} initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'My Jobs' })).toBeInTheDocument()

    view.rerender(
      <MemoryRouter future={routerFuture} initialEntries={['/random']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'My Jobs' })).toBeInTheDocument()
  })

  it('renders protected jobs route for authenticated employee role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: employeeUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })
    vi.mocked(jobTicketsApi.listMine).mockResolvedValue([])

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/jobs']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'My Jobs' })).toBeInTheDocument()
  })

  it('employee users cannot access manager routes, including reports', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: employeeUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    const view = render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()

    view.rerender(
      <MemoryRouter future={routerFuture} initialEntries={['/manage/reports']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()
  })

  it('manager dashboard renders and manager cannot access admin user route', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: managerUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Operations Dashboard' })).toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage/users']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()
  })

  it('logout clears auth state and returns manager users to login', async () => {
    let currentUser: typeof managerUser | null = managerUser
    const logout = vi.fn(() => {
      currentUser = null
    })

    vi.mocked(useAuth).mockImplementation(() => ({
      user: currentUser,
      isLoading: false,
      login: vi.fn(),
      logout
    }))

    const view = render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Manager/Admin Console' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(logout).toHaveBeenCalledTimes(1)

    view.rerender(
      <MemoryRouter future={routerFuture} initialEntries={['/manage']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Employee Login' })).toBeInTheDocument()
  })

  it('authenticated managers are routed to manager shell instead of login when hitting unknown routes', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: managerUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/unknown-route']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Manager/Admin Console' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Operations Dashboard' })).toBeInTheDocument()
  })

  it('manager and admin users are routed to manager console from root', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: managerUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    const view = render(
      <MemoryRouter future={routerFuture} initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Manager/Admin Console' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Operations Dashboard' })).toBeInTheDocument()

    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    view.rerender(
      <MemoryRouter future={routerFuture} initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Manager/Admin Console' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Operations Dashboard' })).toBeInTheDocument()
  })

  it('manager and admin users cannot access employee-only routes', async () => {
    vi.mocked(jobTicketsApi.listMine).mockResolvedValue([])

    vi.mocked(useAuth).mockReturnValue({
      user: managerUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    const view = render(
      <MemoryRouter future={routerFuture} initialEntries={['/jobs']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()

    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    view.rerender(
      <MemoryRouter future={routerFuture} initialEntries={['/jobs']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()
  })

  it('admin users can access /manage/users', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage/users']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'User Management' })).toBeInTheDocument()
  })
})
