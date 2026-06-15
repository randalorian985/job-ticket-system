import { FormEvent, useEffect, useMemo, useState } from 'react'
import { masterDataApi } from '../../../api/masterDataApi'
import type {
  CreateCustomerDto,
  CreateEquipmentDto,
  CreatePartCategoryDto,
  CreatePartDto,
  CreateServiceLocationDto,
  CreateVendorDto,
  CustomerDto,
  EquipmentDto,
  PartCategoryDto,
  PartDto,
  ServiceLocationDto,
  VendorDto
} from '../../../types'
import { Errorable } from '../common/Errorable'
import {
  MasterDataFilters,
  MasterDataItem,
  MasterDataListState,
  MasterDataListSummary,
  archiveStatusLabel,
  categoryNameById,
  customerNameById,
  locationNameById,
  masterDataRequestErrorMessage,
  matchesArchiveFilter,
  matchesTextSearch,
  vendorNameById,
  type ArchiveFilter
} from './masterDataShared'

const hasRequiredText = (value?: string | null) => Boolean(value?.trim())
const hasRequiredTexts = (...values: Array<string | null | undefined>) => values.every(hasRequiredText)
const hasNonNegativeNumbers = (...values: number[]) => values.every((value) => Number.isFinite(value) && value >= 0)
const hasValidEquipmentYear = (value?: number | null) => value === null || value === undefined || (Number.isInteger(value) && value >= 1900 && value <= 2100)
const activeOrSelected = <T extends { id: string, isArchived?: boolean }>(items: T[], selectedIds: Array<string | null | undefined>) => {
  const selected = new Set(selectedIds.filter(Boolean))
  return items.filter((item) => !item.isArchived || selected.has(item.id))
}
const activeFilterId = <T extends { id: string, isArchived?: boolean }>(items: T[], id: string) => items.find((item) => item.id === id && !item.isArchived)?.id ?? ''
const hasMatchingEquipmentServiceLocation = (
  customerId: string,
  serviceLocationId: string,
  locations: ServiceLocationDto[],
  editingEquipment?: EquipmentDto
) => {
  const selectedLocation = locations.find((location) => location.id === serviceLocationId)
  if (selectedLocation) return selectedLocation.customerId === customerId
  return editingEquipment?.customerId === customerId && editingEquipment.serviceLocationId === serviceLocationId
}
const confirmArchiveAction = (entityLabel: string, entityName: string, isArchived?: boolean) => {
  const action = isArchived ? 'unarchive' : 'archive'
  return window.confirm(`Are you sure you want to ${action} ${entityLabel} "${entityName}"?`)
}

const emptyCustomerDraft: CreateCustomerDto = { name: '' }
const emptyServiceLocationDraft: CreateServiceLocationDto = { companyName: '', locationName: '', addressLine1: '', city: '', state: '', postalCode: '', country: 'US', isActive: true }
const emptyEquipmentDraft: CreateEquipmentDto = { customerId: '', serviceLocationId: '', ownerCustomerId: null, responsibleBillingCustomerId: null, name: '', equipmentNumber: '' }
const emptyPartDraft: CreatePartDto = { partCategoryId: '', partNumber: '', name: '', unitCost: 0, unitPrice: 0, quantityOnHand: 0, reorderThreshold: 0 }
const emptyVendorDraft: CreateVendorDto = { name: '' }
const emptyPartCategoryDraft: CreatePartCategoryDto = { name: '', description: '' }

