import type {
  AddJobTicketPartDto,
  AddJobWorkEntryDto,
  JobTicketDto,
  JobTicketListItemDto,
  JobTicketPartDto,
  JobWorkEntryDto
} from '../types'
import { apiRequest } from './httpClient'

export const jobTicketsApi = {
  listMine: () => apiRequest<JobTicketListItemDto[]>('/api/job-tickets?offset=0&limit=100'),
  get: (jobTicketId: string) => apiRequest<JobTicketDto>(`/api/job-tickets/${jobTicketId}`),
  listWorkEntries: (jobTicketId: string) => apiRequest<JobWorkEntryDto[]>(`/api/job-tickets/${jobTicketId}/work-entries`),
  addWorkEntry: (jobTicketId: string, payload: AddJobWorkEntryDto) =>
    apiRequest<JobWorkEntryDto>(`/api/job-tickets/${jobTicketId}/work-entries`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  listParts: (jobTicketId: string) => apiRequest<JobTicketPartDto[]>(`/api/job-tickets/${jobTicketId}/parts`),
  addPart: (jobTicketId: string, payload: AddJobTicketPartDto) =>
    apiRequest<JobTicketPartDto>(`/api/job-tickets/${jobTicketId}/parts`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
}
