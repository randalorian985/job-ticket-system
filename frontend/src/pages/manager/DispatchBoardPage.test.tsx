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
    scheduledStartAtUtc: '2026-06-16T15:00:00Z',
    dueAtUtc: '2026-06-16T20:00:00Z',
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
      internalNotes: null
    } as any)
    vi.mocked(jobTicketsApi.update).mockResolvedValue({} as any)
    vi.mocked(jobTicketsApi.addAssignment).mockResolvedValue({} as any)
    vi.mocked(jobTicketsApi.removeAssignment).mockResolvedValue(undefined)
    vi.mocked(jobTicketsApi.changeStatus).mockResolvedValue({} as any)
    vi.mocked(jobTicketsApi.addWorkEntry).mockResolvedValue({} as any)
  })

  it('renders first-class dispatch views and job cards with assignment and ticket context', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Dispatch Board' })).toBeInTheDocument()
    expect(screen.getByText('This board is ticket-backed. En Route and On Site actions add dispatch history notes while preserving the current ticket status model.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Unscheduled Jobs/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Acme · Downtown Yard')).toBeInTheDocument()
    expect(screen.getByText('Job / Scope')).toBeInTheDocument()
    expect(screen.getByText('Operator or crew assignment is missing.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Job Request' })).toHaveAttribute('href', '/manage/job-tickets/new')

    fireEvent.click(screen.getByRole('button', { name: /Today/ }))

    expect(screen.getByText('JT-2')).toBeInTheDocument()
    expect(screen.getByText('Olivia Operator')).toBeInTheDocument()
    expect(screen.getByText('Dispatch planning')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark En Route' })).toHaveAttribute('title', 'Records an En Route dispatch note on the ticket.')
    expect(screen.getByRole('link', { name: 'Open Ticket' })).toHaveAttribute('href', '/manage/job-tickets/job-2')
  })

  it('schedules a job and updates crane, operator, and crew through existing APIs', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }))

    const drawer = screen.getByLabelText('schedule job')
    fireEvent.change(within(drawer).getByLabelText('Scheduled date/time'), { target: { value: '2026-06-17T15:00' } })
    fireEvent.change(within(drawer).getByLabelText('Due date/time'), { target: { value: '2026-06-17T21:00' } })
    fireEvent.change(within(drawer).getByLabelText('Crane assignment'), { target: { value: 'eq-1' } })
    fireEvent.change(within(drawer).getByLabelText('Operator assignment'), { target: { value: 'emp-1' } })
    fireEvent.click(within(drawer).getByLabelText('Casey Crew'))
    fireEvent.change(within(drawer).getByLabelText('Dispatch notes'), { target: { value: 'Use east gate.' } })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Save Schedule' }))

    await waitFor(() => expect(jobTicketsApi.update).toHaveBeenCalledWith('job-1', expect.objectContaining({
      equipmentId: 'eq-1',
      status: 3,
      scheduledStartAtUtc: '2026-06-17T20:00:00.000Z',
      dueAtUtc: '2026-06-18T02:00:00.000Z',
      internalNotes: 'Dispatch notes: Use east gate.'
    })))
    expect(jobTicketsApi.addAssignment).toHaveBeenCalledWith('job-1', { employeeId: 'emp-1', isLead: true })
    expect(jobTicketsApi.addAssignment).toHaveBeenCalledWith('job-1', { employeeId: 'emp-2', isLead: false })
  })

  it('warns about operator conflicts while still allowing intentional schedule saves', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }))

    const drawer = screen.getByLabelText('schedule job')
    fireEvent.change(within(drawer).getByLabelText('Scheduled date/time'), { target: { value: '2026-06-17T15:00' } })
    fireEvent.change(within(drawer).getByLabelText('Crane assignment'), { target: { value: 'eq-1' } })
    fireEvent.change(within(drawer).getByLabelText('Operator assignment'), { target: { value: 'emp-1' } })

    expect(within(drawer).getByText('Olivia Operator is already assigned to another job that day.')).toBeInTheDocument()
    expect(within(drawer).getByText('Save is allowed with warnings so dispatch can resolve real-world exceptions intentionally.')).toBeInTheDocument()
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

  it('surfaces completed work for ticket review and billing readiness', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Needs Ticket Review/ }))
    expect(screen.getByText('JT-3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Finalize Ticket' }))

    await waitFor(() => expect(jobTicketsApi.changeStatus).toHaveBeenCalledWith('job-3', { status: 10 }))
  })
})
