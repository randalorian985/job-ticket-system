import { describe, expect, it } from 'vitest'
import {
  formatDate,
  getApprovalLabel,
  jobStatusOptions,
  priorityOptions
} from './managerDisplay'

describe('manager display helpers', () => {
  it('matches backend approval enum numeric values', () => {
    expect(getApprovalLabel(1)).toBe('Pending')
    expect(getApprovalLabel(2)).toBe('Approved')
    expect(getApprovalLabel(3)).toBe('Rejected')
    expect(getApprovalLabel(4)).toBe('Invoiced')
    expect(getApprovalLabel(999)).toBe('Unknown')
  })

  it('keeps job status and priority option values aligned with backend numeric enums', () => {
    expect(jobStatusOptions).toEqual([
      { value: 1, label: '1 - Draft' },
      { value: 2, label: '2 - Submitted' },
      { value: 3, label: '3 - Assigned' },
      { value: 4, label: '4 - In Progress' },
      { value: 5, label: '5 - Waiting on Parts' },
      { value: 6, label: '6 - Waiting on Customer' },
      { value: 7, label: '7 - Completed' },
      { value: 8, label: '8 - Cancelled' },
      { value: 9, label: '9 - Invoiced' },
      { value: 10, label: '10 - Reviewed' }
    ])
    expect(priorityOptions).toEqual([
      { value: 1, label: '1 - Low' },
      { value: 2, label: '2 - Normal' },
      { value: 3, label: '3 - High' },
      { value: 4, label: '4 - Urgent' }
    ])
  })

  it('keeps the empty date fallback and formats populated dates', () => {
    expect(formatDate()).toBe('—')
    expect(formatDate(null)).toBe('—')
    expect(formatDate('2026-06-11T12:30:00Z')).toBe(new Date('2026-06-11T12:30:00Z').toLocaleString())
  })
})
