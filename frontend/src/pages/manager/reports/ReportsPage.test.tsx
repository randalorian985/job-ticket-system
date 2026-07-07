import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { ApiError } from '../../../api/httpClient'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { masterDataApi } from '../../../api/masterDataApi'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { reportsApi } from '../../../api/reportsApi'
import { usersApi } from '../../../api/usersApi'
import { downloadReportPdf } from '../../../utils/reportPdf'
import { LaborReportsPage, PartsServiceReportsPage, ReportsPage } from './ReportsPage'

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

const reportDefaultsStorageKey = 'job-ticket-system:manager-reports:defaults:v1'

const renderBillingReports = () => renderWithRouter(<ReportsPage />)
const renderLaborReports = () => renderWithRouter(<LaborReportsPage />)
const renderPartsServiceReports = () => renderWithRouter(<PartsServiceReportsPage />)

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
  it('renders the Job Reports billing page without labor, parts, or service-history reports', () => {
    renderBillingReports()

    expect(screen.getByRole('heading', { name: 'Job Reports' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'report preview' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'report catalog' })).toBeInTheDocument()
    expect(screen.getByText('Invoice and billing reporting for job closeout and Manager/Admin review.')).toBeInTheDocument()
    expect(screen.getByLabelText('report catalog summary')).toHaveTextContent('3 reports')
    expect(screen.getByLabelText('report catalog summary')).toHaveTextContent('1 optional set')
    expect(screen.getByLabelText('report catalog summary')).toHaveTextContent('2 scoped reports')
    expect(screen.getByText(/Run billing reports, then export CSV or PDF/i)).toBeInTheDocument()
    expect(screen.queryByText('Report group')).not.toBeInTheDocument()

    const invoiceSection = screen.getByLabelText('Invoice and Billing')
    expect(within(invoiceSection).getByText('3 reports')).toBeInTheDocument()
    expect(within(invoiceSection).getByText('Invoice-ready Summary')).toBeInTheDocument()
    expect(within(invoiceSection).getByText('Job Cost Summary')).toBeInTheDocument()
    expect(within(invoiceSection).getByText('Jobs Ready to Invoice')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Invoice-ready Summary report')).getByLabelText('Invoice-ready Summary job ticket')).toBeInTheDocument()

    expect(screen.queryByLabelText('Approved Labor')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Parts & Service History')).not.toBeInTheDocument()
    expect(screen.queryByText('Labor by Job')).not.toBeInTheDocument()
    expect(screen.queryByText('Labor by Employee')).not.toBeInTheDocument()
    expect(screen.queryByText('Parts by Job')).not.toBeInTheDocument()
    expect(screen.queryByText('Customer Service History')).not.toBeInTheDocument()
  })

  it('renders the moved Labor Reports page without parts or service-history reports', () => {
    renderLaborReports()

    expect(screen.getByRole('heading', { level: 2, name: 'Labor Reports' })).toBeInTheDocument()
    expect(screen.getByText('Labor reporting for approved time by job or employee.')).toBeInTheDocument()
    expect(screen.getByLabelText('report catalog summary')).toHaveTextContent('2 reports')
    expect(screen.getByLabelText('report catalog summary')).toHaveTextContent('2 optional sets')
    expect(screen.getByLabelText('report catalog summary')).toHaveTextContent('0 scoped reports')
    expect(screen.getByText(/Approved-time rates are captured at approval/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Invoice and Billing')).not.toBeInTheDocument()

    const laborSection = screen.getByLabelText('Approved Labor')
    expect(within(laborSection).getByText('2 reports')).toBeInTheDocument()
    expect(within(laborSection).getByText('Labor by Job')).toBeInTheDocument()
    expect(within(laborSection).getByText('Labor by Employee')).toBeInTheDocument()
    expect(screen.queryByText('Parts by Job')).not.toBeInTheDocument()
    expect(screen.queryByText('Customer Service History')).not.toBeInTheDocument()
  })

  it('renders the moved Parts & Service Reports page without labor reports', () => {
    renderPartsServiceReports()

    expect(screen.getByRole('heading', { name: 'Parts & Service Reports' })).toBeInTheDocument()
    expect(screen.getByText('Parts usage and customer service-history reporting for operational review.')).toBeInTheDocument()
    expect(screen.getByLabelText('report catalog summary')).toHaveTextContent('3 reports')
    expect(screen.getByLabelText('report catalog summary')).toHaveTextContent('2 optional sets')
    expect(screen.getByLabelText('report catalog summary')).toHaveTextContent('1 scoped report')
    expect(screen.getByText(/Use customer history to review service records/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Invoice and Billing')).not.toBeInTheDocument()

    const partsServiceSection = screen.getByLabelText('Parts & Service History')
    expect(within(partsServiceSection).getByText('3 reports')).toBeInTheDocument()
    expect(within(partsServiceSection).getByText('Parts by Job')).toBeInTheDocument()
    expect(within(partsServiceSection).getByText('Customer Service History')).toBeInTheDocument()
    expect(within(partsServiceSection).getByText('Parts Usage History')).toBeInTheDocument()
    expect(within(partsServiceSection).getByRole('link', { name: 'Open Parts Usage History' })).toHaveAttribute('href', '/manage/parts-usage-history')
    expect(screen.queryByText('Labor by Job')).not.toBeInTheDocument()
    expect(screen.queryByText('Labor by Employee')).not.toBeInTheDocument()
    expect(screen.queryByText('Equipment Service History')).not.toBeInTheDocument()
    expect(within(screen.getByLabelText('Customer Service History report')).getByLabelText('Customer Service History customer')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Customer Service History report')).getByLabelText('Customer Service History equipment')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Report Filters' })).not.toBeInTheDocument()
  })

  it('opens optional filters only on the selected report card', () => {
    renderLaborReports()

    const cardsWithFilters = [
      'Labor by Job',
      'Labor by Employee'
    ].map((reportTitle) => {
      const card = screen.getByLabelText(`${reportTitle} report`)
      const details = within(card).getByText('Show optional filters').closest('details')
      expect(details).toBeInTheDocument()
      expect(details).not.toHaveAttribute('open')
      return { reportTitle, details }
    })

    fireEvent.click(within(screen.getByLabelText('Labor by Job report')).getByText('Show optional filters'))

    for (const { reportTitle, details } of cardsWithFilters) {
      if (reportTitle === 'Labor by Job') {
        expect(details).toHaveAttribute('open')
      } else {
        expect(details).not.toHaveAttribute('open')
      }
    }
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

    renderLaborReports()

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

    renderLaborReports()

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

    renderPartsServiceReports()

    fireEvent.click(screen.getByRole('button', { name: 'Run Parts by Job' }))

    expect(await screen.findByText('You do not have permission to run manager reports.')).toBeInTheDocument()
    expect(screen.queryByText(/No rows match the current report and filters/i)).not.toBeInTheDocument()
  })

  it('filters Parts by Job to a selected job ticket', async () => {
    vi.mocked(reportsApi.getPartsByJob).mockResolvedValue([
      {
        jobTicketId: 'job-1',
        jobTicketNumber: 'JT-2026-000123',
        customer: 'Acme Service',
        approvedPartQuantity: 3,
        partsCostTotal: 90,
        partsBillableTotal: 150,
        createdAtUtc: '2026-05-01T00:30:00Z',
        completedAtUtc: '2026-05-02T00:30:00Z'
      }
    ] as any)

    renderPartsServiceReports()

    const partsByJobCard = screen.getByLabelText('Parts by Job report')
    expect(await within(partsByJobCard).findByRole('option', { name: 'JT-2026-000123 - Labor review job' })).toBeInTheDocument()
    fireEvent.click(within(partsByJobCard).getByText('Show optional filters'))
    fireEvent.change(within(partsByJobCard).getByLabelText('Parts by Job job ticket filter'), { target: { value: 'job-1' } })
    fireEvent.click(within(partsByJobCard).getByRole('button', { name: 'Run Parts by Job' }))

    expect(await screen.findByRole('link', { name: 'JT-2026-000123' })).toHaveAttribute('href', '/manage/job-tickets/job-1')
    expect(screen.getByRole('cell', { name: '$150.00' })).toBeInTheDocument()
    expect(screen.getByLabelText('report summary')).toHaveTextContent('Job ticket: JT-2026-000123 - Labor review job')
    expect(reportsApi.getPartsByJob).toHaveBeenCalledWith({ jobTicketId: 'job-1' })
  })

  it('validates required source IDs before calling single-record report APIs', () => {
    renderBillingReports()

    fireEvent.click(screen.getByRole('button', { name: 'Run Invoice-ready Summary' }))

    expect(screen.getByText('Select a job ticket before running Invoice-ready Summary.')).toBeInTheDocument()
    expect(reportsApi.getInvoiceReadySummary).not.toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: 'Export CSV' })).not.toBeInTheDocument()
  })

  it('keeps single-ticket report source dropdown selections independent', async () => {
    renderBillingReports()
    const invoiceCard = screen.getByLabelText('Invoice-ready Summary report')
    const costCard = screen.getByLabelText('Job Cost Summary report')

    expect(await within(invoiceCard).findByRole('option', { name: 'JT-READY - Ready compressor PM' })).toBeInTheDocument()

    const invoiceSelect = within(invoiceCard).getByLabelText('Invoice-ready Summary job ticket')
    const costSelect = within(costCard).getByLabelText('Job Cost Summary job ticket')

    fireEvent.change(invoiceSelect, { target: { value: 'job-invoice-1' } })
    expect(invoiceSelect).toHaveValue('job-invoice-1')
    expect(costSelect).toHaveValue('')

    fireEvent.change(costSelect, { target: { value: 'job-1' } })
    expect(invoiceSelect).toHaveValue('job-invoice-1')
    expect(costSelect).toHaveValue('job-1')
  })

  it('keeps customer service history source and equipment selection scoped to the service report page', async () => {
    renderPartsServiceReports()

    const customerHistoryCard = screen.getByLabelText('Customer Service History report')
    const customerSelect = within(customerHistoryCard).getByLabelText('Customer Service History customer')
    const equipmentFilter = within(customerHistoryCard).getByLabelText('Customer Service History equipment')

    // Equipment filter is disabled until a customer is selected
    expect(equipmentFilter).toBeDisabled()
    expect(await within(customerHistoryCard).findByRole('option', { name: 'Acme Service (ACME)' })).toBeInTheDocument()

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
    renderLaborReports()

    const laborByJobCard = screen.getByLabelText('Labor by Job report')
    const laborByEmployeeCard = screen.getByLabelText('Labor by Employee report')

    fireEvent.click(within(laborByJobCard).getByText('Show optional filters'))
    fireEvent.click(within(laborByEmployeeCard).getByText('Show optional filters'))

    const laborByJobCustomer = within(laborByJobCard).getByLabelText('Labor by Job customer filter')
    const laborByEmployeeCustomer = within(laborByEmployeeCard).getByLabelText('Labor by Employee customer filter')
    await waitFor(() => expect(laborByJobCustomer).not.toBeDisabled())

    fireEvent.change(laborByJobCustomer, { target: { value: 'customer-1' } })
    expect(laborByJobCustomer).toHaveValue('customer-1')
    expect(laborByEmployeeCustomer).toHaveValue('')

    fireEvent.change(laborByEmployeeCustomer, { target: { value: 'customer-1' } })
    expect(laborByJobCustomer).toHaveValue('customer-1')
    expect(laborByEmployeeCustomer).toHaveValue('customer-1')

    fireEvent.change(laborByJobCustomer, { target: { value: '' } })
    expect(laborByJobCustomer).toHaveValue('')
    expect(laborByEmployeeCustomer).toHaveValue('customer-1')
  })

  it('restores report-specific saved defaults across report pages and clears them from reset', async () => {
    renderBillingReports()

    const costCard = screen.getByLabelText('Job Cost Summary report')
    expect(await within(costCard).findByRole('option', { name: 'JT-READY - Ready compressor PM' })).toBeInTheDocument()
    fireEvent.change(within(costCard).getByLabelText('Job Cost Summary job ticket'), { target: { value: 'job-invoice-1' } })

    cleanup()
    renderLaborReports()

    const laborByJobCard = screen.getByLabelText('Labor by Job report')
    fireEvent.click(within(laborByJobCard).getByText('Show optional filters'))
    expect(await within(laborByJobCard).findByRole('option', { name: 'Acme Service (ACME)' })).toBeInTheDocument()
    fireEvent.change(within(laborByJobCard).getByLabelText('Labor by Job customer filter'), { target: { value: 'customer-1' } })
    await waitFor(() => expect(localStorage.getItem(reportDefaultsStorageKey)).toContain('customer-1'))

    cleanup()
    renderBillingReports()

    const restoredCostCard = screen.getByLabelText('Job Cost Summary report')
    expect(await within(restoredCostCard).findByRole('option', { name: 'JT-READY - Ready compressor PM' })).toBeInTheDocument()
    expect(within(restoredCostCard).getByLabelText('Job Cost Summary job ticket')).toHaveValue('job-invoice-1')

    cleanup()
    renderLaborReports()

    const restoredLaborByJobCard = screen.getByLabelText('Labor by Job report')
    fireEvent.click(within(restoredLaborByJobCard).getByText('Show optional filters'))
    expect(await within(restoredLaborByJobCard).findByRole('option', { name: 'Acme Service (ACME)' })).toBeInTheDocument()
    expect(within(restoredLaborByJobCard).getByLabelText('Labor by Job customer filter')).toHaveValue('customer-1')

    fireEvent.click(screen.getByRole('button', { name: 'Reset report inputs' }))
    expect(within(restoredLaborByJobCard).getByLabelText('Labor by Job customer filter')).toHaveValue('')
    expect(localStorage.length).toBe(0)

    cleanup()
    renderBillingReports()
    const clearedCostCard = screen.getByLabelText('Job Cost Summary report')
    expect(await within(clearedCostCard).findByRole('option', { name: 'JT-READY - Ready compressor PM' })).toBeInTheDocument()
    expect(within(clearedCostCard).getByLabelText('Job Cost Summary job ticket')).toHaveValue('')
  })

  it('validates report date ranges before calling report APIs', async () => {
    renderLaborReports()

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

    renderBillingReports()

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
