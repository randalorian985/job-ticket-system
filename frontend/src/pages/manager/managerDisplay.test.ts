import { describe, expect, it } from 'vitest'
import { getApprovalLabel } from './managerDisplay'

describe('getApprovalLabel', () => {
  it('matches backend approval enum numeric values', () => {
    expect(getApprovalLabel(1)).toBe('Pending')
    expect(getApprovalLabel(2)).toBe('Approved')
    expect(getApprovalLabel(3)).toBe('Rejected')
    expect(getApprovalLabel(4)).toBe('Invoiced')
    expect(getApprovalLabel(999)).toBe('Unknown')
  })
})
