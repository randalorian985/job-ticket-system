import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/httpClient'
import { usersApi } from '../../../api/usersApi'
import type { CreateUserDto, UpdateUserDto, UserDto } from '../../../types'
import { Errorable } from '../common/Errorable'

type UserRole = 'Employee' | 'Manager' | 'Admin'
type UserStatusFilter = 'all' | 'active' | 'inactive'

const userRoles: UserRole[] = ['Employee', 'Manager', 'Admin']

const emptyUserDraft = (): CreateUserDto => ({
  userName: '',
  email: '',
  firstName: '',
  lastName: '',
  role: 'Employee',
  password: ''
})

const userDisplayName = (user: UserDto) => `${user.firstName} ${user.lastName}`.trim() || user.userName || 'Unnamed user'
const statusLabel = (user: UserDto) => user.isArchived || user.status !== 1 ? 'Inactive' : 'Active'

const userRequestErrorMessage = (requestError: unknown, fallback: string) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return requestError.message
    if (requestError.status === 401 || requestError.status === 403) return 'Only Admin users can manage user accounts.'
    if (requestError.status === 404) return 'The selected user could not be found. Refresh the list and try again.'
    if (requestError.status >= 500) return 'The server could not complete the user-management request right now.'
    return requestError.message
  }

  return fallback
}

