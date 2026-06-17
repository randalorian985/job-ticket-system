import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import './ManagerShell.css'

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
      { label: 'Reports', to: '/manage/reports' },
      { label: 'Wiki', to: '/manage/wiki' }
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

const isRouteActive = (pathname: string, item: ManagerNavItem) => {
  if (item.end) {
    return pathname === item.to
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function ManagerShell() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const location = useLocation()
  const navigate = useNavigate()
  const [openMenuLabel, setOpenMenuLabel] = useState<string | null>(null)
  const desktopNavRef = useRef<HTMLElement | null>(null)
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || isAdmin)
    }))
    .filter((group) => group.items.length)
  const visibleNavItems = visibleNavGroups.flatMap((group) => group.items)
  const activeNavItem = [...visibleNavItems]
    .sort((left, right) => right.to.length - left.to.length)
    .find((item) => isRouteActive(location.pathname, item))
  const selectedNavValue = activeNavItem?.to ?? '/manage'

  useEffect(() => {
    setOpenMenuLabel(null)
  }, [location.pathname])

  useEffect(() => {
    if (!openMenuLabel) return

    const closeMenuOnOutsidePointer = (event: PointerEvent) => {
      if (desktopNavRef.current?.contains(event.target as Node)) return
      setOpenMenuLabel(null)
    }

    document.addEventListener('pointerdown', closeMenuOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeMenuOnOutsidePointer)
  }, [openMenuLabel])

  return (
    <main className="desktop-shell manager-shell">
      <header className="manager-header">
        <div className="manager-header-main">
          <div>
            <p className="eyebrow">Job Ticket System</p>
            <h1>Service Operations</h1>
            <p className="muted">{user?.firstName} {user?.lastName} · {user?.role}</p>
          </div>
          <button className="secondary-button logout-button" onClick={logout}>Logout</button>
        </div>
        <div className="manager-mobile-nav">
          <label htmlFor="manager-mobile-section">Jump to screen</label>
          <select
            aria-label="Manager section navigation"
            id="manager-mobile-section"
            onChange={(event) => navigate(event.target.value)}
            value={selectedNavValue}
          >
            {visibleNavGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((item) => (
                  <option key={item.to} value={item.to}>{item.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="manager-mobile-nav-hint">Use this screen picker when the full Manager/Admin menu is collapsed.</span>
        </div>
        <nav
          className="manager-desktop-nav"
          aria-label="manager navigation"
          ref={desktopNavRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpenMenuLabel(null)
          }}
        >
          <div className="manager-primary-links">
            {visibleNavGroups[0]?.items.map((item) => (
              <NavLink className={navLinkClassName} end={item.end} key={item.to} onClick={() => setOpenMenuLabel(null)} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="manager-nav-menus">
            {visibleNavGroups.slice(1).map((group) => {
              const groupIsActive = group.items.some((item) => isRouteActive(location.pathname, item))
              const isOpen = openMenuLabel === group.label

              return (
                <details
                  className={`manager-nav-menu${groupIsActive ? ' manager-nav-menu-active' : ''}`}
                  key={group.label}
                  onToggle={(event) => {
                    if (event.currentTarget.open) {
                      setOpenMenuLabel(group.label)
                    } else if (openMenuLabel === group.label) {
                      setOpenMenuLabel(null)
                    }
                  }}
                  aria-expanded={isOpen}
                  open={isOpen}
                >
                  <summary>{group.label}</summary>
                  <div className="manager-nav-menu-panel">
                    {group.items.map((item) => (
                      <NavLink className={navLinkClassName} end={item.end} key={item.to} onClick={() => setOpenMenuLabel(null)} to={item.to}>
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </details>
              )
            })}
          </div>
        </nav>
      </header>
      <Outlet />
    </main>
  )
}
