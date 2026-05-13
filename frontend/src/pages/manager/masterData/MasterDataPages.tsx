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

