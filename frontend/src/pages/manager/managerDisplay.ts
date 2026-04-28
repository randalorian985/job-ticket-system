export const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—')

export const getApprovalLabel = (value: number) => {
  switch (value) {
    case 1:
      return 'Approved'
    case 2:
      return 'Rejected'
    default:
      return 'Pending'
  }
}
