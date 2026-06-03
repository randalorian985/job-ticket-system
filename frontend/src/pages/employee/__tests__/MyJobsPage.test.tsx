import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { useAuth } from '../../../features/auth/AuthContext'
import { MyJobsPage } from '../MyJobsPage'
import { routerFuture } from '../../../routes/routerFuture'

vi.mock('../../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listMine: vi.fn()
  }
}))

vi.mock('../../../features/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

describe('MyJobsPage', () => {
  it('maps known status and priority values and falls back to safe labels for unknown values', async () => {
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

    vi.mocked(jobTicketsApi.listMine).mockResolvedValue([
      {
        id: 'job-1',
        ticketNumber: 'JT-2026-000101',
        title: 'Mapped Values',
        status: 4,
        priority: 3,
        customerId: 'customer-1',
        serviceLocationId: 'location-1',
        scheduledStartAtUtc: '2026-06-01T15:00:00Z',
        dueAtUtc: '2026-06-02T20:00:00Z'
      },
      {
        id: 'job-2',
        ticketNumber: 'JT-2026-000102',
        title: 'Unknown Values',
        status: 99,
        priority: 77,
        customerId: 'customer-2',
        serviceLocationId: 'location-2',
        scheduledStartAtUtc: null,
        dueAtUtc: null
      }
    ])

    render(
      <MemoryRouter future={routerFuture}>
        <MyJobsPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('JT-2026-000101')).toBeInTheDocument()
    expect(screen.getByText('Status: In Progress | Priority: High')).toBeInTheDocument()
    expect(screen.getByText('Status: Unknown status | Priority: Unknown priority')).toBeInTheDocument()
    expect(screen.getAllByText(/^Due:/)).toHaveLength(2)
    expect(screen.getByText('Field context: Ready for field-context review')).toBeInTheDocument()
    expect(screen.getByText('Next field-context fix: No field-context blockers are visible from the assigned-jobs list.')).toBeInTheDocument()
    expect(screen.getByText('Due: Not set')).toBeInTheDocument()
    expect(screen.getByText('Field context: Needs field-context review')).toBeInTheDocument()
    expect(screen.getByText('Next field-context fix: No scheduled start is visible from the assigned-jobs list.')).toBeInTheDocument()

    await waitFor(() => {
      expect(jobTicketsApi.listMine).toHaveBeenCalledTimes(1)
    })
  })
})
