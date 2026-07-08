import { expect, test, type Page, type Route } from '@playwright/test'

const fixedNow = '2026-07-08T15:30:00.000Z'
const tokenPayload = Buffer.from(JSON.stringify({ exp: Math.floor(new Date(fixedNow).getTime() / 1000) + 3600 })).toString('base64url')
const fakeToken = `eyJhbGciOiJub25lIn0.${tokenPayload}.sig`

const currentUser = {
  employeeId: 'employee-admin',
  username: 'avery.admin',
  email: 'avery.admin@example.com',
  firstName: 'Avery',
  lastName: 'Admin',
  role: 'Admin'
}

const companyConfiguration = {
  id: 'company-1',
  companyName: 'Job Ticket System',
  legalName: 'Job Ticket System',
  contactName: 'Service Dispatch',
  email: 'dispatch@example.com',
  partOrderRequestsEmail: 'parts@example.com',
  phone: '555-0100',
  website: 'https://dev.mudbugdigital.com',
  addressLine1: '100 Service Way',
  addressLine2: null,
  city: 'Lafayette',
  state: 'LA',
  postalCode: '70501',
  country: 'USA',
  primaryColor: '#3157C8',
  secondaryColor: '#172033',
  accentColor: '#087F5B',
  hasLogo: false,
  logoOriginalFileName: null,
  logoContentType: null,
  logoFileSizeBytes: null,
  logoUploadedAtUtc: null,
  createdAtUtc: '2026-07-01T13:00:00Z',
  updatedAtUtc: '2026-07-08T13:00:00Z',
  newTicketNotificationsEnabled: true,
  newTicketNotificationMinimumPriority: 1
}

const customers = [
  {
    id: 'customer-1',
    name: 'Acme Manufacturing',
    accountNumber: 'ACME-001',
    contactName: 'Alex Morgan',
    email: 'alex@example.com',
    phone: '555-0101',
    isArchived: false
  },
  {
    id: 'customer-2',
    name: 'Bayou Foods',
    accountNumber: 'BAY-002',
    contactName: 'Riley Chen',
    email: 'riley@example.com',
    phone: '555-0102',
    isArchived: false
  }
]

const serviceLocations = [
  {
    id: 'location-1',
    customerId: 'customer-1',
    companyName: 'Acme Manufacturing',
    locationName: 'Main Plant',
    addressLine1: '100 Plant Road',
    city: 'Lafayette',
    state: 'LA',
    postalCode: '70501',
    isActive: true,
    isArchived: false
  },
  {
    id: 'location-2',
    customerId: 'customer-2',
    companyName: 'Bayou Foods',
    locationName: 'Cold Storage',
    addressLine1: '40 Dock Street',
    city: 'Baton Rouge',
    state: 'LA',
    postalCode: '70801',
    isActive: true,
    isArchived: false
  }
]

const equipment = [
  {
    id: 'equipment-1',
    customerId: 'customer-1',
    serviceLocationId: 'location-1',
    name: 'Compressor A',
    equipmentNumber: 'CMP-100',
    serialNumber: 'SN-100',
    isArchived: false
  },
  {
    id: 'equipment-2',
    customerId: 'customer-2',
    serviceLocationId: 'location-2',
    name: 'Freezer Line 2',
    equipmentNumber: 'FRZ-200',
    serialNumber: 'SN-200',
    isArchived: false
  }
]

