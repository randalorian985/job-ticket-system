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

export const jobStatusOptions = numberedOptions([
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
])

export const priorityOptions = numberedOptions([
  'Low',
  'Normal',
  'High',
  'Urgent'
])
