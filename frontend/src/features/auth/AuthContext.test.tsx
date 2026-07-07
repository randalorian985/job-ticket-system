import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../../api/authApi'
import { authStorage } from '../../api/httpClient'
import { NotificationBanner } from '../../components/NotificationBanner'
import type { AuthMeDto } from '../../types'
import { NotificationProvider, useNotification } from '../notifications/NotificationContext'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn()
  }
}))

const currentUser: AuthMeDto = {
  employeeId: 'employee-1',
  username: 'manager',
  email: 'manager@example.com',
  firstName: 'Manny',
  lastName: 'Manager',
  role: 'Manager'
}

const mockedAuthApi = vi.mocked(authApi)

function AuthHarness() {
  const { login } = useAuth()
  const { notify } = useNotification()

  return (
    <>
      <button onClick={() => notify('Your session expired. Please sign in again.', 'warning')}>
        show expired banner
      </button>
      <button onClick={() => void login({ usernameOrEmail: 'manager', password: 'secret' })}>
        log in
      </button>
      <NotificationBanner />
    </>
  )
}

function renderAuthHarness() {
  return render(
    <NotificationProvider>
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    </NotificationProvider>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedAuthApi.login.mockResolvedValue({
      accessToken: 'fresh-token',
      expiresAtUtc: '2026-07-07T12:00:00Z',
      user: currentUser
    })
    mockedAuthApi.me.mockResolvedValue(currentUser)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('clears stale session banners after a successful login', async () => {
    renderAuthHarness()

    fireEvent.click(screen.getByRole('button', { name: 'show expired banner' }))
    expect(screen.getByText('Your session expired. Please sign in again.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'log in' }))

    await waitFor(() => expect(authStorage.getToken()).toBe('fresh-token'))
    await waitFor(() => {
      expect(screen.queryByText('Your session expired. Please sign in again.')).not.toBeInTheDocument()
    })
  })
})
