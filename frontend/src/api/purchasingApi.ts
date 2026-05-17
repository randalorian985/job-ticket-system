import type {
  CreatePurchaseOrderDto,
  PurchaseOrderDto,
  PurchaseOrderListItemDto,
  ReceivePurchaseOrderDto,
  UpdatePurchaseOrderDto
} from '../types'
import { apiRequest } from './httpClient'

export const purchasingApi = {
  listPurchaseOrders: () => apiRequest<PurchaseOrderListItemDto[]>('/api/purchase-orders?includeArchived=true'),
  getPurchaseOrder: (id: string) => apiRequest<PurchaseOrderDto>(`/api/purchase-orders/${id}`),
  createPurchaseOrder: (payload: CreatePurchaseOrderDto) => apiRequest<PurchaseOrderDto>('/api/purchase-orders', { method: 'POST', body: JSON.stringify(payload) }),
  updatePurchaseOrder: (id: string, payload: UpdatePurchaseOrderDto) => apiRequest<PurchaseOrderDto>(`/api/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  submitPurchaseOrder: (id: string) => apiRequest<PurchaseOrderDto>(`/api/purchase-orders/${id}/submit`, { method: 'POST' }),
  receivePurchaseOrder: (id: string, payload: ReceivePurchaseOrderDto) => apiRequest<PurchaseOrderDto>(`/api/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify(payload) }),
  cancelPurchaseOrder: (id: string) => apiRequest<PurchaseOrderDto>(`/api/purchase-orders/${id}/cancel`, { method: 'POST' }),
  archivePurchaseOrder: (id: string) => apiRequest<void>(`/api/purchase-orders/${id}/archive`, { method: 'POST' }),
  unarchivePurchaseOrder: (id: string) => apiRequest<void>(`/api/purchase-orders/${id}/unarchive`, { method: 'POST' })
}
