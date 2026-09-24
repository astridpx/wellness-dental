import { computed, reactive, ref, watch } from 'vue'
import { useWellnessApi } from './useWellnessApi'

export type ChequeSummaryKind = 'voucher' | 'cheque'

export type ChequeSummaryRecord = {
  id: number
  kind: ChequeSummaryKind
  createdAt: string
  documentDate: string
  referenceNo: string
  checkNo: string
  payee: string
  amount: number
  title: string
  preparedBy: string
  bankName: string
  accountName: string
}

type ChequeSummaryInput = Partial<
  Omit<ChequeSummaryRecord, 'id' | 'kind' | 'createdAt' | 'amount'>
> & {
  kind: ChequeSummaryKind
  amount?: number | string
}

type ChequeSummaryApiRecord = Omit<ChequeSummaryRecord, 'kind' | 'amount'> & {
  documentType: ChequeSummaryKind
  amount: number | string
}

type ChequeSummaryResponse = {
  rows: ChequeSummaryApiRecord[]
  summary: {
    total: number
    vouchers: number
    cheques: number
    amount: number
  }
}

function normalizeText(value: unknown) {
  return String(value || '').trim()
}

function normalizeAmount(value: unknown) {
  const amount = Number(String(value ?? '').replace(/,/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

function mapApiRecord(record: ChequeSummaryApiRecord): ChequeSummaryRecord {
  return {
    id: record.id,
    kind: record.documentType,
    createdAt: normalizeText(record.createdAt),
    documentDate: normalizeText(record.documentDate),
    referenceNo: normalizeText(record.referenceNo),
    checkNo: normalizeText(record.checkNo),
    payee: normalizeText(record.payee),
    amount: normalizeAmount(record.amount),
    title: normalizeText(record.title),
    preparedBy: normalizeText(record.preparedBy),
    bankName: normalizeText(record.bankName),
    accountName: normalizeText(record.accountName),
  }
}

export function useChequeSummaryReports(options: { autoLoad?: boolean } = {}) {
  const { request } = useWellnessApi()
  const records = ref<ChequeSummaryRecord[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const errorMessage = ref('')
  const serverSummary = ref({
    total: 0,
    vouchers: 0,
    cheques: 0,
    amount: 0,
  })
  const filters = reactive({
    kind: 'all' as ChequeSummaryKind | 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
  })

  const filteredRecords = computed(() => records.value)
  const summary = computed(() => serverSummary.value)

  async function loadRecords() {
    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: '1',
      perPage: '100',
    })

    if (filters.kind !== 'all') params.set('documentType', filters.kind)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (filters.search.trim()) params.set('search', filters.search.trim())

    const result = await request<ChequeSummaryResponse>(
      `/wellness/chequeSummaryRecords?${params.toString()}`,
    )

    loading.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load cheque summary records.'
      return false
    }

    records.value = (result.data?.rows || []).map(mapApiRecord)
    serverSummary.value = {
      total: normalizeAmount(result.data?.summary?.total),
      vouchers: normalizeAmount(result.data?.summary?.vouchers),
      cheques: normalizeAmount(result.data?.summary?.cheques),
      amount: normalizeAmount(result.data?.summary?.amount),
    }
    return true
  }

  async function recordChequeSummaryEvent(input: ChequeSummaryInput) {
    saving.value = true

    const result = await request<ChequeSummaryApiRecord>(
      '/wellness/chequeSummaryRecords',
      {
        method: 'POST',
        body: JSON.stringify({
          documentType: input.kind,
          documentDate: input.documentDate,
          referenceNo: input.referenceNo,
          checkNo: input.checkNo,
          payee: input.payee,
          amount: input.amount,
          title: input.title,
          preparedBy: input.preparedBy,
          bankName: input.bankName,
          accountName: input.accountName,
        }),
      },
      { includeContentType: true },
    )

    saving.value = false

    if (!result.ok) return { ok: false, error: result.error || 'Unable to save summary record.' }

    return { ok: true, error: '', data: result.data ? mapApiRecord(result.data) : null }
  }

  function resetFilters() {
    filters.kind = 'all'
    filters.dateFrom = ''
    filters.dateTo = ''
    filters.search = ''
  }

  watch(filters, () => void loadRecords(), { deep: true })
  if (options.autoLoad) void loadRecords()

  return {
    errorMessage,
    filteredRecords,
    filters,
    loadRecords,
    loading,
    records,
    recordChequeSummaryEvent,
    resetFilters,
    saving,
    summary,
  }
}