export function CustomersPage() {
  const [editorOpen, setEditorOpen] = useState(true)
  const [items, setItems] = useState<CustomerDto[]>([])
  const [draft, setDraft] = useState<CreateCustomerDto>(emptyCustomerDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const load = () => {
    setIsLoading(true)
    return masterDataApi.listCustomers()
      .then((customerList) => {
        setItems(customerList)
        setEditorOpen(customerList.length === 0)
      })
      .catch(() => setError('Unable to load customers.'))
      .finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])
  const filteredItems = useMemo(() => items.filter((x) => matchesArchiveFilter(archiveFilter, x.isArchived) && matchesTextSearch(search, [x.name, x.accountNumber, x.contactName, x.email, x.phone])), [items, search, archiveFilter])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!hasRequiredText(draft.name)) { setSuccess(null); return setError('Customer name is required.') }
    try {
      const action = editId ? 'updated' : 'created'
      const customerName = draft.name.trim()
      setError(null)
      setSuccess(null)
      if (editId) await masterDataApi.updateCustomer(editId, draft)
      else await masterDataApi.createCustomer(draft)
      setDraft(emptyCustomerDraft); setEditId(null); await load()
      setEditorOpen(false)
      setSuccess(`Customer "${customerName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save customer.'))
    }
  }
  const closeEditor = () => {
    setDraft(emptyCustomerDraft)
    setEditId(null)
    setError(null)
    setSuccess(null)
    setEditorOpen(false)
  }
  const startEdit = (customer: CustomerDto) => {
    setDraft({
      name: customer.name,
      accountNumber: customer.accountNumber,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone
    })
    setEditId(customer.id)
    setError(null)
    setSuccess(null)
    setEditorOpen(true)
  }

  return (
    <section className="card stack">
      <div className="report-results-heading">
        <div>
          <h2>Customers</h2>
          <p className="muted">{editorOpen ? (editId ? 'Edit customer details.' : 'Create a customer record.') : 'Search and manage customer records.'}</p>
        </div>
        {!editorOpen ? <button type="button" onClick={() => { setDraft(emptyCustomerDraft); setEditId(null); setError(null); setSuccess(null); setEditorOpen(true) }}>Create Customer</button> : null}
      </div>
      <Errorable error={error} />
      {success ? <p className="success action-feedback-panel">{success}</p> : null}

      <form onSubmit={save} className="stack" aria-label="customer form" hidden={!editorOpen}>
        <div className="row">
          <label>Name<input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>Account number<input placeholder="Account number" value={draft.accountNumber ?? ''} onChange={(e) => setDraft({ ...draft, accountNumber: e.target.value })} /></label>
        </div>
        <div className="row">
          <label>Contact name<input placeholder="Contact name" value={draft.contactName ?? ''} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} /></label>
          <label>Email<input placeholder="Email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
          <label>Phone<input placeholder="Phone" value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
        </div>
        {editId ? <p className="muted">Editing customer. Save changes or return to the customer list.</p> : null}
        <div className="row">
          <button type="submit">{editId ? 'Save Customer' : 'Create Customer'}</button>
          <button type="button" className="secondary-button" onClick={closeEditor}>{editId ? 'Cancel customer edit' : 'Back to customers'}</button>
        </div>
      </form>

      <div className="stack" hidden={editorOpen}>
        <MasterDataFilters label="customers" search={search} searchPlaceholder="Search by name, account, contact, email, or phone" archiveFilter={archiveFilter} onSearchChange={setSearch} onArchiveFilterChange={setArchiveFilter} onReset={() => { setSearch(''); setArchiveFilter('all') }} />
        <MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="customers" />
        <MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="customers" />
        <ul className="master-data-list">
          {filteredItems.map((customer) => (
            <MasterDataItem
              key={customer.id}
              title={customer.name}
              statusArchived={customer.isArchived}
              meta={[
                `Account: ${customer.accountNumber ?? 'No account'}`,
                customer.contactName ? `Contact: ${customer.contactName}` : null,
                customer.email ? `Email: ${customer.email}` : null,
                customer.phone ? `Phone: ${customer.phone}` : null
              ]}
              actions={<>
                <button type="button" onClick={() => startEdit(customer)}>Edit</button>
                <button type="button" onClick={async () => {
                  if (!confirmArchiveAction('customer', customer.name, customer.isArchived)) return
                  const action = customer.isArchived ? 'unarchived' : 'archived'
                  try {
                    setError(null)
                    setSuccess(null)
                    if (customer.isArchived) await masterDataApi.unarchiveCustomer(customer.id)
                    else await masterDataApi.archiveCustomer(customer.id)
                    await load()
                    setSuccess(`Customer "${customer.name}" was ${action}.`)
                  } catch {
                    setSuccess(null)
                    setError('Unable to update customer archive state.')
                  }
                }}>{customer.isArchived ? 'Unarchive' : 'Archive'}</button>
              </>}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}


export function ServiceLocationsPage() {
  const [editorOpen, setEditorOpen] = useState(true)
  const [items, setItems] = useState<ServiceLocationDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [draft, setDraft] = useState<CreateServiceLocationDto>(emptyServiceLocationDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const [customerFilter, setCustomerFilter] = useState('')
  const load = () => {
    setIsLoading(true)
    return Promise.all([masterDataApi.listServiceLocations(), masterDataApi.listCustomers()])
      .then(([l, c]) => {
        setItems(l)
        setCustomers(c)
        setEditorOpen(l.length === 0)
      })
      .catch(() => setError('Unable to load service locations.'))
      .finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!editId) setDraft((current) => ({ ...current, customerId: activeFilterId(customers, customerFilter) || null }))
  }, [customerFilter, editId])
  const customerOptions = useMemo(() => activeOrSelected(customers, [draft.customerId]), [customers, draft.customerId])
  const filteredItems = useMemo(() => items.filter((x) => matchesArchiveFilter(archiveFilter, x.isArchived) && (!customerFilter || x.customerId === customerFilter) && matchesTextSearch(search, [x.locationName, x.companyName, customerNameById(customers, x.customerId), x.addressLine1, x.city, x.state, x.postalCode, x.country])), [items, customers, search, archiveFilter, customerFilter])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!hasRequiredTexts(draft.companyName, draft.locationName, draft.addressLine1, draft.city, draft.state, draft.postalCode, draft.country)) { setSuccess(null); return setError('All address fields are required.') }
    try {
      const action = editId ? 'updated' : 'created'
      const locationName = draft.locationName.trim()
      setError(null)
      setSuccess(null)
      if (editId) await masterDataApi.updateServiceLocation(editId, draft)
      else await masterDataApi.createServiceLocation(draft)
      setDraft({ ...emptyServiceLocationDraft, customerId: activeFilterId(customers, customerFilter) || null }); setEditId(null); await load()
      setEditorOpen(false)
      setSuccess(`Service location "${locationName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save service location.'))
    }
  }
  const closeEditor = () => {
    setDraft({ ...emptyServiceLocationDraft, customerId: customerFilter || null })
    setEditId(null)
    setError(null)
    setSuccess(null)
    setEditorOpen(false)
  }
  const startEdit = (location: ServiceLocationDto) => {
    setDraft(location)
    setEditId(location.id)
    setError(null)
    setSuccess(null)
    setEditorOpen(true)
  }

  return (
    <section className="card stack">
      <div className="report-results-heading">
        <div>
          <h2>Service Locations</h2>
          <p className="muted">{editorOpen ? (editId ? 'Edit service-location details.' : 'Create a service location.') : 'Search and manage service locations.'}</p>
        </div>
        {!editorOpen ? <button type="button" onClick={() => { setDraft({ ...emptyServiceLocationDraft, customerId: customerFilter || null }); setEditId(null); setError(null); setSuccess(null); setEditorOpen(true) }}>Create Location</button> : null}
      </div>
      <Errorable error={error} />
      {success ? <p className="success action-feedback-panel">{success}</p> : null}

      <form onSubmit={save} className="stack" aria-label="service location form" hidden={!editorOpen}>
        <label>Company<input placeholder="Company" value={draft.companyName} onChange={(e) => setDraft({ ...draft, companyName: e.target.value })} /></label>
        <label>Location name<input placeholder="Location Name" value={draft.locationName} onChange={(e) => setDraft({ ...draft, locationName: e.target.value })} /></label>
        <label>Address<input placeholder="Address" value={draft.addressLine1} onChange={(e) => setDraft({ ...draft, addressLine1: e.target.value })} /></label>
        <div className="row">
          <label>City<input placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label>
          <label>State<input placeholder="State" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} /></label>
        </div>
        <div className="row">
          <label>Postal code<input placeholder="Postal" value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} /></label>
          <label>Country<input placeholder="Country" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></label>
        </div>
        <label>Related customer<select value={draft.customerId ?? ''} onChange={(e) => setDraft({ ...draft, customerId: e.target.value || null })}><option value="">No customer</option>{customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label><input type="checkbox" checked={draft.isActive ?? true} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Active</label>
        {editId ? <p className="muted">Editing service location. Save changes or return to the location list.</p> : null}
        <div className="row">
          <button type="submit">{editId ? 'Save Location' : 'Create Location'}</button>
          <button type="button" className="secondary-button" onClick={closeEditor}>{editId ? 'Cancel service-location edit' : 'Back to service locations'}</button>
        </div>
      </form>

      <div className="stack" hidden={editorOpen}>
        <MasterDataFilters label="service locations" search={search} searchPlaceholder="Search by location, customer, company, or address" archiveFilter={archiveFilter} onSearchChange={setSearch} onArchiveFilterChange={setArchiveFilter} onReset={() => { setSearch(''); setArchiveFilter('all'); setCustomerFilter('') }}>
          <label>Customer<select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}><option value="">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        </MasterDataFilters>
        <MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="service locations" />
        <MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="service locations" />
        <ul className="master-data-list">
          {filteredItems.map((location) => (
            <MasterDataItem
              key={location.id}
              title={location.locationName}
              statusArchived={location.isArchived}
              meta={[
                `Company: ${location.companyName}`,
                `Customer: ${customerNameById(customers, location.customerId) || 'No customer'}`,
                `Service status: ${location.isActive ? 'Active' : 'Inactive'}`,
                `${location.addressLine1}, ${location.city}, ${location.state} ${location.postalCode} ${location.country}`
              ]}
              actions={<>
                <button type="button" onClick={() => startEdit(location)}>Edit</button>
                <button type="button" onClick={async () => {
                  if (!confirmArchiveAction('service location', location.locationName, location.isArchived)) return
                  const action = location.isArchived ? 'unarchived' : 'archived'
                  try {
                    setError(null)
                    setSuccess(null)
                    if (location.isArchived) await masterDataApi.unarchiveServiceLocation(location.id)
                    else await masterDataApi.archiveServiceLocation(location.id)
                    await load()
                    setSuccess(`Service location "${location.locationName}" was ${action}.`)
                  } catch {
                    setSuccess(null)
                    setError('Unable to update service location archive state.')
                  }
                }}>{location.isArchived ? 'Unarchive' : 'Archive'}</button>
              </>}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}


export function EquipmentPage() {
  const [editorOpen, setEditorOpen] = useState(true)
  const [items, setItems] = useState<EquipmentDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [locations, setLocations] = useState<ServiceLocationDto[]>([])
  const [draft, setDraft] = useState<CreateEquipmentDto>(emptyEquipmentDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const [customerFilter, setCustomerFilter] = useState('')
  const load = () => {
    setIsLoading(true)
    return Promise.all([masterDataApi.listEquipment(), masterDataApi.listCustomers(), masterDataApi.listServiceLocations()])
      .then(([equipment, customerList, locationList]) => {
        setItems(equipment)
        setCustomers(customerList)
        setLocations(locationList)
        setEditorOpen(equipment.length === 0)
      })
      .catch(() => setError('Unable to load equipment.'))
      .finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!editId) setDraft((current) => ({ ...current, customerId: activeFilterId(customers, customerFilter), serviceLocationId: '' }))
  }, [customerFilter, editId])
  const filteredItems = useMemo(() => items.filter((x) => matchesArchiveFilter(archiveFilter, x.isArchived) && (!customerFilter || x.customerId === customerFilter || x.ownerCustomerId === customerFilter || x.responsibleBillingCustomerId === customerFilter) && matchesTextSearch(search, [x.name, x.equipmentNumber, x.unitNumber, x.serialNumber, x.modelNumber, x.manufacturer, x.equipmentType, customerNameById(customers, x.customerId), customerNameById(customers, x.ownerCustomerId), customerNameById(customers, x.responsibleBillingCustomerId), locationNameById(locations, x.serviceLocationId)])), [items, customers, locations, search, archiveFilter, customerFilter])
  const customerOptions = useMemo(() => activeOrSelected(customers, [draft.customerId, draft.ownerCustomerId, draft.responsibleBillingCustomerId]), [customers, draft.customerId, draft.ownerCustomerId, draft.responsibleBillingCustomerId])
  const availableServiceLocations = useMemo(() => locations.filter((location) => (!location.isArchived || location.id === draft.serviceLocationId) && (!draft.customerId || location.customerId === draft.customerId)), [locations, draft.customerId, draft.serviceLocationId])
  const editingEquipment = useMemo(() => items.find((item) => item.id === editId), [items, editId])
  const unavailableCurrentServiceLocationId = editingEquipment
    && editingEquipment.customerId === draft.customerId
    && editingEquipment.serviceLocationId === draft.serviceLocationId
    && !locations.some((location) => location.id === draft.serviceLocationId)
    ? draft.serviceLocationId
    : null
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.customerId || !draft.serviceLocationId || !hasRequiredText(draft.name)) { setSuccess(null); return setError('Customer, location, and equipment name are required.') }
    if (!hasMatchingEquipmentServiceLocation(draft.customerId, draft.serviceLocationId, locations, editingEquipment)) { setSuccess(null); return setError('Equipment service location must belong to the selected customer.') }
    if (!hasValidEquipmentYear(draft.year)) { setSuccess(null); return setError('Equipment year must be a whole year from 1900 through 2100.') }
    try {
      const action = editId ? 'updated' : 'created'
      const equipmentName = draft.name.trim()
      setError(null)
      setSuccess(null)
      if (editId) await masterDataApi.updateEquipment(editId, draft)
      else await masterDataApi.createEquipment(draft)
      setDraft({ ...emptyEquipmentDraft, customerId: activeFilterId(customers, customerFilter), serviceLocationId: '' })
      setEditId(null)
      await load()
      setEditorOpen(false)
      setSuccess(`Equipment "${equipmentName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save equipment.'))
    }
  }
  const closeEditor = () => {
    setDraft({ ...emptyEquipmentDraft, customerId: customerFilter, serviceLocationId: '' })
    setEditId(null)
    setError(null)
    setSuccess(null)
    setEditorOpen(false)
  }
  const startEdit = (equipment: EquipmentDto) => {
    setDraft(equipment)
    setEditId(equipment.id)
    setError(null)
    setSuccess(null)
    setEditorOpen(true)
  }

  return (
    <section className="card stack">
      <div className="report-results-heading">
        <div>
          <h2>Equipment</h2>
          <p className="muted">{editorOpen ? (editId ? 'Edit equipment details.' : 'Create an equipment record.') : 'Search and manage equipment records.'}</p>
        </div>
        {!editorOpen ? <button type="button" onClick={() => { setDraft({ ...emptyEquipmentDraft, customerId: customerFilter, serviceLocationId: '' }); setEditId(null); setError(null); setSuccess(null); setEditorOpen(true) }}>Create Equipment</button> : null}
      </div>
      <Errorable error={error} />
      {success ? <p className="success action-feedback-panel">{success}</p> : null}

      <form onSubmit={save} className="stack" aria-label="equipment form" hidden={!editorOpen}>
        <div className="row">
          <label>Primary customer<select value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value, serviceLocationId: '' })}><option value="">Customer</option>{customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <label>Service location<select value={draft.serviceLocationId} onChange={(e) => setDraft({ ...draft, serviceLocationId: e.target.value })}><option value="">Service location</option>{unavailableCurrentServiceLocationId ? <option value={unavailableCurrentServiceLocationId}>Current service location (unavailable)</option> : null}{availableServiceLocations.map((location) => <option key={location.id} value={location.id}>{location.locationName}</option>)}</select></label>
        </div>
        <div className="row">
          <label>Owner customer<select value={draft.ownerCustomerId ?? ''} onChange={(e) => setDraft({ ...draft, ownerCustomerId: e.target.value || null })}><option value="">Same as customer</option>{customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <label>Billing customer<select value={draft.responsibleBillingCustomerId ?? ''} onChange={(e) => setDraft({ ...draft, responsibleBillingCustomerId: e.target.value || null })}><option value="">No separate billing customer</option>{customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        </div>
        <div className="row">
          <label>Equipment name<input placeholder="Equipment name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>Equipment number<input placeholder="Equipment number" value={draft.equipmentNumber ?? ''} onChange={(e) => setDraft({ ...draft, equipmentNumber: e.target.value })} /></label>
          <label>Unit number<input placeholder="Unit number" value={draft.unitNumber ?? ''} onChange={(e) => setDraft({ ...draft, unitNumber: e.target.value })} /></label>
        </div>
        <div className="row">
          <label>Manufacturer<input placeholder="Manufacturer" value={draft.manufacturer ?? ''} onChange={(e) => setDraft({ ...draft, manufacturer: e.target.value })} /></label>
          <label>Model number<input placeholder="Model number" value={draft.modelNumber ?? ''} onChange={(e) => setDraft({ ...draft, modelNumber: e.target.value })} /></label>
          <label>Serial number<input placeholder="Serial number" value={draft.serialNumber ?? ''} onChange={(e) => setDraft({ ...draft, serialNumber: e.target.value })} /></label>
        </div>
        <div className="row">
          <label>Equipment type<input placeholder="Equipment type" value={draft.equipmentType ?? ''} onChange={(e) => setDraft({ ...draft, equipmentType: e.target.value })} /></label>
          <label>Year<input type="number" min="1900" max="2100" step="1" placeholder="Year" value={draft.year ?? ''} onChange={(e) => setDraft({ ...draft, year: e.target.value ? Number(e.target.value) : null })} /></label>
        </div>
        {editId ? <p className="muted">Editing equipment. Save changes or return to the equipment list.</p> : null}
        <div className="row">
          <button type="submit">{editId ? 'Save Equipment' : 'Create Equipment'}</button>
          <button type="button" className="secondary-button" onClick={closeEditor}>{editId ? 'Cancel equipment edit' : 'Back to equipment'}</button>
        </div>
      </form>

      <div className="stack" hidden={editorOpen}>
        <MasterDataFilters label="equipment" search={search} searchPlaceholder="Search by name, unit, serial, model, customer, or location" archiveFilter={archiveFilter} onSearchChange={setSearch} onArchiveFilterChange={setArchiveFilter} onReset={() => { setSearch(''); setArchiveFilter('all'); setCustomerFilter('') }}>
          <label>Customer<select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}><option value="">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        </MasterDataFilters>
        <MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="equipment records" />
        <MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="equipment records" />
        <ul className="master-data-list">
          {filteredItems.map((equipment) => (
            <MasterDataItem
              key={equipment.id}
              title={equipment.name}
              statusArchived={equipment.isArchived}
              meta={[
                `Owner: ${customerNameById(customers, equipment.ownerCustomerId ?? equipment.customerId) || 'Customer unavailable'}`,
                `Billing: ${equipment.responsibleBillingCustomerId ? customerNameById(customers, equipment.responsibleBillingCustomerId) || 'Customer unavailable' : 'No separate billing customer'}`,
                `Location: ${locationNameById(locations, equipment.serviceLocationId) || 'Service location unavailable'}`,
                equipment.equipmentNumber ? `Equipment #: ${equipment.equipmentNumber}` : null,
                equipment.unitNumber ? `Unit: ${equipment.unitNumber}` : null,
                equipment.manufacturer || equipment.modelNumber ? `Model: ${[equipment.manufacturer, equipment.modelNumber].filter(Boolean).join(' ')}` : null,
                equipment.serialNumber ? `Serial: ${equipment.serialNumber}` : null,
                equipment.equipmentType ? `Type: ${equipment.equipmentType}` : null,
                equipment.year ? `Year: ${equipment.year}` : null
              ]}
              actions={<>
                <button type="button" onClick={() => startEdit(equipment)}>Edit</button>
                <button type="button" onClick={async () => {
                  if (!confirmArchiveAction('equipment', equipment.name, equipment.isArchived)) return
                  const action = equipment.isArchived ? 'unarchived' : 'archived'
                  try {
                    setError(null)
                    setSuccess(null)
                    if (equipment.isArchived) await masterDataApi.unarchiveEquipment(equipment.id)
                    else await masterDataApi.archiveEquipment(equipment.id)
                    await load()
                    setSuccess(`Equipment "${equipment.name}" was ${action}.`)
                  } catch {
                    setSuccess(null)
                    setError('Unable to update equipment archive state.')
                  }
                }}>{equipment.isArchived ? 'Unarchive' : 'Archive'}</button>
              </>}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}


