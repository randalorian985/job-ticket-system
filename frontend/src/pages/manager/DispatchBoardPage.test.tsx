import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { usersApi } from '../../api/usersApi'
import { routerFuture } from '../../routes/routerFuture'
import { DispatchBoardPage } from './DispatchBoardPage'

vi.mock('../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listAll: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    changeStatus: vi.fn(),
    listAssignments: vi.fn(),
    addAssignment: vi.fn(),
    removeAssignment: vi.fn(),
    addWorkEntry: vi.fn()
  }
}))

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listEquipment: vi.fn()
  }
}))

vi.mock('../../api/usersApi', () => ({
  usersApi: {
    listAssignableEmployees: vi.fn()
  }
}))

const jobs = [
  {
    id: 'job-1',
    ticketNumber: 'JT-1',
    title: 'Downtown lift',
    status: 2,
    priority: 3,
    customerId: 'c-1',
    customerName: 'Acme',
    serviceLocationId: 's-1',
    serviceLocationName: 'Downtown Yard',
    requestedAtUtc: '2026-06-17T12:00:00Z',
    scheduledStartAtUtc: null,
    dueAtUtc: null,
    equipmentId: null,
    equipmentName: null
  },
  {
    id: 'job-2',
    ticketNumber: 'JT-2',
    title: 'Plant pick',
    status: 3,
    priority: 2,
    customerId: 'c-2',
    customerName: 'Bravo',
    serviceLocationId: 's-2',
    serviceLocationName: 'North Plant',
    requestedAtUtc: '2026-06-17T13:00:00Z',
    scheduledStartAtUtc: '2026-06-17T15:00:00Z',
    dueAtUtc: '2026-06-17T20:00:00Z',
    equipmentId: 'eq-1',
    equipmentName: 'Crane 40T'
  },
  {
    id: 'job-3',
    ticketNumber: 'JT-3',
    title: 'Completed rigging',
    status: 7,
    priority: 2,
    customerId: 'c-3',
    customerName: 'Charlie',
    serviceLocationId: 's-3',
    serviceLocationName: 'South Site',
    requestedAtUtc: '2026-06-15T13:00:00Z',
    scheduledStartAtUtc: '2026-06-17T16:00:00Z',
    dueAtUtc: '2026-06-17T20:00:00Z',
    equipmentId: 'eq-2',
    equipmentName: 'Crane 90T'
  }
]

const renderPage = () => render(
  <MemoryRouter future={routerFuture}>
    <DispatchBoardPage />
  </MemoryRouter>
)

