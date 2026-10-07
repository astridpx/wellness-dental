<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppButton, AppInput, AppModal, AppSearchSelect } from '@/components/app'
import {
  useApprovalNumberGenerator,
  useChequeSummaryReports,
  useDentists,
  useUsersList,
  useVoucherAccountLibraries,
} from '@/composables'
import type { Dentist } from '@/types'
import {
  amountToVoucherWords,
  currentManilaDateInputValue,
  formatPlainAmount,
  getVoucherReprintSnapshot,
  parsePlainAmount,
  saveVoucherReprintSnapshot,
  type VoucherReprintSnapshot,
} from '@/utils'

type VoucherRow = {
  id: number
  accountCode: string
  costCenter: string
  accountTitleName: string
  accountTitle: string
  costCenterTitle: string
  debit: string
  credit: string
  details: string
}

function createEmptyVoucherRow(id: number): VoucherRow {
  return {
    id,
    accountCode: '',
    costCenter: '',
    accountTitleName: '',
    accountTitle: '',
    costCenterTitle: '',
    debit: '',
    credit: '',
    details: '',
  }
}

const defaultVoucherCompanyName =
  import.meta.env.VITE_APP_VOUCHER_COMPANY_NAME || 'MC Wellness and Preventive Consultancy, Inc.'

const voucher = reactive({
  companyName: defaultVoucherCompanyName,
  title: 'Check voucher',
  paidTo: '',
  particulars: '',
  periodFrom: '',
  periodTo: '',
  referenceNo: '',
  date: currentManilaDateInputValue(),
  checkNo: '',
  preparedBy: '',
  checkedBy: 'Juanita B. Zamonte',
  approvedBy: 'Jomel Almanzor',
  receivedBy: '',
  receivedDate: '',
})

const rows = ref<VoucherRow[]>([
  createEmptyVoucherRow(1),
])
const nextRowId = ref(2)
const generatingReferenceNo = ref(false)
const showPrintConfirmation = ref(false)
const printError = ref('')
const referenceNoError = ref('')
const reprintModeRecordId = ref<number | null>(null)
const reprintLoadError = ref('')
const route = useRoute()
const router = useRouter()
const { generateApprovalNumber } = useApprovalNumberGenerator()
const {
  records: summaryRecords,
  recordChequeSummaryEvent,
  loadRecords: loadSummaryRecords,
  saving: savingSummaryRecord,
} = useChequeSummaryReports()
const { users, loading: loadingUsers } = useUsersList()
const {
  dentists,
  fetchDentists,
  filters: dentistFilters,
  loading: loadingDentists,
} = useDentists({ perPage: 50 })
const {
  accountCodes,
  costCenters,
  loadAccountCodes,
  loadLibraries,
  loading: loadingAccountLibraries,
} = useVoucherAccountLibraries()
let accountTitleSearchTimeout: ReturnType<typeof setTimeout> | undefined
let dentistSearchTimeout: ReturnType<typeof setTimeout> | undefined
let printClearFallback: ReturnType<typeof setTimeout> | undefined

