import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/httpClient'
import { masterDataApi } from '../../api/masterDataApi'
import { reportsApi } from '../../api/reportsApi'
import type {
  CreateCustomerDto,
  CreateEquipmentDto,
  CreateJobTicketDto,
  CreateServiceLocationDto,
  CustomerDto,
  EquipmentDto,
  ReportServiceHistoryItemDto,
  ServiceLocationDto
} from '../../types'
import { priorityOptions, jobStatusOptions } from './managerDisplay'

type Props = {
  initial: CreateJobTicketDto
  customers: CustomerDto[]
  serviceLocations: ServiceLocationDto[]
  equipment: EquipmentDto[]
  onSubmit: (payload: CreateJobTicketDto) => Promise<void>
  onCustomerCreated?: (customer: CustomerDto) => void
  onServiceLocationCreated?: (serviceLocation: ServiceLocationDto) => void
  onEquipmentCreated?: (equipment: EquipmentDto) => void
  submitLabel: string
}

type DispatchEditCheck = {
  label: string
  isReady: boolean
  detail: string
}

type EquipmentDuplicateMatch = {
  equipment: EquipmentDto
  reasons: string[]
}

type CustomerQuickAddDraft = {
  name: string
  accountNumber: string
  contactName: string
  email: string
  phone: string
}

type ServiceLocationQuickAddDraft = {
  locationName: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  country: string
}

type EquipmentQuickAddDraft = {
  name: string
  equipmentNumber: string
  unitNumber: string
  manufacturer: string
  modelNumber: string
  serialNumber: string
  equipmentType: string
  year: string
}

type EquipmentDuplicateCheckDraft = Pick<EquipmentQuickAddDraft, 'name' | 'equipmentNumber' | 'unitNumber' | 'serialNumber'>

export type EquipmentDuplicateWarning = {
  equipment: EquipmentDto
  matchedFields: string[]
}

const activeDispatchStatuses = new Set([2, 3, 4, 5, 6])
const defaultJobTypeOptions = ['Repair', 'Inspection', 'Warranty', 'Install', 'Preventive Maintenance']
const equipmentDuplicateMatchFields: Array<{
  label: string
  draftKey: keyof EquipmentDuplicateCheckDraft
  equipmentKey: keyof EquipmentDto
}> = [
  { label: 'name', draftKey: 'name', equipmentKey: 'name' },
  { label: 'equipment number', draftKey: 'equipmentNumber', equipmentKey: 'equipmentNumber' },
  { label: 'unit number', draftKey: 'unitNumber', equipmentKey: 'unitNumber' },
  { label: 'serial number', draftKey: 'serialNumber', equipmentKey: 'serialNumber' }
]

const emptyCustomerDraft: CustomerQuickAddDraft = {
  name: '',
  accountNumber: '',
  contactName: '',
  email: '',
  phone: ''
}

const emptyServiceLocationDraft: ServiceLocationQuickAddDraft = {
  locationName: '',
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA'
}

const emptyEquipmentDraft: EquipmentQuickAddDraft = {
  name: '',
  equipmentNumber: '',
  unitNumber: '',
  manufacturer: '',
  modelNumber: '',
  serialNumber: '',
  equipmentType: '',
  year: ''
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  return [item, ...items.filter((existing) => existing.id !== item.id)]
}

