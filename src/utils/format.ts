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

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
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
