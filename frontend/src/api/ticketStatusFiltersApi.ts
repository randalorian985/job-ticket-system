import type { SaveTicketStatusFilterConfigurationDto, TicketStatusFilterOptionDto } from '../types'
import { apiRequest } from './httpClient'

const ticketStatusFiltersPath = '/api/ticket-status-filters'

export const ticketStatusFiltersApi = {
  list: () => apiRequest<TicketStatusFilterOptionDto[]>(ticketStatusFiltersPath),
  save: (payload: SaveTicketStatusFilterConfigurationDto) =>
    apiRequest<TicketStatusFilterOptionDto[]>(ticketStatusFiltersPath, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
}
