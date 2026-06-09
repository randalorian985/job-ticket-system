import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { filesApi } from '../../api/filesApi'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { partRequestsApi } from '../../api/partRequestsApi'
import { reportsApi } from '../../api/reportsApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { usersApi } from '../../api/usersApi'
import { useAuth } from '../../features/auth/AuthContext'
import { routerFuture } from '../../routes/routerFuture'
import { JobTicketDetailPage } from './JobTicketDetailPage'

vi.mock('../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../api/timeEntriesApi', () => ({ timeEntriesApi: { listByJob: vi.fn() } }))
vi.mock('../../api/filesApi', () => ({ filesApi: { list: vi.fn(), getDownloadUrl: vi.fn(() => '#') } }))
vi.mock('../../api/usersApi', () => ({ usersApi: { list: vi.fn() } }))
vi.mock('../../api/partRequestsApi', () => ({ partRequestsApi: { createForJobTicket: vi.fn() } }))
vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { get: vi.fn(), listAssignments: vi.fn(), listWorkEntries: vi.fn(), listParts: vi.fn(), changeStatus: vi.fn(), archive: vi.fn(), addAssignment: vi.fn(), removeAssignment: vi.fn(), update: vi.fn() } }))
vi.mock('../../api/masterDataApi', () => ({ masterDataApi: { listCustomers: vi.fn(), listServiceLocations: vi.fn(), listEquipment: vi.fn(), listParts: vi.fn() } }))
vi.mock('../../api/reportsApi', () => ({ reportsApi: { getInvoiceReadySummary: vi.fn() } }))

