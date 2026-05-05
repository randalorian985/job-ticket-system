import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { reportsApi } from '../../api/reportsApi'
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
  JobTicketPartDto,
  PartCategoryDto,
  PartDto,
  ReportQueryFilters,
  ServiceLocationDto,
  TimeEntryDto,
  UpdateUserDto,
  UserDto,
  VendorDto
} from '../../types'
import { formatDate, getApprovalLabel } from './managerDisplay'

function Errorable({ error }: { error: string | null }) { return error ? <p className="error">{error}</p> : null }

export function CustomersPage() {
  const [items, setItems] = useState<CustomerDto[]>([])
  const [draft, setDraft] = useState<CreateCustomerDto>({ name: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = () => masterDataApi.listCustomers().then(setItems).catch(() => setError('Unable to load customers.'))
  useEffect(() => { load() }, [])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.name.trim()) return setError('Customer name is required.')
    if (editId) await masterDataApi.updateCustomer(editId, draft)
    else await masterDataApi.createCustomer(draft)
    setDraft({ name: '' }); setEditId(null); await load()
  }
  return <section className="card stack"><h2>Customers</h2><Errorable error={error} /><form onSubmit={save} className="row"><input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><button type="submit">{editId ? 'Save Customer' : 'Create Customer'}</button></form><ul>{items.map((x) => <li key={x.id}>{x.name} ({x.accountNumber ?? 'No account'}) <button onClick={() => { setDraft({ name: x.name, accountNumber: x.accountNumber, contactName: x.contactName, email: x.email, phone: x.phone }); setEditId(x.id) }}>Edit</button> <button onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveCustomer(x.id); else await masterDataApi.archiveCustomer(x.id); await load() } catch { setError('Unable to update customer archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></li>)}</ul></section>
}

export function ServiceLocationsPage() {
  const [items, setItems] = useState<ServiceLocationDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [draft, setDraft] = useState<CreateServiceLocationDto>({ companyName: '', locationName: '', addressLine1: '', city: '', state: '', postalCode: '', country: 'US', isActive: true })
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = () => Promise.all([masterDataApi.listServiceLocations(), masterDataApi.listCustomers()]).then(([l, c]) => { setItems(l); setCustomers(c) }).catch(() => setError('Unable to load service locations.'))
  useEffect(() => { load() }, [])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.companyName || !draft.locationName || !draft.addressLine1 || !draft.city || !draft.state || !draft.postalCode || !draft.country) return setError('All address fields are required.')
    if (editId) await masterDataApi.updateServiceLocation(editId, draft)
    else await masterDataApi.createServiceLocation(draft)
    setDraft({ companyName: '', locationName: '', addressLine1: '', city: '', state: '', postalCode: '', country: 'US', isActive: true }); setEditId(null); await load()
  }
  return <section className="card stack"><h2>Service Locations</h2><Errorable error={error} /><form onSubmit={save} className="stack"><input placeholder="Company" value={draft.companyName} onChange={(e) => setDraft({ ...draft, companyName: e.target.value })} /><input placeholder="Location Name" value={draft.locationName} onChange={(e) => setDraft({ ...draft, locationName: e.target.value })} /><input placeholder="Address" value={draft.addressLine1} onChange={(e) => setDraft({ ...draft, addressLine1: e.target.value })} /><div className="row"><input placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /><input placeholder="State" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} /></div><div className="row"><input placeholder="Postal" value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} /><input placeholder="Country" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></div><select value={draft.customerId ?? ''} onChange={(e) => setDraft({ ...draft, customerId: e.target.value || null })}><option value="">No customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label><input type="checkbox" checked={draft.isActive ?? true} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Active</label><button type="submit">{editId ? 'Save Location' : 'Create Location'}</button></form><ul>{items.map((x) => <li key={x.id}>{x.locationName} · {x.companyName} · {x.isActive ? 'Active' : 'Inactive'} <button onClick={() => { setDraft(x); setEditId(x.id) }}>Edit</button> <button onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveServiceLocation(x.id); else await masterDataApi.archiveServiceLocation(x.id); await load() } catch { setError('Unable to update service location archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></li>)}</ul></section>
}

export function EquipmentPage() {
  const [items, setItems] = useState<EquipmentDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [locations, setLocations] = useState<ServiceLocationDto[]>([])
  const [draft, setDraft] = useState<CreateEquipmentDto>({ customerId: '', serviceLocationId: '', ownerCustomerId: null, responsibleBillingCustomerId: null, name: '', equipmentNumber: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = () => Promise.all([masterDataApi.listEquipment(), masterDataApi.listCustomers(), masterDataApi.listServiceLocations()]).then(([equipment, customerList, locationList]) => { setItems(equipment); setCustomers(customerList); setLocations(locationList) }).catch(() => setError('Unable to load equipment.'))
  useEffect(() => { load() }, [])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.customerId || !draft.serviceLocationId || !draft.name.trim()) return setError('Customer, location, and equipment name are required.')
    if (editId) await masterDataApi.updateEquipment(editId, draft)
    else await masterDataApi.createEquipment(draft)
    setDraft({ customerId: '', serviceLocationId: '', ownerCustomerId: null, responsibleBillingCustomerId: null, name: '', equipmentNumber: '' })
    setEditId(null)
    await load()
  }
  return <section className="card stack"><h2>Equipment</h2><Errorable error={error} /><form onSubmit={save} className="stack"><div className="row"><select value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}><option value="">Customer</option>{customers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><select value={draft.serviceLocationId} onChange={(e) => setDraft({ ...draft, serviceLocationId: e.target.value })}><option value="">Service location</option>{locations.map((x) => <option key={x.id} value={x.id}>{x.locationName}</option>)}</select></div><input placeholder="Equipment name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><input placeholder="Equipment number" value={draft.equipmentNumber ?? ''} onChange={(e) => setDraft({ ...draft, equipmentNumber: e.target.value })} /><button type="submit">{editId ? 'Save Equipment' : 'Create Equipment'}</button></form><ul>{items.map((x) => <li key={x.id}>{x.name} · Owner {x.ownerCustomerId ?? x.customerId} · Billing {x.responsibleBillingCustomerId ?? 'n/a'} · Location {x.serviceLocationId} <button onClick={() => { setDraft(x); setEditId(x.id) }}>Edit</button> <button onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveEquipment(x.id); else await masterDataApi.archiveEquipment(x.id); await load() } catch { setError('Unable to update equipment archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></li>)}</ul></section>
}

export function PartsPage() {
  const [parts, setParts] = useState<PartDto[]>([])
  const [vendors, setVendors] = useState<VendorDto[]>([])
  const [categories, setCategories] = useState<PartCategoryDto[]>([])
  const [draft, setDraft] = useState<CreatePartDto>({ partCategoryId: '', partNumber: '', name: '', unitCost: 0, unitPrice: 0, quantityOnHand: 0, reorderThreshold: 0 })
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = () => Promise.all([masterDataApi.listParts(), masterDataApi.listVendors(), masterDataApi.listPartCategories()]).then(([p, v, c]) => { setParts(p); setVendors(v); setCategories(c) }).catch(() => setError('Unable to load parts, vendors, or categories.'))
  useEffect(() => { load() }, [])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.partCategoryId || !draft.partNumber || !draft.name) return setError('Category, part number, and name are required.')
    if (editId) await masterDataApi.updatePart(editId, draft)
    else await masterDataApi.createPart(draft)
    setDraft({ partCategoryId: '', partNumber: '', name: '', unitCost: 0, unitPrice: 0, quantityOnHand: 0, reorderThreshold: 0 }); setEditId(null); await load()
  }
  const [vendorDraft, setVendorDraft] = useState<CreateVendorDto>({ name: '' })
  const [vendorEditId, setVendorEditId] = useState<string | null>(null)
  const [categoryDraft, setCategoryDraft] = useState<CreatePartCategoryDto>({ name: '', description: '' })
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null)

  return <section className="stack"><article className="card stack"><h2>Parts</h2><Errorable error={error} /><form onSubmit={save} className="stack"><div className="row"><input placeholder="Part Number" value={draft.partNumber} onChange={(e) => setDraft({ ...draft, partNumber: e.target.value })} /><input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div><div className="row"><select value={draft.partCategoryId} onChange={(e) => setDraft({ ...draft, partCategoryId: e.target.value })}><option value="">Category</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><select value={draft.vendorId ?? ''} onChange={(e) => setDraft({ ...draft, vendorId: e.target.value || null })}><option value="">Vendor</option>{vendors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div className="row"><input type="number" placeholder="Cost" value={draft.unitCost} onChange={(e) => setDraft({ ...draft, unitCost: Number(e.target.value) })} /><input type="number" placeholder="Price" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: Number(e.target.value) })} /></div><button type="submit">{editId ? 'Save Part' : 'Create Part'}</button></form><ul>{parts.map((x) => <li key={x.id}>{x.partNumber} - {x.name} · Cost {x.unitCost} · Price {x.unitPrice} <button onClick={() => { setDraft(x); setEditId(x.id) }}>Edit</button> <button onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchivePart(x.id); else await masterDataApi.archivePart(x.id); await load() } catch { setError('Unable to update archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></li>)}</ul></article><article className="card stack"><h3>Vendors</h3><form className="row" onSubmit={async (e) => { e.preventDefault(); if (!vendorDraft.name.trim()) return setError('Vendor name is required.'); if (vendorEditId) await masterDataApi.updateVendor(vendorEditId, vendorDraft); else await masterDataApi.createVendor(vendorDraft); setVendorDraft({ name: '' }); setVendorEditId(null); await load() }}><input placeholder="Vendor name" value={vendorDraft.name} onChange={(e) => setVendorDraft({ ...vendorDraft, name: e.target.value })} /><button type="submit">{vendorEditId ? 'Save Vendor' : 'Create Vendor'}</button></form><ul>{vendors.map((x) => <li key={x.id}>{x.name} <button onClick={() => { setVendorDraft(x); setVendorEditId(x.id) }}>Edit</button> <button onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchiveVendor(x.id); else await masterDataApi.archiveVendor(x.id); await load() } catch { setError('Unable to update archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></li>)}</ul></article><article className="card stack"><h3>Part Categories</h3><form className="row" onSubmit={async (e) => { e.preventDefault(); if (!categoryDraft.name.trim()) return setError('Part category name is required.'); if (categoryEditId) await masterDataApi.updatePartCategory(categoryEditId, categoryDraft); else await masterDataApi.createPartCategory(categoryDraft); setCategoryDraft({ name: '', description: '' }); setCategoryEditId(null); await load() }}><input placeholder="Category name" value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} /><button type="submit">{categoryEditId ? 'Save Category' : 'Create Category'}</button></form><ul>{categories.map((x) => <li key={x.id}>{x.name} <button onClick={() => { setCategoryDraft(x); setCategoryEditId(x.id) }}>Edit</button> <button onClick={async () => { try { if (x.isArchived) await masterDataApi.unarchivePartCategory(x.id); else await masterDataApi.archivePartCategory(x.id); await load() } catch { setError('Unable to update archive state.') } }}>{x.isArchived ? 'Unarchive' : 'Archive'}</button></li>)}</ul></article></section>
}

