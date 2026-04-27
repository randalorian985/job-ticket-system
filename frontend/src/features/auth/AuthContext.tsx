import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../../api/authApi'
import { authStorage, ApiError } from '../../api/httpClient'
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

  const login = async (payload: AuthLoginRequestDto) => {
    const response = await authApi.login(payload)
    authStorage.setToken(response.accessToken)

    try {
      const me = await authApi.me()
      setUser(me)
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