const jobs = [
  {
    id: 'job-1',
    ticketNumber: 'JT-2026-000003',
    title: 'Set scheduled start time',
    status: 2,
    priority: 3,
    customerId: 'customer-1',
    serviceLocationId: 'location-1',
    customerName: 'Acme Manufacturing',
    serviceLocationName: 'Main Plant',
    equipmentId: 'equipment-1',
    equipmentName: 'Compressor A',
    requestedAtUtc: '2026-07-08T13:00:00Z',
    scheduledStartAtUtc: null,
    dueAtUtc: '2026-07-10T18:00:00Z',
    completedAtUtc: null
  },
  {
    id: 'job-2',
    ticketNumber: 'JT-2026-000004',
    title: 'Replace pressure sensor',
    status: 3,
    priority: 2,
    customerId: 'customer-1',
    serviceLocationId: 'location-1',
    customerName: 'Acme Manufacturing',
    serviceLocationName: 'Main Plant',
    equipmentId: 'equipment-1',
    equipmentName: 'Compressor A',
    requestedAtUtc: '2026-07-07T13:00:00Z',
    scheduledStartAtUtc: '2026-07-08T17:00:00Z',
    dueAtUtc: null,
    completedAtUtc: null
  },
  {
    id: 'job-3',
    ticketNumber: 'JT-2026-000005',
    title: 'Cold storage temperature drift',
    status: 4,
    priority: 4,
    customerId: 'customer-2',
    serviceLocationId: 'location-2',
    customerName: 'Bayou Foods',
    serviceLocationName: 'Cold Storage',
    equipmentId: 'equipment-2',
    equipmentName: 'Freezer Line 2',
    requestedAtUtc: '2026-07-06T13:00:00Z',
    scheduledStartAtUtc: '2026-07-08T19:00:00Z',
    dueAtUtc: '2026-07-09T16:00:00Z',
    completedAtUtc: null
  },
  {
    id: 'job-4',
    ticketNumber: 'JT-2026-000006',
    title: 'Await replacement fan motor',
    status: 5,
    priority: 2,
    customerId: 'customer-2',
    serviceLocationId: 'location-2',
    customerName: 'Bayou Foods',
    serviceLocationName: 'Cold Storage',
    equipmentId: 'equipment-2',
    equipmentName: 'Freezer Line 2',
    requestedAtUtc: '2026-07-05T13:00:00Z',
    scheduledStartAtUtc: '2026-07-09T14:00:00Z',
    dueAtUtc: '2026-07-11T18:00:00Z',
    completedAtUtc: null
  },
  {
    id: 'job-5',
    ticketNumber: 'JT-2026-000007',
    title: 'Review completed repair',
    status: 7,
    priority: 2,
    customerId: 'customer-1',
    serviceLocationId: 'location-1',
    customerName: 'Acme Manufacturing',
    serviceLocationName: 'Main Plant',
    equipmentId: 'equipment-1',
    equipmentName: 'Compressor A',
    requestedAtUtc: '2026-07-01T13:00:00Z',
    scheduledStartAtUtc: '2026-07-02T14:00:00Z',
    dueAtUtc: '2026-07-03T18:00:00Z',
    completedAtUtc: '2026-07-04T18:00:00Z'
  },
  {
    id: 'job-6',
    ticketNumber: 'JT-2026-000008',
    title: 'Draft future service',
    status: 1,
    priority: 1,
    customerId: 'customer-1',
    serviceLocationId: 'location-1',
    customerName: 'Acme Manufacturing',
    serviceLocationName: 'Main Plant',
    equipmentId: 'equipment-1',
    equipmentName: 'Compressor A',
    requestedAtUtc: '2026-07-08T13:00:00Z',
    scheduledStartAtUtc: null,
    dueAtUtc: null,
    completedAtUtc: null
  }
]

const assignmentsByJob: Record<string, Array<Record<string, unknown>>> = {
  'job-1': [
    { jobTicketId: 'job-1', employeeId: 'employee-1', employeeName: 'Morgan Manager', assignedAtUtc: '2026-07-08T13:10:00Z', isLead: true }
  ],
  'job-2': [
    { jobTicketId: 'job-2', employeeId: 'employee-2', employeeName: 'Taylor Tech', assignedAtUtc: '2026-07-08T13:20:00Z', isLead: false }
  ],
  'job-3': [
    { jobTicketId: 'job-3', employeeId: 'employee-3', employeeName: 'Jordan Lead', assignedAtUtc: '2026-07-08T13:30:00Z', isLead: true }
  ],
  'job-4': [
    { jobTicketId: 'job-4', employeeId: 'employee-4', employeeName: 'Casey Tech', assignedAtUtc: '2026-07-08T13:40:00Z', isLead: true }
  ],
  'job-5': [],
  'job-6': []
}

