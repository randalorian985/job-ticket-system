import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

export function ManagerShell() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'Admin'

  return (
    <main className="desktop-shell">
      <header className="card">
        <h1>Manager/Admin Console</h1>
        <p className="muted">{user?.firstName} {user?.lastName} ({user?.role})</p>
        <div className="inline-links">
          <Link to="/manage">Dashboard</Link>
          <Link to="/manage/job-tickets">Job Tickets</Link>
          <Link to="/manage/customers">Customers</Link>
          <Link to="/manage/service-locations">Service Locations</Link>
          <Link to="/manage/equipment">Equipment</Link>
          <Link to="/manage/parts">Parts</Link>
          <Link to="/manage/parts-usage-history">Parts Usage History</Link>
          <Link to="/manage/time-approval">Time Approval</Link>
          <Link to="/manage/parts-approval">Parts Approval</Link>
          <Link to="/manage/reports">Reports</Link>
          {isAdmin ? <Link to="/manage/users">Users</Link> : null}
        </div>
        <button onClick={logout}>Logout</button>
      </header>
      <Outlet />
    </main>
  )
}