export function TimeApprovalPage() { const [jobId, setJobId] = useState(''); const [entries, setEntries] = useState<TimeEntryDto[]>([]); const [error, setError] = useState<string | null>(null); const load = () => jobId ? timeEntriesApi.listByJob(jobId).then(setEntries).catch(() => setError('Unable to load time entries for job.')) : Promise.resolve(); const approve = async (id: string) => { await timeEntriesApi.approve(id, { approvedByUserId: '' }); await load() }; const reject = async (id: string) => { await timeEntriesApi.reject(id, { rejectedByUserId: '', reason: 'Rejected in manager review' }); await load() }; return <section className="card stack"><h2>Time Approval</h2><p className="muted">Enter a job ticket id to review and action time entries.</p><input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id" /><button onClick={() => load()}>Load Time Entries</button><Errorable error={error} /><ul>{entries.map((x) => <li key={x.id}>{x.employeeId} · {formatDate(x.startedAtUtc)} - {formatDate(x.endedAtUtc)} · {x.laborHours}h · {getApprovalLabel(x.approvalStatus)} <button onClick={() => approve(x.id)}>Approve</button> <button onClick={() => reject(x.id)}>Reject</button></li>)}</ul></section> }

export function PartsApprovalPage() { const [jobId, setJobId] = useState(''); const [parts, setParts] = useState<JobTicketPartDto[]>([]); const [error, setError] = useState<string | null>(null); const load = () => jobId ? jobTicketsApi.listParts(jobId).then(setParts).catch(() => setError('Unable to load job parts for approval.')) : Promise.resolve(); const approve = async (id: string) => { await jobTicketsApi.approvePart(jobId, id); await load() }; const reject = async (id: string) => { await jobTicketsApi.rejectPart(jobId, id, { rejectionReason: 'Rejected in manager review' }); await load() }; return <section className="card stack"><h2>Parts Approval</h2><input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id" /><button onClick={() => load()}>Load Job Parts</button><Errorable error={error} /><ul>{parts.map((x) => <li key={x.id}>Part {x.partId} · Qty {x.quantity} · Added by {x.addedByEmployeeId ?? 'n/a'} · Cost {x.unitCostSnapshot} · Sale {x.salePriceSnapshot} · {getApprovalLabel(x.approvalStatus)} <button onClick={() => approve(x.id)}>Approve</button> <button onClick={() => reject(x.id)}>Reject</button></li>)}</ul></section> }

const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  return [headers.join(','), ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','))].join('\n')
}

