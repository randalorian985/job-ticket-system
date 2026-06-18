import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../features/auth/AuthContext'
import { routerFuture } from '../../routes/routerFuture'
import { ManagerShell } from './ManagerShell'

vi.mock('../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))

describe('ManagerShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { firstName: 'Riley', lastName: 'Manager', role: 'Manager' },
      logout: vi.fn()
    } as any)
  })

  afterEach(() => {
    cleanup()
  })

  function renderShell(initialEntry = '/manage/job-tickets/jt-1') {
    return render(
      <MemoryRouter future={routerFuture} initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/manage" element={<ManagerShell />}>
            <Route index element={<p>Dashboard page</p>} />
            <Route path="job-tickets/:jobTicketId" element={<p>Ticket detail page</p>} />
            <Route path="reports" element={<p>Reports page</p>} />
            <Route path="wiki" element={<p>Wiki page</p>} />
            <Route path="users" element={<p>Users page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
  }

  it('shows the active manager section for nested routes and navigates from the compact selector', async () => {
    const user = userEvent.setup()
    renderShell()

    const sectionPicker = screen.getByLabelText('Manager section navigation')
    expect(screen.getByLabelText('Jump to screen')).toBeInTheDocument()
    expect(screen.getByText('Use this screen picker when the full Manager/Admin menu is collapsed.')).toBeInTheDocument()
    expect(sectionPicker).toHaveValue('/manage/job-tickets')
    expect(screen.getByText('Ticket detail page')).toBeInTheDocument()

    await user.selectOptions(sectionPicker, '/manage/reports')

    expect(screen.getByText('Reports page')).toBeInTheDocument()
    expect(sectionPicker).toHaveValue('/manage/reports')

    await user.selectOptions(sectionPicker, '/manage/wiki')

    expect(screen.getByText('Wiki page')).toBeInTheDocument()
    expect(sectionPicker).toHaveValue('/manage/wiki')
  })

  it('keeps admin-only navigation out of the manager section picker', () => {
    renderShell('/manage')

    expect(screen.queryByRole('option', { name: 'Users' })).not.toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('shows admin-only navigation to admins', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { firstName: 'Ada', lastName: 'Admin', role: 'Admin' },
      logout: vi.fn()
    } as any)

    renderShell('/manage/users')

    const sectionPicker = screen.getByLabelText('Manager section navigation')
    expect(screen.getByRole('option', { name: 'Users' })).toBeInTheDocument()
    expect(sectionPicker).toHaveValue('/manage/users')
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('keeps primary operations visible and groups secondary navigation into compact menus', () => {
    renderShell('/manage/reports')

    expect(screen.getByRole('navigation', { name: 'manager navigation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Job Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wiki' })).toBeInTheDocument()
    expect(screen.getByText('Customers & Equipment')).toBeInTheDocument()
    expect(screen.getByText('Parts & Supply')).toBeInTheDocument()
  })

  it('keeps unfinished inventory workflow out of manager navigation', () => {
    renderShell('/manage/reports')

    expect(screen.queryByRole('option', { name: 'Inventory' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Inventory' })).not.toBeInTheDocument()
  })

  it('closes the previously opened desktop menu when another menu opens', async () => {
    const user = userEvent.setup()
    renderShell('/manage/reports')

    const customersMenu = screen.getByText('Customers & Equipment').closest('details')
    const partsMenu = screen.getByText('Parts & Supply').closest('details')
    expect(customersMenu).not.toBeNull()
    expect(partsMenu).not.toBeNull()

    await user.click(screen.getByText('Customers & Equipment'))
    expect(customersMenu).toHaveAttribute('open')
    expect(customersMenu).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByText('Parts & Supply'))
    expect(partsMenu).toHaveAttribute('open')
    expect(partsMenu).toHaveAttribute('aria-expanded', 'true')
    expect(customersMenu).not.toHaveAttribute('open')
    expect(customersMenu).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes an open desktop menu when the manager clicks outside navigation', async () => {
    const user = userEvent.setup()
    renderShell('/manage/reports')

    const partsMenu = screen.getByText('Parts & Supply').closest('details')
    expect(partsMenu).not.toBeNull()

    await user.click(screen.getByText('Parts & Supply'))
    expect(partsMenu).toHaveAttribute('open')

    await user.click(screen.getByText('Reports page'))

    expect(partsMenu).not.toHaveAttribute('open')
    expect(partsMenu).toHaveAttribute('aria-expanded', 'false')
  })
})
