import type { JobTicketAssignmentDto, JobTicketListItemDto } from '../../types'

export const DISPATCH_STATUS = {
  Draft: 1,
  Submitted: 2,
  Assigned: 3,
  InProgress: 4,
  Completed: 7,
  Cancelled: 8,
  Invoiced: 9,
  Reviewed: 10
} as const

export type DispatchBoardView =
  | 'unscheduled'
  | 'today'
  | 'tomorrow'
  | 'this-week'

export type DispatchReadiness = {
  conflicts: string[]
  missing: string[]
}

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate())

const inactiveDispatchStatuses = new Set<number>([
  DISPATCH_STATUS.Completed,
  DISPATCH_STATUS.Cancelled,
  DISPATCH_STATUS.Invoiced,
  DISPATCH_STATUS.Reviewed
])

const sameDay = (left: Date, right: Date) => startOfDay(left).getTime() === startOfDay(right).getTime()

const isWithinThisWeek = (value: Date, now: Date) => {
  const day = startOfDay(now)
  const weekEnd = new Date(day)
  weekEnd.setDate(day.getDate() + 7)
  return value >= day && value < weekEnd
}

export const getAssignmentName = (assignment: JobTicketAssignmentDto) =>
  assignment.employeeName?.trim() || 'Employee unavailable'

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
    if (inactiveDispatchStatuses.has(candidate.status)) return false
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

  })

  employeeConflictNames.forEach((name) => conflicts.push(`${name} is already assigned to another job that day.`))

  return { conflicts, missing }
}

export const jobBelongsToDispatchView = (
  view: DispatchBoardView,
  job: JobTicketListItemDto,
  now = new Date()
) => {
  const scheduled = job.scheduledStartAtUtc ? new Date(job.scheduledStartAtUtc) : null
  const isActive = !inactiveDispatchStatuses.has(job.status)
  const tomorrow = new Date(startOfDay(now))
  tomorrow.setDate(tomorrow.getDate() + 1)

  switch (view) {
    case 'unscheduled':
      return !scheduled && isActive
    case 'today':
      return Boolean(scheduled && sameDay(scheduled, now) && isActive)
    case 'tomorrow':
      return Boolean(scheduled && sameDay(scheduled, tomorrow) && isActive)
    case 'this-week':
      return Boolean(scheduled && isWithinThisWeek(scheduled, now) && isActive)
    default:
      return true
  }
}
