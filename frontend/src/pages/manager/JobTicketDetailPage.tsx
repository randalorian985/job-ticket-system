import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { filesApi } from '../../api/filesApi'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { ApiError } from '../../api/httpClient'
import type { CustomerDto, EquipmentDto, JobTicketAssignmentDto, JobTicketDto, JobTicketFileDto, JobTicketPartDto, JobWorkEntryDto, ServiceLocationDto, TimeEntryDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from '../employee/jobDisplay'
import { formatDate, getApprovalLabel } from './managerDisplay'

export function JobTicketDetailPage() {
  const { jobTicketId } = useParams<{ jobTicketId: string }>()
  const [job, setJob] = useState<JobTicketDto | null>(null)
  const [assignments, setAssignments] = useState<JobTicketAssignmentDto[]>([])
  const [entries, setEntries] = useState<JobWorkEntryDto[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntryDto[]>([])
  const [parts, setParts] = useState<JobTicketPartDto[]>([])
  const [files, setFiles] = useState<JobTicketFileDto[]>([])
  const [customers, setCustomers] = useState<Record<string, CustomerDto>>({})
  const [locations, setLocations] = useState<Record<string, ServiceLocationDto>>({})
  const [equipment, setEquipment] = useState<Record<string, EquipmentDto>>({})
  const [statusValue, setStatusValue] = useState('0')
  const [archiveReason, setArchiveReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const canShow = useMemo(() => Boolean(jobTicketId), [jobTicketId])

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
    setCustomers(Object.fromEntries(customerResponse.map((item) => [item.id, item])))
    setLocations(Object.fromEntries(locationResponse.map((item) => [item.id, item])))
    setEquipment(Object.fromEntries(equipmentResponse.map((item) => [item.id, item])))
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
    if (!jobTicketId) return
    await jobTicketsApi.changeStatus(jobTicketId, { status: Number(statusValue) })
    await load()
  }

  const onArchive = async (event: FormEvent) => {
    event.preventDefault()
    if (!jobTicketId || !archiveReason.trim()) return
    await jobTicketsApi.archive(jobTicketId, { archiveReason })
    await load()
  }

  if (!canShow) return <section className="card">Missing job id.</section>

  return (
    <section className="stack">
      <p><Link to="/manage/job-tickets">← Back to Job Tickets</Link></p>
      {error ? <p className="error">{error}</p> : null}
      {job ? (
        <article className="card stack">
          <h2>{job.ticketNumber}</h2>
          <p>{job.title}</p>
          <p className="muted">Status: {getJobTicketStatusLabel(job.status)} · Priority: {getJobTicketPriorityLabel(job.priority)}</p>
          <p className="muted">Customer: {customers[job.customerId]?.name ?? job.customerId}</p>
          <p className="muted">Service Location: {locations[job.serviceLocationId]?.locationName ?? job.serviceLocationId}</p>
          <p className="muted">Billing Party: {customers[job.billingPartyCustomerId]?.name ?? job.billingPartyCustomerId}</p>
          <p className="muted">Equipment: {job.equipmentId ? equipment[job.equipmentId]?.name ?? job.equipmentId : '—'}</p>
          <p>{job.description ?? 'No work description.'}</p>
          <form onSubmit={onStatusChange} className="row">
            <input value={statusValue} onChange={(e) => setStatusValue(e.target.value)} aria-label="status value" />
            <button type="submit">Update Status</button>
          </form>
          <form onSubmit={onArchive} className="stack">
            <input value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} placeholder="Archive reason" />
            <button type="submit">Archive Ticket</button>
          </form>
        </article>
      ) : null}

      <article className="card"><h3>Assigned Employees</h3><ul>{assignments.map((item) => <li key={item.employeeId}>{item.employeeId} {item.isLead ? '(Lead)' : ''}</li>)}</ul></article>
      <article className="card"><h3>Work Entries</h3><ul>{entries.map((item) => <li key={item.id}>{formatDate(item.performedAtUtc)} - {item.notes}</li>)}</ul></article>
      <article className="card"><h3>Time Entries</h3><ul>{timeEntries.map((item) => <li key={item.id}>{item.employeeId} · {item.laborHours}h · {getApprovalLabel(item.approvalStatus)}</li>)}</ul></article>
      <article className="card"><h3>Parts Used</h3><ul>{parts.map((item) => <li key={item.id}>Part {item.partId} · Qty {item.quantity} · {getApprovalLabel(item.approvalStatus)}</li>)}</ul></article>
      <article className="card"><h3>Files / Photos</h3><ul>{files.map((item) => <li key={item.id}><a href={filesApi.getDownloadUrl(item.jobTicketId, item.id)}>{item.originalFileName}</a></li>)}</ul></article>
    </section>
  )
}
