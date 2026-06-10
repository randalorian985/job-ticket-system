import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { timeEntriesApi } from '../../../api/timeEntriesApi'
import { usersApi } from '../../../api/usersApi'
import { TimeApprovalPage } from './ApprovalPages'

vi.mock('../../../api/jobTicketsApi', () => ({ jobTicketsApi: { listParts: vi.fn(), approvePart: vi.fn(), rejectPart: vi.fn() } }))
vi.mock('../../../api/timeEntriesApi', () => ({
  timeEntriesApi: {
    listByJob: vi.fn(), listForReview: vi.fn(), approve: vi.fn(), bulkApprove: vi.fn(), editAndApprove: vi.fn(),
    reject: vi.fn(), clockIn: vi.fn(), clockOut: vi.fn(), getOpen: vi.fn(), adjust: vi.fn()
  }
}))
vi.mock('../../../api/usersApi', () => ({ usersApi: { listAssignableEmployees: vi.fn() } }))

const pendingEntry = {
  id: 'te-1', jobTicketId: 'job-1', employeeId: 'emp-a', employeeName: 'Alex Rivera',
  jobTicketNumber: 'JT-1042', jobName: 'Hydraulic repair', customerName: 'Acme Utilities',
  siteName: 'North Plant', locationName: 'Pump Room', locationAddress: '10 Main St, Austin, TX', laborType: 'Repair',
  startedAtUtc: '2026-06-09T13:00:00Z', endedAtUtc: '2026-06-09T15:00:00Z', totalMinutes: 120,
  laborHours: 2, billableHours: 1.5, approvalStatus: 1, workSummary: 'Repaired hydraulic line',
  clockInLatitude: 0, clockInLongitude: 0
} as any
const approvedEntry = { ...pendingEntry, id: 'te-2', employeeName: 'Morgan Lee', employeeId: 'emp-b', approvalStatus: 2, laborHours: 1, billableHours: 1 }

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.mocked(usersApi.listAssignableEmployees).mockResolvedValue([
    { id: 'emp-a', firstName: 'Alex', lastName: 'Rivera' }, { id: 'emp-b', firstName: 'Morgan', lastName: 'Lee' }
  ])
  vi.mocked(timeEntriesApi.listForReview).mockResolvedValue([pendingEntry])
})

describe('TimeApprovalPage', () => {
  it('loads pending entries automatically and presents manager-facing queue context', async () => {
    renderWithRouter(<TimeApprovalPage />)
    await waitFor(() => expect(timeEntriesApi.listForReview).toHaveBeenCalledWith({ approvalStatus: 1 }))
    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument()
    expect(screen.getByText('JT-1042')).toBeInTheDocument()
    expect(screen.getByText('Acme Utilities · North Plant · Pump Room · 10 Main St, Austin, TX')).toBeInTheDocument()
    expect(screen.getByLabelText('Employee filter')).toHaveAttribute('placeholder', 'All employees')
    expect(screen.queryByLabelText(/employee id/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/job ticket id/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Approval status filter')).toHaveValue('pending')
    expect(screen.getByRole('button', { name: 'Approve Selected (0)' })).toBeDisabled()
    const summary = screen.getByLabelText('Time review summary')
    expect(within(summary).getByText('2.00')).toBeInTheDocument()
    expect(within(summary).getByText('1.50')).toBeInTheDocument()
    expect(jobTicketsApi.listParts).not.toHaveBeenCalled()
  })

  it('uses employee IDs internally and applies search, status, and date filters', async () => {
    vi.mocked(timeEntriesApi.listForReview).mockResolvedValue([])
    renderWithRouter(<TimeApprovalPage />)
    await waitFor(() => expect(usersApi.listAssignableEmployees).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('Employee filter'), { target: { value: 'Alex Rivera' } })
    fireEvent.change(screen.getByLabelText('Approval queue search'), { target: { value: 'Acme North Plant' } })
    fireEvent.change(screen.getByLabelText('Approval status filter'), { target: { value: 'all' } })
    fireEvent.change(screen.getByLabelText('Date from'), { target: { value: '2026-06-01' } })
    fireEvent.change(screen.getByLabelText('Date to'), { target: { value: '2026-06-10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }))
    await waitFor(() => expect(timeEntriesApi.listForReview).toHaveBeenLastCalledWith({
      employeeId: 'emp-a', approvalStatus: undefined, dateFromUtc: '2026-06-01T00:00:00.000Z',
      dateToUtc: '2026-06-10T23:59:59.999Z', search: 'Acme North Plant'
    }))
  })

  it('supports single approval, rejection, edit-and-approve, and bulk approval', async () => {
    vi.mocked(timeEntriesApi.approve).mockResolvedValue({ ...pendingEntry, approvalStatus: 2 })
    vi.mocked(timeEntriesApi.reject).mockResolvedValue({ ...pendingEntry, approvalStatus: 3 })
    vi.mocked(timeEntriesApi.editAndApprove).mockResolvedValue({ ...pendingEntry, approvalStatus: 2 })
    vi.mocked(timeEntriesApi.bulkApprove).mockResolvedValue([{ ...pendingEntry, approvalStatus: 2 }])
    renderWithRouter(<TimeApprovalPage />)
    await screen.findByText('Alex Rivera')

    fireEvent.click(screen.getByLabelText('Select Alex Rivera'))
    fireEvent.click(screen.getByRole('button', { name: 'Approve Selected (1)' }))
    await waitFor(() => expect(timeEntriesApi.bulkApprove).toHaveBeenCalledWith(['te-1']))

    fireEvent.click(screen.getByRole('button', { name: 'Review' }))
    expect(screen.getByRole('heading', { name: 'Review Time Entry' })).toBeInTheDocument()
    expect(screen.getByText('Repaired hydraulic line')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Rejection reason'), { target: { value: 'Missing travel detail' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await waitFor(() => expect(timeEntriesApi.reject).toHaveBeenCalledWith('te-1', { rejectedByUserId: '', reason: 'Missing travel detail' }))

    fireEvent.click(screen.getByRole('button', { name: 'Review' }))
    fireEvent.change(screen.getByLabelText('Approved total hours'), { target: { value: '1.75' } })
    fireEvent.change(screen.getByLabelText('Approved billable hours'), { target: { value: '1.5' } })
    fireEvent.change(screen.getByLabelText('Manager approval note'), { target: { value: 'Removed personal break' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes & Approve' }))
    await waitFor(() => expect(timeEntriesApi.editAndApprove).toHaveBeenCalledWith('te-1', expect.objectContaining({ reason: 'Removed personal break', laborHours: 1.75, billableHours: 1.5 })))

    fireEvent.click(screen.getByRole('button', { name: 'Review' }))
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(timeEntriesApi.approve).toHaveBeenCalledWith('te-1', { approvedByUserId: '' }))
  })

  it('updates summary cards from the currently loaded queue', async () => {
    vi.mocked(timeEntriesApi.listForReview).mockResolvedValue([pendingEntry, approvedEntry])
    renderWithRouter(<TimeApprovalPage />)
    await screen.findByText('Morgan Lee')
    const summary = screen.getByLabelText('Time review summary')
    expect(within(summary).getByText('3.00')).toBeInTheDocument()
    expect(within(summary).getByText('2.50')).toBeInTheDocument()
    expect(within(summary).getAllByText('1')).toHaveLength(2)
  })
})