const reportTitleMap: Record<string, string> = {
  jobsReady: 'Jobs Ready to Invoice',
  laborJob: 'Labor by Job',
  laborEmployee: 'Labor by Employee',
  partsJob: 'Parts by Job',
  jobCost: 'Job Cost Summary',
  customerHistory: 'Customer Service History',
  equipmentHistory: 'Equipment Service History'
}

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportQueryFilters>({ offset: 0, limit: 50, invoiceStatus: 0 })
  const [customerId, setCustomerId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [jobId, setJobId] = useState('')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const apply = async (mode: string) => {
    try {
      setError(null)
      const data = mode === 'jobsReady' ? await reportsApi.getJobsReadyToInvoice(filters)
        : mode === 'laborJob' ? await reportsApi.getLaborByJob(filters)
        : mode === 'laborEmployee' ? await reportsApi.getLaborByEmployee(filters)
        : mode === 'partsJob' ? await reportsApi.getPartsByJob(filters)
        : mode === 'jobCost' ? [await reportsApi.getCostSummary(jobId)]
        : mode === 'customerHistory' ? await reportsApi.getCustomerHistory(customerId, filters)
        : await reportsApi.getEquipmentHistory(equipmentId, filters)

      setRows(data as Record<string, unknown>[])
      setTitle(reportTitleMap[mode] ?? mode)
    } catch (requestError) {
      if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
        setError('You do not have permission to run manager reports.')
        return
      }

      setError('Unable to load report data.')
    }
  }

  const csvHref = useMemo(() => `data:text/csv;charset=utf-8,${encodeURIComponent(toCsv(rows))}`, [rows])

  return <section className="card stack"><h2>Reports</h2><p className="muted">Labor totals use time-entry labor-rate snapshots when available. When snapshot values are null, reports fall back to the assigned employee labor rate for legacy entries.</p><Errorable error={error} /><div className="row"><input type="date" onChange={(e) => setFilters({ ...filters, dateFromUtc: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })} /><input type="date" onChange={(e) => setFilters({ ...filters, dateToUtc: e.target.value ? `${e.target.value}T23:59:59Z` : undefined })} /><input placeholder="Customer id" value={filters.customerId ?? ''} onChange={(e) => setFilters({ ...filters, customerId: e.target.value || undefined })} /><input placeholder="Billing customer id" value={filters.billingPartyCustomerId ?? ''} onChange={(e) => setFilters({ ...filters, billingPartyCustomerId: e.target.value || undefined })} /><input placeholder="Service location id" value={filters.serviceLocationId ?? ''} onChange={(e) => setFilters({ ...filters, serviceLocationId: e.target.value || undefined })} /><input placeholder="Employee id" value={filters.employeeId ?? ''} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value || undefined })} /><input placeholder="Job status #" value={filters.jobStatus ?? ''} onChange={(e) => setFilters({ ...filters, jobStatus: e.target.value ? Number(e.target.value) : undefined })} /><input placeholder="Invoice status #" value={filters.invoiceStatus ?? ''} onChange={(e) => setFilters({ ...filters, invoiceStatus: e.target.value ? Number(e.target.value) : undefined })} /></div><div className="row"><input type="number" min={0} placeholder="Offset" value={filters.offset ?? 0} onChange={(e) => setFilters({ ...filters, offset: Number(e.target.value) || 0 })} /><input type="number" min={1} placeholder="Limit" value={filters.limit ?? 50} onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) || 50 })} /></div><div className="inline-links"><button onClick={() => apply('jobsReady')}>Jobs Ready to Invoice</button><button onClick={() => apply('laborJob')}>Labor by Job</button><button onClick={() => apply('laborEmployee')}>Labor by Employee</button><button onClick={() => apply('partsJob')}>Parts by Job</button></div><input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id for cost summary" /><button onClick={() => apply('jobCost')}>Job Cost Summary</button><input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer id for service history" /><button onClick={() => apply('customerHistory')}>Customer Service History</button><input value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} placeholder="Equipment id for service history" /><button onClick={() => apply('equipmentHistory')}>Equipment Service History</button><p>{title ? `Showing ${title} (${rows.length} rows)` : ''}</p>{rows.length ? <a href={csvHref} download={`report-${title.toLowerCase().replace(/\s+/g, '-')}.csv`}>Export CSV</a> : null}<div style={{ overflowX: 'auto' }}><table><thead><tr>{rows.length ? Object.keys(rows[0]).map((key) => <th key={key}>{key}</th>) : null}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{Object.entries(row).map(([key, value]) => <td key={key}>{typeof value === 'number' ? value.toFixed(2) : String(value ?? '')}</td>)}</tr>)}</tbody></table></div></section>
}

