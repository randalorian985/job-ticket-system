import type {
  AddJobTicketAssignmentDto,
  AddJobTicketPartDto,
  AddJobWorkEntryDto,
  ArchiveJobTicketDto,
  ChangeJobTicketStatusDto,
  CreateJobTicketDto,
  JobTicketAssignmentDto,
  JobTicketDto,
  JobTicketListItemDto,
  JobTicketPartDto,
  JobWorkEntryDto,
  RejectJobTicketPartDto,
  UpdateJobTicketDto
} from '../types'
import { apiRequest } from './httpClient'

export const jobTicketsApi = {
  listMine: () => apiRequest<JobTicketListItemDto[]>('/api/job-tickets?offset=0&limit=100'),
  listAll: () => apiRequest<JobTicketListItemDto[]>('/api/job-tickets?offset=0&limit=100'),
  get: (jobTicketId: string) => apiRequest<JobTicketDto>(`/api/job-tickets/${jobTicketId}`),
  create: (payload: CreateJobTicketDto) =>
    apiRequest<JobTicketDto>('/api/job-tickets', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  update: (jobTicketId: string, payload: UpdateJobTicketDto) =>
    apiRequest<JobTicketDto>(`/api/job-tickets/${jobTicketId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
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
  addAssignment: (jobTicketId: string, payload: AddJobTicketAssignmentDto) =>
    apiRequest<JobTicketAssignmentDto>(`/api/job-tickets/${jobTicketId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  removeAssignment: (jobTicketId: string, employeeId: string) =>
    apiRequest<void>(`/api/job-tickets/${jobTicketId}/assignments/${employeeId}`, {
      method: 'DELETE'
    }),
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
