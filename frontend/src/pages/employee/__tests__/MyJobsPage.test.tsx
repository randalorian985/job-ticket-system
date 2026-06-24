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
        customerName: 'Acme Manufacturing',
        serviceLocationName: 'North Plant',
        equipmentName: 'Press 12',
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
        customerName: 'Beta Logistics',
        serviceLocationName: 'Main Warehouse',
        equipmentName: null,
        scheduledStartAtUtc: '2026-06-03T15:00:00Z',
        dueAtUtc: '2026-06-04T20:00:00Z'
      },
      {
        id: 'job-3',
        ticketNumber: 'JT-2026-000103',
        title: 'Missing Field Context',
        status: 3,
        priority: 2,
        customerId: 'customer-3',
        serviceLocationId: 'location-3',
        customerName: 'Central Utilities',
        serviceLocationName: 'Pump Station 4',
        equipmentName: 'Transfer Pump',
        scheduledStartAtUtc: null,
        dueAtUtc: null
      },
      {
        id: 'job-4',
        ticketNumber: 'JT-2026-000104',
        title: 'Completed Job',
        status: 7,
        priority: 2,
        customerId: 'customer-4',
        serviceLocationId: 'location-4',
        customerName: 'Delta Services',
        serviceLocationName: 'South Yard',
        equipmentName: 'Service Crane',
        scheduledStartAtUtc: '2026-06-03T15:00:00Z',
        dueAtUtc: '2026-06-04T20:00:00Z'
      }
    ])

    render(
      <MemoryRouter future={routerFuture}>
        <MyJobsPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('JT-2026-000101')).toBeInTheDocument()
    expect(screen.queryByLabelText('assigned jobs summary')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('next assigned job')).not.toBeInTheDocument()
    expect(screen.getByText('Mapped Values')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Unknown status')).toBeInTheDocument()
    expect(screen.getByText('Unknown priority')).toBeInTheDocument()
    expect(screen.getByText('Ready to start: This job has the information needed to start work.')).toBeInTheDocument()
    expect(screen.getByText('Needs job review: Scheduled start has not been set.')).toBeInTheDocument()
    expect(screen.getAllByText('Not active field work: Ticket is no longer available for field work.')).toHaveLength(1)
    expect(screen.queryByText('Completed Job')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open / Clock In JT-2026-000101' })).toHaveAttribute('href', '/jobs/job-1')
    expect(screen.getByRole('link', { name: 'Review Job JT-2026-000103' })).toHaveAttribute('href', '/jobs/job-3')
    expect(screen.getByText(/Acme Manufacturing\s+\|\s+North Plant/)).toBeInTheDocument()
    expect(screen.getByText('Press 12')).toBeInTheDocument()
    expect(screen.getByText('See job instructions')).toBeInTheDocument()
    expect(screen.queryByText(/Status:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Start readiness:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/customer-1|location-1/)).not.toBeInTheDocument()

    await waitFor(() => {
      expect(jobTicketsApi.listMine).toHaveBeenCalledTimes(1)
    })
  })
})
