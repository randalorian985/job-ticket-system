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
    expect(sectionPicker).toHaveValue('/manage/job-tickets')
    expect(screen.getByText('Ticket detail page')).toBeInTheDocument()

    await user.selectOptions(sectionPicker, '/manage/reports')

    expect(screen.getByText('Reports page')).toBeInTheDocument()
    expect(sectionPicker).toHaveValue('/manage/reports')
  })

  it('keeps admin-only navigation out of the manager section picker', () => {
    renderShell('/manage')

    expect(screen.queryByRole('option', { name: 'Users' })).not.toBeInTheDocument()
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
  })
})
