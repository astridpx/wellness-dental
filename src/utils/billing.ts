export type BillingStatement = {
  id?: number | null
  period: string
  serverFee: number
  administratorFee: number
  totalAmount: number
  isPaid: boolean
  paidAt: string
  paymentReference: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

export const BILLING_STORAGE_KEY = 'imsBillingStatements'
export const MONTHLY_SERVER_FEE = 4000
export const MONTHLY_ADMINISTRATOR_FEE = 1000
export const MONTHLY_BILLING_TOTAL = MONTHLY_SERVER_FEE + MONTHLY_ADMINISTRATOR_FEE

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Manila',
})

export function getCurrentBillingPeriod(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'Asia/Manila',
  }).formatToParts(value)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value

  return year && month ? `${year}-${month}` : value.toISOString().slice(0, 7)
}

export function formatBillingPeriod(period: string) {
  const [year, month] = period.split('-').map(Number)
  if (!year || !month) return period

  return monthFormatter.format(new Date(year, month - 1, 1))
}

export function getDefaultBillingStatement(period = getCurrentBillingPeriod()): BillingStatement {
  return {
    period,
    serverFee: MONTHLY_SERVER_FEE,
    administratorFee: MONTHLY_ADMINISTRATOR_FEE,
    totalAmount: MONTHLY_BILLING_TOTAL,
    isPaid: false,
    paidAt: '',
    paymentReference: '',
    notes: '',
  }
}

export function readBillingStatements(): BillingStatement[] {
  try {
    const storedValue = localStorage.getItem(BILLING_STORAGE_KEY)
    if (!storedValue) return []

    const parsedValue = JSON.parse(storedValue)
    if (!Array.isArray(parsedValue)) return []

    return parsedValue
      .filter((item): item is BillingStatement => Boolean(item?.period))
      .map((item) => ({
        id: item.id ? Number(item.id) : null,
        period: String(item.period),
        serverFee: Number(item.serverFee || MONTHLY_SERVER_FEE),
        administratorFee: Number(item.administratorFee || MONTHLY_ADMINISTRATOR_FEE),
        totalAmount: Number(item.totalAmount || MONTHLY_BILLING_TOTAL),
        isPaid: Boolean(item.isPaid),
        paidAt: item.paidAt ? String(item.paidAt) : '',
        paymentReference: item.paymentReference ? String(item.paymentReference) : '',
        notes: item.notes ? String(item.notes) : '',
        createdAt: item.createdAt ? String(item.createdAt) : '',
        updatedAt: item.updatedAt ? String(item.updatedAt) : '',
      }))
  } catch {
    return []
  }
}

export function readBillingStatement(period = getCurrentBillingPeriod()) {
  return (
    readBillingStatements().find((statement) => statement.period === period) ||
    getDefaultBillingStatement(period)
  )
}

export function saveBillingStatement(statement: BillingStatement) {
  const statements = readBillingStatements()
  const index = statements.findIndex((item) => item.period === statement.period)

  if (index >= 0) {
    statements[index] = statement
  } else {
    statements.push(statement)
  }

  localStorage.setItem(
    BILLING_STORAGE_KEY,
    JSON.stringify(statements.sort((a, b) => b.period.localeCompare(a.period))),
  )
}
