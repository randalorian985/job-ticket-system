import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { InvoiceReadySummaryDto } from '../types'

type DownloadInvoiceReadyPacketPdfArgs = {
  brandName: string
  companyName: string
  companyDetails: string[]
  generatedAt: string
  fileName: string
  summary: InvoiceReadySummaryDto
  jobStatusLabel: string
  invoiceStatusLabel: string
}

const money = (value?: number | null) =>
  typeof value === 'number' ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '-'

const quantity = (value?: number | null) =>
  typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'

const hours = (value?: number | null) =>
  typeof value === 'number' ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} h` : '-'

const valueOrDash = (value?: string | null) => value?.trim() || '-'

const laborCostTotal = (laborHours: number, costRate?: number | null) =>
  typeof costRate === 'number' ? laborHours * costRate : null

const laborBillableTotal = (billableHours: number, billRate?: number | null) =>
  typeof billRate === 'number' ? billableHours * billRate : null

export function downloadInvoiceReadyPacketPdf({
  brandName,
  companyName,
  companyDetails,
  generatedAt,
  fileName,
  summary,
  jobStatusLabel,
  invoiceStatusLabel
}: DownloadInvoiceReadyPacketPdfArgs) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  let y = 34

  const ensureSpace = (height: number) => {
    if (y + height < pageHeight - 48) return
    doc.addPage()
    y = 40
  }

  const addWrappedText = (text: string, x: number, startY: number, width: number, lineHeight = 11) => {
    const lines = doc.splitTextToSize(text, width)
    doc.text(lines, x, startY)
    return startY + lines.length * lineHeight
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(49, 87, 200)
  doc.text(brandName.toUpperCase(), margin, y)

  y += 18
  doc.setTextColor(17, 32, 51)
  doc.setFontSize(14)
  doc.text(companyName, margin, y)

  if (companyDetails.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(95, 107, 122)
    y = addWrappedText(companyDetails.join(' | '), margin, y + 13, contentWidth, 10)
  }

  y += 18
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(17, 32, 51)
  doc.text('Invoice-ready Packet', margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(95, 107, 122)
  y = addWrappedText(`Generated ${generatedAt} for ${summary.jobTicketNumber}.`, margin, y + 16, contentWidth, 12)

  y += 12
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    body: [
      ['Job Ticket', summary.jobTicketNumber, 'Customer', summary.customer],
      ['Billing Party', summary.billingPartyCustomer, 'Service Location', summary.serviceLocation],
      ['Equipment', valueOrDash(summary.equipment), 'PO Number', valueOrDash(summary.purchaseOrderNumber)],
      ['Job Status', jobStatusLabel, 'Invoice Status', invoiceStatusLabel],
      ['Billing Contact', valueOrDash(summary.billingContactName), 'Phone', valueOrDash(summary.billingContactPhone)],
      ['Billing Email', valueOrDash(summary.billingContactEmail), 'Generated', generatedAt]
    ],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 5,
      lineColor: [209, 213, 219],
      lineWidth: 0.5,
      textColor: [17, 24, 39]
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 78 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 82 }
    }
  })
  y = (doc as any).lastAutoTable.finalY + 18

  const notes = [
    summary.customerFacingNotes ? `Customer-facing notes: ${summary.customerFacingNotes}` : null,
    ...summary.workDescriptions.map((description, index) => `Work ${index + 1}: ${description}`)
  ].filter((line): line is string => Boolean(line))

  if (notes.length) {
    ensureSpace(70)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(17, 32, 51)
    doc.text('Work Notes', margin, y)
    y += 15
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
    for (const note of notes) {
      ensureSpace(28)
      y = addWrappedText(note, margin, y, contentWidth, 11) + 4
    }
    y += 8
  }

  ensureSpace(120)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [['Approved Labor', 'Hours', 'Billable Hours', 'Cost Rate', 'Bill Rate', 'Cost Total', 'Billable Total']],
    body: summary.approvedLaborEntries.length
      ? summary.approvedLaborEntries.map((line) => [
        line.employeeName,
        hours(line.laborHours),
        hours(line.billableHours),
        money(line.costRate),
        money(line.billRate),
        money(laborCostTotal(line.laborHours, line.costRate)),
        money(laborBillableTotal(line.billableHours, line.billRate))
      ])
      : [['No approved labor entries.', '', '', '', '', '', '']],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      lineColor: [209, 213, 219],
      lineWidth: 0.5,
      textColor: [17, 24, 39]
    },
    headStyles: {
      fillColor: [49, 87, 200],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    }
  })
  y = (doc as any).lastAutoTable.finalY + 18

  ensureSpace(120)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [['Approved Parts', 'Part Number', 'Quantity', 'Unit Cost', 'Unit Price', 'Cost Total', 'Billable Total']],
    body: summary.approvedParts.length
      ? summary.approvedParts.map((line) => [
        line.partName,
        line.partNumber,
        quantity(line.quantity),
        money(line.unitCostSnapshot),
        money(line.unitPriceSnapshot),
        money(line.quantity * line.unitCostSnapshot),
        money(line.quantity * line.unitPriceSnapshot)
      ])
      : [['No approved parts.', '', '', '', '', '', '']],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      lineColor: [209, 213, 219],
      lineWidth: 0.5,
      textColor: [17, 24, 39]
    },
    headStyles: {
      fillColor: [49, 87, 200],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    }
  })
  y = (doc as any).lastAutoTable.finalY + 18

  ensureSpace(115)
  autoTable(doc, {
    startY: y,
    margin: { left: pageWidth - margin - 210, right: margin },
    tableWidth: 210,
    theme: 'grid',
    body: [
      ['Labor Hours', hours(summary.laborHours)],
      ['Labor Cost', money(summary.laborCostTotal)],
      ['Labor Billable', money(summary.laborBillableTotal)],
      ['Parts Cost', money(summary.partsCostTotal)],
      ['Parts Billable', money(summary.partsBillableTotal)],
      ['Misc Charges', money(summary.miscCharges)],
      ['Tax', money(summary.tax)],
      ['Grand Total', money(summary.grandTotal)]
    ],
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 5,
      lineColor: [209, 213, 219],
      lineWidth: 0.5
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { halign: 'right' }
    }
  })

  const pageCount = doc.getNumberOfPages()
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber)
    const footerY = pageHeight - 24
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`${brandName} | ${summary.jobTicketNumber}`, margin, footerY)
    doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' })
  }

  doc.save(fileName)
}