const ticketStatusFilters = [
  { id: 'status-1', displayLabel: 'Draft', status: 1, displayOrder: 1, isActive: true },
  { id: 'status-2', displayLabel: 'Submitted', status: 2, displayOrder: 2, isActive: true },
  { id: 'status-3', displayLabel: 'Assigned', status: 3, displayOrder: 3, isActive: true },
  { id: 'status-4', displayLabel: 'In progress', status: 4, displayOrder: 4, isActive: true },
  { id: 'status-5', displayLabel: 'Waiting on parts', status: 5, displayOrder: 5, isActive: true },
  { id: 'status-7', displayLabel: 'Completed / review-ready', status: 7, displayOrder: 7, isActive: true },
  { id: 'status-10', displayLabel: 'Invoice-ready', status: 10, displayOrder: 10, isActive: true }
]

const users = [
  {
    id: 'user-1',
    userName: 'avery.admin',
    email: 'avery.admin@example.com',
    firstName: 'Avery',
    lastName: 'Admin',
    role: 'Admin',
    status: 1,
    isArchived: false
  },
  {
    id: 'user-2',
    userName: 'morgan.manager',
    email: 'morgan.manager@example.com',
    firstName: 'Morgan',
    lastName: 'Manager',
    role: 'Manager',
    status: 1,
    isArchived: false
  },
  {
    id: 'user-3',
    userName: 'taylor.tech',
    email: 'taylor.tech@example.com',
    firstName: 'Taylor',
    lastName: 'Tech',
    role: 'Employee',
    status: 1,
    isArchived: false
  }
]

const assignableEmployees = users.map((user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  userName: user.userName,
  role: user.role
}))

const mailerConfiguration = {
  id: 'mailer-1',
  provider: 'Microsoft365',
  enabled: true,
  configurationSource: 'Database',
  isConfigured: true,
  status: 'Ready',
  statusMessage: 'Connected via Microsoft 365 Graph.',
  fromName: 'Service Dispatch',
  fromAddress: null,
  replyToAddress: 'dispatch@example.com',
  smtpHost: null,
  smtpPort: 587,
  smtpEnableSsl: true,
  smtpUsername: null,
  smtpPasswordSet: false,
  microsoft365TenantId: 'contoso.onmicrosoft.com',
  microsoft365ClientId: '00000000-0000-0000-0000-000000000000',
  microsoft365SenderEmail: 'dispatch@example.com',
  microsoft365ClientSecretSet: true,
  appBaseUrl: 'https://dev.mudbugdigital.com',
  lastTestedAtUtc: '2026-07-08T15:30:00Z',
  lastTestSucceeded: true,
  lastTestMessage: 'Test email sent.',
  updatedAtUtc: '2026-07-08T15:30:00Z'
}

const scheduleTickets = [
  {
    id: 'job-1',
    ticketNumber: 'JT-2026-000003',
    title: 'Set scheduled start time',
    status: 2,
    priority: 3,
    customerName: 'Acme Manufacturing',
    serviceLocationName: 'Main Plant',
    equipmentName: 'Compressor A',
    requestedAtUtc: '2026-07-08T13:00:00Z',
    scheduledStartAtUtc: null,
    dueAtUtc: '2026-07-10T18:00:00Z',
    estimatedDurationMinutes: 120,
    assignedManagerEmployeeName: 'Morgan Manager'
  },
  {
    id: 'job-2',
    ticketNumber: 'JT-2026-000004',
    title: 'Replace pressure sensor',
    status: 3,
    priority: 2,
    customerName: 'Acme Manufacturing',
    serviceLocationName: 'Main Plant',
    equipmentName: 'Compressor A',
    requestedAtUtc: '2026-07-07T13:00:00Z',
    scheduledStartAtUtc: '2026-07-08T17:00:00Z',
    dueAtUtc: '2026-07-09T18:00:00Z',
    estimatedDurationMinutes: 180,
    assignedManagerEmployeeName: 'Morgan Manager'
  }
]

