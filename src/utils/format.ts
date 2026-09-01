type DateValue = string | number | Date | null | undefined
type MoneyValue = number | string | null | undefined

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const logDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function parseDate(value: DateValue) {
  if (!value) return null

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year = 0, month = 0, day = 0] = value.trim().split('-').map(Number)
    const dateOnly = new Date(year, month - 1, day)
    return Number.isNaN(dateOnly.getTime()) ? null : dateOnly
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function isWeekend(value: Date) {
  const day = value.getDay()
  return day === 0 || day === 6
}

export function formatDate(value: DateValue, fallback = 'N/A') {
  const date = parseDate(value)
  if (!date) return value ? String(value) : fallback

  return dateFormatter.format(date)
}

export function formatDateTime(value: DateValue, fallback = 'N/A') {
  const date = parseDate(value)
  if (!date) return value ? String(value) : fallback

  return dateTimeFormatter.format(date)
}

export function formatLogDateTime(value: DateValue, fallback = 'N/A') {
  const date = parseDate(value)
  if (!date) return value ? String(value) : fallback

  return logDateTimeFormatter.format(date)
}

export function formatMoney(value: MoneyValue, fallback = pesoFormatter.format(0)) {
  const amount = Number(value || 0)
  if (Number.isNaN(amount)) return value ? String(value) : fallback

  return pesoFormatter.format(amount)
}

export function formatCurrency(value: MoneyValue, fallback = 'N/A') {
  if (value === null || value === undefined || value === '') return fallback

  const amount = Number(value)
  if (Number.isNaN(amount)) return String(value)

  return pesoFormatter.format(amount)
}

export function addWorkingDays(value: DateValue, days: number) {
  const date = parseDate(value)
  if (!date || !Number.isInteger(days)) return null

  const cursor = startOfDay(date)
  let remaining = days

  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + 1)
    if (isWeekend(cursor)) continue
    remaining -= 1
  }

  return cursor
}

export function differenceInWorkingDays(from: DateValue, to: DateValue) {
  const start = parseDate(from)
  const end = parseDate(to)
  if (!start || !end) return null

  const normalizedStart = startOfDay(start)
  const normalizedEnd = startOfDay(end)

  if (normalizedStart.getTime() === normalizedEnd.getTime()) return 0

  const step = normalizedStart < normalizedEnd ? 1 : -1
  let count = 0
  const cursor = new Date(normalizedStart)

  while (cursor.getTime() !== normalizedEnd.getTime()) {
    cursor.setDate(cursor.getDate() + step)
    if (isWeekend(cursor)) continue
    count += step
  }

  return count
}
