import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { ApiError } from '../../../api/httpClient'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { masterDataApi } from '../../../api/masterDataApi'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { reportsApi } from '../../../api/reportsApi'
import { usersApi } from '../../../api/usersApi'
import { downloadReportPdf } from '../../../utils/reportPdf'
import { ReportsPage } from './ReportsPage'

vi.mock('../../../api/jobTicketsApi', () => ({
  jobTicketsApi: {
    listAll: vi.fn()
  }
}))

vi.mock('../../../api/masterDataApi', () => ({
  masterDataApi: {
    listCustomers: vi.fn(),
    listServiceLocations: vi.fn(),
    listEquipment: vi.fn()
  }
}))

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

vi.mock('../../../api/usersApi', () => ({
  usersApi: {
    listAssignableEmployees: vi.fn()
  }
}))

vi.mock('../../../features/companyBranding/CompanyBrandingContext', () => ({
  useCompanyBranding: () => ({
    configuration: {
      companyName: 'Mudbug Digital',
      phone: '555-0100',
      email: 'ops@mudbugdigital.test',
      website: 'https://mudbugdigital.test'
    },
    isLoading: false,
    logoUrl: '/branding/mudbug-logo.png',
    initials: 'MD',
    addressLines: ['100 Bayou Road', 'Lafayette, LA, 70501'],
    refresh: async () => ({
      companyName: 'Mudbug Digital',
      phone: '555-0100',
      email: 'ops@mudbugdigital.test',
      website: 'https://mudbugdigital.test'
    })
  })
}))

vi.mock('../../../utils/reportPdf', () => ({
  downloadReportPdf: vi.fn()
}))

const readCsvFromExportLink = () => {
  const href = screen.getByRole('link', { name: 'Export CSV' }).getAttribute('href') ?? ''
  return decodeURIComponent(href.replace('data:text/csv;charset=utf-8,', ''))
}

beforeEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
  vi.spyOn(window, 'print').mockImplementation(() => undefined)
  vi.mocked(jobTicketsApi.listAll).mockResolvedValue([
    {
      id: 'job-invoice-1',
      ticketNumber: 'JT-READY',
      title: 'Ready compressor PM',
      status: 7,
      priority: 3,
      customerId: 'customer-1',
      serviceLocationId: 'location-1',
      requestedAtUtc: null,
      scheduledStartAtUtc: null,
      dueAtUtc: null,
      completedAtUtc: null
    },
    {
      id: 'job-1',
      ticketNumber: 'JT-2026-000123',
      title: 'Labor review job',
      status: 7,
      priority: 2,
      customerId: 'customer-1',
      serviceLocationId: 'location-1',
      requestedAtUtc: null,
      scheduledStartAtUtc: null,
      dueAtUtc: null,
      completedAtUtc: null
    }
  ])
  vi.mocked(masterDataApi.listCustomers).mockResolvedValue([
    { id: 'customer-1', name: 'Acme Service', accountNumber: 'ACME', contactName: null, email: null, phone: null, isArchived: false },
    { id: 'billing-1', name: 'Acme Billing', accountNumber: 'AP', contactName: null, email: null, phone: null, isArchived: false }
  ])
  vi.mocked(masterDataApi.listServiceLocations).mockResolvedValue([
    {
      id: 'location-1',
      customerId: 'customer-1',
      companyName: 'Acme Service',
      locationName: 'Plant 4',
      addressLine1: '100 Main',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'USA',
      isActive: true,
      isArchived: false
    }
  ])
  vi.mocked(masterDataApi.listEquipment).mockResolvedValue([
    {
      id: 'equipment-1',
      customerId: 'customer-1',
      serviceLocationId: 'location-1',
      ownerCustomerId: null,
      responsibleBillingCustomerId: null,
      name: 'Compressor',
      equipmentNumber: 'EQ-1',
      unitNumber: null,
      manufacturer: null,
      modelNumber: null,
      serialNumber: null,
      equipmentType: null,
      year: null,
      isArchived: false
    }
  ])
  vi.mocked(usersApi.listAssignableEmployees).mockResolvedValue([
    { id: 'emp-7', firstName: 'Taylor', lastName: 'Technician' }
  ])
})