const jobDetailsById: Record<string, Record<string, unknown>> = {
  'job-1': {
    ...jobs[0],
    billingPartyCustomerId: 'customer-1',
    billingPartyCustomerName: 'Acme Manufacturing',
    customerFacingNotes: 'Customer requested a morning arrival window.',
    description: 'Inspect compressor controls, confirm restart sequence, and document any parts needed before dispatch.',
    estimatedDurationMinutes: 120,
    internalNotes: 'Dispatch should confirm access with plant security before scheduling.',
    jobType: 'Repair',
    locationType: 1,
    purchaseOrderNumber: 'PO-7751'
  }
}

const catalogParts = [
  {
    id: 'part-1',
    partCategoryId: 'category-1',
    partNumber: 'CMP-FILTER',
    name: 'Compressor intake filter',
    description: 'Standard intake filter',
    unitCost: 18,
    unitPrice: 36,
    quantityOnHand: 4,
    reorderThreshold: 2,
    isArchived: false
  },
  {
    id: 'part-2',
    partCategoryId: 'category-1',
    partNumber: 'SENSOR-24V',
    name: '24V pressure sensor',
    description: 'Pressure sensor for compressor control panel',
    unitCost: 42,
    unitPrice: 85,
    quantityOnHand: 0,
    reorderThreshold: 1,
    isArchived: false
  }
]

const workEntriesByJob: Record<string, Array<Record<string, unknown>>> = {
  'job-1': [
    {
      id: 'work-1',
      jobTicketId: 'job-1',
      employeeId: 'user-3',
      entryType: 1,
      notes: 'Verified compressor lockout and checked intake filter condition.',
      performedAtUtc: '2026-07-08T14:05:00Z'
    }
  ]
}

const timeEntriesByJob: Record<string, Array<Record<string, unknown>>> = {
  'job-1': [
    {
      id: 'time-1',
      jobTicketId: 'job-1',
      employeeId: 'user-3',
      startedAtUtc: '2026-07-08T14:00:00Z',
      endedAtUtc: '2026-07-08T15:00:00Z',
      totalMinutes: 60,
      laborHours: 1,
      billableHours: 1,
      approvalStatus: 1,
      clockInLatitude: 30.2241,
      clockInLongitude: -92.0198,
      workSummary: 'Initial diagnostic completed.'
    }
  ]
}

const jobPartsByJob: Record<string, Array<Record<string, unknown>>> = {
  'job-1': [
    {
      id: 'ticket-part-1',
      jobTicketId: 'job-1',
      partId: 'part-1',
      partNumber: 'CMP-FILTER',
      partName: 'Compressor intake filter',
      isUnlistedPart: false,
      officeOrderRequested: false,
      quantity: 1,
      unitCostSnapshot: 18,
      salePriceSnapshot: 36,
      notes: 'May be replaced during scheduled visit.',
      isBillable: true,
      approvalStatus: 1,
      addedAtUtc: '2026-07-08T14:20:00Z',
      addedByEmployeeId: 'user-3'
    },
    {
      id: 'ticket-part-2',
      jobTicketId: 'job-1',
      partId: 'part-2',
      partNumber: 'SENSOR-24V',
      partName: '24V pressure sensor',
      isUnlistedPart: false,
      officeOrderRequested: true,
      officeOrderNotes: 'Keep one ready if diagnostics confirm failure.',
      quantity: 1,
      unitCostSnapshot: 42,
      salePriceSnapshot: 85,
      notes: 'Potential follow-up part.',
      isBillable: true,
      approvalStatus: 0,
      addedAtUtc: '2026-07-08T14:25:00Z',
      addedByEmployeeId: 'user-3'
    }
  ]
}

const filesByJob: Record<string, Array<Record<string, unknown>>> = {
  'job-1': [
    {
      id: 'file-1',
      jobTicketId: 'job-1',
      originalFileName: 'compressor-control-panel.jpg',
      contentType: 'image/jpeg',
      fileSizeBytes: 248000,
      uploadedAtUtc: '2026-07-08T14:35:00Z',
      caption: 'Control panel before service.',
      isInvoiceAttachment: true
    }
  ]
}

