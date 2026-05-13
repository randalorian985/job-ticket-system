import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <section className="card">
      <h2>Access Denied</h2>
      <p className="muted">Your account does not have permission for this route.</p>
      <p><Link to="/">Go to home</Link></p>
    </section>
  )
}
