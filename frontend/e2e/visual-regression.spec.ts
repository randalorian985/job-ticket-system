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

  const assignmentMatch = url.pathname.match(/^\/api\/job-tickets\/([^/]+)\/assignments$/)
  if (assignmentMatch) {
    await route.fulfill(json(assignmentsByJob[assignmentMatch[1]] ?? []))
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
})
