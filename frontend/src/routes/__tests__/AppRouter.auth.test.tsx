import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { useAuth } from '../../features/auth/AuthContext'
import { AppRouter } from '../AppRouter'

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listMine: vi.fn()
  }
}))

describe('AppRouter authentication rendering', () => {
  it('redirects unauthenticated users from protected routes to login', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn()
    })

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppRouter />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Employee Login' })).toBeInTheDocument()
  })

  it('renders protected jobs route for authenticated employee role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        employeeId: 'employee-1',
        username: 'employee',
        firstName: 'Casey',
        lastName: 'Tech',
        role: 'Employee',
        email: 'employee@example.com'
      },
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
    expect(screen.getByText('Casey Tech')).toBeInTheDocument()
    expect(await screen.findByText('No assigned jobs found.')).toBeInTheDocument()
  })
})
