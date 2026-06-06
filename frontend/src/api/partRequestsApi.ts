import { apiRequest } from './httpClient'

export type CreatePartRequestDto = {
  partDescription: string
  quantity: number
  notes?: string | null
  urgency?: string | null
  neededByUtc?: string | null
  partId?: string | null
  needsOrdered?: boolean
}

export type UpdatePartRequestDto = {
  partDescription: string
  quantity: number
  status: number
  internalStatusNotes?: string | null
  unitCostSnapshot: number
  salePriceSnapshot: number
  isBillable: boolean
  partId?: string | null
}

export type PartRequestDto = {
  id: string
  jobTicketId: string
  jobTicketNumber: string
  jobTicketTitle: string
  partId?: string | null
  partNumber: string
  partName: string
  quantity: number
  notes?: string | null
  technicianNotes?: string | null
  requestNotes?: string | null
  internalStatusNotes?: string | null
  unitCostSnapshot?: number
  salePriceSnapshot?: number
  isBillable: boolean
  needsOrdered: boolean
  status: number
  requestedAtUtc: string
  requestedByEmployeeId?: string | null
  approvedAtUtc?: string | null
  rejectedAtUtc?: string | null
  rejectionReason?: string | null
}

export type PartRequestQueueFilters = {
  status?: number | ''
  search?: string
}

const buildQueueUrl = (filters?: PartRequestQueueFilters) => {
  const params = new URLSearchParams()
  if (filters?.status !== undefined && filters.status !== '') {
    params.set('status', String(filters.status))
  }
  if (filters?.search?.trim()) {
    params.set('search', filters.search.trim())
  }

  const query = params.toString()
  return query ? `/api/part-requests?${query}` : '/api/part-requests'
}

export const partRequestsApi = {
  createForJobTicket: (jobTicketId: string, payload: CreatePartRequestDto) =>
    apiRequest<PartRequestDto>(`/api/part-requests/job-ticket/${jobTicketId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  listQueue: (filters?: PartRequestQueueFilters) => apiRequest<PartRequestDto[]>(buildQueueUrl(filters)),
  get: (partRequestId: string) => apiRequest<PartRequestDto>(`/api/part-requests/${partRequestId}`),
  update: (partRequestId: string, payload: UpdatePartRequestDto) =>
    apiRequest<PartRequestDto>(`/api/part-requests/${partRequestId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
}
