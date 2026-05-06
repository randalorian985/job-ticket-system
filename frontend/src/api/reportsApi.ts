import type {
  InvoiceReadySummaryDto,
  JobCostSummaryDto,
  JobsReadyToInvoiceItemDto,
  LaborByEmployeeDto,
  LaborByJobDto,
  PartsByJobDto,
  ReportQueryFilters,
  ReportServiceHistoryItemDto
} from '../types'
import { apiRequest } from './httpClient'

const toQuery = (filters?: ReportQueryFilters) => {
  const params = new URLSearchParams({ offset: String(filters?.offset ?? 0), limit: String(filters?.limit ?? 50) })
  if (filters?.dateFromUtc) params.set('dateFromUtc', filters.dateFromUtc)
  if (filters?.dateToUtc) params.set('dateToUtc', filters.dateToUtc)
  if (filters?.customerId) params.set('customerId', filters.customerId)
  if (filters?.billingPartyCustomerId) params.set('billingPartyCustomerId', filters.billingPartyCustomerId)
  if (filters?.serviceLocationId) params.set('serviceLocationId', filters.serviceLocationId)
  if (filters?.employeeId) params.set('employeeId', filters.employeeId)
  if (typeof filters?.jobStatus === 'number') params.set('jobStatus', String(filters.jobStatus))
  if (typeof filters?.invoiceStatus === 'number') params.set('invoiceStatus', String(filters.invoiceStatus))
  return params.toString()
}

export const reportsApi = {
  getInvoiceReadySummary: (jobTicketId: string) => apiRequest<InvoiceReadySummaryDto>(`/api/reports/job-tickets/${jobTicketId}/invoice-ready`),
  getCostSummary: (jobTicketId: string) => apiRequest<JobCostSummaryDto>(`/api/reports/job-tickets/${jobTicketId}/cost-summary`),
  getJobsReadyToInvoice: (filters?: ReportQueryFilters) => apiRequest<JobsReadyToInvoiceItemDto[]>(`/api/reports/jobs-ready-to-invoice?${toQuery(filters)}`),
  getLaborByJob: (filters?: ReportQueryFilters) => apiRequest<LaborByJobDto[]>(`/api/reports/labor/by-job?${toQuery(filters)}`),
  getLaborByEmployee: (filters?: ReportQueryFilters) => apiRequest<LaborByEmployeeDto[]>(`/api/reports/labor/by-employee?${toQuery(filters)}`),
  getPartsByJob: (filters?: ReportQueryFilters) => apiRequest<PartsByJobDto[]>(`/api/reports/parts/by-job?${toQuery(filters)}`),
  getCustomerHistory: (customerId: string, filters?: Omit<ReportQueryFilters, 'customerId'>) =>
    apiRequest<ReportServiceHistoryItemDto[]>(`/api/reports/customers/${customerId}/service-history?${toQuery(filters)}`),
  getEquipmentHistory: (equipmentId: string, filters?: ReportQueryFilters) =>
    apiRequest<ReportServiceHistoryItemDto[]>(`/api/reports/equipment/${equipmentId}/service-history?${toQuery(filters)}`)
}
