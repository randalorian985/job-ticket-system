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

export const getApprovalLabel = (value: number) => {
  switch (value) {
    case TIME_ENTRY_APPROVAL_STATUS.Pending:
      return 'Pending'
    case TIME_ENTRY_APPROVAL_STATUS.Approved:
      return 'Approved'
    case TIME_ENTRY_APPROVAL_STATUS.Rejected:
      return 'Rejected'
    case JOB_PART_APPROVAL_STATUS.Invoiced:
      return 'Invoiced'
    default:
      return 'Unknown'
  }
}

export const jobStatusOptions = [
  { value: 1, label: '1 - Draft' },
  { value: 2, label: '2 - Submitted' },
  { value: 3, label: '3 - Assigned' },
  { value: 4, label: '4 - In Progress' },
  { value: 5, label: '5 - Waiting on Parts' },
  { value: 6, label: '6 - Waiting on Customer' },
  { value: 7, label: '7 - Completed' },
  { value: 8, label: '8 - Cancelled' },
  { value: 9, label: '9 - Invoiced' },
  { value: 10, label: '10 - Reviewed' }
]

export const priorityOptions = [
  { value: 1, label: '1 - Low' },
  { value: 2, label: '2 - Normal' },
  { value: 3, label: '3 - High' },
  { value: 4, label: '4 - Urgent' }
]