export function UsersPage() {
  const [items, setItems] = useState<UserDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<UserDto | null>(null)
  const [passwordByUserId, setPasswordByUserId] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<CreateUserDto>({ userName: '', email: '', firstName: '', lastName: '', role: 'Employee', password: 'Temp123!' })
  const load = () => usersApi.list().then(setItems).catch(() => setError('Unable to load users.'))
  useEffect(() => { load() }, [])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      if (editing) {
        const updatePayload: UpdateUserDto = {
          userName: draft.userName,
          email: draft.email,
          firstName: draft.firstName,
          lastName: draft.lastName,
          role: draft.role
        }
        await usersApi.update(editing.id, updatePayload)
      }
      else await usersApi.create(draft)
      setEditing(null)
      setDraft({ userName: '', email: '', firstName: '', lastName: '', role: 'Employee', password: 'Temp123!' })
      await load()
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save user.')
    }
  }
  return <section className="card stack"><h2>Users (Admin only)</h2><Errorable error={error} /><form onSubmit={save} className="row"><input placeholder="Username" value={draft.userName} onChange={(e) => setDraft({ ...draft, userName: e.target.value })} /><input placeholder="First" value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /><input placeholder="Last" value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /><select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}><option>Employee</option><option>Manager</option><option>Admin</option></select>{editing ? null : <input placeholder="Password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />}<button type="submit">{editing ? 'Save User' : 'Create User'}</button></form><ul>{items.map((x) => <li key={x.id}>{x.firstName} {x.lastName} · {x.userName} · {x.role} · {x.isArchived ? 'Archived' : 'Active'} <button onClick={() => { setEditing(x); setDraft({ userName: x.userName ?? '', email: x.email ?? '', firstName: x.firstName, lastName: x.lastName, role: x.role, password: '' }) }}>Edit</button> <button onClick={async () => { await usersApi.archive(x.id); await load() }}>Archive</button> <input placeholder="new password" value={passwordByUserId[x.id] ?? ''} onChange={(e) => setPasswordByUserId((prev) => ({ ...prev, [x.id]: e.target.value }))} /> <button onClick={async () => { const password = passwordByUserId[x.id]?.trim(); if (!password) { setError('New password is required.'); return } await usersApi.resetPassword(x.id, { newPassword: password }); setPasswordByUserId((prev) => ({ ...prev, [x.id]: '' })) }}>Reset Password</button></li>)}</ul></section>
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
