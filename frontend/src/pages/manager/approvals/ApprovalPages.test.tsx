import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { timeEntriesApi } from '../../../api/timeEntriesApi'
import { TimeApprovalPage } from './ApprovalPages'

vi.mock('../../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listParts: vi.fn(),
    approvePart: vi.fn(),
    rejectPart: vi.fn()
  }
}))

vi.mock('../../../api/timeEntriesApi', () => ({
  timeEntriesApi: {
    listByJob: vi.fn(),
    listForReview: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    clockIn: vi.fn(),
    clockOut: vi.fn(),
    getOpen: vi.fn(),
    adjust: vi.fn()
  }
}))

const pendingEntry = {
  id: 'te-1',
  jobTicketId: 'job-1',
  employeeId: 'emp-a',
  startedAtUtc: '2026-05-20T13:00:00Z',
  endedAtUtc: '2026-05-20T15:00:00Z',
  totalMinutes: 120,
  laborHours: 2,
  billableHours: 2,
  approvalStatus: 1,
  workSummary: 'Repaired hydraulic line',
  clockInLatitude: 0,
  clockInLongitude: 0
} as any

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('TimeApprovalPage', () => {
  it('loads the pending approval queue without requiring a job ticket id and supports detail actions', async () => {
    vi.mocked(timeEntriesApi.listForReview).mockResolvedValue([pendingEntry])
    vi.mocked(timeEntriesApi.approve).mockResolvedValue({ ...pendingEntry, approvalStatus: 2 })

    renderWithRouter(<TimeApprovalPage />)

    await waitFor(() => expect(timeEntriesApi.listForReview).toHaveBeenCalledWith({ approvalStatus: 1 }))
    expect(await screen.findByText('emp-a')).toBeInTheDocument()
    expect(screen.getByLabelText('Job ticket id filter')).toHaveValue('')
    expect(screen.queryByText(/enter a job ticket id/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'View Details' }))
    expect(screen.getByRole('heading', { name: 'Time Entry Details' })).toBeInTheDocument()
    expect(screen.getByText('Repaired hydraulic line')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Approve Entry' }))
    await waitFor(() => expect(timeEntriesApi.approve).toHaveBeenCalledWith('te-1', { approvedByUserId: '' }))

    const exportLink = screen.getByRole('link', { name: 'Export visible rows as CSV' })
    const href = exportLink.getAttribute('href') ?? ''
    const csv = decodeURIComponent(href.replace('data:text/csv;charset=utf-8,', ''))
    expect(csv).toContain('Job Ticket Id,Employee Id,Started At UTC')
    expect(csv).toContain('job-1,emp-a')
    expect(jobTicketsApi.listParts).not.toHaveBeenCalled()
  })

  it('applies an optional job ticket id filter to the review queue', async () => {
    vi.mocked(timeEntriesApi.listForReview).mockResolvedValue([])

    renderWithRouter(<TimeApprovalPage />)
    await waitFor(() => expect(timeEntriesApi.listForReview).toHaveBeenCalledWith({ approvalStatus: 1 }))

    fireEvent.change(screen.getByLabelText('Job ticket id filter'), { target: { value: 'job-2' } })
    fireEvent.change(screen.getByLabelText('Approval status filter'), { target: { value: 'all' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }))

    await waitFor(() => expect(timeEntriesApi.listForReview).toHaveBeenLastCalledWith({
      jobTicketId: 'job-2',
      employeeId: undefined,
      approvalStatus: undefined,
      dateFromUtc: undefined,
      dateToUtc: undefined
    }))
  })
})
