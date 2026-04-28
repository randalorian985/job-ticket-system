import type {
  AddJobTicketPartDto,
  AddJobWorkEntryDto,
  ArchiveJobTicketDto,
  ChangeJobTicketStatusDto,
  JobTicketAssignmentDto,
  JobTicketDto,
  JobTicketListItemDto,
  JobTicketPartDto,
  JobWorkEntryDto,
  RejectJobTicketPartDto
} from '../types'
import { apiRequest } from './httpClient'

export const jobTicketsApi = {
  listMine: () => apiRequest<JobTicketListItemDto[]>('/api/job-tickets?offset=0&limit=100'),
  listAll: () => apiRequest<JobTicketListItemDto[]>('/api/job-tickets?offset=0&limit=100'),
  get: (jobTicketId: string) => apiRequest<JobTicketDto>(`/api/job-tickets/${jobTicketId}`),
  changeStatus: (jobTicketId: string, payload: ChangeJobTicketStatusDto) =>
    apiRequest<JobTicketDto>(`/api/job-tickets/${jobTicketId}/status`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  archive: (jobTicketId: string, payload: ArchiveJobTicketDto) =>
    apiRequest<JobTicketDto>(`/api/job-tickets/${jobTicketId}/archive`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  listAssignments: (jobTicketId: string) => apiRequest<JobTicketAssignmentDto[]>(`/api/job-tickets/${jobTicketId}/assignments`),
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
    }),
  approvePart: (jobTicketId: string, jobTicketPartId: string) =>
    apiRequest<JobTicketPartDto>(`/api/job-tickets/${jobTicketId}/parts/${jobTicketPartId}/approve`, {
      method: 'POST',
      body: JSON.stringify({})
    }),
  rejectPart: (jobTicketId: string, jobTicketPartId: string, payload: RejectJobTicketPartDto) =>
    apiRequest<JobTicketPartDto>(`/api/job-tickets/${jobTicketId}/parts/${jobTicketPartId}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
}
