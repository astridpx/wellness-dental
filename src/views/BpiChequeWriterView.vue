<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { AppButton, AppInput, AppModal } from '@/components/app'
import {
  DEFAULT_CHEQUE_DATE_PART_OFFSETS,
  DEFAULT_CHEQUE_BANK_NAME,
  createDefaultChequeTemplate,
  normalizeChequeBankKey,
  useChequeTemplates,
  type ChequeDatePartKey,
  type ChequeTemplateField,
  type SavedChequeTemplate,
} from '@/composables'
import { amountToChequeWords, currentManilaDateInputValue, formatPlainAmount } from '@/utils'

type CalibrationAction = 'insert' | 'update' | 'delete' | 'reset'

const defaultBpiFields: ChequeTemplateField[] = [
  {
    key: 'payee',
    label: 'Payee',
    x: 20,
    y: 25,
    width: 106,
    height: 8,
    fontSize: 15,
  },
  {
    key: 'amountWords',
    label: 'Amount in words',
    x: 15,
    y: 35,
    width: 140,
    height: 8,
    fontSize: 14,
  },
  {
    key: 'amount',
    label: 'Amount',
    x: 160,
    y: 25,
    width: 31,
    height: 8,
    fontSize: 15,
    align: 'left',
  },
  {
    key: 'date',
    label: 'Date',
    x: 158,
    y: 12,
    width: 31,
    height: 8,
    fontSize: 12,
    align: 'center',
  },
]

const bpiTemplate = reactive({
  name: 'Cheque',
  bankName: DEFAULT_CHEQUE_BANK_NAME,
  width: 203.2,
  height: 76.2,
  fields: defaultBpiFields.map((field) => ({ ...field })),
  datePartOffsets: { ...DEFAULT_CHEQUE_DATE_PART_OFFSETS },
})

const cheque = reactive({
  template: bpiTemplate.name,
  accountName:
    import.meta.env.VITE_APP_VOUCHER_COMPANY_NAME ||
    'IWC Wellness and Preventive Consultancy, Inc.',
  payee: '',
  date: currentManilaDateInputValue(),
  amount: '',
  amountWords: '',
})
const showGuides = ref(true)
const saveMessage = ref('')
const pendingCalibrationAction = ref<CalibrationAction | null>(null)
const selectedBankKey = ref(normalizeChequeBankKey(DEFAULT_CHEQUE_BANK_NAME))
const bankNameDraft = ref(DEFAULT_CHEQUE_BANK_NAME)
const {
  rows: bankTemplateRows,
  saving: savingCalibration,
  templates: savedBankTemplates,
  loadTemplates,
  insertTemplate,
  updateTemplate,
  deleteTemplate,
} = useChequeTemplates(defaultBpiFields)

