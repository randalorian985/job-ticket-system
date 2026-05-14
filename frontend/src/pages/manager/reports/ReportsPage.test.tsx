import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { reportsApi } from '../../../api/reportsApi'
import { ReportsPage } from './ReportsPage'

vi.mock('../../../api/reportsApi', () => ({
  reportsApi: {
    getInvoiceReadySummary: vi.fn(),
    getCostSummary: vi.fn(),
    getJobsReadyToInvoice: vi.fn(),
    getLaborByJob: vi.fn(),
    getLaborByEmployee: vi.fn(),
    getPartsByJob: vi.fn(),
    getCustomerHistory: vi.fn(),
    getEquipmentHistory: vi.fn()
  }
}))

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ReportsPage', () => {
  it('renders scan-friendly report rows and exports already-loaded raw CSV values', async () => {
    vi.mocked(reportsApi.getLaborByJob).mockResolvedValue([
      {
        jobTicketId: 'job-1',
        jobTicketNumber: 'JT-2026-000123',
        customer: 'Acme Service',
        approvedLaborHours: 2.5,
        laborCostTotal: 125,
        laborBillableTotal: 300,
        createdAtUtc: '2026-05-01T12:00:00Z',
        completedAtUtc: '2026-05-02T12:00:00Z'
      }
    ] as any)

    render(<ReportsPage />, { wrapper: MemoryRouter })

    fireEvent.click(screen.getByRole('button', { name: 'Run Labor by Job' }))

    expect(await screen.findByRole('link', { name: 'JT-2026-000123' })).toHaveAttribute('href', '/manage/job-tickets/job-1')
    expect(screen.getByRole('columnheader', { name: 'Labor Billable (Snapshot/Fallback)' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '$300.00' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Completed (UTC)' })).toBeInTheDocument()

    const exportLink = screen.getByRole('link', { name: 'Export loaded rows as CSV' })
    const href = exportLink.getAttribute('href') ?? ''
    const csv = decodeURIComponent(href.replace('data:text/csv;charset=utf-8,', ''))

    expect(csv).toContain('Labor Billable (Snapshot/Fallback)')
    expect(csv).toContain('JT-2026-000123,Acme Service,2.5,125,300,2026-05-01,2026-05-02')
    expect(csv).not.toContain('$300.00')
    await waitFor(() => expect(reportsApi.getLaborByJob).toHaveBeenCalledWith({ offset: 0, limit: 50 }))
  })
})
