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
    locationType: 1,
    customerId: 'customer-1',
    serviceLocationId: 'location-1',
    billingPartyCustomerId: 'customer-1',
    equipmentId: 'equipment-1',
    locationType: 1,
    customerName: 'Acme Manufacturing',
    serviceLocationName: 'North Plant',
    billingPartyCustomerName: 'Acme Billing',
    equipmentName: 'Hydraulic Lift 7',
    equipmentNumber: 'EQ-007',
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
    localStorage.clear()
    sessionStorage.clear()
    vi.mocked(partsApi.list).mockResolvedValue([])
  })

  it('renders responsive layout hooks for tablet and desktop shells', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockNoOpenEntry()

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveClass('employee-shell', 'employee-detail-page')
    expect(screen.getByRole('heading', { name: 'JT-2026-000101' }).closest('section')).toHaveClass('employee-job-overview-card')
  })

  it('renders ticket details, work entries, parts, files, and ready job requirements', async () => {
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
    mockOpenEntry()

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveClass('employee-shell', 'employee-detail-page')
    expect(screen.getByRole('heading', { name: 'JT-2026-000101' }).closest('section')).toHaveClass('employee-job-overview-card')
    expect(screen.getByRole('link', { name: 'Back to My Jobs' })).toHaveAttribute('href', '/jobs')
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.queryByText(/Billing Party ID/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Acme Manufacturing').length).toBeGreaterThan(0)
    expect(screen.getAllByText('North Plant').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hydraulic Lift 7').length).toBeGreaterThan(0)
    expect(screen.queryByText(/customer-1|location-1|equipment-1/)).not.toBeInTheDocument()
    expect(screen.getByText(/Inspected hydraulic lines/)).toBeInTheDocument()
    expect(screen.getByText(/P-1 - Valve kit/)).toBeInTheDocument()
    expect(screen.getByText(/Added to ticket - Pending review/)).toBeInTheDocument()
    expect(screen.getByText(/before.jpg/)).toBeInTheDocument()

    const jobReadiness = screen.getByLabelText('job readiness review')
    expect(within(jobReadiness).getByText('Ready to start work')).toBeInTheDocument()
    expect(within(jobReadiness).getByText('7 / 7')).toBeInTheDocument()
    expect(within(jobReadiness).getByText('The job requirements are complete for assigned work.')).toBeInTheDocument()
    expect(within(jobReadiness).getByText('This ticket has the information needed to start work.')).toBeInTheDocument()
    expect(within(jobReadiness).getByText('Ready for field work.')).toBeInTheDocument()
    expect(within(jobReadiness).queryByLabelText('open job requirements')).not.toBeInTheDocument()
    expect(screen.getByText('Job setup is ready for active work.')).toBeInTheDocument()

    const nextAction = screen.getByLabelText('next job action')
    expect(within(nextAction).getByText('Capture one field update at a time')).toBeInTheDocument()
    expect(within(nextAction).getByText(/These tools are tied to this ticket and time entry/)).toBeInTheDocument()
    const shortcuts = within(nextAction).getByLabelText('active job shortcuts')
    expect(within(shortcuts).getByRole('link', { name: 'Add Note' })).toHaveAttribute('href', '#work-note-panel')
    expect(within(shortcuts).getByRole('link', { name: 'Add Part' })).toHaveAttribute('href', '#part-request-panel')
    expect(within(shortcuts).getByRole('link', { name: 'Upload Photo' })).toHaveAttribute('href', '#photo-upload-panel')
    expect(within(shortcuts).getByRole('link', { name: 'Clock Out' })).toHaveAttribute('href', '#clock-card')
  })

  it('hides field recording tools until the technician clocks into this ticket', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    mockNoOpenEntry()

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clock In with GPS' })).toBeEnabled()
    expect(screen.getByLabelText('Clock note (optional)')).toBeEnabled()
    const nextAction = screen.getByLabelText('next job action')
    expect(within(nextAction).getByText('Clock in when you are ready to work')).toBeInTheDocument()
    expect(within(nextAction).getByRole('link', { name: 'Clock In' })).toHaveAttribute('href', '#clock-card')
    expect(screen.getByLabelText('field tools locked')).toBeInTheDocument()
    expect(screen.getByText('Clock in to add notes, parts, and photos')).toBeInTheDocument()
    expect(screen.queryByLabelText('Work note')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Photo or file')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save Work Note' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add / Request Part' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument()
    expect(screen.getByText('Clock in to this ticket before adding work notes, parts, or photos.')).toBeInTheDocument()
  })

  it('keeps a saved mobile work note distinct from a failed post-save refresh', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    vi.mocked(jobTicketsApi.addWorkEntry).mockResolvedValue({
      id: 'work-2',
      jobTicketId: 'job-1',
      entryType: 1,
      notes: 'Checked line routing',
      performedAtUtc: '2026-04-28T10:00:00Z',
      employeeId: 'employee-1'
    } as any)
    mockOpenEntry()

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    vi.mocked(jobTicketsApi.get).mockRejectedValueOnce(new Error('refresh failed'))

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Work note'), 'Checked line routing')
    await user.click(screen.getByRole('button', { name: 'Save Work Note' }))

    await waitFor(() => {
      expect(jobTicketsApi.addWorkEntry).toHaveBeenCalledWith('job-1', expect.objectContaining({
        employeeId: 'employee-1',
        entryType: 1,
        notes: 'Checked line routing'
      }))
    })
    expect(await screen.findByText('Work note saved, but refreshed job details could not be loaded. Refresh this page before continuing.')).toBeInTheDocument()
    expect(screen.queryByText('Unable to save work note.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Work Note' })).toBeEnabled()
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
    const nextAction = screen.getByLabelText('next job action')
    expect(within(nextAction).getByText('Finish the active ticket first')).toBeInTheDocument()
    expect(within(nextAction).getByRole('link', { name: 'Go to Active Ticket' })).toHaveAttribute('href', '/jobs/job-2')
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
    await screen.findByRole('option', { name: /HYD-100 - Hydraulic Hose/i })
    await user.selectOptions(screen.getByLabelText('Existing parts match'), 'part-1')
    expect(screen.getByText('Selected existing part: HYD-100 - Hydraulic Hose')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Quantity needed'))
    await user.type(screen.getByLabelText('Quantity needed'), '2')
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
    await screen.findByRole('option', { name: /HYD-100 - Hydraulic Hose/i })
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
    await user.clear(screen.getByLabelText('Find existing part or enter new part'))
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
    mockOpenEntry()

    renderJobDetail()

    expect(await screen.findByText(/Hydraulic hose \(unlisted\) - Qty 2 - Used on lift cylinder - Needs ordered - Pending review/)).toBeInTheDocument()
    expect(screen.queryByText(/Hydraulic hose - Hydraulic hose/)).not.toBeInTheDocument()
  })

  it('shows clock-out state, upload UI, and missing job requirements', async () => {
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
    expect(screen.getByLabelText('Work summary (required)')).toHaveAccessibleDescription('Summarize the work completed before clocking out.')
    expect(screen.getByLabelText('Work note')).toHaveAccessibleDescription('Use this for progress notes, site conditions, or details the office should review.')
    expect(screen.getByLabelText('Find existing part or enter new part')).toHaveAccessibleDescription('Select a matching stocked part when available, or submit the typed value as an unlisted part.')
    expect(screen.getByLabelText('Existing parts match')).toHaveAccessibleDescription('Changing the typed search clears the selected match so the submitted part stays intentional.')
    expect(screen.getByLabelText('Photo or file')).toHaveAccessibleDescription('Allowed file types: JPG, PNG, WebP, or PDF.')

    const jobReadiness = screen.getByLabelText('job readiness review')
    expect(within(jobReadiness).getByText('Needs manager review')).toBeInTheDocument()
    expect(within(jobReadiness).getByText('4 / 7')).toBeInTheDocument()
    expect(within(jobReadiness).getByText('Review the open job requirements with a manager before starting work.')).toBeInTheDocument()
    expect(within(jobReadiness).getByText('Next Required Update')).toBeInTheDocument()
    expect(within(jobReadiness).getAllByText('No scheduled start is set.')).toHaveLength(2)
    expect(within(jobReadiness).getByText('No due date is set.')).toBeInTheDocument()
    expect(within(jobReadiness).getByText('No job instructions are available yet.')).toBeInTheDocument()
    expect(screen.getByText('Job setup needs manager review before starting new work.')).toBeInTheDocument()

    const user = userEvent.setup()
    const uploadButton = screen.getByRole('button', { name: 'Upload' })
    await user.click(uploadButton)

    await waitFor(() => {
      expect(filesApi.upload).not.toHaveBeenCalled()
    })
  })

  it('marks completed assigned tickets as outside active field work even when requirements are complete', async () => {
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

    const jobReadiness = screen.getByLabelText('job readiness review')
    expect(within(jobReadiness).getByText('Not active field work')).toBeInTheDocument()
    expect(within(jobReadiness).getByText('6 / 7')).toBeInTheDocument()
    expect(within(jobReadiness).getAllByText('Ticket is no longer available for field work.')).toHaveLength(2)
    expect(screen.getByText('Job setup needs manager review before starting new work.')).toBeInTheDocument()
  })
})
