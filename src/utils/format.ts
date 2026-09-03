type DateValue = string | number | Date | null | undefined
type MoneyValue = number | string | null | undefined

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
})

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
})

const logDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
})

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function parseDate(value: DateValue) {
  if (!value) return null

  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}(?:[T\s]00:00:00(?:\.000)?Z?)?$/.test(value.trim())
  ) {
    const [year = 0, month = 0, day = 0] = value.trim().slice(0, 10).split('-').map(Number)
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

function formatTimeLabel(value: string) {
  const [, hourValue = '0', minuteValue = '00'] =
    value.match(/\b(\d{2}):(\d{2})(?::\d{2})?\b/) || []
  const hour = Number(hourValue)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:${minuteValue} ${suffix}`
}

export function currentManilaDateInputValue(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return year && month && day ? `${year}-${month}-${day}` : ''
}

export function formatDate(value: DateValue, fallback = 'N/A') {
  const date = parseDate(value)
  if (!date) return value ? String(value) : fallback

  return dateFormatter.format(date)
}

export function formatLongDate(value: DateValue, fallback = 'N/A') {
  const date = parseDate(value)
  if (!date) return value ? String(value) : fallback

  return longDateFormatter.format(date)
}

export function formatDateTime(value: DateValue, fallback = 'N/A') {
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?$/.test(value.trim())
  ) {
    return `${formatDate(value.trim().slice(0, 10), fallback)}, ${formatTimeLabel(value)}`
  }

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
