import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { filesApi } from '../../../api/filesApi'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
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

describe('JobDetailPage', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
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
    vi.mocked(timeEntriesApi.getOpen).mockImplementation(async () => {
      throw { status: 404 }
    })

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    expect(screen.getByText('Status: In Progress')).toBeInTheDocument()
    expect(screen.getByText('Priority: High')).toBeInTheDocument()
    expect(screen.getByText(/Inspected hydraulic lines/)).toBeInTheDocument()
    expect(screen.getByText(/P-1 - Valve kit/)).toBeInTheDocument()
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

  it('lets technicians add a part used by name without pricing, billing, or part-number fields', async () => {
    mockEmployeeAuth()
    mockJob()
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    vi.mocked(timeEntriesApi.getOpen).mockImplementation(async () => {
      throw { status: 404 }
    })
    vi.mocked(jobTicketsApi.quickAddPart).mockResolvedValue({
      id: 'part-row-2',
      jobTicketId: 'job-1',
      partId: null,
      partNumber: 'Hydraulic hose',
      partName: 'Hydraulic hose',
      isUnlistedPart: true,
      officeOrderRequested: true,
      officeOrderNotes: 'Need office to order one spare',
      quantity: 2,
      notes: 'Used on lift cylinder',
      isBillable: false,
      approvalStatus: 1,
      addedAtUtc: '2026-04-28T11:00:00Z',
      addedByEmployeeId: 'employee-1'
    })

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    expect(screen.getByLabelText('Part used')).toBeInTheDocument()
    expect(screen.queryByLabelText('Part number')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Unit cost')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Billable price')).not.toBeInTheDocument()
    expect(screen.queryByText(/sale price/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/billing/i)).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Part used'), 'Hydraulic hose')
    await user.clear(screen.getByLabelText('Quantity'))
    await user.type(screen.getByLabelText('Quantity'), '2')
    await user.type(screen.getByLabelText('Notes'), 'Used on lift cylinder')
    await user.click(screen.getByLabelText('Office order requested'))
    await user.type(screen.getByLabelText('Office order notes'), 'Need office to order one spare')
    await user.click(screen.getByRole('button', { name: 'Add Part Used' }))

    await waitFor(() => {
      expect(jobTicketsApi.quickAddPart).toHaveBeenCalledWith('job-1', {
        partNumber: 'Hydraulic hose',
        partName: 'Hydraulic hose',
        quantity: 2,
        unitCost: 0,
        salePrice: 0,
        notes: 'Used on lift cylinder',
        isBillable: false,
        addedByEmployeeId: 'employee-1',
        addedAtUtc: null,
        requestOfficeOrder: true,
        officeOrderNotes: 'Need office to order one spare',
        adjustInventory: false,
        allowManagerOverride: false
      })
    })
  })

  it('shows technician-added unlisted parts as needing office review without part-number-heavy labels', async () => {
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
        officeOrderNotes: 'Need office to order one spare',
        quantity: 2,
        notes: 'Used on lift cylinder',
        isBillable: false,
        approvalStatus: 1,
        addedAtUtc: '2026-04-28T11:00:00Z',
        addedByEmployeeId: 'employee-1'
      }
    ])
    vi.mocked(filesApi.list).mockResolvedValue([])
    vi.mocked(timeEntriesApi.getOpen).mockImplementation(async () => {
      throw { status: 404 }
    })

    renderJobDetail()

    expect(await screen.findByText(/Hydraulic hose \(needs office review\) - Qty 2 - Used on lift cylinder/)).toBeInTheDocument()
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
    vi.mocked(timeEntriesApi.getOpen).mockImplementation(async () => ({
      id: 'time-1',
      jobTicketId: 'job-1',
      employeeId: 'employee-1',
      startedAtUtc: '2026-04-28T09:00:00Z',
      laborHours: 0,
      billableHours: 0,
      approvalStatus: 0,
      clockInLatitude: 1,
      clockInLongitude: 1
    }))

    renderJobDetail()

    expect(await screen.findByText(/Open entry: Started/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clock Out with GPS' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Upload Photo / File' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()

    const fieldContext = screen.getByLabelText('field context review')
    expect(within(fieldContext).getByText('Needs manager review')).toBeInTheDocument()
    expect(within(fieldContext).getByText('4 / 7')).toBeInTheDocument()
    expect(within(fieldContext).getByText('Review open field context with a manager before starting field work.')).toBeInTheDocument()
    expect(within(fieldContext).getByText('Next Field Context Fix')).toBeInTheDocument()
    expect(within(fieldContext).getAllByText('No scheduled start is set.')).toHaveLength(2)
    expect(within(fieldContext).getByText('No due date is set.')).toBeInTheDocument()
    expect(within(fieldContext).getByText('No job instructions are available yet.')).toBeInTheDocument()
    expect(screen.getByText('Field context needs manager review before starting new work.')).toBeInTheDocument()

    const invoiceAttachment = screen.getByLabelText('Invoice attachment')
    expect(invoiceAttachment).toHaveAttribute('type', 'checkbox')
    expect(invoiceAttachment.closest('label')).toHaveClass('row')
    expect(invoiceAttachment.closest('label')).not.toHaveClass('master-data-form-row')

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
    vi.mocked(timeEntriesApi.getOpen).mockImplementation(async () => {
      throw { status: 404 }
    })

    renderJobDetail()

    expect(await screen.findByRole('heading', { name: 'JT-2026-000112' })).toBeInTheDocument()

    const fieldContext = screen.getByLabelText('field context review')
    expect(within(fieldContext).getByText('Not active field work')).toBeInTheDocument()
    expect(within(fieldContext).getByText('6 / 7')).toBeInTheDocument()
    expect(within(fieldContext).getAllByText('Ticket is outside the active field-work queue.')).toHaveLength(2)
    expect(screen.getByText('Field context needs manager review before starting new work.')).toBeInTheDocument()
  })
})
