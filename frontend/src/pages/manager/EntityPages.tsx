import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { reportsApi } from '../../api/reportsApi'
import { csvDataUri, toCsv, type CsvColumn } from '../../utils/csv'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { usersApi } from '../../api/usersApi'
import type {
  CreateCustomerDto,
  CreateEquipmentDto,
  CreatePartCategoryDto,
  CreatePartDto,
  CreateServiceLocationDto,
  CreateUserDto,
  CreateVendorDto,
  CustomerDto,
  EquipmentDto,
  InvoiceReadySummaryDto,
  JobCostSummaryDto,
  JobTicketPartDto,
  JobsReadyToInvoiceItemDto,
  LaborByEmployeeDto,
  LaborByJobDto,
  PartCategoryDto,
  PartsByJobDto,
  PartDto,
  ReportQueryFilters,
  ReportServiceHistoryItemDto,
  ServiceLocationDto,
  TimeEntryDto,
  UpdateUserDto,
  UserDto,
  VendorDto
} from '../../types'
import { formatDate, getApprovalLabel } from './managerDisplay'

function Errorable({ error }: { error: string | null }) { return error ? <p className="error">{error}</p> : null }


type ArchiveFilter = 'all' | 'active' | 'archived'

const normalizeSearchValue = (value?: string | number | null) => String(value ?? '').toLowerCase()
const matchesTextSearch = (query: string, values: Array<string | number | null | undefined>) => {
  const normalizedQuery = query.trim().toLowerCase()
  return !normalizedQuery || values.some((value) => normalizeSearchValue(value).includes(normalizedQuery))
}
const matchesArchiveFilter = (filter: ArchiveFilter, isArchived?: boolean) => {
  if (filter === 'active') return !isArchived
  if (filter === 'archived') return Boolean(isArchived)
  return true
}
const archiveStatusLabel = (isArchived?: boolean) => isArchived ? 'Archived' : 'Active'
const customerNameById = (customers: CustomerDto[], id?: string | null) => customers.find((customer) => customer.id === id)?.name ?? ''
const locationNameById = (locations: ServiceLocationDto[], id?: string | null) => locations.find((location) => location.id === id)?.locationName ?? ''
const categoryNameById = (categories: PartCategoryDto[], id?: string | null) => categories.find((category) => category.id === id)?.name ?? ''
const vendorNameById = (vendors: VendorDto[], id?: string | null) => vendors.find((vendor) => vendor.id === id)?.name ?? ''

function MasterDataFilters({
  label,
  search,
  searchPlaceholder,
  archiveFilter,
  onSearchChange,
  onArchiveFilterChange,
  onReset,
  children
}: {
  label: string
  search: string
  searchPlaceholder: string
  archiveFilter: ArchiveFilter
  onSearchChange: (value: string) => void
  onArchiveFilterChange: (value: ArchiveFilter) => void
  onReset: () => void
  children?: JSX.Element | JSX.Element[]
}) {
  return <div className="master-data-filters" aria-label={`${label} filters`}>
    <label>Search {label}<input value={search} placeholder={searchPlaceholder} onChange={(event) => onSearchChange(event.target.value)} /></label>
    <label>Status<select value={archiveFilter} onChange={(event) => onArchiveFilterChange(event.target.value as ArchiveFilter)}><option value="all">All records</option><option value="active">Active only</option><option value="archived">Archived only</option></select></label>
    {children}
    <button type="button" className="secondary-button" onClick={onReset}>Reset filters</button>
  </div>
}

function MasterDataListState({ loading, totalCount, filteredCount, noun }: { loading: boolean, totalCount: number, filteredCount: number, noun: string }) {
  if (loading) return <p className="muted">Loading {noun}…</p>
  if (totalCount === 0) return <p className="muted">No {noun} have been created yet.</p>
  if (filteredCount === 0) return <p className="muted">No {noun} match the current filters.</p>
  return null
}

type ArchivableRecord = { isArchived?: boolean }

const countNoun = (count: number, singular: string, plural = `${singular}s`) => count === 1 ? singular : plural
const loadedCountText = (visibleCount: number, totalCount: number, noun: string) => `Showing ${visibleCount} of ${totalCount} loaded ${noun}.`
const archivedVisibleText = (visibleRecords: ArchivableRecord[]) => {
  const archivedCount = visibleRecords.filter((record) => record.isArchived).length
  return archivedCount > 0 ? `${archivedCount} archived ${countNoun(archivedCount, 'record')} visible.` : 'No archived records visible.'
}

function MasterDataListSummary<T extends ArchivableRecord>({ loading, totalCount, filteredItems, noun }: { loading: boolean, totalCount: number, filteredItems: T[], noun: string }) {
  if (loading || totalCount === 0) return null
  const activeCount = filteredItems.filter((record) => !record.isArchived).length
  const archivedCount = filteredItems.length - activeCount
  return <div className="master-data-summary" aria-live="polite"><strong>{loadedCountText(filteredItems.length, totalCount, noun)}</strong><span>{activeCount} active / {archivedCount} archived visible.</span><span>{archivedVisibleText(filteredItems)}</span><span>Counts use currently loaded records only; no additional pages are requested here.</span></div>
}

function MasterDataItem({ title, statusArchived, meta, actions }: { title: string, statusArchived?: boolean, meta: Array<string | number | null | undefined | JSX.Element>, actions: JSX.Element }) {
  return <li className="master-data-item"><div className="master-data-item-main"><div className="master-data-title-row"><strong className="master-data-title">{title}</strong><span className={`status-pill ${statusArchived ? 'inactive' : 'active'}`}>{archiveStatusLabel(statusArchived)}</span></div><div className="master-data-meta">{meta.filter((value) => value !== null && value !== undefined && value !== '').map((value, index) => <span key={index}>{value}</span>)}</div></div><div className="master-data-actions">{actions}</div></li>
}

const masterDataRequestErrorMessage = (requestError: unknown, fallback: string) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return requestError.message
    if (requestError.status === 401 || requestError.status === 403) return 'You do not have permission to manage master data.'
    if (requestError.status === 404) return 'The selected master-data record could not be found. Refresh the list and try again.'
    if (requestError.status >= 500) return 'The server could not complete this master-data request right now.'
  }

  return fallback
}


