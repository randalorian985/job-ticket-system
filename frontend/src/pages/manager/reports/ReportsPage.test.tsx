import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { ApiError } from '../../../api/httpClient'
import { renderWithRouter } from '../../../test/renderWithRouter'
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

const readCsvFromExportLink = () => {
  const href = screen.getByRole('link', { name: 'Export loaded rows as CSV' }).getAttribute('href') ?? ''
  return decodeURIComponent(href.replace('data:text/csv;charset=utf-8,', ''))
}

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ReportsPage', () => {
  it('renders grouped Manager/Admin report sections and supported report cards', () => {
    renderWithRouter(<ReportsPage />)

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.getByText(/Labor totals are labeled as time-entry labor-rate snapshot values/i)).toBeInTheDocument()

    const invoiceSection = screen.getByLabelText('Invoice and Closeout')
    expect(within(invoiceSection).getByText('Invoice-ready Summary')).toBeInTheDocument()
    expect(within(invoiceSection).getByText('Job Cost Summary')).toBeInTheDocument()
    expect(within(invoiceSection).getByText('Jobs Ready to Invoice')).toBeInTheDocument()

    const laborSection = screen.getByLabelText('Labor and Parts')
    expect(within(laborSection).getByText('Labor by Job')).toBeInTheDocument()
    expect(within(laborSection).getByText('Labor by Employee')).toBeInTheDocument()
    expect(within(laborSection).getByText('Parts by Job')).toBeInTheDocument()

    const historySection = screen.getByLabelText('Service History')
    expect(within(historySection).getByText('Customer Service History')).toBeInTheDocument()
    expect(within(historySection).getByText('Equipment Service History')).toBeInTheDocument()
  })

  it('applies supported filters, renders scan-friendly rows, and exports loaded raw CSV values', async () => {
    vi.mocked(reportsApi.getLaborByJob).mockResolvedValue([
      {
        jobTicketId: 'job-1',
        jobTicketNumber: 'JT-2026-000123',
        customer: 'Acme Service',
        approvedLaborHours: 2.5,
        laborCostTotal: 125,
        laborBillableTotal: 300,
        createdAtUtc: '2026-05-01T00:30:00Z',
        completedAtUtc: '2026-05-02T00:30:00Z'
      }
    ] as any)

    renderWithRouter(<ReportsPage />)

    fireEvent.change(screen.getByLabelText('Employee id'), { target: { value: 'emp-7' } })
    fireEvent.change(screen.getByLabelText('Limit'), { target: { value: '75' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run Labor by Job' }))

    expect(await screen.findByRole('link', { name: 'JT-2026-000123' })).toHaveAttribute('href', '/manage/job-tickets/job-1')
    expect(screen.getByRole('columnheader', { name: 'Labor Billable (time-entry labor-rate snapshot)' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '$300.00' })).toBeInTheDocument()
    expect(screen.getByText('Loaded report review')).toBeInTheDocument()
    expect(screen.getAllByText(/Employee: emp-7/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Limit: 75/).length).toBeGreaterThan(0)

    const exportLink = screen.getByRole('link', { name: 'Export loaded rows as CSV' })
    expect(exportLink).toHaveAttribute('download', 'report-labor-by-job.csv')

    const csv = readCsvFromExportLink()
    expect(csv).toContain('Labor Billable (time-entry labor-rate snapshot)')
    expect(csv).toContain('JT-2026-000123,Acme Service,2.5,125,300,2026-05-01,2026-05-02')
    expect(csv).not.toContain('$300.00')
    await waitFor(() => expect(reportsApi.getLaborByJob).toHaveBeenCalledWith({ offset: 0, limit: 75, employeeId: 'emp-7' }))

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(screen.getByLabelText('Employee id')).toHaveValue('')
    expect(screen.getByLabelText('Limit')).toHaveValue(50)
    expect(screen.getByText('Select a report')).toBeInTheDocument()
  })

  it('shows loading and empty states without offering CSV export for empty loaded data', async () => {
    let resolveReport: (value: any[]) => void = () => undefined
    vi.mocked(reportsApi.getLaborByEmployee).mockReturnValue(new Promise((resolve) => { resolveReport = resolve }) as any)

    renderWithRouter(<ReportsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Run Labor by Employee' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Loading Labor by Employee...')

    resolveReport([])

    expect(await screen.findByText('No rows match the current report and filters. Adjust the filters or source ID, then run the report again.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Export loaded rows as CSV' })).not.toBeInTheDocument()
  })

  it('surfaces user-friendly report failures without rendering stale empty-state copy', async () => {
    vi.mocked(reportsApi.getPartsByJob).mockRejectedValue(new ApiError('Forbidden', 403))

    renderWithRouter(<ReportsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Run Parts by Job' }))

    expect(await screen.findByText('You do not have permission to run manager reports.')).toBeInTheDocument()
    expect(screen.queryByText(/No rows match the current report and filters/i)).not.toBeInTheDocument()
  })

  it('validates required source IDs before calling single-record report APIs', () => {
    renderWithRouter(<ReportsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Run Invoice-ready Summary' }))

    expect(screen.getByText('Enter a job ticket id before running this report.')).toBeInTheDocument()
    expect(reportsApi.getInvoiceReadySummary).not.toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: 'Export loaded rows as CSV' })).not.toBeInTheDocument()
  })

  it('keeps invoice-ready reporting aligned with the implemented API response and export columns', async () => {
    vi.mocked(reportsApi.getInvoiceReadySummary).mockResolvedValue({
      jobTicketId: 'job-invoice-1',
      jobTicketNumber: 'JT-READY',
      customer: 'Gamma Service',
      billingPartyCustomer: 'Gamma AP',
      serviceLocation: 'Plant 4',
      equipment: 'Compressor',
      jobStatus: 7,
      invoiceStatus: 2,
      customerFacingNotes: null,
      workDescriptions: [],
      approvedLaborEntries: [],
      approvedParts: [],
      laborHours: 3,
      laborCostTotal: 120,
      laborBillableTotal: 285,
      partsCostTotal: 40,
      partsBillableTotal: 75,
      miscCharges: 0,
      tax: 12,
      grandTotal: 372,
      purchaseOrderNumber: null,
      billingContactName: null,
      billingContactPhone: null,
      billingContactEmail: null
    } as any)

    renderWithRouter(<ReportsPage />)

    fireEvent.change(screen.getByLabelText('Job ticket id'), { target: { value: 'job-invoice-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run Invoice-ready Summary' }))

    expect(await screen.findByRole('table', { name: 'Invoice-ready Summary results' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'JT-READY' })).toHaveAttribute('href', '/manage/job-tickets/job-invoice-1')
    expect(screen.getByRole('columnheader', { name: 'Labor Billable (time-entry labor-rate snapshot)' })).toBeInTheDocument()
    expect(screen.getByText('$372.00')).toBeInTheDocument()
    expect(reportsApi.getInvoiceReadySummary).toHaveBeenCalledWith('job-invoice-1')

    const csv = readCsvFromExportLink()
    expect(csv).toContain('Invoice Status')
    expect(csv).toContain('JT-READY,Gamma Service,Gamma AP,Plant 4,Compressor,Completed,Ready,3,285,75,12,372')
  })
})
