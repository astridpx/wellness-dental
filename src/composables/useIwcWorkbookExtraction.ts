import * as XLSX from 'xlsx'
import { computed, ref } from 'vue'

type SheetExtractionSummary = {
  sheetName: string
  receivedDate: string | null
  companyName: string | null
  paymentPeriods: string[]
  memberRows: number
  dentalPremiumTotal: number
  skippedRows: number
  invalidRows: number
  status: 'ready' | 'warning'
  errorMessage: string
}

const HEADER_ALIASES = {
  companyName: ['COMPANY NAME', 'AREA/LOCATION', 'AREA LOCATION'],
  planholderId: ['PLANHOLDERID', 'PLANHOLDER ID', 'PLAN HOLDER ID', 'PLANHOLDER NO'],
  fullName: ['MEMBERNAME', 'MEMBER NAME', 'FULL NAME', 'NAME'],
  dentalPremium: ['DENTAL PREMIUM', 'DENTAL PREMIUM 1', 'DENTALPREMIUM', 'DENTALPREM1'],
  paymentPeriod: ['FOR THE MONTH OF', 'PAYMENT PERIOD', 'BILLING PERIOD', 'MONTH'],
} as const

function normalizeCell(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeHeader(value: unknown): string {
  return normalizeCell(value).toUpperCase()
}

function findHeaderValue(
  mapped: Record<string, string>,
  aliases: readonly string[],
): string {
  return aliases.map((alias) => mapped[normalizeHeader(alias)] || '').find(Boolean) || ''
}

function parseMoney(value: unknown): number {
  const normalized = normalizeCell(value).replaceAll(',', '')
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function resolveSheetDate(sheetName: string): string | null {
  const match = sheetName.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/)
  if (!match) return null

  const [, rawMonth, rawDay, rawYear] = match
  const month = Number(rawMonth)
  const day = Number(rawDay)
  const year = Number(rawYear) < 100 ? 2000 + Number(rawYear) : Number(rawYear)

  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function isSummaryRow(rawValues: string[], hasIdentityFields: boolean, hasOnlyTotals: boolean): boolean {
  const normalizedValues = rawValues
    .map((value) => normalizeCell(value).toUpperCase())
    .filter(Boolean)

  if (normalizedValues.some((value) => value.includes('TOTAL') || value.includes('SUM'))) {
    return true
  }

  return !hasIdentityFields && hasOnlyTotals
}

function findHeaderRow(rows: unknown[][]): { headerIndex: number; headers: string[] } | null {
  for (let index = 0; index < Math.min(rows.length, 10); index += 1) {
    const headers = (rows[index] || []).map(normalizeHeader)
    const hasFullName = headers.some((header) =>
      HEADER_ALIASES.fullName.some((alias) => normalizeHeader(alias) === header),
    )
    const hasDentalPremium = headers.some((header) =>
      HEADER_ALIASES.dentalPremium.some((alias) => normalizeHeader(alias) === header),
    )

    if (hasFullName && hasDentalPremium) {
      return { headerIndex: index, headers }
    }
  }

  return null
}

function summarizeSheet(sheetName: string, rows: unknown[][]): SheetExtractionSummary {
  const headerRow = findHeaderRow(rows)

  if (!headerRow) {
    return {
      sheetName,
      receivedDate: resolveSheetDate(sheetName),
      companyName: null,
      paymentPeriods: [],
      memberRows: 0,
      dentalPremiumTotal: 0,
      skippedRows: 0,
      invalidRows: 0,
      status: 'warning',
      errorMessage: 'Required IWC columns were not found in this sheet.',
    }
  }

  let memberRows = 0
  let dentalPremiumTotal = 0
  let skippedRows = 0
  let invalidRows = 0
  let companyName: string | null = null
  const paymentPeriods = new Set<string>()

  for (let index = headerRow.headerIndex + 1; index < rows.length; index += 1) {
    const rawRow = rows[index] || []
    const mapped = headerRow.headers.reduce<Record<string, string>>((acc, header, columnIndex) => {
      if (!header) return acc
      acc[header] = normalizeCell(rawRow[columnIndex])
      return acc
    }, {})

    const fullName = findHeaderValue(mapped, HEADER_ALIASES.fullName)
    const company = findHeaderValue(mapped, HEADER_ALIASES.companyName)
    const planholderId = findHeaderValue(mapped, HEADER_ALIASES.planholderId)
    const dentalPremium = findHeaderValue(mapped, HEADER_ALIASES.dentalPremium)
    const paymentPeriod = findHeaderValue(mapped, HEADER_ALIASES.paymentPeriod)
    const rawValues = Object.values(mapped)

    const isBlank = !fullName && !company && !planholderId && !dentalPremium && !paymentPeriod
    if (isBlank) continue

    const hasIdentityFields = Boolean(fullName || company || planholderId)
    const hasOnlyTotals = Boolean(dentalPremium || paymentPeriod)

    if (isSummaryRow(rawValues, hasIdentityFields, hasOnlyTotals)) {
      skippedRows += 1
      continue
    }

    if (!fullName) {
      invalidRows += 1
      continue
    }

    memberRows += 1
    dentalPremiumTotal += parseMoney(dentalPremium)
    if (!companyName && company) companyName = company
    if (paymentPeriod) paymentPeriods.add(paymentPeriod)
  }

  return {
    sheetName,
    receivedDate: resolveSheetDate(sheetName),
    companyName,
    paymentPeriods: Array.from(paymentPeriods),
    memberRows,
    dentalPremiumTotal,
    skippedRows,
    invalidRows,
    status: invalidRows > 0 ? 'warning' : 'ready',
    errorMessage: invalidRows > 0 ? `${invalidRows} row(s) were skipped because required member fields were missing.` : '',
  }
}

export function useIwcWorkbookExtraction() {
  const loading = ref(false)
  const errorMessage = ref('')
  const workbookName = ref('')
  const summaries = ref<SheetExtractionSummary[]>([])

  const hasSummaries = computed(() => summaries.value.length > 0)
  const totalSheets = computed(() => summaries.value.length)
  const totalMembers = computed(() =>
    summaries.value.reduce((sum, summary) => sum + summary.memberRows, 0),
  )
  const totalDentalPremium = computed(() =>
    summaries.value.reduce((sum, summary) => sum + summary.dentalPremiumTotal, 0),
  )
  const totalSkippedRows = computed(() =>
    summaries.value.reduce((sum, summary) => sum + summary.skippedRows + summary.invalidRows, 0),
  )

  async function extractWorkbook(file: File) {
    loading.value = true
    errorMessage.value = ''
    workbookName.value = file.name
    summaries.value = []

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })

      summaries.value = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) {
          return {
            sheetName,
            receivedDate: resolveSheetDate(sheetName),
            companyName: null,
            paymentPeriods: [],
            memberRows: 0,
            dentalPremiumTotal: 0,
            skippedRows: 0,
            invalidRows: 0,
            status: 'warning' as const,
            errorMessage: 'Worksheet data could not be read.',
          }
        }

        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: '',
        }) as unknown[][]

        return summarizeSheet(sheetName, rows)
      })

      return true
    } catch {
      errorMessage.value = 'We could not read that workbook. Please choose a valid IWC Excel file.'
      summaries.value = []
      workbookName.value = ''
      return false
    } finally {
      loading.value = false
    }
  }

  function clearExtraction() {
    loading.value = false
    errorMessage.value = ''
    workbookName.value = ''
    summaries.value = []
  }

  return {
    loading,
    errorMessage,
    workbookName,
    summaries,
    hasSummaries,
    totalSheets,
    totalMembers,
    totalDentalPremium,
    totalSkippedRows,
    extractWorkbook,
    clearExtraction,
  }
}
