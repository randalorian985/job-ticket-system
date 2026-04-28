import type { JobTicketFileDto, UpdateJobTicketFileDto } from '../types'
import { apiRequest } from './httpClient'

export const filesApi = {
  list: (jobTicketId: string) => apiRequest<JobTicketFileDto[]>(`/api/job-tickets/${jobTicketId}/files`),
  upload: (jobTicketId: string, formData: FormData) =>
    apiRequest<JobTicketFileDto>(`/api/job-tickets/${jobTicketId}/files`, {
      method: 'POST',
      body: formData
    }),
  update: (jobTicketId: string, fileId: string, payload: UpdateJobTicketFileDto) =>
    apiRequest<JobTicketFileDto>(`/api/job-tickets/${jobTicketId}/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  archive: (jobTicketId: string, fileId: string) =>
    apiRequest<JobTicketFileDto>(`/api/job-tickets/${jobTicketId}/files/${fileId}/archive`, {
      method: 'POST',
      body: JSON.stringify({})
    }),
  getDownloadUrl: (jobTicketId: string, fileId: string) => `/api/job-tickets/${jobTicketId}/files/${fileId}/download`
}
