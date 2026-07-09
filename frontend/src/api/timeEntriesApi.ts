import type {
  AdjustTimeEntryRequestDto,
  ArchiveTimeEntryRequestDto,
  ClockInRequestDto,
  ClockOutRequestDto,
  CreateManualTimeEntryRequestDto,
  RejectTimeEntryRequestDto,
  TimeApprovalQueueItemDto,
  TimeEntryDto,
  TravelEndRequestDto,
  TravelStartRequestDto
} from '../types'
import { apiRequest } from './httpClient'

export type TimeEntryReviewFilters = {
  jobTicketId?: string
  employeeId?: string
  approvalStatus?: number
  dateFromUtc?: string
  dateToUtc?: string
  search?: string
  entryType?: number
}

const reviewQuery = (filters: TimeEntryReviewFilters) => {
  const query = new URLSearchParams()
  if (filters.jobTicketId) query.set('jobTicketId', filters.jobTicketId)
  if (filters.employeeId) query.set('employeeId', filters.employeeId)
  if (filters.approvalStatus) query.set('approvalStatus', String(filters.approvalStatus))
  if (filters.dateFromUtc) query.set('dateFromUtc', filters.dateFromUtc)
  if (filters.dateToUtc) query.set('dateToUtc', filters.dateToUtc)
  if (filters.search) query.set('search', filters.search)
  if (filters.entryType) query.set('entryType', String(filters.entryType))
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
  startTravel: (payload: TravelStartRequestDto) =>
    apiRequest<TimeEntryDto>('/api/time-entries/travel-start', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  endTravel: (payload: TravelEndRequestDto) =>
    apiRequest<TimeEntryDto>('/api/time-entries/travel-end', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  createManual: (payload: CreateManualTimeEntryRequestDto) =>
    apiRequest<TimeEntryDto>('/api/time-entries/manual', {
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
    }),
  deleteEntry: (id: string, payload: ArchiveTimeEntryRequestDto) =>
    apiRequest<void>(`/api/time-entries/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(payload)
    })
}
