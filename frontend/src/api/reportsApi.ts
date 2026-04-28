import type {
  JobCostSummaryDto,
  JobsReadyToInvoiceItemDto,
  LaborByEmployeeDto,
  LaborByJobDto,
  PartsByJobDto,
  ReportServiceHistoryItemDto
} from '../types'
import { apiRequest } from './httpClient'

export const reportsApi = {
  getCostSummary: (jobTicketId: string) => apiRequest<JobCostSummaryDto>(`/api/reports/job-tickets/${jobTicketId}/cost-summary`),
  getJobsReadyToInvoice: () => apiRequest<JobsReadyToInvoiceItemDto[]>('/api/reports/jobs-ready-to-invoice?offset=0&limit=50'),
  getLaborByJob: () => apiRequest<LaborByJobDto[]>('/api/reports/labor/by-job?offset=0&limit=50'),
  getLaborByEmployee: () => apiRequest<LaborByEmployeeDto[]>('/api/reports/labor/by-employee?offset=0&limit=50'),
  getPartsByJob: () => apiRequest<PartsByJobDto[]>('/api/reports/parts/by-job?offset=0&limit=50'),
  getCustomerHistory: (customerId: string) =>
    apiRequest<ReportServiceHistoryItemDto[]>(`/api/reports/customers/${customerId}/service-history?offset=0&limit=50`),
  getEquipmentHistory: (equipmentId: string) =>
    apiRequest<ReportServiceHistoryItemDto[]>(`/api/reports/equipment/${equipmentId}/service-history?offset=0&limit=50`)
}
