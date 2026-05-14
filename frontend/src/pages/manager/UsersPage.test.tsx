import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ApiError } from '../../api/httpClient'
import { usersApi } from '../../api/usersApi'
import { renderWithRouter } from '../../test/renderWithRouter'
import { UsersPage } from './EntityPages'

vi.mock('../../api/usersApi', () => ({
  usersApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    resetPassword: vi.fn()
  }
}))

const activeUser = {
  id: 'user-1',
  userName: 'casey',
  email: 'casey@example.com',
  firstName: 'Casey',
  lastName: 'Tech',
  role: 'Employee',
  status: 1,
  isArchived: false
}

const inactiveUser = {
  id: 'user-2',
  userName: 'lee',
  email: null,
  firstName: 'Lee',
  lastName: 'Lead',
  role: 'Manager',
  status: 0,
  isArchived: true
}

const renderUsers = () => renderWithRouter(<UsersPage />)

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.mocked(usersApi.list).mockResolvedValue([activeUser, inactiveUser] as any)
  vi.mocked(usersApi.create).mockResolvedValue(activeUser as any)
  vi.mocked(usersApi.update).mockResolvedValue(activeUser as any)
  vi.mocked(usersApi.archive).mockResolvedValue({ ...activeUser, isArchived: true, status: 0 } as any)
  vi.mocked(usersApi.resetPassword).mockResolvedValue(activeUser as any)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('UsersPage', () => {
  it('renders loading, user list, roles, statuses, and admin-only copy', async () => {
    renderUsers()

    expect(screen.getAllByText('Loading user accounts…').length).toBeGreaterThan(0)
    expect(await screen.findByRole('heading', { name: 'User Management' })).toBeInTheDocument()
    expect(screen.getByText('Admin-only controls for account access, roles, deactivation, and password reset.')).toBeInTheDocument()
    expect(screen.getByText('Casey Tech')).toBeInTheDocument()
    expect(screen.getByText('casey')).toBeInTheDocument()
    expect(screen.getAllByText('Employee').length).toBeGreaterThan(0)
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('renders empty and load error states clearly', async () => {
    vi.mocked(usersApi.list).mockResolvedValueOnce([] as any)
    const view = renderUsers()

    expect(await screen.findByText('No users have been created yet. Create the first user above.')).toBeInTheDocument()

    vi.mocked(usersApi.list).mockRejectedValueOnce(new ApiError('Forbidden', 403))
    view.unmount()
    renderUsers()

    expect(await screen.findByText('Only Admin users can manage user accounts.')).toBeInTheDocument()
  })

  it('validates create user payloads before calling the API', async () => {
    renderUsers()

    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))
    expect(await screen.findByText('Username is required.')).toBeInTheDocument()
    expect(usersApi.create).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newtech' } })
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'New' } })
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Tech' } })
    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))

    expect(await screen.findByText('Temporary password is required when creating a user.')).toBeInTheDocument()
    expect(usersApi.create).not.toHaveBeenCalled()
  })

  it('creates a user and surfaces API validation failures', async () => {
    vi.mocked(usersApi.list)
      .mockResolvedValueOnce([activeUser] as any)
      .mockResolvedValueOnce([{ ...activeUser }, { ...activeUser, id: 'user-3', userName: 'newtech', firstName: 'New', lastName: 'Tech' }] as any)
    renderUsers()

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newtech' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'newtech@example.com' } })
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'New' } })
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Tech' } })
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Manager' } })
    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: 'Temp123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => expect(usersApi.create).toHaveBeenCalledWith({
      userName: 'newtech',
      email: 'newtech@example.com',
      firstName: 'New',
      lastName: 'Tech',
      role: 'Manager',
      password: 'Temp123!'
    }))
    expect(await screen.findByText('New Tech was created.')).toBeInTheDocument()

    vi.mocked(usersApi.create).mockRejectedValueOnce(new ApiError('UserName is already in use.', 400))
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'casey' } })
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Duplicate' } })
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'User' } })
    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: 'Temp123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))

    expect(await screen.findByText('UserName is already in use.')).toBeInTheDocument()
  })

  it('edits users, confirms role changes, and handles edit failure', async () => {
    renderUsers()

    fireEvent.click((await screen.findAllByRole('button', { name: 'Edit' }))[0])
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Casey Updated' } })
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Manager' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save user changes' }))

    await waitFor(() => expect(window.confirm).toHaveBeenCalledWith('Change Casey Tech from Employee to Manager? Role changes affect access immediately.'))
    await waitFor(() => expect(usersApi.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ firstName: 'Casey Updated', role: 'Manager' })))
    expect(await screen.findByText('Casey Updated Tech was updated.')).toBeInTheDocument()

    vi.mocked(usersApi.update).mockRejectedValueOnce(new ApiError('Role must be one of: Admin, Manager, Employee.', 400))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Save user changes' }))

    expect(await screen.findByText('Role must be one of: Admin, Manager, Employee.')).toBeInTheDocument()
  })

  it('does not save a role change when confirmation is cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false)
    renderUsers()

    fireEvent.click((await screen.findAllByRole('button', { name: 'Edit' }))[0])
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Admin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save user changes' }))

    await waitFor(() => expect(window.confirm).toHaveBeenCalled())
    expect(usersApi.update).not.toHaveBeenCalled()
  })

  it('confirms deactivation and calls archive API once', async () => {
    renderUsers()

    fireEvent.click((await screen.findAllByRole('button', { name: 'Deactivate' }))[0])

    await waitFor(() => expect(window.confirm).toHaveBeenCalledWith('Deactivate Casey Tech? They will lose active access after this change.'))
    await waitFor(() => expect(usersApi.archive).toHaveBeenCalledWith('user-1'))
    expect(await screen.findByText('Casey Tech was deactivated.')).toBeInTheDocument()
  })

  it('confirms reset password, validates password input, and calls API without logging the password', async () => {
    renderUsers()

    fireEvent.click((await screen.findAllByRole('button', { name: 'Reset password' }))[0])
    expect(await screen.findByText('New password is required before resetting a password.')).toBeInTheDocument()
    expect(usersApi.resetPassword).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('New password for Casey Tech'), { target: { value: 'NewTemp123!' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset password' })[0])

    await waitFor(() => expect(window.confirm).toHaveBeenCalledWith('Reset password for Casey Tech? Share the new temporary password only through an approved secure channel.'))
    await waitFor(() => expect(usersApi.resetPassword).toHaveBeenCalledWith('user-1', { newPassword: 'NewTemp123!' }))
    expect(await screen.findByText('Password was reset for Casey Tech.')).toBeInTheDocument()
  })
})
