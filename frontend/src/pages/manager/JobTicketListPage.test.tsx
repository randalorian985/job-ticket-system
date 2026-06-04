import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { routerFuture } from '../../routes/routerFuture'
import { JobTicketListPage } from './JobTicketListPage'

vi.mock('../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listAll: vi.fn(),
    listAssignments: vi.fn()
  }
}))

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listCustomers: vi.fn(),
    listServiceLocations: vi.fn()
  }
}))

describe('Manager list pages', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c-1', name: 'Acme' },
      { id: 'c-2', name: 'Bravo' }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 's-1', locationName: 'HQ' },
      { id: 's-2', locationName: 'Field Shop' }
    ] as any)
    vi.mocked(jobTicketsApi.listAssignments).mockImplementation(async (jobTicketId: string) => {
      if (jobTicketId === 'job-1') {
        return [{ employeeId: 'e-1', assignedAtUtc: '2026-05-12T08:00:00Z', isLead: true, employeeName: 'Alex Rivera' }] as any
      }

      if (jobTicketId === 'job-2') {
        return [{ employeeId: 'e-2', assignedAtUtc: '2026-05-12T08:30:00Z', isLead: false, employeeName: 'Jamie Chen' }] as any
      }

      return [] as any
    })
  })

  const renderPage = () => {
    render(
      <MemoryRouter future={routerFuture}>
        <JobTicketListPage />
      </MemoryRouter>
    )
  }

  const renderedPageText = () => document.body.textContent?.replace(/\s+/g, ' ') ?? ''

  it('renders manager job ticket list with loading state, readable labels, timing details, and dispatch ownership cues', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix unit', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1' }
    ] as any)

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading manager job tickets')
    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText(/In Progress · High/)).toBeInTheDocument()
    expect(screen.getAllByText(/Acme/).length).toBeGreaterThan(0)
    expect(screen.getByText('Assigned: Alex Rivera · Lead: Alex Rivera')).toBeInTheDocument()
    expect(screen.getByText('Dispatch readiness: Needs dispatch review · Missing scheduled start, due date.')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: Set a scheduled start time before dispatch.')).toBeInTheDocument()
    expect(renderedPageText()).toContain('Due —')
  })

  it('falls back to assignment ids when assignment names are not present', async () => {
    vi.mocked(jobTicketsApi.listAssignments).mockResolvedValue([
      { employeeId: 'e-1', assignedAtUtc: '2026-05-12T08:00:00Z', isLead: true, employeeName: '' }
    ] as any)
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix unit', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Assigned: e-1 · Lead: e-1')).toBeInTheDocument()
  })

  it('shows queue summary counts for active, urgent, waiting, unscheduled, missing due date, unassigned, needs-lead, and dispatch readiness work', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 4, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: null, dueAtUtc: null },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Inspect pump', status: 5, priority: 2, customerId: 'c-2', serviceLocationId: 's-2', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' },
      { id: 'job-3', ticketNumber: 'JT-3', title: 'Archive ticket', status: 7, priority: 1, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-11T08:00:00Z', dueAtUtc: '2026-05-14T08:00:00Z' }
    ] as any)

    renderPage()

    expect(await screen.findByText('Active tickets')).toBeInTheDocument()
    expect(screen.getByText('Urgent active')).toBeInTheDocument()
    expect(screen.getByText('Waiting')).toBeInTheDocument()
    expect(screen.getByText('Unscheduled active')).toBeInTheDocument()
    expect(screen.getByText('Missing due date')).toBeInTheDocument()
    expect(screen.getByText('Unassigned active')).toBeInTheDocument()
    expect(screen.getByText('Needs lead')).toBeInTheDocument()
    expect(screen.getAllByText('Dispatch-ready').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Needs dispatch review').length).toBeGreaterThan(0)
  })

  it('shows ready dispatch context when assignment, lead, schedule, and due date are present', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Dispatch readiness: Ready for dispatch · Assignment, lead tech, schedule, and due date are present.')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: No dispatch blockers are visible from the loaded list data.')).toBeInTheDocument()
  })

  it('shows due-date-missing dispatch review when assignment, lead, and schedule are present', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: null }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Dispatch readiness: Needs dispatch review · Missing due date.')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: Add a due date so dispatch can see timing expectations.')).toBeInTheDocument()
  })

  it('shows assignment-first dispatch guidance when no employees are assigned', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-3', ticketNumber: 'JT-3', title: 'Assign field work', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-3')).toBeInTheDocument()
    expect(screen.getByText('Dispatch readiness: Needs dispatch review · Missing assignment, lead tech.')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: Assign at least one employee before dispatch.')).toBeInTheDocument()
  })

  it('filters by dispatch readiness from the loaded ticket and assignment data', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Ready compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Needs lead', status: 5, priority: 2, customerId: 'c-2', serviceLocationId: 's-2', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' },
      { id: 'job-3', ticketNumber: 'JT-3', title: 'Completed ticket', status: 7, priority: 1, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-11T08:00:00Z', dueAtUtc: '2026-05-14T08:00:00Z' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('JT-2')).toBeInTheDocument()
    expect(screen.getByText('JT-3')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dispatch readiness'), { target: { value: 'ready' } })
    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.queryByText('JT-2')).not.toBeInTheDocument()
    expect(screen.queryByText('JT-3')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dispatch readiness'), { target: { value: 'needs-review' } })
    expect(screen.queryByText('JT-1')).not.toBeInTheDocument()
    expect(screen.getByText('JT-2')).toBeInTheDocument()
    expect(screen.queryByText('JT-3')).not.toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: Mark one assigned employee as the lead tech.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dispatch readiness'), { target: { value: 'not-active' } })
    expect(screen.queryByText('JT-1')).not.toBeInTheDocument()
    expect(screen.queryByText('JT-2')).not.toBeInTheDocument()
    expect(screen.getByText('JT-3')).toBeInTheDocument()
  })

  it('filters by search text, status, priority, and customer, then resets filters', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Inspect pump', status: 5, priority: 2, customerId: 'c-2', serviceLocationId: 's-2' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(await screen.findByText('JT-2')).toBeInTheDocument()

    const resetFiltersButton = screen.getByRole('button', { name: 'Reset Filters' })
    expect(resetFiltersButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Search tickets/i), { target: { value: 'compressor' } })
    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.queryByText('JT-2')).not.toBeInTheDocument()
    expect(resetFiltersButton).toBeEnabled()

    fireEvent.change(screen.getByLabelText(/Search tickets/i), { target: { value: 'Jamie' } })
    expect(screen.queryByText('JT-1')).not.toBeInTheDocument()
    expect(screen.getByText('JT-2')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Search tickets/i), { target: { value: 'compressor' } })
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '5' } })
    expect(screen.getByText('No job tickets match the current filters. Reset filters to see all tickets.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c-1' } })
    fireEvent.change(screen.getByLabelText('Dispatch readiness'), { target: { value: 'ready' } })
    expect(screen.getByText('JT-1')).toBeInTheDocument()

    fireEvent.click(resetFiltersButton)
    expect(resetFiltersButton).toBeDisabled()
    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('JT-2')).toBeInTheDocument()
  })

  it('shows empty and error states', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([])
    const view = render(
      <MemoryRouter future={routerFuture}>
        <JobTicketListPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('No job tickets found. Create a ticket to start the pilot workflow.')).toBeInTheDocument()

    vi.mocked(jobTicketsApi.listAll).mockRejectedValue(new Error('network'))
    view.unmount()
    renderPage()

    await waitFor(() => expect(screen.getByText('Unable to load manager job tickets.')).toBeInTheDocument())
  })

  it('shows a permission-specific error for rejected manager access', async () => {
    vi.mocked(jobTicketsApi.listAll).mockRejectedValue(new ApiError('Forbidden', 403, undefined))

    renderPage()

    await waitFor(() => expect(screen.getByText('You do not have permission to load this manager view.')).toBeInTheDocument())
    expect(screen.queryByText('Unable to load manager job tickets.')).not.toBeInTheDocument()
  })
})