const currentBankName = computed(() => bpiTemplate.bankName.trim() || DEFAULT_CHEQUE_BANK_NAME)
const calibrationConfirmationTitle = computed(() =>
  pendingCalibrationAction.value === 'insert'
    ? 'Insert Bank Row?'
    : pendingCalibrationAction.value === 'delete'
      ? 'Delete Bank Row?'
      : pendingCalibrationAction.value === 'reset'
        ? 'Reset Calibration?'
        : 'Update Bank Row?',
)
const calibrationConfirmationMessage = computed(() =>
  pendingCalibrationAction.value === 'insert'
    ? `Add ${bankNameDraft.value.trim() || currentBankName.value} as a new bank row using the current cheque positioning.`
    : pendingCalibrationAction.value === 'delete'
      ? `Delete the saved cheque calibration row for ${currentBankName.value}.`
      : pendingCalibrationAction.value === 'reset'
        ? `Restore the default cheque positioning for ${currentBankName.value} and save it for all devices.`
        : `Update the saved cheque calibration row for ${currentBankName.value} so all devices use this positioning.`,
)
const calibrationConfirmationBankName = computed(() =>
  pendingCalibrationAction.value === 'insert'
    ? bankNameDraft.value.trim() || currentBankName.value
    : currentBankName.value,
)
const calibrationConfirmationLabel = computed(() =>
  pendingCalibrationAction.value === 'insert'
    ? 'Insert Row'
    : pendingCalibrationAction.value === 'delete'
      ? 'Delete Row'
      : pendingCalibrationAction.value === 'reset'
        ? 'Reset Calibration'
        : 'Update Row',
)
const formattedAmount = computed(() => formatPlainAmount(cheque.amount))
const generatedAmountWords = computed(() => amountToChequeWords(cheque.amount).toUpperCase())
const chequeAmountWords = computed(() => cheque.amountWords.trim() || generatedAmountWords.value)
const templateFields = computed(() => bpiTemplate.fields)
const selectedBankExists = computed(() => Boolean(savedBankTemplates.value[selectedBankKey.value]))
const canInsertBankRow = computed(() => {
  const bankName = bankNameDraft.value.trim()
  if (!bankName) return false
  return !savedBankTemplates.value[normalizeChequeBankKey(bankName)]
})
const canDeleteBankRow = computed(
  () => bankTemplateRows.value.length > 1 && selectedBankExists.value,
)
const chequeSheetStyle = computed(() => ({
  width: `${bpiTemplate.width}mm`,
  height: `${bpiTemplate.height}mm`,
}))

function fieldStyle(field: ChequeTemplateField) {
  return {
    left: `${field.x}mm`,
    top: `${field.y}mm`,
    width: `${field.width}mm`,
    minHeight: `${field.height}mm`,
    fontSize: `${field.fontSize}px`,
    textAlign: field.align || 'left',
  }
}

function fieldValue(field: ChequeTemplateField) {
  if (field.key === 'payee') return cheque.payee
  if (field.key === 'amountWords') return chequeAmountWords.value
  if (field.key === 'amount') return formattedAmount.value
  return ''
}

function updateTemplateNumber(key: 'width' | 'height', event: Event, minimum = 1) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value) && value >= minimum) bpiTemplate[key] = value
}

function updateFieldNumber(
  field: ChequeTemplateField,
  key: 'x' | 'y' | 'width' | 'height' | 'fontSize',
  event: Event,
  minimum = 0,
) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value) && value >= minimum) field[key] = value
}

function updateFieldAlign(field: ChequeTemplateField, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (['left', 'center', 'right'].includes(value)) {
    field.align = value as ChequeTemplateField['align']
  }
}

function updateDatePartOffset(key: ChequeDatePartKey, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) bpiTemplate.datePartOffsets[key] = value
}

function applyTemplate(template: SavedChequeTemplate) {
  if (template.bankName) bpiTemplate.bankName = template.bankName
  if (template.name) bpiTemplate.name = template.name
  if (Number.isFinite(template.width) && template.width > 0) bpiTemplate.width = template.width
  if (Number.isFinite(template.height) && template.height > 0) bpiTemplate.height = template.height

  const mergedFields = defaultBpiFields.map((defaultField) => {
    const savedField = template.fields.find((field) => field.key === defaultField.key)
    return savedField ? { ...defaultField, ...savedField } : { ...defaultField }
  })

  bpiTemplate.fields.splice(0, bpiTemplate.fields.length, ...mergedFields)
  bpiTemplate.datePartOffsets = {
    ...DEFAULT_CHEQUE_DATE_PART_OFFSETS,
    ...(template.datePartOffsets || {}),
  }
  bankNameDraft.value = template.bankName || currentBankName.value
}

function applyDefaultTemplate() {
  const defaultTemplate = createDefaultChequeTemplate(currentBankName.value, defaultBpiFields)
  bpiTemplate.width = defaultTemplate.width
  bpiTemplate.height = defaultTemplate.height
  bpiTemplate.fields.splice(
    0,
    bpiTemplate.fields.length,
    ...defaultTemplate.fields.map((field) => ({ ...field })),
  )
  bpiTemplate.datePartOffsets = {
    ...(defaultTemplate.datePartOffsets || DEFAULT_CHEQUE_DATE_PART_OFFSETS),
  }
}

