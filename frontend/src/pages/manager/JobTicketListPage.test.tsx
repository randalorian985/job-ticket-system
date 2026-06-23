import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { ticketStatusFiltersApi } from '../../api/ticketStatusFiltersApi'
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

vi.mock('../../api/ticketStatusFiltersApi', () => ({
  ticketStatusFiltersApi: {
    list: vi.fn()
  }
}))

describe('Manager list pages', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    window.localStorage.clear()
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
      { id: 'c-1', name: 'Acme' },
      { id: 'c-2', name: 'Bravo' }
    ] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
      { id: 's-1', locationName: 'HQ' },
      { id: 's-2', locationName: 'Field Shop' }
    ] as any)
    vi.mocked(ticketStatusFiltersApi.list).mockResolvedValue([
      { id: 'status-submitted', displayLabel: 'Submitted', status: 2, displayOrder: 10, isActive: true },
      { id: 'status-assigned', displayLabel: 'Assigned', status: 3, displayOrder: 20, isActive: true },
      { id: 'status-progress', displayLabel: 'In Progress', status: 4, displayOrder: 30, isActive: true },
      { id: 'status-parts', displayLabel: 'Waiting on Parts', status: 5, displayOrder: 40, isActive: true },
      { id: 'status-customer', displayLabel: 'Waiting on Customer', status: 6, displayOrder: 50, isActive: true }
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

  const renderPage = (initialEntry = '/manage/job-tickets') => {
    render(
      <MemoryRouter future={routerFuture} initialEntries={[initialEntry]}>
        <JobTicketListPage />
      </MemoryRouter>
    )
  }

  it('renders manager job ticket list with loading state, readable labels, timing details, and dispatch ownership cues', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix unit', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1' }
    ] as any)

    renderPage()

    expect(screen.getByLabelText('manager job ticket queue')).toBeInTheDocument()
    expect(screen.getByText(/Loading manager job tickets/)).toBeInTheDocument()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ticket Queue' })).toBeInTheDocument()
    expect(screen.getByText(/In Progress · High/)).toBeInTheDocument()
    expect(screen.getAllByText(/Acme/).length).toBeGreaterThan(0)
    expect(screen.getByText('Assigned: Alex Rivera · Lead: Alex Rivera')).toBeInTheDocument()
    expect(screen.getByText('Dispatch status: Needs dispatch review · Missing scheduled start, due date.')).toBeInTheDocument()
    expect(screen.getByText('Next required update: Set a scheduled start time before dispatch.')).toBeInTheDocument()
    expect(screen.getByText('Due')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('switches to a compact ticket list and persists the manager preference', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      {
        id: 'job-1',
        ticketNumber: 'JT-1',
        title: 'Fix compressor',
        status: 4,
        priority: 3,
        customerId: 'c-1',
        serviceLocationId: 's-1',
        scheduledStartAtUtc: '2026-05-12T08:00:00Z',
        dueAtUtc: '2026-05-13T08:00:00Z'
      }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rich cards' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Compact list' }))

    const compactList = screen.getByLabelText('compact ticket list')
    expect(screen.getByRole('button', { name: 'Compact list' })).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem('job-ticket-manager-queue-view-mode')).toBe('compact')
    expect(within(compactList).getByText('Fix compressor')).toBeInTheDocument()
    expect(within(compactList).getByText('Acme')).toBeInTheDocument()
    expect(within(compactList).getByText('HQ')).toBeInTheDocument()
    expect(within(compactList).getAllByText('Alex Rivera').length).toBeGreaterThan(0)
    expect(within(compactList).getByText('In Progress')).toBeInTheDocument()
    expect(within(compactList).getByText('High')).toBeInTheDocument()
    expect(within(compactList).getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      expect.stringContaining('/manage/job-tickets/job-1')
    )

    cleanup()
    renderPage()

    expect(await screen.findByLabelText('compact ticket list')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compact list' })).toHaveAttribute('aria-pressed', 'true')
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
    expect(screen.getByText('Assigned: Employee unavailable · Lead: Employee unavailable')).toBeInTheDocument()
  })

  it('shows queue summary counts for active, urgent, waiting, unscheduled, missing due date, unassigned, needs-lead, and dispatch readiness work', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 4, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: null, dueAtUtc: null },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Inspect pump', status: 5, priority: 2, customerId: 'c-2', serviceLocationId: 's-2', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' },
      { id: 'job-3', ticketNumber: 'JT-3', title: 'Archive ticket', status: 7, priority: 1, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-11T08:00:00Z', dueAtUtc: '2026-05-14T08:00:00Z' }
    ] as any)

    renderPage()

    expect(await screen.findByText('Active tickets')).toBeInTheDocument()
    expect(screen.getByLabelText('queue summary')).toBeInTheDocument()
    expect(screen.getByText('Urgent active')).toBeInTheDocument()
    expect(screen.getByText('Waiting')).toBeInTheDocument()
    expect(screen.getByText('Unscheduled')).toBeInTheDocument()
    expect(screen.getByText('Missing due')).toBeInTheDocument()
    expect(screen.getAllByText('Unassigned').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Needs lead').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Dispatch-ready').length).toBeGreaterThan(0)
    expect(screen.getByText('Needs review')).toBeInTheDocument()
  })

  it('renders the default configured status filter boxes when no custom configuration exists', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Submitted job', status: 2, priority: 2, customerId: 'c-1', serviceLocationId: 's-1' },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'In progress job', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    const statusFilters = screen.getByLabelText('configured ticket status filters')
    expect(within(statusFilters).getAllByRole('button')).toHaveLength(5)
    expect(within(statusFilters).getByRole('button', { name: /Submitted/ })).toBeInTheDocument()
    expect(within(statusFilters).getByRole('button', { name: /In Progress/ })).toBeInTheDocument()
  })

  it('renders fewer configured status filter boxes and hides inactive options', async () => {
    vi.mocked(ticketStatusFiltersApi.list).mockResolvedValueOnce([
      { id: 'status-progress', displayLabel: 'Field Work', status: 4, displayOrder: 20, isActive: true },
      { id: 'status-review', displayLabel: 'Review Ready', status: 7, displayOrder: 30, isActive: false },
      { id: 'status-parts', displayLabel: 'Parts Hold', status: 5, displayOrder: 10, isActive: true }
    ] as any)
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1' },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Wait parts', status: 5, priority: 2, customerId: 'c-2', serviceLocationId: 's-2' },
      { id: 'job-3', ticketNumber: 'JT-3', title: 'Completed ticket', status: 7, priority: 1, customerId: 'c-1', serviceLocationId: 's-1' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    const statusFilters = screen.getByLabelText('configured ticket status filters')
    const buttons = within(statusFilters).getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(buttons.map((button) => button.querySelector('span')?.textContent)).toEqual(['Parts Hold', 'Field Work'])
    expect(within(statusFilters).queryByText('Review Ready')).not.toBeInTheDocument()

    fireEvent.click(within(statusFilters).getByRole('button', { name: /Field Work/ }))
    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.queryByText('JT-2')).not.toBeInTheDocument()
    expect(screen.queryByText('JT-3')).not.toBeInTheDocument()
  })

  it('renders longer configured status filter lists and keeps closed tickets available to Manager/Admin filters', async () => {
    vi.mocked(ticketStatusFiltersApi.list).mockResolvedValueOnce([
      { id: 'status-draft', displayLabel: 'Draft', status: 1, displayOrder: 10, isActive: true },
      { id: 'status-submitted', displayLabel: 'Submitted', status: 2, displayOrder: 20, isActive: true },
      { id: 'status-assigned', displayLabel: 'Assigned', status: 3, displayOrder: 30, isActive: true },
      { id: 'status-progress', displayLabel: 'In Progress', status: 4, displayOrder: 40, isActive: true },
      { id: 'status-parts', displayLabel: 'Waiting on Parts', status: 5, displayOrder: 50, isActive: true },
      { id: 'status-completed', displayLabel: 'Completed Review', status: 7, displayOrder: 60, isActive: true }
    ] as any)
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Draft job', status: 1, priority: 2, customerId: 'c-1', serviceLocationId: 's-1' },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Completed job', status: 7, priority: 2, customerId: 'c-2', serviceLocationId: 's-2' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    const statusFilters = screen.getByLabelText('configured ticket status filters')
    expect(within(statusFilters).getAllByRole('button')).toHaveLength(6)

    fireEvent.click(within(statusFilters).getByRole('button', { name: /Completed Review/ }))
    expect(screen.queryByText('JT-1')).not.toBeInTheDocument()
    expect(screen.getByText('JT-2')).toBeInTheDocument()
  })

  it('shows ready dispatch context when assignment, lead, schedule, and due date are present', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Dispatch status: Ready for dispatch · Assignment, lead tech, schedule, and due date are present.')).toBeInTheDocument()
    expect(screen.getByText('Next required update: All dispatch requirements are complete.')).toBeInTheDocument()
  })

  it('shows due-date-missing dispatch review when assignment, lead, and schedule are present', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: null }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Dispatch status: Needs dispatch review · Missing due date.')).toBeInTheDocument()
    expect(screen.getByText('Next required update: Add a due date so dispatch can see timing expectations.')).toBeInTheDocument()
  })

  it('shows assignment-first dispatch guidance when no employees are assigned', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-3', ticketNumber: 'JT-3', title: 'Assign field work', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-3')).toBeInTheDocument()
    expect(screen.getByText('Dispatch status: Needs dispatch review · Missing assignment, lead tech.')).toBeInTheDocument()
    expect(screen.getByText('Next required update: Assign at least one employee before dispatch.')).toBeInTheDocument()
  })

  it('does not treat assignment load failures as unassigned tickets or ready dispatch data', async () => {
    vi.mocked(jobTicketsApi.listAssignments).mockRejectedValue(new Error('assignments unavailable'))
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText(/Assignment data could not be loaded for one or more tickets/)).toBeInTheDocument()
    expect(screen.getByText('Technician Assignments')).toBeInTheDocument()
    expect(screen.queryByText('Unassigned')).not.toBeInTheDocument()
    expect(screen.queryByText('Needs lead')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Dispatch readiness')).toBeDisabled()
    expect(screen.getByText('Assigned: Assignment data unavailable · Lead: Assignment data unavailable')).toBeInTheDocument()
    expect(screen.getByText('Dispatch status: Assignment data unavailable · Assignment data could not be loaded for this ticket.')).toBeInTheDocument()
    expect(screen.getByText('Next required update: Reload technician assignments before making dispatch decisions.')).toBeInTheDocument()
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
    expect(screen.getByText('Next required update: Mark one assigned employee as the lead tech.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dispatch readiness'), { target: { value: 'not-active' } })
    expect(screen.queryByText('JT-1')).not.toBeInTheDocument()
    expect(screen.queryByText('JT-2')).not.toBeInTheDocument()
    expect(screen.getByText('JT-3')).toBeInTheDocument()
  })

  it('puts search before queue shortcuts and filters the list when a shortcut is selected', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Urgent compressor', status: 4, priority: 4, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: null, dueAtUtc: null },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Scheduled pump', status: 4, priority: 2, customerId: 'c-2', serviceLocationId: 's-2', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    const filters = screen.getByLabelText('job ticket filters')
    const shortcuts = screen.getByLabelText('queue summary')
    expect(filters.compareDocumentPosition(shortcuts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('Showing all 2 loaded tickets.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Urgent active/ }))

    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.queryByText('JT-2')).not.toBeInTheDocument()
    expect(screen.getByText('Filtered view showing 1 of 2 tickets.')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toHaveValue('active')
    expect(screen.getByLabelText('Priority')).toHaveValue('4')
    expect(screen.getByRole('button', { name: /Urgent active/ })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /Unscheduled/ }))

    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.queryByText('JT-2')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Priority')).toHaveValue('all')
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
    expect(screen.getByText('Filtered view showing 1 of 2 tickets.')).toBeInTheDocument()
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

  it('exports the currently visible ticket queue rows as CSV', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Fix compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Inspect pump', status: 5, priority: 2, customerId: 'c-2', serviceLocationId: 's-2' }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    const exportLink = screen.getByRole('link', { name: 'Export visible queue as CSV' })
    expect(exportLink).toHaveAttribute('download', 'job-ticket-queue.csv')
    const csv = decodeURIComponent(exportLink.getAttribute('href')!.replace('data:text/csv;charset=utf-8,', ''))
    expect(csv).toContain('Ticket Number,Title,Status,Priority,Customer,Service Location,Assigned Employees,Lead Employees,Dispatch Readiness')
    expect(csv).toContain('JT-1,Fix compressor,In Progress,High,Acme,HQ,Alex Rivera,Alex Rivera,Ready for dispatch')
    expect(csv).toContain('JT-2,Inspect pump,Waiting on Parts,Normal,Bravo,Field Shop,Jamie Chen,Needs lead,Needs dispatch review')

    fireEvent.change(screen.getByLabelText(/Search tickets/i), { target: { value: 'compressor' } })

    const filteredExportLink = screen.getByRole('link', { name: 'Export visible queue as CSV' })
    expect(filteredExportLink).toHaveAttribute('download', 'job-ticket-queue-filtered.csv')
    const filteredCsv = decodeURIComponent(filteredExportLink.getAttribute('href')!.replace('data:text/csv;charset=utf-8,', ''))
    expect(filteredCsv).toContain('JT-1,Fix compressor')
    expect(filteredCsv).not.toContain('JT-2,Inspect pump')
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
  it('loads filters from the URL and carries the exact queue into ticket detail links', async () => {
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      { id: 'job-1', ticketNumber: 'JT-1', title: 'Ready compressor', status: 4, priority: 3, customerId: 'c-1', serviceLocationId: 's-1', scheduledStartAtUtc: '2026-05-12T08:00:00Z', dueAtUtc: '2026-05-13T08:00:00Z' },
      { id: 'job-2', ticketNumber: 'JT-2', title: 'Waiting pump', status: 5, priority: 2, customerId: 'c-2', serviceLocationId: 's-2' }
    ] as any)

    renderPage('/manage/job-tickets?status=active&readiness=needs-review')

    expect(await screen.findByText('JT-2')).toBeInTheDocument()
    expect(screen.queryByText('JT-1')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toHaveValue('active')
    expect(screen.getByLabelText('Dispatch readiness')).toHaveValue('needs-review')
    expect(screen.getByRole('link', { name: 'JT-2' })).toHaveAttribute(
      'href',
      expect.stringContaining('returnTo=%2Fmanage%2Fjob-tickets%3Fstatus%3Dactive%26readiness%3Dneeds-review')
    )
  })

})
