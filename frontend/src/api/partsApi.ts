import type { PartLookupDto } from '../types'
import { apiRequest } from './httpClient'

export const partsApi = {
  list: () => apiRequest<PartLookupDto[]>('/api/parts/lookup?offset=0&limit=200')
}
