import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { filesApi } from '../../api/filesApi'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { usersApi } from '../../api/usersApi'
import { useAuth } from '../../features/auth/AuthContext'
import { routerFuture } from '../../routes/routerFuture'
import { JobTicketDetailPage } from './JobTicketDetailPage'

vi.mock('../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../api/timeEntriesApi', () => ({ timeEntriesApi: { listByJob: vi.fn() } }))
vi.mock('../../api/filesApi', () => ({ filesApi: { list: vi.fn(), getDownloadUrl: vi.fn(() => '#') } }))
vi.mock('../../api/usersApi', () => ({ usersApi: { list: vi.fn() } }))
vi.mock('../../api/jobTicketsApi', () => ({ jobTicketsApi: { get: vi.fn(), listAssignments: vi.fn(), listWorkEntries: vi.fn(), listParts: vi.fn(), changeStatus: vi.fn(), archive: vi.fn(), addAssignment: vi.fn(), removeAssignment: vi.fn(), update: vi.fn() } }))
vi.mock('../../api/masterDataApi', () => ({ masterDataApi: { listCustomers: vi.fn(), listServiceLocations: vi.fn(), listEquipment: vi.fn(), listParts: vi.fn() } }))

describe('JobTicketDetailPage closeout readiness semantics', () => {
  const renderPage = () => {
    render(<MemoryRouter future={routerFuture} initialEntries={['/manage/job-tickets/j1']}><Routes><Route path="/manage/job-tickets/:jobTicketId" element={<JobTicketDetailPage />} /></Routes></MemoryRouter>)
  }

  const setupReadyBase = () => {
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
      priority: 2,
      status: 7,
      scheduledStartAtUtc: '2026-04-02T09:30:00Z',
      purchaseOrderNumber: 'PO-44',
      customerFacingNotes: 'Work complete.'
    } as any)
    vi.mocked(jobTicketsApi.listAssignments).mockResolvedValue([{ employeeId: 'e1', assignedAtUtc: '2026-04-01T08:15:00Z', isLead: true }] as any)
    vi.mocked(jobTicketsApi.listWorkEntries).mockResolvedValue([{ id: 'w1', performedAtUtc: '2026-04-01T12:00:00Z', notes: 'Replaced belt' }] as any)
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([{ id: 'p1', partId: 'part-1', partNumber: 'P-100', partName: 'Hydraulic hose', isUnlistedPart: false, officeOrderRequested: false, quantity: 2, approvalStatus: 2, notes: 'Approved stock', addedAtUtc: '2026-04-01T12:00:00Z', isBillable: false }] as any)
    vi.mocked(timeEntriesApi.listByJob).mockResolvedValue([{ id: 't1', employeeId: 'e1', startedAtUtc: '2026-04-01T09:00:00Z', endedAtUtc: '2026-04-01T10:00:00Z', laborHours: 1.5, billableHours: 1, approvalStatus: 2, workSummary: 'Checked motor' }] as any)
    vi.mocked(filesApi.list).mockResolvedValue([{ id: 'f1', jobTicketId: 'j1', originalFileName: 'photo.jpg' }] as any)
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }] as any)
    vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([{ id: 's1', locationName: 'HQ' }] as any)
    vi.mocked(masterDataApi.listEquipment).mockResolvedValue([{ id: 'eq1', name: 'Truck 7' }] as any)
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(usersApi.list).mockResolvedValue([] as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupReadyBase()
  })

  afterEach(() => {
    cleanup()
  })

  it('counts approved closed time and approved parts as invoice ready', async () => {
    renderPage()

    expect(await screen.findByText('Ready for invoice handoff')).toBeInTheDocument()
    expect(screen.getByText('9 / 9')).toBeInTheDocument()
    expect(screen.getByText('Labor, time approval, parts, files/photos, notes, and billing handoff context are ready for invoice review.')).toBeInTheDocument()
  })

  it('does not count pending time as invoice ready', async () => {
    vi.mocked(timeEntriesApi.listByJob).mockResolvedValue([{ id: 't1', employeeId: 'e1', startedAtUtc: '2026-04-01T09:00:00Z', endedAtUtc: '2026-04-01T10:00:00Z', laborHours: 1.5, billableHours: 1, approvalStatus: 1, workSummary: 'Checked motor' }] as any)

    renderPage()

    expect(await screen.findByText('Needs closeout review')).toBeInTheDocument()
    expect(screen.getByText('Some loaded time entries still need approval review.')).toBeInTheDocument()
  })

  it('does not count approved open time as invoice ready', async () => {
    vi.mocked(timeEntriesApi.listByJob).mockResolvedValue([{ id: 't1', employeeId: 'e1', startedAtUtc: '2026-04-01T09:00:00Z', endedAtUtc: null, laborHours: 1.5, billableHours: 1, approvalStatus: 2, workSummary: 'Checked motor' }] as any)

    renderPage()

    expect(await screen.findByText('Needs closeout review')).toBeInTheDocument()
    expect(screen.getByText('Approved time entries must be clocked out before invoice handoff.')).toBeInTheDocument()
  })

  it('does not count pending or rejected-only parts as invoice ready', async () => {
    vi.mocked(jobTicketsApi.listParts).mockResolvedValue([
      { id: 'p1', partId: 'part-1', partNumber: 'P-100', partName: 'Pending stock', isUnlistedPart: false, officeOrderRequested: false, quantity: 2, approvalStatus: 1, notes: 'Pending stock', addedAtUtc: '2026-04-01T12:00:00Z', isBillable: false },
      { id: 'p2', partId: 'part-2', partNumber: 'P-200', partName: 'Rejected stock', isUnlistedPart: false, officeOrderRequested: false, quantity: 1, approvalStatus: 3, notes: 'Rejected stock', addedAtUtc: '2026-04-01T13:00:00Z', isBillable: false }
    ] as any)

    renderPage()

    expect(await screen.findByText('Needs closeout review')).toBeInTheDocument()
    expect(screen.getByText('Parts are recorded, but none are approved for invoice review.')).toBeInTheDocument()
  })
})
