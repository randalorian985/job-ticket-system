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
    case 0: return 'Not Ready'
    case 1: return 'Ready'
    case 2: return 'Invoiced'
    case 3: return 'Paid'
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

  return <section className="card stack"><h2>Reports</h2><p className="muted">Manager/Admin report hub for invoice readiness, job costs, labor, parts, customer history, and equipment history.</p><p className="muted">Labor totals use time-entry labor-rate snapshots first. Legacy entries with null snapshots fall back to the documented employee-rate behavior.</p><Errorable error={error} /><div className="report-grid" aria-label="Available reports">{reportModes.map((reportMode) => <article className="report-card" key={reportMode}><h3>{reportTitleMap[reportMode]}</h3><p className="muted">{reportDescriptions[reportMode]}</p><button type="button" onClick={() => apply(reportMode)} disabled={loadingMode !== null}>{loadingMode === reportMode ? 'Loading…' : `Run ${reportTitleMap[reportMode]}`}</button></article>)}</div><article className="card stack"><h3>Supported filters</h3><p className="muted">Shared report endpoints support date range, customer, billing party, service location, employee, job status, invoice status, offset, and limit. Invoice-ready and job cost summaries use the selected job ticket id. Customer and equipment history require their source IDs.</p><div className="report-filters"><label>From date<input aria-label="From date" type="date" value={filters.dateFromUtc?.slice(0, 10) ?? ''} onChange={(e) => setFilters({ ...filters, dateFromUtc: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })} /></label><label>To date<input aria-label="To date" type="date" value={filters.dateToUtc?.slice(0, 10) ?? ''} onChange={(e) => setFilters({ ...filters, dateToUtc: e.target.value ? `${e.target.value}T23:59:59Z` : undefined })} /></label><label>Customer id<input aria-label="Customer id" placeholder="Customer id" value={filters.customerId ?? ''} onChange={(e) => setFilters({ ...filters, customerId: e.target.value || undefined })} /></label><label>Billing customer id<input aria-label="Billing customer id" placeholder="Billing customer id" value={filters.billingPartyCustomerId ?? ''} onChange={(e) => setFilters({ ...filters, billingPartyCustomerId: e.target.value || undefined })} /></label><label>Service location id<input aria-label="Service location id" placeholder="Service location id" value={filters.serviceLocationId ?? ''} onChange={(e) => setFilters({ ...filters, serviceLocationId: e.target.value || undefined })} /></label><label>Employee id<input aria-label="Employee id" placeholder="Employee id" value={filters.employeeId ?? ''} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value || undefined })} /></label><label>Job status<select aria-label="Job status" value={filters.jobStatus ?? ''} onChange={(e) => setFilters({ ...filters, jobStatus: e.target.value ? Number(e.target.value) : undefined })}><option value="">Any job status</option><option value="7">Completed</option><option value="9">Invoiced</option><option value="10">Reviewed</option></select></label><label>Invoice status<select aria-label="Invoice status" value={filters.invoiceStatus ?? ''} onChange={(e) => setFilters({ ...filters, invoiceStatus: e.target.value ? Number(e.target.value) : undefined })}><option value="">Any invoice status</option><option value="0">Not Ready</option><option value="1">Ready</option><option value="2">Invoiced</option><option value="3">Paid</option></select></label><label>Offset<input aria-label="Offset" type="number" min={0} value={filters.offset ?? 0} onChange={(e) => setFilters({ ...filters, offset: Number(e.target.value) || 0 })} /></label><label>Limit<input aria-label="Limit" type="number" min={1} value={filters.limit ?? 50} onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) || 50 })} /></label></div><div className="report-filters"><label>Job ticket id<input aria-label="Job ticket id" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id" /></label><label>Customer history id<input aria-label="Customer history id" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer id for service history" /></label><label>Equipment history id<input aria-label="Equipment history id" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} placeholder="Equipment id for service history" /></label></div></article><article className="card stack" aria-live="polite"><div className="report-results-heading"><div><h3>{title || 'Select a report'}</h3><p className="muted">{mode ? `${rows.length} visible row${rows.length === 1 ? '' : 's'}` : 'Run a report from the hub to load export-friendly rows.'}</p></div>{hasRows ? <a className="button-link" href={csvHref} download={`report-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`}>Export CSV</a> : null}</div>{loadingMode ? <p className="muted">Loading {reportTitleMap[loadingMode]}…</p> : null}{mode && !loadingMode && !hasRows && !error ? <p className="muted">No rows match the current report and filters.</p> : null}{hasRows ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.header}>{column.header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column.header}>{column.render ? column.render(row as never) : column.value(row as never)}</td>)}</tr>)}</tbody></table></div> : null}</article></section>
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
