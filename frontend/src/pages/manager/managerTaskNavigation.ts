export const activeDispatchStatusValues = new Set([2, 3, 4, 5, 6])

const allFilterValue = 'all'
const validStatusFilters = new Set(['active', 'waiting', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
const validPriorityFilters = new Set(['1', '2', '3', '4'])
const validReadinessFilters = new Set(['ready', 'needs-review', 'not-active'])
const validAttentionFilters = new Set(['unscheduled', 'missing-due', 'unassigned', 'needs-lead'])
const queueLabelsByReadiness: Record<string, string> = {
  'needs-review': 'Needs Assignment Review',
  ready: 'Ready to Work Queue'
}
const queueLabelsByAttention: Record<string, string> = {
  unassigned: 'Unassigned Tickets',
  'needs-lead': 'Tickets Needing a Lead',
  unscheduled: 'Unscheduled Tickets',
  'missing-due': 'Tickets Missing a Due Date'
}
const queueLabelsByStatus: Record<string, string> = {
  waiting: 'Waiting Tickets',
  '5': 'Waiting on Parts',
  '10': 'Invoice-ready Queue',
  active: 'Active Job Queue'
}

export type JobTicketQueueFilters = {
  status: string
  priority: string
  customer: string
  readiness: string
  attention: string
  search: string
}

const validFilterOrAll = (value: string | null, validValues: Set<string>) =>
  value && validValues.has(value) ? value : allFilterValue

export const readJobTicketQueueFilters = (searchParams: URLSearchParams): JobTicketQueueFilters => ({
  status: validFilterOrAll(searchParams.get('status'), validStatusFilters),
  priority: validFilterOrAll(searchParams.get('priority'), validPriorityFilters),
  customer: searchParams.get('customer')?.trim() || allFilterValue,
  readiness: validFilterOrAll(searchParams.get('readiness'), validReadinessFilters),
  attention: validFilterOrAll(searchParams.get('attention'), validAttentionFilters),
  search: searchParams.get('q') ?? ''
})

export const normalizeJobTicketQueueSearchParams = (searchParams: URLSearchParams) => {
  const filters = readJobTicketQueueFilters(searchParams)
  const normalizedParams = new URLSearchParams()

  const filterParams = [
    ['status', filters.status],
    ['priority', filters.priority],
    ['customer', filters.customer],
    ['readiness', filters.readiness],
    ['attention', filters.attention]
  ] as const

  filterParams.forEach(([name, value]) => {
    if (value !== allFilterValue) normalizedParams.set(name, value)
  })

  if (filters.search) normalizedParams.set('q', filters.search)

  return normalizedParams
}

export const getJobTicketQueueLabel = (searchParams: URLSearchParams) => {
  const filters = readJobTicketQueueFilters(searchParams)

  return queueLabelsByReadiness[filters.readiness]
    ?? queueLabelsByAttention[filters.attention]
    ?? queueLabelsByStatus[filters.status]
    ?? 'Job Tickets'
}

export const buildJobTicketDetailPath = (jobTicketId: string, returnTo: string) => {
  const detailParams = new URLSearchParams({ returnTo })
  return `/manage/job-tickets/${jobTicketId}?${detailParams.toString()}`
}

const buildJobTicketQueueReturnContext = (requestedReturnTo: string) => {
  if (!requestedReturnTo.startsWith('/manage/job-tickets')) return null

  const returnUrl = new URL(requestedReturnTo, 'https://job-ticket.local')
  if (returnUrl.pathname !== '/manage/job-tickets') return null

  const normalizedSearch = normalizeJobTicketQueueSearchParams(returnUrl.searchParams).toString()
  return {
    returnTo: `${returnUrl.pathname}${normalizedSearch ? `?${normalizedSearch}` : ''}`,
    returnLabel: getJobTicketQueueLabel(returnUrl.searchParams)
  }
}

export const getSafeManagerReturnContext = (searchParams: URLSearchParams) => {
  const requestedReturnTo = searchParams.get('returnTo')

  if (requestedReturnTo === '/manage') {
    return { returnTo: '/manage', returnLabel: 'Dashboard' }
  }

  if (requestedReturnTo) {
    const queueReturnContext = buildJobTicketQueueReturnContext(requestedReturnTo)
    if (queueReturnContext) return queueReturnContext
  }

  return { returnTo: '/manage/job-tickets', returnLabel: 'Job Tickets' }
}
