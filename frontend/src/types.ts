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
  notes?: string | null
  isBillable: boolean
  approvalStatus: number
  addedAtUtc: string
  addedByEmployeeId?: string | null
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
  clockInLatitude: number
  clockInLongitude: number
  clockInAccuracy?: number | null
  clockOutLatitude?: number | null
  clockOutLongitude?: number | null
  clockOutAccuracy?: number | null
  workSummary?: string | null
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