const amount = computed(() =>
  rows.value.reduce((total, row) => total + parsePlainAmount(row.debit), 0),
)
const creditTotal = computed(() =>
  rows.value.reduce((total, row) => total + parsePlainAmount(row.credit), 0),
)
const amountWords = computed(() => amountToVoucherWords(amount.value))
const formattedAmount = computed(() => formatPlainAmount(amount.value))
const formattedCreditTotal = computed(() => formatPlainAmount(creditTotal.value))
const periodLabel = computed(() => {
  if (!voucher.periodFrom && !voucher.periodTo) return ''
  if (voucher.periodFrom && voucher.periodTo) {
    return `${formatVoucherDate(voucher.periodFrom)} TO ${formatVoucherDate(voucher.periodTo)}`
  }

  return formatVoucherDate(voucher.periodFrom || voucher.periodTo)
})
const preparedByOptions = computed(() =>
  Array.from(
    new Set(
      users.value.map((user) => user.name?.trim()).filter((name): name is string => Boolean(name)),
    ),
  ),
)
const paidToDentistOptions = computed(() =>
  Array.from(
    new Set(
      dentists.value
        .map(formatDentistPaidToName)
        .filter((name): name is string => Boolean(name)),
    ),
  ),
)
const accountTitleOptions = computed(() =>
  accountCodes.value.map((account) => ({
    value: account.code,
    label: account.title,
    description: `Code: ${account.code}`,
  })),
)
const costCenterNameOptions = computed(() =>
  costCenters.value.map((costCenter) => ({
    value: costCenter.code,
    label: costCenter.title,
    description: `Code: ${costCenter.code}`,
  })),
)
const isReprintMode = computed(() => reprintModeRecordId.value !== null)
const printConfirmationTitle = computed(() =>
  isReprintMode.value ? 'Reprint Voucher?' : 'Print Voucher?',
)
const printConfirmationMessage = computed(() =>
  isReprintMode.value
    ? 'This will reprint the saved voucher without creating another cheque summary record.'
    : 'This will save this voucher in the cheque summary, then open the print dialog.',
)
const printButtonLabel = computed(() =>
  isReprintMode.value ? 'Reprint Voucher' : 'Print Voucher',
)
const printConfirmButtonLabel = computed(() =>
  savingSummaryRecord.value ? 'Saving' : isReprintMode.value ? 'Reprint' : 'Save & Print',
)

function formatVoucherDate(value: string) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value

  return `${month}/${day}/${year}`
}

function formatDentistPaidToName(dentist: Dentist) {
  const firstName = String(dentist.firstname || '').trim()
  const middleName = String(dentist.middleinitial || '').trim().replace(/\.$/, '')
  const lastName = String(dentist.lastname || '').trim()
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim()

  return fullName || String(dentist.dentistname || dentist.acctname || '').trim()
}

function addRow() {
  rows.value.push(createEmptyVoucherRow(nextRowId.value))
  nextRowId.value += 1
}

function removeRow(id: number) {
  if (rows.value.length === 1) return
  rows.value = rows.value.filter((row) => row.id !== id)
}

function copyDebitToCredit() {
  rows.value = rows.value.map((row) => ({
    ...row,
    credit: row.debit,
  }))
}

function buildAccountTitle(row: VoucherRow) {
  if (row.accountTitleName && row.costCenterTitle) {
    return `${row.accountTitleName} [${row.costCenterTitle}]`
  }
  if (row.accountTitleName) return row.accountTitleName
  if (row.costCenterTitle) return `[${row.costCenterTitle}]`
  return ''
}

function refreshAccountTitle(row: VoucherRow) {
  row.accountTitle = buildAccountTitle(row)
}

function selectAccountCode(row: VoucherRow, value: string | number | null) {
  row.accountCode = value == null ? '' : String(value)

  const matchedAccount = accountCodes.value.find((account) => account.code === row.accountCode)
  row.accountTitleName = matchedAccount?.title || ''
  refreshAccountTitle(row)
}

function searchAccountTitles(value: string) {
  if (accountTitleSearchTimeout) clearTimeout(accountTitleSearchTimeout)

  accountTitleSearchTimeout = setTimeout(() => {
    void loadAccountCodes({ accountTitle: value })
  }, 300)
}

function searchPaidToDentists(value: string) {
  if (dentistSearchTimeout) clearTimeout(dentistSearchTimeout)

  dentistSearchTimeout = setTimeout(() => {
    dentistFilters.dentistName = value.trim()
    void fetchDentists()
  }, 300)
}

function selectCostCenter(row: VoucherRow, value: string | number | null) {
  row.costCenter = value == null ? '' : String(value)

  const matchedCostCenter = costCenters.value.find(
    (costCenter) => costCenter.code === row.costCenter,
  )
  row.costCenterTitle = matchedCostCenter?.title || ''
  refreshAccountTitle(row)
}

async function generateReferenceNo() {
  generatingReferenceNo.value = true
  referenceNoError.value = ''

  const result = await generateApprovalNumber()

  generatingReferenceNo.value = false

  if (!result.approvalNo) {
    referenceNoError.value = result.error
    return false
  }

  voucher.referenceNo = result.approvalNo
  return true
}

