import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
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
import { priorityOptions, jobStatusOptions, workLocationTypeOptions } from './managerDisplay'

/** Convert a UTC ISO string to the value expected by a datetime-local input (local time). */
function toDatetimeLocalValue(utcIso: string | null | undefined): string {
  if (!utcIso) return ''
  const d = new Date(utcIso)
  const offsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

/** Scroll the first visible .error element into view when error becomes non-null. */
function useScrollToError(error: string | null) {
  useEffect(() => {
    if (error) {
      document.querySelector<HTMLElement>('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])
}

type Props = {
  initial: CreateJobTicketDto
  customers: CustomerDto[]
  serviceLocations: ServiceLocationDto[]
  equipment: EquipmentDto[]
  onSubmit: (payload: CreateJobTicketDto) => Promise<void>
  onCustomerCreated?: (customer: CustomerDto) => void
  onServiceLocationCreated?: (serviceLocation: ServiceLocationDto) => void
  onEquipmentCreated?: (equipment: EquipmentDto) => void
  scheduleAssignmentPanel?: ReactNode
  submitLabel: string
  isCreate?: boolean
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
  billingAddressLine1: string
  billingAddressLine2: string
  billingCity: string
  billingState: string
  billingPostalCode: string
}

type ServiceLocationQuickAddDraft = {
  locationName: string
  onSiteContactName: string
  onSiteContactPhone: string
  onSiteContactEmail: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  parishCounty: string
  country: string
  gateCode: string
  accessInstructions: string
  safetyRequirements: string
  siteNotes: string
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

type TicketEditorSection = 'identity' | 'relationships' | 'scope' | 'billing' | 'schedule'

type TicketCreateWizardStep = {
  value: string
  label: string
  section: TicketEditorSection
  isReady: boolean
  detail: string
}

const ticketEditorSections: Array<{
  value: TicketEditorSection
  label: string
  description: string
}> = [
  { value: 'identity', label: 'Basics', description: 'Title, type, priority, and status.' },
  { value: 'relationships', label: 'Customer & Service Equipment', description: 'Customer, location, billing party, and the crane/equipment being serviced.' },
  { value: 'scope', label: 'Scope & Notes', description: 'Job description, internal notes, and customer notes.' },
  { value: 'billing', label: 'Billing', description: 'Purchase order and billing contact details.' },
  { value: 'schedule', label: 'Schedule', description: 'Requested, scheduled, and due dates, with optional technician assignment.' }
]

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
  phone: '',
  billingAddressLine1: '',
  billingAddressLine2: '',
  billingCity: '',
  billingState: '',
  billingPostalCode: ''
}

const emptyServiceLocationDraft: ServiceLocationQuickAddDraft = {
  locationName: '',
  onSiteContactName: '',
  onSiteContactPhone: '',
  onSiteContactEmail: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  parishCounty: '',
  country: 'USA',
  gateCode: '',
  accessInstructions: '',
  safetyRequirements: '',
  siteNotes: ''
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

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function sourceOrCurrent(source: string | null | undefined, current: string | null | undefined) {
  return hasValue(source) ? source! : current ?? null
}

function hasCustomerBillingAddress(customer: CustomerDto | null | undefined) {
  return Boolean(customer && (
    hasValue(customer.billingAddressLine1) ||
    hasValue(customer.billingAddressLine2) ||
    hasValue(customer.billingCity) ||
    hasValue(customer.billingState) ||
    hasValue(customer.billingPostalCode)
  ))
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
  const hasServiceEquipment = Boolean(form.equipmentId)
  const isActiveDispatchStatus = activeDispatchStatuses.has(form.status)

  return [
    {
      label: 'Work status',
      isReady: isActiveDispatchStatus,
      detail: isActiveDispatchStatus
        ? 'Ticket is in the active work queue.'
        : 'Move the ticket into an active work status before assignment review.'
    },
    {
      label: 'Customer',
      isReady: Boolean(form.customerId),
      detail: form.customerId ? 'Customer is selected.' : 'Select the customer before assignment review.'
    },
    {
      label: 'Service location',
      isReady: Boolean(form.serviceLocationId),
      detail: form.serviceLocationId ? 'Service location is selected.' : 'Select the service location before assignment review.'
    },
    {
      label: 'Service equipment',
      isReady: true,
      detail: hasServiceEquipment ? 'Crane/equipment being serviced is selected.' : 'No service equipment is selected; use the job scope for component-only work.'
    },
    {
      label: 'Scheduled start',
      isReady: Boolean(form.scheduledStartAtUtc),
      detail: form.scheduledStartAtUtc ? 'Scheduled start is set.' : 'Set a scheduled start before work starts.'
    },
    {
      label: 'Due date',
      isReady: Boolean(form.dueAtUtc),
      detail: form.dueAtUtc ? 'Due date is set.' : 'Add a due date for timing expectations.'
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
  scheduleAssignmentPanel,
  submitLabel,
  isCreate = false
}: Props) {
  const [form, setForm] = useState<CreateJobTicketDto>(initial)
  const [error, setError] = useState<string | null>(null)
  useScrollToError(error)
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
  const [copyHelperMessage, setCopyHelperMessage] = useState<string | null>(null)
  const [copyHelperError, setCopyHelperError] = useState<string | null>(null)
  const [activeEditorSection, setActiveEditorSection] = useState<TicketEditorSection>('identity')
  const [jobTypeOptions, setJobTypeOptions] = useState(() => uniqueLabels([...defaultJobTypeOptions, initial.jobType]))
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [isAddingServiceLocation, setIsAddingServiceLocation] = useState(false)
  const [isAddingEquipment, setIsAddingEquipment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const selectedBillingParty = allCustomers.find((item) => item.id === form.billingPartyCustomerId)
  const selectedEquipment = allEquipment.find((item) => item.id === form.equipmentId)
  const resolveDefaultBillingPartyId = (customer?: CustomerDto | null) => {
    if (!customer) return null

    if (!customer.billingPartyCustomerId) {
      return customer.id
    }

    const billingParty = allCustomers.find((item) => item.id === customer.billingPartyCustomerId)
    return billingParty && !billingParty.isArchived ? billingParty.id : customer.id
  }
  const jobSiteCustomer = selectedServiceLocation?.customerId
    ? allCustomers.find((item) => item.id === selectedServiceLocation.customerId)
    : undefined
  const equipmentBillingCustomer = selectedEquipment?.responsibleBillingCustomerId
    ? allCustomers.find((item) => item.id === selectedEquipment.responsibleBillingCustomerId)
    : undefined
  const billingPartyRelationship = !selectedBillingParty
    ? 'No billing party selected.'
    : selectedBillingParty.id === selectedCustomer?.id
      ? 'Billing party is the selected customer.'
      : selectedBillingParty.id === jobSiteCustomer?.id
        ? 'Billing party is the job-site customer.'
        : selectedBillingParty.id === equipmentBillingCustomer?.id
          ? 'Billing party is the equipment billing customer.'
          : 'Billing party is separate from the customer and job site.'

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
  const nextDispatchFix = dispatchOpenItems[0]?.detail ?? 'All assignment and schedule requirements are complete.'
  const dataQualityWarnings = useMemo(() => {
    const warnings: string[] = []

    if (selectedCustomer && !hasValue(selectedCustomer.phone)) {
      warnings.push('This customer has no phone.')
    }

    if (selectedServiceLocation && !hasValue(selectedServiceLocation.postalCode)) {
      warnings.push('This job location has no ZIP.')
    }

    if (!hasValue(form.dueAtUtc)) {
      warnings.push('No due date set.')
    }

    return warnings
  }, [form.dueAtUtc, selectedCustomer, selectedServiceLocation])
  const ticketCreateWizardSteps = useMemo<TicketCreateWizardStep[]>(() => [
    {
      value: 'basics',
      label: 'Basics',
      section: 'identity',
      isReady: Boolean(form.title.trim()),
      detail: form.title.trim() ? form.title.trim() : 'Add title, type, and priority'
    },
    {
      value: 'customer',
      label: 'Customer & Equipment',
      section: 'relationships',
      isReady: Boolean(form.customerId && form.serviceLocationId && form.billingPartyCustomerId),
      detail: selectedCustomer?.name ?? 'Select customer, location, and billing party'
    },
    {
      value: 'scope',
      label: 'Scope & Notes',
      section: 'scope',
      isReady: true,
      detail: form.description?.trim() ? 'Description added' : 'Optional — add job description'
    },
    {
      value: 'billing',
      label: 'Billing',
      section: 'billing',
      isReady: true,
      detail: form.purchaseOrderNumber?.trim() ? `PO: ${form.purchaseOrderNumber.trim()}` : 'Optional — PO and billing contact'
    },
    {
      value: 'review',
      label: 'Review & Submit',
      section: 'scope',
      isReady: Boolean(form.title.trim() && form.customerId && form.serviceLocationId && form.billingPartyCustomerId),
      detail: dataQualityWarnings.length ? `${dataQualityWarnings.length} cleanup item${dataQualityWarnings.length === 1 ? '' : 's'}` : 'Ready to submit'
    }
  ], [dataQualityWarnings.length, form.billingPartyCustomerId, form.customerId, form.description, form.purchaseOrderNumber, form.requestedAtUtc, form.serviceLocationId, form.title, selectedCustomer])
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
    const customer = allCustomers.find((item) => item.id === customerId)
    setForm((prev) => ({
      ...prev,
      customerId,
      billingPartyCustomerId: !prev.billingPartyCustomerId || prev.billingPartyCustomerId === prev.customerId
        ? resolveDefaultBillingPartyId(customer) ?? customerId
        : prev.billingPartyCustomerId,
      serviceLocationId: '',
      equipmentId: null
    }))
  }

  const selectServiceLocation = (serviceLocationId: string) => {
    setForm((prev) => {
      const serviceLocationCustomerId = allServiceLocations.find((item) => item.id === serviceLocationId)?.customerId ?? null
      const serviceLocationCustomer = serviceLocationCustomerId ? allCustomers.find((item) => item.id === serviceLocationCustomerId) : null

      return {
        ...prev,
        serviceLocationId,
        equipmentId: null,
        billingPartyCustomerId: prev.billingPartyCustomerId || resolveDefaultBillingPartyId(serviceLocationCustomer) || prev.customerId
      }
    })
  }

  const selectEquipment = (equipmentId: string) => {
    setForm((prev) => ({ ...prev, equipmentId: equipmentId || null }))
  }

  const selectBillingParty = (billingPartyCustomerId: string, message?: string) => {
    setForm((prev) => ({ ...prev, billingPartyCustomerId }))
    if (message) {
      setCopyHelperError(null)
      setCopyHelperMessage(message)
    }
  }

  const useCustomerAsBillingParty = () => {
    if (!selectedCustomer) {
      setCopyHelperError('Select a customer before using customer as billing party.')
      setCopyHelperMessage(null)
      return
    }

    selectBillingParty(selectedCustomer.id, 'Customer selected as the billing party.')
  }

  const useJobSiteCustomerAsBillingParty = () => {
    if (!jobSiteCustomer) {
      setCopyHelperError('Select a job location with a related customer before using job-site customer as billing party.')
      setCopyHelperMessage(null)
      return
    }

    selectBillingParty(jobSiteCustomer.id, 'Job-site customer selected as the billing party.')
  }

  const useEquipmentBillingCustomer = () => {
    if (!equipmentBillingCustomer) {
      setCopyHelperError('Selected equipment has no separate billing customer.')
      setCopyHelperMessage(null)
      return
    }

    selectBillingParty(equipmentBillingCustomer.id, 'Equipment billing customer selected as the billing party.')
  }

  const copySelectedCustomerToServiceLocation = () => {
    if (!selectedCustomer) {
      setServiceLocationQuickAddError('Select a customer before using customer address.')
      setServiceLocationQuickAddMessage(null)
      return
    }

    if (!hasCustomerBillingAddress(selectedCustomer)) {
      setServiceLocationQuickAddError('Selected customer has no billing address to copy.')
      setServiceLocationQuickAddMessage(null)
      return
    }

    setServiceLocationDraft((prev) => ({
      ...prev,
      locationName: prev.locationName || selectedCustomer.name,
      onSiteContactName: sourceOrCurrent(selectedCustomer.contactName, prev.onSiteContactName) ?? '',
      onSiteContactPhone: sourceOrCurrent(selectedCustomer.phone, prev.onSiteContactPhone) ?? '',
      onSiteContactEmail: sourceOrCurrent(selectedCustomer.email, prev.onSiteContactEmail) ?? '',
      addressLine1: sourceOrCurrent(selectedCustomer.billingAddressLine1, prev.addressLine1) ?? '',
      addressLine2: sourceOrCurrent(selectedCustomer.billingAddressLine2, prev.addressLine2) ?? '',
      city: sourceOrCurrent(selectedCustomer.billingCity, prev.city) ?? '',
      state: sourceOrCurrent(selectedCustomer.billingState, prev.state) ?? '',
      postalCode: sourceOrCurrent(selectedCustomer.billingPostalCode, prev.postalCode) ?? ''
    }))
    setServiceLocationQuickAddError(null)
    setServiceLocationQuickAddMessage('Customer address copied into the job location.')
    setCopyHelperError(null)
    setCopyHelperMessage(null)
  }

  const copyBillingAddressToBillingContact = () => {
    const source = selectedBillingParty ?? selectedCustomer

    if (!source) {
      setCopyHelperError('Select a billing party before using billing address.')
      setCopyHelperMessage(null)
      return
    }

    setForm((prev) => ({
      ...prev,
      billingPartyCustomerId: source.id,
      billingContactName: sourceOrCurrent(source.contactName, prev.billingContactName),
      billingContactPhone: sourceOrCurrent(source.phone, prev.billingContactPhone),
      billingContactEmail: sourceOrCurrent(source.email, prev.billingContactEmail)
    }))
    setCopyHelperError(null)
    setCopyHelperMessage('Billing party contact copied into billing fields.')
  }

  const copyJobSiteContactToBillingContact = () => {
    if (!selectedServiceLocation) {
      setCopyHelperError('Select a job location before using job-site contact.')
      setCopyHelperMessage(null)
      return
    }

    if (!hasValue(selectedServiceLocation.onSiteContactName) && !hasValue(selectedServiceLocation.onSiteContactPhone) && !hasValue(selectedServiceLocation.onSiteContactEmail)) {
      setCopyHelperError('Selected job location has no job-site contact to copy.')
      setCopyHelperMessage(null)
      return
    }

    setForm((prev) => ({
      ...prev,
      billingContactName: sourceOrCurrent(selectedServiceLocation.onSiteContactName, prev.billingContactName),
      billingContactPhone: sourceOrCurrent(selectedServiceLocation.onSiteContactPhone, prev.billingContactPhone),
      billingContactEmail: sourceOrCurrent(selectedServiceLocation.onSiteContactEmail, prev.billingContactEmail)
    }))
    setCopyHelperError(null)
    setCopyHelperMessage('Job-site contact copied into billing fields.')
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
      phone: optionalText(customerDraft.phone),
      billingAddressLine1: optionalText(customerDraft.billingAddressLine1),
      billingAddressLine2: optionalText(customerDraft.billingAddressLine2),
      billingCity: optionalText(customerDraft.billingCity),
      billingState: optionalText(customerDraft.billingState),
      billingPostalCode: optionalText(customerDraft.billingPostalCode)
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
        billingPartyCustomerId: resolveDefaultBillingPartyId(created) || created.id,
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
      onSiteContactName: optionalText(serviceLocationDraft.onSiteContactName),
      onSiteContactPhone: optionalText(serviceLocationDraft.onSiteContactPhone),
      onSiteContactEmail: optionalText(serviceLocationDraft.onSiteContactEmail),
      addressLine1: serviceLocationDraft.addressLine1.trim(),
      addressLine2: optionalText(serviceLocationDraft.addressLine2),
      city: serviceLocationDraft.city.trim(),
      state: serviceLocationDraft.state.trim(),
      postalCode: serviceLocationDraft.postalCode.trim(),
      parishCounty: optionalText(serviceLocationDraft.parishCounty),
      country: serviceLocationDraft.country.trim(),
      gateCode: optionalText(serviceLocationDraft.gateCode),
      accessInstructions: optionalText(serviceLocationDraft.accessInstructions),
      safetyRequirements: optionalText(serviceLocationDraft.safetyRequirements),
      siteNotes: optionalText(serviceLocationDraft.siteNotes),
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
    setIsSubmitting(true)
    try {
      await onSubmit({ ...form, title: form.title.trim() })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="stack job-editor-form section-ticket-editor">
      {error ? <p className="error">{error}</p> : null}
      {copyHelperMessage ? <p className="success action-feedback-panel" role="status">{copyHelperMessage}</p> : null}
      {copyHelperError ? <p className="error">{copyHelperError}</p> : null}
      <section className="ticket-create-guide" aria-label="ticket create wizard">
        <div className="ticket-create-guide-heading">
          <h3>Ticket Create Wizard</h3>
          <span className="muted">{ticketCreateWizardSteps.filter((step) => step.isReady).length} / {ticketCreateWizardSteps.length} ready</span>
        </div>
        <div className="ticket-create-step-list">
          {ticketCreateWizardSteps.map((step, index) => (
            <button
              type="button"
              key={step.value}
              className={activeEditorSection === step.section ? 'ticket-create-step ticket-create-step-active' : 'ticket-create-step'}
              aria-pressed={activeEditorSection === step.section}
              onClick={() => setActiveEditorSection(step.section)}
            >
              <span>{index + 1}. {step.label}</span>
              <small>{step.detail}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="stack section-edit-readiness" aria-label="dispatch readiness requirements review">
        <h3>Dispatch Readiness Requirements</h3>
        <div className="review-grid">
          <div>
            <span className="muted">Work Readiness</span>
            <strong>{dispatchOpenItems.length ? 'Needs schedule updates' : 'Ready to work'}</strong>
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
          <ul className="muted" aria-label="dispatch readiness requirement warnings">
            {dispatchOpenItems.map((check) => (
              <li key={check.label}>{check.label}: {check.detail}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">Work status, customer, service location, service equipment choice, schedule, due date, and job instructions are ready.</p>
        )}
        {dataQualityWarnings.length ? (
          <ul className="data-quality-warning-list" aria-label="ticket data quality warnings">
            {dataQualityWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {activeEditorSection === 'identity' ? (
        <section className="section-editor-panel stack" aria-label="Basics edit section">
          <div className="section-editor-heading">
            <h3>Basics</h3>
            <p className="muted">{isCreate ? 'Give the ticket a title, type, and priority. Scheduling happens separately after creation.' : 'Edit the ticket\'s title, type, priority, and current status.'}</p>
          </div>
          <label>Title
            <input value={form.title} maxLength={200} onChange={(e) => update('title', e.target.value)} />
            <span className={`field-char-count${form.title.length > 180 ? ' field-char-count--warn' : ''}`}>{form.title.length} / 200</span>
          </label>
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
          <div className="section-editor-grid">
            <label>Priority<select value={form.priority} onChange={(e) => update('priority', Number(e.target.value))}>{priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label>Status
              <select value={form.status} onChange={(e) => update('status', Number(e.target.value))}>
                {(isCreate ? jobStatusOptions.filter((item) => item.value <= 2) : jobStatusOptions).map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              {isCreate ? <small className="field-char-count">New tickets start as Draft or Submitted.</small> : null}
            </label>
            <label>Work Location<select value={form.locationType || 1} onChange={(e) => update('locationType', Number(e.target.value))}>{workLocationTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          </div>
          {isCreate ? (
            <label>Date / Time Reported
              <input type="datetime-local" value={toDatetimeLocalValue(form.requestedAtUtc)} onChange={(e) => update('requestedAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} />
              <small className="field-char-count">When the customer reported the issue. Defaults to now.</small>
            </label>
          ) : null}
        </section>
      ) : null}

      {activeEditorSection === 'relationships' ? (
        <section className="section-editor-panel stack" aria-label="Customer and equipment edit section">
          <div className="section-editor-heading">
            <h3>Customer & Service Equipment</h3>
            <p className="muted">Choose the customer, work location, billing party, and crane/equipment being serviced.</p>
          </div>
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
                <label>Billing Address<input value={customerDraft.billingAddressLine1} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, billingAddressLine1: e.target.value }))} /></label>
                <label>Address Line 2<input value={customerDraft.billingAddressLine2} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, billingAddressLine2: e.target.value }))} /></label>
                <label>Billing City<input value={customerDraft.billingCity} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, billingCity: e.target.value }))} /></label>
                <label>Billing State<input value={customerDraft.billingState} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, billingState: e.target.value }))} /></label>
                <label>Billing ZIP / Postal<input value={customerDraft.billingPostalCode} onChange={(e) => setCustomerDraft((prev) => ({ ...prev, billingPostalCode: e.target.value }))} /></label>
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
              <select value={form.serviceLocationId} onChange={(e) => selectServiceLocation(e.target.value)}>
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
              <div className="copy-helper-row">
                <button type="button" className="secondary-button" onClick={copySelectedCustomerToServiceLocation} disabled={!selectedCustomer}>
                  Use customer address
                </button>
              </div>
              <div className="quick-add-grid">
                <label>Location Name<input value={serviceLocationDraft.locationName} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, locationName: e.target.value }))} /></label>
                <label>On-site Contact<input value={serviceLocationDraft.onSiteContactName} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, onSiteContactName: e.target.value }))} /></label>
                <label>On-site Phone<input value={serviceLocationDraft.onSiteContactPhone} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, onSiteContactPhone: e.target.value }))} /></label>
                <label>On-site Email<input type="email" value={serviceLocationDraft.onSiteContactEmail} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, onSiteContactEmail: e.target.value }))} /></label>
                <label>Street Address<input value={serviceLocationDraft.addressLine1} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, addressLine1: e.target.value }))} /></label>
                <label>Street Address 2<input value={serviceLocationDraft.addressLine2} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, addressLine2: e.target.value }))} /></label>
                <label>City<input value={serviceLocationDraft.city} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, city: e.target.value }))} /></label>
                <label>State<input value={serviceLocationDraft.state} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, state: e.target.value }))} /></label>
                <label>Postal Code<input value={serviceLocationDraft.postalCode} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, postalCode: e.target.value }))} /></label>
                <label>Parish / County<input value={serviceLocationDraft.parishCounty} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, parishCounty: e.target.value }))} /></label>
                <label>Country<input value={serviceLocationDraft.country} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, country: e.target.value }))} /></label>
                <label>Gate Code<input value={serviceLocationDraft.gateCode} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, gateCode: e.target.value }))} /></label>
                <label>
                  Access Instructions
                  <textarea rows={2} maxLength={2000} value={serviceLocationDraft.accessInstructions} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, accessInstructions: e.target.value }))} />
                  <span className={`field-char-count${serviceLocationDraft.accessInstructions.length > 1800 ? ' field-char-count--warn' : ''}`}>{serviceLocationDraft.accessInstructions.length} / 2,000</span>
                </label>
                <label>
                  Safety Requirements
                  <textarea rows={2} maxLength={2000} value={serviceLocationDraft.safetyRequirements} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, safetyRequirements: e.target.value }))} />
                  <span className={`field-char-count${serviceLocationDraft.safetyRequirements.length > 1800 ? ' field-char-count--warn' : ''}`}>{serviceLocationDraft.safetyRequirements.length} / 2,000</span>
                </label>
                <label>
                  Site Notes
                  <textarea rows={3} maxLength={4000} value={serviceLocationDraft.siteNotes} onChange={(e) => setServiceLocationDraft((prev) => ({ ...prev, siteNotes: e.target.value }))} />
                  <span className={`field-char-count${serviceLocationDraft.siteNotes.length > 3600 ? ' field-char-count--warn' : ''}`}>{serviceLocationDraft.siteNotes.length} / 4,000</span>
                </label>
              </div>
              <div className="row">
                <button type="button" onClick={addServiceLocation} disabled={isAddingServiceLocation}>
                  {isAddingServiceLocation ? 'Adding Location...' : 'Add Location'}
                </button>
                <button type="button" className="secondary-button" onClick={() => setServiceLocationQuickAddOpen(false)}>Cancel</button>
              </div>
            </section>
          ) : null}
          <section className="billing-party-panel stack" aria-label="billing party selection">
            <div className="section-editor-heading">
              <h4>Billing Party</h4>
              <p className="muted">Choose who should receive the invoice. This can be the customer, the job-site customer, the equipment billing customer, or another customer record.</p>
            </div>
            <div className="copy-helper-row">
              <button type="button" className="secondary-button" onClick={useCustomerAsBillingParty} disabled={!selectedCustomer}>
                Use selected customer
              </button>
              <button type="button" className="secondary-button" onClick={useJobSiteCustomerAsBillingParty} disabled={!jobSiteCustomer}>
                Use job-site customer
              </button>
              <button type="button" className="secondary-button" onClick={useEquipmentBillingCustomer} disabled={!equipmentBillingCustomer}>
                Use equipment billing customer
              </button>
            </div>
            <label>Billing Party
              <select value={form.billingPartyCustomerId} onChange={(e) => selectBillingParty(e.target.value)}>
                <option value="">Select billing party</option>
                {allCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className="billing-party-summary" aria-label="billing party relationship">
              <span>{billingPartyRelationship}</span>
              {selectedBillingParty ? <strong>{selectedBillingParty.name}</strong> : null}
            </div>
          </section>
          <div className="field-with-action">
            <label>Crane / Equipment Being Serviced
              <select value={form.equipmentId ?? ''} onChange={(e) => selectEquipment(e.target.value)}>
                <option value="">No equipment record</option>
                {filteredEquipment.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <button type="button" className="secondary-button" onClick={() => setEquipmentQuickAddOpen((prev) => !prev)}>
              Quick add equipment
            </button>
          </div>
          <p className="muted">Choose the customer's crane or equipment this ticket is for. For component-only work, describe the part in Job Title and Service Instructions.</p>
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
              <p className="muted">Select the crane/equipment being serviced to review its recent service history before saving this ticket.</p>
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
        </section>
      ) : null}

      {activeEditorSection === 'scope' ? (
        <section className="section-editor-panel stack" aria-label="Scope and notes edit section">
          <div className="section-editor-heading">
            <h3>Scope & Notes</h3>
            <p className="muted">Edit the job description and notes visible to office or customer workflows.</p>
          </div>
          <label>Description<textarea value={form.description ?? ''} maxLength={4000} rows={4} onChange={(e) => update('description', e.target.value || null)} />
            <span className={`field-char-count${(form.description?.length ?? 0) > 3600 ? ' field-char-count--warn' : ''}`}>{form.description?.length ?? 0} / 4,000</span>
          </label>
          <label>Internal Notes<textarea value={form.internalNotes ?? ''} maxLength={4000} rows={4} onChange={(e) => update('internalNotes', e.target.value || null)} />
            <span className={`field-char-count${(form.internalNotes?.length ?? 0) > 3600 ? ' field-char-count--warn' : ''}`}>{form.internalNotes?.length ?? 0} / 4,000</span>
          </label>
          <label>Customer Notes<textarea value={form.customerFacingNotes ?? ''} maxLength={4000} rows={4} onChange={(e) => update('customerFacingNotes', e.target.value || null)} />
            <span className={`field-char-count${(form.customerFacingNotes?.length ?? 0) > 3600 ? ' field-char-count--warn' : ''}`}>{form.customerFacingNotes?.length ?? 0} / 4,000</span>
          </label>
        </section>
      ) : null}

      {activeEditorSection === 'billing' ? (
        <section className="section-editor-panel stack" aria-label="Billing edit section">
          <div className="section-editor-heading">
            <h3>Billing</h3>
            <p className="muted">Edit purchase order and billing contact details used for closeout review.</p>
          </div>
          <label>Purchase Order Number<input value={form.purchaseOrderNumber ?? ''} onChange={(e) => update('purchaseOrderNumber', e.target.value || null)} placeholder="Customer or internal PO reference" /></label>
          <div className="copy-helper-row">
            <button type="button" className="secondary-button" onClick={copyBillingAddressToBillingContact} disabled={!selectedBillingParty && !selectedCustomer}>
              Use billing address
            </button>
            <button type="button" className="secondary-button" onClick={copyJobSiteContactToBillingContact} disabled={!selectedServiceLocation}>
              Use job-site contact
            </button>
          </div>
          <div className="section-editor-grid">
            <label>Billing Contact Name<input value={form.billingContactName ?? ''} onChange={(e) => update('billingContactName', e.target.value || null)} /></label>
            <label>Billing Contact Phone<input value={form.billingContactPhone ?? ''} onChange={(e) => update('billingContactPhone', e.target.value || null)} /></label>
            <label>Billing Contact Email<input type="email" value={form.billingContactEmail ?? ''} onChange={(e) => update('billingContactEmail', e.target.value || null)} /></label>
          </div>
        </section>
      ) : null}

      {!isCreate && activeEditorSection === 'schedule' ? (
        <section className="section-editor-panel stack" aria-label="Schedule edit section">
          <div className="section-editor-heading">
            <h3>Schedule</h3>
            <p className="muted">{isCreate ? 'When did the customer report this issue? Scheduling and assignment happen separately after the ticket is created.' : 'Edit requested, scheduled start, and due dates for work planning.'}</p>
          </div>
          <div className="section-editor-grid">
            <label>Requested Date / Time<input type="datetime-local" value={toDatetimeLocalValue(form.requestedAtUtc)} onChange={(e) => update('requestedAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
            {!isCreate ? (
              <>
                <label>Scheduled Start<input type="datetime-local" value={toDatetimeLocalValue(form.scheduledStartAtUtc)} onChange={(e) => update('scheduledStartAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
                <label>Due Date<input type="datetime-local" value={toDatetimeLocalValue(form.dueAtUtc)} onChange={(e) => update('dueAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
              </>
            ) : null}
            <label>Estimated Duration
              <select value={form.estimatedDurationMinutes ?? ''} onChange={(e) => update('estimatedDurationMinutes', e.target.value ? Number(e.target.value) : null)}>
                <option value="">Unknown</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
                <option value="480">Full day (8 hrs)</option>
              </select>
            </label>
          </div>
          {scheduleAssignmentPanel}
        </section>
      ) : null}

      <div className="section-editor-save-row">
        <span className="muted">Changes save through the existing ticket update workflow.</span>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  )
}
