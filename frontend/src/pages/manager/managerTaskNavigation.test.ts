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
    const filters = readJobTicketQueueFilters(new URLSearchParams('status=999&priority=urgent&readiness=unknown&q=pump'))

    expect(filters).toEqual({
      status: 'all',
      priority: 'all',
      customer: 'all',
      readiness: 'all',
      search: 'pump'
    })
    expect(normalizeJobTicketQueueSearchParams(
      new URLSearchParams('status=999&priority=urgent&readiness=unknown&q=pump&unexpected=value')
    ).toString()).toBe('q=pump')
  })

  it('derives queue labels from validated filters', () => {
    expect(getJobTicketQueueLabel(new URLSearchParams('status=active&readiness=needs-review'))).toBe('Needs Dispatch Review')
    expect(getJobTicketQueueLabel(new URLSearchParams('status=5'))).toBe('Waiting on Parts')
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
      returnLabel: 'Needs Dispatch Review'
    })

    expect(getSafeManagerReturnContext(new URLSearchParams('returnTo=%2Fmanage%2Fjob-tickets-evil'))).toEqual({
      returnTo: '/manage/job-tickets',
      returnLabel: 'Job Tickets'
    })
  })
})
