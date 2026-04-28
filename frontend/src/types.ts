export type ApiValidationError = {
  error?: string
  errors?: Record<string, string[]>
}

export type AuthLoginRequestDto = {
  usernameOrEmail: string
  password: string
}

export type AuthMeDto = {
  employeeId: string
  username: string
  email?: string | null
  firstName: string
  lastName: string
  role: string
}

export type AuthLoginResponseDto = {
  accessToken: string
  expiresAtUtc: string
  user: AuthMeDto
}

export type JobTicketListItemDto = {
  id: string
  ticketNumber: string
  title: string
  status: number
  priority: number
  customerId: string
  serviceLocationId: string
  requestedAtUtc?: string | null
  scheduledStartAtUtc?: string | null
  dueAtUtc?: string | null
  completedAtUtc?: string | null
}

export type JobTicketDto = {
  id: string
  ticketNumber: string
  customerId: string
  serviceLocationId: string
  billingPartyCustomerId: string
  equipmentId?: string | null
  title: string
  description?: string | null
  jobType?: string | null
  priority: number
  status: number
  requestedAtUtc?: string | null
  scheduledStartAtUtc?: string | null
  dueAtUtc?: string | null
  completedAtUtc?: string | null
  assignedManagerEmployeeId?: string | null
  purchaseOrderNumber?: string | null
  billingContactName?: string | null
  billingContactPhone?: string | null
  billingContactEmail?: string | null
  internalNotes?: string | null
  customerFacingNotes?: string | null
  archiveReason?: string | null
}



export type CreateJobTicketDto = {
  customerId: string
  serviceLocationId: string
  billingPartyCustomerId: string
  equipmentId?: string | null
  title: string
  description?: string | null
  jobType?: string | null
  priority: number
  status: number
  requestedAtUtc?: string | null
  scheduledStartAtUtc?: string | null
  dueAtUtc?: string | null
  assignedManagerEmployeeId?: string | null
  purchaseOrderNumber?: string | null
  billingContactName?: string | null
  billingContactPhone?: string | null
  billingContactEmail?: string | null
  internalNotes?: string | null
  customerFacingNotes?: string | null
}

export type UpdateJobTicketDto = CreateJobTicketDto

export type AddJobTicketAssignmentDto = {
  employeeId: string
  isLead?: boolean
}

export type ChangeJobTicketStatusDto = {
  status: number
}

export type ArchiveJobTicketDto = {
  archiveReason: string
}

export type JobTicketAssignmentDto = {
  jobTicketId: string
  employeeId: string
  assignedAtUtc: string
  isLead: boolean
}

export type JobWorkEntryDto = {
  id: string
  jobTicketId: string
  employeeId?: string | null
  entryType: number
  notes: string
  performedAtUtc: string
}

export type AddJobWorkEntryDto = {
  employeeId?: string | null
  entryType: number
  notes: string
  performedAtUtc?: string | null
}

export type JobTicketPartDto = {
  id: string
  jobTicketId: string
  partId: string
  equipmentId?: string | null
  quantity: number
  unitCostSnapshot?: number
  salePriceSnapshot?: number
  componentCategory?: string | null
  failureDescription?: string | null
  repairDescription?: string | null
  technicianNotes?: string | null
  installedAtUtc?: string | null
  wasSuccessful?: boolean | null
  removedAtUtc?: string | null
  replacedByJobTicketPartId?: string | null
  compatibilityNotes?: string | null
  notes?: string | null
  isBillable: boolean
  approvalStatus: number
  addedAtUtc: string
  addedByEmployeeId?: string | null
  approvedByUserId?: string | null
  approvedAtUtc?: string | null
  rejectedByUserId?: string | null
  rejectedAtUtc?: string | null
  rejectionReason?: string | null
}

export type AddJobTicketPartDto = {
  partId: string
  quantity: number
  notes?: string | null
  isBillable: boolean
  addedByEmployeeId?: string | null
  addedAtUtc?: string | null
  adjustInventory?: boolean
  allowManagerOverride?: boolean
  equipmentId?: string | null
  componentCategory?: string | null
  failureDescription?: string | null
  repairDescription?: string | null
  technicianNotes?: string | null
  installedAtUtc?: string | null
  wasSuccessful?: boolean | null
  removedAtUtc?: string | null
  replacedByJobTicketPartId?: string | null
  compatibilityNotes?: string | null
}

export type RejectJobTicketPartDto = {
  rejectionReason: string
  rejectedByUserId?: string | null
  allowManagerOverride?: boolean
}

export type TimeEntryDto = {
  id: string
  jobTicketId: string
  employeeId: string
  startedAtUtc: string
  endedAtUtc?: string | null
  totalMinutes?: number | null
  laborHours: number
  billableHours: number
  approvalStatus: number
  approvedByUserId?: string | null
  approvedAtUtc?: string | null
  rejectionReason?: string | null
  clockInLatitude: number
  clockInLongitude: number
  clockInAccuracy?: number | null
  clockOutLatitude?: number | null
  clockOutLongitude?: number | null
  clockOutAccuracy?: number | null
  workSummary?: string | null
  clockInNote?: string | null
  clockOutNote?: string | null
  clockInDeviceMetadata?: string | null
}

export type ClockInRequestDto = {
  jobTicketId: string
  employeeId: string
  clockInLatitude?: number
  clockInLongitude?: number
  clockInAccuracy?: number
  deviceMetadata: string
  note?: string | null
}

export type ClockOutRequestDto = {
  timeEntryId: string
  employeeId: string
  clockOutLatitude?: number
  clockOutLongitude?: number
  clockOutAccuracy?: number
  workSummary: string
  note?: string | null
}