function uniqueLabels(labels: Array<string | null | undefined>) {
  const seen = new Set<string>()
  return labels
    .map((label) => label?.trim())
    .filter((label): label is string => Boolean(label))
    .filter((label) => {
      const key = label.toLowerCase()
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizedText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function jobStatusLabel(value: number) {
  return jobStatusOptions.find((item) => item.value === value)?.label ?? `Status ${value}`
}

export function findEquipmentQuickAddDuplicates(
  draft: EquipmentDuplicateCheckDraft,
  equipment: EquipmentDto[]
): EquipmentDuplicateWarning[] {
  return equipment
    .map((item) => {
      const matchedFields = equipmentDuplicateMatchFields
        .filter(({ draftKey, equipmentKey }) => {
          const draftValue = normalizedText(draft[draftKey])
          return Boolean(draftValue) && draftValue === normalizedText(item[equipmentKey] as string | null | undefined)
        })
        .map(({ label }) => label)

      return { equipment: item, matchedFields }
    })
    .filter((warning) => warning.matchedFields.length > 0)
}

function findEquipmentDuplicateMatches(
  draft: EquipmentDuplicateCheckDraft,
  equipment: EquipmentDto[],
  customerId: string,
  serviceLocationId: string
): EquipmentDuplicateMatch[] {
  if (!customerId || !serviceLocationId) {
    return []
  }

  return findEquipmentQuickAddDuplicates(
    draft,
    equipment.filter((item) => item.customerId === customerId && item.serviceLocationId === serviceLocationId)
  ).map((warning) => ({ equipment: warning.equipment, reasons: warning.matchedFields }))
}

function quickAddErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function buildDispatchEditChecks(form: CreateJobTicketDto): DispatchEditCheck[] {
  const hasEquipmentAssignment = Boolean(form.equipmentId)
  const isActiveDispatchStatus = activeDispatchStatuses.has(form.status)

  return [
    {
      label: 'Dispatch status',
      isReady: isActiveDispatchStatus,
      detail: isActiveDispatchStatus
        ? 'Ticket is in the active dispatch queue.'
        : 'Move the ticket into an active dispatch status before dispatch review.'
    },
    {
      label: 'Customer',
      isReady: Boolean(form.customerId),
      detail: form.customerId ? 'Customer is selected.' : 'Select the customer before dispatch review.'
    },
    {
      label: 'Service location',
      isReady: Boolean(form.serviceLocationId),
      detail: form.serviceLocationId ? 'Service location is selected.' : 'Select the service location before dispatch review.'
    },
    {
      label: 'Equipment decision',
      isReady: true,
      detail: hasEquipmentAssignment ? 'Equipment is selected.' : 'This ticket can be dispatched without equipment.'
    },
    {
      label: 'Scheduled start',
      isReady: Boolean(form.scheduledStartAtUtc),
      detail: form.scheduledStartAtUtc ? 'Scheduled start is set.' : 'Set a scheduled start before dispatch.'
    },
    {
      label: 'Due date',
      isReady: Boolean(form.dueAtUtc),
      detail: form.dueAtUtc ? 'Due date is set.' : 'Add a due date so dispatch can see timing expectations.'
    },
    {
      label: 'Job instructions',
      isReady: Boolean(form.description?.trim() || form.internalNotes?.trim() || form.customerFacingNotes?.trim()),
      detail: form.description?.trim() || form.internalNotes?.trim() || form.customerFacingNotes?.trim()
        ? 'Job instructions or notes are present.'
        : 'Add job instructions or notes for the technician.'
    }
  ]
}

export function JobTicketEditorForm({
  initial,
  customers,
  serviceLocations,
  equipment,
  onSubmit,
  onCustomerCreated,
  onServiceLocationCreated,
  onEquipmentCreated,
  submitLabel
}: Props) {
  const [form, setForm] = useState<CreateJobTicketDto>(initial)
  const [error, setError] = useState<string | null>(null)
  const [createdCustomers, setCreatedCustomers] = useState<CustomerDto[]>([])
  const [createdServiceLocations, setCreatedServiceLocations] = useState<ServiceLocationDto[]>([])
  const [createdEquipment, setCreatedEquipment] = useState<EquipmentDto[]>([])
  const [customerQuickAddOpen, setCustomerQuickAddOpen] = useState(false)
  const [serviceLocationQuickAddOpen, setServiceLocationQuickAddOpen] = useState(false)
  const [equipmentQuickAddOpen, setEquipmentQuickAddOpen] = useState(false)
  const [jobTypeQuickAddOpen, setJobTypeQuickAddOpen] = useState(false)
  const [customerDraft, setCustomerDraft] = useState<CustomerQuickAddDraft>(emptyCustomerDraft)
  const [serviceLocationDraft, setServiceLocationDraft] = useState<ServiceLocationQuickAddDraft>(emptyServiceLocationDraft)
  const [equipmentDraft, setEquipmentDraft] = useState<EquipmentQuickAddDraft>(emptyEquipmentDraft)
  const [jobTypeDraft, setJobTypeDraft] = useState('')
  const [customerQuickAddError, setCustomerQuickAddError] = useState<string | null>(null)
  const [serviceLocationQuickAddError, setServiceLocationQuickAddError] = useState<string | null>(null)
  const [equipmentQuickAddError, setEquipmentQuickAddError] = useState<string | null>(null)
  const [jobTypeQuickAddError, setJobTypeQuickAddError] = useState<string | null>(null)
  const [customerQuickAddMessage, setCustomerQuickAddMessage] = useState<string | null>(null)
  const [serviceLocationQuickAddMessage, setServiceLocationQuickAddMessage] = useState<string | null>(null)
  const [equipmentQuickAddMessage, setEquipmentQuickAddMessage] = useState<string | null>(null)
  const [jobTypeQuickAddMessage, setJobTypeQuickAddMessage] = useState<string | null>(null)
  const [jobTypeOptions, setJobTypeOptions] = useState(() => uniqueLabels([...defaultJobTypeOptions, initial.jobType]))
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [isAddingServiceLocation, setIsAddingServiceLocation] = useState(false)
  const [isAddingEquipment, setIsAddingEquipment] = useState(false)
  const [equipmentHistory, setEquipmentHistory] = useState<ReportServiceHistoryItemDto[]>([])
  const [equipmentHistoryError, setEquipmentHistoryError] = useState<string | null>(null)
  const [isLoadingEquipmentHistory, setIsLoadingEquipmentHistory] = useState(false)

  const allCustomers = useMemo(
    () => {
      const merged = [...createdCustomers]
      customers.forEach((item) => {
        if (!merged.some((existing) => existing.id === item.id)) {
          merged.push(item)
        }
      })
      return merged
    },
    [createdCustomers, customers]
  )

  const allServiceLocations = useMemo(
    () => {
      const merged = [...createdServiceLocations]
      serviceLocations.forEach((item) => {
        if (!merged.some((existing) => existing.id === item.id)) {
          merged.push(item)
        }
      })
      return merged
    },
    [createdServiceLocations, serviceLocations]
  )

  const allEquipment = useMemo(
    () => {
      const merged = [...createdEquipment]
      equipment.forEach((item) => {
        if (!merged.some((existing) => existing.id === item.id)) {
          merged.push(item)
        }
      })
      return merged
    },
    [createdEquipment, equipment]
  )

  const selectedCustomer = allCustomers.find((item) => item.id === form.customerId)
  const selectedServiceLocation = allServiceLocations.find((item) => item.id === form.serviceLocationId)

  const displayedJobTypeOptions = useMemo(
    () => uniqueLabels([...jobTypeOptions, form.jobType]),
    [form.jobType, jobTypeOptions]
  )

  const filteredLocations = useMemo(
    () => allServiceLocations.filter((item) => !form.customerId || item.customerId === form.customerId),
    [allServiceLocations, form.customerId]
  )

  const filteredEquipment = useMemo(() => allEquipment.filter((item) => {
    if (form.serviceLocationId) {
      return item.serviceLocationId === form.serviceLocationId
    }

    if (form.customerId) {
      return item.customerId === form.customerId
    }

    return true
  }), [allEquipment, form.customerId, form.serviceLocationId])

  const equipmentDuplicateMatches = useMemo(
    () => findEquipmentDuplicateMatches(equipmentDraft, allEquipment, form.customerId, form.serviceLocationId),
    [allEquipment, equipmentDraft, form.customerId, form.serviceLocationId]
  )

  const dispatchEditChecks = useMemo(() => buildDispatchEditChecks(form), [form])
  const dispatchReadyCount = dispatchEditChecks.filter((check) => check.isReady).length
  const dispatchOpenItems = dispatchEditChecks.filter((check) => !check.isReady)
  const nextDispatchFix = dispatchOpenItems[0]?.detail ?? 'All dispatch requirements are complete.'
  const equipmentQuickAddDuplicateWarnings = useMemo(() => {
    if (!form.customerId || !form.serviceLocationId) {
      return []
    }

    return findEquipmentQuickAddDuplicates(
      equipmentDraft,
      allEquipment.filter((item) => item.customerId === form.customerId && item.serviceLocationId === form.serviceLocationId)
    )
  }, [allEquipment, equipmentDraft, form.customerId, form.serviceLocationId])

  useEffect(() => {
    if (initial.jobType) {
      setJobTypeOptions((prev) => uniqueLabels([...prev, initial.jobType]))
    }
  }, [initial.jobType])

  useEffect(() => {
    if (form.serviceLocationId && !filteredLocations.some((item) => item.id === form.serviceLocationId)) {
      setForm((prev) => ({ ...prev, serviceLocationId: '', equipmentId: null }))
    }
  }, [filteredLocations, form.serviceLocationId])

  useEffect(() => {
    if (form.equipmentId && !filteredEquipment.some((item) => item.id === form.equipmentId)) {
      setForm((prev) => ({ ...prev, equipmentId: null }))
    }
  }, [filteredEquipment, form.equipmentId])

  useEffect(() => {
    if (!form.equipmentId) {
      setEquipmentHistory([])
      setEquipmentHistoryError(null)
      setIsLoadingEquipmentHistory(false)
      return
    }

    let isCurrent = true
    setIsLoadingEquipmentHistory(true)
    setEquipmentHistoryError(null)

    reportsApi.getEquipmentHistory(form.equipmentId, { offset: 0, limit: 3 })
      .then((items) => {
        if (isCurrent) {
          setEquipmentHistory(items)
        }
      })
      .catch(() => {
        if (isCurrent) {
          setEquipmentHistory([])
          setEquipmentHistoryError('Equipment service history is unavailable right now.')
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingEquipmentHistory(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [form.equipmentId])

  const update = <K extends keyof CreateJobTicketDto>(key: K, value: CreateJobTicketDto[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const selectCustomer = (customerId: string) => {
    setForm((prev) => ({ ...prev, customerId, serviceLocationId: '', equipmentId: null }))
  }

  const addJobType = () => {
    const nextJobType = jobTypeDraft.trim()
    if (!nextJobType) {
      setJobTypeQuickAddError('Job type is required.')
      setJobTypeQuickAddMessage(null)
      return
    }

    setJobTypeOptions((prev) => uniqueLabels([...prev, nextJobType]))
    update('jobType', nextJobType)
    setJobTypeDraft('')
    setJobTypeQuickAddOpen(false)
    setJobTypeQuickAddError(null)
    setJobTypeQuickAddMessage(`${nextJobType} added and selected.`)
  }

  const addCustomer = async () => {
    const payload: CreateCustomerDto = {
      name: customerDraft.name.trim(),
      accountNumber: optionalText(customerDraft.accountNumber),
      contactName: optionalText(customerDraft.contactName),
      email: optionalText(customerDraft.email),
      phone: optionalText(customerDraft.phone)
    }

    if (!payload.name) {
      setCustomerQuickAddError('Customer name is required.')
      setCustomerQuickAddMessage(null)
      return
    }

    try {
      setIsAddingCustomer(true)
      setCustomerQuickAddError(null)
      const created = await masterDataApi.createCustomer(payload)
      setCreatedCustomers((prev) => upsertById(prev, created))
      onCustomerCreated?.(created)
      setForm((prev) => ({
        ...prev,
        customerId: created.id,
        billingPartyCustomerId: created.id,
        serviceLocationId: '',
        equipmentId: null,
        billingContactName: created.contactName ?? prev.billingContactName ?? null,
        billingContactPhone: created.phone ?? prev.billingContactPhone ?? null,
        billingContactEmail: created.email ?? prev.billingContactEmail ?? null
      }))
      setCustomerDraft(emptyCustomerDraft)
      setCustomerQuickAddOpen(false)
      setCustomerQuickAddMessage(`${created.name} added and selected.`)
      setServiceLocationQuickAddMessage(null)
      setEquipmentQuickAddMessage(null)
    } catch (requestError) {
      setCustomerQuickAddError(quickAddErrorMessage(requestError, 'Unable to add customer.'))
      setCustomerQuickAddMessage(null)
    } finally {
      setIsAddingCustomer(false)
    }
  }

  const addServiceLocation = async () => {
    if (!form.customerId) {
      setServiceLocationQuickAddError('Select a customer before quick-adding a service location.')
      setServiceLocationQuickAddMessage(null)
      return
    }

    const payload: CreateServiceLocationDto = {
      customerId: form.customerId,
      companyName: selectedCustomer?.name ?? serviceLocationDraft.locationName.trim(),
      locationName: serviceLocationDraft.locationName.trim(),
      addressLine1: serviceLocationDraft.addressLine1.trim(),
      city: serviceLocationDraft.city.trim(),
      state: serviceLocationDraft.state.trim(),
      postalCode: serviceLocationDraft.postalCode.trim(),
      country: serviceLocationDraft.country.trim(),
      isActive: true
    }

    if (!payload.locationName || !payload.addressLine1 || !payload.city || !payload.state || !payload.postalCode || !payload.country) {
      setServiceLocationQuickAddError('Location name, address, city, state, postal code, and country are required.')
      setServiceLocationQuickAddMessage(null)
      return
    }

    try {
      setIsAddingServiceLocation(true)
      setServiceLocationQuickAddError(null)
      const created = await masterDataApi.createServiceLocation(payload)
      setCreatedServiceLocations((prev) => upsertById(prev, created))
      onServiceLocationCreated?.(created)
      setForm((prev) => ({ ...prev, serviceLocationId: created.id, equipmentId: null }))
      setServiceLocationDraft(emptyServiceLocationDraft)
      setServiceLocationQuickAddOpen(false)
      setServiceLocationQuickAddMessage(`${created.locationName} added and selected.`)
    } catch (requestError) {
      setServiceLocationQuickAddError(quickAddErrorMessage(requestError, 'Unable to add service location.'))
      setServiceLocationQuickAddMessage(null)
    } finally {
      setIsAddingServiceLocation(false)
    }
  }

  const addEquipment = async () => {
    if (!form.customerId || !form.serviceLocationId) {
      setEquipmentQuickAddError('Select a customer and service location before quick-adding equipment.')
      setEquipmentQuickAddMessage(null)
      return
    }

    const year = equipmentDraft.year.trim() ? Number(equipmentDraft.year) : null
    if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
      setEquipmentQuickAddError('Equipment year must be a whole year from 1900 through 2100.')
      setEquipmentQuickAddMessage(null)
      return
    }

    const payload: CreateEquipmentDto = {
      customerId: form.customerId,
      serviceLocationId: form.serviceLocationId,
      ownerCustomerId: form.customerId,
      responsibleBillingCustomerId: form.billingPartyCustomerId || form.customerId,
      name: equipmentDraft.name.trim(),
      equipmentNumber: optionalText(equipmentDraft.equipmentNumber),
      unitNumber: optionalText(equipmentDraft.unitNumber),
      manufacturer: optionalText(equipmentDraft.manufacturer),
      modelNumber: optionalText(equipmentDraft.modelNumber),
      serialNumber: optionalText(equipmentDraft.serialNumber),
      equipmentType: optionalText(equipmentDraft.equipmentType),
      year
    }

    if (!payload.name) {
      setEquipmentQuickAddError('Equipment name is required.')
      setEquipmentQuickAddMessage(null)
      return
    }

    try {
      setIsAddingEquipment(true)
      setEquipmentQuickAddError(null)
      const created = await masterDataApi.createEquipment(payload)
      setCreatedEquipment((prev) => upsertById(prev, created))
      onEquipmentCreated?.(created)
      setForm((prev) => ({ ...prev, equipmentId: created.id }))
      setEquipmentDraft(emptyEquipmentDraft)
      setEquipmentQuickAddOpen(false)
      setEquipmentQuickAddMessage(`${created.name} added and selected.`)
    } catch (requestError) {
      setEquipmentQuickAddError(quickAddErrorMessage(requestError, 'Unable to add equipment.'))
      setEquipmentQuickAddMessage(null)
    } finally {
      setIsAddingEquipment(false)
    }
  }

  const selectExistingEquipment = (existingEquipment: EquipmentDto) => {
    setForm((prev) => ({ ...prev, equipmentId: existingEquipment.id }))
    setEquipmentDraft(emptyEquipmentDraft)
    setEquipmentQuickAddOpen(false)
    setEquipmentQuickAddError(null)
    setEquipmentQuickAddMessage(`${existingEquipment.name} selected from existing equipment.`)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.customerId || !form.serviceLocationId || !form.billingPartyCustomerId || !form.title.trim()) {
      setError('Customer, location, billing party, and title are required.')
      return
    }

    setError(null)
    await onSubmit({ ...form, title: form.title.trim() })
  }

  return (
    <form onSubmit={submit} className="stack job-editor-form">
      {error ? <p className="error">{error}</p> : null}
      <section className="stack" aria-label="dispatch requirements review">
        <h3>Dispatch Requirements</h3>
        <div className="review-grid">
          <div>
            <span className="muted">Dispatch Status</span>
            <strong>{dispatchOpenItems.length ? 'Needs dispatch updates' : 'Ready to dispatch'}</strong>
          </div>
          <div>
            <span className="muted">Requirements Ready</span>
            <strong>{dispatchReadyCount} / {dispatchEditChecks.length}</strong>
          </div>
          <div>
            <span className="muted">Open Requirements</span>
            <strong>{dispatchOpenItems.length}</strong>
          </div>
        </div>
        <p className="muted">Next required update: {nextDispatchFix}</p>
        {dispatchOpenItems.length ? (
          <ul className="muted" aria-label="dispatch requirement warnings">
            {dispatchOpenItems.map((check) => (
              <li key={check.label}>{check.label}: {check.detail}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">Dispatch status, customer, service location, equipment decision, schedule, due date, and job instructions are ready.</p>
        )}
      </section>
      <label>Title<input value={form.title} onChange={(e) => update('title', e.target.value)} /></label>
      <div className="field-with-action">
        <label>Job Type
          <select value={form.jobType ?? ''} onChange={(e) => update('jobType', e.target.value || null)}>
            <option value="">Select job type</option>
            {displayedJobTypeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className="secondary-button" onClick={() => setJobTypeQuickAddOpen((prev) => !prev)}>
          Quick add job type
        </button>
      </div>
      {jobTypeQuickAddMessage ? <p className="success" role="status">{jobTypeQuickAddMessage}</p> : null}
      {jobTypeQuickAddError ? <p className="error">{jobTypeQuickAddError}</p> : null}
      {jobTypeQuickAddOpen ? (
        <section className="quick-add-panel" aria-label="quick add job type">
          <label>New Job Type<input value={jobTypeDraft} onChange={(e) => setJobTypeDraft(e.target.value)} /></label>
          <div className="row">
            <button type="button" onClick={addJobType}>Add Job Type</button>
            <button type="button" className="secondary-button" onClick={() => setJobTypeQuickAddOpen(false)}>Cancel</button>
          </div>
        </section>
      ) : null}
      <div className="field-with-action">
        <label>Customer
          <select value={form.customerId} onChange={(e) => selectCustomer(e.target.value)}>
            <option value="">Select customer</option>
            {allCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button type="button" className="secondary-button" onClick={() => setCustomerQuickAddOpen((prev) => !prev)}>
          Quick add customer
        </button>
      </div>
      {customerQuickAddMessage ? <p className="success" role="status">{customerQuickAddMessage}</p> : null}
      {customerQuickAddError ? <p className="error">{customerQuickAddError}</p> : null}
      {customerQuickAddOpen ? (
        <section className="quick-add-panel" aria-label="quick add customer">
          <div className="quick-add-grid">
            <label>Customer Name<input value={customerDraft.name} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, name: e.target.value }))} /></label>
            <label>Account Number<input value={customerDraft.accountNumber} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, accountNumber: e.target.value }))} /></label>
            <label>Contact Name<input value={customerDraft.contactName} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, contactName: e.target.value }))} /></label>
            <label>Contact Phone<input value={customerDraft.phone} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, phone: e.target.value }))} /></label>
            <label>Contact Email<input type="email" value={customerDraft.email} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, email: e.target.value }))} /></label>
          </div>
          <div className="row">
            <button type="button" onClick={addCustomer} disabled={isAddingCustomer}>
              {isAddingCustomer ? 'Adding Customer...' : 'Add Customer'}
            </button>
            <button type="button" className="secondary-button" onClick={() => setCustomerQuickAddOpen(false)}>Cancel</button>
          </div>
          <p className="muted">New customers are selected for the ticket and billing party. Add a service location next before saving.</p>
        </section>
      ) : null}
      <div className="field-with-action">
        <label>Service Location
          <select value={form.serviceLocationId} onChange={(e) => update('serviceLocationId', e.target.value)}>
            <option value="">Select location</option>
            {filteredLocations.map((c) => <option key={c.id} value={c.id}>{c.locationName}</option>)}
          </select>
        </label>
        <button type="button" className="secondary-button" onClick={() => setServiceLocationQuickAddOpen((prev) => !prev)}>
          Quick add location
        </button>
      </div>
      {serviceLocationQuickAddMessage ? <p className="success" role="status">{serviceLocationQuickAddMessage}</p> : null}
      {serviceLocationQuickAddError ? <p className="error">{serviceLocationQuickAddError}</p> : null}
      {serviceLocationQuickAddOpen ? (
        <section className="quick-add-panel" aria-label="quick add service location">
          <div className="quick-add-grid">
            <label>Location Name<input value={serviceLocationDraft.locationName} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, locationName: e.target.value }))} /></label>
            <label>Street Address<input value={serviceLocationDraft.addressLine1} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, addressLine1: e.target.value }))} /></label>
            <label>City<input value={serviceLocationDraft.city} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, city: e.target.value }))} /></label>
            <label>State<input value={serviceLocationDraft.state} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, state: e.target.value }))} /></label>
            <label>Postal Code<input value={serviceLocationDraft.postalCode} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, postalCode: e.target.value }))} /></label>
            <label>Country<input value={serviceLocationDraft.country} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, country: e.target.value }))} /></label>
          </div>
          <div className="row">
            <button type="button" onClick={addServiceLocation} disabled={isAddingServiceLocation}>
              {isAddingServiceLocation ? 'Adding Location...' : 'Add Location'}
            </button>
            <button type="button" className="secondary-button" onClick={() => setServiceLocationQuickAddOpen(false)}>Cancel</button>
          </div>
        </section>
      ) : null}
      <label>Billing Party<select value={form.billingPartyCustomerId} onChange={(e) => update('billingPartyCustomerId', e.target.value)}><option value="">Select billing party</option>{allCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <div className="field-with-action">
        <label>Equipment
          <select value={form.equipmentId ?? ''} onChange={(e) => update('equipmentId', e.target.value || null)}>
            <option value="">None</option>
            {filteredEquipment.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button type="button" className="secondary-button" onClick={() => setEquipmentQuickAddOpen((prev) => !prev)}>
          Quick add equipment
        </button>
      </div>
      {equipmentQuickAddMessage ? <p className="success" role="status">{equipmentQuickAddMessage}</p> : null}
      {equipmentQuickAddError ? <p className="error">{equipmentQuickAddError}</p> : null}
      {equipmentQuickAddOpen ? (
        <section className="quick-add-panel" aria-label="quick add equipment">
          <div className="quick-add-grid">
            <label>Equipment Name<input value={equipmentDraft.name} onChange={(e) => setEquipmentDraft((prev) => ({ ...prev, name: e.target.value }))} /></label>
            <label>Equipment Number<input value={equipmentDraft.equipmentNumber} onChange={(e) => setEquipmentDraft((prev) => ({ ...prev, equipmentNumber: e.target.value }))} /></label>
            <label>Unit Number<input value={equipmentDraft.unitNumber} onChange={(e) => setEquipmentDraft((prev) => ({ ...prev, unitNumber: e.target.value }))} /></label>
            <label>Manufacturer<input value={equipmentDraft.manufacturer} onChange={(e) => setEquipmentDraft((prev) => ({ ...prev, manufacturer: e.target.value }))} /></label>
            <label>Model Number<input value={equipmentDraft.modelNumber} onChange={(e) => setEquipmentDraft((prev) => ({ ...prev, modelNumber: e.target.value }))} /></label>
            <label>Serial Number<input value={equipmentDraft.serialNumber} onChange={(e) => setEquipmentDraft((prev) => ({ ...prev, serialNumber: e.target.value }))} /></label>
            <label>Equipment Type<input value={equipmentDraft.equipmentType} onChange={(e) => setEquipmentDraft((prev) => ({ ...prev, equipmentType: e.target.value }))} /></label>
            <label>Year<input type="number" min="1900" max="2100" value={equipmentDraft.year} onChange={(e) => setEquipmentDraft((prev) => ({ ...prev, year: e.target.value }))} /></label>
          </div>
          {equipmentQuickAddDuplicateWarnings.length ? (
            <div className="warning" role="status" aria-label="possible duplicate equipment warning">
              <strong>Possible duplicate equipment</strong>
              <ul>
                {equipmentQuickAddDuplicateWarnings.map((warning) => (
                  <li key={warning.equipment.id}>
                    {warning.equipment.name}{warning.equipment.isArchived ? ' (archived)' : ''}: matches {warning.matchedFields.join(', ')}.
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="row">
            <button type="button" onClick={addEquipment} disabled={isAddingEquipment}>
              {isAddingEquipment ? 'Adding Equipment...' : 'Add Equipment'}
            </button>
            <button type="button" className="secondary-button" onClick={() => setEquipmentQuickAddOpen(false)}>Cancel</button>
          </div>
          <p className="muted">Customer / service location: {selectedCustomer?.name ?? 'No customer'} / {selectedServiceLocation?.locationName ?? 'No service location'}</p>
        </section>
      ) : null}
      <section className="quick-add-panel" aria-label="equipment service history">
        <h3>Recent Equipment Service History</h3>
        {!form.equipmentId ? (
          <p className="muted">Select equipment to review recent service history before saving this ticket.</p>
        ) : isLoadingEquipmentHistory ? (
          <p className="muted" role="status">Loading recent equipment service history...</p>
        ) : equipmentHistoryError ? (
          <p className="error">{equipmentHistoryError}</p>
        ) : equipmentHistory.length ? (
          <ul className="history-context-list">
            {equipmentHistory.map((item) => (
              <li key={item.jobTicketId}>
                <strong>{item.jobTicketNumber}: {item.title}</strong>
                <span>{jobStatusLabel(item.jobStatus)} - {item.completedAtUtc ? `Completed ${new Date(item.completedAtUtc).toLocaleDateString()}` : `Created ${new Date(item.createdAtUtc).toLocaleDateString()}`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No recent service history is visible for the selected equipment.</p>
        )}
        <p className="muted">Use this history for Manager/Admin reference only; it does not recommend parts or guarantee compatibility.</p>
      </section>
      <label>Priority<select value={form.priority} onChange={(e) => update('priority', Number(e.target.value))}>{priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label>Status<select value={form.status} onChange={(e) => update('status', Number(e.target.value))}>{jobStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label>Description<textarea value={form.description ?? ''} onChange={(e) => update('description', e.target.value || null)} /></label>
      <label>Purchase Order Number<input value={form.purchaseOrderNumber ?? ''} onChange={(e) => update('purchaseOrderNumber', e.target.value || null)} placeholder="Customer or internal PO reference" /></label>
      <label>Billing Contact Name<input value={form.billingContactName ?? ''} onChange={(e) => update('billingContactName', e.target.value || null)} /></label>
      <label>Billing Contact Phone<input value={form.billingContactPhone ?? ''} onChange={(e) => update('billingContactPhone', e.target.value || null)} /></label>
      <label>Billing Contact Email<input type="email" value={form.billingContactEmail ?? ''} onChange={(e) => update('billingContactEmail', e.target.value || null)} /></label>
      <label>Internal Notes<textarea value={form.internalNotes ?? ''} onChange={(e) => update('internalNotes', e.target.value || null)} /></label>
      <label>Customer Notes<textarea value={form.customerFacingNotes ?? ''} onChange={(e) => update('customerFacingNotes', e.target.value || null)} /></label>
      <label>Requested (UTC)<input type="datetime-local" value={(form.requestedAtUtc ?? '').slice(0, 16)} onChange={(e) => update('requestedAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <label>Scheduled Start (UTC)<input type="datetime-local" value={(form.scheduledStartAtUtc ?? '').slice(0, 16)} onChange={(e) => update('scheduledStartAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <label>Due (UTC)<input type="datetime-local" value={(form.dueAtUtc ?? '').slice(0, 16)} onChange={(e) => update('dueAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <button type="submit">{submitLabel}</button>
    </form>
  )
}