describe('DispatchBoardPage', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.setSystemTime(new Date('2026-06-17T14:00:00Z'))
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue(jobs as any)
    vi.mocked(jobTicketsApi.listAssignments).mockImplementation(async (jobTicketId: string) => {
      if (jobTicketId === 'job-2') {
        return [{ jobTicketId, employeeId: 'emp-1', assignedAtUtc: '2026-06-17T14:00:00Z', isLead: true, employeeName: 'Olivia Operator' }] as any
      }

      return [] as any
    })
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([
      { id: 'eq-1', customerId: 'c-1', serviceLocationId: 's-1', name: 'Crane 40T', equipmentNumber: 'C40' },
      { id: 'eq-2', customerId: 'c-1', serviceLocationId: 's-1', name: 'Crane 90T', equipmentNumber: 'C90' }
    ] as any)
    vi.mocked(usersApi.listAssignableEmployees).mockResolvedValue([
      { id: 'emp-1', firstName: 'Olivia', lastName: 'Operator' },
      { id: 'emp-2', firstName: 'Casey', lastName: 'Crew' }
    ] as any)
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'job-1',
      ticketNumber: 'JT-1',
      customerId: 'c-1',
      serviceLocationId: 's-1',
      billingPartyCustomerId: 'c-1',
      title: 'Downtown lift',
      priority: 3,
      status: 2,
      requestedAtUtc: '2026-06-17T12:00:00Z',
      scheduledStartAtUtc: null,
      dueAtUtc: null,
      equipmentId: null,
      internalNotes: null
    } as any)
    vi.mocked(jobTicketsApi.update).mockResolvedValue({} as any)
    vi.mocked(jobTicketsApi.addAssignment).mockResolvedValue({} as any)
    vi.mocked(jobTicketsApi.removeAssignment).mockResolvedValue(undefined)
    vi.mocked(jobTicketsApi.changeStatus).mockResolvedValue({} as any)
    vi.mocked(jobTicketsApi.addWorkEntry).mockResolvedValue({} as any)
  })

  it('keeps dispatch focused on active ticket scheduling and day-of coordination', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Dispatch Board' })).toBeInTheDocument()
    expect(screen.getByText('Job tickets are the only work records. Dispatch updates their schedule and employee assignments; ticket review and billing stay in their existing workflows.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Unscheduled Tickets/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Next 7 Days/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Needs Ticket Review/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ready for Billing/ })).not.toBeInTheDocument()
    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Acme · Downtown Yard')).toBeInTheDocument()
    expect(screen.getByText('Job / Scope')).toBeInTheDocument()
    expect(screen.getByText('Crane / Equipment Being Serviced')).toBeInTheDocument()
    expect(screen.queryByText('Assigned Crane')).not.toBeInTheDocument()
    expect(screen.getByText('Operator or crew assignment is missing.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Job Ticket' })).toHaveAttribute('href', '/manage/job-tickets/new')
    expect(screen.queryByText('Job Request')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark En Route' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /Today/ }))

    expect(screen.getByText('JT-2')).toBeInTheDocument()
    expect(screen.queryByText('JT-3')).not.toBeInTheDocument()
    expect(screen.getByText('Olivia Operator')).toBeInTheDocument()
    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark En Route' })).toHaveAttribute('title', 'Records an En Route note on the ticket.')
    expect(screen.getByRole('button', { name: 'Mark En Route' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Complete Work' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Open Ticket' })).toHaveAttribute('href', '/manage/job-tickets/job-2')
  })

  it('schedules a job and updates service equipment, operator, and crew through existing APIs', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Schedule & Assign' }))

    const drawer = screen.getByLabelText('schedule and assign ticket')
    const scheduledInput = '2026-06-17T15:00'
    const dueInput = '2026-06-17T21:00'
    fireEvent.change(within(drawer).getByLabelText('Scheduled date/time'), { target: { value: scheduledInput } })
    fireEvent.change(within(drawer).getByLabelText('Due date/time'), { target: { value: dueInput } })
    fireEvent.change(within(drawer).getByLabelText('Crane / equipment being serviced'), { target: { value: 'eq-1' } })
    fireEvent.change(within(drawer).getByLabelText('Operator assignment'), { target: { value: 'emp-1' } })
    fireEvent.click(within(drawer).getByLabelText('Casey Crew'))
    fireEvent.change(within(drawer).getByLabelText('Dispatch notes'), { target: { value: 'Use east gate.' } })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Save Dispatch Plan' }))

    await waitFor(() => expect(jobTicketsApi.update).toHaveBeenCalledWith('job-1', expect.objectContaining({
      equipmentId: 'eq-1',
      status: 3,
      scheduledStartAtUtc: new Date(scheduledInput).toISOString(),
      dueAtUtc: new Date(dueInput).toISOString(),
      internalNotes: 'Dispatch notes: Use east gate.'
    })))
    expect(jobTicketsApi.addAssignment).toHaveBeenCalledWith('job-1', { employeeId: 'emp-1', isLead: true })
    expect(jobTicketsApi.addAssignment).toHaveBeenCalledWith('job-1', { employeeId: 'emp-2', isLead: false })
  })

  it('warns about operator conflicts while still allowing intentional schedule saves', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Schedule & Assign' }))

    const drawer = screen.getByLabelText('schedule and assign ticket')
    fireEvent.change(within(drawer).getByLabelText('Scheduled date/time'), { target: { value: '2026-06-17T15:00' } })
    fireEvent.change(within(drawer).getByLabelText('Crane / equipment being serviced'), { target: { value: 'eq-1' } })
    fireEvent.change(within(drawer).getByLabelText('Operator assignment'), { target: { value: 'emp-1' } })

    expect(within(drawer).getByText('Olivia Operator is already assigned to another job that day.')).toBeInTheDocument()
    expect(within(drawer).queryByText('Crane/equipment also scheduled on JT-2.')).not.toBeInTheDocument()
    expect(within(drawer).getByText('Save is allowed with employee scheduling warnings so dispatch can resolve real-world exceptions intentionally.')).toBeInTheDocument()
  })

  it('moves day-of dispatch actions from the card without opening ticket detail', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Today/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Mark En Route' }))

    await waitFor(() => expect(jobTicketsApi.changeStatus).toHaveBeenCalledWith('job-2', { status: 3 }))
    expect(jobTicketsApi.addWorkEntry).toHaveBeenCalledWith('job-2', expect.objectContaining({
      entryType: 1,
      notes: 'Dispatch update: crew en route.'
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Start Work' }))
    await waitFor(() => expect(jobTicketsApi.changeStatus).toHaveBeenCalledWith('job-2', { status: 4 }))
  })

  it('does not duplicate completed-ticket review or billing workflows', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Today/ }))
    expect(screen.queryByText('JT-3')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finalize Ticket' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ready for Billing' })).not.toBeInTheDocument()
  })
})