const timelineByJob: Record<string, Array<Record<string, unknown>>> = {
  'job-1': [
    {
      id: 'timeline-1',
      occurredAtUtc: '2026-07-08T13:00:00Z',
      actionType: 'Created',
      entityName: 'JobTicket',
      description: 'Ticket submitted by dispatch.',
      actorName: 'Avery Admin'
    },
    {
      id: 'timeline-2',
      occurredAtUtc: '2026-07-08T13:10:00Z',
      actionType: 'Assigned',
      entityName: 'JobTicketAssignment',
      description: 'Morgan Manager assigned as lead technician.',
      actorName: 'Avery Admin'
    }
  ]
}

const invoiceReadyByJob: Record<string, Record<string, unknown>> = {
  'job-1': {
    jobTicketId: 'job-1',
    jobTicketNumber: 'JT-2026-000003',
    customer: 'Acme Manufacturing',
    billingPartyCustomer: 'Acme Manufacturing',
    serviceLocation: 'Main Plant',
    equipment: 'Compressor A',
    jobStatus: 2,
    invoiceStatus: 1,
    customerFacingNotes: 'Customer requested a morning arrival window.',
    workDescriptions: ['Initial diagnostic completed.'],
    approvedLaborEntries: [
      {
        timeEntryId: 'time-1',
        employeeId: 'user-3',
        employeeName: 'Taylor Tech',
        laborHours: 1,
        billableHours: 1,
        costRate: 40,
        billRate: 95
      }
    ],
    approvedParts: [
      {
        jobTicketPartId: 'ticket-part-1',
        partId: 'part-1',
        partNumber: 'CMP-FILTER',
        partName: 'Compressor intake filter',
        quantity: 1,
        unitCostSnapshot: 18,
        unitPriceSnapshot: 36
      }
    ],
    laborHours: 1,
    laborCostTotal: 40,
    laborBillableTotal: 95,
    partsCostTotal: 18,
    partsBillableTotal: 36,
    miscCharges: 0,
    tax: 0,
    grandTotal: 131,
    purchaseOrderNumber: 'PO-7751',
    billingContactName: 'Alex Morgan',
    billingContactPhone: '555-0101',
    billingContactEmail: 'alex@example.com'
  }
}

const equipmentHistoryById: Record<string, Array<Record<string, unknown>>> = {
  'equipment-1': [
    {
      jobTicketId: 'job-5',
      jobTicketNumber: 'JT-2026-000007',
      customerId: 'customer-1',
      customer: 'Acme Manufacturing',
      equipmentId: 'equipment-1',
      equipment: 'Compressor A',
      title: 'Review completed repair',
      jobStatus: 7,
      createdAtUtc: '2026-07-01T13:00:00Z',
      completedAtUtc: '2026-07-04T18:00:00Z'
    }
  ]
}

function json(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body)
  }
}

async function installVisualMocks(page: Page) {
  await page.addInitScript(({ token, now }) => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('jobTicket.accessToken', token)

    const fixedTime = new Date(now).getTime()
    const RealDate = Date

    class FixedDate extends RealDate {
      constructor(...args: ConstructorParameters<typeof Date>) {
        if (args.length === 0) {
          super(fixedTime)
        } else {
          super(...args)
        }
      }

      static now() {
        return fixedTime
      }
    }

    Object.setPrototypeOf(FixedDate, RealDate)
    window.Date = FixedDate as DateConstructor
  }, { token: fakeToken, now: fixedNow })

  await page.route('**/*', async (route) => routeApi(route))
}

