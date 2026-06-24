import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { useAuth } from '../../features/auth/AuthContext'
import { useCompanyBranding } from '../../features/companyBranding/CompanyBrandingContext'

export function LoginPage() {
  const { user, login, logout } = useAuth()
  const { configuration, logoUrl, initials } = useCompanyBranding()
  const navigate = useNavigate()
  const location = useLocation()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user?.role === 'Employee') {
    return <Navigate to="/jobs" replace />
  }

  if (user?.role === 'Manager' || user?.role === 'Admin') {
    return <Navigate to="/manage" replace />
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await login({ usernameOrEmail, password })
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname
      navigate(from ?? '/', { replace: true })
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message)
      } else {
        setError('Unable to sign in right now. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mobile-shell login-page">
      <section className="card login-card">
        <header className="login-heading">
          {logoUrl ? (
            <img className="login-logo" src={logoUrl} alt={`${configuration.companyName} logo`} />
          ) : (
            <span className="product-mark" aria-hidden="true">{initials}</span>
          )}
          <div>
            <p className="eyebrow">{configuration.companyName}</p>
            <h1>Sign in</h1>
            <p className="muted">Open assigned jobs or the Manager/Admin console.</p>
          </div>
        </header>

        {user ? (
          <div className="stack">
            <p className="error">This screen is for employees only. Please sign in with an employee account.</p>
            <button onClick={logout}>Sign out current user</button>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="stack">
          <label>
            Username or Email
            <input
              value={usernameOrEmail}
              onChange={(event) => setUsernameOrEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  )
}