function printVoucher() {
  printError.value = ''
  showPrintConfirmation.value = true
}

function buildVoucherReprintSnapshot(summaryRecordId?: number): VoucherReprintSnapshot {
  return {
    ...(summaryRecordId ? { summaryRecordId } : {}),
    savedAt: new Date().toISOString(),
    voucher: { ...voucher },
    rows: rows.value.map((row) => ({ ...row })),
  }
}

function applyVoucherReprintSnapshot(snapshot: VoucherReprintSnapshot, fallbackRecordId?: number) {
  Object.assign(voucher, snapshot.voucher)
  rows.value = snapshot.rows.length
    ? snapshot.rows.map((row, index) => ({ ...row, id: Number(row.id) || index + 1 }))
    : [createEmptyVoucherRow(1)]
  nextRowId.value = Math.max(...rows.value.map((row) => row.id), 0) + 1
  reprintModeRecordId.value = snapshot.summaryRecordId || fallbackRecordId || null
  reprintLoadError.value = ''
  printError.value = ''
  referenceNoError.value = ''
}

async function loadVoucherReprintFromRoute() {
  const reprintId = Array.isArray(route.query.reprintId)
    ? route.query.reprintId[0]
    : route.query.reprintId

  if (!reprintId) return false

  const recordId = Number(reprintId)
  const localSnapshot = getVoucherReprintSnapshot(reprintId)
  if (localSnapshot) {
    applyVoucherReprintSnapshot(localSnapshot, Number.isFinite(recordId) ? recordId : undefined)
    return true
  }

  await loadSummaryRecords()
  const record = summaryRecords.value.find((row) => row.id === recordId)
  if (record?.voucherPayload) {
    applyVoucherReprintSnapshot(record.voucherPayload, record.id)
    saveVoucherReprintSnapshot({ ...record.voucherPayload, summaryRecordId: record.id })
    return true
  }

  if (!localSnapshot) {
    reprintLoadError.value =
      'This summary row does not have saved voucher details available for reprint.'
    return false
  }

  return false
}

function clearVoucherForm(refreshReferenceNo = true) {
  voucher.companyName = defaultVoucherCompanyName
  voucher.title = 'Check voucher'
  voucher.paidTo = ''
  voucher.particulars = ''
  voucher.periodFrom = ''
  voucher.periodTo = ''
  voucher.referenceNo = ''
  voucher.date = currentManilaDateInputValue()
  voucher.checkNo = ''
  voucher.preparedBy = ''
  voucher.checkedBy = 'Juanita B. Zamonte'
  voucher.approvedBy = 'Jomel Almanzor'
  voucher.receivedBy = ''
  voucher.receivedDate = ''
  rows.value = [createEmptyVoucherRow(1)]
  nextRowId.value = 2
  reprintModeRecordId.value = null
  reprintLoadError.value = ''
  printError.value = ''
  referenceNoError.value = ''

  if (refreshReferenceNo) void generateReferenceNo()
  if (route.query.reprintId) void router.replace({ name: 'checkVouchers', query: {} })
}

function clearVoucherAfterPrint() {
  const clearOnce = () => {
    window.removeEventListener('afterprint', clearOnce)
    if (printClearFallback) window.clearTimeout(printClearFallback)
    printClearFallback = undefined
    clearVoucherForm()
  }

  window.addEventListener('afterprint', clearOnce, { once: true })
  printClearFallback = window.setTimeout(clearOnce, 3000)
}

async function confirmPrintVoucher() {
  printError.value = ''

  if (isReprintMode.value) {
    showPrintConfirmation.value = false
    clearVoucherAfterPrint()
    window.print()
    return
  }

  const result = await recordChequeSummaryEvent({
    kind: 'voucher',
    title: voucher.title,
    documentDate: voucher.date,
    referenceNo: voucher.referenceNo,
    checkNo: voucher.checkNo,
    payee: voucher.paidTo,
    amount: amount.value,
    preparedBy: voucher.preparedBy,
    accountName: voucher.companyName,
    voucherPayload: buildVoucherReprintSnapshot(),
  })

  if (!result.ok) {
    printError.value = result.error
    return
  }

  showPrintConfirmation.value = false
  if (result.data?.id) {
    saveVoucherReprintSnapshot(buildVoucherReprintSnapshot(result.data.id))
  }
  clearVoucherAfterPrint()
  window.print()
}

