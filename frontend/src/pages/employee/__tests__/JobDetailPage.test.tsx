import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { filesApi } from '../../../api/filesApi'
import { ApiError } from '../../../api/httpClient'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { partRequestsApi } from '../../../api/partRequestsApi'
import { partsApi } from '../../../api/partsApi'
import { timeEntriesApi } from '../../../api/timeEntriesApi'
import { useAuth } from '../../../features/auth/AuthContext'
import { JobDetailPage } from '../JobDetailPage'
import { routerFuture } from '../../../routes/routerFuture'

vi.mock('../../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    get: vi.fn(),
    listWorkEntries: vi.fn(),
    listParts: vi.fn(),
    addWorkEntry: vi.fn(),
    addPart: vi.fn(),
    quickAddPart: vi.fn()
  }
}))

vi.mock('../../../api/partRequestsApi', () => ({
  partRequestsApi: {
    createForJobTicket: vi.fn()
  }
}))

vi.mock('../../../api/partsApi', () => ({
  partsApi: {
    list: vi.fn()
  }
}))

vi.mock('../../../api/filesApi', () => ({
  filesApi: {
    list: vi.fn(),
    upload: vi.fn()
  }
}))

vi.mock('../../../api/timeEntriesApi', () => ({
  timeEntriesApi: {
    getOpen: vi.fn(),
    clockIn: vi.fn(),
    clockOut: vi.fn()
  }
}))

vi.mock('../../../features/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

const mockEmployeeAuth = () => {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      employeeId: 'employee-1',
      username: 'employee',
      firstName: 'Casey',
      lastName: 'Tech',
      role: 'Employee',
      email: 'employee@example.com'
    },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn()
  })
}

const mockJob = (overrides = {}) => {
  vi.mocked(jobTicketsApi.get).mockResolvedValue({
    id: 'job-1',
    ticketNumber: 'JT-2026-000101',
    title: 'Hydraulic Repair',
    description: 'Fix valve leak',
    status: 4,
    priority: 3,
    customerId: 'customer-1',
    serviceLocationId: 'location-1',
    billingPartyCustomerId: 'customer-1',
    equipmentId: 'equipment-1',
    scheduledStartAtUtc: '2026-06-01T15:00:00Z',
    dueAtUtc: '2026-06-02T20:00:00Z',
    ...overrides
  })
}

const renderJobDetail = () =>
  render(
    <MemoryRouter future={routerFuture} initialEntries={['/jobs/job-1']}>
      <Routes>
        <Route path="/jobs/:jobTicketId" element={<JobDetailPage />} />
      </Routes>
    </MemoryRouter>
  )

const mockNoOpenEntry = () => {
  vi.mocked(timeEntriesApi.getOpen).mockImplementation(async () => {
    throw new ApiError('No open time entry.', 404)
  })
}

const mockOpenEntry = (jobTicketId = 'job-1') => {
  vi.mocked(timeEntriesApi.getOpen).mockResolvedValue({
    id: 'time-1',
    jobTicketId,
    employeeId: 'employee-1',
    startedAtUtc: '2026-04-28T09:00:00Z',
    laborHours: 0,
    billableHours: 0,
    approvalStatus: 1,
    clockInLatitude: 1,
    clockInLongitude: 1
  })
}