function buildTemplateToSave(): SavedChequeTemplate {
  const bankName = currentBankName.value

  return {
    name: `${bankName} Cheque`,
    bankName,
    width: bpiTemplate.width,
    height: bpiTemplate.height,
    fields: bpiTemplate.fields.map((field) => ({ ...field })),
    datePartOffsets: { ...bpiTemplate.datePartOffsets },
  }
}

function selectBankTemplate(bankKey: string) {
  const savedTemplate = savedBankTemplates.value[bankKey]

  if (savedTemplate) {
    selectedBankKey.value = bankKey
    applyTemplate(savedTemplate)
    return
  }

  applyDefaultTemplate()
}

function applySelectedBankTemplate() {
  selectBankTemplate(selectedBankKey.value)
  saveMessage.value = ''
}

async function loadSavedCalibration() {
  await loadTemplates()
  selectedBankKey.value = savedBankTemplates.value[selectedBankKey.value]
    ? selectedBankKey.value
    : bankTemplateRows.value[0]?.key || normalizeChequeBankKey(DEFAULT_CHEQUE_BANK_NAME)
  applySelectedBankTemplate()
}

async function insertBankRow() {
  const bankName = bankNameDraft.value.trim()
  if (!bankName) {
    saveMessage.value = 'Enter a bank name before inserting a row.'
    return
  }

  bpiTemplate.bankName = bankName
  const result = await insertTemplate(buildTemplateToSave())
  saveMessage.value = result.ok ? `Bank row inserted for ${bankName}.` : result.error
  if (!result.ok || !result.bankKey) return

  selectedBankKey.value = result.bankKey
  selectBankTemplate(result.bankKey)
}

async function updateBankRow() {
  const bankKey = selectedBankKey.value
  const result = await updateTemplate(bankKey, buildTemplateToSave())
  saveMessage.value = result.ok ? `Bank row updated for ${currentBankName.value}.` : result.error
}

async function deleteBankRow() {
  const bankName = currentBankName.value
  const result = await deleteTemplate(selectedBankKey.value)
  saveMessage.value = result.ok ? `Bank row deleted for ${bankName}.` : result.error
  if (!result.ok || !result.nextBankKey) return

  selectedBankKey.value = result.nextBankKey
  selectBankTemplate(result.nextBankKey)
}

async function resetCalibration() {
  applyDefaultTemplate()
  const result = await updateTemplate(selectedBankKey.value, buildTemplateToSave())
  saveMessage.value = result.ok
    ? `Default calibration restored for ${currentBankName.value}.`
    : result.error
}

function requestCalibrationConfirmation(action: CalibrationAction) {
  pendingCalibrationAction.value = action
}

function closeCalibrationConfirmation() {
  if (savingCalibration.value) return
  pendingCalibrationAction.value = null
}

async function confirmCalibrationAction() {
  const action = pendingCalibrationAction.value
  if (!action) return

  if (action === 'update') {
    await updateBankRow()
  } else if (action === 'insert') {
    await insertBankRow()
  } else if (action === 'delete') {
    await deleteBankRow()
  } else {
    await resetCalibration()
  }

  if (!savingCalibration.value) pendingCalibrationAction.value = null
}

function formatChequeDate(value: string) {
  if (!value) return { mm: ['', ''], dd: ['', ''], yyyy: ['', '', '', ''] }

  const [year = '', month = '', day = ''] = value.split('-')
  return {
    mm: [month[0] || '', month[1] || ''],
    dd: [day[0] || '', day[1] || ''],
    yyyy: [year[0] || '', year[1] || '', year[2] || '', year[3] || ''],
  }
}

function datePartStyle(key: ChequeDatePartKey) {
  return {
    transform: `translateX(${bpiTemplate.datePartOffsets[key]}px)`,
  }
}

