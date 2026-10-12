import { computed, reactive, ref } from 'vue'
import { currentManilaDateInputValue } from '@/utils'
import { useWellnessApi } from './useWellnessApi'

export type VoucherAccountCode = {
  id: string
  code: string
  title: string
  date: string
}

export type VoucherCostCenter = {
  id: string
  code: string
  title: string
  date: string
}

export type VoucherPayee = {
  id: string
  code: string
  title: string
  date: string
}

type VoucherAccountLibrariesSetting = {
  accountCodes?: VoucherAccountCode[]
  costCenters?: VoucherCostCenter[]
  payees?: VoucherPayee[]
}

type VoucherAccountLibraryKind = 'accountCode' | 'costCenter' | 'payee'

export const VOUCHER_ACCOUNT_LIBRARY_PAGE_SIZE = 10

type AccountCodeSearchParams = {
  accountCode?: string
  accountTitle?: string
}

type ChequeAccountCodeResponse = {
  accountCode: number
  accountTitle: string
  createdAt?: string | null
}

type ChequeCostCenterResponse = {
  id: number
  costCenter: string
  costCenterTitle: string
  createdAt?: string | null
}

type ChequePayeeResponse = {
  id: number
  payeeName: string
  createdAt?: string | null
}

function createLibraryId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeText(value: string) {
  return value.trim()
}

function nextNumericCode(items: { code: string }[]) {
  const numericCodes = items.map((item) => item.code.trim()).filter((code) => /^\d+$/.test(code))

  if (!numericCodes.length) return '10001'

  const highestCode = numericCodes.reduce((highest, code) =>
    Number(code) > Number(highest) ? code : highest,
  )
  const nextCode = String(Number(highestCode) + 1)

  return nextCode.padStart(highestCode.length, '0')
}

function normalizeLibraryItem<T extends VoucherAccountCode | VoucherCostCenter>(
  item: Partial<T>,
  prefix: string,
): T | null {
  const code = normalizeText(String(item.code || ''))
  const title = normalizeText(String(item.title || ''))

  if (!code || !title) return null

  return {
    id: normalizeText(String(item.id || '')) || createLibraryId(prefix),
    code,
    title,
    date: normalizeText(String(item.date || '')) || currentManilaDateInputValue(),
  } as T
}

function normalizeLibraries(value: VoucherAccountLibrariesSetting | null | undefined) {
  return {
    accountCodes: (value?.accountCodes || [])
      .map((item) => normalizeLibraryItem<VoucherAccountCode>(item, 'account'))
      .filter((item): item is VoucherAccountCode => Boolean(item))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    costCenters: (value?.costCenters || [])
      .map((item) => normalizeLibraryItem<VoucherCostCenter>(item, 'cost-center'))
      .filter((item): item is VoucherCostCenter => Boolean(item))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    payees: (value?.payees || [])
      .map((item) => normalizeLibraryItem<VoucherPayee>(item, 'payee'))
      .filter((item): item is VoucherPayee => Boolean(item))
      .sort((a, b) => a.title.localeCompare(b.title)),
  }
}

function mapAccountCode(row: ChequeAccountCodeResponse): VoucherAccountCode {
  return {
    id: String(row.accountCode),
    code: String(row.accountCode),
    title: normalizeText(row.accountTitle || ''),
    date: row.createdAt || currentManilaDateInputValue(),
  }
}

function mapCostCenter(row: ChequeCostCenterResponse): VoucherCostCenter {
  return {
    id: String(row.id),
    code: normalizeText(row.costCenter || ''),
    title: normalizeText(row.costCenterTitle || ''),
    date: row.createdAt || currentManilaDateInputValue(),
  }
}

function mapPayee(row: ChequePayeeResponse): VoucherPayee {
  return {
    id: String(row.id),
    code: String(row.id),
    title: normalizeText(row.payeeName || ''),
    date: row.createdAt || currentManilaDateInputValue(),
  }
}

function buildLibraryPath(path: string, query: Record<string, string>) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    const normalizedValue = normalizeText(value)
    if (normalizedValue) params.set(key, normalizedValue)
  })

  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