async function routeApi(route: Route) {
  const request = route.request()
  const url = new URL(request.url())

  if (!url.pathname.startsWith('/api/')) {
    await route.continue()
    return
  }

  if (url.pathname === '/api/auth/me') {
    await route.fulfill(json(currentUser))
    return
  }

  if (url.pathname === '/api/company-configuration') {
    await route.fulfill(json(companyConfiguration))
    return
  }

  if (url.pathname === '/api/job-tickets') {
    await route.fulfill(json(jobs))
    return
  }

  const jobMatch = url.pathname.match(/^\/api\/job-tickets\/([^/]+)$/)
  if (jobMatch) {
    await route.fulfill(json(jobDetailsById[jobMatch[1]] ?? jobs.find((job) => job.id === jobMatch[1]) ?? {}))
    return
  }

  const assignmentMatch = url.pathname.match(/^\/api\/job-tickets\/([^/]+)\/assignments$/)
  if (assignmentMatch) {
    await route.fulfill(json(assignmentsByJob[assignmentMatch[1]] ?? []))
    return
  }

  const workEntriesMatch = url.pathname.match(/^\/api\/job-tickets\/([^/]+)\/work-entries$/)
  if (workEntriesMatch) {
    await route.fulfill(json(workEntriesByJob[workEntriesMatch[1]] ?? []))
    return
  }

  const jobPartsMatch = url.pathname.match(/^\/api\/job-tickets\/([^/]+)\/parts$/)
  if (jobPartsMatch) {
    await route.fulfill(json(jobPartsByJob[jobPartsMatch[1]] ?? []))
    return
  }

  const filesMatch = url.pathname.match(/^\/api\/job-tickets\/([^/]+)\/files$/)
  if (filesMatch) {
    await route.fulfill(json(filesByJob[filesMatch[1]] ?? []))
    return
  }

  const timelineMatch = url.pathname.match(/^\/api\/job-tickets\/([^/]+)\/timeline$/)
  if (timelineMatch) {
    await route.fulfill(json(timelineByJob[timelineMatch[1]] ?? []))
    return
  }

  const timeEntriesMatch = url.pathname.match(/^\/api\/time-entries\/job\/([^/]+)$/)
  if (timeEntriesMatch) {
    await route.fulfill(json(timeEntriesByJob[timeEntriesMatch[1]] ?? []))
    return
  }

  if (url.pathname === '/api/customers') {
    await route.fulfill(json(customers))
    return
  }

  if (url.pathname === '/api/service-locations') {
    await route.fulfill(json(serviceLocations))
    return
  }

  if (url.pathname === '/api/equipment') {
    await route.fulfill(json(equipment))
    return
  }

  if (url.pathname === '/api/parts') {
    await route.fulfill(json(catalogParts))
    return
  }

  if (url.pathname === '/api/ticket-status-filters') {
    await route.fulfill(json(ticketStatusFilters))
    return
  }

  if (url.pathname === '/api/users/assignable-employees') {
    await route.fulfill(json(assignableEmployees))
    return
  }

  if (url.pathname === '/api/users') {
    await route.fulfill(json(users))
    return
  }

  if (url.pathname === '/api/mailer-configuration') {
    await route.fulfill(json(mailerConfiguration))
    return
  }

  if (url.pathname === '/api/scheduling/unscheduled' || url.pathname === '/api/scheduling/calendar') {
    await route.fulfill(json(scheduleTickets))
    return
  }

  if (url.pathname === '/api/scheduling/by-technician') {
    await route.fulfill(json([
      {
        employeeId: 'employee-3',
        employeeName: 'Jordan Lead',
        tickets: [scheduleTickets[1]]
      }
    ]))
    return
  }

  const invoiceReadyMatch = url.pathname.match(/^\/api\/reports\/job-tickets\/([^/]+)\/invoice-ready$/)
  if (invoiceReadyMatch) {
    await route.fulfill(json(invoiceReadyByJob[invoiceReadyMatch[1]] ?? null))
    return
  }

  const equipmentHistoryMatch = url.pathname.match(/^\/api\/reports\/equipment\/([^/]+)\/service-history$/)
  if (equipmentHistoryMatch) {
    await route.fulfill(json(equipmentHistoryById[equipmentHistoryMatch[1]] ?? []))
    return
  }

  if (url.pathname.startsWith('/api/reports/')) {
    await route.fulfill(json([]))
    return
  }

  await route.fulfill(json({}))
}

