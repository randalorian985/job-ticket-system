import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { filesApi } from '../../api/filesApi'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { usersApi } from '../../api/usersApi'
import { useAuth } from '../../features/auth/AuthContext'
import { routerFuture } from '../../routes/routerFuture'
import { JobTicketDetailPage } from './JobTicketDetailPage'

vi.mock('../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../api/timeEntriesApi', () => ({ timeEntriesApi: { listByJob: vi.fn() } }))
vi.mock('../../api/filesApi', () => ({ filesApi: { list: vi.fn(), getDownloadUrl: vi.fn(() => '#') } }))
vi.mock('../../api/usersApi', () => ({ usersApi: { list: vi.fn() } }))
vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { get: vi.fn(), listAssignments: vi.fn(), listWorkEntries: vi.fn(), listParts: vi.fn(), changeStatus: vi.fn(), archive: vi.fn(), addAssignment: vi.fn(), removeAssignment: vi.fn(), update: vi.fn() } }))
vi.mock('../../api/masterDataApi', () => ({ masterDataApi: { listCustomers: vi.fn(), listServiceLocations: vi.fn(), listEquipment: vi.fn() } }))

describe('JobTicketDetailPage', () => {
  const setupBaseMocks = () => {
    vi.spyOn(window, 'print').mockImplementation(() => undefined)
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Manager' } } as any)
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      equipmentId: 'eq1',
      title: 'Issue',
      description: 'Replace leaking hose and confirm restart.',
      jobType: 'Repair',
      priority: 2,
      status: 3,
      requestedAtUtc: '2026-04-01T08:00:00Z',
      scheduledStartAtUtc: '2026-04-02T09:30:00Z',
      dueAtUtc: '2026-04-03T17:00:00Z',
      purchaseOrderNumber: 'PO-44',
      billingContactName: 'Casey Customer',
      billingContactPhone: '555-0100',
      billingContactEmail: 'casey@example.com',
      internalNotes: 'Manager-only note',
      customerFacingNotes: 'Call before arrival.'
    } as any)
    vi.mocked(jobTicketsApi.listAssignments).mockResolvedValue([{ employeeId: 'e1', assignedAtUtc: '2026-04-01T08:15:00Z', isLead: true }] as any)
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([{ id: 'w1', performedAtUtc: '2026-04-01T12:00:00Z', notes: 'Replaced belt' }] as any)
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([{ id: 'p1', partId: 'part-1', quantity: 2, approvalStatus: 1, notes: 'Pilot stock' }] as any)
    vi.mocked(timeEntriesApi.listByJob).mockResolvedValue([{ id: 't1', employeeId: 'e1', startedAtUtc: '2026-04-01T09:00:00Z', endedAtUtc: '2026-04-01T10:00:00Z', laborHours: 1.5, billableHours: 1, approvalStatus: 1, workSummary: 'Checked motor' }] as any)
    vi.mocked(filesApi.list).mockResolvedValue([{ id: 'f1', jobTicketId: 'j1', originalFileName: 'photo.jpg' }] as any)
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 's1', locationName: 'HQ' }] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([{ id: 'eq1', name: 'Truck 7' }] as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupBaseMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const renderPage = () => {
    render(<MemoryRouter future={routerFuture} initialEntries={['/manage/job-tickets/j1']}><Routes><Route path="/manage/job-tickets/:jobTicketId" element={<JobTicketDetailPage />} /></Routes></MemoryRouter>)
  }

  const expectAtLeastOneText = (text: string) => {
    expect(screen.getAllByText(text).length).toBeGreaterThan(0)
  }

  const expectTextContaining = (text: string) => {
    const matches = screen.getAllByText((_, element) => Boolean(element?.textContent?.includes(text)))
    expect(matches.length).toBeGreaterThan(0)
  }

  it('renders dispatch, closeout, archive, and assignment actions alongside job details', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Dispatch Readiness')).toBeInTheDocument()
    expectAtLeastOneText('Ready for dispatch review')
    expect(screen.getByText('Closeout & Invoice Readiness')).toBeInTheDocument()
    expect(screen.getByText('Status Review')).toBeInTheDocument()
    expect(screen.getByText('Archive Review')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose a new status' })).toBeDisabled()
    expect(screen.getByText('Labor / Work Entries')).toBeInTheDocument()
    expect(screen.getByText('Parts Usage')).toBeInTheDocument()
    expect(screen.getByText('Files / Photos')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('assignment employee'), { target: { value: 'e2' } })
    fireEvent.click(screen.getByText('Assign Employee'))
    await waitFor(() => expect(jobTicketsApi.addAssignment).toHaveBeenCalledWith('j1', { employeeId: 'e2', isLead: false }))
  })

  it('shows invoice handoff readiness when closeout signals are complete', async () => {
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      equipmentId: 'eq1',
      title: 'Issue',
      description: 'Replace leaking hose and confirm restart.',
      priority: 2,
      status: 7,
      scheduledStartAtUtc: '2026-04-02T09:30:00Z',
      purchaseOrderNumber: 'PO-44',
      customerFacingNotes: 'Work complete.'
    } as any)
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([{ id: 'p1', partId: 'part-1', quantity: 2, approvalStatus: 2, notes: 'Approved stock' }] as any)
    vi.mocked(timeEntriesApi.listByJob).mockResolvedValue([{ id: 't1', employeeId: 'e1', startedAtUtc: '2026-04-01T09:00:00Z', endedAtUtc: '2026-04-01T10:00:00Z', laborHours: 1.5, billableHours: 1, approvalStatus: 2, workSummary: 'Checked motor' }] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Ready for invoice handoff')).toBeInTheDocument()
    expect(screen.getByText('Labor, time approval, parts, files/photos, notes, and billing handoff context are ready for invoice review.')).toBeInTheDocument()
  })

  it('treats no-equipment detail context as dispatch-ready when the other dispatch signals are complete', async () => {
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      equipmentId: null,
      title: 'Issue',
      description: 'Replace leaking hose and confirm restart.',
      priority: 2,
      status: 3,
      requestedAtUtc: '2026-04-01T08:00:00Z',
      scheduledStartAtUtc: '2026-04-02T09:30:00Z',
      dueAtUtc: '2026-04-03T17:00:00Z',
      purchaseOrderNumber: 'PO-44',
      customerFacingNotes: 'Work complete.'
    } as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expectAtLeastOneText('Ready for dispatch review')
    expectTextContaining('no-equipment context is allowed for this ticket')
  })

  it('warns when dispatch coverage is incomplete', async () => {
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      title: 'Issue',
      priority: 2,
      status: 2,
      scheduledStartAtUtc: null,
      dueAtUtc: null
    } as any)
    vi.mocked(jobTicketsApi.listAssignments).mockResolvedValue([] as any)

    renderPage()

    await screen.findAllByText('Needs attention')
    expectAtLeastOneText('No employees are assigned.')
    expectAtLeastOneText('No lead tech is marked.')
    expectAtLeastOneText('No scheduled start is set.')
    expectAtLeastOneText('No due date is set.')
  })

  it('prevents adding a second lead without clearing the current one first', async () => {
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('assignment employee'), { target: { value: 'e2' } })
    fireEvent.click(screen.getByLabelText('Lead Tech'))
    fireEvent.click(screen.getByText('Assign Employee'))

    expect(await screen.findByText('A lead tech is already assigned. Remove the current lead before setting a new lead.')).toBeInTheDocument()
    expect(jobTicketsApi.addAssignment).not.toHaveBeenCalled()
  })

  it('shows status review guidance, enables updates for a real change, and calls the API', async () => {
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Next Status'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update to In Progress' }))

    await waitFor(() => expect(jobTicketsApi.changeStatus).toHaveBeenCalledWith('j1', { status: 4 }))
    expect(await screen.findByText('Status updated.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose a new status' })).toBeDisabled()
  })

  it('feeds closeout warnings into invoice status review', async () => {
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Next Status'), { target: { value: '9' } })

    expect(screen.getByText('Invoice readiness: Some loaded time entries still need approval review.')).toBeInTheDocument()
    expect(screen.getByText('Invoice readiness: Parts are recorded, but none are approved for invoice review.')).toBeInTheDocument()
    expect(screen.getByText('Invoice readiness: Move the ticket to Completed before invoice handoff review.')).toBeInTheDocument()
  })

  it('surfaces API validation feedback when a status update is rejected', async () => {
    vi.mocked(jobTicketsApi.changeStatus).mockRejectedValue(new ApiError('Status change blocked', 400, undefined))
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Next Status'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update to Invoiced' }))

    expect(await screen.findByText('Status change blocked')).toBeInTheDocument()
  })

  it('prints the browser job review page without adding server exports', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Print Job Review'))

    expect(window.print).toHaveBeenCalled()
  })

  it('shows confirmation before archive API call', async () => {
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Archive Reason'), { target: { value: 'Duplicate ticket' } })
    fireEvent.click(screen.getByText('Review Archive'))

    expect(screen.getByLabelText('archive confirmation')).toBeInTheDocument()
    expect(jobTicketsApi.archive).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Confirm Archive'))
    expect(jobTicketsApi.archive).toHaveBeenCalledWith('j1', { archiveReason: 'Duplicate ticket' })
  })

  it('shows success feedback after archive confirmation succeeds', async () => {
    vi.mocked(jobTicketsApi.archive).mockResolvedValue({} as any)
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Archive Reason'), { target: { value: 'Completed and closed' } })
    fireEvent.click(screen.getByText('Review Archive'))
    fireEvent.click(screen.getByText('Confirm Archive'))

    expect(await screen.findByText('Ticket archived.')).toBeInTheDocument()
  })

  it('shows API validation feedback after archive confirmation fails', async () => {
    vi.mocked(jobTicketsApi.archive).mockRejectedValue(new ApiError('Archive blocked', 400, undefined))
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Archive Reason'), { target: { value: 'Invalid closure' } })
    fireEvent.click(screen.getByText('Review Archive'))
    fireEvent.click(screen.getByText('Confirm Archive'))

    expect(await screen.findByText('Archive blocked')).toBeInTheDocument()
  })
})
