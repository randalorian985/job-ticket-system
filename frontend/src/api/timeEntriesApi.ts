import type { ClockInRequestDto, ClockOutRequestDto, TimeEntryDto } from '../types'
import { apiRequest } from './httpClient'

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
  getOpen: (employeeId: string) => apiRequest<TimeEntryDto>(`/api/time-entries/open?employeeId=${employeeId}`)
}