describe('ReportsPage', () => {
  it('renders grouped Manager/Admin report sections and supported report cards', () => {
    renderWithRouter(<ReportsPage />)

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'report preview' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'report catalog' })).toBeInTheDocument()
    expect(screen.getByText(/Run reports from this panel, then export to CSV or PDF/i)).toBeInTheDocument()
    expect(screen.queryByText('Report group')).not.toBeInTheDocument()
    expect(screen.queryByText(/3 reports/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/2 reports/i)).not.toBeInTheDocument()

    const invoiceSection = screen.getByLabelText('Invoice and Billing')
    expect(within(invoiceSection).getByText('Invoice-ready Summary')).toBeInTheDocument()
    expect(within(invoiceSection).getByText('Job Cost Summary')).toBeInTheDocument()
    expect(within(invoiceSection).getByText('Jobs Ready to Invoice')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Invoice-ready Summary report')).getByLabelText('Invoice-ready Summary job ticket')).toBeInTheDocument()

    const laborSection = screen.getByLabelText('Labor, Parts & Service History')
    expect(within(laborSection).getByText('Labor by Job')).toBeInTheDocument()
    expect(within(laborSection).getByText('Labor by Employee')).toBeInTheDocument()
    expect(within(laborSection).getByText('Parts by Job')).toBeInTheDocument()

    expect(within(laborSection).getByText('Customer Service History')).toBeInTheDocument()
    expect(screen.queryByText('Equipment Service History')).not.toBeInTheDocument()
    expect(within(screen.getByLabelText('Customer Service History report')).getByLabelText('Customer Service History customer')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Customer Service History report')).getByLabelText('Customer Service History equipment')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Report Filters' })).not.toBeInTheDocument()
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

    const laborByJobCard = screen.getByLabelText('Labor by Job report')
    expect(await within(laborByJobCard).findByRole('option', { name: 'Taylor Technician' })).toBeInTheDocument()
    fireEvent.click(within(laborByJobCard).getByText('Show optional filters'))
    fireEvent.change(within(laborByJobCard).getByLabelText('Labor by Job customer filter'), { target: { value: 'customer-1' } })
    fireEvent.change(within(laborByJobCard).getByLabelText('Labor by Job service location filter'), { target: { value: 'location-1' } })
    fireEvent.change(within(laborByJobCard).getByLabelText('Labor by Job employee filter'), { target: { value: 'emp-7' } })
    fireEvent.click(within(laborByJobCard).getByRole('button', { name: 'Run Labor by Job' }))

    expect(await screen.findByRole('link', { name: 'JT-2026-000123' })).toHaveAttribute('href', '/manage/job-tickets/job-1')
    expect(screen.getByRole('button', { name: 'Report catalog' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Columns' })).not.toBeInTheDocument()
    expect(screen.getByText('Labor by Job results table with 1 visible row.')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Labor Billable' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '$300.00' })).toBeInTheDocument()
    expect(screen.getByLabelText('report company header')).toHaveTextContent('Mudbug Digital')
    expect(screen.getByAltText('Mudbug Digital logo')).toHaveAttribute('src', '/branding/mudbug-logo.png')
    expect(screen.getByRole('heading', { level: 2, name: 'Labor by Job' })).toBeInTheDocument()
    expect(screen.getByLabelText('report summary')).toHaveTextContent(/Customer: Acme Service/)
    expect(screen.getAllByText(/Customer: Acme Service \(ACME\)/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Service location: Acme Service - Plant 4/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Employee: Taylor Technician/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Employee: emp-7/)).not.toBeInTheDocument()

    const exportLink = screen.getByRole('link', { name: 'Export CSV' })
    expect(exportLink.getAttribute('download')).toMatch(/^report-labor-by-job-\d{4}-\d{2}-\d{2}\.csv$/)
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }))
    expect(downloadReportPdf).toHaveBeenCalledTimes(1)
    expect(downloadReportPdf).toHaveBeenCalledWith(expect.objectContaining({
      brandName: 'Job Ticket System',
      title: 'Labor by Job',
      description: 'Approved time entries grouped by job ticket, with hours and billable totals for each assignment.',
      fileName: expect.stringMatching(/^report-labor-by-job-\d{4}-\d{2}-\d{2}\.pdf$/)
    }))

    const csv = readCsvFromExportLink()
    expect(csv).toContain('Company,Mudbug Digital')
    expect(csv).toContain('Company details,"100 Bayou Road | Lafayette, LA, 70501 | 555-0100 | ops@mudbugdigital.test | https://mudbugdigital.test"')
    expect(csv).toContain('Report,Labor by Job')
    expect(csv).toContain('Applied scope,Customer: Acme Service (ACME) | Service location: Acme Service - Plant 4 | Employee: Taylor Technician')
    expect(csv).toContain('Visible rows,1')
    expect(csv).toContain('Labor Billable')
    expect(csv).toContain('JT-2026-000123,Acme Service,2.5,125,300,2026-05-01,2026-05-02')
    expect(csv).not.toContain('$300.00')
    await waitFor(() => expect(reportsApi.getLaborByJob).toHaveBeenCalledWith({
      customerId: 'customer-1',
      serviceLocationId: 'location-1',
      employeeId: 'emp-7'
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Run Labor by Job again' }))
    await waitFor(() => expect(reportsApi.getLaborByJob).toHaveBeenCalledTimes(2))
    expect(screen.getByLabelText('report preview')).toBeVisible()
    expect(reportsApi.getLaborByJob).toHaveBeenLastCalledWith({
      customerId: 'customer-1',
      serviceLocationId: 'location-1',
      employeeId: 'emp-7'
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reset report inputs' }))
    expect(within(laborByJobCard).getByLabelText('Labor by Job employee filter')).toHaveValue('')
    expect(screen.getByLabelText('Labor by Job report')).toBeVisible()
  })

  it('shows loading and empty states without offering CSV export for empty loaded data', async () => {
    let resolveReport: (value: any[]) => void = () => undefined
    vi.mocked(reportsApi.getLaborByEmployee).mockReturnValue(new Promise((resolve) => { resolveReport = resolve }) as any)

    renderWithRouter(<ReportsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Run Labor by Employee' }))
    expect(await screen.findByText('Loading Labor by Employee')).toBeInTheDocument()
    expect(screen.getByText('Preparing rows for review and export.')).toBeInTheDocument()

    resolveReport([])

    expect(await screen.findByText('No rows match the current report and filters. Adjust the filters or selected record, then run the report again.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Export CSV' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Print / Save PDF' })).not.toBeInTheDocument()
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

    expect(screen.getByText('Select a job ticket before running Invoice-ready Summary.')).toBeInTheDocument()
    expect(reportsApi.getInvoiceReadySummary).not.toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: 'Export CSV' })).not.toBeInTheDocument()
  })

  it('keeps every report source dropdown selection independent', async () => {
    renderWithRouter(<ReportsPage />)

    const invoiceCard = screen.getByLabelText('Invoice-ready Summary report')
    const costCard = screen.getByLabelText('Job Cost Summary report')
    const customerHistoryCard = screen.getByLabelText('Customer Service History report')

    expect(await within(invoiceCard).findByRole('option', { name: 'JT-READY - Ready compressor PM' })).toBeInTheDocument()

    const invoiceSelect = within(invoiceCard).getByLabelText('Invoice-ready Summary job ticket')
    const costSelect = within(costCard).getByLabelText('Job Cost Summary job ticket')
    const customerSelect = within(customerHistoryCard).getByLabelText('Customer Service History customer')
    const equipmentFilter = within(customerHistoryCard).getByLabelText('Customer Service History equipment')

    fireEvent.change(invoiceSelect, { target: { value: 'job-invoice-1' } })
    expect(invoiceSelect).toHaveValue('job-invoice-1')
    expect(costSelect).toHaveValue('')

    fireEvent.change(costSelect, { target: { value: 'job-1' } })
    expect(invoiceSelect).toHaveValue('job-invoice-1')
    expect(costSelect).toHaveValue('job-1')

    // Equipment filter is disabled until a customer is selected
    expect(equipmentFilter).toBeDisabled()

    fireEvent.change(customerSelect, { target: { value: 'customer-1' } })
    expect(customerSelect).toHaveValue('customer-1')
    expect(equipmentFilter).not.toBeDisabled()

    // Equipment filter shows the selected customer's equipment
    expect(within(customerHistoryCard).getByRole('option', { name: 'Compressor (EQ-1)' })).toBeInTheDocument()

    fireEvent.change(equipmentFilter, { target: { value: 'equipment-1' } })
    expect(equipmentFilter).toHaveValue('equipment-1')
    expect(customerSelect).toHaveValue('customer-1')
  })

  it('keeps optional report filters independent between report cards', async () => {
    renderWithRouter(<ReportsPage />)

    const jobsReadyCard = screen.getByLabelText('Jobs Ready to Invoice report')
    const laborByJobCard = screen.getByLabelText('Labor by Job report')

    fireEvent.click(within(jobsReadyCard).getByText('Show optional filters'))
    fireEvent.click(within(laborByJobCard).getByText('Show optional filters'))

    const jobsReadyCustomer = within(jobsReadyCard).getByLabelText('Jobs Ready to Invoice customer filter')
    const laborByJobCustomer = within(laborByJobCard).getByLabelText('Labor by Job customer filter')
    await waitFor(() => expect(jobsReadyCustomer).not.toBeDisabled())

    fireEvent.change(jobsReadyCustomer, { target: { value: 'customer-1' } })
    expect(jobsReadyCustomer).toHaveValue('customer-1')
    expect(laborByJobCustomer).toHaveValue('')

    fireEvent.change(laborByJobCustomer, { target: { value: 'customer-1' } })
    expect(jobsReadyCustomer).toHaveValue('customer-1')
    expect(laborByJobCustomer).toHaveValue('customer-1')

    fireEvent.change(jobsReadyCustomer, { target: { value: '' } })
    expect(jobsReadyCustomer).toHaveValue('')
    expect(laborByJobCustomer).toHaveValue('customer-1')
  })

  it('restores report-specific saved defaults and clears them from reset', async () => {
    renderWithRouter(<ReportsPage />)

    const costCard = screen.getByLabelText('Job Cost Summary report')
    const laborByJobCard = screen.getByLabelText('Labor by Job report')
    expect(await within(costCard).findByRole('option', { name: 'JT-READY - Ready compressor PM' })).toBeInTheDocument()

    fireEvent.change(within(costCard).getByLabelText('Job Cost Summary job ticket'), { target: { value: 'job-invoice-1' } })
    fireEvent.click(within(laborByJobCard).getByText('Show optional filters'))
    fireEvent.change(within(laborByJobCard).getByLabelText('Labor by Job customer filter'), { target: { value: 'customer-1' } })
    await waitFor(() => expect(localStorage.length).toBeGreaterThan(0))

    cleanup()
    renderWithRouter(<ReportsPage />)

    const restoredCostCard = screen.getByLabelText('Job Cost Summary report')
    const restoredLaborByJobCard = screen.getByLabelText('Labor by Job report')
    expect(await within(restoredCostCard).findByRole('option', { name: 'JT-READY - Ready compressor PM' })).toBeInTheDocument()
    expect(within(restoredCostCard).getByLabelText('Job Cost Summary job ticket')).toHaveValue('job-invoice-1')
    fireEvent.click(within(restoredLaborByJobCard).getByText('Show optional filters'))
    expect(within(restoredLaborByJobCard).getByLabelText('Labor by Job customer filter')).toHaveValue('customer-1')

    fireEvent.click(screen.getByRole('button', { name: 'Reset report inputs' }))
    expect(within(restoredCostCard).getByLabelText('Job Cost Summary job ticket')).toHaveValue('')
    expect(within(restoredLaborByJobCard).getByLabelText('Labor by Job customer filter')).toHaveValue('')
    expect(localStorage.length).toBe(0)
  })

  it('validates report date ranges before calling report APIs', async () => {
    renderWithRouter(<ReportsPage />)

    const laborByJobCard = screen.getByLabelText('Labor by Job report')
    fireEvent.click(within(laborByJobCard).getByText('Show optional filters'))
    fireEvent.change(within(laborByJobCard).getByLabelText('Labor by Job from date filter'), { target: { value: '2026-05-10' } })
    fireEvent.change(within(laborByJobCard).getByLabelText('Labor by Job to date filter'), { target: { value: '2026-05-01' } })
    fireEvent.click(within(laborByJobCard).getByRole('button', { name: 'Run Labor by Job' }))

    expect(await screen.findByText('From date must be on or before the to date.')).toBeInTheDocument()
    expect(reportsApi.getLaborByJob).not.toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: 'Export CSV' })).not.toBeInTheDocument()
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

    const invoiceCard = screen.getByLabelText('Invoice-ready Summary report')
    expect(await within(invoiceCard).findByRole('option', { name: 'JT-READY - Ready compressor PM' })).toBeInTheDocument()
    fireEvent.change(within(invoiceCard).getByLabelText('Invoice-ready Summary job ticket'), { target: { value: 'job-invoice-1' } })
    fireEvent.click(within(invoiceCard).getByRole('button', { name: 'Run Invoice-ready Summary' }))

    expect(await screen.findByRole('table', { name: 'Invoice-ready Summary results' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'JT-READY' })).toHaveAttribute('href', '/manage/job-tickets/job-invoice-1')
    expect(screen.getByRole('columnheader', { name: 'Labor Billable' })).toBeInTheDocument()
    expect(screen.getByText('$372.00')).toBeInTheDocument()
    expect(reportsApi.getInvoiceReadySummary).toHaveBeenCalledWith('job-invoice-1')

    const csv = readCsvFromExportLink()
    expect(csv).toContain('Invoice Status')
    expect(csv).toContain('JT-READY,Gamma Service,Gamma AP,Plant 4,Compressor,Completed,Ready,3,285,75,12,372')
  })
})
