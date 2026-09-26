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

type VoucherAccountLibrariesSetting = {
  accountCodes?: VoucherAccountCode[]
  costCenters?: VoucherCostCenter[]
}

type VoucherAccountLibraryKind = 'accountCode' | 'costCenter'

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
  const filters = reactive({
    accountCode: '',
    accountTitle: '',
    costCenter: '',
    costCenterTitle: '',
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
  const nextAccountCode = computed(() => nextNumericCode(accountCodes.value))

  function applyLibraries(nextLibraries: VoucherAccountLibrariesSetting) {
    const normalized = normalizeLibraries(nextLibraries)
    accountCodes.value = normalized.accountCodes
    costCenters.value = normalized.costCenters
  }

  async function loadLibraries() {
    loading.value = true

    const [accountCodesResult, costCentersResult] = await Promise.all([
      request<ChequeAccountCodeResponse[]>(
        buildLibraryPath('/wellness/chequeAccountCodes', {
          accountCode: filters.accountCode,
          accountTitle: filters.accountTitle,
        }),
      ),
      request<ChequeCostCenterResponse[]>(
        buildLibraryPath('/wellness/chequeCostCenters', {
          costCenter: filters.costCenter,
          costCenterTitle: filters.costCenterTitle,
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

    applyLibraries({
      accountCodes: (accountCodesResult.data || []).map(mapAccountCode),
      costCenters: (costCentersResult.data || []).map(mapCostCenter),
    })

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
        : `/wellness/chequeCostCenters/${id}`,
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
    filters,
    loading,
    nextAccountCode,
    saving,
    deleteItem,
    loadLibraries,
    saveItem,
  }
}
