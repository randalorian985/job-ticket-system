import type { CustomerDto, EquipmentDto, PartCategoryDto, PartDto, ServiceLocationDto, VendorDto } from '../types'
import { apiRequest } from './httpClient'

export const masterDataApi = {
  listCustomers: () => apiRequest<CustomerDto[]>('/api/customers?offset=0&limit=200'),
  getCustomer: (id: string) => apiRequest<CustomerDto>(`/api/customers/${id}`),
  listServiceLocations: () => apiRequest<ServiceLocationDto[]>('/api/service-locations?offset=0&limit=200'),
  getServiceLocation: (id: string) => apiRequest<ServiceLocationDto>(`/api/service-locations/${id}`),
  listEquipment: () => apiRequest<EquipmentDto[]>('/api/equipment?offset=0&limit=200'),
  getEquipment: (id: string) => apiRequest<EquipmentDto>(`/api/equipment/${id}`),
  listVendors: () => apiRequest<VendorDto[]>('/api/vendors?offset=0&limit=200'),
  listPartCategories: () => apiRequest<PartCategoryDto[]>('/api/part-categories?offset=0&limit=200'),
  listParts: () => apiRequest<PartDto[]>('/api/parts?offset=0&limit=200')
}
