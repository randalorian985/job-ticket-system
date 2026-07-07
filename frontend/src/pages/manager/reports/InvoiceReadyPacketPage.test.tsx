import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/httpClient'
import { reportsApi } from '../../../api/reportsApi'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { downloadInvoiceReadyPacketPdf } from '../../../utils/invoiceReadyPacketPdf'
import { InvoiceReadyPacketPage } from './InvoiceReadyPacketPage'

vi.mock('../../../api/reportsApi', () => ({
  reportsApi: {
    getInvoiceReadySummary: vi.fn()
  }
}))

vi.mock('../../../features/companyBranding/CompanyBrandingContext', () => ({
  useCompanyBranding: () => ({
    configuration: {
      companyName: 'Mudbug Digital',
      legalName: 'Mudbug Digital LLC',
      contactName: 'Riley Manager',
      phone: '555-0100',
      email: 'ops@mudbugdigital.test',
      website: 'https://mudbugdigital.test'
    },
    isLoading: false,
    logoUrl: '/branding/mudbug-logo.png',
    initials: 'MD',
    addressLines: ['100 Bayou Road', 'Lafayette, LA, 70501'],
    refresh: vi.fn()
  })
}))

vi.mock('../../../utils/invoiceReadyPacketPdf', () => ({
  downloadInvoiceReadyPacketPdf: vi.fn()
}))

const renderPacket = (initialEntry = '/manage/reports/invoice-ready/job-1') => renderWithRouter(
  <Routes>
    <Route path="/manage/reports/invoice-ready/:jobTicketId" element={<InvoiceReadyPacketPage />} />
  </Routes>,
  { initialEntries: [initialEntry] }
)

const summary = {
  jobTicketId: 'job-1',
  jobTicketNumber: 'JT-READY',
  customer: 'Acme Service',
  billingPartyCustomer: 'Acme AP',
  serviceLocation: 'Plant 4',
  equipment: 'Compressor',
  jobStatus: 7,
  invoiceStatus: 2,
  customerFacingNotes: 'Customer approved overtime.',
  workDescriptions: ['Replaced failed hose.', 'Tested pressure under load.'],
  approvedLaborEntries: [
    { timeEntryId: 'time-1', employeeId: 'emp-1', employeeName: 'Taylor Technician', laborHours: 2, billableHours: 1.5, costRate: 40, billRate: 95 }
  ],
  approvedParts: [
    { jobTicketPartId: 'part-1', partId: 'catalog-1', partNumber: 'HYD-100', partName: 'Hydraulic hose', quantity: 2, unitCostSnapshot: 12, unitPriceSnapshot: 25 }
  ],
  laborHours: 2,
  laborCostTotal: 80,
  laborBillableTotal: 142.5,
  partsCostTotal: 24,
  partsBillableTotal: 50,
  miscCharges: 0,
  tax: 12,
  grandTotal: 204.5,
  purchaseOrderNumber: 'PO-88',
  billingContactName: 'Alex Accounts',
  billingContactPhone: '555-0111',
  billingContactEmail: 'ap@acme.test'
}

describe('InvoiceReadyPacketPage', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.spyOn(window, 'print').mockImplementation(() => undefined)
    vi.mocked(reportsApi.getInvoiceReadySummary).mockResolvedValue(summary as any)
  })

  it('renders a printable invoice-ready packet with labor, parts, and totals', async () => {
    renderPacket()

    expect(await screen.findByLabelText('invoice-ready packet')).toBeInTheDocument()
    expect(reportsApi.getInvoiceReadySummary).toHaveBeenCalledWith('job-1')
    expect(screen.getByText('JT-READY')).toBeInTheDocument()
    expect(screen.getByText('Acme AP')).toBeInTheDocument()
    expect(screen.getByText('PO-88')).toBeInTheDocument()
    expect(screen.getByText('Customer approved overtime.')).toBeInTheDocument()
    expect(screen.getByText('Replaced failed hose.')).toBeInTheDocument()

    const laborTable = screen.getByRole('table', { name: 'Approved labor line items' })
    expect(within(laborTable).getByRole('cell', { name: 'Taylor Technician' })).toBeInTheDocument()
    expect(within(laborTable).getByRole('cell', { name: '$142.50' })).toBeInTheDocument()

    const partsTable = screen.getByRole('table', { name: 'Approved part line items' })
    expect(within(partsTable).getByRole('cell', { name: 'Hydraulic hose' })).toBeInTheDocument()
    expect(within(partsTable).getByRole('cell', { name: '$50.00' })).toBeInTheDocument()

    expect(screen.getByLabelText('invoice-ready totals')).toHaveTextContent('$204.50')
    expect(screen.getByRole('link', { name: 'Open ticket' })).toHaveAttribute('href', '/manage/job-tickets/job-1')
  })

  it('prints and downloads the packet PDF', async () => {
    renderPacket()

    expect(await screen.findByLabelText('invoice-ready packet')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Print' }))
    expect(window.print).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }))
    expect(downloadInvoiceReadyPacketPdf).toHaveBeenCalledWith(expect.objectContaining({
      brandName: 'Job Ticket System',
      companyName: 'Mudbug Digital',
      summary: expect.objectContaining({ jobTicketId: 'job-1' }),
      jobStatusLabel: 'Completed',
      invoiceStatusLabel: 'Ready',
      fileName: expect.stringMatching(/^invoice-ready-packet-jt-ready-\d{4}-\d{2}-\d{2}\.pdf$/)
    }))
  })

  it('shows a friendly error when the packet source is missing', async () => {
    vi.mocked(reportsApi.getInvoiceReadySummary).mockRejectedValue(new ApiError('Not found', 404))

    renderPacket()

    await waitFor(() => expect(screen.getByText('No invoice-ready packet was found for this job ticket.')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Download PDF' })).not.toBeInTheDocument()
  })
})
