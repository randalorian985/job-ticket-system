import { apiRequest } from './httpClient'

export type CreatePartRequestDto = {
  partDescription: string
  quantity: number
  notes?: string | null
  urgency?: string | null
  neededByUtc?: string | null
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
  status: number
  requestedAtUtc: string
  requestedByEmployeeId?: string | null
  approvedAtUtc?: string | null
  rejectedAtUtc?: string | null
  rejectionReason?: string | null
}

export const partRequestsApi = {
  createForJobTicket: (jobTicketId: string, payload: CreatePartRequestDto) =>
    apiRequest<PartRequestDto>(`/api/part-requests/job-ticket/${jobTicketId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  listQueue: () => apiRequest<PartRequestDto[]>('/api/part-requests'),
  get: (partRequestId: string) => apiRequest<PartRequestDto>(`/api/part-requests/${partRequestId}`),
  update: (partRequestId: string, payload: UpdatePartRequestDto) =>
    apiRequest<PartRequestDto>(`/api/part-requests/${partRequestId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
}
