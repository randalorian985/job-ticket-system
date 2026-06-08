import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

type ManagerNavItem = {
  label: string
  to: string
  end?: boolean
  adminOnly?: boolean
}

type ManagerNavGroup = {
  label: string
  items: ManagerNavItem[]
}

const navGroups: ManagerNavGroup[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', to: '/manage', end: true },
      { label: 'Job Tickets', to: '/manage/job-tickets' },
      { label: 'Time Approval', to: '/manage/time-approval' },
      { label: 'Parts Approval', to: '/manage/parts-approval' },
      { label: 'Reports', to: '/manage/reports' }
    ]
  },
  {
    label: 'Customers & Equipment',
    items: [
      { label: 'Customers', to: '/manage/customers' },
      { label: 'Service Locations', to: '/manage/service-locations' },
      { label: 'Equipment', to: '/manage/equipment' }
    ]
  },
  {
    label: 'Parts & Supply',
    items: [
      { label: 'Parts', to: '/manage/parts' },
      { label: 'Part Requests', to: '/manage/part-requests' },
      { label: 'Inventory', to: '/manage/inventory' },
      { label: 'Purchasing', to: '/manage/purchasing' },
      { label: 'Parts Usage History', to: '/manage/parts-usage-history' }
    ]
  },
  {
    label: 'Admin',
    items: [{ label: 'Users', to: '/manage/users', adminOnly: true }]
  }
]

const navLinkClassName = ({ isActive }: { isActive: boolean }) => (isActive ? 'active-nav-link' : undefined)

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
        <nav className="manager-nav-groups" aria-label="manager navigation">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin)
            if (!visibleItems.length) {
              return null
            }

            return (
              <section className="manager-nav-group" aria-label={group.label} key={group.label}>
                <span className="manager-nav-group-label">{group.label}</span>
                <div className="inline-links">
                  {visibleItems.map((item) => (
                    <NavLink className={navLinkClassName} end={item.end} key={item.to} to={item.to}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </section>
            )
          })}
        </nav>
      </header>
      <Outlet />
    </main>
  )
}
