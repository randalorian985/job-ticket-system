import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { usersApi } from '../../api/usersApi'
import type { AssignableEmployeeDto, EquipmentDto, JobTicketAssignmentDto, JobTicketDto, JobTicketListItemDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from '../employee/jobDisplay'
import { formatDate } from './managerDisplay'
import {
  DISPATCH_STATUS,
  getAssignmentName,
  getDispatchReadiness,
  jobBelongsToDispatchView,
  type DispatchBoardView
} from './dispatchWorkflow'

type ScheduleDraft = {
  scheduledStartAtUtc: string
  dueAtUtc: string
  equipmentId: string
  operatorEmployeeId: string
  crewEmployeeIds: string[]
  notes: string
}

type BoardTab = {
  value: DispatchBoardView
  label: string
}

const boardTabs: BoardTab[] = [
  { value: 'unscheduled', label: 'Unscheduled Tickets' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-week', label: 'Next 7 Days' }
]

const toInputDateTime = (value?: string | null) => value ? value.slice(0, 16) : ''
const fromInputDateTime = (value: string) => value ? new Date(value).toISOString() : null
const employeeName = (employee: AssignableEmployeeDto) => `${employee.firstName} ${employee.lastName}`.trim()

const buildTicketUpdatePayload = (ticket: JobTicketDto, draft: ScheduleDraft) => ({
  customerId: ticket.customerId,
  serviceLocationId: ticket.serviceLocationId,
  billingPartyCustomerId: ticket.billingPartyCustomerId,
  equipmentId: draft.equipmentId || null,
  title: ticket.title,
  description: ticket.description ?? null,
  jobType: ticket.jobType ?? null,
  priority: ticket.priority,
  status: ticket.status === DISPATCH_STATUS.Draft || ticket.status === DISPATCH_STATUS.Submitted
    ? DISPATCH_STATUS.Assigned
    : ticket.status,
  requestedAtUtc: ticket.requestedAtUtc ?? null,
  scheduledStartAtUtc: fromInputDateTime(draft.scheduledStartAtUtc),
  dueAtUtc: fromInputDateTime(draft.dueAtUtc),
  assignedManagerEmployeeId: ticket.assignedManagerEmployeeId ?? null,
  purchaseOrderNumber: ticket.purchaseOrderNumber ?? null,
  billingContactName: ticket.billingContactName ?? null,
  billingContactPhone: ticket.billingContactPhone ?? null,
  billingContactEmail: ticket.billingContactEmail ?? null,
  internalNotes: draft.notes.trim()
    ? [ticket.internalNotes, `Dispatch notes: ${draft.notes.trim()}`].filter(Boolean).join('\n')
    : ticket.internalNotes ?? null,
  customerFacingNotes: ticket.customerFacingNotes ?? null
})

export function DispatchBoardPage() {
  const [jobs, setJobs] = useState<JobTicketListItemDto[]>([])
  const [assignmentsByJob, setAssignmentsByJob] = useState<Record<string, JobTicketAssignmentDto[]>>({})
  const [equipment, setEquipment] = useState<EquipmentDto[]>([])
  const [employees, setEmployees] = useState<AssignableEmployeeDto[]>([])
  const [activeView, setActiveView] = useState<DispatchBoardView>('unscheduled')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>({
    scheduledStartAtUtc: '',
    dueAtUtc: '',
    equipmentId: '',
    operatorEmployeeId: '',
    crewEmployeeIds: [],
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const equipmentById = useMemo(() => Object.fromEntries(equipment.map((item) => [item.id, item])), [equipment])
  const employeesById = useMemo(() => Object.fromEntries(employees.map((item) => [item.id, item])), [employees])
  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) ?? null, [jobs, selectedJobId])

  const loadBoard = async () => {
    setIsLoading(true)
    try {
      const [tickets, equipmentResponse, employeesResponse] = await Promise.all([
        jobTicketsApi.listAll(),
        masterDataApi.listEquipment(),
        usersApi.listAssignableEmployees()
      ])

      const assignmentResults = await Promise.all(
        tickets.map(async (ticket) => ({
          ticketId: ticket.id,
          assignments: await jobTicketsApi.listAssignments(ticket.id).catch(() => [] as JobTicketAssignmentDto[])
        }))
      )

      setJobs(tickets)
      setEquipment(equipmentResponse)
      setEmployees(employeesResponse)
      setAssignmentsByJob(Object.fromEntries(assignmentResults.map((item) => [item.ticketId, item.assignments])))
      setError(null)
    } catch (requestError) {
      setError(requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)
        ? 'You do not have permission to load the dispatch board.'
        : 'Unable to load the dispatch board.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadBoard()
  }, [])

  const jobsByView = useMemo(() => {
    const now = new Date()
    return Object.fromEntries(boardTabs.map((tab) => [
      tab.value,
      jobs.filter((job) => jobBelongsToDispatchView(tab.value, job, now))
    ])) as Record<DispatchBoardView, JobTicketListItemDto[]>
  }, [jobs])

  const activeJobs = jobsByView[activeView] ?? []

  const openSchedule = (job: JobTicketListItemDto) => {
    const assignments = assignmentsByJob[job.id] ?? []
    const lead = assignments.find((assignment) => assignment.isLead)
    setSelectedJobId(job.id)
    setScheduleDraft({
      scheduledStartAtUtc: toInputDateTime(job.scheduledStartAtUtc),
      dueAtUtc: toInputDateTime(job.dueAtUtc),
      equipmentId: job.equipmentId ?? '',
      operatorEmployeeId: lead?.employeeId ?? '',
      crewEmployeeIds: assignments.filter((assignment) => !assignment.isLead).map((assignment) => assignment.employeeId),
      notes: ''
    })
    setMessage(null)
    setError(null)
  }

  const closeSchedule = () => {
    setSelectedJobId(null)
    setMessage(null)
  }

  const updateCrewSelection = (employeeId: string, checked: boolean) => {
    setScheduleDraft((current) => ({
      ...current,
      crewEmployeeIds: checked
        ? Array.from(new Set([...current.crewEmployeeIds, employeeId])).filter((id) => id !== current.operatorEmployeeId)
        : current.crewEmployeeIds.filter((id) => id !== employeeId)
    }))
  }

  const saveSchedule = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedJob) return

    if (!scheduleDraft.scheduledStartAtUtc) {
      setError('Scheduled date/time is required before a job can be scheduled.')
      return
    }

    if (!scheduleDraft.operatorEmployeeId) {
      setError('Assign an operator before saving the dispatch plan.')
      return
    }

    setIsSaving(true)
    try {
      const ticket = await jobTicketsApi.get(selectedJob.id)
      await jobTicketsApi.update(selectedJob.id, buildTicketUpdatePayload(ticket, scheduleDraft))

      const desiredAssignments = new Map<string, boolean>()
      desiredAssignments.set(scheduleDraft.operatorEmployeeId, true)
      scheduleDraft.crewEmployeeIds.forEach((employeeId) => desiredAssignments.set(employeeId, false))

      const existingAssignments = assignmentsByJob[selectedJob.id] ?? []
      await Promise.all(existingAssignments
        .filter((assignment) => !desiredAssignments.has(assignment.employeeId))
        .map((assignment) => jobTicketsApi.removeAssignment(selectedJob.id, assignment.employeeId)))

      for (const [employeeId, isLead] of desiredAssignments.entries()) {
        const existing = existingAssignments.find((assignment) => assignment.employeeId === employeeId)
        if (!existing || existing.isLead !== isLead) {
          if (existing) await jobTicketsApi.removeAssignment(selectedJob.id, employeeId)
          await jobTicketsApi.addAssignment(selectedJob.id, { employeeId, isLead })
        }
      }

      setMessage('Dispatch plan saved.')
      setSelectedJobId(null)
      await loadBoard()
    } catch {
      setError('Unable to save the dispatch plan.')
    } finally {
      setIsSaving(false)
    }
  }

  const changeStatus = async (job: JobTicketListItemDto, status: number, successMessage: string, note?: string) => {
    setMessage(null)
    setError(null)
    try {
      await jobTicketsApi.changeStatus(job.id, { status })
      if (note) {
        await jobTicketsApi.addWorkEntry(job.id, {
          entryType: 1,
          notes: note,
          performedAtUtc: new Date().toISOString()
        })
      }
      setMessage(successMessage)
      await loadBoard()
    } catch {
      setError('Unable to update the ticket status.')
    }
  }

  const renderJobCard = (job: JobTicketListItemDto) => {
    const assignments = assignmentsByJob[job.id] ?? []
    const lead = assignments.find((assignment) => assignment.isLead)
    const crew = assignments.filter((assignment) => !assignment.isLead)
    const readiness = getDispatchReadiness(job, assignments, jobs, assignmentsByJob)
    const equipmentName = job.equipmentName ?? (job.id === selectedJob?.id && scheduleDraft.equipmentId ? equipmentById[scheduleDraft.equipmentId]?.name : null)
    const hasWarnings = readiness.conflicts.length > 0 || readiness.missing.length > 0
    const isReadyForDayOfWork = Boolean(job.scheduledStartAtUtc && lead)
    const isAssigned = job.status === DISPATCH_STATUS.Assigned

    return (
      <article className={`dispatch-job-card${hasWarnings ? ' dispatch-job-card-warning' : ''}`} key={job.id}>
        <div className="dispatch-card-main">
          <div>
            <span className="eyebrow">{job.ticketNumber}</span>
            <h3>{job.title}</h3>
            <p className="muted">{job.customerName ?? 'Customer unavailable'} · {job.serviceLocationName ?? 'Location unavailable'}</p>
          </div>
          <span className="status-chip">{getJobTicketStatusLabel(job.status)}</span>
        </div>
        <div className="dispatch-card-grid">
          <div><span>Customer Requested</span><strong>{formatDate(job.requestedAtUtc)}</strong></div>
          <div><span>Scheduled</span><strong>{formatDate(job.scheduledStartAtUtc)}</strong></div>
          <div><span>Job / Scope</span><strong>{job.title}</strong></div>
          <div><span>Crane / Equipment Being Serviced</span><strong>{equipmentName ?? 'See job scope'}</strong></div>
          <div><span>Operator</span><strong>{lead ? getAssignmentName(lead) : 'Unassigned'}</strong></div>
          <div><span>Crew</span><strong>{crew.length ? crew.map(getAssignmentName).join(', ') : 'No crew assigned'}</strong></div>
          <div><span>Priority</span><strong>{getJobTicketPriorityLabel(job.priority)}</strong></div>
        </div>
        {hasWarnings ? (
          <div className="dispatch-warning-panel" role="status">
            {[...readiness.conflicts, ...readiness.missing].map((item) => <span key={item}>{item}</span>)}
          </div>
        ) : (
          <p className="dispatch-ready-line">No employee assignment conflicts or missing dispatch fields are visible.</p>
        )}
        <div className="dispatch-card-actions">
          <button type="button" className="compact-button" onClick={() => openSchedule(job)}>Schedule &amp; Assign</button>
          <button type="button" className="compact-button secondary-button" disabled={!isAssigned || !isReadyForDayOfWork} title="Records an En Route note on the ticket." onClick={() => changeStatus(job, DISPATCH_STATUS.Assigned, 'Crew marked en route.', 'Dispatch update: crew en route.')}>Mark En Route</button>
          <button type="button" className="compact-button secondary-button" disabled={!isAssigned || !isReadyForDayOfWork} title="Records an On Site note on the ticket." onClick={() => changeStatus(job, DISPATCH_STATUS.Assigned, 'Crew marked on site.', 'Dispatch update: crew on site.')}>Mark On Site</button>
          <button type="button" className="compact-button" disabled={!isAssigned || !isReadyForDayOfWork} onClick={() => changeStatus(job, DISPATCH_STATUS.InProgress, 'Work started.')}>Start Work</button>
          <button type="button" className="compact-button" disabled={job.status !== DISPATCH_STATUS.InProgress} onClick={() => changeStatus(job, DISPATCH_STATUS.Completed, 'Work completed.')}>Complete Work</button>
          <Link className="button-link secondary-link compact-button" to={`/manage/job-tickets/${job.id}`}>Open Ticket</Link>
        </div>
      </article>
    )
  }

  return (
    <section className="dispatch-board-page stack" aria-label="dispatch board">
      <header className="dispatch-board-hero">
        <div>
          <p className="eyebrow">Manager/Admin Dispatch</p>
          <h2>Dispatch Board</h2>
          <p className="muted">Plan active tickets and coordinate today's field work.</p>
        </div>
        <Link className="button-link" to="/manage/job-tickets/new">Create Job Ticket</Link>
      </header>

      <p className="muted dispatch-board-note">
        Job tickets are the only work records. Dispatch updates their schedule and employee assignments; ticket review and billing stay in their existing workflows.
      </p>

      <nav className="dispatch-board-tabs" aria-label="dispatch board views">
        {boardTabs.map((tab) => (
          <button
            aria-pressed={activeView === tab.value}
            className={activeView === tab.value ? 'dispatch-board-tab-active' : undefined}
            key={tab.value}
            onClick={() => setActiveView(tab.value)}
            type="button"
          >
            <span>{tab.label}</span>
            <strong>{jobsByView[tab.value]?.length ?? 0}</strong>
          </button>
        ))}
      </nav>

      {message ? <p className="success" role="status">{message}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
      {isLoading ? <p className="muted" role="status">Loading dispatch board...</p> : null}
      {!isLoading && !activeJobs.length ? <p className="empty-state">No tickets are in this dispatch view.</p> : null}

      <section className="dispatch-card-list" aria-label={`${boardTabs.find((tab) => tab.value === activeView)?.label ?? 'Dispatch'} tickets`}>
        {activeJobs.map(renderJobCard)}
      </section>

      {selectedJob ? (
        <section className="dispatch-schedule-drawer" aria-label="schedule and assign ticket">
          <div className="dispatch-schedule-panel">
            <div className="workbench-panel-heading">
              <div>
                <h3>Schedule &amp; Assign Ticket</h3>
                <p className="muted">{selectedJob.ticketNumber} · {selectedJob.customerName ?? 'Customer unavailable'} · {selectedJob.serviceLocationName ?? 'Location unavailable'}</p>
              </div>
              <button type="button" className="secondary-button" onClick={closeSchedule}>Cancel</button>
            </div>
            <form className="stack" onSubmit={saveSchedule}>
              <div className="dispatch-schedule-grid">
                <label>Customer requested date/time<input value={toInputDateTime(selectedJob.requestedAtUtc)} readOnly /></label>
                <label>Scheduled date/time<input type="datetime-local" value={scheduleDraft.scheduledStartAtUtc} onChange={(event) => setScheduleDraft({ ...scheduleDraft, scheduledStartAtUtc: event.target.value })} required /></label>
                <label>Due date/time<input type="datetime-local" value={scheduleDraft.dueAtUtc} onChange={(event) => setScheduleDraft({ ...scheduleDraft, dueAtUtc: event.target.value })} /></label>
                <label>Crane / equipment being serviced<select value={scheduleDraft.equipmentId} onChange={(event) => setScheduleDraft({ ...scheduleDraft, equipmentId: event.target.value })}>
                  <option value="">No equipment record selected</option>
                  {equipment.map((item) => <option key={item.id} value={item.id}>{item.equipmentNumber ? `${item.equipmentNumber} - ` : ''}{item.name}</option>)}
                </select></label>
                <label>Operator assignment<select value={scheduleDraft.operatorEmployeeId} onChange={(event) => setScheduleDraft({ ...scheduleDraft, operatorEmployeeId: event.target.value, crewEmployeeIds: scheduleDraft.crewEmployeeIds.filter((id) => id !== event.target.value) })} required>
                  <option value="">Select operator</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employeeName(employee)}</option>)}
                </select></label>
              </div>
              <fieldset className="dispatch-crew-fieldset">
                <legend>Assigned Crew</legend>
                {employees.map((employee) => (
                  <label className="checkbox-row" key={employee.id}>
                    <input
                      checked={scheduleDraft.crewEmployeeIds.includes(employee.id)}
                      disabled={scheduleDraft.operatorEmployeeId === employee.id}
                      onChange={(event) => updateCrewSelection(employee.id, event.target.checked)}
                      type="checkbox"
                    />
                    {employeeName(employee)}
                  </label>
                ))}
              </fieldset>
              <label>Dispatch notes<textarea value={scheduleDraft.notes} onChange={(event) => setScheduleDraft({ ...scheduleDraft, notes: event.target.value })} placeholder="Site constraints, rigging notes, access notes, or customer timing instructions" /></label>
              <div className="dispatch-warning-panel">
                {getDispatchReadiness(
                  { ...selectedJob, scheduledStartAtUtc: fromInputDateTime(scheduleDraft.scheduledStartAtUtc), equipmentName: equipmentById[scheduleDraft.equipmentId]?.name ?? selectedJob.equipmentName },
                  [
                    ...(scheduleDraft.operatorEmployeeId ? [{ jobTicketId: selectedJob.id, employeeId: scheduleDraft.operatorEmployeeId, assignedAtUtc: new Date().toISOString(), isLead: true, employeeName: employeesById[scheduleDraft.operatorEmployeeId] ? employeeName(employeesById[scheduleDraft.operatorEmployeeId]) : 'Selected operator' }] : []),
                    ...scheduleDraft.crewEmployeeIds.map((employeeId) => ({ jobTicketId: selectedJob.id, employeeId, assignedAtUtc: new Date().toISOString(), isLead: false, employeeName: employeesById[employeeId] ? employeeName(employeesById[employeeId]) : 'Selected crew' }))
                  ],
                  jobs,
                  assignmentsByJob
                ).conflicts.map((warning) => <span key={warning}>{warning}</span>)}
                <span>Save is allowed with employee scheduling warnings so dispatch can resolve real-world exceptions intentionally.</span>
              </div>
              <div className="section-editor-save-row">
                <span className="muted">Existing ticket data is preserved; schedule, service equipment, operator, crew, and notes are updated through current ticket APIs.</span>
                <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Dispatch Plan'}</button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </section>
  )
}