export function CustomersPage() {
  const [items, setItems] = useState<CustomerDto[]>([])
  const [draft, setDraft] = useState<CreateCustomerDto>({ name: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const load = () => {
    setIsLoading(true)
    return masterDataApi.listCustomers()
      .then((customerList) => { setItems(customerList) })
      .catch(() => setError('Unable to load customers.'))
      .finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])
  const filteredItems = useMemo(() => items.filter((x) => matchesArchiveFilter(archiveFilter, x.isArchived) && matchesTextSearch(search, [x.name, x.accountNumber, x.contactName, x.email, x.phone])), [items, search, archiveFilter])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.name.trim()) return setError('Customer name is required.')
    try {
      setError(null)
      if (editId) await masterDataApi.updateCustomer(editId, draft)
      else await masterDataApi.createCustomer(draft)
      setDraft({ name: '' }); setEditId(null); await load()
    } catch (requestError) {
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save customer.'))
    }
  }
  return <section className="card stack"><h2>Customers</h2><Errorable error={error} /><form onSubmit={save} className="row"><input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><button type="submit">{editId ? 'Save Customer' : 'Create Customer'}</button></form><MasterDataFilters label="customers" search={search} searchPlaceholder="Search by name, account, contact, email, or phone" archiveFilter={archiveFilter} onSearchChange={setSearch} onArchiveFilterChange={setArchiveFilter} onReset={() => { setSearch(''); setArchiveFilter('all') }} /><MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="customers" /><MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="customers" /><ul className="master-data-list">{filteredItems.map((x) => <MasterDataItem key={x.id} title={x.name} statusArchived={x.isArchived} meta={[`Account: ${x.accountNumber ?? 'No account'}`, x.contactName ? `Contact: ${x.contactName}` : null, x.email ? `Email: ${x.email}` : null, x.phone ? `Phone: ${x.phone}` : null]} actions={<><button type="button" onClick={() => { setDraft({ name: x.name, accountNumber: x.accountNumber, contactName: x.contactName, email: x.email, phone: x.phone }); setEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveCustomer(x.id); else await masterDataApi.archiveCustomer(x.id); await load() } catch { setError('Unable to update customer archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></section>
}


export function ServiceLocationsPage() {
  const [items, setItems] = useState<ServiceLocationDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [draft, setDraft] = useState<CreateServiceLocationDto>({ companyName: '', locationName: '', addressLine1: '', city: '', state: '', postalCode: '', country: 'US', isActive: true })
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const [customerFilter, setCustomerFilter] = useState('')
  const load = () => {
    setIsLoading(true)
    return Promise.all([masterDataApi.listServiceLocations(), masterDataApi.listCustomers()])
      .then(([l, c]) => { setItems(l); setCustomers(c) })
      .catch(() => setError('Unable to load service locations.'))
      .finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])
  const filteredItems = useMemo(() => items.filter((x) => matchesArchiveFilter(archiveFilter, x.isArchived) && (!customerFilter || x.customerId === customerFilter) && matchesTextSearch(search, [x.locationName, x.companyName, customerNameById(customers, x.customerId), x.addressLine1, x.city, x.state, x.postalCode, x.country])), [items, customers, search, archiveFilter, customerFilter])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.companyName || !draft.locationName || !draft.addressLine1 || !draft.city || !draft.state || !draft.postalCode || !draft.country) return setError('All address fields are required.')
    try {
      setError(null)
      if (editId) await masterDataApi.updateServiceLocation(editId, draft)
      else await masterDataApi.createServiceLocation(draft)
      setDraft({ companyName: '', locationName: '', addressLine1: '', city: '', state: '', postalCode: '', country: 'US', isActive: true }); setEditId(null); await load()
    } catch (requestError) {
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save service location.'))
    }
  }
  return <section className="card stack"><h2>Service Locations</h2><Errorable error={error} /><form onSubmit={save} className="stack"><input placeholder="Company" value={draft.companyName} onChange={(e) => setDraft({ ...draft, companyName: e.target.value })} /><input placeholder="Location Name" value={draft.locationName} onChange={(e) => setDraft({ ...draft, locationName: e.target.value })} /><input placeholder="Address" value={draft.addressLine1} onChange={(e) => setDraft({ ...draft, addressLine1: e.target.value })} /><div className="row"><input placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /><input placeholder="State" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} /></div><div className="row"><input placeholder="Postal" value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} /><input placeholder="Country" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></div><select value={draft.customerId ?? ''} onChange={(e) => setDraft({ ...draft, customerId: e.target.value || null })}><option value="">No customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label><input type="checkbox" checked={draft.isActive ?? true} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Active</label><button type="submit">{editId ? 'Save Location' : 'Create Location'}</button></form><MasterDataFilters label="service locations" search={search} searchPlaceholder="Search by location, customer, company, or address" archiveFilter={archiveFilter} onSearchChange={setSearch} onArchiveFilterChange={setArchiveFilter} onReset={() => { setSearch(''); setArchiveFilter('all'); setCustomerFilter('') }}><label>Customer<select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}><option value="">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label></MasterDataFilters><MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="service locations" /><MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="service locations" /><ul className="master-data-list">{filteredItems.map((x) => <MasterDataItem key={x.id} title={x.locationName} statusArchived={x.isArchived} meta={[`Company: ${x.companyName}`, `Customer: ${customerNameById(customers, x.customerId) || 'No customer'}`, `Service status: ${x.isActive ? 'Active' : 'Inactive'}`, `${x.addressLine1}, ${x.city}, ${x.state} ${x.postalCode} ${x.country}`]} actions={<><button type="button" onClick={() => { setDraft(x); setEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveServiceLocation(x.id); else await masterDataApi.archiveServiceLocation(x.id); await load() } catch { setError('Unable to update service location archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></section>
}


export function EquipmentPage() {
  const [items, setItems] = useState<EquipmentDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [locations, setLocations] = useState<ServiceLocationDto[]>([])
  const [draft, setDraft] = useState<CreateEquipmentDto>({ customerId: '', serviceLocationId: '', ownerCustomerId: null, responsibleBillingCustomerId: null, name: '', equipmentNumber: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const [customerFilter, setCustomerFilter] = useState('')
  const load = () => {
    setIsLoading(true)
    return Promise.all([masterDataApi.listEquipment(), masterDataApi.listCustomers(), masterDataApi.listServiceLocations()])
      .then(([equipment, customerList, locationList]) => { setItems(equipment); setCustomers(customerList); setLocations(locationList) })
      .catch(() => setError('Unable to load equipment.'))
      .finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])
  const filteredItems = useMemo(() => items.filter((x) => matchesArchiveFilter(archiveFilter, x.isArchived) && (!customerFilter || x.customerId === customerFilter || x.ownerCustomerId === customerFilter || x.responsibleBillingCustomerId === customerFilter) && matchesTextSearch(search, [x.name, x.equipmentNumber, x.unitNumber, x.serialNumber, x.modelNumber, x.manufacturer, x.equipmentType, customerNameById(customers, x.customerId), customerNameById(customers, x.ownerCustomerId), customerNameById(customers, x.responsibleBillingCustomerId), locationNameById(locations, x.serviceLocationId)])), [items, customers, locations, search, archiveFilter, customerFilter])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.customerId || !draft.serviceLocationId || !draft.name.trim()) return setError('Customer, location, and equipment name are required.')
    try {
      setError(null)
      if (editId) await masterDataApi.updateEquipment(editId, draft)
      else await masterDataApi.createEquipment(draft)
      setDraft({ customerId: '', serviceLocationId: '', ownerCustomerId: null, responsibleBillingCustomerId: null, name: '', equipmentNumber: '' })
      setEditId(null)
      await load()
    } catch (requestError) {
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save equipment.'))
    }
  }
  return <section className="card stack"><h2>Equipment</h2><Errorable error={error} /><form onSubmit={save} className="stack"><div className="row"><select value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}><option value="">Customer</option>{customers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><select value={draft.serviceLocationId} onChange={(e) => setDraft({ ...draft, serviceLocationId: e.target.value })}><option value="">Service location</option>{locations.map((x) => <option key={x.id} value={x.id}>{x.locationName}</option>)}</select></div><input placeholder="Equipment name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><input placeholder="Equipment number" value={draft.equipmentNumber ?? ''} onChange={(e) => setDraft({ ...draft, equipmentNumber: e.target.value })} /><button type="submit">{editId ? 'Save Equipment' : 'Create Equipment'}</button></form><MasterDataFilters label="equipment" search={search} searchPlaceholder="Search by name, unit, serial, model, customer, or location" archiveFilter={archiveFilter} onSearchChange={setSearch} onArchiveFilterChange={setArchiveFilter} onReset={() => { setSearch(''); setArchiveFilter('all'); setCustomerFilter('') }}><label>Customer<select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}><option value="">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label></MasterDataFilters><MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="equipment records" /><MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="equipment records" /><ul className="master-data-list">{filteredItems.map((x) => <MasterDataItem key={x.id} title={x.name} statusArchived={x.isArchived} meta={[`Owner: ${customerNameById(customers, x.ownerCustomerId ?? x.customerId) || x.ownerCustomerId || x.customerId}`, `Billing: ${customerNameById(customers, x.responsibleBillingCustomerId) || x.responsibleBillingCustomerId || 'n/a'}`, `Location: ${locationNameById(locations, x.serviceLocationId) || x.serviceLocationId}`, x.equipmentNumber ? `Equipment #: ${x.equipmentNumber}` : null, x.serialNumber ? `Serial: ${x.serialNumber}` : null]} actions={<><button type="button" onClick={() => { setDraft(x); setEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveEquipment(x.id); else await masterDataApi.archiveEquipment(x.id); await load() } catch { setError('Unable to update equipment archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></section>
}


export function PartsPage() {
  const [parts, setParts] = useState<PartDto[]>([])
  const [vendors, setVendors] = useState<VendorDto[]>([])
  const [categories, setCategories] = useState<PartCategoryDto[]>([])
  const [draft, setDraft] = useState<CreatePartDto>({ partCategoryId: '', partNumber: '', name: '', unitCost: 0, unitPrice: 0, quantityOnHand: 0, reorderThreshold: 0 })
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
      .then(([p, v, c]) => { setParts(p); setVendors(v); setCategories(c) })
      .catch(() => setError('Unable to load parts, vendors, or categories.'))
      .finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])
  const filteredParts = useMemo(() => parts.filter((x) => matchesArchiveFilter(partArchiveFilter, x.isArchived) && (!partCategoryFilter || x.partCategoryId === partCategoryFilter) && (!partVendorFilter || x.vendorId === partVendorFilter) && matchesTextSearch(partSearch, [x.partNumber, x.name, x.description, categoryNameById(categories, x.partCategoryId), vendorNameById(vendors, x.vendorId)])), [parts, vendors, categories, partSearch, partArchiveFilter, partCategoryFilter, partVendorFilter])
  const filteredVendors = useMemo(() => vendors.filter((x) => matchesArchiveFilter(vendorArchiveFilter, x.isArchived) && matchesTextSearch(vendorSearch, [x.name, x.accountNumber, x.contactName, x.email, x.phone])), [vendors, vendorSearch, vendorArchiveFilter])
  const filteredCategories = useMemo(() => categories.filter((x) => matchesArchiveFilter(categoryArchiveFilter, x.isArchived) && matchesTextSearch(categorySearch, [x.name, x.description])), [categories, categorySearch, categoryArchiveFilter])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.partCategoryId || !draft.partNumber || !draft.name) return setError('Category, part number, and name are required.')
    try {
      setError(null)
      if (editId) await masterDataApi.updatePart(editId, draft)
      else await masterDataApi.createPart(draft)
      setDraft({ partCategoryId: '', partNumber: '', name: '', unitCost: 0, unitPrice: 0, quantityOnHand: 0, reorderThreshold: 0 }); setEditId(null); await load()
    } catch (requestError) {
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save part.'))
    }
  }
  const [vendorDraft, setVendorDraft] = useState<CreateVendorDto>({ name: '' })
  const [vendorEditId, setVendorEditId] = useState<string | null>(null)
  const [categoryDraft, setCategoryDraft] = useState<CreatePartCategoryDto>({ name: '', description: '' })
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null)

  return <section className="stack"><article className="card stack"><h2>Parts</h2><Errorable error={error} /><form onSubmit={save} className="stack"><div className="row"><input placeholder="Part Number" value={draft.partNumber} onChange={(e) => setDraft({ ...draft, partNumber: e.target.value })} /><input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div><div className="row"><select value={draft.partCategoryId} onChange={(e) => setDraft({ ...draft, partCategoryId: e.target.value })}><option value="">Category</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><select value={draft.vendorId ?? ''} onChange={(e) => setDraft({ ...draft, vendorId: e.target.value || null })}><option value="">Vendor</option>{vendors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div className="row"><input type="number" placeholder="Cost" value={draft.unitCost} onChange={(e) => setDraft({ ...draft, unitCost: Number(e.target.value) })} /><input type="number" placeholder="Price" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: Number(e.target.value) })} /></div><button type="submit">{editId ? 'Save Part' : 'Create Part'}</button></form><MasterDataFilters label="parts" search={partSearch} searchPlaceholder="Search by part number, name, category, vendor, or description" archiveFilter={partArchiveFilter} onSearchChange={setPartSearch} onArchiveFilterChange={setPartArchiveFilter} onReset={() => { setPartSearch(''); setPartArchiveFilter('all'); setPartCategoryFilter(''); setPartVendorFilter('') }}><label>Category<select value={partCategoryFilter} onChange={(event) => setPartCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Vendor<select value={partVendorFilter} onChange={(event) => setPartVendorFilter(event.target.value)}><option value="">All vendors</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label></MasterDataFilters><MasterDataListSummary loading={isLoading} totalCount={parts.length} filteredItems={filteredParts} noun="parts" /><MasterDataListState loading={isLoading} totalCount={parts.length} filteredCount={filteredParts.length} noun="parts" /><ul className="master-data-list">{filteredParts.map((x) => <MasterDataItem key={x.id} title={`${x.partNumber} - ${x.name}`} statusArchived={x.isArchived} meta={[`Category: ${categoryNameById(categories, x.partCategoryId) || 'No category'}`, `Vendor: ${vendorNameById(vendors, x.vendorId) || 'No vendor'}`, `Cost: ${x.unitCost}`, `Price: ${x.unitPrice}`, `On hand: ${x.quantityOnHand ?? 0}`]} actions={<><button type="button" onClick={() => { setDraft(x); setEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchivePart(x.id); else await masterDataApi.archivePart(x.id); await load() } catch { setError('Unable to update archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></article><article className="card stack"><h3>Vendors</h3><form className="row" onSubmit={async (e) => { e.preventDefault(); if (!vendorDraft.name.trim()) return setError('Vendor name is required.'); try { setError(null); if (vendorEditId) await masterDataApi.updateVendor(vendorEditId, vendorDraft); else await masterDataApi.createVendor(vendorDraft); setVendorDraft({ name: '' }); setVendorEditId(null); await load() } catch (requestError) { setError(masterDataRequestErrorMessage(requestError, 'Unable to save vendor.')) } }}><input placeholder="Vendor name" value={vendorDraft.name} onChange={(e) => setVendorDraft({ ...vendorDraft, name: e.target.value })} /><button type="submit">{vendorEditId ? 'Save Vendor' : 'Create Vendor'}</button></form><MasterDataFilters label="vendors" search={vendorSearch} searchPlaceholder="Search by name, account, contact, email, or phone" archiveFilter={vendorArchiveFilter} onSearchChange={setVendorSearch} onArchiveFilterChange={setVendorArchiveFilter} onReset={() => { setVendorSearch(''); setVendorArchiveFilter('all') }} /><MasterDataListSummary loading={isLoading} totalCount={vendors.length} filteredItems={filteredVendors} noun="vendors" /><MasterDataListState loading={isLoading} totalCount={vendors.length} filteredCount={filteredVendors.length} noun="vendors" /><ul className="master-data-list">{filteredVendors.map((x) => <MasterDataItem key={x.id} title={x.name} statusArchived={x.isArchived} meta={[x.accountNumber ? `Account: ${x.accountNumber}` : 'Account: No account', x.contactName ? `Contact: ${x.contactName}` : null, x.email ? `Email: ${x.email}` : null, x.phone ? `Phone: ${x.phone}` : null]} actions={<><button type="button" onClick={() => { setVendorDraft(x); setVendorEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveVendor(x.id); else await masterDataApi.archiveVendor(x.id); await load() } catch { setError('Unable to update archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></article><article className="card stack"><h3>Part Categories</h3><form className="row" onSubmit={async (e) => { e.preventDefault(); if (!categoryDraft.name.trim()) return setError('Part category name is required.'); try { setError(null); if (categoryEditId) await masterDataApi.updatePartCategory(categoryEditId, categoryDraft); else await masterDataApi.createPartCategory(categoryDraft); setCategoryDraft({ name: '', description: '' }); setCategoryEditId(null); await load() } catch (requestError) { setError(masterDataRequestErrorMessage(requestError, 'Unable to save part category.')) } }}><input placeholder="Category name" value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} /><button type="submit">{categoryEditId ? 'Save Category' : 'Create Category'}</button></form><MasterDataFilters label="part categories" search={categorySearch} searchPlaceholder="Search by name or description" archiveFilter={categoryArchiveFilter} onSearchChange={setCategorySearch} onArchiveFilterChange={setCategoryArchiveFilter} onReset={() => { setCategorySearch(''); setCategoryArchiveFilter('all') }} /><MasterDataListSummary loading={isLoading} totalCount={categories.length} filteredItems={filteredCategories} noun="part categories" /><MasterDataListState loading={isLoading} totalCount={categories.length} filteredCount={filteredCategories.length} noun="part categories" /><ul className="master-data-list">{filteredCategories.map((x) => <MasterDataItem key={x.id} title={x.name} statusArchived={x.isArchived} meta={[x.description ? `Description: ${x.description}` : 'Description: None']} actions={<><button type="button" onClick={() => { setCategoryDraft(x); setCategoryEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchivePartCategory(x.id); else await masterDataApi.archivePartCategory(x.id); await load() } catch { setError('Unable to update archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></article></section>
}

export function TimeApprovalPage() { const [jobId, setJobId] = useState(''); const [entries, setEntries] = useState<TimeEntryDto[]>([]); const [error, setError] = useState<string | null>(null); const load = () => jobId ? timeEntriesApi.listByJob(jobId).then(setEntries).catch(() => setError('Unable to load time entries for job.')) : Promise.resolve(); const approve = async (id: string) => { await timeEntriesApi.approve(id, { approvedByUserId: '' }); await load() }; const reject = async (id: string) => { await timeEntriesApi.reject(id, { rejectedByUserId: '', reason: 'Rejected in manager review' }); await load() }; return <section className="card stack"><h2>Time Approval</h2><p className="muted">Enter a job ticket id to review and action time entries.</p><input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id" /><button onClick={() => load()}>Load Time Entries</button><Errorable error={error} /><ul>{entries.map((x) => <li key={x.id}>{x.employeeId} · {formatDate(x.startedAtUtc)} - {formatDate(x.endedAtUtc)} · {x.laborHours}h · {getApprovalLabel(x.approvalStatus)} <button onClick={() => approve(x.id)}>Approve</button> <button onClick={() => reject(x.id)}>Reject</button></li>)}</ul></section> }

export function PartsApprovalPage() { const [jobId, setJobId] = useState(''); const [parts, setParts] = useState<JobTicketPartDto[]>([]); const [error, setError] = useState<string | null>(null); const load = () => jobId ? jobTicketsApi.listParts(jobId).then(setParts).catch(() => setError('Unable to load job parts for approval.')) : Promise.resolve(); const approve = async (id: string) => { await jobTicketsApi.approvePart(jobId, id); await load() }; const reject = async (id: string) => { await jobTicketsApi.rejectPart(jobId, id, { rejectionReason: 'Rejected in manager review' }); await load() }; return <section className="card stack"><h2>Parts Approval</h2><input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id" /><button onClick={() => load()}>Load Job Parts</button><Errorable error={error} /><ul>{parts.map((x) => <li key={x.id}>Part {x.partId} · Qty {x.quantity} · Added by {x.addedByEmployeeId ?? 'n/a'} · Cost {x.unitCostSnapshot} · Sale {x.salePriceSnapshot} · {getApprovalLabel(x.approvalStatus)} <button onClick={() => approve(x.id)}>Approve</button> <button onClick={() => reject(x.id)}>Reject</button></li>)}</ul></section> }

type ReportMode = 'invoiceReady' | 'jobCost' | 'jobsReady' | 'laborJob' | 'laborEmployee' | 'partsJob' | 'customerHistory' | 'equipmentHistory'
type ReportRow = InvoiceReadySummaryDto | JobCostSummaryDto | JobsReadyToInvoiceItemDto | LaborByJobDto | LaborByEmployeeDto | PartsByJobDto | ReportServiceHistoryItemDto

type ReportColumn<T extends ReportRow> = CsvColumn<T> & {
  render?: (row: T) => string | JSX.Element
}

const reportTitleMap: Record<ReportMode, string> = {
  invoiceReady: 'Invoice-ready Summary',
  jobCost: 'Job Cost Summary',
  jobsReady: 'Jobs Ready to Invoice',
  laborJob: 'Labor by Job',
  laborEmployee: 'Labor by Employee',
  partsJob: 'Parts by Job',
  customerHistory: 'Customer Service History',
  equipmentHistory: 'Equipment Service History'
}

const reportDescriptions: Record<ReportMode, string> = {
  invoiceReady: 'One invoice-ready job summary with approved labor and approved parts totals.',
  jobCost: 'One job cost summary showing labor, parts, and grand total.',
  jobsReady: 'Jobs that have approved billable activity and are ready for invoice review.',
  laborJob: 'Approved labor totals grouped by job ticket.',
  laborEmployee: 'Approved labor totals grouped by employee.',
  partsJob: 'Approved job-part quantity and snapshot price totals grouped by job.',
  customerHistory: 'Service history for a selected customer.',
  equipmentHistory: 'Service history for selected equipment.'
}

const money = (value?: number | null) => typeof value === 'number' ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—'
const quantity = (value?: number | null) => typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'
const hours = (value?: number | null) => typeof value === 'number' ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} h` : '—'
const dateOnly = (value?: string | null) => value ? new Date(value).toLocaleDateString() : '—'

const getJobStatusLabel = (value: number) => {
  switch (value) {
    case 1: return 'Draft'
    case 2: return 'Submitted'
    case 3: return 'Assigned'
    case 4: return 'In Progress'
    case 5: return 'Waiting on Parts'
    case 6: return 'Waiting on Customer'
    case 7: return 'Completed'
    case 8: return 'Cancelled'
    case 9: return 'Invoiced'
    case 10: return 'Reviewed'
    default: return `Status ${value}`
  }
}

const getInvoiceStatusLabel = (value: number) => {
  switch (value) {
    case 1: return 'Not Ready'
    case 2: return 'Ready'
    case 3: return 'Drafted'
    case 4: return 'Sent'
    case 5: return 'Paid'
    case 6: return 'Void'
    default: return `Status ${value}`
  }
}

const jobLink = (id: string, label: string) => <Link to={`/manage/job-tickets/${id}`}>{label}</Link>
const managerListLink = (to: string, label?: string | null) => label ? <Link to={to}>{label}</Link> : '—'

const columnsByMode: Record<ReportMode, ReportColumn<any>[]> = {
  invoiceReady: [
    { header: 'Job Ticket', value: (row: InvoiceReadySummaryDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: InvoiceReadySummaryDto) => row.customer },
    { header: 'Billing Party', value: (row: InvoiceReadySummaryDto) => row.billingPartyCustomer },
    { header: 'Service Location', value: (row: InvoiceReadySummaryDto) => row.serviceLocation },
    { header: 'Equipment', value: (row: InvoiceReadySummaryDto) => row.equipment ?? '' },
    { header: 'Job Status', value: (row: InvoiceReadySummaryDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Invoice Status', value: (row: InvoiceReadySummaryDto) => getInvoiceStatusLabel(row.invoiceStatus) },
    { header: 'Labor Hours', value: (row: InvoiceReadySummaryDto) => hours(row.laborHours) },
    { header: 'Labor Billable', value: (row: InvoiceReadySummaryDto) => money(row.laborBillableTotal) },
    { header: 'Parts Billable', value: (row: InvoiceReadySummaryDto) => money(row.partsBillableTotal) },
    { header: 'Tax', value: (row: InvoiceReadySummaryDto) => money(row.tax) },
    { header: 'Grand Total', value: (row: InvoiceReadySummaryDto) => money(row.grandTotal) }
  ],
  jobCost: [
    { header: 'Job Ticket', value: (row: JobCostSummaryDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Labor Hours', value: (row: JobCostSummaryDto) => hours(row.laborHours) },
    { header: 'Labor Cost', value: (row: JobCostSummaryDto) => money(row.laborCostTotal) },
    { header: 'Labor Billable', value: (row: JobCostSummaryDto) => money(row.laborBillableTotal) },
    { header: 'Parts Cost', value: (row: JobCostSummaryDto) => money(row.partsCostTotal) },
    { header: 'Parts Billable', value: (row: JobCostSummaryDto) => money(row.partsBillableTotal) },
    { header: 'Grand Total', value: (row: JobCostSummaryDto) => money(row.grandTotal) }
  ],
  jobsReady: [
    { header: 'Job Ticket', value: (row: JobsReadyToInvoiceItemDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: JobsReadyToInvoiceItemDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Billing Party', value: (row: JobsReadyToInvoiceItemDto) => row.billingPartyCustomer },
    { header: 'Job Status', value: (row: JobsReadyToInvoiceItemDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Invoice Status', value: (row: JobsReadyToInvoiceItemDto) => getInvoiceStatusLabel(row.invoiceStatus) },
    { header: 'Approved Labor Hours', value: (row: JobsReadyToInvoiceItemDto) => hours(row.approvedLaborHours) },
    { header: 'Approved Parts Qty', value: (row: JobsReadyToInvoiceItemDto) => quantity(row.approvedPartsCount) },
    { header: 'Estimated Billable Total', value: (row: JobsReadyToInvoiceItemDto) => money(row.estimatedBillableTotal) },
    { header: 'Completed', value: (row: JobsReadyToInvoiceItemDto) => dateOnly(row.completedAtUtc) }
  ],
  laborJob: [
    { header: 'Job Ticket', value: (row: LaborByJobDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: LaborByJobDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Approved Labor Hours', value: (row: LaborByJobDto) => hours(row.approvedLaborHours) },
    { header: 'Labor Cost', value: (row: LaborByJobDto) => money(row.laborCostTotal) },
    { header: 'Labor Billable', value: (row: LaborByJobDto) => money(row.laborBillableTotal) }
  ],
  laborEmployee: [
    { header: 'Employee', value: (row: LaborByEmployeeDto) => row.employeeName },
    { header: 'Approved Labor Hours', value: (row: LaborByEmployeeDto) => hours(row.approvedLaborHours) },
    { header: 'Labor Cost', value: (row: LaborByEmployeeDto) => money(row.laborCostTotal) },
    { header: 'Labor Billable', value: (row: LaborByEmployeeDto) => money(row.laborBillableTotal) },
    { header: 'Job Count', value: (row: LaborByEmployeeDto) => row.jobCount }
  ],
  partsJob: [
    { header: 'Job Ticket', value: (row: PartsByJobDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: PartsByJobDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Approved Part Quantity', value: (row: PartsByJobDto) => quantity(row.approvedPartQuantity) },
    { header: 'Parts Cost', value: (row: PartsByJobDto) => money(row.partsCostTotal) },
    { header: 'Parts Billable', value: (row: PartsByJobDto) => money(row.partsBillableTotal) }
  ],
  customerHistory: [
    { header: 'Job Ticket', value: (row: ReportServiceHistoryItemDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: ReportServiceHistoryItemDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Equipment', value: (row: ReportServiceHistoryItemDto) => row.equipment ?? '', render: (row) => managerListLink('/manage/equipment', row.equipment) },
    { header: 'Title', value: (row: ReportServiceHistoryItemDto) => row.title },
    { header: 'Job Status', value: (row: ReportServiceHistoryItemDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Created', value: (row: ReportServiceHistoryItemDto) => dateOnly(row.createdAtUtc) },
    { header: 'Completed', value: (row: ReportServiceHistoryItemDto) => dateOnly(row.completedAtUtc) }
  ],
  equipmentHistory: [
    { header: 'Job Ticket', value: (row: ReportServiceHistoryItemDto) => row.jobTicketNumber, render: (row) => jobLink(row.jobTicketId, row.jobTicketNumber) },
    { header: 'Customer', value: (row: ReportServiceHistoryItemDto) => row.customer, render: (row) => managerListLink('/manage/customers', row.customer) },
    { header: 'Equipment', value: (row: ReportServiceHistoryItemDto) => row.equipment ?? '', render: (row) => managerListLink('/manage/equipment', row.equipment) },
    { header: 'Title', value: (row: ReportServiceHistoryItemDto) => row.title },
    { header: 'Job Status', value: (row: ReportServiceHistoryItemDto) => getJobStatusLabel(row.jobStatus) },
    { header: 'Created', value: (row: ReportServiceHistoryItemDto) => dateOnly(row.createdAtUtc) },
    { header: 'Completed', value: (row: ReportServiceHistoryItemDto) => dateOnly(row.completedAtUtc) }
  ]
}

const reportModes: ReportMode[] = ['invoiceReady', 'jobCost', 'jobsReady', 'laborJob', 'laborEmployee', 'partsJob', 'customerHistory', 'equipmentHistory']

const userMessageForReportError = (requestError: unknown) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return 'The report filters could not be applied. Check IDs, dates, and status values, then try again.'
    if (requestError.status === 401 || requestError.status === 403) return 'You do not have permission to run manager reports.'
    if (requestError.status === 404) return 'No report source was found for the selected ID.'
    if (requestError.status >= 500) return 'The server could not generate this report right now. Please try again later.'
  }

  return 'Unable to load report data.'
}

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportQueryFilters>({ offset: 0, limit: 50 })
  const [customerId, setCustomerId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [jobId, setJobId] = useState('')
  const [rows, setRows] = useState<ReportRow[]>([])
  const [mode, setMode] = useState<ReportMode | null>(null)
  const [loadingMode, setLoadingMode] = useState<ReportMode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apply = async (nextMode: ReportMode) => {
    if ((nextMode === 'invoiceReady' || nextMode === 'jobCost') && !jobId.trim()) {
      setError('Enter a job ticket id before running this report.')
      return
    }

    if (nextMode === 'customerHistory' && !customerId.trim()) {
      setError('Enter a customer id before running customer service history.')
      return
    }

    if (nextMode === 'equipmentHistory' && !equipmentId.trim()) {
      setError('Enter an equipment id before running equipment service history.')
      return
    }

    try {
      setError(null)
      setLoadingMode(nextMode)
      setRows([])
      setMode(nextMode)

      const data = nextMode === 'invoiceReady' ? [await reportsApi.getInvoiceReadySummary(jobId.trim())]
        : nextMode === 'jobsReady' ? await reportsApi.getJobsReadyToInvoice(filters)
        : nextMode === 'laborJob' ? await reportsApi.getLaborByJob(filters)
        : nextMode === 'laborEmployee' ? await reportsApi.getLaborByEmployee(filters)
        : nextMode === 'partsJob' ? await reportsApi.getPartsByJob(filters)
        : nextMode === 'jobCost' ? [await reportsApi.getCostSummary(jobId.trim())]
        : nextMode === 'customerHistory' ? await reportsApi.getCustomerHistory(customerId.trim(), filters)
        : await reportsApi.getEquipmentHistory(equipmentId.trim(), filters)

      setRows(data as ReportRow[])
    } catch (requestError) {
      setError(userMessageForReportError(requestError))
    } finally {
      setLoadingMode(null)
    }
  }

  const columns = mode ? columnsByMode[mode] : []
  const title = mode ? reportTitleMap[mode] : ''
  const csv = useMemo(() => toCsv(rows, columns), [rows, columns])
  const csvHref = useMemo(() => csvDataUri(csv), [csv])
  const hasRows = rows.length > 0

  return <section className="card stack"><h2>Reports</h2><p className="muted">Manager/Admin report hub for invoice readiness, job costs, labor, parts, customer history, and equipment history.</p><p className="muted">Labor totals use time-entry labor-rate snapshots first. Legacy entries with null snapshots fall back to the documented employee-rate behavior.</p><Errorable error={error} /><div className="report-grid" aria-label="Available reports">{reportModes.map((reportMode) => <article className="report-card" key={reportMode}><h3>{reportTitleMap[reportMode]}</h3><p className="muted">{reportDescriptions[reportMode]}</p><button type="button" onClick={() => apply(reportMode)} disabled={loadingMode !== null}>{loadingMode === reportMode ? 'Loading…' : `Run ${reportTitleMap[reportMode]}`}</button></article>)}</div><article className="card stack"><h3>Supported filters</h3><p className="muted">Shared report endpoints support date range, customer, billing party, service location, employee, job status, invoice status, offset, and limit. Invoice-ready and job cost summaries use the selected job ticket id. Customer and equipment history require their source IDs.</p><div className="report-filters"><label>From date<input aria-label="From date" type="date" value={filters.dateFromUtc?.slice(0, 10) ?? ''} onChange={(e) => setFilters({ ...filters, dateFromUtc: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })} /></label><label>To date<input aria-label="To date" type="date" value={filters.dateToUtc?.slice(0, 10) ?? ''} onChange={(e) => setFilters({ ...filters, dateToUtc: e.target.value ? `${e.target.value}T23:59:59Z` : undefined })} /></label><label>Customer id<input aria-label="Customer id" placeholder="Customer id" value={filters.customerId ?? ''} onChange={(e) => setFilters({ ...filters, customerId: e.target.value || undefined })} /></label><label>Billing customer id<input aria-label="Billing customer id" placeholder="Billing customer id" value={filters.billingPartyCustomerId ?? ''} onChange={(e) => setFilters({ ...filters, billingPartyCustomerId: e.target.value || undefined })} /></label><label>Service location id<input aria-label="Service location id" placeholder="Service location id" value={filters.serviceLocationId ?? ''} onChange={(e) => setFilters({ ...filters, serviceLocationId: e.target.value || undefined })} /></label><label>Employee id<input aria-label="Employee id" placeholder="Employee id" value={filters.employeeId ?? ''} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value || undefined })} /></label><label>Job status<select aria-label="Job status" value={filters.jobStatus ?? ''} onChange={(e) => setFilters({ ...filters, jobStatus: e.target.value ? Number(e.target.value) : undefined })}><option value="">Any job status</option><option value="7">Completed</option><option value="9">Invoiced</option><option value="10">Reviewed</option></select></label><label>Invoice status<select aria-label="Invoice status" value={filters.invoiceStatus ?? ''} onChange={(e) => setFilters({ ...filters, invoiceStatus: e.target.value ? Number(e.target.value) : undefined })}><option value="">Any invoice status</option><option value="1">Not Ready</option><option value="2">Ready</option><option value="3">Drafted</option><option value="4">Sent</option><option value="5">Paid</option><option value="6">Void</option></select></label><label>Offset<input aria-label="Offset" type="number" min={0} value={filters.offset ?? 0} onChange={(e) => setFilters({ ...filters, offset: Number(e.target.value) || 0 })} /></label><label>Limit<input aria-label="Limit" type="number" min={1} value={filters.limit ?? 50} onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) || 50 })} /></label></div><div className="report-filters"><label>Job ticket id<input aria-label="Job ticket id" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id" /></label><label>Customer history id<input aria-label="Customer history id" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer id for service history" /></label><label>Equipment history id<input aria-label="Equipment history id" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} placeholder="Equipment id for service history" /></label></div></article><article className="card stack" aria-live="polite"><div className="report-results-heading"><div><h3>{title || 'Select a report'}</h3><p className="muted">{mode ? `${rows.length} visible row${rows.length === 1 ? '' : 's'}` : 'Run a report from the hub to load export-friendly rows.'}</p></div>{hasRows ? <a className="button-link" href={csvHref} download={`report-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`}>Export CSV</a> : null}</div>{loadingMode ? <p className="muted">Loading {reportTitleMap[loadingMode]}…</p> : null}{mode && !loadingMode && !hasRows && !error ? <p className="muted">No rows match the current report and filters.</p> : null}{hasRows ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.header}>{column.header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column.header}>{column.render ? column.render(row as never) : column.value(row as never)}</td>)}</tr>)}</tbody></table></div> : null}</article></section>
}

type UserRole = 'Employee' | 'Manager' | 'Admin'

const userRoles: UserRole[] = ['Employee', 'Manager', 'Admin']

const emptyUserDraft = (): CreateUserDto => ({
  userName: '',
  email: '',
  firstName: '',
  lastName: '',
  role: 'Employee',
  password: ''
})

const userDisplayName = (user: UserDto) => `${user.firstName} ${user.lastName}`.trim() || user.userName || 'Unnamed user'
const statusLabel = (user: UserDto) => user.isArchived || user.status !== 1 ? 'Inactive' : 'Active'

const userRequestErrorMessage = (requestError: unknown, fallback: string) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return requestError.message
    if (requestError.status === 401 || requestError.status === 403) return 'Only Admin users can manage user accounts.'
    if (requestError.status === 404) return 'The selected user could not be found. Refresh the list and try again.'
    if (requestError.status >= 500) return 'The server could not complete the user-management request right now.'
    return requestError.message
  }

  return fallback
}

export function UsersPage() {
  const [items, setItems] = useState<UserDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editing, setEditing] = useState<UserDto | null>(null)
  const [passwordByUserId, setPasswordByUserId] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<CreateUserDto>(emptyUserDraft)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      setIsLoading(true)
      setItems(await usersApi.list())
    } catch (requestError) {
      setError(userRequestErrorMessage(requestError, 'Unable to load users.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const validateDraft = () => {
    if (!draft.userName.trim()) return 'Username is required.'
    if (!draft.firstName.trim()) return 'First name is required.'
    if (!draft.lastName.trim()) return 'Last name is required.'
    if (!userRoles.includes(draft.role as UserRole)) return 'Choose a valid role: Employee, Manager, or Admin.'
    if (!editing && !draft.password.trim()) return 'Temporary password is required when creating a user.'
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) return 'Enter a valid email address or leave email blank.'
    return null
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateDraft()
    if (validationError) {
      setError(validationError)
      setSuccess(null)
      return
    }

    try {
      setError(null)
      setSuccess(null)
      setIsSaving(true)
      const payload = {
        userName: draft.userName.trim(),
        email: draft.email?.trim() || null,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        role: draft.role
      }

      if (editing) {
        if (editing.role !== draft.role) {
          const confirmed = window.confirm(`Change ${userDisplayName(editing)} from ${editing.role} to ${draft.role}? Role changes affect access immediately.`)
          if (!confirmed) return
        }

        await usersApi.update(editing.id, payload as UpdateUserDto)
        setSuccess(`${payload.firstName} ${payload.lastName} was updated.`)
      } else {
        await usersApi.create({ ...payload, password: draft.password } as CreateUserDto)
        setSuccess(`${payload.firstName} ${payload.lastName} was created.`)
      }

      setEditing(null)
      setDraft(emptyUserDraft())
      await load()
    } catch (requestError) {
      setError(userRequestErrorMessage(requestError, editing ? 'Unable to update user.' : 'Unable to create user.'))
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (user: UserDto) => {
    setEditing(user)
    setError(null)
    setSuccess(null)
    setDraft({
      userName: user.userName ?? '',
      email: user.email ?? '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: ''
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setDraft(emptyUserDraft())
    setError(null)
  }

  const archiveUser = async (user: UserDto) => {
    const confirmed = window.confirm(`Deactivate ${userDisplayName(user)}? They will lose active access after this change.`)
    if (!confirmed) return

    try {
      setError(null)
      setSuccess(null)
      setBusyUserId(user.id)
      await usersApi.archive(user.id)
      setSuccess(`${userDisplayName(user)} was deactivated.`)
      await load()
    } catch (requestError) {
      setError(userRequestErrorMessage(requestError, 'Unable to deactivate user.'))
    } finally {
      setBusyUserId(null)
    }
  }

  const resetPassword = async (user: UserDto) => {
    const newPassword = passwordByUserId[user.id]?.trim() ?? ''
    if (!newPassword) {
      setError('New password is required before resetting a password.')
      setSuccess(null)
      return
    }

    const confirmed = window.confirm(`Reset password for ${userDisplayName(user)}? Share the new temporary password only through an approved secure channel.`)
    if (!confirmed) return

    try {
      setError(null)
      setSuccess(null)
      setBusyUserId(user.id)
      await usersApi.resetPassword(user.id, { newPassword })
      setPasswordByUserId((prev) => ({ ...prev, [user.id]: '' }))
      setSuccess(`Password was reset for ${userDisplayName(user)}.`)
    } catch (requestError) {
      setError(userRequestErrorMessage(requestError, 'Unable to reset password.'))
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <section className="stack">
      <article className="card stack">
        <div>
          <p className="muted"><Link to="/manage">Manager/Admin Console</Link> / User Management</p>
          <h2>User Management</h2>
          <p className="muted">Admin-only controls for account access, roles, deactivation, and password reset.</p>
        </div>
        <Errorable error={error} />
        {success ? <p className="success">{success}</p> : null}
        <form onSubmit={save} className="stack" aria-label={editing ? 'Edit user' : 'Create user'}>
          <div className="form-grid">
            <label>Username<input aria-label="Username" value={draft.userName} onChange={(e) => setDraft({ ...draft, userName: e.target.value })} /></label>
            <label>Email<input aria-label="Email" type="email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="optional" /></label>
            <label>First name<input aria-label="First name" value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label>
            <label>Last name<input aria-label="Last name" value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label>
            <label>Role<select aria-label="Role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>{userRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
            {editing ? <p className="muted role-warning">Role changes are confirmed before save because they change route access immediately.</p> : <label>Temporary password<input aria-label="Temporary password" type="password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} autoComplete="new-password" /></label>}
          </div>
          <div className="row form-actions">
            <button type="submit" disabled={isSaving}>{isSaving ? 'Saving user…' : editing ? 'Save user changes' : 'Create user'}</button>
            {editing ? <button type="button" className="secondary-button" onClick={cancelEdit} disabled={isSaving}>Cancel edit</button> : null}
          </div>
        </form>
      </article>

      <article className="card stack" aria-live="polite">
        <div className="report-results-heading">
          <div>
            <h3>Users</h3>
            <p className="muted">{isLoading ? 'Loading user accounts…' : `${items.length} account${items.length === 1 ? '' : 's'} visible`}</p>
          </div>
        </div>
        {isLoading ? <p className="muted">Loading user accounts…</p> : null}
        {!isLoading && items.length === 0 && !error ? <p className="muted">No users have been created yet. Create the first user above.</p> : null}
        {items.length > 0 ? <div className="table-scroll"><table><thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((user) => {
          const busy = busyUserId === user.id
          const inactive = statusLabel(user) === 'Inactive'
          return <tr key={user.id}><td>{userDisplayName(user)}</td><td>{user.userName ?? '—'}</td><td>{user.email ?? '—'}</td><td><span className="status-pill">{user.role}</span></td><td><span className={inactive ? 'status-pill inactive' : 'status-pill active'}>{statusLabel(user)}</span></td><td><div className="table-actions"><button type="button" onClick={() => startEdit(user)} disabled={busy}>Edit</button><button type="button" className="danger-button" onClick={() => archiveUser(user)} disabled={busy || inactive}>{busy ? 'Working…' : inactive ? 'Deactivated' : 'Deactivate'}</button><label className="sr-label">New password for {userDisplayName(user)}<input aria-label={`New password for ${userDisplayName(user)}`} type="password" placeholder="New temporary password" value={passwordByUserId[user.id] ?? ''} onChange={(e) => setPasswordByUserId((prev) => ({ ...prev, [user.id]: e.target.value }))} autoComplete="new-password" disabled={busy} /></label><button type="button" className="secondary-button" onClick={() => resetPassword(user)} disabled={busy}>{busy ? 'Working…' : 'Reset password'}</button></div></td></tr>
        })}</tbody></table></div> : null}
      </article>
    </section>
  )
}

export function UnauthorizedPage() {
  return (
    <section className="card">
      <h2>Access Denied</h2>
      <p className="muted">Your account does not have permission for this route.</p>
      <p><Link to="/">Go to home</Link></p>
    </section>
  )
}
