import type {
  CreateCustomerDto,
  CreateEquipmentDto,
  CreatePartCategoryDto,
  CreatePartDto,
  CreateServiceLocationDto,
  CreateVendorDto,
  CustomerDto,
  EquipmentDto,
  PartCategoryDto,
  PartDto,
  ServiceLocationDto,
  UpdateCustomerDto,
  UpdateEquipmentDto,
  UpdatePartCategoryDto,
  UpdatePartDto,
  UpdateServiceLocationDto,
  UpdateVendorDto,
  VendorDto
} from '../types'
import { apiRequest } from './httpClient'

export const masterDataApi = {
  listCustomers: () => apiRequest<CustomerDto[]>('/api/customers?offset=0&limit=200&includeArchived=true'),
  getCustomer: (id: string) => apiRequest<CustomerDto>(`/api/customers/${id}`),
  createCustomer: (payload: CreateCustomerDto) => apiRequest<CustomerDto>('/api/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id: string, payload: UpdateCustomerDto) => apiRequest<CustomerDto>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archiveCustomer: (id: string) => apiRequest<void>(`/api/customers/${id}/archive`, { method: 'POST' }),
  unarchiveCustomer: (id: string) => apiRequest<void>(`/api/customers/${id}/unarchive`, { method: 'POST' }),

  listServiceLocations: () => apiRequest<ServiceLocationDto[]>('/api/service-locations?offset=0&limit=200&includeArchived=true'),
  getServiceLocation: (id: string) => apiRequest<ServiceLocationDto>(`/api/service-locations/${id}`),
  createServiceLocation: (payload: CreateServiceLocationDto) => apiRequest<ServiceLocationDto>('/api/service-locations', { method: 'POST', body: JSON.stringify(payload) }),
  updateServiceLocation: (id: string, payload: UpdateServiceLocationDto) => apiRequest<ServiceLocationDto>(`/api/service-locations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archiveServiceLocation: (id: string) => apiRequest<void>(`/api/service-locations/${id}/archive`, { method: 'POST' }),
  unarchiveServiceLocation: (id: string) => apiRequest<void>(`/api/service-locations/${id}/unarchive`, { method: 'POST' }),

  listEquipment: () => apiRequest<EquipmentDto[]>('/api/equipment?offset=0&limit=200&includeArchived=true'),
  getEquipment: (id: string) => apiRequest<EquipmentDto>(`/api/equipment/${id}`),
  createEquipment: (payload: CreateEquipmentDto) => apiRequest<EquipmentDto>('/api/equipment', { method: 'POST', body: JSON.stringify(payload) }),
  updateEquipment: (id: string, payload: UpdateEquipmentDto) => apiRequest<EquipmentDto>(`/api/equipment/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archiveEquipment: (id: string) => apiRequest<void>(`/api/equipment/${id}/archive`, { method: 'POST' }),
  unarchiveEquipment: (id: string) => apiRequest<void>(`/api/equipment/${id}/unarchive`, { method: 'POST' }),

  listVendors: () => apiRequest<VendorDto[]>('/api/vendors?offset=0&limit=200&includeArchived=true'),
  createVendor: (payload: CreateVendorDto) => apiRequest<VendorDto>('/api/vendors', { method: 'POST', body: JSON.stringify(payload) }),
  updateVendor: (id: string, payload: UpdateVendorDto) => apiRequest<VendorDto>(`/api/vendors/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archiveVendor: (id: string) => apiRequest<void>(`/api/vendors/${id}/archive`, { method: 'POST' }),
  unarchiveVendor: (id: string) => apiRequest<void>(`/api/vendors/${id}/unarchive`, { method: 'POST' }),

  listPartCategories: () => apiRequest<PartCategoryDto[]>('/api/part-categories?offset=0&limit=200&includeArchived=true'),
  createPartCategory: (payload: CreatePartCategoryDto) => apiRequest<PartCategoryDto>('/api/part-categories', { method: 'POST', body: JSON.stringify(payload) }),
  updatePartCategory: (id: string, payload: UpdatePartCategoryDto) => apiRequest<PartCategoryDto>(`/api/part-categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archivePartCategory: (id: string) => apiRequest<void>(`/api/part-categories/${id}/archive`, { method: 'POST' }),
  unarchivePartCategory: (id: string) => apiRequest<void>(`/api/part-categories/${id}/unarchive`, { method: 'POST' }),

  listParts: () => apiRequest<PartDto[]>('/api/parts?offset=0&limit=200&includeArchived=true'),
  createPart: (payload: CreatePartDto) => apiRequest<PartDto>('/api/parts', { method: 'POST', body: JSON.stringify(payload) }),
  updatePart: (id: string, payload: UpdatePartDto) => apiRequest<PartDto>(`/api/parts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archivePart: (id: string) => apiRequest<void>(`/api/parts/${id}/archive`, { method: 'POST' }),
  unarchivePart: (id: string) => apiRequest<void>(`/api/parts/${id}/unarchive`, { method: 'POST' })
}