export function useVoucherAccountLibraries() {
  const { request } = useWellnessApi()
  const loading = ref(false)
  const saving = ref(false)
  const accountCodes = ref<VoucherAccountCode[]>([])
  const costCenters = ref<VoucherCostCenter[]>([])
  const payees = ref<VoucherPayee[]>([])
  const filters = reactive({
    accountCode: '',
    accountTitle: '',
    costCenter: '',
    costCenterTitle: '',
    payeeName: '',
  })
  const currentPages = reactive<Record<VoucherAccountLibraryKind, number>>({
    accountCode: 1,
    costCenter: 1,
    payee: 1,
  })
  const totalEntries = reactive<Record<VoucherAccountLibraryKind, number>>({
    accountCode: 0,
    costCenter: 0,
    payee: 0,
  })
  const totalPages = reactive<Record<VoucherAccountLibraryKind, number>>({
    accountCode: 1,
    costCenter: 1,
    payee: 1,
  })

  const accountCodeOptions = computed(() =>
    accountCodes.value.map((item) => ({
      value: item.code,
      label: item.code,
      description: item.title,
    })),
  )
  const costCenterOptions = computed(() =>
    costCenters.value.map((item) => ({
      value: item.code,
      label: item.code,
      description: item.title,
    })),
  )
  const payeeOptions = computed(() =>
    payees.value.map((item) => ({
      value: item.title,
      label: item.title,
      description: 'Payee library',
    })),
  )
  const nextAccountCode = computed(() => nextNumericCode(accountCodes.value))
  let accountCodeRequestId = 0
  let payeeRequestId = 0

  function applyLibraries(nextLibraries: VoucherAccountLibrariesSetting) {
    const normalized = normalizeLibraries(nextLibraries)
    accountCodes.value = normalized.accountCodes
    costCenters.value = normalized.costCenters
    payees.value = normalized.payees
  }

  async function loadAccountCodes(searchParams: AccountCodeSearchParams = {}) {
    const requestId = ++accountCodeRequestId
    loading.value = true

    const result = await request<ChequeAccountCodeResponse[]>(
      buildLibraryPath('/wellness/chequeAccountCodes', {
        accountCode: searchParams.accountCode || '',
        accountTitle: searchParams.accountTitle || '',
      }),
    )

    if (requestId === accountCodeRequestId) {
      loading.value = false

      if (result.ok) {
        accountCodes.value = normalizeLibraries({
          accountCodes: (result.data || []).map(mapAccountCode),
        }).accountCodes
      }
    }

    return {
      ok: result.ok,
      error: result.ok ? '' : result.error || 'Unable to load account codes.',
    }
  }

  async function loadPayees(searchParams: { payeeName?: string } = {}) {
    const requestId = ++payeeRequestId
    loading.value = true

    const result = await request<ChequePayeeResponse[]>(
      buildLibraryPath('/wellness/chequePayees', {
        payeeName: searchParams.payeeName || '',
        perPage: '50',
      }),
    )

    if (requestId === payeeRequestId) {
      loading.value = false

      if (result.ok) {
        payees.value = normalizeLibraries({
          payees: (result.data || []).map(mapPayee),
        }).payees
      }
    }

    return {
      ok: result.ok,
      error: result.ok ? '' : result.error || 'Unable to load payees.',
    }
  }

  async function loadLibraries() {
    loading.value = true

    const [accountCodesResult, costCentersResult, payeesResult] = await Promise.all([
      request<ChequeAccountCodeResponse[]>(
        buildLibraryPath('/wellness/chequeAccountCodes', {
          accountCode: filters.accountCode,
          accountTitle: filters.accountTitle,
          page: String(currentPages.accountCode),
          perPage: String(VOUCHER_ACCOUNT_LIBRARY_PAGE_SIZE),
        }),
      ),
      request<ChequeCostCenterResponse[]>(
        buildLibraryPath('/wellness/chequeCostCenters', {
          costCenter: filters.costCenter,
          costCenterTitle: filters.costCenterTitle,
          page: String(currentPages.costCenter),
          perPage: String(VOUCHER_ACCOUNT_LIBRARY_PAGE_SIZE),
        }),
      ),
      request<ChequePayeeResponse[]>(
        buildLibraryPath('/wellness/chequePayees', {
          payeeName: filters.payeeName,
          page: String(currentPages.payee),
          perPage: String(VOUCHER_ACCOUNT_LIBRARY_PAGE_SIZE),
        }),
      ),
    ])

    loading.value = false

    if (!accountCodesResult.ok) {
      return {
        ok: false,
        error: accountCodesResult.error || 'Unable to load account codes.',
      }
    }

    if (!costCentersResult.ok) {
      return {
        ok: false,
        error: costCentersResult.error || 'Unable to load cost centers.',
      }
    }

    if (!payeesResult.ok) {
      return {
        ok: false,
        error: payeesResult.error || 'Unable to load payees.',
      }
    }

    applyLibraries({
      accountCodes: (accountCodesResult.data || []).map(mapAccountCode),
      costCenters: (costCentersResult.data || []).map(mapCostCenter),
      payees: (payeesResult.data || []).map(mapPayee),
    })

    totalEntries.accountCode = Number(
      accountCodesResult.metadata?.totalEntries ?? accountCodes.value.length,
    )
    totalEntries.costCenter = Number(
      costCentersResult.metadata?.totalEntries ?? costCenters.value.length,
    )
    totalEntries.payee = Number(payeesResult.metadata?.totalEntries ?? payees.value.length)
    totalPages.accountCode = Math.max(
      1,
      Number(
        accountCodesResult.metadata?.totalPages ??
          Math.ceil(totalEntries.accountCode / VOUCHER_ACCOUNT_LIBRARY_PAGE_SIZE),
      ),
    )
    totalPages.costCenter = Math.max(
      1,
      Number(
        costCentersResult.metadata?.totalPages ??
          Math.ceil(totalEntries.costCenter / VOUCHER_ACCOUNT_LIBRARY_PAGE_SIZE),
      ),
    )
    totalPages.payee = Math.max(
      1,
      Number(
        payeesResult.metadata?.totalPages ??
          Math.ceil(totalEntries.payee / VOUCHER_ACCOUNT_LIBRARY_PAGE_SIZE),
      ),
    )

    const accountCodePage = Math.min(currentPages.accountCode, totalPages.accountCode)
    const costCenterPage = Math.min(currentPages.costCenter, totalPages.costCenter)
    const payeePage = Math.min(currentPages.payee, totalPages.payee)

    if (
      accountCodePage !== currentPages.accountCode ||
      costCenterPage !== currentPages.costCenter ||
      payeePage !== currentPages.payee
    ) {
      currentPages.accountCode = accountCodePage
      currentPages.costCenter = costCenterPage
      currentPages.payee = payeePage
      return loadLibraries()
    }

    return { ok: true, error: '' }
  }

  async function saveAccountCode(item: { id?: string; title: string }) {
    saving.value = true

    const result = await request(
      item.id ? `/wellness/chequeAccountCodes/${item.id}` : '/wellness/chequeAccountCodes',
      {
        method: item.id ? 'PUT' : 'POST',
        body: JSON.stringify({ accountTitle: item.title }),
      },
      { includeContentType: true },
    )

    if (result.ok) await loadLibraries()
    saving.value = false

    return {
      ok: result.ok,
      error: result.ok ? '' : result.error || 'Unable to save account code.',
    }
  }

  async function saveCostCenter(item: { id?: string; code?: string; title: string }) {
    saving.value = true
    const body: { costCenter?: string; costCenterTitle: string } = {
      costCenterTitle: item.title,
    }

    if (item.code) body.costCenter = item.code

    const result = await request(
      item.id ? `/wellness/chequeCostCenters/${item.id}` : '/wellness/chequeCostCenters',
      {
        method: item.id ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      },
      { includeContentType: true },
    )

    if (result.ok) await loadLibraries()
    saving.value = false

    return {
      ok: result.ok,
      error: result.ok ? '' : result.error || 'Unable to save cost center.',
    }
  }

  async function savePayee(item: { id?: string; title: string }) {
    saving.value = true

    const result = await request(
      item.id ? `/wellness/chequePayees/${item.id}` : '/wellness/chequePayees',
      {
        method: item.id ? 'PUT' : 'POST',
        body: JSON.stringify({ payeeName: item.title }),
      },
      { includeContentType: true },
    )

    if (result.ok) await loadLibraries()
    saving.value = false

    return {
      ok: result.ok,
      error: result.ok ? '' : result.error || 'Unable to save payee.',
    }
  }

  async function saveItem(
    kind: VoucherAccountLibraryKind,
    item: { id?: string; code: string; title: string },
  ) {
    const code =
      kind === 'accountCode'
        ? item.id || nextNumericCode(accountCodes.value)
        : item.id
          ? normalizeText(item.code)
          : nextNumericCode(costCenters.value)
    const title = normalizeText(item.title)

    if (!title) {
      return { ok: false, error: 'Enter both code and title.' }
    }

    if (kind === 'accountCode') return saveAccountCode({ id: item.id, title })
    if (kind === 'payee') return savePayee({ id: item.id, title })

    const existingDuplicate = costCenters.value.find(
      (current) =>
        current.id !== item.id && current.code.trim().toLowerCase() === code.toLowerCase(),
    )

    if (existingDuplicate) {
      return { ok: false, error: 'A row with this code already exists.' }
    }

    return saveCostCenter({ id: item.id, code: item.id ? code : undefined, title })
  }

  async function deleteItem(kind: VoucherAccountLibraryKind, id: string) {
    saving.value = true

    const result = await request(
      kind === 'accountCode'
        ? `/wellness/chequeAccountCodes/${id}`
        : kind === 'costCenter'
          ? `/wellness/chequeCostCenters/${id}`
          : `/wellness/chequePayees/${id}`,
      { method: 'DELETE' },
    )

    if (result.ok) await loadLibraries()
    saving.value = false

    return {
      ok: result.ok,
      error: result.ok ? '' : result.error || 'Unable to delete row.',
    }
  }

  return {
    accountCodes,
    accountCodeOptions,
    costCenters,
    costCenterOptions,
    payees,
    payeeOptions,
    currentPages,
    filters,
    loading,
    nextAccountCode,
    saving,
    totalEntries,
    totalPages,
    deleteItem,
    loadAccountCodes,
    loadPayees,
    loadLibraries,
    saveItem,
  }
}
