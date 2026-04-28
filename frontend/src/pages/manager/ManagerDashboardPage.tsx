import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

export function ManagerDashboardPage() {
  const { user } = useAuth()
  const links = [
    { to: '/manage/job-tickets', label: 'Job Tickets' },
    { to: '/manage/customers', label: 'Customers' },
    { to: '/manage/service-locations', label: 'Service Locations' },
    { to: '/manage/equipment', label: 'Equipment' },
    { to: '/manage/parts', label: 'Parts' },
    { to: '/manage/time-approval', label: 'Time Approval' },
    { to: '/manage/parts-approval', label: 'Parts Approval' },
    { to: '/manage/reports', label: 'Reports' }
  ]

  if (user?.role === 'Admin') {
    links.push({ to: '/manage/users', label: 'Users' })
  }

  return (
    <section className="stack">
      <article className="card">
        <h2>Operations Dashboard</h2>
        <p className="muted">Read-first operational visibility for manager and admin users.</p>
      </article>
      <section className="dashboard-grid">
        {links.map((item) => (
          <Link key={item.to} className="card nav-card" to={item.to}>
            <h3>{item.label}</h3>
          </Link>
        ))}
      </section>
    </section>
  )
}
