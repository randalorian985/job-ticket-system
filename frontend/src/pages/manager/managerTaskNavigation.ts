export const activeDispatchStatusValues = new Set([2, 3, 4, 5, 6])

const validStatusFilters = new Set(['active', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
const validPriorityFilters = new Set(['1', '2', '3', '4'])
const validReadinessFilters = new Set(['ready', 'needs-review', 'not-active'])

export type JobTicketQueueFilters = {
  status: string
  priority: string
  customer: string
  readiness: string
  search: string
}

const validFilterOrAll = (value: string | null, validValues: Set<string>) =>
  value && validValues.has(value) ? value : 'all'

export const readJobTicketQueueFilters = (searchParams: URLSearchParams): JobTicketQueueFilters => ({
  status: validFilterOrAll(searchParams.get('status'), validStatusFilters),
  priority: validFilterOrAll(searchParams.get('priority'), validPriorityFilters),
  customer: searchParams.get('customer')?.trim() || 'all',
  readiness: validFilterOrAll(searchParams.get('readiness'), validReadinessFilters),
  search: searchParams.get('q') ?? ''
})

export const normalizeJobTicketQueueSearchParams = (searchParams: URLSearchParams) => {
  const filters = readJobTicketQueueFilters(searchParams)
  const normalizedParams = new URLSearchParams()

  if (filters.status !== 'all') normalizedParams.set('status', filters.status)
  if (filters.priority !== 'all') normalizedParams.set('priority', filters.priority)
  if (filters.customer !== 'all') normalizedParams.set('customer', filters.customer)
  if (filters.readiness !== 'all') normalizedParams.set('readiness', filters.readiness)
  if (filters.search) normalizedParams.set('q', filters.search)

  return normalizedParams
}

export const getJobTicketQueueLabel = (searchParams: URLSearchParams) => {
  const filters = readJobTicketQueueFilters(searchParams)

  if (filters.readiness === 'needs-review') return 'Needs Dispatch Review'
  if (filters.readiness === 'ready') return 'Dispatch-ready Queue'
  if (filters.status === '5') return 'Waiting on Parts'
  if (filters.status === '10') return 'Invoice-ready Queue'
  if (filters.status === 'active') return 'Active Job Queue'
  return 'Job Tickets'
}

export const buildJobTicketDetailPath = (jobTicketId: string, returnTo: string) => {
  const detailParams = new URLSearchParams({ returnTo })
  return `/manage/job-tickets/${jobTicketId}?${detailParams.toString()}`
}

export const getSafeManagerReturnContext = (searchParams: URLSearchParams) => {
  const requestedReturnTo = searchParams.get('returnTo')

  if (requestedReturnTo === '/manage') {
    return { returnTo: '/manage', returnLabel: 'Dashboard' }
  }

  if (requestedReturnTo?.startsWith('/manage/job-tickets')) {
    const returnUrl = new URL(requestedReturnTo, 'https://job-ticket.local')
    if (returnUrl.pathname === '/manage/job-tickets') {
      const normalizedSearch = normalizeJobTicketQueueSearchParams(returnUrl.searchParams).toString()
      return {
        returnTo: `${returnUrl.pathname}${normalizedSearch ? `?${normalizedSearch}` : ''}`,
        returnLabel: getJobTicketQueueLabel(returnUrl.searchParams)
      }
    }
  }

  return { returnTo: '/manage/job-tickets', returnLabel: 'Job Tickets' }
}