describe('JobDetailPage', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.mocked(partsApi.list).mockResolvedValue([])
  })

  it('renders ticket details, work entries, parts, files, and ready field context', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([
      {
        id: 'work-1',
        jobTicketId: 'job-1',
        entryType: 1,
        notes: 'Inspected hydraulic lines',
        performedAtUtc: '2026-04-28T10:00:00Z',
        employeeId: 'employee-1'
      }
    ])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([
      {
        id: 'part-row-1',
        jobTicketId: 'job-1',
        partId: 'part-1',
        partNumber: 'P-1',
        partName: 'Valve kit',
        isUnlistedPart: false,
        officeOrderRequested: false,
        quantity: 1,
        notes: 'Valve kit replacement',
        isBillable: true,
        approvalStatus: 1,
        addedAtUtc: '2026-04-28T11:00:00Z',
        addedByEmployeeId: 'employee-1'
      }
    ])
    vi.mocked(filesApi.list).mockResolvedValue([
      {
        id: 'file-1',
        jobTicketId: 'job-1',
        originalFileName: 'before.jpg',
        contentType: 'image/jpeg',
        fileExtension: '.jpg',
        fileSizeBytes: 4096,
        visibility: 1,
        isInvoiceAttachment: false,
        uploadedAtUtc: '2026-04-28T12:00:00Z',
        uploadedByEmployeeId: 'employee-1',
        caption: 'Before photo'
      }
    ])
    mockNoOpenEntry()

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    expect(screen.getByText('Status: In Progress')).toBeInTheDocument()
    expect(screen.getByText('Priority: High')).toBeInTheDocument()
    expect(screen.queryByText(/Billing Party ID/)).not.toBeInTheDocument()
    expect(screen.getByText(/Inspected hydraulic lines/)).toBeInTheDocument()
    expect(screen.getByText(/P-1 - Valve kit/)).toBeInTheDocument()
    expect(screen.getByText(/Added to ticket - Pending review/)).toBeInTheDocument()
    expect(screen.getByText(/before.jpg/)).toBeInTheDocument()

    const fieldContext = screen.getByLabelText('field context review')
    expect(within(fieldContext).getByText('Ready for field work review')).toBeInTheDocument()
    expect(within(fieldContext).getByText('7 / 7')).toBeInTheDocument()
    expect(within(fieldContext).getByText('Field context is complete for assigned work.')).toBeInTheDocument()
    expect(within(fieldContext).getByText('No field-context blockers are visible from the assigned ticket.')).toBeInTheDocument()
    expect(within(fieldContext).getByText('Ticket is in the active field-work queue.')).toBeInTheDocument()
    expect(within(fieldContext).getByText('Job instructions are available.')).toBeInTheDocument()
    expect(screen.getByText('Field context is ready for clock-in.')).toBeInTheDocument()
  })

  it('keeps field recording disabled until the technician clocks into this ticket', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockNoOpenEntry()

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clock In with GPS' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Save Work Note' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add / Request Part' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
    expect(screen.getAllByText('Clock in to this ticket before adding work notes, parts, or photos.').length).toBeGreaterThan(0)
  })

  it('does not show the clock-out form for an open entry on another ticket', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockOpenEntry('job-2')

    renderJobDetail()

    expect(await screen.findByText(/Open entry: Started/)).toHaveTextContent('on another ticket')
    expect(screen.getByRole('link', { name: 'Open active ticket' })).toHaveAttribute('href', '/jobs/job-2')
    expect(screen.queryByRole('button', { name: 'Clock Out with GPS' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clock In with GPS' })).toBeDisabled()
  })

  it('lets technicians select an existing part from the ticket and mark it needs ordered without pricing fields', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(partsApi.list).mockResolvedValue([
      {
        id: 'part-1',
        partNumber: 'HYD-100',
        name: 'Hydraulic Hose',
        description: 'Two wire hose assembly'
      }
    ])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockOpenEntry()
    vi.mocked(partRequestsApi.createForJobTicket).mockResolvedValue({
      id: 'request-1',
      jobTicketId: 'job-1',
      jobTicketNumber: 'JT-2026-000101',
      jobTicketTitle: 'Hydraulic Repair',
      partId: 'part-1',
      partNumber: 'HYD-100',
      partName: 'Hydraulic Hose',
      quantity: 2,
      notes: 'Need hose at the lift',
      isBillable: false,
      needsOrdered: true,
      status: 1,
      requestedAtUtc: '2026-04-28T11:00:00Z'
    })

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    expect(screen.getByLabelText('Find existing part or enter new part')).toBeInTheDocument()
    expect(screen.getByLabelText('Existing parts match')).toBeInTheDocument()
    expect(screen.queryByLabelText('Unit cost')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Billable price')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Vendor')).not.toBeInTheDocument()
    expect(screen.queryByText(/sale price/i)).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Find existing part or enter new part'), 'hyd')
    await user.selectOptions(screen.getByLabelText('Existing parts match'), 'part-1')
    expect(screen.getByText('Selected existing part: HYD-100 - Hydraulic Hose')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Quantity'))
    await user.type(screen.getByLabelText('Quantity'), '2')
    await user.type(screen.getByLabelText('Notes'), 'Need hose at the lift')
    await user.selectOptions(screen.getByLabelText('Urgency'), 'Urgent')
    await user.click(screen.getByRole('button', { name: 'Add / Request Part' }))

    await waitFor(() => {
      expect(partRequestsApi.createForJobTicket).toHaveBeenCalledWith('job-1', {
        partDescription: 'Hydraulic Hose',
        partId: 'part-1',
        needsOrdered: true,
        quantity: 2,
        notes: 'Need hose at the lift',
        urgency: 'Urgent',
        neededByUtc: null
      })
    })
    expect(jobTicketsApi.quickAddPart).not.toHaveBeenCalled()
  })

  it('clears a selected existing part when technicians change the typed part search', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(partsApi.list).mockResolvedValue([
      {
        id: 'part-1',
        partNumber: 'HYD-100',
        name: 'Hydraulic Hose',
        description: 'Two wire hose assembly'
      }
    ])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockOpenEntry()
    vi.mocked(partRequestsApi.createForJobTicket).mockResolvedValue({
      id: 'request-2',
      jobTicketId: 'job-1',
      jobTicketNumber: 'JT-2026-000101',
      jobTicketTitle: 'Hydraulic Repair',
      partId: null,
      partNumber: 'Field-cut gasket',
      partName: 'Field-cut gasket',
      quantity: 1,
      notes: null,
      isBillable: false,
      needsOrdered: true,
      status: 1,
      requestedAtUtc: '2026-04-28T11:00:00Z'
    })

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Find existing part or enter new part'), 'hyd')
    await user.selectOptions(screen.getByLabelText('Existing parts match'), 'part-1')
    expect(screen.getByText('Selected existing part: HYD-100 - Hydraulic Hose')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Find existing part or enter new part'))
    await user.type(screen.getByLabelText('Find existing part or enter new part'), 'Field-cut gasket')
    expect(screen.queryByText('Selected existing part: HYD-100 - Hydraulic Hose')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add / Request Part' }))

    await waitFor(() => {
      expect(partRequestsApi.createForJobTicket).toHaveBeenCalledWith('job-1', {
        partDescription: 'Field-cut gasket',
        partId: null,
        needsOrdered: true,
        quantity: 1,
        notes: null,
        urgency: null,
        neededByUtc: null
      })
    })
  })

  it('lets technicians enter an unlisted part and add it without creating an order request', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockOpenEntry()
    vi.mocked(partRequestsApi.createForJobTicket).mockResolvedValue({
      id: 'request-2',
      jobTicketId: 'job-1',
      jobTicketNumber: 'JT-2026-000101',
      jobTicketTitle: 'Hydraulic Repair',
      partId: null,
      partNumber: 'Temporary cap plug',
      partName: 'Temporary cap plug',
      quantity: 1,
      notes: 'Used from service kit',
      isBillable: false,
      needsOrdered: false,
      status: 1,
      requestedAtUtc: '2026-04-28T11:00:00Z'
    })

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Find existing part or enter new part'), 'Temporary cap plug')
    await user.click(screen.getByLabelText('Needs ordered'))
    expect(screen.queryByLabelText('Urgency')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Notes'), 'Used from service kit')
    await user.click(screen.getByRole('button', { name: 'Add / Request Part' }))

    await waitFor(() => {
      expect(partRequestsApi.createForJobTicket).toHaveBeenCalledWith('job-1', {
        partDescription: 'Temporary cap plug',
        partId: null,
        needsOrdered: false,
        quantity: 1,
        notes: 'Used from service kit',
        urgency: null,
        neededByUtc: null
      })
    })
  })

  it('shows technician-added unlisted parts and needs-ordered status without part-number-heavy labels', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([
      {
        id: 'part-row-2',
        jobTicketId: 'job-1',
        partId: null,
        partNumber: 'Hydraulic hose',
        partName: 'Hydraulic hose',
        isUnlistedPart: true,
        officeOrderRequested: true,
        officeOrderNotes: 'Urgency: Urgent',
        quantity: 2,
        notes: 'Used on lift cylinder',
        isBillable: false,
        approvalStatus: 1,
        addedAtUtc: '2026-04-28T11:00:00Z',
        addedByEmployeeId: 'employee-1'
      }
    ])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockNoOpenEntry()

    renderJobDetail()

    expect(await screen.findByText(/Hydraulic hose \(unlisted\) - Qty 2 - Used on lift cylinder - Needs ordered - Pending review/)).toBeInTheDocument()
    expect(screen.queryByText(/Hydraulic hose - Hydraulic hose/)).not.toBeInTheDocument()
  })

  it('shows clock-out state, upload UI, and missing field context review', async () => {
    mockEmployeeAuth()
    mockJob({
      ticketNumber: 'JT-2026-000111',
      title: 'Boom inspection',
      status: 3,
      priority: 2,
      equipmentId: null,
      description: null,
      scheduledStartAtUtc: null,
      dueAtUtc: null,
      customerFacingNotes: null
    })
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockOpenEntry()

    renderJobDetail()

    expect(await screen.findByText(/Open entry: Started/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clock Out with GPS' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Upload Photo / File' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Invoice attachment')).not.toBeInTheDocument()

    const fieldContext = screen.getByLabelText('field context review')
    expect(within(fieldContext).getByText('Needs manager review')).toBeInTheDocument()
    expect(within(fieldContext).getByText('4 / 7')).toBeInTheDocument()
    expect(within(fieldContext).getByText('Review open field context with a manager before starting field work.')).toBeInTheDocument()
    expect(within(fieldContext).getByText('Next Field Context Fix')).toBeInTheDocument()
    expect(within(fieldContext).getAllByText('No scheduled start is set.')).toHaveLength(2)
    expect(within(fieldContext).getByText('No due date is set.')).toBeInTheDocument()
    expect(within(fieldContext).getByText('No job instructions are available yet.')).toBeInTheDocument()
    expect(screen.getByText('Field context needs manager review before starting new work.')).toBeInTheDocument()

    const user = userEvent.setup()
    const uploadButton = screen.getByRole('button', { name: 'Upload' })
    await user.click(uploadButton)

    await waitFor(() => {
      expect(filesApi.upload).not.toHaveBeenCalled()
    })
  })

  it('marks completed assigned tickets as outside active field work even when context is complete', async () => {
    mockEmployeeAuth()
    mockJob({
      ticketNumber: 'JT-2026-000112',
      title: 'Completed inspection',
      status: 7,
      priority: 2,
      description: 'Inspection complete'
    })
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockNoOpenEntry()

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000112' })).toBeInTheDocument()

    const fieldContext = screen.getByLabelText('field context review')
    expect(within(fieldContext).getByText('Not active field work')).toBeInTheDocument()
    expect(within(fieldContext).getByText('6 / 7')).toBeInTheDocument()
    expect(within(fieldContext).getAllByText('Ticket is outside the active field-work queue.')).toHaveLength(2)
    expect(screen.getByText('Field context needs manager review before starting new work.')).toBeInTheDocument()
  })
})
