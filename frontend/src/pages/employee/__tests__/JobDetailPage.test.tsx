import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { filesApi } from '../../../api/filesApi'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
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
    addPart: vi.fn()
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

vi.mock('../../../api/partsApi', () => ({
  partsApi: {
    list: vi.fn()
  }
}))

vi.mock('../../../features/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

describe('JobDetailPage', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders ticket details, work entries, parts, and files', async () => {
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
      equipmentId: 'equipment-1'
    })
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
    vi.mocked(partsApi.list).mockResolvedValue([])
    vi.mocked(timeEntriesApi.getOpen).mockImplementation(async () => {
      throw { status: 404 }
    })

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/jobs/job-1']}>
        <Routes>
          <Route path="/jobs/:jobTicketId" element={<JobDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'JT-2026-000101' })).toBeInTheDocument()
    expect(screen.getByText('Status: In Progress')).toBeInTheDocument()
    expect(screen.getByText('Priority: High')).toBeInTheDocument()
    expect(screen.getByText(/Inspected hydraulic lines/)).toBeInTheDocument()
    expect(screen.getByText(/Part ID part-1/)).toBeInTheDocument()
    expect(screen.getByText(/before.jpg/)).toBeInTheDocument()
  })

  it('shows clock-out state when there is an open entry and includes upload UI', async () => {
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

    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'job-1',
      ticketNumber: 'JT-2026-000111',
      title: 'Boom inspection',
      status: 3,
      priority: 2,
      customerId: 'customer-1',
      serviceLocationId: 'location-1',
      billingPartyCustomerId: 'customer-1',
      equipmentId: null,
      description: null
    })
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([])
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([])
    vi.mocked(filesApi.list).mockResolvedValue([])
    vi.mocked(partsApi.list).mockResolvedValue([{ id: 'part-1', partNumber: 'P-1', name: 'Filter' }])
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

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/jobs/job-1']}>
        <Routes>
          <Route path="/jobs/:jobTicketId" element={<JobDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/Open entry: Started/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clock Out with GPS' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Upload Photo / File' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()

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
})
