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
    if (!hasRequiredText(draft.name)) return setError('Customer name is required.')
    try {
      setError(null)
      if (editId) await masterDataApi.updateCustomer(editId, draft)
      else await masterDataApi.createCustomer(draft)
      setDraft({ name: '' }); setEditId(null); await load()
    } catch (requestError) {
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save customer.'))
    }
  }
  return <section className="card stack"><h2>Customers</h2><Errorable error={error} /><form onSubmit={save} className="stack" aria-label="customer form"><div className="row"><label>Name<input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label>Account number<input placeholder="Account number" value={draft.accountNumber ?? ''} onChange={(e) => setDraft({ ...draft, accountNumber: e.target.value })} /></label></div><div className="row"><label>Contact name<input placeholder="Contact name" value={draft.contactName ?? ''} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} /></label><label>Email<input placeholder="Email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label><label>Phone<input placeholder="Phone" value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label></div><button type="submit">{editId ? 'Save Customer' : 'Create Customer'}</button></form><MasterDataFilters label="customers" search={search} searchPlaceholder="Search by name, account, contact, email, or phone" archiveFilter={archiveFilter} onSearchChange={setSearch} onArchiveFilterChange={setArchiveFilter} onReset={() => { setSearch(''); setArchiveFilter('all') }} /><MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="customers" /><MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="customers" /><ul className="master-data-list">{filteredItems.map((x) => <MasterDataItem key={x.id} title={x.name} statusArchived={x.isArchived} meta={[`Account: ${x.accountNumber ?? 'No account'}`, x.contactName ? `Contact: ${x.contactName}` : null, x.email ? `Email: ${x.email}` : null, x.phone ? `Phone: ${x.phone}` : null]} actions={<><button type="button" onClick={() => { setDraft({ name: x.name, accountNumber: x.accountNumber, contactName: x.contactName, email: x.email, phone: x.phone }); setEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveCustomer(x.id); else await masterDataApi.archiveCustomer(x.id); await load() } catch { setError('Unable to update customer archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></section>
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
    if (!hasRequiredTexts(draft.companyName, draft.locationName, draft.addressLine1, draft.city, draft.state, draft.postalCode, draft.country)) return setError('All address fields are required.')
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
    if (!draft.customerId || !draft.serviceLocationId || !hasRequiredText(draft.name)) return setError('Customer, location, and equipment name are required.')
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
  return <section className="card stack"><h2>Equipment</h2><Errorable error={error} /><form onSubmit={save} className="stack" aria-label="equipment form"><div className="row"><label>Primary customer<select value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}><option value="">Customer</option>{customers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Service location<select value={draft.serviceLocationId} onChange={(e) => setDraft({ ...draft, serviceLocationId: e.target.value })}><option value="">Service location</option>{locations.map((x) => <option key={x.id} value={x.id}>{x.locationName}</option>)}</select></label></div><div className="row"><label>Owner customer<select value={draft.ownerCustomerId ?? ''} onChange={(e) => setDraft({ ...draft, ownerCustomerId: e.target.value || null })}><option value="">Same as customer</option>{customers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Billing customer<select value={draft.responsibleBillingCustomerId ?? ''} onChange={(e) => setDraft({ ...draft, responsibleBillingCustomerId: e.target.value || null })}><option value="">No separate billing customer</option>{customers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div><div className="row"><label>Equipment name<input placeholder="Equipment name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label>Equipment number<input placeholder="Equipment number" value={draft.equipmentNumber ?? ''} onChange={(e) => setDraft({ ...draft, equipmentNumber: e.target.value })} /></label><label>Unit number<input placeholder="Unit number" value={draft.unitNumber ?? ''} onChange={(e) => setDraft({ ...draft, unitNumber: e.target.value })} /></label></div><div className="row"><label>Manufacturer<input placeholder="Manufacturer" value={draft.manufacturer ?? ''} onChange={(e) => setDraft({ ...draft, manufacturer: e.target.value })} /></label><label>Model number<input placeholder="Model number" value={draft.modelNumber ?? ''} onChange={(e) => setDraft({ ...draft, modelNumber: e.target.value })} /></label><label>Serial number<input placeholder="Serial number" value={draft.serialNumber ?? ''} onChange={(e) => setDraft({ ...draft, serialNumber: e.target.value })} /></label></div><div className="row"><label>Equipment type<input placeholder="Equipment type" value={draft.equipmentType ?? ''} onChange={(e) => setDraft({ ...draft, equipmentType: e.target.value })} /></label><label>Year<input type="number" placeholder="Year" value={draft.year ?? ''} onChange={(e) => setDraft({ ...draft, year: e.target.value ? Number(e.target.value) : null })} /></label></div><button type="submit">{editId ? 'Save Equipment' : 'Create Equipment'}</button></form><MasterDataFilters label="equipment" search={search} searchPlaceholder="Search by name, unit, serial, model, customer, or location" archiveFilter={archiveFilter} onSearchChange={setSearch} onArchiveFilterChange={setArchiveFilter} onReset={() => { setSearch(''); setArchiveFilter('all'); setCustomerFilter('') }}><label>Customer<select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}><option value="">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label></MasterDataFilters><MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="equipment records" /><MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="equipment records" /><ul className="master-data-list">{filteredItems.map((x) => <MasterDataItem key={x.id} title={x.name} statusArchived={x.isArchived} meta={[`Owner: ${customerNameById(customers, x.ownerCustomerId ?? x.customerId) || x.ownerCustomerId || x.customerId}`, `Billing: ${customerNameById(customers, x.responsibleBillingCustomerId) || x.responsibleBillingCustomerId || 'n/a'}`, `Location: ${locationNameById(locations, x.serviceLocationId) || x.serviceLocationId}`, x.equipmentNumber ? `Equipment #: ${x.equipmentNumber}` : null, x.unitNumber ? `Unit: ${x.unitNumber}` : null, x.manufacturer || x.modelNumber ? `Model: ${[x.manufacturer, x.modelNumber].filter(Boolean).join(' ')}` : null, x.serialNumber ? `Serial: ${x.serialNumber}` : null, x.equipmentType ? `Type: ${x.equipmentType}` : null, x.year ? `Year: ${x.year}` : null]} actions={<><button type="button" onClick={() => { setDraft(x); setEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveEquipment(x.id); else await masterDataApi.archiveEquipment(x.id); await load() } catch { setError('Unable to update equipment archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></section>
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
    if (!draft.partCategoryId || !hasRequiredText(draft.partNumber) || !hasRequiredText(draft.name)) return setError('Category, part number, and name are required.')
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

  return <section className="stack"><article className="card stack"><h2>Parts</h2><Errorable error={error} /><form onSubmit={save} className="stack" aria-label="part form"><div className="row"><label>Part number<input placeholder="Part Number" value={draft.partNumber} onChange={(e) => setDraft({ ...draft, partNumber: e.target.value })} /></label><label>Name<input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label></div><label>Description<input placeholder="Description" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label><div className="row"><label>Part category<select value={draft.partCategoryId} onChange={(e) => setDraft({ ...draft, partCategoryId: e.target.value })}><option value="">Category</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Preferred vendor<select value={draft.vendorId ?? ''} onChange={(e) => setDraft({ ...draft, vendorId: e.target.value || null })}><option value="">Vendor</option>{vendors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div><div className="row"><label>Unit cost<input type="number" placeholder="Cost" value={draft.unitCost} onChange={(e) => setDraft({ ...draft, unitCost: Number(e.target.value) })} /></label><label>Billable price<input type="number" placeholder="Price" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: Number(e.target.value) })} /></label><label>Quantity on hand<input type="number" placeholder="Quantity on hand" value={draft.quantityOnHand} onChange={(e) => setDraft({ ...draft, quantityOnHand: Number(e.target.value) })} /></label><label>Reorder threshold<input type="number" placeholder="Reorder threshold" value={draft.reorderThreshold} onChange={(e) => setDraft({ ...draft, reorderThreshold: Number(e.target.value) })} /></label></div><button type="submit">{editId ? 'Save Part' : 'Create Part'}</button></form><MasterDataFilters label="parts" search={partSearch} searchPlaceholder="Search by part number, name, category, vendor, or description" archiveFilter={partArchiveFilter} onSearchChange={setPartSearch} onArchiveFilterChange={setPartArchiveFilter} onReset={() => { setPartSearch(''); setPartArchiveFilter('all'); setPartCategoryFilter(''); setPartVendorFilter('') }}><label>Category<select value={partCategoryFilter} onChange={(event) => setPartCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Vendor<select value={partVendorFilter} onChange={(event) => setPartVendorFilter(event.target.value)}><option value="">All vendors</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label></MasterDataFilters><MasterDataListSummary loading={isLoading} totalCount={parts.length} filteredItems={filteredParts} noun="parts" /><MasterDataListState loading={isLoading} totalCount={parts.length} filteredCount={filteredParts.length} noun="parts" /><ul className="master-data-list">{filteredParts.map((x) => <MasterDataItem key={x.id} title={`${x.partNumber} - ${x.name}`} statusArchived={x.isArchived} meta={[`Category: ${categoryNameById(categories, x.partCategoryId) || 'No category'}`, `Vendor: ${vendorNameById(vendors, x.vendorId) || 'No vendor'}`, x.description ? `Description: ${x.description}` : null, `Cost: ${x.unitCost}`, `Price: ${x.unitPrice}`, `On hand: ${x.quantityOnHand ?? 0}`, `Reorder: ${x.reorderThreshold ?? 0}`]} actions={<><button type="button" onClick={() => { setDraft(x); setEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchivePart(x.id); else await masterDataApi.archivePart(x.id); await load() } catch { setError('Unable to update archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></article><article className="card stack"><h3>Vendors</h3><form className="stack" aria-label="vendor form" onSubmit={async (e) => { e.preventDefault(); if (!hasRequiredText(vendorDraft.name)) return setError('Vendor name is required.'); try { setError(null); if (vendorEditId) await masterDataApi.updateVendor(vendorEditId, vendorDraft); else await masterDataApi.createVendor(vendorDraft); setVendorDraft({ name: '' }); setVendorEditId(null); await load() } catch (requestError) { setError(masterDataRequestErrorMessage(requestError, 'Unable to save vendor.')) } }}><div className="row"><label>Vendor name<input placeholder="Vendor name" value={vendorDraft.name} onChange={(e) => setVendorDraft({ ...vendorDraft, name: e.target.value })} /></label><label>Account number<input placeholder="Vendor account number" value={vendorDraft.accountNumber ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, accountNumber: e.target.value })} /></label></div><div className="row"><label>Contact name<input placeholder="Vendor contact name" value={vendorDraft.contactName ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, contactName: e.target.value })} /></label><label>Email<input placeholder="Vendor email" value={vendorDraft.email ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, email: e.target.value })} /></label><label>Phone<input placeholder="Vendor phone" value={vendorDraft.phone ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, phone: e.target.value })} /></label></div><button type="submit">{vendorEditId ? 'Save Vendor' : 'Create Vendor'}</button></form><MasterDataFilters label="vendors" search={vendorSearch} searchPlaceholder="Search by name, account, contact, email, or phone" archiveFilter={vendorArchiveFilter} onSearchChange={setVendorSearch} onArchiveFilterChange={setVendorArchiveFilter} onReset={() => { setVendorSearch(''); setVendorArchiveFilter('all') }} /><MasterDataListSummary loading={isLoading} totalCount={vendors.length} filteredItems={filteredVendors} noun="vendors" /><MasterDataListState loading={isLoading} totalCount={vendors.length} filteredCount={filteredVendors.length} noun="vendors" /><ul className="master-data-list">{filteredVendors.map((x) => <MasterDataItem key={x.id} title={x.name} statusArchived={x.isArchived} meta={[x.accountNumber ? `Account: ${x.accountNumber}` : 'Account: No account', x.contactName ? `Contact: ${x.contactName}` : null, x.email ? `Email: ${x.email}` : null, x.phone ? `Phone: ${x.phone}` : null]} actions={<><button type="button" onClick={() => { setVendorDraft(x); setVendorEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveVendor(x.id); else await masterDataApi.archiveVendor(x.id); await load() } catch { setError('Unable to update archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></article><article className="card stack"><h3>Part Categories</h3><form className="stack" aria-label="part category form" onSubmit={async (e) => { e.preventDefault(); if (!hasRequiredText(categoryDraft.name)) return setError('Part category name is required.'); try { setError(null); if (categoryEditId) await masterDataApi.updatePartCategory(categoryEditId, categoryDraft); else await masterDataApi.createPartCategory(categoryDraft); setCategoryDraft({ name: '', description: '' }); setCategoryEditId(null); await load() } catch (requestError) { setError(masterDataRequestErrorMessage(requestError, 'Unable to save part category.')) } }}><div className="row"><label>Category name<input placeholder="Category name" value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} /></label><label>Description<input placeholder="Category description" value={categoryDraft.description ?? ''} onChange={(e) => setCategoryDraft({ ...categoryDraft, description: e.target.value })} /></label></div><button type="submit">{categoryEditId ? 'Save Category' : 'Create Category'}</button></form><MasterDataFilters label="part categories" search={categorySearch} searchPlaceholder="Search by name or description" archiveFilter={categoryArchiveFilter} onSearchChange={setCategorySearch} onArchiveFilterChange={setCategoryArchiveFilter} onReset={() => { setCategorySearch(''); setCategoryArchiveFilter('all') }} /><MasterDataListSummary loading={isLoading} totalCount={categories.length} filteredItems={filteredCategories} noun="part categories" /><MasterDataListState loading={isLoading} totalCount={categories.length} filteredCount={filteredCategories.length} noun="part categories" /><ul className="master-data-list">{filteredCategories.map((x) => <MasterDataItem key={x.id} title={x.name} statusArchived={x.isArchived} meta={[x.description ? `Description: ${x.description}` : 'Description: None']} actions={<><button type="button" onClick={() => { setCategoryDraft(x); setCategoryEditId(x.id) }}>Edit</button><button type="button" onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchivePartCategory(x.id); else await masterDataApi.archivePartCategory(x.id); await load() } catch { setError('Unable to update archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></>} />)}</ul></article></section>
}
