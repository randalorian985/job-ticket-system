import type { JobTicketFileDto } from '../types'
import { apiRequest } from './httpClient'

export const filesApi = {
  list: (jobTicketId: string) => apiRequest<JobTicketFileDto[]>(`/api/job-tickets/${jobTicketId}/files`),
  upload: (jobTicketId: string, formData: FormData) =>
    apiRequest<JobTicketFileDto>(`/api/job-tickets/${jobTicketId}/files`, {
      method: 'POST',
      body: formData
    })
}
