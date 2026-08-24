import * as XLSX from 'xlsx'

type AutoFitOptions = {
  minWidth?: number
  maxWidth?: number
  padding?: number
}

type DateValue = string | number | Date | null | undefined

const manilaDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
})

const manilaDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
})

function parseDate(value: DateValue) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getDisplayWidth(value: unknown): number {
  if (value == null) return 0

  return String(value)
    .split('\n')
    .reduce((maximum, line) => Math.max(maximum, line.trim().length), 0)
}

export function autoFitWorksheetColumns(
  worksheet: XLSX.WorkSheet,
  options: AutoFitOptions = {},
) {
  const rangeRef = worksheet['!ref']
  if (!rangeRef) return worksheet

  const minWidth = options.minWidth ?? 10
  const maxWidth = options.maxWidth ?? 60
  const padding = options.padding ?? 2
  const range = XLSX.utils.decode_range(rangeRef)
  const widths: Array<{ wch: number }> = []

  for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
    let widestCell = minWidth

    for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
      const cellAddress = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex })
      const cell = worksheet[cellAddress]
      const displayValue = cell?.w ?? cell?.v

      widestCell = Math.max(widestCell, getDisplayWidth(displayValue) + padding)
    }

    widths[columnIndex] = { wch: Math.min(widestCell, maxWidth) }
  }

  worksheet['!cols'] = widths
  return worksheet
}

export function formatExcelDateManila(value: DateValue, fallback = '') {
  const date = parseDate(value)
  if (!date) return value ? String(value) : fallback

  return manilaDateFormatter.format(date)
}

export function formatExcelDateTimeManila(value: DateValue, fallback = '') {
  const date = parseDate(value)
  if (!date) return value ? String(value) : fallback

  return manilaDateTimeFormatter.format(date)
}
