import type {
  AdjustTimeEntryRequestDto,
  ClockInRequestDto,
  ClockOutRequestDto,
  RejectTimeEntryRequestDto,
  TimeApprovalQueueItemDto,
  TimeEntryDto
} from '../types'
import { apiRequest } from './httpClient'

export type TimeEntryReviewFilters = {
  jobTicketId?: string
  employeeId?: string
  approvalStatus?: number
  dateFromUtc?: string
  dateToUtc?: string
  search?: string
}

const reviewQuery = (filters: TimeEntryReviewFilters) => {
  const query = new URLSearchParams()
  if (filters.jobTicketId) query.set('jobTicketId', filters.jobTicketId)
  if (filters.employeeId) query.set('employeeId', filters.employeeId)
  if (filters.approvalStatus) query.set('approvalStatus', String(filters.approvalStatus))
  if (filters.dateFromUtc) query.set('dateFromUtc', filters.dateFromUtc)
  if (filters.dateToUtc) query.set('dateToUtc', filters.dateToUtc)
  if (filters.search) query.set('search', filters.search)
  return query.toString()
}

export const timeEntriesApi = {
  clockIn: (payload: ClockInRequestDto) =>
    apiRequest<TimeEntryDto>('/api/time-entries/clock-in', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  clockOut: (payload: ClockOutRequestDto) =>
    apiRequest<TimeEntryDto>('/api/time-entries/clock-out', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getOpen: (employeeId: string) => apiRequest<TimeEntryDto>(`/api/time-entries/open?employeeId=${employeeId}`),
  listByJob: (jobTicketId: string) => apiRequest<TimeEntryDto[]>(`/api/time-entries/job/${jobTicketId}`),
  listForReview: (filters: TimeEntryReviewFilters) => apiRequest<TimeApprovalQueueItemDto[]>(`/api/time-entries/review?${reviewQuery(filters)}`),
  approve: (id: string) =>
    apiRequest<TimeEntryDto>(`/api/time-entries/${id}/approve`, { method: 'POST' }),
  bulkApprove: (timeEntryIds: string[]) =>
    apiRequest<TimeEntryDto[]>('/api/time-entries/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ timeEntryIds })
    }),
  editAndApprove: (id: string, payload: AdjustTimeEntryRequestDto) =>
    apiRequest<TimeEntryDto>(`/api/time-entries/${id}/edit-and-approve`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  reject: (id: string, payload: RejectTimeEntryRequestDto) =>
    apiRequest<TimeEntryDto>(`/api/time-entries/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  adjust: (id: string, payload: AdjustTimeEntryRequestDto) =>
    apiRequest<TimeEntryDto>(`/api/time-entries/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
}
