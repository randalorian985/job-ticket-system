import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

export function ManagerShell() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'Admin'

  return (
    <main className="desktop-shell manager-shell">
      <header className="manager-header">
        <div className="manager-header-main">
          <div>
            <h1>Manager/Admin Console</h1>
            <p className="muted">{user?.firstName} {user?.lastName} ({user?.role})</p>
          </div>
          <button className="secondary-button logout-button" onClick={logout}>Logout</button>
        </div>
        <nav className="inline-links" aria-label="manager navigation">
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} end to="/manage">Dashboard</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/job-tickets">Job Tickets</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/customers">Customers</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/service-locations">Service Locations</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/equipment">Equipment</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/parts">Parts</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/inventory">Inventory</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/purchasing">Purchasing</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/parts-usage-history">Parts Usage History</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/time-approval">Time Approval</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/parts-approval">Parts Approval</NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/reports">Reports</NavLink>
          {isAdmin ? <NavLink className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)} to="/manage/users">Users</NavLink> : null}
        </nav>
      </header>
      <Outlet />
    </main>
  )
}