export function UsersPage() {
  const [activeScreen, setActiveScreen] = useState<'list' | 'editor'>('list')
  const [items, setItems] = useState<UserDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editing, setEditing] = useState<UserDto | null>(null)
  const [passwordByUserId, setPasswordByUserId] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<CreateUserDto>(emptyUserDraft)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all')

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    return items.filter((user) => {
      const inactive = statusLabel(user) === 'Inactive'
      const searchableText = [
        userDisplayName(user),
        user.userName,
        user.email,
        user.role,
        statusLabel(user)
      ].filter(Boolean).join(' ').toLowerCase()

      if (normalizedSearch && !searchableText.includes(normalizedSearch)) return false
      if (roleFilter !== 'all' && user.role !== roleFilter) return false
      if (statusFilter === 'active' && inactive) return false
      if (statusFilter === 'inactive' && !inactive) return false

      return true
    })
  }, [items, roleFilter, searchText, statusFilter])

  const resetFilters = () => {
    setSearchText('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const load = async () => {
    try {
      setError(null)
      setIsLoading(true)
      setItems(await usersApi.list())
    } catch (requestError) {
      setError(userRequestErrorMessage(requestError, 'Unable to load users.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const validateDraft = () => {
    if (!draft.userName.trim()) return 'Username is required.'
    if (!draft.firstName.trim()) return 'First name is required.'
    if (!draft.lastName.trim()) return 'Last name is required.'
    if (!userRoles.includes(draft.role as UserRole)) return 'Choose a valid role: Employee, Manager, or Admin.'
    if (!editing && !draft.password.trim()) return 'Temporary password is required when creating a user.'
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) return 'Enter a valid email address or leave email blank.'
    return null
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateDraft()
    if (validationError) {
      setError(validationError)
      setSuccess(null)
      return
    }

    try {
      setError(null)
      setSuccess(null)
      setIsSaving(true)
      const payload = {
        userName: draft.userName.trim(),
        email: draft.email?.trim() || null,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        role: draft.role
      }

      if (editing) {
        if (editing.role !== draft.role) {
          const confirmed = window.confirm(`Change ${userDisplayName(editing)} from ${editing.role} to ${draft.role}? Role changes affect access immediately.`)
          if (!confirmed) return
        }

        await usersApi.update(editing.id, payload as UpdateUserDto)
        setSuccess(`${payload.firstName} ${payload.lastName} was updated.`)
      } else {
        await usersApi.create({ ...payload, password: draft.password } as CreateUserDto)
        setSuccess(`${payload.firstName} ${payload.lastName} was created.`)
      }

      setEditing(null)
      setDraft(emptyUserDraft())
      await load()
      setActiveScreen('list')
    } catch (requestError) {
      setError(userRequestErrorMessage(requestError, editing ? 'Unable to update user.' : 'Unable to create user.'))
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (user: UserDto) => {
    setEditing(user)
    setError(null)
    setSuccess(null)
    setDraft({
      userName: user.userName ?? '',
      email: user.email ?? '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: ''
    })
    setActiveScreen('editor')
  }

  const startCreate = () => {
    setEditing(null)
    setDraft(emptyUserDraft())
    setError(null)
    setSuccess(null)
    setActiveScreen('editor')
  }

  const cancelEdit = () => {
    setEditing(null)
    setDraft(emptyUserDraft())
    setError(null)
    setActiveScreen('list')
  }

  const archiveUser = async (user: UserDto) => {
    const confirmed = window.confirm(`Deactivate ${userDisplayName(user)}? They will lose active access after this change.`)
    if (!confirmed) return

    try {
      setError(null)
      setSuccess(null)
      setBusyUserId(user.id)
      await usersApi.archive(user.id)
      setSuccess(`${userDisplayName(user)} was deactivated.`)
      await load()
    } catch (requestError) {
      setError(userRequestErrorMessage(requestError, 'Unable to deactivate user.'))
    } finally {
      setBusyUserId(null)
    }
  }

  const resetPassword = async (user: UserDto) => {
    const newPassword = passwordByUserId[user.id]?.trim() ?? ''
    if (!newPassword) {
      setError('New password is required before resetting a password.')
      setSuccess(null)
      return
    }

    const confirmed = window.confirm(`Reset password for ${userDisplayName(user)}? Share the new temporary password only through an approved secure channel.`)
    if (!confirmed) return

    try {
      setError(null)
      setSuccess(null)
      setBusyUserId(user.id)
      await usersApi.resetPassword(user.id, { newPassword })
      setPasswordByUserId((prev) => ({ ...prev, [user.id]: '' }))
      setSuccess(`Password was reset for ${userDisplayName(user)}.`)
    } catch (requestError) {
      setError(userRequestErrorMessage(requestError, 'Unable to reset password.'))
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <section className="stack">
      <header className="card stack">
        <div className="report-results-heading">
          <div>
            <p className="muted"><Link to="/manage">Service Operations</Link> / User Management</p>
            <h2>User Management</h2>
            <p className="muted">Admin-only controls for account access, roles, deactivation, and password reset.</p>
          </div>
          {activeScreen === 'list' ? <button type="button" onClick={startCreate}>Create user</button> : null}
        </div>
      </header>
      <Errorable error={error} />

      {activeScreen === 'editor' ? <article className="card stack">
        <div>
          <h3>{editing ? `Edit ${userDisplayName(editing)}` : 'Create user account'}</h3>
          <p className="muted">Complete this focused account form, then return to the user list.</p>
        </div>
        <form onSubmit={save} className="stack" aria-label={editing ? 'Edit user' : 'Create user'}>
          <div className="form-grid">
            <label>Username<input aria-label="Username" value={draft.userName} onChange={(e) => setDraft({ ...draft, userName: e.target.value })} /></label>
            <label>Email<input aria-label="Email" type="email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="optional" /></label>
            <label>First name<input aria-label="First name" value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label>
            <label>Last name<input aria-label="Last name" value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label>
            <label>Role<select aria-label="Role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>{userRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
            {editing ? <p className="muted role-warning">Role changes are confirmed before save because they change which screens a user can access.</p> : <label>Temporary password<input aria-label="Temporary password" type="password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} autoComplete="new-password" /></label>}
          </div>
          <div className="row form-actions">
            <button type="submit" disabled={isSaving}>{isSaving ? 'Saving user...' : editing ? 'Save user changes' : 'Create user'}</button>
            <button type="button" className="secondary-button" onClick={cancelEdit} disabled={isSaving}>Back to users</button>
          </div>
        </form>
      </article> : null}

      {activeScreen === 'list' ? <article className="card stack" aria-label="user account results" aria-live="polite">
        <div className="report-results-heading">
          <div>
            <h3>Users</h3>
            <p className="muted">{isLoading ? 'Loading user accounts…' : `${filteredItems.length} of ${items.length} account${items.length === 1 ? '' : 's'} visible`}</p>
          </div>
        </div>
        <div className="master-data-filters" aria-label="user account filters">
          <label>
            Search users
            <input
              aria-label="User account search"
              placeholder="Name, username, email, role, or status"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>
          <label>
            Role
            <select aria-label="User role filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | 'all')}>
              <option value="all">All roles</option>
              {userRoles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </label>
          <label>
            Status
            <select aria-label="User status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UserStatusFilter)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <button type="button" className="secondary-button" onClick={resetFilters}>Reset filters</button>
        </div>
        {isLoading ? <p className="muted">Loading user accounts…</p> : null}
        {success ? <p className="success action-feedback-panel">{success}</p> : null}
        {!isLoading && items.length === 0 && !error ? <p className="muted">No users have been created yet. Create the first user to begin account setup.</p> : null}
        {!isLoading && items.length > 0 && filteredItems.length === 0 && !error ? <p className="muted empty-state">No user accounts match the current filters.</p> : null}
        {filteredItems.length > 0 ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((user) => {
                  const busy = busyUserId === user.id
                  const inactive = statusLabel(user) === 'Inactive'
                  const displayName = userDisplayName(user)

                  return (
                    <tr key={user.id}>
                      <td>{displayName}</td>
                      <td>{user.userName ?? '—'}</td>
                      <td>{user.email ?? '—'}</td>
                      <td><span className="status-pill">{user.role}</span></td>
                      <td>
                        <span className={inactive ? 'status-pill inactive' : 'status-pill active'}>
                          {statusLabel(user)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button type="button" onClick={() => startEdit(user)} disabled={busy}>Edit</button>
                          <button type="button" className="danger-button" onClick={() => archiveUser(user)} disabled={busy || inactive}>
                            {busy ? 'Working…' : inactive ? 'Deactivated' : 'Deactivate'}
                          </button>
                          <label className="sr-label">
                            New password for {displayName}
                            <input
                              aria-label={`New password for ${displayName}`}
                              type="password"
                              placeholder="New temporary password"
                              value={passwordByUserId[user.id] ?? ''}
                              onChange={(event) => setPasswordByUserId((prev) => ({ ...prev, [user.id]: event.target.value }))}
                              autoComplete="new-password"
                              disabled={busy}
                            />
                          </label>
                          <button type="button" className="secondary-button" onClick={() => resetPassword(user)} disabled={busy}>
                            {busy ? 'Working…' : 'Reset password'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </article> : null}
    </section>
  )
}

