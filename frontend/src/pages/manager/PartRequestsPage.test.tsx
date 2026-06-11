import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { masterDataApi } from '../../api/masterDataApi'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { partRequestsApi } from '../../api/partRequestsApi'
import { PartRequestsPage } from './PartRequestsPage'

vi.mock('../../api/partRequestsApi', () => ({
  partRequestsApi: {
    listQueue: vi.fn(),
    update: vi.fn()
  }
}))

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listParts: vi.fn()
  }
}))

vi.mock('../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listAll: vi.fn()
  }
}))

describe('PartRequestsPage', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
      {
        id: 'job-1',
        ticketNumber: 'JT-2026-000101',
        title: 'Hydraulic Repair',
        status: 2,
        priority: 2,
        customerId: 'customer-1',
        serviceLocationId: 'location-1'
      }
    ])
  })

  it('loads the filtered queue and lets back office update status, notes, price, and catalog match', async () => {
    vi.mocked(partRequestsApi.listQueue).mockResolvedValue([
      {
        id: 'request-1',
        jobTicketId: 'job-1',
        jobTicketNumber: 'JT-2026-000101',
        jobTicketTitle: 'Hydraulic Repair',
        partId: null,
        partNumber: 'Hydraulic hose',
        partName: 'Hydraulic hose',
        quantity: 2,
        notes: 'Need hose at the lift',
        technicianNotes: 'Need hose at the lift',
        requestNotes: 'Urgency: Urgent',
        internalStatusNotes: null,
        unitCostSnapshot: 0,
        salePriceSnapshot: 0,
        isBillable: false,
        needsOrdered: true,
        status: 1,
        requestedAtUtc: '2026-06-01T15:00:00Z'
      }
    ])
    vi.mocked(masterDataApi.listParts).mockResolvedValue([
      {
        id: 'part-1',
        partCategoryId: 'cat-1',
        partNumber: 'HYD-100',
        name: 'Hydraulic Hose',
        unitCost: 50,
        unitPrice: 75,
        quantityOnHand: 4,
        reorderThreshold: 1
      }
    ])
    vi.mocked(partRequestsApi.update).mockResolvedValue({
      id: 'request-1',
      jobTicketId: 'job-1',
      jobTicketNumber: 'JT-2026-000101',
      jobTicketTitle: 'Hydraulic Repair',
      partId: 'part-1',
      partNumber: 'HYD-100',
      partName: 'Hydraulic Hose',
      quantity: 2,
      notes: 'Need hose at the lift',
      internalStatusNotes: 'Matched and approved.',
      unitCostSnapshot: 50,
      salePriceSnapshot: 75,
      isBillable: true,
      needsOrdered: true,
      status: 2,
      requestedAtUtc: '2026-06-01T15:00:00Z'
    })

    render(<PartRequestsPage />)

    expect(await screen.findByRole('heading', { name: 'Parts Request Queue' })).toBeInTheDocument()
    expect(screen.getAllByText(/JT-2026-000101/)).toHaveLength(2)
    expect(screen.getByText('Urgency: Urgent')).toBeInTheDocument()
    expect(screen.getByText(/Qty 2 · Needs ordered/)).toBeInTheDocument()
    expect(partRequestsApi.listQueue).toHaveBeenCalledWith({ status: '', search: '', jobTicketId: '' })

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Parts request job ticket filter'))
    await user.type(screen.getByLabelText('Parts request job ticket filter'), 'Hydraulic')
    await user.click(screen.getByRole('option', { name: 'JT-2026-000101 - Hydraulic Repair' }))
    await user.type(screen.getByLabelText('Search requests'), 'hose')
    await user.selectOptions(screen.getByLabelText('Status filter'), '1')
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    await waitFor(() => {
      expect(partRequestsApi.listQueue).toHaveBeenLastCalledWith({ status: 1, search: 'hose', jobTicketId: 'job-1' })
    })

    await user.selectOptions(screen.getByLabelText('Catalog part match'), 'part-1')
    await user.selectOptions(screen.getByLabelText('Status'), '2')
    await user.type(screen.getByLabelText('Internal status notes'), 'Matched and approved.')
    await user.clear(screen.getByLabelText('Part cost'))
    await user.type(screen.getByLabelText('Part cost'), '50')
    await user.clear(screen.getByLabelText('Billable price'))
    await user.type(screen.getByLabelText('Billable price'), '75')
    await user.click(screen.getByLabelText('Billable after back-office review'))
    await user.click(screen.getByRole('button', { name: 'Save Request Review' }))

    await waitFor(() => {
      expect(partRequestsApi.update).toHaveBeenCalledWith('request-1', {
        partDescription: 'Hydraulic hose',
        quantity: 2,
        status: 2,
        internalStatusNotes: 'Matched and approved.',
        unitCostSnapshot: 50,
        salePriceSnapshot: 75,
        isBillable: true,
        partId: 'part-1'
      })
    })
    expect(screen.getByText('Part request updated.')).toBeInTheDocument()
  })
})
