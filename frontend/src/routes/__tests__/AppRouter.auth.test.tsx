import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { ticketStatusFiltersApi } from '../../api/ticketStatusFiltersApi'
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
    listAll: vi.fn(),
    listAssignments: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    changeStatus: vi.fn(),
    addAssignment: vi.fn(),
    removeAssignment: vi.fn(),
    addWorkEntry: vi.fn()
  }
}))

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listEquipment: vi.fn(),
    listCustomers: vi.fn(),
    listServiceLocations: vi.fn()
  }
}))

vi.mock('../../api/ticketStatusFiltersApi', () => ({
  ticketStatusFiltersApi: {
    list: vi.fn()
  }
}))

vi.mock('../../api/usersApi', () => ({
  usersApi: {
    list: vi.fn(),
    listAssignableEmployees: vi.fn(),
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Job Ticket System Wiki\n\n## Reports\n\nReports support CSV export and print/save-PDF output.')
    }))
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listAssignments).mockResolvedValue([])
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([])
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([])
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([])
    vi.mocked(ticketStatusFiltersApi.list).mockResolvedValue([])
    vi.mocked(usersApi.list).mockResolvedValue([])
    vi.mocked(usersApi.listAssignableEmployees).mockResolvedValue([])
  })

  it('renders the public UX preview readiness route without authentication', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/preview']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Job Ticket System readiness' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Employee login' })).toHaveAttribute('href', '/login')
  })

  it('redirects unauthenticated users from protected routes to login', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/jobs']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('routes unauthenticated users to login from root and unknown routes', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })

    const view = render(
      <MemoryRouter future={routerFuture} initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()

    view.rerender(
      <MemoryRouter future={routerFuture} initialEntries={['/missing']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
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

    view.rerender(
      <MemoryRouter future={routerFuture} initialEntries={['/manage/wiki']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()
  })

  it('manager dashboard renders and manager cannot access admin routes', async () => {
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

    expect(await screen.findByRole('heading', { name: 'Job Ticket Management Dashboard' })).toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage/users']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()

    cleanup()
    render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage/company-configuration']}>
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

    expect(await screen.findByRole('heading', { name: 'Service Operations' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(logout).toHaveBeenCalledTimes(1)

    view.rerender(
      <MemoryRouter future={routerFuture} initialEntries={['/manage']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
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

    expect(await screen.findByRole('heading', { name: 'Service Operations' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Job Ticket Management Dashboard' })).toBeInTheDocument()
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

    expect(await screen.findByRole('heading', { name: 'Service Operations' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Job Ticket Management Dashboard' })).toBeInTheDocument()

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

    expect(await screen.findByRole('heading', { name: 'Service Operations' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Job Ticket Management Dashboard' })).toBeInTheDocument()
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

  it('manager users can open the in-app system wiki', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: managerUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage/wiki#reports']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'System Wiki' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open markdown' })).toHaveAttribute('href', '/docs/system-wiki.md')
  })

  it('redirects the legacy dispatch route to Job Tickets', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: managerUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage/dispatch']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Scheduling' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dispatch Board' })).not.toBeInTheDocument()
  })

  it('redirects the unfinished inventory route back to the Manager/Admin dashboard', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: managerUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/manage/inventory']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Job Ticket Management Dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Inventory Operations' })).not.toBeInTheDocument()
  })
})