function printCheque() {
  const chequeSheet = document.querySelector('.cheque-sheet')
  if (!chequeSheet) {
    window.print()
    return
  }

  const printFrame = document.createElement('iframe')
  printFrame.title = 'Cheque print'
  printFrame.style.position = 'fixed'
  printFrame.style.right = '0'
  printFrame.style.bottom = '0'
  printFrame.style.width = '0'
  printFrame.style.height = '0'
  printFrame.style.border = '0'
  document.body.appendChild(printFrame)

  const printDocument = printFrame.contentDocument
  if (!printDocument) {
    printFrame.remove()
    window.print()
    return
  }

  printDocument.open()
  printDocument.write(`
    <!doctype html>
    <html>
      <head>
        <style>
          @page {
            size: ${bpiTemplate.width}mm ${bpiTemplate.height}mm;
            margin: 0;
          }

          html,
          body {
            width: ${bpiTemplate.width}mm;
            height: ${bpiTemplate.height}mm;
            margin: 0;
            overflow: hidden;
            background: #fff;
          }

          .cheque-sheet {
            position: relative;
            width: ${bpiTemplate.width}mm;
            height: ${bpiTemplate.height}mm;
            overflow: hidden;
            background: transparent;
            font-family: Arial, Helvetica, sans-serif;
          }

          .cheque-field-frame {
            display: none !important;
          }

          .cheque-field {
            position: absolute;
            z-index: 2;
            margin: 0;
            overflow-wrap: normal;
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: 700;
            letter-spacing: 0;
            line-height: 1.2;
            text-transform: uppercase;
          }

          .cheque-field-amountWords {
            overflow: visible;
            white-space: nowrap;
          }

          .cheque-date-digits {
            display: grid;
            grid-template-columns: 1fr 1fr 2fr;
            gap: 0;
            text-align: center;
          }

          .cheque-date-part {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
          }
        </style>
      </head>
      <body>${chequeSheet.outerHTML}</body>
    </html>
  `)
  printDocument.close()

  printFrame.onload = () => {
    printFrame.contentWindow?.focus()
    printFrame.contentWindow?.print()
    window.setTimeout(() => printFrame.remove(), 1000)
  }
}

onMounted(() => {
  void loadSavedCalibration()
})
</script>

