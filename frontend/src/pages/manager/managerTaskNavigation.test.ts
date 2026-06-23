import { describe, expect, it } from 'vitest'
import {
  buildJobTicketDetailPath,
  getJobTicketQueueLabel,
  getSafeManagerReturnContext,
  normalizeJobTicketQueueSearchParams,
  readJobTicketQueueFilters
} from './managerTaskNavigation'

describe('manager task navigation', () => {
  it('normalizes unsupported queue filter values instead of creating broken controlled filters', () => {
    const filters = readJobTicketQueueFilters(new URLSearchParams(
      'status=999&priority=urgent&customer=%20&readiness=unknown&attention=overdue&q=pump'
    ))

    expect(filters).toEqual({
      status: 'all',
      priority: 'all',
      customer: 'all',
      readiness: 'all',
      attention: 'all',
      search: 'pump'
    })
    expect(normalizeJobTicketQueueSearchParams(
      new URLSearchParams('status=999&priority=urgent&readiness=unknown&q=pump&unexpected=value')
    ).toString()).toBe('q=pump')
  })

  it('preserves supported queue filters in their existing normalized order', () => {
    expect(normalizeJobTicketQueueSearchParams(new URLSearchParams(
      'q=pump&attention=needs-lead&readiness=ready&customer=customer-1&priority=4&status=closed'
    )).toString()).toBe(
      'status=closed&priority=4&customer=customer-1&readiness=ready&attention=needs-lead&q=pump'
    )
  })

  it('derives queue labels from validated filters using readiness, attention, then status precedence', () => {
    expect(getJobTicketQueueLabel(new URLSearchParams('status=active&readiness=needs-review'))).toBe('Needs Assignment Review')
    expect(getJobTicketQueueLabel(new URLSearchParams('status=active&attention=unassigned&readiness=ready'))).toBe('Ready to Work Queue')
    expect(getJobTicketQueueLabel(new URLSearchParams('status=active&attention=needs-lead'))).toBe('Tickets Needing a Lead')
    expect(getJobTicketQueueLabel(new URLSearchParams('attention=unscheduled'))).toBe('Unscheduled Tickets')
    expect(getJobTicketQueueLabel(new URLSearchParams('attention=missing-due'))).toBe('Tickets Missing a Due Date')
    expect(getJobTicketQueueLabel(new URLSearchParams('status=waiting'))).toBe('Waiting Tickets')
    expect(getJobTicketQueueLabel(new URLSearchParams('status=5'))).toBe('Waiting on Parts')
    expect(getJobTicketQueueLabel(new URLSearchParams('status=10'))).toBe('Invoice-ready Queue')
    expect(getJobTicketQueueLabel(new URLSearchParams('status=closed'))).toBe('Closed Tickets')
    expect(getJobTicketQueueLabel(new URLSearchParams('status=active'))).toBe('Active Job Queue')
    expect(getJobTicketQueueLabel(new URLSearchParams())).toBe('Job Tickets')
  })

  it('builds detail links with only internal return context', () => {
    expect(buildJobTicketDetailPath('job-1', '/manage/job-tickets?status=5')).toBe(
      '/manage/job-tickets/job-1?returnTo=%2Fmanage%2Fjob-tickets%3Fstatus%3D5'
    )
  })

  it('derives safe return labels and rejects non-queue manager paths', () => {
    expect(getSafeManagerReturnContext(new URLSearchParams(
      'returnTo=%2Fmanage%2Fjob-tickets%3Fstatus%3Dactive%26readiness%3Dneeds-review&returnLabel=Spoofed'
    ))).toEqual({
      returnTo: '/manage/job-tickets?status=active&readiness=needs-review',
      returnLabel: 'Needs Assignment Review'
    })

    expect(getSafeManagerReturnContext(new URLSearchParams('returnTo=%2Fmanage%2Fjob-tickets-evil'))).toEqual({
      returnTo: '/manage/job-tickets',
      returnLabel: 'Job Tickets'
    })

    expect(getSafeManagerReturnContext(new URLSearchParams(
      'returnTo=%2Fmanage%2Fjob-tickets%3Fstatus%3D999%26attention%3Dunassigned%26unexpected%3Dvalue'
    ))).toEqual({
      returnTo: '/manage/job-tickets?attention=unassigned',
      returnLabel: 'Unassigned Tickets'
    })

    expect(getSafeManagerReturnContext(new URLSearchParams('returnTo=https%3A%2F%2Fexample.com%2Fmanage%2Fjob-tickets'))).toEqual({
      returnTo: '/manage/job-tickets',
      returnLabel: 'Job Tickets'
    })
  })
})