type PartsWorkspaceScreen = 'parts' | 'vendors' | 'categories'

export function PartsPage() {
  const [activeScreen, setActiveScreen] = useState<PartsWorkspaceScreen>('parts')
  const [editorOpen, setEditorOpen] = useState(true)
  const [parts, setParts] = useState<PartDto[]>([])
  const [vendors, setVendors] = useState<VendorDto[]>([])
  const [categories, setCategories] = useState<PartCategoryDto[]>([])
  const [draft, setDraft] = useState<CreatePartDto>(emptyPartDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [vendorDraft, setVendorDraft] = useState<CreateVendorDto>(emptyVendorDraft)
  const [vendorEditId, setVendorEditId] = useState<string | null>(null)
  const [categoryDraft, setCategoryDraft] = useState<CreatePartCategoryDto>(emptyPartCategoryDraft)
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [partSearch, setPartSearch] = useState('')
  const [partArchiveFilter, setPartArchiveFilter] = useState<ArchiveFilter>('all')
  const [partCategoryFilter, setPartCategoryFilter] = useState('')
  const [partVendorFilter, setPartVendorFilter] = useState('')
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendorArchiveFilter, setVendorArchiveFilter] = useState<ArchiveFilter>('all')
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryArchiveFilter, setCategoryArchiveFilter] = useState<ArchiveFilter>('all')

  const load = () => {
    setIsLoading(true)
    return Promise.all([masterDataApi.listParts(), masterDataApi.listVendors(), masterDataApi.listPartCategories()])
      .then(([partRows, vendorRows, categoryRows]) => {
        setParts(partRows)
        setVendors(vendorRows)
        setCategories(categoryRows)
        if (!hasLoaded) {
          setEditorOpen(partRows.length === 0)
          setHasLoaded(true)
        }
      })
      .catch(() => setError('Unable to load parts, vendors, or categories.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const filteredParts = useMemo(
    () => parts.filter((part) =>
      matchesArchiveFilter(partArchiveFilter, part.isArchived)
      && (!partCategoryFilter || part.partCategoryId === partCategoryFilter)
      && (!partVendorFilter || part.vendorId === partVendorFilter)
      && matchesTextSearch(partSearch, [
        part.partNumber,
        part.name,
        part.description,
        categoryNameById(categories, part.partCategoryId),
        vendorNameById(vendors, part.vendorId)
      ])),
    [parts, vendors, categories, partSearch, partArchiveFilter, partCategoryFilter, partVendorFilter]
  )
  const filteredVendors = useMemo(
    () => vendors.filter((vendor) =>
      matchesArchiveFilter(vendorArchiveFilter, vendor.isArchived)
      && matchesTextSearch(vendorSearch, [vendor.name, vendor.accountNumber, vendor.contactName, vendor.email, vendor.phone])),
    [vendors, vendorSearch, vendorArchiveFilter]
  )
  const filteredCategories = useMemo(
    () => categories.filter((category) =>
      matchesArchiveFilter(categoryArchiveFilter, category.isArchived)
      && matchesTextSearch(categorySearch, [category.name, category.description])),
    [categories, categorySearch, categoryArchiveFilter]
  )
  const partCategoryOptions = useMemo(() => activeOrSelected(categories, [draft.partCategoryId]), [categories, draft.partCategoryId])
  const partVendorOptions = useMemo(() => activeOrSelected(vendors, [draft.vendorId]), [vendors, draft.vendorId])

  useEffect(() => {
    if (!editId) {
      setDraft((current) => ({
        ...current,
        partCategoryId: activeFilterId(categories, partCategoryFilter),
        vendorId: activeFilterId(vendors, partVendorFilter) || null
      }))
    }
  }, [partCategoryFilter, partVendorFilter, editId])

  const switchScreen = (screen: PartsWorkspaceScreen) => {
    setActiveScreen(screen)
    setEditorOpen(false)
    setError(null)
    setSuccess(null)
  }

  const closeEditor = () => {
    setDraft({ ...emptyPartDraft, partCategoryId: partCategoryFilter, vendorId: partVendorFilter || null })
    setVendorDraft(emptyVendorDraft)
    setCategoryDraft(emptyPartCategoryDraft)
    setEditId(null)
    setVendorEditId(null)
    setCategoryEditId(null)
    setError(null)
    setSuccess(null)
    setEditorOpen(false)
  }

  const savePart = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.partCategoryId || !hasRequiredText(draft.partNumber) || !hasRequiredText(draft.name)) {
      setSuccess(null)
      return setError('Category, part number, and name are required.')
    }
    if (!hasNonNegativeNumbers(draft.unitCost, draft.unitPrice, draft.quantityOnHand, draft.reorderThreshold)) {
      setSuccess(null)
      return setError('Part cost, price, quantity on hand, and reorder threshold must be zero or greater.')
    }

    try {
      const action = editId ? 'updated' : 'created'
      const partName = `${draft.partNumber.trim()} - ${draft.name.trim()}`
      setError(null)
      setSuccess(null)
      if (editId) await masterDataApi.updatePart(editId, draft)
      else await masterDataApi.createPart(draft)
      setDraft({ ...emptyPartDraft, partCategoryId: activeFilterId(categories, partCategoryFilter), vendorId: activeFilterId(vendors, partVendorFilter) || null })
      setEditId(null)
      await load()
      setEditorOpen(false)
      setSuccess(`Part "${partName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save part.'))
    }
  }

  const saveVendor = async (event: FormEvent) => {
    event.preventDefault()
    if (!hasRequiredText(vendorDraft.name)) {
      setSuccess(null)
      return setError('Vendor name is required.')
    }

    try {
      const action = vendorEditId ? 'updated' : 'created'
      const vendorName = vendorDraft.name.trim()
      setError(null)
      setSuccess(null)
      if (vendorEditId) await masterDataApi.updateVendor(vendorEditId, vendorDraft)
      else await masterDataApi.createVendor(vendorDraft)
      setVendorDraft(emptyVendorDraft)
      setVendorEditId(null)
      await load()
      setEditorOpen(false)
      setSuccess(`Vendor "${vendorName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save vendor.'))
    }
  }

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault()
    if (!hasRequiredText(categoryDraft.name)) {
      setSuccess(null)
      return setError('Part category name is required.')
    }

    try {
      const action = categoryEditId ? 'updated' : 'created'
      const categoryName = categoryDraft.name.trim()
      setError(null)
      setSuccess(null)
      if (categoryEditId) await masterDataApi.updatePartCategory(categoryEditId, categoryDraft)
      else await masterDataApi.createPartCategory(categoryDraft)
      setCategoryDraft(emptyPartCategoryDraft)
      setCategoryEditId(null)
      await load()
      setEditorOpen(false)
      setSuccess(`Part category "${categoryName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save part category.'))
    }
  }

  const activeTitle = activeScreen === 'parts' ? 'Parts' : activeScreen === 'vendors' ? 'Vendors' : 'Part Categories'

  return (
    <section className="stack">
      <nav className="master-data-screen-tabs" aria-label="parts master-data screens">
        <div role="tablist" aria-label="parts workspace">
          {([
            ['parts', 'Parts'],
            ['vendors', 'Vendors'],
            ['categories', 'Part Categories']
          ] as Array<[PartsWorkspaceScreen, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={activeScreen === value}
              className={activeScreen === value ? 'ticket-workflow-tab-active' : ''}
              onClick={() => switchScreen(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <article className="card stack">
        <div className="report-results-heading">
          <div>
            <h2>{activeTitle}</h2>
            <p className="muted">{editorOpen ? `Complete the focused ${activeTitle.toLowerCase()} editor.` : `Search and manage ${activeTitle.toLowerCase()}.`}</p>
          </div>
          {!editorOpen ? (
            <button type="button" onClick={() => {
              setError(null)
              setSuccess(null)
              if (activeScreen === 'parts') {
                setDraft({ ...emptyPartDraft, partCategoryId: partCategoryFilter, vendorId: partVendorFilter || null })
                setEditId(null)
              } else if (activeScreen === 'vendors') {
                setVendorDraft(emptyVendorDraft)
                setVendorEditId(null)
              } else {
                setCategoryDraft(emptyPartCategoryDraft)
                setCategoryEditId(null)
              }
              setEditorOpen(true)
            }}>
              {activeScreen === 'parts' ? 'Create Part' : activeScreen === 'vendors' ? 'Create Vendor' : 'Create Category'}
            </button>
          ) : null}
        </div>
        <Errorable error={error} />
        {success ? <p className="success action-feedback-panel">{success}</p> : null}

        {activeScreen === 'parts' ? (
          <>
            <form onSubmit={savePart} className="stack" aria-label="part form" hidden={!editorOpen}>
              <div className="row">
                <label>Part number<input placeholder="Part Number" value={draft.partNumber} onChange={(e) => setDraft({ ...draft, partNumber: e.target.value })} /></label>
                <label>Name<input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              </div>
              <label>Description<input placeholder="Description" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
              <div className="row">
                <label>Part category<select value={draft.partCategoryId} onChange={(e) => setDraft({ ...draft, partCategoryId: e.target.value })}><option value="">Category</option>{partCategoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label>Preferred vendor<select value={draft.vendorId ?? ''} onChange={(e) => setDraft({ ...draft, vendorId: e.target.value || null })}><option value="">Vendor</option>{partVendorOptions.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label>
              </div>
              <div className="row">
                <label>Unit cost<input type="number" min="0" step="0.01" placeholder="Cost" value={draft.unitCost} onChange={(e) => setDraft({ ...draft, unitCost: Number(e.target.value) })} /></label>
                <label>Billable price<input type="number" min="0" step="0.01" placeholder="Price" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: Number(e.target.value) })} /></label>
                <label>Quantity on hand<input type="number" min="0" step="0.01" placeholder="Quantity on hand" value={draft.quantityOnHand} onChange={(e) => setDraft({ ...draft, quantityOnHand: Number(e.target.value) })} /></label>
                <label>Reorder threshold<input type="number" min="0" step="0.01" placeholder="Reorder threshold" value={draft.reorderThreshold} onChange={(e) => setDraft({ ...draft, reorderThreshold: Number(e.target.value) })} /></label>
              </div>
              {editId ? <p className="muted">Editing part. Save changes or return to the parts list.</p> : null}
              <div className="row">
                <button type="submit">{editId ? 'Save Part' : 'Create Part'}</button>
                <button type="button" className="secondary-button" onClick={closeEditor}>{editId ? 'Cancel part edit' : 'Back to parts'}</button>
              </div>
            </form>

            <div className="stack" hidden={editorOpen}>
              <MasterDataFilters label="parts" search={partSearch} searchPlaceholder="Search by part number, name, category, vendor, or description" archiveFilter={partArchiveFilter} onSearchChange={setPartSearch} onArchiveFilterChange={setPartArchiveFilter} onReset={() => { setPartSearch(''); setPartArchiveFilter('all'); setPartCategoryFilter(''); setPartVendorFilter('') }}>
                <label>Category<select value={partCategoryFilter} onChange={(event) => setPartCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label>Vendor<select value={partVendorFilter} onChange={(event) => setPartVendorFilter(event.target.value)}><option value="">All vendors</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label>
              </MasterDataFilters>
              <MasterDataListSummary loading={isLoading} totalCount={parts.length} filteredItems={filteredParts} noun="parts" />
              <MasterDataListState loading={isLoading} totalCount={parts.length} filteredCount={filteredParts.length} noun="parts" />
              <ul className="master-data-list">
                {filteredParts.map((part) => (
                  <MasterDataItem
                    key={part.id}
                    title={`${part.partNumber} - ${part.name}`}
                    statusArchived={part.isArchived}
                    meta={[
                      `Category: ${categoryNameById(categories, part.partCategoryId) || 'No category'}`,
                      `Vendor: ${vendorNameById(vendors, part.vendorId) || 'No vendor'}`,
                      part.description ? `Description: ${part.description}` : null,
                      `Cost: ${part.unitCost}`,
                      `Price: ${part.unitPrice}`,
                      `On hand: ${part.quantityOnHand ?? 0}`,
                      `Reorder: ${part.reorderThreshold ?? 0}`
                    ]}
                    actions={<>
                      <button type="button" onClick={() => { setDraft(part); setEditId(part.id); setError(null); setSuccess(null); setEditorOpen(true) }}>Edit</button>
                      <button type="button" onClick={async () => {
                        if (!confirmArchiveAction('part', `${part.partNumber} - ${part.name}`, part.isArchived)) return
                        try {
                          setError(null)
                          setSuccess(null)
                          if (part.isArchived) await masterDataApi.unarchivePart(part.id)
                          else await masterDataApi.archivePart(part.id)
                          await load()
                          setSuccess(`Part "${part.partNumber} - ${part.name}" was ${part.isArchived ? 'unarchived' : 'archived'}.`)
                        } catch {
                          setSuccess(null)
                          setError('Unable to update archive state.')
                        }
                      }}>{part.isArchived ? 'Unarchive' : 'Archive'}</button>
                    </>}
                  />
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {activeScreen === 'vendors' ? (
          <>
            <form className="stack" aria-label="vendor form" onSubmit={saveVendor} hidden={!editorOpen}>
              <div className="row">
                <label>Vendor name<input placeholder="Vendor name" value={vendorDraft.name} onChange={(e) => setVendorDraft({ ...vendorDraft, name: e.target.value })} /></label>
                <label>Account number<input placeholder="Vendor account number" value={vendorDraft.accountNumber ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, accountNumber: e.target.value })} /></label>
              </div>
              <div className="row">
                <label>Contact name<input placeholder="Vendor contact name" value={vendorDraft.contactName ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, contactName: e.target.value })} /></label>
                <label>Email<input placeholder="Vendor email" value={vendorDraft.email ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, email: e.target.value })} /></label>
                <label>Phone<input placeholder="Vendor phone" value={vendorDraft.phone ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, phone: e.target.value })} /></label>
              </div>
              {vendorEditId ? <p className="muted">Editing vendor. Save changes or return to the vendor list.</p> : null}
              <div className="row">
                <button type="submit">{vendorEditId ? 'Save Vendor' : 'Create Vendor'}</button>
                <button type="button" className="secondary-button" onClick={closeEditor}>{vendorEditId ? 'Cancel vendor edit' : 'Back to vendors'}</button>
              </div>
            </form>

            <div className="stack" hidden={editorOpen}>
              <MasterDataFilters label="vendors" search={vendorSearch} searchPlaceholder="Search by name, account, contact, email, or phone" archiveFilter={vendorArchiveFilter} onSearchChange={setVendorSearch} onArchiveFilterChange={setVendorArchiveFilter} onReset={() => { setVendorSearch(''); setVendorArchiveFilter('all') }} />
              <MasterDataListSummary loading={isLoading} totalCount={vendors.length} filteredItems={filteredVendors} noun="vendors" />
              <MasterDataListState loading={isLoading} totalCount={vendors.length} filteredCount={filteredVendors.length} noun="vendors" />
              <ul className="master-data-list">
                {filteredVendors.map((vendor) => (
                  <MasterDataItem
                    key={vendor.id}
                    title={vendor.name}
                    statusArchived={vendor.isArchived}
                    meta={[
                      vendor.accountNumber ? `Account: ${vendor.accountNumber}` : 'Account: No account',
                      vendor.contactName ? `Contact: ${vendor.contactName}` : null,
                      vendor.email ? `Email: ${vendor.email}` : null,
                      vendor.phone ? `Phone: ${vendor.phone}` : null
                    ]}
                    actions={<>
                      <button type="button" onClick={() => { setVendorDraft(vendor); setVendorEditId(vendor.id); setError(null); setSuccess(null); setEditorOpen(true) }}>Edit</button>
                      <button type="button" onClick={async () => {
                        if (!confirmArchiveAction('vendor', vendor.name, vendor.isArchived)) return
                        try {
                          setError(null)
                          setSuccess(null)
                          if (vendor.isArchived) await masterDataApi.unarchiveVendor(vendor.id)
                          else await masterDataApi.archiveVendor(vendor.id)
                          await load()
                          setSuccess(`Vendor "${vendor.name}" was ${vendor.isArchived ? 'unarchived' : 'archived'}.`)
                        } catch {
                          setSuccess(null)
                          setError('Unable to update archive state.')
                        }
                      }}>{vendor.isArchived ? 'Unarchive' : 'Archive'}</button>
                    </>}
                  />
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {activeScreen === 'categories' ? (
          <>
            <form className="stack" aria-label="part category form" onSubmit={saveCategory} hidden={!editorOpen}>
              <div className="row">
                <label>Category name<input placeholder="Category name" value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} /></label>
                <label>Description<input placeholder="Category description" value={categoryDraft.description ?? ''} onChange={(e) => setCategoryDraft({ ...categoryDraft, description: e.target.value })} /></label>
              </div>
              {categoryEditId ? <p className="muted">Editing part category. Save changes or return to the category list.</p> : null}
              <div className="row">
                <button type="submit">{categoryEditId ? 'Save Category' : 'Create Category'}</button>
                <button type="button" className="secondary-button" onClick={closeEditor}>{categoryEditId ? 'Cancel category edit' : 'Back to categories'}</button>
              </div>
            </form>

            <div className="stack" hidden={editorOpen}>
              <MasterDataFilters label="part categories" search={categorySearch} searchPlaceholder="Search by name or description" archiveFilter={categoryArchiveFilter} onSearchChange={setCategorySearch} onArchiveFilterChange={setCategoryArchiveFilter} onReset={() => { setCategorySearch(''); setCategoryArchiveFilter('all') }} />
              <MasterDataListSummary loading={isLoading} totalCount={categories.length} filteredItems={filteredCategories} noun="part categories" />
              <MasterDataListState loading={isLoading} totalCount={categories.length} filteredCount={filteredCategories.length} noun="part categories" />
              <ul className="master-data-list">
                {filteredCategories.map((category) => (
                  <MasterDataItem
                    key={category.id}
                    title={category.name}
                    statusArchived={category.isArchived}
                    meta={[category.description ? `Description: ${category.description}` : 'Description: None']}
                    actions={<>
                      <button type="button" onClick={() => { setCategoryDraft(category); setCategoryEditId(category.id); setError(null); setSuccess(null); setEditorOpen(true) }}>Edit</button>
                      <button type="button" onClick={async () => {
                        if (!confirmArchiveAction('part category', category.name, category.isArchived)) return
                        try {
                          setError(null)
                          setSuccess(null)
                          if (category.isArchived) await masterDataApi.unarchivePartCategory(category.id)
                          else await masterDataApi.archivePartCategory(category.id)
                          await load()
                          setSuccess(`Part category "${category.name}" was ${category.isArchived ? 'unarchived' : 'archived'}.`)
                        } catch {
                          setSuccess(null)
                          setError('Unable to update archive state.')
                        }
                      }}>{category.isArchived ? 'Unarchive' : 'Archive'}</button>
                    </>}
                  />
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </article>
    </section>
  )
}
