/**
 * Private utilities shared across the master data page components.
 * Not re-exported through the EntityPages barrel.
 */
import type {
  CreateEquipmentDto,
  CreatePartCategoryDto,
  CreatePartDto,
  CreateServiceLocationDto,
  CreateVendorDto,
  CustomerDto,
  PartCategoryDto,
  ServiceLocationDto,
  VendorDto
} from '../../../types'

// ── Form validation ───────────────────────────────────────────────────────────

export const hasRequiredText = (value?: string | null) =>
  Boolean(value?.trim())

export const hasRequiredTexts = (...values: Array<string | null | undefined>) =>
  values.every(hasRequiredText)

export const hasNonNegativeNumbers = (...values: number[]) =>
  values.every((value) => Number.isFinite(value) && value >= 0)

export const hasValidEquipmentYear = (value?: number | null) =>
  value === null ||
  value === undefined ||
  (Number.isInteger(value) && value >= 1900 && value <= 2100)

// ── Address helpers ───────────────────────────────────────────────────────────

export const compactAddress = (...values: Array<string | null | undefined>) =>
  values.filter((value) => value?.trim()).join(', ')

export const customerBillingAddress = (customer: CustomerDto) =>
  compactAddress(
    customer.billingAddressLine1,
    customer.billingAddressLine2,
    compactAddress(customer.billingCity, customer.billingState, customer.billingPostalCode)
  )

export const serviceLocationAddress = (location: ServiceLocationDto) =>
  compactAddress(
    location.addressLine1,
    location.addressLine2,
    compactAddress(location.city, location.state, location.postalCode),
    location.country
  )

export const customerHasBillingAddress = (customer?: CustomerDto | null) =>
  Boolean(
    customer && (
      customer.billingAddressLine1?.trim() ||
      customer.billingAddressLine2?.trim() ||
      customer.billingCity?.trim() ||
      customer.billingState?.trim() ||
      customer.billingPostalCode?.trim()
    )
  )

// ── Display helpers ───────────────────────────────────────────────────────────

export const fallbackText = (value: string | null | undefined, fallback: string) =>
  value?.trim() || fallback

export const compactListField = (
  label: string,
  value: string | null | undefined,
  fallback = 'Not provided',
  className = ''
) => (
  <div className={`compact-list-field${value?.trim() ? '' : ' compact-list-field-empty'}${className ? ` ${className}` : ''}`}>
    <span className="compact-list-label">{label}</span>
    <span className="compact-list-value">{fallbackText(value, fallback)}</span>
  </div>
)

export const compactListStackedField = (
  label: string,
  values: Array<string | null | undefined>,
  fallback = 'Not provided',
  className = ''
) => {
  const visibleValues = values.filter((value): value is string => Boolean(value?.trim()))

  return (
    <div className={`compact-list-field compact-list-field-stacked${visibleValues.length ? '' : ' compact-list-field-empty'}${className ? ` ${className}` : ''}`}>
      <span className="compact-list-label">{label}</span>
      {visibleValues.length
        ? visibleValues.map((value, index) => (
            <span className="compact-list-value" key={`${label}-${index}`}>{value}</span>
          ))
        : <span className="compact-list-value compact-list-muted">{fallback}</span>}
    </div>
  )
}

// ── List utilities ────────────────────────────────────────────────────────────

export const activeOrSelected = <T extends { id: string; isArchived?: boolean }>(
  items: T[],
  selectedIds: Array<string | null | undefined>
) => {
  const selected = new Set(selectedIds.filter(Boolean))
  return items.filter((item) => !item.isArchived || selected.has(item.id))
}

export const activeFilterId = <T extends { id: string; isArchived?: boolean }>(
  items: T[],
  id: string
) => items.find((item) => item.id === id && !item.isArchived)?.id ?? ''

export const hasMatchingEquipmentServiceLocation = (
  customerId: string,
  serviceLocationId: string,
  locations: ServiceLocationDto[],
  editingEquipment?: { customerId: string; serviceLocationId: string } | null
) => {
  const selectedLocation = locations.find((location) => location.id === serviceLocationId)
  if (selectedLocation) return selectedLocation.customerId === customerId
  return (
    editingEquipment?.customerId === customerId &&
    editingEquipment.serviceLocationId === serviceLocationId
  )
}

export const confirmArchiveAction = (
  entityLabel: string,
  entityName: string,
  isArchived?: boolean
) => {
  const action = isArchived ? 'unarchive' : 'archive'
  return window.confirm(`Are you sure you want to ${action} ${entityLabel} "${entityName}"?`)
}

// ── Empty draft objects ───────────────────────────────────────────────────────

export const emptyCustomerDraft = {
  name: '',
  accountNumber: '',
  contactName: '',
  email: '',
  phone: '',
  billingPartyCustomerId: null as string | null,
  billingAddressLine1: '',
  billingAddressLine2: '',
  billingCity: '',
  billingState: '',
  billingPostalCode: ''
}

export const emptyServiceLocationDraft: CreateServiceLocationDto = {
  companyName: '',
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
  country: 'US',
  gateCode: '',
  accessInstructions: '',
  safetyRequirements: '',
  siteNotes: '',
  isActive: true
}

export const emptyEquipmentDraft: CreateEquipmentDto = {
  customerId: '',
  serviceLocationId: '',
  ownerCustomerId: null,
  responsibleBillingCustomerId: null,
  name: '',
  equipmentNumber: ''
}

export const emptyPartDraft: CreatePartDto = {
  partCategoryId: '',
  partNumber: '',
  name: '',
  unitCost: 0,
  unitPrice: 0,
  quantityOnHand: 0,
  reorderThreshold: 0
}

export const emptyVendorDraft: CreateVendorDto = { name: '' }

export const emptyPartCategoryDraft: CreatePartCategoryDto = { name: '', description: '' }

// ── Draft factory helpers ─────────────────────────────────────────────────────

export const serviceLocationDraftFromFilter = (
  customers: CustomerDto[],
  customerFilter: string
): CreateServiceLocationDto => ({
  ...emptyServiceLocationDraft,
  customerId: activeFilterId(customers, customerFilter) || null
})

export const equipmentDraftFromFilter = (
  customers: CustomerDto[],
  customerFilter: string
): CreateEquipmentDto => ({
  ...emptyEquipmentDraft,
  customerId: activeFilterId(customers, customerFilter),
  serviceLocationId: ''
})

export const partDraftFromFilters = (
  categories: PartCategoryDto[],
  partCategoryFilter: string,
  vendors: VendorDto[],
  partVendorFilter: string
): CreatePartDto => ({
  ...emptyPartDraft,
  partCategoryId: activeFilterId(categories, partCategoryFilter),
  vendorId: activeFilterId(vendors, partVendorFilter) || null
})
