import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/httpClient'
import { masterDataApi } from '../../api/masterDataApi'
import { reportsApi } from '../../api/reportsApi'
import type { CreateJobTicketDto } from '../../types'
import { buildDispatchEditChecks, JobTicketEditorForm } from './JobTicketEditorForm'

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    createCustomer: vi.fn(),
    createEquipment: vi.fn(),
    createServiceLocation: vi.fn()
  }
}))

vi.mock('../../api/reportsApi', () => ({
  reportsApi: {
    getEquipmentHistory: vi.fn()
  }
}))

const baseTicket: CreateJobTicketDto = {
  customerId: 'c1',
  serviceLocationId: 's1',
  billingPartyCustomerId: 'c1',
  equipmentId: 'eq1',
  locationType: 1,
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

describe('JobTicketEditorForm assignment and schedule requirements review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(reportsApi.getEquipmentHistory).mockResolvedValue([])
  })

  afterEach(() => cleanup())

  const openEditSection = (name: string) => {
    fireEvent.click(screen.getByRole('button', { name }))
  }

  it('summarizes completed assignment and schedule requirements', () => {
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

    expect(screen.getByLabelText('dispatch readiness requirements review')).toBeInTheDocument()
    expect(screen.getByText('Ready to work')).toBeInTheDocument()
    expect(screen.getByText('7 / 7')).toBeInTheDocument()
    expect(screen.getByText('Next required update: All assignment and schedule requirements are complete.')).toBeInTheDocument()
    expect(screen.getByText('Work status, customer, service location, service equipment choice, schedule, due date, and job instructions are ready.')).toBeInTheDocument()
  })

  it('keeps no-equipment tickets ready when the remaining requirements are present', () => {
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

    expect(screen.getByText('Ready to work')).toBeInTheDocument()
    expect(screen.getByText('7 / 7')).toBeInTheDocument()
    expect(screen.getByText('Work status, customer, service location, service equipment choice, schedule, due date, and job instructions are ready.')).toBeInTheDocument()
  })

  it('marks tickets outside active work status as needing schedule readiness updates', () => {
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

    expect(screen.getByText('Needs schedule updates')).toBeInTheDocument()
    expect(screen.getByText('6 / 7')).toBeInTheDocument()
    expect(screen.getByText('Next required update: Move the ticket into an active work status before assignment review.')).toBeInTheDocument()
    expect(screen.getByText('Work status: Move the ticket into an active work status before assignment review.')).toBeInTheDocument()
  })

  it('names missing assignment and schedule requirements and updates as fields are filled', () => {
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

    expect(screen.getByText('Needs schedule updates')).toBeInTheDocument()
    expect(screen.getByText('4 / 7')).toBeInTheDocument()
    expect(screen.getByText('Next required update: Set a scheduled start before work starts.')).toBeInTheDocument()
    expect(screen.getByText('Scheduled start: Set a scheduled start before work starts.')).toBeInTheDocument()
    expect(screen.getByText('Due date: Add a due date for timing expectations.')).toBeInTheDocument()
    expect(screen.getByText('Job instructions: Add job instructions or notes for the technician.')).toBeInTheDocument()

    openEditSection('Schedule')
    fireEvent.change(screen.getByLabelText('Scheduled Start (UTC)'), { target: { value: '2026-04-02T09:30' } })
    expect(screen.getByText('Next required update: Add a due date for timing expectations.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Due (UTC)'), { target: { value: '2026-04-03T17:00' } })
    expect(screen.getByText('Next required update: Add job instructions or notes for the technician.')).toBeInTheDocument()

    openEditSection('Scope & Notes')
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Replace seal and test restart.' } })

    expect(screen.getByText('Ready to work')).toBeInTheDocument()
    expect(screen.getByText('7 / 7')).toBeInTheDocument()
    expect(screen.getByText('Next required update: All assignment and schedule requirements are complete.')).toBeInTheDocument()
  })

  it('keeps the readiness helper explicit and field-based', () => {
    const checks = buildDispatchEditChecks({
      ...baseTicket,
      serviceLocationId: '',
      equipmentId: null,
      dueAtUtc: null
    })

    expect(checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Work status', isReady: true }),
      expect.objectContaining({ label: 'Service location', isReady: false }),
      expect.objectContaining({ label: 'Service equipment', isReady: true }),
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
        label: 'Work status',
        isReady: false,
        detail: 'Move the ticket into an active work status before assignment review.'
      })
    ]))
  })

  it('quick-adds a customer, selects it for the ticket and billing party, then requires location context', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    vi.mocked(masterDataApi.createCustomer).mockResolvedValue({
      id: 'c2',
      name: 'Northwind',
      accountNumber: 'NW-10',
      contactName: 'Nora North',
      email: 'nora@example.com',
      phone: '555-0200',
      billingAddressLine1: '500 Billing Ave',
      billingCity: 'Waco',
      billingState: 'TX',
      billingPostalCode: '76701'
    })

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

    openEditSection('Customer & Service Equipment')
    fireEvent.click(screen.getByRole('button', { name: 'Quick add customer' }))
    fireEvent.change(screen.getByLabelText('Customer Name'), { target: { value: 'Northwind' } })
    fireEvent.change(screen.getByLabelText('Account Number'), { target: { value: 'NW-10' } })
    fireEvent.change(screen.getByLabelText('Contact Name'), { target: { value: 'Nora North' } })
    fireEvent.change(screen.getByLabelText('Contact Phone'), { target: { value: '555-0200' } })
    fireEvent.change(screen.getByLabelText('Contact Email'), { target: { value: 'nora@example.com' } })
    fireEvent.change(screen.getByLabelText('Billing Address'), { target: { value: '500 Billing Ave' } })
    fireEvent.change(screen.getByLabelText('Billing City'), { target: { value: 'Waco' } })
    fireEvent.change(screen.getByLabelText('Billing State'), { target: { value: 'TX' } })
    fireEvent.change(screen.getByLabelText('Billing ZIP / Postal'), { target: { value: '76701' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Customer' }))

    await waitFor(() => expect(masterDataApi.createCustomer).toHaveBeenCalledWith({
      name: 'Northwind',
      accountNumber: 'NW-10',
      contactName: 'Nora North',
      email: 'nora@example.com',
      phone: '555-0200',
      billingAddressLine1: '500 Billing Ave',
      billingAddressLine2: null,
      billingCity: 'Waco',
      billingState: 'TX',
      billingPostalCode: '76701'
    }))

    expect(await screen.findByText('Northwind added and selected.')).toBeInTheDocument()
    expect(screen.getByLabelText('Customer')).toHaveValue('c2')
    expect(screen.getByLabelText('Billing Party')).toHaveValue('c2')
    expect(screen.getByLabelText('Service Location')).toHaveValue('')
    expect(screen.getByLabelText('Crane / Equipment Being Serviced')).toHaveValue('')
    openEditSection('Billing')
    expect(screen.getByLabelText('Billing Contact Name')).toHaveValue('Nora North')
    expect(screen.getByLabelText('Billing Contact Phone')).toHaveValue('555-0200')
    expect(screen.getByLabelText('Billing Contact Email')).toHaveValue('nora@example.com')

    fireEvent.click(screen.getByRole('button', { name: 'Save Ticket' }))

    expect(screen.getByText('Customer, location, billing party, and title are required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('defaults billing party from customer without overwriting an explicit billing override', () => {
    render(
      <JobTicketEditorForm
        initial={{ ...baseTicket, customerId: '', serviceLocationId: '', billingPartyCustomerId: '', equipmentId: null }}
        customers={[
          { id: 'c1', name: 'Acme', billingPartyCustomerId: 'c2' },
          { id: 'c2', name: 'Separate Billing Co' },
          { id: 'c3', name: 'Northwind' }
        ] as any}
        serviceLocations={serviceLocations}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    openEditSection('Customer & Service Equipment')
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c1' } })

    expect(screen.getByLabelText('Billing Party')).toHaveValue('c2')
    expect(screen.getByText('Billing party is separate from the customer and job site.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Billing Party'), { target: { value: 'c2' } })
    expect(screen.getByText('Billing party is separate from the customer and job site.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c3' } })
    expect(screen.getByLabelText('Billing Party')).toHaveValue('c2')
  })

  it('validates customer quick-add before calling the API', () => {
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

    openEditSection('Customer & Service Equipment')
    fireEvent.click(screen.getByRole('button', { name: 'Quick add customer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Customer' }))

    expect(screen.getByText('Customer name is required.')).toBeInTheDocument()
    expect(masterDataApi.createCustomer).not.toHaveBeenCalled()
  })

  it('quick-adds service locations for the selected customer and selects the new location', async () => {
    vi.mocked(masterDataApi.createServiceLocation).mockResolvedValue({
      id: 's2',
      customerId: 'c1',
      companyName: 'Acme',
      locationName: 'North Shop',
      onSiteContactName: 'Nora Site',
      onSiteContactPhone: '555-0300',
      onSiteContactEmail: 'site@example.com',
      addressLine1: '55 North St',
      addressLine2: 'Dock 4',
      city: 'Waco',
      state: 'TX',
      postalCode: '76701',
      parishCounty: 'McLennan',
      country: 'USA',
      gateCode: '4321',
      accessInstructions: 'Use north gate',
      safetyRequirements: 'Hard hat required',
      siteNotes: 'Check in at office',
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

    openEditSection('Customer & Service Equipment')
    fireEvent.click(screen.getByRole('button', { name: 'Quick add location' }))
    fireEvent.change(screen.getByLabelText('Location Name'), { target: { value: 'North Shop' } })
    fireEvent.change(screen.getByLabelText('On-site Contact'), { target: { value: 'Nora Site' } })
    fireEvent.change(screen.getByLabelText('On-site Phone'), { target: { value: '555-0300' } })
    fireEvent.change(screen.getByLabelText('On-site Email'), { target: { value: 'site@example.com' } })
    fireEvent.change(screen.getByLabelText('Street Address'), { target: { value: '55 North St' } })
    fireEvent.change(screen.getByLabelText('Street Address 2'), { target: { value: 'Dock 4' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Waco' } })
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'TX' } })
    fireEvent.change(screen.getByLabelText('Postal Code'), { target: { value: '76701' } })
    fireEvent.change(screen.getByLabelText('Parish / County'), { target: { value: 'McLennan' } })
    fireEvent.change(screen.getByLabelText('Gate Code'), { target: { value: '4321' } })
    fireEvent.change(screen.getByLabelText('Access Instructions'), { target: { value: 'Use north gate' } })
    fireEvent.change(screen.getByLabelText('Safety Requirements'), { target: { value: 'Hard hat required' } })
    fireEvent.change(screen.getByLabelText('Site Notes'), { target: { value: 'Check in at office' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Location' }))

    await waitFor(() => expect(masterDataApi.createServiceLocation).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'c1',
      companyName: 'Acme',
      locationName: 'North Shop',
      onSiteContactName: 'Nora Site',
      onSiteContactPhone: '555-0300',
      onSiteContactEmail: 'site@example.com',
      addressLine1: '55 North St',
      addressLine2: 'Dock 4',
      city: 'Waco',
      state: 'TX',
      postalCode: '76701',
      parishCounty: 'McLennan',
      gateCode: '4321',
      accessInstructions: 'Use north gate',
      safetyRequirements: 'Hard hat required',
      siteNotes: 'Check in at office'
    })))
    expect(await screen.findByText('North Shop added and selected.')).toBeInTheDocument()
    expect(screen.getByLabelText('Service Location')).toHaveValue('s2')
  })

  it('copies the selected customer address into the quick-add job location form', () => {
    render(
      <JobTicketEditorForm
        initial={{ ...baseTicket, serviceLocationId: '', equipmentId: null }}
        customers={[{
          id: 'c1',
          name: 'Acme',
          contactName: 'Alex Customer',
          phone: '555-0100',
          email: 'alex@example.com',
          billingAddressLine1: '100 Billing Rd',
          billingAddressLine2: 'Suite 5',
          billingCity: 'Tulsa',
          billingState: 'OK',
          billingPostalCode: '74101'
        }] as any}
        serviceLocations={[]}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    openEditSection('Customer & Service Equipment')
    fireEvent.click(screen.getByRole('button', { name: 'Quick add location' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use customer address' }))

    expect(screen.getByLabelText('Location Name')).toHaveValue('Acme')
    expect(screen.getByLabelText('On-site Contact')).toHaveValue('Alex Customer')
    expect(screen.getByLabelText('On-site Phone')).toHaveValue('555-0100')
    expect(screen.getByLabelText('On-site Email')).toHaveValue('alex@example.com')
    expect(screen.getByLabelText('Street Address')).toHaveValue('100 Billing Rd')
    expect(screen.getByLabelText('Street Address 2')).toHaveValue('Suite 5')
    expect(screen.getByLabelText('City')).toHaveValue('Tulsa')
    expect(screen.getByLabelText('State')).toHaveValue('OK')
    expect(screen.getByLabelText('Postal Code')).toHaveValue('74101')
    expect(screen.getByText('Customer address copied into the job location.')).toBeInTheDocument()
  })

  it('copies billing-party and job-site contact details into billing fields', () => {
    render(
      <JobTicketEditorForm
        initial={{ ...baseTicket, billingPartyCustomerId: 'bill-1', billingContactName: null, billingContactPhone: null, billingContactEmail: null }}
        customers={[
          { id: 'c1', name: 'Acme', phone: '555-0100' },
          { id: 'bill-1', name: 'Acme AP', contactName: 'Bill Contact', phone: '555-0400', email: 'billing@example.com' }
        ] as any}
        serviceLocations={[{
          id: 's1',
          customerId: 'c1',
          locationName: 'HQ',
          onSiteContactName: 'Site Contact',
          onSiteContactPhone: '555-0300',
          onSiteContactEmail: 'site@example.com',
          postalCode: '74101'
        }] as any}
        equipment={equipment}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    openEditSection('Billing')
    fireEvent.click(screen.getByRole('button', { name: 'Use billing address' }))

    expect(screen.getByLabelText('Billing Contact Name')).toHaveValue('Bill Contact')
    expect(screen.getByLabelText('Billing Contact Phone')).toHaveValue('555-0400')
    expect(screen.getByLabelText('Billing Contact Email')).toHaveValue('billing@example.com')

    fireEvent.click(screen.getByRole('button', { name: 'Use job-site contact' }))

    expect(screen.getByLabelText('Billing Contact Name')).toHaveValue('Site Contact')
    expect(screen.getByLabelText('Billing Contact Phone')).toHaveValue('555-0300')
    expect(screen.getByLabelText('Billing Contact Email')).toHaveValue('site@example.com')
  })

  it('uses equipment billing customer as the ticket billing party', () => {
    render(
      <JobTicketEditorForm
        initial={{ ...baseTicket, billingPartyCustomerId: 'c1' }}
        customers={[
          { id: 'c1', name: 'Acme' },
          { id: 'bill-1', name: 'Acme AP' }
        ] as any}
        serviceLocations={serviceLocations}
        equipment={[{
          id: 'eq1',
          customerId: 'c1',
          serviceLocationId: 's1',
          responsibleBillingCustomerId: 'bill-1',
          name: 'Truck 7'
        }] as any}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    openEditSection('Customer & Service Equipment')
    fireEvent.click(screen.getByRole('button', { name: 'Use equipment billing customer' }))

    expect(screen.getByLabelText('Billing Party')).toHaveValue('bill-1')
    expect(screen.getByText('Equipment billing customer selected as the billing party.')).toBeInTheDocument()
    expect(screen.getByText('Billing party is the equipment billing customer.')).toBeInTheDocument()
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

    openEditSection('Customer & Service Equipment')
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
    expect(screen.getByLabelText('Crane / Equipment Being Serviced')).toHaveValue('eq2')
  })

  it('shows recent service history for the selected equipment using existing report data', async () => {
    vi.mocked(reportsApi.getEquipmentHistory).mockResolvedValue([
      {
        jobTicketId: 'job-1',
        jobTicketNumber: 'JT-1001',
        customerId: 'c1',
        customer: 'Acme',
        equipmentId: 'eq1',
        equipment: 'Truck 7',
        title: 'Replace hydraulic hose',
        jobStatus: 7,
        createdAtUtc: '2026-03-01T08:00:00.000Z',
        completedAtUtc: '2026-03-02T17:00:00.000Z'
      }
    ])

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

    openEditSection('Customer & Service Equipment')
    expect(await screen.findByText('JT-1001: Replace hydraulic hose')).toBeInTheDocument()
    expect(reportsApi.getEquipmentHistory).toHaveBeenCalledWith('eq1', { offset: 0, limit: 3 })
    const serviceHistory = screen.getByLabelText('equipment service history')
    expect(within(serviceHistory).getByText(/7 - Completed/)).toBeInTheDocument()
    expect(screen.getByText('Use this history for Manager/Admin reference only; it does not recommend parts or guarantee compatibility.')).toBeInTheDocument()
  })

  it('keeps equipment service history optional when no equipment is selected or history cannot load', async () => {
    vi.mocked(reportsApi.getEquipmentHistory).mockRejectedValue(new Error('network'))

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

    openEditSection('Customer & Service Equipment')
    expect(screen.getByText('Select the crane/equipment being serviced to review its recent service history before saving this ticket.')).toBeInTheDocument()
    expect(reportsApi.getEquipmentHistory).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Crane / Equipment Being Serviced'), { target: { value: 'eq1' } })

    expect(await screen.findByText('Equipment service history is unavailable right now.')).toBeInTheDocument()
  })

  it('warns about possible duplicate equipment without blocking quick-add', async () => {
    vi.mocked(masterDataApi.createEquipment).mockResolvedValue({
      id: 'eq2',
      customerId: 'c1',
      serviceLocationId: 's1',
      ownerCustomerId: 'c1',
      responsibleBillingCustomerId: 'c1',
      name: 'Truck 7 - Replacement',
      equipmentNumber: 'EQ-7B',
      unitNumber: 'Unit-7',
      serialNumber: 'SN-7'
    })

    render(
      <JobTicketEditorForm
        initial={baseTicket}
        customers={customers}
        serviceLocations={serviceLocations}
        equipment={[{
          id: 'eq1',
          customerId: 'c1',
          serviceLocationId: 's1',
          name: 'Truck 7',
          equipmentNumber: 'EQ-7',
          unitNumber: 'Unit-7',
          serialNumber: 'SN-7'
        }] as any}
        submitLabel="Save Ticket"
        onSubmit={vi.fn()}
      />
    )

    openEditSection('Customer & Service Equipment')
    fireEvent.click(screen.getByRole('button', { name: 'Quick add equipment' }))
    fireEvent.change(screen.getByLabelText('Equipment Name'), { target: { value: ' truck 7 ' } })
    fireEvent.change(screen.getByLabelText('Serial Number'), { target: { value: 'sn-7' } })

    expect(screen.getByRole('status', { name: 'possible duplicate equipment warning' })).toBeInTheDocument()
    expect(screen.getByText('Truck 7: matches name, serial number.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Equipment Name'), { target: { value: 'Truck 7 - Replacement' } })
    fireEvent.change(screen.getByLabelText('Equipment Number'), { target: { value: 'EQ-7B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Equipment' }))

    await waitFor(() => expect(masterDataApi.createEquipment).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Truck 7 - Replacement',
      equipmentNumber: 'EQ-7B',
      serialNumber: 'sn-7'
    })))
    expect(await screen.findByText('Truck 7 - Replacement added and selected.')).toBeInTheDocument()
    expect(screen.getByLabelText('Crane / Equipment Being Serviced')).toHaveValue('eq2')
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

    openEditSection('Customer & Service Equipment')
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

    openEditSection('Customer & Service Equipment')
    fireEvent.click(screen.getByRole('button', { name: 'Quick add equipment' }))
    fireEvent.change(screen.getByLabelText('Equipment Name'), { target: { value: 'Truck 8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Equipment' }))

    expect(await screen.findByText('Serial number is already assigned.')).toBeInTheDocument()
    expect(screen.getByLabelText('Crane / Equipment Being Serviced')).toHaveValue('eq1')
  })
})
