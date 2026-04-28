import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { reportsApi } from '../../api/reportsApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { usersApi } from '../../api/usersApi'
import type { CustomerDto, EquipmentDto, JobTicketPartDto, PartCategoryDto, PartDto, ServiceLocationDto, TimeEntryDto, UserDto, VendorDto } from '../../types'
import { formatDate, getApprovalLabel } from './managerDisplay'

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

function Errorable({ error }: { error: string | null }) {
  return error ? <p className="error">{error}</p> : null
}

export function CustomersPage() {
  const [items, setItems] = useState<CustomerDto[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { masterDataApi.listCustomers().then(setItems).catch(() => setError('Unable to load customers.')) }, [])
  return <section className="card"><h2>Customers</h2><Errorable error={error} /><ul>{items.map((x) => <li key={x.id}>{x.name} ({x.accountNumber ?? 'No account'})</li>)}</ul></section>
}

export function ServiceLocationsPage() {
  const [items, setItems] = useState<ServiceLocationDto[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { masterDataApi.listServiceLocations().then(setItems).catch(() => setError('Unable to load service locations.')) }, [])
  return <section className="card"><h2>Service Locations</h2><Errorable error={error} /><ul>{items.map((x) => <li key={x.id}>{x.locationName} · {x.companyName} · Customer {x.customerId ?? 'n/a'}</li>)}</ul></section>
}

export function EquipmentPage() {
  const [items, setItems] = useState<EquipmentDto[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { masterDataApi.listEquipment().then(setItems).catch(() => setError('Unable to load equipment.')) }, [])
  return <section className="card"><h2>Equipment</h2><Errorable error={error} /><ul>{items.map((x) => <li key={x.id}>{x.name} · Owner {x.ownerCustomerId ?? x.customerId} · Billing {x.responsibleBillingCustomerId ?? 'n/a'} · Location {x.serviceLocationId}</li>)}</ul></section>
}

export function PartsPage() {
  const [parts, setParts] = useState<PartDto[]>([])
  const [vendors, setVendors] = useState<VendorDto[]>([])
  const [categories, setCategories] = useState<PartCategoryDto[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    Promise.all([masterDataApi.listParts(), masterDataApi.listVendors(), masterDataApi.listPartCategories()])
      .then(([partResponse, vendorResponse, categoryResponse]) => {
        setParts(partResponse)
        setVendors(vendorResponse)
        setCategories(categoryResponse)
      })
      .catch(() => setError('Unable to load parts, vendors, or categories.'))
  }, [])
  return (
    <section className="stack">
      <article className="card"><h2>Parts</h2><Errorable error={error} /><ul>{parts.map((x) => <li key={x.id}>{x.partNumber} - {x.name} · Cost {x.unitCost} · Price {x.unitPrice}</li>)}</ul></article>
      <article className="card"><h3>Vendors</h3><ul>{vendors.map((x) => <li key={x.id}>{x.name}</li>)}</ul></article>
      <article className="card"><h3>Part Categories</h3><ul>{categories.map((x) => <li key={x.id}>{x.name}</li>)}</ul></article>
    </section>
  )
}

export function TimeApprovalPage() {
  const [jobId, setJobId] = useState('')
  const [entries, setEntries] = useState<TimeEntryDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const load = () => jobId ? timeEntriesApi.listByJob(jobId).then(setEntries).catch(() => setError('Unable to load time entries for job.')) : Promise.resolve()

  const approve = async (id: string) => { await timeEntriesApi.approve(id, { approvedByUserId: EMPTY_GUID }); await load() }
  const reject = async (id: string) => { await timeEntriesApi.reject(id, { rejectedByUserId: EMPTY_GUID, reason: 'Rejected in manager review' }); await load() }

  return (
    <section className="card stack">
      <h2>Time Approval</h2>
      <p className="muted">Enter a job ticket id to review and action time entries.</p>
      <input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id" />
      <button onClick={() => load()}>Load Time Entries</button>
      <Errorable error={error} />
      <ul>
        {entries.map((x) => <li key={x.id}>{x.employeeId} · {formatDate(x.startedAtUtc)} - {formatDate(x.endedAtUtc)} · {x.laborHours}h · {getApprovalLabel(x.approvalStatus)} <button onClick={() => approve(x.id)}>Approve</button> <button onClick={() => reject(x.id)}>Reject</button></li>)}
      </ul>
    </section>
  )
}

