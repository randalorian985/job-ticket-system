import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/httpClient'
import { masterDataApi } from '../../api/masterDataApi'
import type { CreateJobTicketDto } from '../../types'
import { buildDispatchEditChecks, JobTicketEditorForm } from './JobTicketEditorForm'

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    createEquipment: vi.fn(),
    createServiceLocation: vi.fn()
  }
}))

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
    expect(screen.getByText('7 / 7')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: No edit-side dispatch blockers are visible from the current ticket fields.')).toBeInTheDocument()
    expect(screen.getByText('Dispatch status, customer, location, equipment or no-equipment context, schedule, due date, and job instructions are ready for dispatch review.')).toBeInTheDocument()
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
    expect(screen.getByText('7 / 7')).toBeInTheDocument()
    expect(screen.getByText('Dispatch status, customer, location, equipment or no-equipment context, schedule, due date, and job instructions are ready for dispatch review.')).toBeInTheDocument()
  })

  it('marks tickets outside active dispatch status as needing dispatch review', () => {
    render(
      <JobTicketEditorForm
        initial={{ ...baseTicket, status: 7 }}
        customers={customers}
        serviceLocations={serviceLocations}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByText('Needs dispatch review')).toBeInTheDocument()
    expect(screen.getByText('6 / 7')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: Move the ticket into an active dispatch status before dispatch review.')).toBeInTheDocument()
    expect(screen.getByText('Dispatch status: Move the ticket into an active dispatch status before dispatch review.')).toBeInTheDocument()
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
    expect(screen.getByText('4 / 7')).toBeInTheDocument()
    expect(screen.getByText('Next dispatch fix: Set a scheduled start before dispatch.')).toBeInTheDocument()
    expect(screen.getByText('Scheduled start: Set a scheduled start before dispatch.')).toBeInTheDocument()
    expect(screen.getByText('Due date: Add a due date so dispatch can see timing expectations.')).toBeInTheDocument()
    expect(screen.getByText('Job instructions: Add job instructions or notes for field context.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Scheduled Start (UTC)'), { target: { value: '2026-04-02T09:30' } })
    expect(screen.getByText('Next dispatch fix: Add a due date so dispatch can see timing expectations.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Due (UTC)'), { target: { value: '2026-04-03T17:00' } })
    expect(screen.getByText('Next dispatch fix: Add job instructions or notes for field context.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Replace seal and test restart.' } })

    expect(screen.getByText('Ready for dispatch review')).toBeInTheDocument()
    expect(screen.getByText('7 / 7')).toBeInTheDocument()
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
      expect.objectContaining({ label: 'Dispatch status', isReady: true }),
      expect.objectContaining({ label: 'Service location', isReady: false }),
      expect.objectContaining({ label: 'Equipment context', isReady: true }),
      expect.objectContaining({ label: 'Due date', isReady: false }),
      expect.objectContaining({ label: 'Customer', isReady: true })
    ]))
  })

  it('keeps the readiness helper status-aware without changing enum values', () => {
    const checks = buildDispatchEditChecks({
      ...baseTicket,
      status: 10
    })

    expect(checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'Dispatch status',
        isReady: false,
        detail: 'Move the ticket into an active dispatch status before dispatch review.'
      })
    ]))
  })

  it('quick-adds service locations for the selected customer and selects the new location', async () => {
    vi.mocked(masterDataApi.createServiceLocation).mockResolvedValue({
      id: 's2',
      customerId: 'c1',
      companyName: 'Acme',
      locationName: 'North Shop',
      addressLine1: '55 North St',
      city: 'Waco',
      state: 'TX',
      postalCode: '76701',
      country: 'USA',
      isActive: true
    })

    render(
      <JobTicketEditorForm
        initial={{ ...baseTicket, serviceLocationId: '', equipmentId: null }}
        customers={customers}
        serviceLocations={serviceLocations}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Quick add location' }))
    fireEvent.change(screen.getByLabelText('Location Name'), { target: { value: 'North Shop' } })
    fireEvent.change(screen.getByLabelText('Street Address'), { target: { value: '55 North St' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Waco' } })
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'TX' } })
    fireEvent.change(screen.getByLabelText('Postal Code'), { target: { value: '76701' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Location' }))

    await waitFor(() => expect(masterDataApi.createServiceLocation).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'c1',
      companyName: 'Acme',
      locationName: 'North Shop',
      addressLine1: '55 North St',
      city: 'Waco',
      state: 'TX',
      postalCode: '76701'
    })))
    expect(await screen.findByText('North Shop added and selected.')).toBeInTheDocument()
    expect(screen.getByLabelText('Service Location')).toHaveValue('s2')
  })

  it('quick-adds equipment in the selected customer and service-location context', async () => {
    vi.mocked(masterDataApi.createEquipment).mockResolvedValue({
      id: 'eq2',
      customerId: 'c1',
      serviceLocationId: 's1',
      ownerCustomerId: 'c1',
      responsibleBillingCustomerId: 'c1',
      name: 'Pump 9',
      equipmentNumber: 'EQ-9',
      manufacturer: 'GCCS',
      modelNumber: 'M-9',
      serialNumber: 'SN-9',
      equipmentType: 'Pump',
      year: 2025
    })

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

    fireEvent.click(screen.getByRole('button', { name: 'Quick add equipment' }))
    fireEvent.change(screen.getByLabelText('Equipment Name'), { target: { value: 'Pump 9' } })
    fireEvent.change(screen.getByLabelText('Equipment Number'), { target: { value: 'EQ-9' } })
    fireEvent.change(screen.getByLabelText('Manufacturer'), { target: { value: 'GCCS' } })
    fireEvent.change(screen.getByLabelText('Model Number'), { target: { value: 'M-9' } })
    fireEvent.change(screen.getByLabelText('Serial Number'), { target: { value: 'SN-9' } })
    fireEvent.change(screen.getByLabelText('Equipment Type'), { target: { value: 'Pump' } })
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2025' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Equipment' }))

    await waitFor(() => expect(masterDataApi.createEquipment).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'c1',
      serviceLocationId: 's1',
      ownerCustomerId: 'c1',
      responsibleBillingCustomerId: 'c1',
      name: 'Pump 9',
      equipmentNumber: 'EQ-9',
      manufacturer: 'GCCS',
      modelNumber: 'M-9',
      serialNumber: 'SN-9',
      equipmentType: 'Pump',
      year: 2025
    })))
    expect(await screen.findByText('Pump 9 added and selected.')).toBeInTheDocument()
    expect(screen.getByLabelText('Equipment')).toHaveValue('eq2')
  })

  it('warns and selects existing equipment when quick-add matches loaded equipment', () => {
    const existingEquipment = [
      {
        id: 'eq9',
        customerId: 'c1',
        serviceLocationId: 's1',
        name: 'Pump 9',
        equipmentNumber: 'EQ-9',
        unitNumber: 'U-9',
        serialNumber: 'SN-9'
      }
    ] as any

    render(
      <JobTicketEditorForm
        initial={{ ...baseTicket, equipmentId: null }}
        customers={customers}
        serviceLocations={serviceLocations}
        equipment={existingEquipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Quick add equipment' }))
    fireEvent.change(screen.getByLabelText('Equipment Name'), { target: { value: 'Pump 9' } })
    fireEvent.change(screen.getByLabelText('Equipment Number'), { target: { value: 'eq-9' } })
    fireEvent.change(screen.getByLabelText('Serial Number'), { target: { value: 'sn-9' } })

    expect(screen.getByLabelText('duplicate equipment warning')).toBeInTheDocument()
    expect(screen.getByText('Possible duplicate equipment already exists')).toBeInTheDocument()
    expect(screen.getByText('Equipment # EQ-9 / Unit U-9 / Serial SN-9')).toBeInTheDocument()
    expect(screen.getByText('Matched name, equipment number, serial number.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use existing' }))

    expect(masterDataApi.createEquipment).not.toHaveBeenCalled()
    expect(screen.getByText('Pump 9 selected from existing equipment.')).toBeInTheDocument()
    expect(screen.getByLabelText('Equipment')).toHaveValue('eq9')
    expect(screen.queryByLabelText('duplicate equipment warning')).not.toBeInTheDocument()
  })

  it('quick-adds a job-type reference value and submits it with the ticket', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <JobTicketEditorForm
        initial={baseTicket}
        customers={customers}
        serviceLocations={serviceLocations}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={onSubmit}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Quick add job type' }))
    fireEvent.change(screen.getByLabelText('New Job Type'), { target: { value: 'Emergency Repair' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Job Type' }))
    expect(screen.getByText('Emergency Repair added and selected.')).toBeInTheDocument()
    expect(screen.getByLabelText('Job Type')).toHaveValue('Emergency Repair')

    fireEvent.click(screen.getByRole('button', { name: 'Save Ticket' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      jobType: 'Emergency Repair'
    })))
  })

  it('validates equipment quick-add context before calling the API', () => {
    render(
      <JobTicketEditorForm
        initial={{ ...baseTicket, customerId: '', serviceLocationId: '', billingPartyCustomerId: '', equipmentId: null }}
        customers={customers}
        serviceLocations={serviceLocations}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Quick add equipment' }))
    fireEvent.change(screen.getByLabelText('Equipment Name'), { target: { value: 'Pump 9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Equipment' }))

    expect(screen.getByText('Select a customer and service location before quick-adding equipment.')).toBeInTheDocument()
    expect(masterDataApi.createEquipment).not.toHaveBeenCalled()
  })

  it('surfaces API validation errors from equipment quick-add', async () => {
    vi.mocked(masterDataApi.createEquipment).mockRejectedValue(new ApiError('Serial number is already assigned.', 400))

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

    fireEvent.click(screen.getByRole('button', { name: 'Quick add equipment' }))
    fireEvent.change(screen.getByLabelText('Equipment Name'), { target: { value: 'Truck 8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Equipment' }))

    expect(await screen.findByText('Serial number is already assigned.')).toBeInTheDocument()
    expect(screen.getByLabelText('Equipment')).toHaveValue('eq1')
  })
})