async function openVisualPage(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `
  })
}

async function auditHoverContrast(page: Page, pageName: string) {
  const hoverTargets = page.locator([
    'button:not(:disabled)',
    'a[href]',
    'summary',
    '[role="button"]',
    '[role="radio"]',
    '[role="tab"]',
    '.operations-queue-link',
    '.ticket-list-item',
    '.record-row',
    '.report-card',
    '.report-run-card',
    '.master-data-item',
    '.approval-review-list > li',
    '.schedule-ticket-card',
    '.schedule-compact-row'
  ].join(', '))
  const failures: string[] = []
  const count = await hoverTargets.count()

  for (let index = 0; index < count; index += 1) {
    const target = hoverTargets.nth(index)
    if (!(await target.isVisible().catch(() => false))) continue

    const box = await target.boundingBox()
    if (!box || box.width < 2 || box.height < 2) continue

    const isDisabled = await target.evaluate((element) =>
      element instanceof HTMLButtonElement || element instanceof HTMLInputElement
        ? element.disabled
        : element.getAttribute('aria-disabled') === 'true'
    )
    if (isDisabled) continue

    await target.hover()
    await page.waitForTimeout(10)

    const elementFailures = await target.evaluate((element, targetIndex) => {
      type Rgba = { r: number; g: number; b: number; a: number }

      const parseColor = (value: string): Rgba | null => {
        const match = value.match(/rgba?\(([^)]+)\)/i)
        if (!match) return null

        const parts = match[1].split(',').map((part) => part.trim())
        if (parts.length < 3) return null

        const parseChannel = (part: string) => {
          const numeric = Number.parseFloat(part)
          return part.endsWith('%') ? Math.round((numeric / 100) * 255) : numeric
        }

        return {
          r: parseChannel(parts[0]),
          g: parseChannel(parts[1]),
          b: parseChannel(parts[2]),
          a: parts.length >= 4 ? Number.parseFloat(parts[3]) : 1
        }
      }

      const blend = (foreground: Rgba, background: Rgba): Rgba => {
        const alpha = foreground.a + background.a * (1 - foreground.a)
        if (alpha <= 0) return { r: 255, g: 255, b: 255, a: 1 }

        return {
          r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
          g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
          b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
          a: alpha
        }
      }

      const effectiveBackground = (node: Element): Rgba => {
        const chain: Element[] = []
        let current: Element | null = node

        while (current) {
          chain.unshift(current)
          current = current.parentElement
        }

        return chain.reduce((background, item) => {
          const parsed = parseColor(getComputedStyle(item).backgroundColor)
          return parsed && parsed.a > 0 ? blend(parsed, background) : background
        }, { r: 255, g: 255, b: 255, a: 1 })
      }

      const luminance = (color: Rgba) => {
        const channels = [color.r, color.g, color.b].map((channel) => {
          const value = channel / 255
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        })

        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
      }

      const contrast = (foreground: Rgba, background: Rgba) => {
        const light = Math.max(luminance(foreground), luminance(background))
        const dark = Math.min(luminance(foreground), luminance(background))
        return (light + 0.05) / (dark + 0.05)
      }

      const isVisible = (node: Element) => {
        const styles = getComputedStyle(node)
        const rect = node.getBoundingClientRect()
        return rect.width > 0 &&
          rect.height > 0 &&
          styles.display !== 'none' &&
          styles.visibility !== 'hidden' &&
          Number(styles.opacity) !== 0
      }

      const ownText = (node: Element) => Array.from(node.childNodes)
        .filter((child) => child.nodeType === Node.TEXT_NODE)
        .map((child) => child.textContent?.replace(/\s+/g, ' ').trim() ?? '')
        .filter(Boolean)
        .join(' ')

      return [element, ...Array.from(element.querySelectorAll('*'))]
        .filter((node) => isVisible(node))
        .map((node) => {
          const text = ownText(node)
          if (!text) return null

          const styles = getComputedStyle(node)
          const color = parseColor(styles.color)
          if (!color) return null

          const ratio = contrast(color, effectiveBackground(node))
          const fontSize = Number.parseFloat(styles.fontSize)
          const fontWeight = Number.parseInt(styles.fontWeight, 10) || (styles.fontWeight === 'bold' ? 700 : 400)
          const minimum = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5

          if (ratio + 0.05 >= minimum) return null

          return {
            label: `${node.tagName.toLowerCase()} ${text}`.slice(0, 90),
            ratio: Number(ratio.toFixed(2)),
            targetIndex
          }
        })
        .filter(Boolean)
    }, index)

    for (const failure of elementFailures) {
      failures.push(`${pageName} target ${failure.targetIndex}: ${failure.label} (${failure.ratio}:1)`)
    }

    await page.mouse.move(0, 0)
  }

  expect(failures, `Hover contrast failures:\n${failures.join('\n')}`).toEqual([])
}

test.describe('visual CSS baselines', () => {
  test.beforeEach(async ({ page }) => {
    await installVisualMocks(page)
  })

  test('manager dashboard desktop', async ({ page }) => {
    await openVisualPage(page, '/manage')
    await expect(page.getByRole('heading', { name: 'Assignment & Schedule' })).toBeVisible()
    await expect(page.getByText('Next scheduling action')).toBeVisible()
    await expect(page).toHaveScreenshot('manager-dashboard-desktop.png', { fullPage: true })
  })

  test('manager dashboard mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await openVisualPage(page, '/manage')
    await expect(page.getByRole('heading', { name: 'Assignment & Schedule' })).toBeVisible()
    await expect(page.getByText('Next scheduling action')).toBeVisible()
    await expect(page).toHaveScreenshot('manager-dashboard-mobile.png', { fullPage: true })
  })

  test('mailer settings desktop', async ({ page }) => {
    await openVisualPage(page, '/manage/mailer-settings')
    await expect(page.getByRole('heading', { name: 'Mailer Settings' })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Microsoft 365 Graph/ })).toBeVisible()
    await expect(page).toHaveScreenshot('mailer-settings-desktop.png', { fullPage: true })
  })

  test('job ticket queue desktop', async ({ page }) => {
    await openVisualPage(page, '/manage/job-tickets')
    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible()
    await expect(page.getByText('JT-2026-000003')).toBeVisible()
    await expect(page).toHaveScreenshot('job-ticket-queue-desktop.png', { fullPage: true })
  })

  test('job ticket detail desktop', async ({ page }) => {
    await openVisualPage(page, '/manage/job-tickets/job-1')
    await expect(page.getByRole('heading', { name: 'Service Details' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ticket Actions' })).toBeVisible()
    await expect(page).toHaveScreenshot('job-ticket-detail-desktop.png', { fullPage: true })
  })

  test('job ticket detail mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await openVisualPage(page, '/manage/job-tickets/job-1')
    await expect(page.getByRole('heading', { name: 'Service Details' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ticket Actions' })).toBeVisible()
    await expect(page).toHaveScreenshot('job-ticket-detail-mobile.png', { fullPage: true })
  })

  test('schedule desktop', async ({ page }) => {
    await openVisualPage(page, '/manage/schedule')
    await expect(page.getByRole('heading', { name: 'Scheduling' })).toBeVisible()
    await expect(page.getByText('JT-2026-000003')).toBeVisible()
    await expect(page).toHaveScreenshot('schedule-desktop.png', { fullPage: true })
  })

  test('reports desktop', async ({ page }) => {
    await openVisualPage(page, '/manage/reports')
    await expect(page.getByRole('heading', { name: 'Job Reports' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Invoice and Billing' })).toBeVisible()
    await expect(page).toHaveScreenshot('reports-desktop.png', { fullPage: true })
  })

  test('users desktop', async ({ page }) => {
    await openVisualPage(page, '/manage/users')
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Avery Admin', exact: true })).toBeVisible()
    await expect(page).toHaveScreenshot('users-desktop.png', { fullPage: true })
  })

  test('hover states keep readable contrast', async ({ page }) => {
    const pages = [
      { name: 'manager dashboard', path: '/manage', heading: 'Job ticket management dashboard' },
      { name: 'mailer settings', path: '/manage/mailer-settings', heading: 'Mailer Settings' },
      { name: 'job ticket queue', path: '/manage/job-tickets', heading: 'Ticket Queue' },
      { name: 'job ticket detail', path: '/manage/job-tickets/job-1', heading: 'Service Details' },
      { name: 'schedule', path: '/manage/schedule', heading: 'Scheduling' },
      { name: 'reports', path: '/manage/reports', heading: 'Job Reports' },
      { name: 'users', path: '/manage/users', heading: 'User Management' }
    ]

    for (const item of pages) {
      await openVisualPage(page, item.path)
      await expect(page.getByRole('heading', { name: item.heading })).toBeVisible()
      await auditHoverContrast(page, item.name)
    }
  })
})
