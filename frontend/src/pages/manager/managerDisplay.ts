import type { TicketStatusFilterOptionDto } from '../../types'

export const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—')

export const TIME_ENTRY_APPROVAL_STATUS = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
} as const

export const JOB_PART_APPROVAL_STATUS = {
  ...TIME_ENTRY_APPROVAL_STATUS,
  Invoiced: 4,
} as const

const approvalStatusLabels: Record<number, string> = {
  [TIME_ENTRY_APPROVAL_STATUS.Pending]: 'Pending',
  [TIME_ENTRY_APPROVAL_STATUS.Approved]: 'Approved',
  [TIME_ENTRY_APPROVAL_STATUS.Rejected]: 'Rejected',
  [JOB_PART_APPROVAL_STATUS.Invoiced]: 'Invoiced'
}

const numberedOptions = (labels: string[]) =>
  labels.map((label, index) => ({
    value: index + 1,
    label: `${index + 1} - ${label}`
  }))

export const getApprovalLabel = (value: number) => approvalStatusLabels[value] ?? 'Unknown'

export const jobTicketStatusLabels = [
  'Draft',
  'Submitted',
  'Assigned',
  'In Progress',
  'Waiting on Parts',
  'Waiting on Customer',
  'Completed',
  'Cancelled',
  'Invoiced',
  'Reviewed'
]

export const jobStatusOptions = numberedOptions(jobTicketStatusLabels)

/**
 * Returns the set of valid status values a manager can transition a ticket to
 * from its current status. Prevents skipping steps or jumping to Invoiced early.
 */
export function getValidStatusTransitions(currentStatus: number): number[] {
  // Draft
  if (currentStatus === 1) return [1, 2, 8]
  // Submitted
  if (currentStatus === 2) return [1, 2, 3, 5, 6, 8]
  // Assigned
  if (currentStatus === 3) return [2, 3, 4, 5, 6, 8]
  // In Progress
  if (currentStatus === 4) return [3, 4, 5, 6, 7, 8]
  // Waiting on Parts
  if (currentStatus === 5) return [3, 4, 5, 6, 8]
  // Waiting on Customer
  if (currentStatus === 6) return [3, 4, 5, 6, 8]
  // Completed
  if (currentStatus === 7) return [4, 7, 8, 10]
  // Cancelled
  if (currentStatus === 8) return [2, 8]
  // Invoiced (read-only, no forward transition from UI)
  if (currentStatus === 9) return [9]
  // Reviewed → Ready for Invoice
  if (currentStatus === 10) return [7, 9, 10]
  // Unknown / fallback — allow editing status freely
  return jobStatusOptions.map((o) => o.value)
}

export const defaultTicketStatusFilterOptions: TicketStatusFilterOptionDto[] = [
  { id: 'default-submitted', displayLabel: 'Submitted', status: 2, displayOrder: 10, isActive: true },
  { id: 'default-assigned', displayLabel: 'Assigned', status: 3, displayOrder: 20, isActive: true },
  { id: 'default-in-progress', displayLabel: 'In Progress', status: 4, displayOrder: 30, isActive: true },
  { id: 'default-waiting-on-parts', displayLabel: 'Waiting on Parts', status: 5, displayOrder: 40, isActive: true },
  { id: 'default-waiting-on-customer', displayLabel: 'Waiting on Customer', status: 6, displayOrder: 50, isActive: true }
]

export const priorityOptions = numberedOptions([
  'Low',
  'Normal',
  'High',
  'Urgent'
])

export const workLocationTypeOptions = [
  { value: 1, label: 'Customer Site' },
  { value: 2, label: 'Company Shop' },
  { value: 3, label: 'Mixed/Both' }
]
