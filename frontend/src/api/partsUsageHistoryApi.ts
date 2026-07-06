import type { PartsUsageHistoryItemDto, PartsUsageHistoryQuery } from '../types'
import { apiRequest } from './httpClient'

export const partsUsageHistoryApi = {
  list: (query: PartsUsageHistoryQuery = {}) => {
    const params = new URLSearchParams()
    if (query.equipmentId) params.set('equipmentId', query.equipmentId)
    if (query.partId) params.set('partId', query.partId)
    if (query.customerId) params.set('customerId', query.customerId)
    params.set('offset', String(query.offset ?? 0))
    params.set('limit', String(query.limit ?? 50))

    return apiRequest<PartsUsageHistoryItemDto[]>(`/api/parts/usage-history?${params.toString()}`)
  }
}
