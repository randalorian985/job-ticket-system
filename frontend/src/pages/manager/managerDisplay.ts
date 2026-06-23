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
