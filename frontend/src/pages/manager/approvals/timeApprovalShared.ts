import type { TimeApprovalQueueItemDto } from '../../../types'
import type { TimeEntryReviewFilters } from '../../../api/timeEntriesApi'

export type TimeApprovalFilter = 'all' | 'pending' | 'approved' | 'rejected'

export type TimeApprovalFilterState = {
  dateFrom: string
  dateTo: string
  jobTicketId: string
  employeeId: string
  approvalStatus: TimeApprovalFilter
  search: string
}

export const defaultTimeApprovalFilters: TimeApprovalFilterState = {
  dateFrom: '',
  dateTo: '',
  jobTicketId: '',
  employeeId: '',
  approvalStatus: 'pending',
  search: ''
}

const approvalStatusValue = (status: TimeApprovalFilter) => {
  if (status === 'pending') return 1
  if (status === 'approved') return 2
  if (status === 'rejected') return 3
  return undefined
}

export const toReviewFilters = (filters: TimeApprovalFilterState): TimeEntryReviewFilters => ({
  jobTicketId: filters.jobTicketId || undefined,
  employeeId: filters.employeeId || undefined,
  approvalStatus: approvalStatusValue(filters.approvalStatus),
  dateFromUtc: filters.dateFrom ? `${filters.dateFrom}T00:00:00.000Z` : undefined,
  dateToUtc: filters.dateTo ? `${filters.dateTo}T23:59:59.999Z` : undefined,
  search: filters.search.trim() || undefined
})

export const isEligibleForApproval = (entry: TimeApprovalQueueItemDto) =>
  entry.approvalStatus === 1 && Boolean(entry.endedAtUtc)

export const managerLocationText = (entry: TimeApprovalQueueItemDto) =>
  [...new Set([entry.customerName, entry.siteName, entry.locationName, entry.locationAddress].filter(Boolean))].join(' · ') || '—'

export const toLocalDateTimeInput = (value?: string | null) => {
  if (!value) return ''

  const date = new Date(value)
  const localOffsetMilliseconds = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - localOffsetMilliseconds).toISOString().slice(0, 16)
}
