const jobTicketStatusLabels: Record<number, string> = {
  1: 'Draft',
  2: 'Submitted',
  3: 'Assigned',
  4: 'In Progress',
  5: 'Waiting on Parts',
  6: 'Waiting on Customer',
  7: 'Completed',
  8: 'Cancelled',
  9: 'Invoiced',
  10: 'Reviewed'
}

const jobTicketPriorityLabels: Record<number, string> = {
  1: 'Low',
  2: 'Normal',
  3: 'High',
  4: 'Urgent'
}

export function getJobTicketStatusLabel(status: number) {
  return jobTicketStatusLabels[status] ?? String(status)
}

export function getJobTicketPriorityLabel(priority: number) {
  return jobTicketPriorityLabels[priority] ?? String(priority)
}