export function PartsApprovalPage() {
  const [jobId, setJobId] = useState('')
  const [parts, setParts] = useState<JobTicketPartDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const load = () => jobId ? jobTicketsApi.listParts(jobId).then(setParts).catch(() => setError('Unable to load job parts for approval.')) : Promise.resolve()

  const approve = async (id: string) => { await jobTicketsApi.approvePart(jobId, id); await load() }
  const reject = async (id: string) => { await jobTicketsApi.rejectPart(jobId, id, { rejectionReason: 'Rejected in manager review' }); await load() }

  return (
    <section className="card stack">
      <h2>Parts Approval</h2>
      <input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id" />
      <button onClick={() => load()}>Load Job Parts</button>
      <Errorable error={error} />
      <ul>
        {parts.map((x) => <li key={x.id}>Part {x.partId} · Qty {x.quantity} · Added by {x.addedByEmployeeId ?? 'n/a'} · Cost {x.unitCostSnapshot} · Sale {x.salePriceSnapshot} · {getApprovalLabel(x.approvalStatus)} <button onClick={() => approve(x.id)}>Approve</button> <button onClick={() => reject(x.id)}>Reject</button></li>)}
      </ul>
    </section>
  )
}

export function ReportsPage() {
  const [jobId, setJobId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [output, setOutput] = useState<string>('')

  const load = async (mode: string) => {
    const data = mode === 'jobsReady' ? await reportsApi.getJobsReadyToInvoice()
      : mode === 'laborJob' ? await reportsApi.getLaborByJob()
      : mode === 'laborEmployee' ? await reportsApi.getLaborByEmployee()
      : mode === 'partsJob' ? await reportsApi.getPartsByJob()
      : mode === 'jobCost' ? await reportsApi.getCostSummary(jobId)
      : mode === 'customerHistory' ? await reportsApi.getCustomerHistory(customerId)
      : await reportsApi.getEquipmentHistory(equipmentId)
    setOutput(JSON.stringify(data, null, 2))
  }

  return (
    <section className="card stack">
      <h2>Reports</h2>
      <p className="muted">Labor reporting uses time-entry labor-rate snapshots first, with legacy fallback when snapshot values are null.</p>
      <div className="inline-links">
        <button onClick={() => load('jobsReady')}>Jobs Ready to Invoice</button>
        <button onClick={() => load('laborJob')}>Labor by Job</button>
        <button onClick={() => load('laborEmployee')}>Labor by Employee</button>
        <button onClick={() => load('partsJob')}>Parts by Job</button>
      </div>
      <input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ticket id for cost summary" />
      <button onClick={() => load('jobCost')}>Job Cost Summary</button>
      <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer id for service history" />
      <button onClick={() => load('customerHistory')}>Customer Service History</button>
      <input value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} placeholder="Equipment id for service history" />
      <button onClick={() => load('equipmentHistory')}>Equipment Service History</button>
      <pre>{output}</pre>
    </section>
  )
}

export function UsersPage() {
  const [items, setItems] = useState<UserDto[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { usersApi.list().then(setItems).catch(() => setError('Unable to load users.')) }, [])
  return <section className="card"><h2>Users (Admin only)</h2><Errorable error={error} /><ul>{items.map((x) => <li key={x.id}>{x.firstName} {x.lastName} · {x.userName} · {x.role} · {x.isArchived ? 'Archived' : 'Active'}</li>)}</ul></section>
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