onMounted(async () => {
  void loadLibraries()

  const loadedReprint = await loadVoucherReprintFromRoute()

  if (!loadedReprint && !voucher.referenceNo.trim()) {
    void generateReferenceNo()
  }
})

onBeforeUnmount(() => {
  if (accountTitleSearchTimeout) clearTimeout(accountTitleSearchTimeout)
  if (dentistSearchTimeout) clearTimeout(dentistSearchTimeout)
  if (printClearFallback) window.clearTimeout(printClearFallback)
})
</script>

<template>
  <div class="space-y-6">
    <AppModal
      :show="showPrintConfirmation"
      :title="printConfirmationTitle"
      subtitle="Cheque Summary"
      max-width="sm:max-w-lg"
      @close="showPrintConfirmation = false"
    >
      <div class="space-y-4 px-6 py-5">
        <p class="text-sm leading-6 text-slate">
          {{ printConfirmationMessage }}
        </p>
        <div class="grid gap-3 rounded-2xl border border-[#ded7cc] bg-[#fbf7ef] p-4 text-sm">
          <div class="flex justify-between gap-4">
            <span class="font-semibold text-slate">Reference</span>
            <span class="font-bold text-onyx">{{ voucher.referenceNo || 'N/A' }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="font-semibold text-slate">Paid to</span>
            <span class="font-bold text-onyx">{{ voucher.paidTo || 'N/A' }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="font-semibold text-slate">Amount</span>
            <span class="font-bold text-onyx">{{ formattedAmount }}</span>
          </div>
        </div>
        <p
          v-if="printError"
          class="rounded-xl border border-ruby bg-ruby-light px-4 py-3 text-sm font-semibold text-ruby"
        >
          {{ printError }}
        </p>
      </div>

      <template #footer>
        <div class="grid gap-3 sm:grid-cols-2">
          <AppButton
            btn-theme="outline"
            type="button"
            class="w-full justify-center"
            :disabled="savingSummaryRecord"
            @click="showPrintConfirmation = false"
          >
            Cancel
          </AppButton>
          <AppButton
            btn-theme="primary"
            type="button"
            class="w-full justify-center"
            :disabled="savingSummaryRecord"
            @click="confirmPrintVoucher"
          >
            <Icon
              :icon="savingSummaryRecord ? 'feather:loader' : 'feather:printer'"
              class="h-4 w-4"
              :class="{ 'animate-spin': savingSummaryRecord }"
            />
            {{ printConfirmButtonLabel }}
          </AppButton>
        </div>
      </template>
    </AppModal>

    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-smoke">Payables</p>
        <h1 class="mt-2 text-2xl font-black text-onyx">Check Voucher Generator</h1>
        <p v-if="isReprintMode" class="mt-2 text-sm font-semibold text-sapphire">
          Reprinting saved voucher #{{ reprintModeRecordId }}
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <AppButton btn-theme="outline" type="button" @click="clearVoucherForm">
          <Icon icon="feather:x-circle" class="h-4 w-4" />
          Clear
        </AppButton>
        <AppButton btn-theme="outline" type="button" @click="copyDebitToCredit">
          <Icon icon="feather:copy" class="h-4 w-4" />
          Match Credit
        </AppButton>
        <AppButton btn-theme="primary" type="button" @click="printVoucher">
          <Icon icon="feather:printer" class="h-4 w-4" />
          {{ printButtonLabel }}
        </AppButton>
      </div>
    </div>

    <div
      v-if="reprintLoadError"
      class="rounded-xl border border-ruby bg-ruby-light px-4 py-3 text-sm font-semibold text-ruby"
    >
      {{ reprintLoadError }}
    </div>

    <div class="grid gap-6 2xl:grid-cols-[minmax(360px,520px)_1fr]">
      <form
        class="no-print space-y-5 rounded-3xl border border-[#d8d1c5] bg-[linear-gradient(180deg,#fbf6ee_0%,#eef1ed_100%)] p-5 shadow-sm"
        @submit.prevent="printVoucher"
      >
        <section class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate"
          >
            <Icon icon="feather:file-text" class="h-4 w-4" />
            Voucher Details
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput v-model="voucher.companyName" label="Company name" />
            <AppInput v-model="voucher.title" label="Voucher title" />
            <div>
              <label class="mb-2 block text-sm font-medium text-onyx">Paid to</label>
              <div class="relative">
                <Icon
                  :icon="loadingDentists ? 'feather:loader' : 'feather:search'"
                  class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate"
                  :class="{ 'animate-spin': loadingDentists }"
                />
                <input
                  v-model="voucher.paidTo"
                  list="voucher-paid-to-dentist-options"
                  class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] py-3.5 pl-12 pr-4 text-onyx outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 placeholder:text-ash hover:border-slate focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                  :placeholder="loadingDentists ? 'Loading dentists...' : 'Search dentist or type payee'"
                  @input="searchPaidToDentists(($event.target as HTMLInputElement).value)"
                />
                <datalist id="voucher-paid-to-dentist-options">
                  <option v-for="name in paidToDentistOptions" :key="name" :value="name" />
                </datalist>
              </div>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-onyx">Reference no.</label>
              <div class="flex gap-2">
                <input
                  v-model="voucher.referenceNo"
                  class="min-w-0 flex-1 rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] px-4 py-3.5 text-onyx outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 placeholder:text-ash focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                  placeholder="Auto"
                />
                <button
                  type="button"
                  class="inline-flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border border-pebble bg-white text-onyx shadow-sm transition hover:border-tangerine hover:text-tangerine disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="generatingReferenceNo"
                  aria-label="Generate reference number"
                  title="Generate reference number"
                  @click="generateReferenceNo"
                >
                  <Icon
                    :icon="generatingReferenceNo ? 'feather:loader' : 'feather:shuffle'"
                    class="h-5 w-5"
                    :class="{ 'animate-spin': generatingReferenceNo }"
                  />
                </button>
              </div>
              <p v-if="referenceNoError" class="mt-2 text-xs font-semibold text-ruby">
                {{ referenceNoError }}
              </p>
            </div>
            <AppInput v-model="voucher.date" type="date" label="Voucher date" />
            <AppInput v-model="voucher.checkNo" label="Check no." />
            <AppInput v-model="voucher.periodFrom" type="date" label="Period from" />
            <AppInput v-model="voucher.periodTo" type="date" label="Period to" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-onyx">Particulars</label>
            <textarea
              v-model="voucher.particulars"
              class="min-h-28 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
            />
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div
              class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate"
            >
              <Icon icon="feather:list" class="h-4 w-4" />
              Account Lines
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-pebble bg-white px-3 py-2 text-sm font-semibold text-onyx shadow-sm transition hover:border-tangerine hover:text-tangerine"
              @click="addRow"
            >
              <Icon icon="feather:plus" class="h-4 w-4" />
              Add line
            </button>
          </div>

          <div
            v-for="(row, index) in rows"
            :key="row.id"
            class="space-y-4 rounded-2xl border border-[#ded7cc] bg-white/72 p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-bold text-onyx">Line {{ index + 1 }}</p>
              <button
                type="button"
                class="rounded-lg p-2 text-smoke transition hover:bg-ruby-light hover:text-ruby disabled:cursor-not-allowed disabled:opacity-35"
                :disabled="rows.length === 1"
                @click="removeRow(row.id)"
              >
                <Icon icon="feather:trash-2" class="h-4 w-4" />
              </button>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <AppSearchSelect
                v-model="row.accountCode"
                :options="accountTitleOptions"
                label="Account title"
                placeholder="Select account title"
                empty-text="No account codes found."
                :loading="loadingAccountLibraries"
                @update:model-value="selectAccountCode(row, $event)"
                @update:search="searchAccountTitles"
              />
              <AppSearchSelect
                v-model="row.costCenter"
                :options="costCenterNameOptions"
                label="Cost center name"
                placeholder="Select cost center name"
                empty-text="No cost centers found."
                :loading="loadingAccountLibraries"
                @update:model-value="selectCostCenter(row, $event)"
              />
              <AppInput
                v-model="row.details"
                class="sm:col-span-2"
                label="Details"
                placeholder="Optional details"
              />
              <AppInput
                v-model="row.debit"
                decimal-only
                inputmode="decimal"
                label="Debit"
                placeholder="0.00"
              />
              <AppInput
                v-model="row.credit"
                decimal-only
                inputmode="decimal"
                label="Credit"
                placeholder="0.00"
              />
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate"
          >
            <Icon icon="feather:check-square" class="h-4 w-4" />
            Signatories
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-onyx">Prepared by</label>
              <div class="relative">
                <Icon
                  :icon="loadingUsers ? 'feather:loader' : 'feather:user'"
                  class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate"
                  :class="{ 'animate-spin': loadingUsers }"
                />
                <input
                  v-model="voucher.preparedBy"
                  list="voucher-prepared-by-options"
                  class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] py-3.5 pl-12 pr-4 text-onyx outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 placeholder:text-ash hover:border-slate focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                  :placeholder="loadingUsers ? 'Loading users...' : 'Select or type a name'"
                />
                <datalist id="voucher-prepared-by-options">
                  <option v-for="name in preparedByOptions" :key="name" :value="name" />
                </datalist>
              </div>
            </div>
            <AppInput v-model="voucher.checkedBy" label="Checked by" />
            <AppInput v-model="voucher.approvedBy" label="Approved by" />
            <AppInput v-model="voucher.receivedBy" label="Received by" />
            <AppInput v-model="voucher.receivedDate" type="date" label="Received date" />
          </div>
        </section>
      </form>

      <section
        class="printable-voucher overflow-auto rounded-3xl border border-[#d8d1c5] bg-[#f7f2e8] p-4 shadow-md 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-3rem)] 2xl:self-start"
      >
        <div class="voucher-sheet mx-auto bg-[#f3eddf] text-[#222] shadow-sm">
          <div class="grid grid-cols-[1fr_165px] gap-6">
            <div class="min-w-0">
              <div class="voucher-title-block">
                <p class="text-[13px] font-bold">{{ voucher.companyName }}</p>
                <p class="mt-1 text-[13px] font-bold">{{ voucher.title }}</p>
              </div>

              <div class="mt-5 grid grid-cols-[90px_1fr] gap-x-3 gap-y-1 text-[12px]">
                <p class="font-semibold">Paid To:</p>
                <p class="font-bold uppercase">{{ voucher.paidTo || '&nbsp;' }}</p>
                <p class="font-semibold">Particulars:</p>
                <p class="font-bold uppercase">
                  {{ voucher.particulars || '&nbsp;' }}
                  <span v-if="periodLabel"> FOR THE PERIOD OF {{ periodLabel }}</span>
                </p>
              </div>

              <div class="mt-5 grid grid-cols-[90px_1fr] gap-x-3 text-[13px]">
                <p class="font-semibold">Amount:</p>
                <p class="font-bold">{{ amountWords }}</p>
              </div>
            </div>

            <div class="pt-16 text-[13px]">
              <div class="grid grid-cols-[62px_1fr] gap-y-1">
                <span class="font-semibold">Ref. #:</span>
                <span class="font-bold">{{ voucher.referenceNo }}</span>
                <span class="font-semibold">Date:</span>
                <span class="font-bold">{{ formatVoucherDate(voucher.date) }}</span>
                <span class="font-semibold">Chk. #:</span>
                <span class="font-bold">{{ voucher.checkNo }}</span>
                <span class="font-semibold">Amt.:</span>
                <span class="font-bold">{{ formattedAmount }}</span>
              </div>
            </div>
          </div>

          <table class="voucher-table mt-5 w-full text-[10px]">
            <thead>
              <tr>
                <th>Account<br />Codes</th>
                <th>Cost<br />Center</th>
                <th>Account Title</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="`preview-${row.id}`">
                <td>{{ row.accountCode }}</td>
                <td>{{ row.costCenter }}</td>
                <td>{{ row.accountTitle }}</td>
                <td class="text-right">
                  {{ row.debit ? formatPlainAmount(parsePlainAmount(row.debit)) : '' }}
                </td>
                <td class="text-right">
                  {{ row.credit ? formatPlainAmount(parsePlainAmount(row.credit)) : '' }}
                </td>
                <td>
                  <span v-if="row.details">{{ row.details }}</span>
                  <span v-else-if="voucher.checkNo">Check #{{ voucher.checkNo }}</span>
                </td>
              </tr>
              <tr v-for="blank in Math.max(0, 5 - rows.length)" :key="`blank-${blank}`">
                <td>&nbsp;</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <table class="voucher-total-table mt-8 w-full text-[13px] font-semibold">
            <tbody>
              <tr>
                <td class="w-[32%]"></td>
                <td class="w-[17%] text-center">TOTAL</td>
                <td class="w-[17%] text-right">
                  {{ formattedAmount }}
                </td>
                <td class="w-[17%] text-right">
                  {{ formattedCreditTotal }}
                </td>
                <td class="w-[17%]"></td>
              </tr>
            </tbody>
          </table>

          <div class="mt-10 grid grid-cols-4 gap-4 text-[12px]">
            <div>
              <div class="signature-line">{{ voucher.preparedBy }}</div>
              <p class="mt-2 font-semibold">Prepared by:</p>
            </div>
            <div>
              <div class="signature-line">{{ voucher.checkedBy }}</div>
              <p class="mt-2 font-semibold">Checked by:</p>
            </div>
            <div>
              <div class="signature-line">{{ voucher.approvedBy }}</div>
              <p class="mt-2 font-semibold">Approved by:</p>
            </div>
            <div>
              <div class="signature-line">{{ voucher.receivedBy }}</div>
              <p class="mt-2 font-semibold">Received by:</p>
              <p class="mt-6 font-semibold">Date: {{ formatVoucherDate(voucher.receivedDate) }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.voucher-sheet {
  box-sizing: border-box;
  width: 8.5in;
  min-height: 6.5in;
  padding: 0.38in 0.45in;
  font-family: Arial, Helvetica, sans-serif;
}

.voucher-table {
  border-collapse: collapse;
  table-layout: fixed;
}

.voucher-title-block {
  margin-left: auto;
  width: 430px;
  max-width: 100%;
  text-align: center;
}

.voucher-table th {
  border-block: 1px solid #222;
  font-weight: 700;
  padding: 4px 6px;
  text-align: center;
}

.voucher-table th:nth-child(1),
.voucher-table td:nth-child(1) {
  width: 12%;
}

.voucher-table th:nth-child(2),
.voucher-table td:nth-child(2) {
  width: 13%;
}

.voucher-table th:nth-child(3),
.voucher-table td:nth-child(3) {
  width: 31%;
}

.voucher-table th:nth-child(4),
.voucher-table td:nth-child(4),
.voucher-table th:nth-child(5),
.voucher-table td:nth-child(5) {
  width: 13%;
}

.voucher-table th:nth-child(6),
.voucher-table td:nth-child(6) {
  width: 18%;
}

.voucher-table td {
  height: 24px;
  padding: 4px 6px;
  vertical-align: top;
}

.voucher-total-table {
  border-collapse: collapse;
  table-layout: fixed;
}

.voucher-total-table td {
  border-block: 1px solid #222;
  padding: 3px 6px;
}

.signature-line {
  min-height: 24px;
  border-bottom: 1px solid #222;
  font-weight: 700;
  text-align: center;
}

@media print {
  @page {
    size: 8.5in 6.5in;
    margin: 0;
  }

  :global(body) {
    background: #fff !important;
  }

  :global(body *) {
    visibility: hidden !important;
  }

  .printable-voucher,
  .printable-voucher * {
    visibility: visible !important;
  }

  .printable-voucher {
    position: fixed;
    inset: 0;
    overflow: visible !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #fff !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  .voucher-sheet {
    width: 8.5in;
    height: 6.5in;
    min-height: 0;
    box-shadow: none !important;
  }
}
</style>
