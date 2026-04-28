import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { filesApi } from '../../api/filesApi'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { usersApi } from '../../api/usersApi'
import { useAuth } from '../../features/auth/AuthContext'
import type { CreateJobTicketDto, CustomerDto, EquipmentDto, JobTicketAssignmentDto, JobTicketDto, JobTicketFileDto, JobTicketPartDto, JobWorkEntryDto, ServiceLocationDto, TimeEntryDto, UserDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from '../employee/jobDisplay'
import { formatDate, getApprovalLabel, jobStatusOptions } from './managerDisplay'
import { JobTicketEditorForm } from './JobTicketEditorForm'

export function JobTicketDetailPage() {
  const { jobTicketId } = useParams<{ jobTicketId: string }>()
  const { user } = useAuth()
  const [job, setJob] = useState<JobTicketDto | null>(null)
  const [assignments, setAssignments] = useState<JobTicketAssignmentDto[]>([])
  const [entries, setEntries] = useState<JobWorkEntryDto[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntryDto[]>([])
  const [parts, setParts] = useState<JobTicketPartDto[]>([])
  const [files, setFiles] = useState<JobTicketFileDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [locations, setLocations] = useState<ServiceLocationDto[]>([])
  const [equipment, setEquipment] = useState<EquipmentDto[]>([])
  const [employees, setEmployees] = useState<UserDto[]>([])
  const [statusValue, setStatusValue] = useState('1')
  const [archiveReason, setArchiveReason] = useState('')
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState('')
  const [isLeadAssignment, setIsLeadAssignment] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const canShow = useMemo(() => Boolean(jobTicketId), [jobTicketId])
  const customersById = useMemo(() => Object.fromEntries(customers.map((item) => [item.id, item])), [customers])
  const locationsById = useMemo(() => Object.fromEntries(locations.map((item) => [item.id, item])), [locations])
  const equipmentById = useMemo(() => Object.fromEntries(equipment.map((item) => [item.id, item])), [equipment])

  const load = async () => {
    if (!jobTicketId) return

    const [jobResponse, assignmentResponse, entryResponse, timeResponse, partsResponse, filesResponse, customerResponse, locationResponse, equipmentResponse] =
      await Promise.all([
        jobTicketsApi.get(jobTicketId),
        jobTicketsApi.listAssignments(jobTicketId).catch(() => []),
        jobTicketsApi.listWorkEntries(jobTicketId),
        timeEntriesApi.listByJob(jobTicketId).catch(() => []),
        jobTicketsApi.listParts(jobTicketId),
        filesApi.list(jobTicketId),
        masterDataApi.listCustomers(),
        masterDataApi.listServiceLocations(),
        masterDataApi.listEquipment()
      ])

    setJob(jobResponse)
    setStatusValue(String(jobResponse.status))
    setAssignments(assignmentResponse)
    setEntries(entryResponse)
    setTimeEntries(timeResponse)
    setParts(partsResponse)
    setFiles(filesResponse)
    setCustomers(customerResponse)
    setLocations(locationResponse)
    setEquipment(equipmentResponse)

    if (user?.role === 'Admin') {
      const userList = await usersApi.list().catch(() => [])
      setEmployees(userList.filter((x) => !x.isArchived && x.role === 'Employee'))
    }
  }

  useEffect(() => {
    load().catch((requestError) => {
      if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
        setError('You do not have permission to load this manager view.')
        return
      }
      setError('Unable to load job ticket details.')
    })
  }, [jobTicketId])

  const onStatusChange = async (event: FormEvent) => {
    event.preventDefault()
    if (!jobTicketId || !window.confirm('Confirm status update?')) return
    try {
      await jobTicketsApi.changeStatus(jobTicketId, { status: Number(statusValue) })
      setMessage('Status updated.')
      await load()
    } catch {
      setError('Unable to update status.')
    }
  }

  const onArchive = async (event: FormEvent) => {
    event.preventDefault()
    if (!jobTicketId || !archiveReason.trim() || !window.confirm('Archive this job ticket?')) return
    try {
      await jobTicketsApi.archive(jobTicketId, { archiveReason: archiveReason.trim() })
      setMessage('Ticket archived.')
      await load()
    } catch {
      setError('Unable to archive ticket.')
    }
  }

  const onAddAssignment = async (event: FormEvent) => {
    event.preventDefault()
    if (!jobTicketId || !assignmentEmployeeId) return
    if (assignments.some((x) => x.employeeId === assignmentEmployeeId)) {
      setError('Employee is already assigned.')
      return
    }
    try {
      await jobTicketsApi.addAssignment(jobTicketId, { employeeId: assignmentEmployeeId, isLead: isLeadAssignment })
      setMessage('Employee assigned.')
      setAssignmentEmployeeId('')
      setIsLeadAssignment(false)
      await load()
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to add assignment.')
    }
  }

  const onRemoveAssignment = async (employeeId: string) => {
    if (!jobTicketId || !window.confirm('Remove this assignment?')) return
    try {
      await jobTicketsApi.removeAssignment(jobTicketId, employeeId)
      setMessage('Assignment removed.')
      await load()
    } catch {
      setError('Unable to remove assignment.')
    }
  }

  const editPayload: CreateJobTicketDto | null = job
    ? {
        customerId: job.customerId,
        serviceLocationId: job.serviceLocationId,
        billingPartyCustomerId: job.billingPartyCustomerId,
        equipmentId: job.equipmentId,
        title: job.title,
        description: job.description,
        jobType: job.jobType,
        priority: job.priority,
        status: job.status,
        requestedAtUtc: job.requestedAtUtc,
        scheduledStartAtUtc: job.scheduledStartAtUtc,
        dueAtUtc: job.dueAtUtc,
        assignedManagerEmployeeId: job.assignedManagerEmployeeId,
        purchaseOrderNumber: job.purchaseOrderNumber,
        billingContactName: job.billingContactName,
        billingContactPhone: job.billingContactPhone,
        billingContactEmail: job.billingContactEmail,
        internalNotes: job.internalNotes,
        customerFacingNotes: job.customerFacingNotes
      }
    : null

  if (!canShow) return <section className="card">Missing job id.</section>

  return (
    <section className="stack">
      <p><Link to="/manage/job-tickets">← Back to Job Tickets</Link></p>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {job ? (
        <article className="card stack">
          <h2>{job.ticketNumber}</h2>
          <p>{job.title}</p>
          <p className="muted">Status: {getJobTicketStatusLabel(job.status)} · Priority: {getJobTicketPriorityLabel(job.priority)}</p>
          <p className="muted">Customer: {customersById[job.customerId]?.name ?? job.customerId}</p>
          <p className="muted">Service Location: {locationsById[job.serviceLocationId]?.locationName ?? job.serviceLocationId}</p>
          <p className="muted">Billing Party: {customersById[job.billingPartyCustomerId]?.name ?? job.billingPartyCustomerId}</p>
          <p className="muted">Equipment: {job.equipmentId ? equipmentById[job.equipmentId]?.name ?? job.equipmentId : '—'}</p>
          <p>{job.description ?? 'No work description.'}</p>
          <button onClick={() => setEditMode((prev) => !prev)}>{editMode ? 'Cancel Edit' : 'Edit Ticket'}</button>
          {editMode && editPayload ? (
            <JobTicketEditorForm
              initial={editPayload}
              customers={customers}
              serviceLocations={locations}
              equipment={equipment}
              submitLabel="Save Ticket"
              onSubmit={async (payload) => {
                if (!jobTicketId) return
                await jobTicketsApi.update(jobTicketId, payload)
                setEditMode(false)
                setMessage('Ticket updated.')
                await load()
              }}
            />
          ) : null}
          <form onSubmit={onStatusChange} className="row">
            <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)} aria-label="status value">
              {jobStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <button type="submit">Update Status</button>
          </form>
          <form onSubmit={onArchive} className="stack">
            <input value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} placeholder="Archive reason" />
            <button type="submit">Archive Ticket</button>
          </form>
        </article>
      ) : null}

      <article className="card stack">
        <h3>Assigned Employees</h3>
        <ul>{assignments.map((item) => <li key={item.employeeId}>{item.employeeId} {item.isLead ? '(Lead)' : ''} <button onClick={() => onRemoveAssignment(item.employeeId)}>Remove</button></li>)}</ul>
        <form onSubmit={onAddAssignment} className="row">
          {employees.length ? (
            <select value={assignmentEmployeeId} onChange={(e) => setAssignmentEmployeeId(e.target.value)} aria-label="assignment employee">
              <option value="">Select employee</option>
              {employees.filter((x) => !assignments.some((a) => a.employeeId === x.id)).map((x) => <option key={x.id} value={x.id}>{x.firstName} {x.lastName}</option>)}
            </select>
          ) : (
            <input value={assignmentEmployeeId} onChange={(e) => setAssignmentEmployeeId(e.target.value)} placeholder="Employee id" aria-label="assignment employee" />
          )}
          <label><input type="checkbox" checked={isLeadAssignment} onChange={(e) => setIsLeadAssignment(e.target.checked)} />Lead</label>
          <button type="submit">Assign Employee</button>
        </form>
      </article>
      <article className="card"><h3>Work Entries</h3><ul>{entries.map((item) => <li key={item.id}>{formatDate(item.performedAtUtc)} - {item.notes}</li>)}</ul></article>
      <article className="card"><h3>Time Entries</h3><ul>{timeEntries.map((item) => <li key={item.id}>{item.employeeId} · {item.laborHours}h · {getApprovalLabel(item.approvalStatus)}</li>)}</ul></article>
      <article className="card"><h3>Parts Used</h3><ul>{parts.map((item) => <li key={item.id}>Part {item.partId} · Qty {item.quantity} · {getApprovalLabel(item.approvalStatus)}</li>)}</ul></article>
      <article className="card"><h3>Files / Photos</h3><ul>{files.map((item) => <li key={item.id}><a href={filesApi.getDownloadUrl(item.jobTicketId, item.id)}>{item.originalFileName}</a></li>)}</ul></article>
    </section>
  )
}
