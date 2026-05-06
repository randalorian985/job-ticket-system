export type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | boolean | null | undefined
}

const escapeCsvValue = (value: string | number | boolean | null | undefined) => {
  const text = value === null || typeof value === 'undefined' ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]) {
  if (!rows.length || !columns.length) return ''

  return [
    columns.map((column) => escapeCsvValue(column.header)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(column.value(row))).join(','))
  ].join('\n')
}

export function csvDataUri(csv: string) {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
}
