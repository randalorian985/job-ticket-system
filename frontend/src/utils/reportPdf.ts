import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CsvColumn } from './csv'

export type PdfReportColumn<T> = CsvColumn<T> & {
  align?: 'text' | 'number'
}

type DownloadReportPdfArgs<T> = {
  brandName: string
  companyName: string
  companyDetails: string[]
  title: string
  description: string
  generatedAt: string
  filterSummary: string
  fileName: string
  rows: T[]
  columns: Array<PdfReportColumn<T>>
}

const formatCellValue = (value: string | number | boolean | null | undefined) => {
  if (value === null || typeof value === 'undefined') return ''
  return String(value)
}

export function downloadReportPdf<T>({
  brandName,
  companyName,
  companyDetails,
  title,
  description,
  generatedAt,
  filterSummary,
  fileName,
  rows,
  columns
}: DownloadReportPdfArgs<T>) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 36
  const contentWidth = pageWidth - margin * 2
  const companyDetailLines = companyDetails.length ? doc.splitTextToSize(companyDetails.join(' | '), contentWidth) : []
  const titleLines = doc.splitTextToSize(title, contentWidth)
  const descriptionLines = doc.splitTextToSize(description, contentWidth)
  const scopeLines = doc.splitTextToSize(filterSummary, contentWidth)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 118, 110)
  doc.text(brandName.toUpperCase(), margin, 32)

  doc.setTextColor(11, 18, 32)
  doc.setFontSize(13)
  doc.text(companyName, margin, 50)

  if (companyDetailLines.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
    doc.text(companyDetailLines, margin, 64)
  }

  doc.setTextColor(11, 18, 32)
  doc.setFontSize(20)
  const companyBlockHeight = 14 + (companyDetailLines.length * 11)
  doc.text(titleLines, margin, 52 + companyBlockHeight)

  const titleHeight = titleLines.length * 18
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(descriptionLines, margin, 52 + companyBlockHeight + titleHeight + 10)

  const descriptionHeight = descriptionLines.length * 13
  let metricsY = 52 + companyBlockHeight + titleHeight + 10 + descriptionHeight + 18

  const metricBoxes = [
    { label: 'Generated', value: generatedAt },
    { label: 'Rows', value: String(rows.length) },
    { label: 'Columns', value: String(columns.length) }
  ]
  const boxWidth = (contentWidth - 16) / 3
  metricBoxes.forEach((metric, index) => {
    const x = margin + index * (boxWidth + 8)
    doc.setDrawColor(203, 213, 225)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, metricsY, boxWidth, 42, 8, 8, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    doc.text(metric.label.toUpperCase(), x + 10, metricsY + 15)
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(metric.value, x + 10, metricsY + 31)
  })

  metricsY += 58
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, metricsY, pageWidth - margin, metricsY)
  metricsY += 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text('APPLIED SCOPE', margin, metricsY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(scopeLines, margin, metricsY + 14)

  const scopeHeight = scopeLines.length * 13
  const tableStartY = metricsY + 22 + scopeHeight

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => formatCellValue(column.value(row)))),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      lineColor: [209, 213, 219],
      lineWidth: 0.5,
      textColor: [17, 24, 39],
      valign: 'top'
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: columns.reduce<Record<number, { halign?: 'left' | 'right' }>>((styles, column, index) => {
      if (column.align === 'number') styles[index] = { halign: 'right' }
      return styles
    }, {}),
    didDrawPage: (data) => {
      const footerY = doc.internal.pageSize.getHeight() - 24
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text(`${brandName} · ${title}`, margin, footerY)
      doc.text(`Page ${String(data.pageNumber)}`, pageWidth - margin, footerY, { align: 'right' })
    }
  })

  doc.save(fileName)
}