export type ApproveTimeEntryRequestDto = {
  approvedByUserId: string
}

export type RejectTimeEntryRequestDto = {
  rejectedByUserId: string
  reason: string
}

export type AdjustTimeEntryRequestDto = {
  adjustedByUserId: string
  reason: string
  managerOverride: boolean
  startedAtUtc?: string | null
  endedAtUtc?: string | null
  laborHours?: number | null
  billableHours?: number | null
  hourlyRate?: number | null
  notes?: string | null
}

export type PartDto = {
  id: string
  partCategoryId: string
  vendorId?: string | null
  partNumber: string
  name: string
  description?: string | null
  unitCost: number
  unitPrice: number
  quantityOnHand: number
  reorderThreshold: number
}

export type PartLookupDto = {
  id: string
  partNumber: string
  name: string
  description?: string | null
}

export type JobTicketFileDto = {
  id: string
  jobTicketId: string
  equipmentId?: string | null
  workEntryId?: string | null
  uploadedByEmployeeId?: string | null
  originalFileName: string
  contentType: string
  fileExtension: string
  fileSizeBytes: number
  caption?: string | null
  visibility: number
  isInvoiceAttachment: boolean
  uploadedAtUtc: string
}

export type UpdateJobTicketFileDto = {
  caption?: string | null
  visibility: number
  isInvoiceAttachment: boolean
}

export type CustomerDto = {
  id: string
  name: string
  accountNumber?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
}


export type CreateCustomerDto = {
  name: string
  accountNumber?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
}

export type UpdateCustomerDto = CreateCustomerDto

export type ServiceLocationDto = {
  id: string
  customerId?: string | null
  companyName: string
  locationName: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  country: string
  isActive: boolean
}

export type EquipmentDto = {
  id: string
  customerId: string
  serviceLocationId: string
  ownerCustomerId?: string | null
  responsibleBillingCustomerId?: string | null
  name: string
  equipmentNumber?: string | null
  unitNumber?: string | null
  manufacturer?: string | null
  modelNumber?: string | null
  serialNumber?: string | null
  equipmentType?: string | null
  year?: number | null
}

export type VendorDto = {
  id: string
  name: string
  accountNumber?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
}

export type PartCategoryDto = {
  id: string
  name: string
  description?: string | null
}



export type CreateServiceLocationDto = {
  customerId?: string | null
  companyName: string
  locationName: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  country: string
  isActive?: boolean
}

export type UpdateServiceLocationDto = CreateServiceLocationDto

export type CreateEquipmentDto = {
  customerId: string
  serviceLocationId: string
  ownerCustomerId?: string | null
  responsibleBillingCustomerId?: string | null
  name: string
  equipmentNumber?: string | null
  unitNumber?: string | null
  manufacturer?: string | null
  modelNumber?: string | null
  serialNumber?: string | null
  equipmentType?: string | null
  year?: number | null
}

export type UpdateEquipmentDto = CreateEquipmentDto

export type CreateVendorDto = {
  name: string
  accountNumber?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
}

export type UpdateVendorDto = CreateVendorDto

export type CreatePartCategoryDto = {
  name: string
  description?: string | null
}

export type UpdatePartCategoryDto = CreatePartCategoryDto

export type CreatePartDto = {
  partCategoryId: string
  vendorId?: string | null
  partNumber: string
  name: string
  description?: string | null
  unitCost: number
  unitPrice: number
  quantityOnHand: number
  reorderThreshold: number
}

export type UpdatePartDto = CreatePartDto

export type CreateUserDto = {
  userName: string
  email?: string | null
  firstName: string
  lastName: string
  role: string
  password: string
}

export type UpdateUserDto = {
  userName: string
  email?: string | null
  firstName: string
  lastName: string
  role: string
}

export type ResetPasswordDto = {
  newPassword: string
}

export type UserDto = {
  id: string
  userName?: string | null
  email?: string | null
  firstName: string
  lastName: string
  role: string
  status: number
  isArchived: boolean
}


export type ReportQueryFilters = {
  dateFromUtc?: string
  dateToUtc?: string
  customerId?: string
  billingPartyCustomerId?: string
  serviceLocationId?: string
  employeeId?: string
  jobStatus?: number
  invoiceStatus?: number
  offset?: number
  limit?: number
}

export type JobsReadyToInvoiceItemDto = {
  jobTicketId: string
  jobTicketNumber: string
  customer: string
  billingPartyCustomer: string
  jobStatus: number
  invoiceStatus: number
  approvedLaborHours: number
  approvedPartsCount: number
  estimatedBillableTotal: number
  completedAtUtc?: string | null
}

export type LaborByJobDto = {
  jobTicketId: string
  jobTicketNumber: string
  customer: string
  approvedLaborHours: number
  laborCostTotal: number
  laborBillableTotal: number
}

export type LaborByEmployeeDto = {
  employeeId: string
  employeeName: string
  approvedLaborHours: number
  laborCostTotal: number
  laborBillableTotal: number
  jobCount: number
}

export type PartsByJobDto = {
  jobTicketId: string
  jobTicketNumber: string
  customer: string
  approvedPartQuantity: number
  partsCostTotal: number
  partsBillableTotal: number
}

export type ReportServiceHistoryItemDto = {
  jobTicketId: string
  jobTicketNumber: string
  customerId: string
  customer: string
  equipmentId?: string | null
  equipment?: string | null
  title: string
  jobStatus: number
  createdAtUtc: string
  completedAtUtc?: string | null
}

export type JobCostSummaryDto = {
  jobTicketId: string
  jobTicketNumber: string
  laborHours: number
  laborCostTotal: number
  laborBillableTotal: number
  partsCostTotal: number
  partsBillableTotal: number
  grandTotal: number
}
