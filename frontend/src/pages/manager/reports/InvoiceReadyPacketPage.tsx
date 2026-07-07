import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../api/httpClient'
import { reportsApi } from '../../../api/reportsApi'
import { useCompanyBranding } from '../../../features/companyBranding/CompanyBrandingContext'
import { downloadInvoiceReadyPacketPdf } from '../../../utils/invoiceReadyPacketPdf'
import type { InvoiceReadySummaryDto } from '../../../types'
import { Errorable } from '../common/Errorable'
import {
  generatedAtLabel,
  generatedDateStamp,
  getInvoiceStatusLabel,
  getJobStatusLabel,
  hours,
  money,
  quantity,
  reportBrandName,
  reportSlug
} from './reportDefinitions'

const valueOrDash = (value?: string | null) => value?.trim() || '-'

const laborCostTotal = (laborHours: number, costRate?: number | null) =>
  typeof costRate === 'number' ? laborHours * costRate : null

const laborBillableTotal = (billableHours: number, billRate?: number | null) =>
  typeof billRate === 'number' ? billableHours * billRate : null

const userMessageForPacketError = (requestError: unknown) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 401 || requestError.status === 403) return 'You do not have permission to view invoice-ready packets.'
    if (requestError.status === 404) return 'No invoice-ready packet was found for this job ticket.'
    if (requestError.status >= 500) return 'The server could not load this invoice-ready packet right now.'
  }
  return 'Unable to load invoice-ready packet.'
}

type PacketFactProps = {
  label: string
  value?: string | null
}

function PacketFact({ label, value }: PacketFactProps) {
  return (
    <div>
      <span>{label}</span>
      <strong>{valueOrDash(value)}</strong>
    </div>
  )
}

type PacketTotalsProps = {
  summary: InvoiceReadySummaryDto
}

function PacketTotals({ summary }: PacketTotalsProps) {
  return (
    <dl className="invoice-packet-totals" aria-label="invoice-ready totals">
      <div><dt>Labor hours</dt><dd>{hours(summary.laborHours)}</dd></div>
      <div><dt>Labor cost</dt><dd>{money(summary.laborCostTotal)}</dd></div>
      <div><dt>Labor billable</dt><dd>{money(summary.laborBillableTotal)}</dd></div>
      <div><dt>Parts cost</dt><dd>{money(summary.partsCostTotal)}</dd></div>
      <div><dt>Parts billable</dt><dd>{money(summary.partsBillableTotal)}</dd></div>
      <div><dt>Misc charges</dt><dd>{money(summary.miscCharges)}</dd></div>
      <div><dt>Tax</dt><dd>{money(summary.tax)}</dd></div>
      <div className="invoice-packet-grand-total"><dt>Grand total</dt><dd>{money(summary.grandTotal)}</dd></div>
    </dl>
  )
}