<template>
  <div class="space-y-6">
    <AppModal
      :show="Boolean(pendingCalibrationAction)"
      :title="calibrationConfirmationTitle"
      subtitle="Cheque Calibration"
      max-width="sm:max-w-lg"
      @close="closeCalibrationConfirmation"
    >
      <div class="space-y-4 px-6 py-5">
        <p class="text-sm leading-6 text-slate">
          {{ calibrationConfirmationMessage }}
        </p>
        <div class="rounded-2xl border border-[#ded7cc] bg-[#fbf7ef] p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Bank</p>
          <p class="mt-1 text-sm font-black text-onyx">{{ calibrationConfirmationBankName }}</p>
        </div>
      </div>

      <template #footer>
        <div class="grid gap-3 sm:grid-cols-2">
          <AppButton
            btn-theme="outline"
            type="button"
            class="w-full justify-center"
            :disabled="savingCalibration"
            @click="closeCalibrationConfirmation"
          >
            Cancel
          </AppButton>
          <AppButton
            btn-theme="primary"
            type="button"
            class="w-full justify-center"
            :disabled="savingCalibration"
            @click="confirmCalibrationAction"
          >
            <Icon icon="feather:save" class="h-4 w-4" />
            {{ savingCalibration ? 'Saving' : calibrationConfirmationLabel }}
          </AppButton>
        </div>
      </template>
    </AppModal>

    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-smoke">Cheque</p>
        <h1 class="mt-2 text-2xl font-black text-onyx">Cheque Writer</h1>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm font-semibold text-onyx shadow-sm transition hover:border-tangerine hover:text-tangerine"
          @click="showGuides = !showGuides"
        >
          <Icon :icon="showGuides ? 'feather:eye' : 'feather:eye-off'" class="h-4 w-4" />
          {{ showGuides ? 'Guides On' : 'Guides Off' }}
        </button>
        <AppButton btn-theme="primary" type="button" @click="printCheque">
          <Icon icon="feather:printer" class="h-4 w-4" />
          Print Cheque
        </AppButton>
      </div>
    </div>

    <div class="grid gap-6 2xl:grid-cols-[minmax(360px,520px)_1fr]">
      <form
        class="no-print space-y-5 rounded-3xl border border-[#d8d1c5] bg-[linear-gradient(180deg,#fbf6ee_0%,#eef1ed_100%)] p-5 shadow-sm"
        @submit.prevent="printCheque"
      >
        <section class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate"
          >
            <Icon icon="feather:sliders" class="h-4 w-4" />
            Template
          </div>

          <div class="rounded-2xl border border-[#ded7cc] bg-white/72 p-4">
            <div class="grid gap-4">
              <label class="block text-sm font-medium text-onyx">
                Saved bank row
                <select
                  v-model="selectedBankKey"
                  class="mt-2 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                  @change="applySelectedBankTemplate"
                >
                  <option v-for="bank in bankTemplateRows" :key="bank.key" :value="bank.key">
                    {{ bank.bankName }}
                  </option>
                </select>
              </label>

              <label class="block text-sm font-medium text-onyx">
                Bank name for insert
                <input
                  v-model="bankNameDraft"
                  type="text"
                  class="mt-2 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                  placeholder="Banco De Oro"
                />
              </label>

              <div class="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-pebble bg-white px-3 py-2 text-sm font-semibold text-onyx shadow-sm transition hover:border-tangerine hover:text-tangerine disabled:cursor-not-allowed disabled:bg-fog disabled:text-smoke"
                  :disabled="savingCalibration || !canInsertBankRow"
                  @click="requestCalibrationConfirmation('insert')"
                >
                  <Icon icon="feather:plus" class="h-4 w-4" />
                  Insert Row
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-pebble bg-white px-3 py-2 text-sm font-semibold text-onyx shadow-sm transition hover:border-tangerine hover:text-tangerine disabled:cursor-not-allowed disabled:bg-fog disabled:text-smoke"
                  :disabled="savingCalibration || !selectedBankExists"
                  @click="requestCalibrationConfirmation('update')"
                >
                  <Icon icon="feather:edit-3" class="h-4 w-4" />
                  Update Row
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-ruby bg-white px-3 py-2 text-sm font-semibold text-ruby shadow-sm transition hover:bg-ruby hover:text-white disabled:cursor-not-allowed disabled:border-pebble disabled:bg-fog disabled:text-smoke"
                  :disabled="savingCalibration || !canDeleteBankRow"
                  @click="requestCalibrationConfirmation('delete')"
                >
                  <Icon icon="feather:trash-2" class="h-4 w-4" />
                  Delete Row
                </button>
              </div>
            </div>
            <p class="mt-4 text-sm font-black text-onyx">{{ currentBankName }} Cheque</p>
            <p class="mt-1 text-sm text-slate">
              {{ bankTemplateRows.length }} saved bank row{{
                bankTemplateRows.length === 1 ? '' : 's'
              }}
            </p>
            <p class="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
              {{ bpiTemplate.width }}mm x {{ bpiTemplate.height }}mm
            </p>
            <p class="mt-3 text-xs leading-5 text-slate">
              Default layout follows the public 203.2mm x 76.2mm Philippine cheque format guidance.
              Use test prints to fine tune printer offsets.
            </p>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div
              class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate"
            >
              <Icon icon="feather:move" class="h-4 w-4" />
              Calibration
            </div>
            <div class="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-pebble bg-white px-3 py-2 text-sm font-semibold text-onyx shadow-sm transition hover:border-tangerine hover:text-tangerine"
                :disabled="savingCalibration"
                @click="requestCalibrationConfirmation('update')"
              >
                <Icon icon="feather:save" class="h-4 w-4" />
                Save
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-pebble bg-white px-3 py-2 text-sm font-semibold text-onyx shadow-sm transition hover:border-tangerine hover:text-tangerine"
                :disabled="savingCalibration"
                @click="requestCalibrationConfirmation('reset')"
              >
                <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
          <p v-if="saveMessage" class="text-sm font-semibold text-emerald">
            {{ saveMessage }}
          </p>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-sm font-medium text-onyx">
              Cheque width (mm)
              <input
                :value="bpiTemplate.width"
                type="number"
                min="1"
                step="0.1"
                class="mt-2 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                @input="updateTemplateNumber('width', $event)"
              />
            </label>
            <label class="block text-sm font-medium text-onyx">
              Cheque height (mm)
              <input
                :value="bpiTemplate.height"
                type="number"
                min="1"
                step="0.1"
                class="mt-2 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                @input="updateTemplateNumber('height', $event)"
              />
            </label>
          </div>

          <div class="space-y-4">
            <div
              v-for="field in templateFields"
              :key="`calibration-${field.key}`"
              class="rounded-2xl border border-[#ded7cc] bg-white/72 p-4"
            >
              <div class="mb-4 flex items-center justify-between gap-3">
                <p class="text-sm font-black text-onyx">{{ field.label }}</p>
                <select
                  :value="field.align || 'left'"
                  class="w-auto rounded-xl border border-pebble bg-white px-3 py-2 text-sm font-semibold text-onyx"
                  @change="updateFieldAlign(field, $event)"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <label class="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                  X
                  <input
                    :value="field.x"
                    type="number"
                    min="0"
                    step="0.5"
                    class="mt-2 w-full rounded-xl border border-pebble bg-white px-3 py-2 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                    @input="updateFieldNumber(field, 'x', $event)"
                  />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                  Y
                  <input
                    :value="field.y"
                    type="number"
                    min="0"
                    step="0.5"
                    class="mt-2 w-full rounded-xl border border-pebble bg-white px-3 py-2 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                    @input="updateFieldNumber(field, 'y', $event)"
                  />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                  W
                  <input
                    :value="field.width"
                    type="number"
                    min="1"
                    step="0.5"
                    class="mt-2 w-full rounded-xl border border-pebble bg-white px-3 py-2 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                    @input="updateFieldNumber(field, 'width', $event, 1)"
                  />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                  H
                  <input
                    :value="field.height"
                    type="number"
                    min="1"
                    step="0.5"
                    class="mt-2 w-full rounded-xl border border-pebble bg-white px-3 py-2 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                    @input="updateFieldNumber(field, 'height', $event, 1)"
                  />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                  Font
                  <input
                    :value="field.fontSize"
                    type="number"
                    min="1"
                    step="1"
                    class="mt-2 w-full rounded-xl border border-pebble bg-white px-3 py-2 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                    @input="updateFieldNumber(field, 'fontSize', $event, 1)"
                  />
                </label>
              </div>

              <div
                v-if="field.key === 'date'"
                class="mt-4 grid grid-cols-3 gap-3 border-t border-[#ded7cc] pt-4"
              >
                <label class="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                  MM X
                  <input
                    :value="bpiTemplate.datePartOffsets.mm"
                    type="number"
                    step="1"
                    class="mt-2 w-full rounded-xl border border-pebble bg-white px-3 py-2 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                    @input="updateDatePartOffset('mm', $event)"
                  />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                  DD X
                  <input
                    :value="bpiTemplate.datePartOffsets.dd"
                    type="number"
                    step="1"
                    class="mt-2 w-full rounded-xl border border-pebble bg-white px-3 py-2 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                    @input="updateDatePartOffset('dd', $event)"
                  />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                  YYYY X
                  <input
                    :value="bpiTemplate.datePartOffsets.yyyy"
                    type="number"
                    step="1"
                    class="mt-2 w-full rounded-xl border border-pebble bg-white px-3 py-2 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                    @input="updateDatePartOffset('yyyy', $event)"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate"
          >
            <Icon icon="feather:edit-3" class="h-4 w-4" />
            Cheque Data
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput v-model="cheque.accountName" label="Account name" />
            <AppInput v-model="cheque.date" type="date" label="Date" />
            <AppInput v-model="cheque.payee" label="Pay to the order of" />
            <AppInput
              v-model="cheque.amount"
              decimal-only
              inputmode="decimal"
              label="Amount"
              placeholder="0.00"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-onyx">Amount in words</label>
            <textarea
              v-model="cheque.amountWords"
              class="min-h-24 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-onyx outline-none transition placeholder:text-ash focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
              :placeholder="generatedAmountWords"
            />
          </div>
        </section>
      </form>

      <section
        class="printable-cheque overflow-auto rounded-3xl border border-[#d8d1c5] bg-[linear-gradient(180deg,#fbf7ef_0%,#eef1ed_100%)] p-4 shadow-md"
      >
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-black text-onyx">{{ currentBankName }} Cheque Preview</p>
            <p class="mt-1 text-xs text-slate">Only black field text prints on the real cheque.</p>
          </div>
          <div class="flex gap-2 text-xs font-semibold text-slate">
            <span class="rounded-full bg-sapphire-light px-3 py-1 text-sapphire">{{
              currentBankName
            }}</span>
            <span class="rounded-full bg-emerald-light px-3 py-1 text-emerald"
              >Pre-printed cheque</span
            >
          </div>
        </div>

        <div class="cheque-stage">
          <div
            class="cheque-sheet mx-auto text-[#111]"
            :class="{ 'cheque-sheet-guides-hidden': !showGuides }"
            :style="chequeSheetStyle"
          >
            <div
              v-for="field in templateFields"
              :key="field.key"
              class="cheque-field-frame"
              :style="fieldStyle(field)"
            >
              <span class="cheque-field-label">{{ field.label }}</span>
            </div>

            <p
              v-for="field in templateFields"
              :key="`${field.key}-print`"
              class="cheque-field"
              :class="[`cheque-field-${field.key}`]"
              :style="fieldStyle(field)"
            >
              <span v-if="field.key === 'date'" class="cheque-date-digits">
                <span
                  v-for="(digits, partKey) in formatChequeDate(cheque.date)"
                  :key="partKey"
                  class="cheque-date-part"
                  :style="datePartStyle(partKey)"
                >
                  <span v-for="(digit, digitIndex) in digits" :key="digitIndex">
                    {{ digit }}
                  </span>
                </span>
              </span>
              <span v-else>{{ fieldValue(field) }}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cheque-stage {
  min-width: max-content;
  padding: 24px;
}