describe('JobTicketDetailPage', () => {
  const setupBaseMocks = () => {
    vi.spyOn(window, 'print').mockImplementation(() => undefined)
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Manager' } } as any)
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      equipmentId: 'eq1',
      title: 'Issue',
      description: 'Replace leaking hose and confirm restart.',
      jobType: 'Repair',
      priority: 2,
      status: 3,
      requestedAtUtc: '2026-04-01T08:00:00Z',
      scheduledStartAtUtc: '2026-04-02T09:30:00Z',
      dueAtUtc: '2026-04-03T17:00:00Z',
      completedAtUtc: '2026-04-04T13:00:00Z',
      purchaseOrderNumber: 'PO-44',
      billingContactName: 'Casey Customer',
      billingContactPhone: '555-0100',
      billingContactEmail: 'casey@example.com',
      internalNotes: 'Manager-only note',
      customerFacingNotes: 'Call before arrival.'
    } as any)
    vi.mocked(jobTicketsApi.listAssignments).mockResolvedValue([{ employeeId: 'e1', assignedAtUtc: '2026-04-01T08:15:00Z', isLead: true }] as any)
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([{ id: 'w1', performedAtUtc: '2026-04-01T12:00:00Z', notes: 'Replaced belt' }] as any)
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([
      {
        id: 'p1',
        jobTicketId: 'j1',
        partId: 'part-1',
        partNumber: 'P-100',
        partName: 'Hydraulic hose',
        isUnlistedPart: false,
        officeOrderRequested: false,
        quantity: 2,
        approvalStatus: 1,
        notes: 'Pilot stock',
        addedAtUtc: '2026-04-01T12:00:00Z',
        isBillable: false
      }
    ] as any)
    vi.mocked(timeEntriesApi.listByJob).mockResolvedValue([{ id: 't1', employeeId: 'e1', startedAtUtc: '2026-04-01T09:00:00Z', endedAtUtc: '2026-04-01T10:00:00Z', laborHours: 1.5, billableHours: 1, approvalStatus: 1, workSummary: 'Checked motor' }] as any)
    vi.mocked(filesApi.list).mockResolvedValue([{ id: 'f1', jobTicketId: 'j1', originalFileName: 'photo.jpg' }] as any)
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 's1', locationName: 'HQ' }] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([{ id: 'eq1', name: 'Truck 7' }] as any)
    vi.mocked(masterDataApi.listParts).mockResolvedValue([
      {
        id: 'part-1',
        partCategoryId: 'cat-1',
        partNumber: 'P-100',
        name: 'Hydraulic hose',
        description: 'Two wire hose assembly',
        unitCost: 12,
        unitPrice: 25,
        quantityOnHand: 3,
        reorderThreshold: 1,
        isArchived: false
      },
      {
        id: 'part-2',
        partCategoryId: 'cat-1',
        partNumber: 'P-200',
        name: 'Pendant harness',
        unitCost: 20,
        unitPrice: 45,
        quantityOnHand: 0,
        reorderThreshold: 1,
        isArchived: false
      }
    ] as any)
    vi.mocked(partRequestsApi.createForJobTicket).mockResolvedValue({ id: 'request-1' } as any)
    vi.mocked(reportsApi.getInvoiceReadySummary).mockResolvedValue({
      jobTicketId: 'j1',
      jobTicketNumber: 'JT-1',
      customer: 'Acme',
      billingPartyCustomer: 'Acme',
      serviceLocation: 'HQ',
      equipment: 'Truck 7',
      jobStatus: 7,
      invoiceStatus: 1,
      customerFacingNotes: 'Call before arrival.',
      workDescriptions: ['Checked motor'],
      approvedLaborEntries: [
        { timeEntryId: 't-ready', employeeId: 'e1', employeeName: 'Riley Tech', laborHours: 1.5, billableHours: 1, costRate: 40, billRate: 95 }
      ],
      approvedParts: [
        { jobTicketPartId: 'p-ready', partId: 'part-1', partNumber: 'P-100', partName: 'Hydraulic hose', quantity: 2, unitCostSnapshot: 12, unitPriceSnapshot: 25 }
      ],
      laborHours: 1.5,
      laborCostTotal: 60,
      laborBillableTotal: 95,
      partsCostTotal: 24,
      partsBillableTotal: 50,
      miscCharges: 0,
      tax: 7.5,
      grandTotal: 152.5
    } as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupBaseMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const renderPage = () => {
    render(<MemoryRouter future={routerFuture} initialEntries={['/manage/job-tickets/j1']}><Routes><Route path="/manage/job-tickets/:jobTicketId" element={<JobTicketDetailPage />} /></Routes></MemoryRouter>)
  }

  const renderedPageText = () => document.body.textContent?.replace(/\s+/g, ' ') ?? ''

  const expectRenderedText = (text: string) => {
    expect(renderedPageText()).toContain(text)
  }

  const clickFirstButton = (name: string | RegExp) => {
    fireEvent.click(screen.getAllByRole('button', { name })[0])
  }

  const openPartPanel = () => clickFirstButton('Open Add / Request Part Panel')
  const openStatusPanel = () => clickFirstButton('Open Status Review')
  const openArchivePanel = () => clickFirstButton('Archive Review')

  it('renders the Manager/Admin ticket workbench sections and focused action panels', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Workbench Actions' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ticket Overview' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Assignments' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Status / Priority' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Time / Labor' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Parts' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Files / Photos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Invoice-ready Summary' })).toBeInTheDocument()
    expectRenderedText('Ready for dispatch review')
    expectRenderedText('Next Dispatch FixNo dispatch blockers found.')
    expectRenderedText('Assigned employees: e1.')
    expectRenderedText('Lead tech is e1.')
    expectRenderedText('Current lead: e1')
    expectRenderedText('e1 Lead Tech')
    expect(screen.getByText('Labor / Work Entries')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'ticket parts panel' })).toBeInTheDocument()

    openStatusPanel()
    expect(screen.getByRole('heading', { name: 'Status Review' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose a new status' })).toBeDisabled()

    openArchivePanel()
    expect(screen.getByRole('heading', { name: 'Archive Review' })).toBeInTheDocument()
    expect(screen.getByLabelText('Archive Reason')).toBeInTheDocument()
  })

  it('renders invoice-ready report totals in the ticket workspace', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(reportsApi.getInvoiceReadySummary).toHaveBeenCalledWith('j1')
    expect(screen.getAllByText('$152.50').length).toBeGreaterThan(0)
    expect(screen.getByText('Approved Labor Lines')).toBeInTheDocument()
    expect(screen.getByText('Riley Tech')).toBeInTheDocument()
    expect(screen.getAllByText('P-100 - Hydraulic hose').length).toBeGreaterThan(0)
  })

  it('shows invoice handoff readiness when closeout signals are complete', async () => {
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      equipmentId: 'eq1',
      title: 'Issue',
      description: 'Replace leaking hose and confirm restart.',
      jobType: 'Repair',
      priority: 2,
      status: 7,
      scheduledStartAtUtc: '2026-04-02T09:30:00Z',
      purchaseOrderNumber: 'PO-44',
      customerFacingNotes: 'Work complete.'
    } as any)
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([{ id: 'p1', partId: 'part-1', partNumber: 'P-100', partName: 'Hydraulic hose', isUnlistedPart: false, officeOrderRequested: false, quantity: 2, approvalStatus: 2, notes: 'Approved stock', addedAtUtc: '2026-04-01T12:00:00Z', isBillable: false }] as any)
    vi.mocked(timeEntriesApi.listByJob).mockResolvedValue([{ id: 't1', employeeId: 'e1', startedAtUtc: '2026-04-01T09:00:00Z', endedAtUtc: '2026-04-01T10:00:00Z', laborHours: 1.5, billableHours: 1, approvalStatus: 2, workSummary: 'Checked motor' }] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('Ready for invoice handoff')).toBeInTheDocument()
    expect(screen.getByText('Labor, time approval, parts, files/photos, notes, and billing handoff context are ready for invoice review.')).toBeInTheDocument()
  })

  it('shows the Manager/Admin ticket parts panel and waiting-on-parts summary', async () => {
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      equipmentId: 'eq1',
      title: 'Issue',
      description: 'Replace leaking hose and confirm restart.',
      priority: 2,
      status: 5,
      scheduledStartAtUtc: '2026-04-02T09:30:00Z'
    } as any)
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([
      {
        id: 'p1',
        jobTicketId: 'j1',
        partId: 'part-2',
        partNumber: 'P-200',
        partName: 'Pendant harness',
        isUnlistedPart: false,
        officeOrderRequested: true,
        officeOrderNotes: 'Urgency: Urgent',
        quantity: 1,
        approvalStatus: 1,
        notes: 'Need for return visit',
        addedAtUtc: '2026-04-01T12:00:00Z',
        isBillable: false
      },
      {
        id: 'p2',
        jobTicketId: 'j1',
        partId: null,
        partNumber: 'Unlisted pressure switch',
        partName: 'Unlisted pressure switch',
        isUnlistedPart: true,
        officeOrderRequested: false,
        quantity: 1,
        approvalStatus: 2,
        notes: 'Used from truck stock',
        addedAtUtc: '2026-04-01T13:00:00Z',
        isBillable: false
      },
      {
        id: 'p3',
        jobTicketId: 'j1',
        partId: null,
        partNumber: 'Unlisted gasket',
        partName: 'Unlisted gasket',
        isUnlistedPart: true,
        officeOrderRequested: true,
        quantity: 1,
        approvalStatus: 3,
        rejectionReason: 'Need model verification before ordering.',
        addedAtUtc: '2026-04-01T14:00:00Z',
        isBillable: false
      }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'waiting on parts summary' })).toBeInTheDocument()
    expectRenderedText('Parts StatusWaiting on parts review')
    expectRenderedText('Open Blockers2')
    expectRenderedText('Needs Ordered2')
    expectRenderedText('Pending Review1')
    expectRenderedText('Review pending Needs ordered items in the parts request queue.')
    expect(screen.getByText('P-200 - Pendant harness')).toBeInTheDocument()
    expectRenderedText('Qty 1 - Needs ordered - Pending review - Urgency: Urgent - Need for return visit')
    expect(screen.getByText('Unlisted pressure switch - Unlisted pressure switch (unlisted)')).toBeInTheDocument()
    expectRenderedText('Qty 1 - Ticket part only - Approved - Used from truck stock')
    expect(screen.getByText('Unlisted gasket - Unlisted gasket (unlisted)')).toBeInTheDocument()
    expectRenderedText('Qty 1 - Needs ordered - Rejected - Rejection: Need model verification before ordering.')
  })

  it('lets Manager/Admin add or request a part from the ticket detail without pricing fields', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    openPartPanel()
    expect(screen.getByLabelText('add or request ticket part')).toBeInTheDocument()
    expect(screen.queryByLabelText('Unit cost')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Billable price')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Vendor')).not.toBeInTheDocument()
    expect(screen.queryByText(/inventory/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Find existing part or enter new part'), { target: { value: 'pendant' } })
    fireEvent.change(screen.getByLabelText('Existing parts match'), { target: { value: 'part-2' } })
    expect(screen.getByText('Selected existing part: P-200 - Pendant harness')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Needed before return visit' } })
    fireEvent.change(screen.getByLabelText('Urgency'), { target: { value: 'Urgent' } })
    fireEvent.change(screen.getByLabelText('Needed by'), { target: { value: '2026-04-05' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Part Request' }))

    await waitFor(() => {
      expect(partRequestsApi.createForJobTicket).toHaveBeenCalledWith('j1', {
        partDescription: 'Pendant harness',
        partId: 'part-2',
        needsOrdered: true,
        quantity: 2,
        notes: 'Needed before return visit',
        urgency: 'Urgent',
        neededByUtc: new Date('2026-04-05').toISOString()
      })
    })
    expect(await screen.findByText('Part request added to the back-office queue.')).toBeInTheDocument()
  })

  it('clears a selected catalog part when Manager/Admin changes the typed part search', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    openPartPanel()

    fireEvent.change(screen.getByLabelText('Find existing part or enter new part'), { target: { value: 'pendant' } })
    fireEvent.change(screen.getByLabelText('Existing parts match'), { target: { value: 'part-2' } })
    expect(screen.getByText('Selected existing part: P-200 - Pendant harness')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Find existing part or enter new part'), { target: { value: 'Field-cut gasket' } })
    expect(screen.queryByText('Selected existing part: P-200 - Pendant harness')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Submit Part Request' }))

    await waitFor(() => {
      expect(partRequestsApi.createForJobTicket).toHaveBeenCalledWith('j1', {
        partDescription: 'Field-cut gasket',
        partId: null,
        needsOrdered: true,
        quantity: 1,
        notes: null,
        urgency: null,
        neededByUtc: null
      })
    })
  })

  it('lets Manager/Admin add a ticket-only unlisted part without sending order context', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    openPartPanel()

    fireEvent.change(screen.getByLabelText('Find existing part or enter new part'), { target: { value: 'Temporary cap plug' } })
    fireEvent.click(screen.getByLabelText('Needs ordered'))
    expect(screen.queryByLabelText('Urgency')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Used from service kit' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Part Request' }))

    await waitFor(() => {
      expect(partRequestsApi.createForJobTicket).toHaveBeenCalledWith('j1', {
        partDescription: 'Temporary cap plug',
        partId: null,
        needsOrdered: false,
        quantity: 1,
        notes: 'Used from service kit',
        urgency: null,
        neededByUtc: null
      })
    })
    expect(await screen.findByText('Ticket part added.')).toBeInTheDocument()
  })

  it('treats no-equipment detail context as dispatch-ready when the other dispatch signals are complete', async () => {
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      equipmentId: null,
      title: 'Issue',
      description: 'Replace leaking hose and confirm restart.',
      priority: 2,
      status: 3,
      requestedAtUtc: '2026-04-01T08:00:00Z',
      scheduledStartAtUtc: '2026-04-02T09:30:00Z',
      dueAtUtc: '2026-04-03T17:00:00Z',
      purchaseOrderNumber: 'PO-44',
      customerFacingNotes: 'Work complete.'
    } as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expectRenderedText('Ready for dispatch review')
    expectRenderedText('no-equipment context is allowed for this ticket')
  })

  it('marks completed tickets as outside active dispatch even when detail context is complete', async () => {
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      equipmentId: 'eq1',
      title: 'Issue',
      description: 'Replace leaking hose and confirm restart.',
      priority: 2,
      status: 7,
      requestedAtUtc: '2026-04-01T08:00:00Z',
      scheduledStartAtUtc: '2026-04-02T09:30:00Z',
      dueAtUtc: '2026-04-03T17:00:00Z',
      purchaseOrderNumber: 'PO-44',
      customerFacingNotes: 'Work complete.'
    } as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expectRenderedText('Not active dispatch')
    expectRenderedText('Next Dispatch FixTicket is outside the active dispatch queue.')
    expectRenderedText('Dispatch statusTicket is outside the active dispatch queue.')
  })

  it('shows assigned employee names when admin employee records are loaded', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Admin' } } as any)
    vi.mocked(usersApi.list).mockResolvedValue([
      { id: 'e1', firstName: 'Alex', lastName: 'Rivera', role: 'Employee', isArchived: false },
      { id: 'e2', firstName: 'Blair', lastName: 'Stone', role: 'Employee', isArchived: false },
      { id: 'm1', firstName: 'Maya', lastName: 'Manager', role: 'Manager', isArchived: false },
      { id: 'e3', firstName: 'Old', lastName: 'Worker', role: 'Employee', isArchived: true }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expectRenderedText('Assigned employees: Alex Rivera.')
    expectRenderedText('Lead tech is Alex Rivera.')
    expectRenderedText('Current lead: Alex Rivera')
    expectRenderedText('Alex Rivera Lead Tech')
    expect(screen.getByRole('option', { name: 'Blair Stone' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Alex Rivera' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Maya Manager' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Old Worker' })).not.toBeInTheDocument()
  })

  it('shows assignment response names for managers without loading admin user records', async () => {
    vi.mocked(jobTicketsApi.listAssignments).mockResolvedValue([
      { employeeId: 'e1', employeeName: 'Alex Rivera', assignedAtUtc: '2026-04-01T08:15:00Z', isLead: true }
    ] as any)

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expect(usersApi.list).not.toHaveBeenCalled()
    expectRenderedText('Assigned employees: Alex Rivera.')
    expectRenderedText('Lead tech is Alex Rivera.')
    expectRenderedText('Current lead: Alex Rivera')
    expectRenderedText('Alex Rivera Lead Tech')
  })

  it('warns when dispatch coverage is incomplete', async () => {
    vi.mocked(jobTicketsApi.get).mockResolvedValue({
      id: 'j1',
      ticketNumber: 'JT-1',
      customerId: 'c1',
      serviceLocationId: 's1',
      billingPartyCustomerId: 'c1',
      title: 'Issue',
      priority: 2,
      status: 2,
      scheduledStartAtUtc: null,
      dueAtUtc: null
    } as any)
    vi.mocked(jobTicketsApi.listAssignments).mockResolvedValue([] as any)

    renderPage()

    await screen.findAllByText('Needs attention')
    expectRenderedText('Next Dispatch FixNo employees are assigned.')
    expectRenderedText('No employees are assigned.')
    expectRenderedText('No lead tech is marked.')
    expectRenderedText('No scheduled start is set.')
    expectRenderedText('No due date is set.')
  })

  it('marks dispatch readiness unavailable and disables assignment edits when assignments fail to load', async () => {
    vi.mocked(jobTicketsApi.listAssignments).mockRejectedValue(new ApiError('Assignments unavailable', 503, undefined))

    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    expectRenderedText('Assignment data unavailable')
    expectRenderedText('Next Dispatch FixAssignment data could not be loaded. Refresh or retry before dispatch review.')
    expect(screen.getByRole('alert')).toHaveTextContent('Assignment data could not be loaded. Refresh before editing assignments or dispatch review.')
    expect(screen.getByRole('button', { name: 'Assign Employee' })).toBeDisabled()
    expectRenderedText('Assignment dataAssignment data could not be loaded. Refresh or retry before dispatch review.')
  })

  it('prevents adding a second lead without clearing the current one first', async () => {
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('assignment employee'), { target: { value: 'e2' } })
    fireEvent.click(screen.getByLabelText('Lead Tech'))
    fireEvent.click(screen.getByText('Assign Employee'))

    expect(await screen.findByText('A lead tech is already assigned. Remove the current lead before setting a new lead.')).toBeInTheDocument()
    expect(jobTicketsApi.addAssignment).not.toHaveBeenCalled()
  })

  it('shows status review guidance, enables updates for a real change, and calls the API', async () => {
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    openStatusPanel()
    fireEvent.change(screen.getByLabelText('Next Status'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update to In Progress' }))

    await waitFor(() => expect(jobTicketsApi.changeStatus).toHaveBeenCalledWith('j1', { status: 4 }))
    expect(await screen.findByText('Status updated.')).toBeInTheDocument()
  })

  it('feeds closeout warnings into invoice status review', async () => {
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    openStatusPanel()
    fireEvent.change(screen.getByLabelText('Next Status'), { target: { value: '9' } })

    expect(screen.getByText('Invoice readiness: Some loaded time entries still need approval review.')).toBeInTheDocument()
    expect(screen.getByText('Invoice readiness: Parts are recorded, but none are approved for invoice review.')).toBeInTheDocument()
    expect(screen.getByText('Invoice readiness: Move the ticket to Completed before invoice handoff review.')).toBeInTheDocument()
  })

  it('surfaces API validation feedback when a status update is rejected', async () => {
    vi.mocked(jobTicketsApi.changeStatus).mockRejectedValue(new ApiError('Status change blocked', 400, undefined))
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    openStatusPanel()
    fireEvent.change(screen.getByLabelText('Next Status'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update to Invoiced' }))

    expect(await screen.findByText('Status change blocked')).toBeInTheDocument()
  })

  it('prints the browser job review page without adding server exports', async () => {
    renderPage()

    expect(await screen.findByText('JT-1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Print Job Review'))

    expect(window.print).toHaveBeenCalled()
  })

  it('shows confirmation before archive API call', async () => {
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    openArchivePanel()
    fireEvent.change(screen.getByLabelText('Archive Reason'), { target: { value: 'Duplicate ticket' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review Archive' }))

    expect(screen.getByLabelText('archive confirmation')).toBeInTheDocument()
    expect(jobTicketsApi.archive).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Confirm Archive'))
    expect(jobTicketsApi.archive).toHaveBeenCalledWith('j1', { archiveReason: 'Duplicate ticket' })
  })

  it('shows success feedback after archive confirmation succeeds', async () => {
    vi.mocked(jobTicketsApi.archive).mockResolvedValue({} as any)
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    openArchivePanel()
    fireEvent.change(screen.getByLabelText('Archive Reason'), { target: { value: 'Completed and closed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review Archive' }))
    fireEvent.click(screen.getByText('Confirm Archive'))

    expect(await screen.findByText('Ticket archived.')).toBeInTheDocument()
  })

  it('shows API validation feedback after archive confirmation fails', async () => {
    vi.mocked(jobTicketsApi.archive).mockRejectedValue(new ApiError('Archive blocked', 400, undefined))
    renderPage()
    expect(await screen.findByText('JT-1')).toBeInTheDocument()

    openArchivePanel()
    fireEvent.change(screen.getByLabelText('Archive Reason'), { target: { value: 'Invalid closure' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review Archive' }))
    fireEvent.click(screen.getByText('Confirm Archive'))

    expect(await screen.findByText('Archive blocked')).toBeInTheDocument()
  })
})
