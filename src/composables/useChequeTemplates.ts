import { computed, ref } from 'vue'
import { useWellnessApi } from './useWellnessApi'

export type ChequeFieldKey = 'payee' | 'amountWords' | 'amount' | 'date'

export type ChequeTemplateField = {
  key: ChequeFieldKey
  label: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  align?: 'left' | 'center' | 'right'
}

export type SavedChequeTemplate = {
  bankName?: string
  name?: string
  width: number
  height: number
  fields: ChequeTemplateField[]
}

type SavedChequeTemplatesSetting = {
  templates?: Record<string, SavedChequeTemplate>
}

const CHEQUE_TEMPLATES_SETTING_KEY = 'chequeTemplates'
const LEGACY_BPI_TEMPLATE_SETTING_KEY = 'bpiChequeTemplate'
export const DEFAULT_CHEQUE_BANK_NAME = 'Bank of the Philippine Islands'

export function normalizeChequeBankKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function createDefaultChequeTemplate(
  bankName: string,
  fields: ChequeTemplateField[],
): SavedChequeTemplate {
  return {
    name: `${bankName} Cheque`,
    bankName,
    width: 203.2,
    height: 76.2,
    fields: fields.map((field) => ({ ...field })),
  }
}

export function useChequeTemplates(defaultFields: ChequeTemplateField[]) {
  const { request } = useWellnessApi()
  const saving = ref(false)
  const templates = ref<Record<string, SavedChequeTemplate>>({
    [normalizeChequeBankKey(DEFAULT_CHEQUE_BANK_NAME)]: createDefaultChequeTemplate(
      DEFAULT_CHEQUE_BANK_NAME,
      defaultFields,
    ),
  })

  const rows = computed(() =>
    Object.entries(templates.value)
      .map(([bankKey, template]) => ({
        key: bankKey,
        bankName: template.bankName || bankKey,
      }))
      .sort((a, b) => a.bankName.localeCompare(b.bankName)),
  )

  function normalizeTemplates(nextTemplates: Record<string, SavedChequeTemplate>) {
    return Object.values(nextTemplates).reduce<Record<string, SavedChequeTemplate>>(
      (result, template) => {
        const bankName = template.bankName?.trim() || DEFAULT_CHEQUE_BANK_NAME
        result[normalizeChequeBankKey(bankName)] = {
          ...template,
          bankName,
          name: template.name || `${bankName} Cheque`,
        }
        return result
      },
      {},
    )
  }

  async function loadTemplates() {
    const result = await request<{ key: string; value: SavedChequeTemplatesSetting | null }>(
      `/wellness/settings/${CHEQUE_TEMPLATES_SETTING_KEY}`,
    )

    if (result.ok && result.data?.value?.templates) {
      templates.value = normalizeTemplates(result.data.value.templates)
      return { ok: true, templates: templates.value, error: '' }
    }

    const legacyResult = await request<{ key: string; value: SavedChequeTemplate | null }>(
      `/wellness/settings/${LEGACY_BPI_TEMPLATE_SETTING_KEY}`,
    )

    if (
      legacyResult.ok &&
      legacyResult.data?.value &&
      Array.isArray(legacyResult.data.value.fields)
    ) {
      const legacyTemplate = {
        ...legacyResult.data.value,
        bankName: legacyResult.data.value.bankName || DEFAULT_CHEQUE_BANK_NAME,
        name: legacyResult.data.value.name || `${DEFAULT_CHEQUE_BANK_NAME} Cheque`,
      }

      templates.value = normalizeTemplates({
        [normalizeChequeBankKey(legacyTemplate.bankName)]: legacyTemplate,
      })
    }

    return { ok: true, templates: templates.value, error: '' }
  }

  async function persistTemplates(nextTemplates: Record<string, SavedChequeTemplate>) {
    saving.value = true

    const result = await request(
      `/wellness/settings/${CHEQUE_TEMPLATES_SETTING_KEY}`,
      {
        method: 'PUT',
        body: JSON.stringify({ value: { templates: nextTemplates } }),
      },
      { includeContentType: true },
    )

    saving.value = false

    if (result.ok) {
      templates.value = normalizeTemplates(nextTemplates)
    }

    return {
      ok: result.ok,
      error: result.ok ? '' : result.error || 'Unable to save calibration.',
    }
  }

  async function insertTemplate(template: SavedChequeTemplate) {
    const bankName = template.bankName?.trim() || ''
    if (!bankName) {
      return { ok: false, error: 'Enter a bank name before inserting a row.', bankKey: '' }
    }

    const bankKey = normalizeChequeBankKey(bankName)
    if (templates.value[bankKey]) {
      return { ok: false, error: 'A row for this bank already exists.', bankKey: '' }
    }

    const result = await persistTemplates({
      ...templates.value,
      [bankKey]: template,
    })

    return { ...result, bankKey }
  }

  async function updateTemplate(bankKey: string, template: SavedChequeTemplate) {
    if (!templates.value[bankKey]) {
      return { ok: false, error: 'Select a saved bank row before updating.' }
    }

    return persistTemplates({
      ...templates.value,
      [bankKey]: template,
    })
  }

  async function deleteTemplate(bankKey: string) {
    if (rows.value.length <= 1) {
      return { ok: false, error: 'Keep at least one bank row.', nextBankKey: '' }
    }

    const nextTemplates = { ...templates.value }
    delete nextTemplates[bankKey]

    const result = await persistTemplates(nextTemplates)
    return {
      ...result,
      nextBankKey:
        Object.keys(nextTemplates)[0] || normalizeChequeBankKey(DEFAULT_CHEQUE_BANK_NAME),
    }
  }

  return {
    rows,
    saving,
    templates,
    loadTemplates,
    insertTemplate,
    updateTemplate,
    deleteTemplate,
  }
}
