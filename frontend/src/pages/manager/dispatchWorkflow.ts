import type { JobTicketAssignmentDto, JobTicketListItemDto } from '../../types'

export const DISPATCH_STATUS = {
  Draft: 1,
  Requested: 2,
  Scheduled: 3,
  InProgress: 4,
  Completed: 7,
  Invoiced: 9,
  Reviewed: 10
} as const

export type DispatchBoardView =
  | 'unscheduled'
  | 'today'
  | 'tomorrow'
  | 'this-week'
  | 'completed'
  | 'needs-ticket-review'
  | 'ready-for-billing'

export type DispatchLifecycleStatus =
  | 'Requested'
  | 'Needs Scheduling'
  | 'Scheduled'
  | 'Dispatched'
  | 'En Route'
  | 'On Site'
  | 'In Progress'
  | 'Work Complete'
  | 'Ticket In Review'
  | 'Ticket Finalized'
  | 'Ready for Billing'
  | 'Invoiced'

export type DispatchReadiness = {
  conflicts: string[]
  missing: string[]
}

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate())

const sameDay = (left: Date, right: Date) => startOfDay(left).getTime() === startOfDay(right).getTime()

const isWithinThisWeek = (value: Date, now: Date) => {
  const day = startOfDay(now)
  const weekEnd = new Date(day)
  weekEnd.setDate(day.getDate() + 7)
  return value >= day && value < weekEnd
}

export const getAssignmentName = (assignment: JobTicketAssignmentDto) =>
  assignment.employeeName?.trim() || 'Employee unavailable'

export const getDispatchLifecycleStatus = (job: JobTicketListItemDto, assignments: JobTicketAssignmentDto[]): DispatchLifecycleStatus => {
  if (job.status === DISPATCH_STATUS.Invoiced) return 'Invoiced'
  if (job.status === DISPATCH_STATUS.Reviewed) return 'Ticket Finalized'
  if (job.status === DISPATCH_STATUS.Completed) return 'Work Complete'
  if (job.status === DISPATCH_STATUS.InProgress) return 'In Progress'
  if (job.status === DISPATCH_STATUS.Scheduled && job.scheduledStartAtUtc && assignments.length) return 'Dispatched'
  if (job.scheduledStartAtUtc) return 'Scheduled'
  if (job.status === DISPATCH_STATUS.Draft || job.status === DISPATCH_STATUS.Requested) return 'Needs Scheduling'
  return 'Requested'
}

export const getTicketReviewStatus = (job: JobTicketListItemDto) => {
  if (job.status === DISPATCH_STATUS.Invoiced) return 'Invoiced'
  if (job.status === DISPATCH_STATUS.Reviewed) return 'Ticket finalized'
  if (job.status === DISPATCH_STATUS.Completed) return 'Needs ticket review'
  if (job.status === DISPATCH_STATUS.InProgress) return 'Field work active'
  return 'Dispatch planning'
}

export const getDispatchReadiness = (
  job: JobTicketListItemDto,
  assignments: JobTicketAssignmentDto[],
  allJobs: JobTicketListItemDto[],
  assignmentMap: Record<string, JobTicketAssignmentDto[]>
): DispatchReadiness => {
  const missing: string[] = []
  const conflicts: string[] = []

  if (!job.customerId) missing.push('Customer is missing.')
  if (!job.serviceLocationId) missing.push('Job site/location is missing.')
  if (!job.scheduledStartAtUtc) missing.push('Scheduled date/time is missing.')
  if (!job.dueAtUtc) missing.push('Due date is missing.')
  if (!assignments.length) missing.push('Operator or crew assignment is missing.')
  if (!assignments.some((assignment) => assignment.isLead)) missing.push('Lead operator is missing.')

  if (!job.scheduledStartAtUtc) {
    return { conflicts, missing }
  }

  const scheduledStart = new Date(job.scheduledStartAtUtc)
  const scheduledDay = startOfDay(scheduledStart).getTime()
  const activeConflictingJobs = allJobs.filter((candidate) => {
    if (candidate.id === job.id || !candidate.scheduledStartAtUtc) return false
    if ([DISPATCH_STATUS.Completed, DISPATCH_STATUS.Invoiced].includes(candidate.status as 7 | 9)) return false
    return startOfDay(new Date(candidate.scheduledStartAtUtc)).getTime() === scheduledDay
  })

  const assignedEmployeeIds = new Set(assignments.map((assignment) => assignment.employeeId))
  const employeeConflictNames = new Set<string>()

  activeConflictingJobs.forEach((candidate) => {
    ;(assignmentMap[candidate.id] ?? []).forEach((assignment) => {
      if (assignedEmployeeIds.has(assignment.employeeId)) {
        employeeConflictNames.add(getAssignmentName(assignment))
      }
    })

    if (candidate.equipmentName && job.equipmentName && candidate.equipmentName === job.equipmentName) {
      conflicts.push(`Crane/equipment also scheduled on ${candidate.ticketNumber}.`)
    }
  })

  employeeConflictNames.forEach((name) => conflicts.push(`${name} is already assigned to another job that day.`))

  return { conflicts, missing }
}

export const jobBelongsToDispatchView = (
  view: DispatchBoardView,
  job: JobTicketListItemDto,
  assignments: JobTicketAssignmentDto[],
  now = new Date()
) => {
  const scheduled = job.scheduledStartAtUtc ? new Date(job.scheduledStartAtUtc) : null
  const lifecycleStatus = getDispatchLifecycleStatus(job, assignments)
  const tomorrow = new Date(startOfDay(now))
  tomorrow.setDate(tomorrow.getDate() + 1)

  switch (view) {
    case 'unscheduled':
      return !scheduled && job.status !== DISPATCH_STATUS.Completed && job.status !== DISPATCH_STATUS.Invoiced
    case 'today':
      return Boolean(scheduled && sameDay(scheduled, now) && job.status !== DISPATCH_STATUS.Completed && job.status !== DISPATCH_STATUS.Invoiced)
    case 'tomorrow':
      return Boolean(scheduled && sameDay(scheduled, tomorrow) && job.status !== DISPATCH_STATUS.Completed && job.status !== DISPATCH_STATUS.Invoiced)
    case 'this-week':
      return Boolean(scheduled && isWithinThisWeek(scheduled, now) && job.status !== DISPATCH_STATUS.Completed && job.status !== DISPATCH_STATUS.Invoiced)
    case 'completed':
      return lifecycleStatus === 'Work Complete' || lifecycleStatus === 'Ticket Finalized' || lifecycleStatus === 'Invoiced'
    case 'needs-ticket-review':
      return job.status === DISPATCH_STATUS.Completed
    case 'ready-for-billing':
      return job.status === DISPATCH_STATUS.Reviewed
    default:
      return true
  }
}