.cheque-sheet {
  position: relative;
  width: 203.2mm;
  height: 76.2mm;
  overflow: hidden;
  border: 1px solid #d8c783;
  background:
    linear-gradient(90deg, rgba(194, 148, 43, 0.08) 1px, transparent 1px),
    linear-gradient(180deg, #fff8df 0%, #fbf0c7 100%);
  background-size:
    2mm 100%,
    100% 100%;
  box-shadow: 0 26px 60px rgba(53, 64, 74, 0.16);
  font-family: Arial, Helvetica, sans-serif;
}

.cheque-field-frame {
  position: absolute;
  z-index: 1;
  border: 1px dashed rgba(21, 58, 120, 0.55);
  background: rgba(255, 255, 255, 0.22);
  pointer-events: none;
}

.cheque-field-label {
  position: absolute;
  left: 0;
  top: -18px;
  border-radius: 999px;
  background: #edf2ff;
  padding: 2px 7px;
  color: #153a78;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0;
  white-space: nowrap;
}

.cheque-field {
  position: absolute;
  z-index: 2;
  margin: 0;
  overflow-wrap: normal;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
  text-transform: uppercase;
}

.cheque-field-amountWords {
  overflow: visible;
  white-space: nowrap;
}

.cheque-date-digits {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 0;
  text-align: center;
}

.cheque-date-part {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
}

.cheque-sheet-guides-hidden {
  background: #fffbe8;
}

.cheque-sheet-guides-hidden .cheque-field-frame {
  display: none;
}
</style>
