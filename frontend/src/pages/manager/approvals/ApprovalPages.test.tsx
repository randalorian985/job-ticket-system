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
    approve: vi.fn(),
    reject: vi.fn(),
    clockIn: vi.fn(),
    clockOut: vi.fn(),
    getOpen: vi.fn(),
    adjust: vi.fn()
  }
}))

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('TimeApprovalPage', () => {
  it('filters visible entries, exports the visible slice, and approves pending rows', async () => {
    const loadedEntries = [
      {
        id: 'te-1',
        jobTicketId: 'job-1',
        employeeId: 'emp-a',
        startedAtUtc: '2026-05-20T13:00:00Z',
        endedAtUtc: '2026-05-20T15:00:00Z',
        totalMinutes: 120,
        laborHours: 2,
        billableHours: 2,
        approvalStatus: 1,
        clockInLatitude: 0,
        clockInLongitude: 0
      },
      {
        id: 'te-2',
        jobTicketId: 'job-1',
        employeeId: 'emp-b',
        startedAtUtc: '2026-05-20T16:00:00Z',
        endedAtUtc: '2026-05-20T18:00:00Z',
        totalMinutes: 120,
        laborHours: 2,
        billableHours: 1.5,
        approvalStatus: 2,
        workSummary: 'Closed the ticket',
        clockInLatitude: 0,
        clockInLongitude: 0
      }
    ] as any

    vi.mocked(timeEntriesApi.listByJob).mockResolvedValue(loadedEntries)
    vi.mocked(timeEntriesApi.approve).mockResolvedValue(loadedEntries[0])

    renderWithRouter(<TimeApprovalPage />)

    fireEvent.change(screen.getByPlaceholderText('Job ticket id'), { target: { value: 'job-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Load Time Entries' }))

    expect(await screen.findByText('emp-a')).toBeInTheDocument()
    expect(screen.getByText('emp-b')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0])
    await waitFor(() => expect(timeEntriesApi.approve).toHaveBeenCalledWith('te-1', { approvedByUserId: '' }))

    fireEvent.change(screen.getByLabelText('Approval status filter'), { target: { value: 'approved' } })
    expect(screen.queryByText('emp-a')).not.toBeInTheDocument()
    expect(screen.getByText('emp-b')).toBeInTheDocument()

    const exportLink = screen.getByRole('link', { name: 'Export visible rows as CSV' })
    const href = exportLink.getAttribute('href') ?? ''
    const csv = decodeURIComponent(href.replace('data:text/csv;charset=utf-8,', ''))

    expect(csv).toContain('Employee Id,Started At UTC,Ended At UTC,Labor Hours,Billable Hours,Approval Status,Work Summary,Rejection Reason')
    expect(csv).toContain('emp-b,2026-05-20T16:00:00Z,2026-05-20T18:00:00Z,2,1.5,Approved,Closed the ticket,')
    expect(csv).not.toContain('emp-a')
    expect(jobTicketsApi.listParts).not.toHaveBeenCalled()
  })
})
