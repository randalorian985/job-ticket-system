import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CreateJobTicketDto } from '../../types'
import { buildDispatchEditChecks, JobTicketEditorForm } from './JobTicketEditorForm'

const baseTicket: CreateJobTicketDto = {
  customerId: 'c1',
  serviceLocationId: 's1',
  billingPartyCustomerId: 'c1',
  equipmentId: 'eq1',
  title: 'Repair pump',
  description: 'Replace seal and test restart.',
  jobType: 'Repair',
  priority: 2,
  status: 3,
  requestedAtUtc: '2026-04-01T08:00:00.000Z',
  scheduledStartAtUtc: '2026-04-02T09:30:00.000Z',
  dueAtUtc: '2026-04-03T17:00:00.000Z',
  assignedManagerEmployeeId: null,
  purchaseOrderNumber: 'PO-44',
  billingContactName: 'Casey Customer',
  billingContactPhone: '555-0100',
  billingContactEmail: 'casey@example.com',
  internalNotes: 'Manager-only note',
  customerFacingNotes: 'Call before arrival.'
}

const customers = [
  { id: 'c1', name: 'Acme' }
] as any

const serviceLocations = [
  { id: 's1', customerId: 'c1', locationName: 'HQ' }
] as any

const equipment = [
  { id: 'eq1', customerId: 'c1', serviceLocationId: 's1', name: 'Truck 7' }
] as any

describe('JobTicketEditorForm dispatch edit readiness review', () => {
  afterEach(() => cleanup())

  it('summarizes ready edit-side dispatch context', () => {
    render(
      <JobTicketEditorForm
        initial={baseTicket}
        customers={customers}
        serviceLocations={serviceLocations}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByLabelText('dispatch edit readiness review')).toBeInTheDocument()
    expect(screen.getByText('Ready for dispatch review')).toBeInTheDocument()
    expect(screen.getByText('6 / 6')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: No edit-side dispatch blockers are visible from the current ticket fields.')).toBeInTheDocument()
    expect(screen.getByText('Customer, location, equipment or no-equipment context, schedule, due date, and job instructions are ready for dispatch review.')).toBeInTheDocument()
  })

  it('keeps no-equipment tickets reviewable when the remaining dispatch context is present', () => {
    render(
      <JobTicketEditorForm
        initial={{ ...baseTicket, equipmentId: null }}
        customers={customers}
        serviceLocations={serviceLocations}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByText('Ready for dispatch review')).toBeInTheDocument()
    expect(screen.getByText('6 / 6')).toBeInTheDocument()
    expect(screen.getByText('Customer, location, equipment or no-equipment context, schedule, due date, and job instructions are ready for dispatch review.')).toBeInTheDocument()
  })

  it('names missing edit-side dispatch context and updates as fields are filled', () => {
    const initial = {
      ...baseTicket,
      description: null,
      internalNotes: null,
      customerFacingNotes: null,
      scheduledStartAtUtc: null,
      dueAtUtc: null
    }

    render(
      <JobTicketEditorForm
        initial={initial}
        customers={customers}
        serviceLocations={serviceLocations}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByText('Needs dispatch review')).toBeInTheDocument()
    expect(screen.getByText('3 / 6')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: Set a scheduled start before dispatch.')).toBeInTheDocument()
    expect(screen.getByText('Set a scheduled start before dispatch.')).toBeInTheDocument()
    expect(screen.getByText('Add a due date so dispatch can see timing expectations.')).toBeInTheDocument()
    expect(screen.getByText('Add job instructions or notes for field context.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Scheduled Start (UTC)'), { target: { value: '2026-04-02T09:30' } })
    expect(screen.getByText('Next dispatch fix: Add a due date so dispatch can see timing expectations.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Due (UTC)'), { target: { value: '2026-04-03T17:00' } })
    expect(screen.getByText('Next dispatch fix: Add job instructions or notes for field context.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Replace seal and test restart.' } })

    expect(screen.getByText('Ready for dispatch review')).toBeInTheDocument()
    expect(screen.getByText('6 / 6')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: No edit-side dispatch blockers are visible from the current ticket fields.')).toBeInTheDocument()
  })

  it('keeps the readiness helper explicit and field-based', () => {
    const checks = buildDispatchEditChecks({
      ...baseTicket,
      serviceLocationId: '',
      equipmentId: null,
      dueAtUtc: null
    })

    expect(checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Service location', isReady: false }),
      expect.objectContaining({ label: 'Equipment context', isReady: true }),
      expect.objectContaining({ label: 'Due date', isReady: false }),
      expect.objectContaining({ label: 'Customer', isReady: true })
    ]))
  })
})
