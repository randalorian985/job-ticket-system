import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { useAuth } from '../../../features/auth/AuthContext'
import { MyJobsPage } from '../MyJobsPage'

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
        serviceLocationId: 'location-1'
      },
      {
        id: 'job-2',
        ticketNumber: 'JT-2026-000102',
        title: 'Unknown Values',
        status: 99,
        priority: 77,
        customerId: 'customer-2',
        serviceLocationId: 'location-2'
      }
    ])

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MyJobsPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('JT-2026-000101')).toBeInTheDocument()
    expect(screen.getByText('Status: In Progress | Priority: High')).toBeInTheDocument()
    expect(screen.getByText('Status: Unknown status | Priority: Unknown priority')).toBeInTheDocument()

    await waitFor(() => {
      expect(jobTicketsApi.listMine).toHaveBeenCalledTimes(1)
    })
  })
})
