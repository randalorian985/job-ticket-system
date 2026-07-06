import type { SchedulableTicketDto, ScheduleTicketDto, TechnicianScheduleDto } from '../types'
import { apiRequest } from './httpClient'

export const schedulingApi = {
  getUnscheduled: () =>
    apiRequest<SchedulableTicketDto[]>('/api/scheduling/unscheduled'),

  getCalendar: (startUtc: string, endUtc: string) =>
    apiRequest<SchedulableTicketDto[]>(`/api/scheduling/calendar?startUtc=${encodeURIComponent(startUtc)}&endUtc=${encodeURIComponent(endUtc)}`),

  getByTechnician: (startUtc: string, endUtc: string) =>
    apiRequest<TechnicianScheduleDto[]>(`/api/scheduling/by-technician?startUtc=${encodeURIComponent(startUtc)}&endUtc=${encodeURIComponent(endUtc)}`),

  scheduleTicket: (ticketId: string, payload: ScheduleTicketDto) =>
    apiRequest<void>(`/api/scheduling/${ticketId}/schedule`, { method: 'POST', body: JSON.stringify(payload) })
}