export function InvoiceReadyPacketPage() {
  const { jobTicketId } = useParams()
  const {
    configuration: companyConfiguration,
    logoUrl: companyLogoUrl,
    initials: companyInitials,
    addressLines: companyAddressLines
  } = useCompanyBranding()
  const [summary, setSummary] = useState<InvoiceReadySummaryDto | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [generatedFileDate, setGeneratedFileDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const companyReportDetails = useMemo(
    () => [
      companyConfiguration.legalName && companyConfiguration.legalName !== companyConfiguration.companyName
        ? companyConfiguration.legalName
        : null,
      companyConfiguration.contactName ? `Contact: ${companyConfiguration.contactName}` : null,
      ...companyAddressLines,
      companyConfiguration.phone,
      companyConfiguration.email,
      companyConfiguration.website
    ].filter((line): line is string => Boolean(line)),
    [companyAddressLines, companyConfiguration.companyName, companyConfiguration.contactName, companyConfiguration.email, companyConfiguration.legalName, companyConfiguration.phone, companyConfiguration.website]
  )

  useEffect(() => {
    let isMounted = true

    const loadPacket = async () => {
      if (!jobTicketId) {
        setSummary(null)
        setError('Select a job ticket before viewing an invoice-ready packet.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await reportsApi.getInvoiceReadySummary(jobTicketId)
        if (!isMounted) return
        setSummary(data)
        setGeneratedAt(generatedAtLabel())
        setGeneratedFileDate(generatedDateStamp())
      } catch (requestError) {
        if (!isMounted) return
        setSummary(null)
        setError(userMessageForPacketError(requestError))
        setGeneratedAt(null)
        setGeneratedFileDate(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPacket()

    return () => {
      isMounted = false
    }
  }, [jobTicketId])

  const downloadPdf = () => {
    if (!summary || !generatedAt) return

    downloadInvoiceReadyPacketPdf({
      brandName: reportBrandName,
      companyName: companyConfiguration.companyName,
      companyDetails: companyReportDetails,
      generatedAt,
      fileName: `invoice-ready-packet-${reportSlug(summary.jobTicketNumber)}${generatedFileDate ? `-${generatedFileDate}` : ''}.pdf`,
      summary,
      jobStatusLabel: getJobStatusLabel(summary.jobStatus),
      invoiceStatusLabel: getInvoiceStatusLabel(summary.invoiceStatus)
    })
  }

  return (
    <section className="invoice-packet-page stack">
      <div className="invoice-packet-toolbar no-print">
        <div>
          <p className="eyebrow">Invoice review</p>
          <h2>Invoice-ready Packet</h2>
          <p className="muted">Print or save the billing-ready details for a selected job.</p>
        </div>
        <div className="row">
          <Link className="button-link secondary-link" to="/manage/reports">Job Reports</Link>
          {summary ? <Link className="button-link secondary-link" to={`/manage/job-tickets/${summary.jobTicketId}`}>Open ticket</Link> : null}
          {summary ? <button type="button" className="secondary-button" onClick={() => window.print()}>Print</button> : null}
          {summary ? <button type="button" onClick={downloadPdf}>Download PDF</button> : null}
        </div>
      </div>

      <Errorable error={error} />
      {loading ? (
        <div className="report-result-state" role="status">
          <strong>Loading invoice-ready packet</strong>
          <span>Preparing job, labor, parts, and billing totals for review.</span>
        </div>
      ) : null}

      {summary ? (
        <article className="invoice-packet print-report-surface" aria-label="invoice-ready packet">
          <header className="invoice-packet-header">
            <div className="invoice-packet-letterhead">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt={`${companyConfiguration.companyName} logo`} />
              ) : (
                <span className="product-mark" aria-hidden="true">{companyInitials}</span>
              )}
              <div>
                <strong>{companyConfiguration.companyName}</strong>
                {companyReportDetails.length ? <span>{companyReportDetails.join(' | ')}</span> : null}
              </div>
            </div>
            <div className="invoice-packet-title">
              <p className="eyebrow">{reportBrandName}</p>
              <h2>Invoice-ready Packet</h2>
              <p className="muted">Generated {generatedAt} for {summary.jobTicketNumber}.</p>
            </div>
          </header>

          <section className="invoice-packet-summary" aria-label="invoice-ready summary">
            <div className="invoice-packet-status-grid">
              <PacketFact label="Job ticket" value={summary.jobTicketNumber} />
              <PacketFact label="Customer" value={summary.customer} />
              <PacketFact label="Billing party" value={summary.billingPartyCustomer} />
              <PacketFact label="Service location" value={summary.serviceLocation} />
              <PacketFact label="Equipment" value={summary.equipment} />
              <PacketFact label="PO number" value={summary.purchaseOrderNumber} />
              <PacketFact label="Job status" value={getJobStatusLabel(summary.jobStatus)} />
              <PacketFact label="Invoice status" value={getInvoiceStatusLabel(summary.invoiceStatus)} />
              <PacketFact label="Billing contact" value={summary.billingContactName} />
              <PacketFact label="Billing phone" value={summary.billingContactPhone} />
              <PacketFact label="Billing email" value={summary.billingContactEmail} />
              <PacketFact label="Generated" value={generatedAt} />
            </div>
          </section>

          <section className="invoice-packet-section" aria-label="work notes">
            <div className="invoice-packet-section-heading">
              <h3>Work Notes</h3>
              <span>{summary.workDescriptions.length} work note{summary.workDescriptions.length === 1 ? '' : 's'}</span>
            </div>
            {summary.customerFacingNotes ? (
              <div className="invoice-packet-note">
                <span>Customer-facing notes</span>
                <p>{summary.customerFacingNotes}</p>
              </div>
            ) : null}
            {summary.workDescriptions.length ? (
              <ol className="invoice-packet-note-list">
                {summary.workDescriptions.map((description, index) => (
                  <li key={`${description}-${index}`}>{description}</li>
                ))}
              </ol>
            ) : (
              <p className="muted">No work descriptions were captured for this packet.</p>
            )}
          </section>

          <section className="invoice-packet-section" aria-label="approved labor">
            <div className="invoice-packet-section-heading">
              <h3>Approved Labor</h3>
              <span>{summary.approvedLaborEntries.length} line{summary.approvedLaborEntries.length === 1 ? '' : 's'}</span>
            </div>
            <div className="table-scroll">
              <table className="invoice-packet-table">
                <caption>Approved labor line items</caption>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th className="numeric-cell">Hours</th>
                    <th className="numeric-cell">Billable Hours</th>
                    <th className="numeric-cell">Cost Rate</th>
                    <th className="numeric-cell">Bill Rate</th>
                    <th className="numeric-cell">Cost Total</th>
                    <th className="numeric-cell">Billable Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.approvedLaborEntries.length ? summary.approvedLaborEntries.map((line) => (
                    <tr key={line.timeEntryId}>
                      <td>{line.employeeName}</td>
                      <td className="numeric-cell">{hours(line.laborHours)}</td>
                      <td className="numeric-cell">{hours(line.billableHours)}</td>
                      <td className="numeric-cell">{money(line.costRate)}</td>
                      <td className="numeric-cell">{money(line.billRate)}</td>
                      <td className="numeric-cell">{money(laborCostTotal(line.laborHours, line.costRate))}</td>
                      <td className="numeric-cell">{money(laborBillableTotal(line.billableHours, line.billRate))}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7}>No approved labor entries.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="invoice-packet-section" aria-label="approved parts">
            <div className="invoice-packet-section-heading">
              <h3>Approved Parts</h3>
              <span>{summary.approvedParts.length} line{summary.approvedParts.length === 1 ? '' : 's'}</span>
            </div>
            <div className="table-scroll">
              <table className="invoice-packet-table">
                <caption>Approved part line items</caption>
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Part Number</th>
                    <th className="numeric-cell">Quantity</th>
                    <th className="numeric-cell">Unit Cost</th>
                    <th className="numeric-cell">Unit Price</th>
                    <th className="numeric-cell">Cost Total</th>
                    <th className="numeric-cell">Billable Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.approvedParts.length ? summary.approvedParts.map((line) => (
                    <tr key={line.jobTicketPartId}>
                      <td>{line.partName}</td>
                      <td>{line.partNumber}</td>
                      <td className="numeric-cell">{quantity(line.quantity)}</td>
                      <td className="numeric-cell">{money(line.unitCostSnapshot)}</td>
                      <td className="numeric-cell">{money(line.unitPriceSnapshot)}</td>
                      <td className="numeric-cell">{money(line.quantity * line.unitCostSnapshot)}</td>
                      <td className="numeric-cell">{money(line.quantity * line.unitPriceSnapshot)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7}>No approved parts.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="invoice-packet-section invoice-packet-totals-section" aria-label="billing totals">
            <div className="invoice-packet-section-heading">
              <h3>Billing Totals</h3>
              <span>Invoice review</span>
            </div>
            <PacketTotals summary={summary} />
          </section>
        </article>
      ) : null}
    </section>
  )
}
