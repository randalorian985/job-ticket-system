import { apiRequest } from './httpClient'

export type StockLocationDto = {
  id: string
  name: string
  code: string
  description?: string | null
  isActive: boolean
  isArchived: boolean
}

export type CreateStockLocationDto = {
  name: string
  code: string
  description?: string | null
}

export type UpdateStockLocationDto = {
  name: string
  code: string
  description?: string | null
  isActive: boolean
}

export type InventoryStockSummaryDto = {
  stockLocationId: string
  stockLocationName: string
  partId: string
  partNumber: string
  partName: string
  quantityOnHand: number
  lastTransactionAtUtc?: string | null
}

export type InventoryTransactionDto = {
  id: string
  stockLocationId: string
  stockLocationName: string
  partId: string
  partNumber: string
  partName: string
  transactionType: number
  quantityDelta: number
  occurredAtUtc: string
  reason: string
  notes?: string | null
  purchaseOrderNumber?: string | null
}

export type CreateManualInventoryAdjustmentDto = {
  stockLocationId: string
  partId: string
  quantityDelta: number
  reason: string
  notes?: string | null
  occurredAtUtc?: string | null
}

export type CreateInventoryTransferDto = {
  sourceStockLocationId: string
  destinationStockLocationId: string
  partId: string
  quantity: number
  reason: string
  notes?: string | null
  occurredAtUtc?: string | null
}

export type InventoryTransferDto = {
  sourceTransactionId: string
  destinationTransactionId: string
  sourceStockLocationId: string
  sourceStockLocationName: string
  destinationStockLocationId: string
  destinationStockLocationName: string
  partId: string
  partNumber: string
  partName: string
  quantity: number
  occurredAtUtc: string
  reason: string
  notes?: string | null
}

type StockLocationQuery = {
  offset?: number
  limit?: number
  includeArchived?: boolean
}

type InventoryQuery = {
  stockLocationId?: string
  partId?: string
  limit?: number
}

const toQuery = (params: Record<string, string | number | boolean | undefined>) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const inventoryApi = {
  listStockLocations: (query: StockLocationQuery = {}) => apiRequest<StockLocationDto[]>(`/api/inventory/stock-locations${toQuery(query)}`),
  createStockLocation: (payload: CreateStockLocationDto) => apiRequest<StockLocationDto>('/api/inventory/stock-locations', { method: 'POST', body: JSON.stringify(payload) }),
  updateStockLocation: (id: string, payload: UpdateStockLocationDto) => apiRequest<StockLocationDto>(`/api/inventory/stock-locations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archiveStockLocation: (id: string) => apiRequest<void>(`/api/inventory/stock-locations/${id}/archive`, { method: 'POST' }),
  unarchiveStockLocation: (id: string) => apiRequest<void>(`/api/inventory/stock-locations/${id}/unarchive`, { method: 'POST' }),
  listStockSummary: (query: InventoryQuery = {}) => apiRequest<InventoryStockSummaryDto[]>(`/api/inventory/stock${toQuery(query)}`),
  listTransactions: (query: InventoryQuery = {}) => apiRequest<InventoryTransactionDto[]>(`/api/inventory/transactions${toQuery(query)}`),
  createManualAdjustment: (payload: CreateManualInventoryAdjustmentDto) => apiRequest<InventoryTransactionDto>('/api/inventory/adjustments', { method: 'POST', body: JSON.stringify(payload) }),
  createTransfer: (payload: CreateInventoryTransferDto) => apiRequest<InventoryTransferDto>('/api/inventory/transfers', { method: 'POST', body: JSON.stringify(payload) })
}
