import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../../api/authApi'
import { authStorage, ApiError, registerUnauthorizedHandler, clearUnauthorizedHandler } from '../../api/httpClient'
import { useNotification } from '../notifications/NotificationContext'
import type { AuthLoginRequestDto, AuthMeDto } from '../../types'

type AuthContextValue = {
  user: AuthMeDto | null
  isLoading: boolean
  login: (payload: AuthLoginRequestDto) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthMeDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { notify, clearNotifications } = useNotification()

  // Register a 401 handler so mid-session token expiry shows a clear message
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      authStorage.clearToken()
      setUser(null)
      notify('Your session expired. Please sign in again.', 'warning')
    })
    return () => clearUnauthorizedHandler()
  }, [notify])

  useEffect(() => {
    const token = authStorage.getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    authApi
      .me()
      .then((me) => setUser(me))
      .catch(() => {
        authStorage.clearToken()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Session expiry warning: parse JWT exp and warn 5 min before expiry
  useEffect(() => {
    const token = authStorage.getToken()
    if (!token || !user) return

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresAt = payload.exp * 1000 // ms
      const warnAt5 = expiresAt - 5 * 60 * 1000
      const warnAt1 = expiresAt - 60 * 1000
      const now = Date.now()

      const timers: ReturnType<typeof setTimeout>[] = []

      if (warnAt5 > now) {
        timers.push(setTimeout(() => {
          notify('Your session expires in 5 minutes. Save any work in progress.', 'warning')
        }, warnAt5 - now))
      }

      if (warnAt1 > now) {
        timers.push(setTimeout(() => {
          notify('Your session expires in 1 minute. Please sign in again to continue.', 'error')
        }, warnAt1 - now))
      }

      return () => timers.forEach(clearTimeout)
    } catch {
      // Malformed token — ignore, 401 handler will catch expiry
    }
  }, [user, notify])

  const login = async (payload: AuthLoginRequestDto) => {
    const response = await authApi.login(payload)
    authStorage.setToken(response.accessToken)

    try {
      const me = await authApi.me()
      setUser(me)
      clearNotifications()
    } catch (error) {
      authStorage.clearToken()
      if (error instanceof ApiError) {
        throw error
      }
      throw new Error('Unable to load current user after login.')
    }
  }

  const logout = () => {
    authStorage.clearToken()
    setUser(null)
  }

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
