import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { schedulingApi } from '../../../api/schedulingApi'
import { routerFuture } from '../../../routes/routerFuture'
import { SchedulePage } from '../SchedulePage'
import type { SchedulableTicketDto } from '../../../types'

vi.mock('../../../api/schedulingApi', () => ({
  schedulingApi: {
    getUnscheduled: vi.fn(),
    getCalendar: vi.fn(),
    getByTechnician: vi.fn(),
    scheduleTicket: vi.fn()
  }
}))

afterEach(cleanup)

function renderSchedulePage() {
  return render(
    <MemoryRouter future={routerFuture}>
      <SchedulePage />
    </MemoryRouter>
  )
}

const makeTicket = (overrides: Partial<SchedulableTicketDto> = {}): SchedulableTicketDto => ({
  id: 'ticket-1',
  ticketNumber: 'JT-001',
  title: 'Hydraulic Repair',
  status: 2,
  priority: 2,
  customerName: 'Acme Corp',
  serviceLocationName: 'Main Yard',
  requestedAtUtc: '2026-07-01T10:00:00Z',
  scheduledStartAtUtc: null,
  dueAtUtc: null,
  estimatedDurationMinutes: null,
  ...overrides
})

describe('SchedulePage — Unscheduled Queue', () => {
  beforeEach(() => {
    vi.mocked(schedulingApi.getCalendar).mockResolvedValue([])
    vi.mocked(schedulingApi.getByTechnician).mockResolvedValue([])
  })

  it('shows an empty state when there are no unscheduled tickets', async () => {
    vi.mocked(schedulingApi.getUnscheduled).mockResolvedValue([])
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText(/all caught up/i)).toBeInTheDocument())
  })

  it('renders unscheduled ticket cards with customer and location', async () => {
    vi.mocked(schedulingApi.getUnscheduled).mockResolvedValue([
      makeTicket({ ticketNumber: 'JT-001', title: 'Hydraulic Repair', customerName: 'Acme Corp' })
    ])
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText('JT-001')).toBeInTheDocument())
    expect(screen.getByText('Hydraulic Repair')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('shows an error message when the API call fails', async () => {
    vi.mocked(schedulingApi.getUnscheduled).mockRejectedValue(new Error('network'))
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText(/unable to load unscheduled tickets/i)).toBeInTheDocument())
  })
})

describe('SchedulePage — Priority filter', () => {
  beforeEach(() => {
    vi.mocked(schedulingApi.getCalendar).mockResolvedValue([])
    vi.mocked(schedulingApi.getByTechnician).mockResolvedValue([])
    vi.mocked(schedulingApi.getUnscheduled).mockResolvedValue([
      makeTicket({ id: 'u', ticketNumber: 'JT-001', title: 'Urgent Job', priority: 4 }),
      makeTicket({ id: 'n', ticketNumber: 'JT-002', title: 'Normal Job', priority: 2 }),
      makeTicket({ id: 'l', ticketNumber: 'JT-003', title: 'Low Job', priority: 1 })
    ])
  })

  it('shows all tickets when priority is set to All', async () => {
    const user = userEvent.setup()
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText('JT-001')).toBeInTheDocument())
    expect(screen.getByText('JT-002')).toBeInTheDocument()
    expect(screen.getByText('JT-003')).toBeInTheDocument()
  })

  it('filters to urgent tickets when Urgent is selected', async () => {
    const user = userEvent.setup()
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText('JT-001')).toBeInTheDocument())

    const prioritySelect = screen.getByLabelText('Priority')
    await user.selectOptions(prioritySelect, '4')

    expect(screen.getByText('JT-001')).toBeInTheDocument()
    expect(screen.queryByText('JT-002')).not.toBeInTheDocument()
    expect(screen.queryByText('JT-003')).not.toBeInTheDocument()
  })

  it('shows "no tickets match" message when no tickets match the filter', async () => {
    const user = userEvent.setup()
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText('JT-001')).toBeInTheDocument())

    const prioritySelect = screen.getByLabelText('Priority')
    await user.selectOptions(prioritySelect, '3') // High — none exist

    expect(screen.getByText(/no tickets match/i)).toBeInTheDocument()
  })
})

describe('SchedulePage — Duration filter', () => {
  beforeEach(() => {
    vi.mocked(schedulingApi.getCalendar).mockResolvedValue([])
    vi.mocked(schedulingApi.getByTechnician).mockResolvedValue([])
    vi.mocked(schedulingApi.getUnscheduled).mockResolvedValue([
      makeTicket({ id: 'no-est', ticketNumber: 'JT-001', title: 'No Estimate', estimatedDurationMinutes: null }),
      makeTicket({ id: 'short', ticketNumber: 'JT-002', title: 'Short Job', estimatedDurationMinutes: 60 }),
      makeTicket({ id: 'half', ticketNumber: 'JT-003', title: 'Half Day Job', estimatedDurationMinutes: 180 }),
      makeTicket({ id: 'full', ticketNumber: 'JT-004', title: 'Full Day Job', estimatedDurationMinutes: 480 })
    ])
  })

  it('filters to tickets with no estimate', async () => {
    const user = userEvent.setup()
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText('JT-001')).toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText('Est. Duration'), 'none')
    expect(screen.getByText('JT-001')).toBeInTheDocument()
    expect(screen.queryByText('JT-002')).not.toBeInTheDocument()
  })

  it('filters to short jobs (≤ 2 hrs)', async () => {
    const user = userEvent.setup()
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText('JT-002')).toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText('Est. Duration'), 'short')
    expect(screen.getByText('JT-002')).toBeInTheDocument()
    expect(screen.queryByText('JT-001')).not.toBeInTheDocument()
    expect(screen.queryByText('JT-003')).not.toBeInTheDocument()
  })

  it('filters to over-4-hour jobs', async () => {
    const user = userEvent.setup()
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText('JT-004')).toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText('Est. Duration'), 'full')
    expect(screen.getByText('JT-004')).toBeInTheDocument()
    expect(screen.queryByText('JT-001')).not.toBeInTheDocument()
    expect(screen.queryByText('JT-002')).not.toBeInTheDocument()
    expect(screen.queryByText('JT-003')).not.toBeInTheDocument()
  })
})

describe('SchedulePage — By Date view', () => {
  it('switches to By Date view and shows week nav', async () => {
    vi.mocked(schedulingApi.getUnscheduled).mockResolvedValue([])
    vi.mocked(schedulingApi.getCalendar).mockResolvedValue([])
    vi.mocked(schedulingApi.getByTechnician).mockResolvedValue([])

    const user = userEvent.setup()
    renderSchedulePage()
    await user.click(screen.getByRole('button', { name: 'By Date' }))

    expect(screen.getByRole('button', { name: /prev week/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument()
  })
})

describe('SchedulePage — By Technician view', () => {
  it('shows a grouped list of technicians with their tickets', async () => {
    vi.mocked(schedulingApi.getUnscheduled).mockResolvedValue([])
    vi.mocked(schedulingApi.getCalendar).mockResolvedValue([])
    vi.mocked(schedulingApi.getByTechnician).mockResolvedValue([
      {
        employeeId: 'emp-1',
        employeeName: 'Taylor Tech',
        tickets: [makeTicket({ id: 't1', ticketNumber: 'JT-010', title: 'Crane Inspection' })]
      }
    ])

    const user = userEvent.setup()
    renderSchedulePage()
    await user.click(screen.getByRole('button', { name: 'By Technician' }))

    await waitFor(() => expect(screen.getByText('Taylor Tech')).toBeInTheDocument())
    expect(screen.getByText('JT-010')).toBeInTheDocument()
  })
})
