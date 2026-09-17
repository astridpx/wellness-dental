<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { AppButton, AppInput } from '@/components/app'
import { useApprovalNumberGenerator, useUsersList } from '@/composables'
import { currentManilaDateInputValue } from '@/utils'

type VoucherRow = {
  id: number
  accountCode: string
  costCenter: string
  accountTitle: string
  debit: string
  credit: string
  details: string
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
  {
    id: 1,
    accountCode: '',
    costCenter: '',
    accountTitle: 'Dentist Fee [Admin-Direct]',
    debit: '',
    credit: '',
    details: '',
  },
])
const nextRowId = ref(2)
const generatingReferenceNo = ref(false)
const referenceNoError = ref('')
const { generateApprovalNumber } = useApprovalNumberGenerator()
const { users, loading: loadingUsers } = useUsersList()

const amount = computed(() => rows.value.reduce((total, row) => total + toAmount(row.debit), 0))
const creditTotal = computed(() =>
  rows.value.reduce((total, row) => total + toAmount(row.credit), 0),
)
const amountWords = computed(() => amountToWords(amount.value))
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

function toAmount(value: string | number) {
  const amountValue = Number(String(value || '').replace(/,/g, ''))
  return Number.isFinite(amountValue) ? amountValue : 0
}

function formatPlainAmount(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatVoucherDate(value: string) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value

  return `${month}/${day}/${year}`
}

function integerToWords(value: number): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ]

  if (value < 20) return ones[value] || ''
  if (value < 100) {
    return `${tens[Math.floor(value / 10)] || ''}${value % 10 ? ` ${ones[value % 10] || ''}` : ''}`
  }
  if (value < 1000) {
    return `${ones[Math.floor(value / 100)] || ''} Hundred${
      value % 100 ? ` ${integerToWords(value % 100)}` : ''
    }`
  }
  if (value < 1000000) {
    return `${integerToWords(Math.floor(value / 1000))} Thousand${
      value % 1000 ? ` ${integerToWords(value % 1000)}` : ''
    }`
  }

  return `${integerToWords(Math.floor(value / 1000000))} Million${
    value % 1000000 ? ` ${integerToWords(value % 1000000)}` : ''
  }`
}

function amountToWords(value: number) {
  if (!value) return 'Zero & 00/100'

  const whole = Math.floor(value)
  const cents = Math.round((value - whole) * 100)
  return `${integerToWords(whole)} & ${String(cents).padStart(2, '0')}/100`
}

function addRow() {
  rows.value.push({
    id: nextRowId.value,
    accountCode: '',
    costCenter: '',
    accountTitle: '',
    debit: '',
    credit: '',
    details: '',
  })
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
  window.print()
}

onMounted(() => {
  if (!voucher.referenceNo.trim()) {
    void generateReferenceNo()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-smoke">Payables</p>
        <h1 class="mt-2 text-2xl font-black text-onyx">Check Voucher Generator</h1>
      </div>

      <div class="flex flex-wrap gap-3">
        <AppButton btn-theme="outline" type="button" @click="copyDebitToCredit">
          <Icon icon="feather:copy" class="h-4 w-4" />
          Match Credit
        </AppButton>
        <AppButton btn-theme="primary" type="button" @click="printVoucher">
          <Icon icon="feather:printer" class="h-4 w-4" />
          Print Voucher
        </AppButton>
      </div>
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
            <AppInput v-model="voucher.paidTo" label="Paid to" />
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
                  class="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-pebble bg-white text-onyx shadow-sm transition hover:border-tangerine hover:text-tangerine disabled:cursor-not-allowed disabled:opacity-50"
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
              <AppInput v-model="row.accountCode" label="Account code" />
              <AppInput v-model="row.costCenter" label="Cost center" />
              <AppInput v-model="row.accountTitle" label="Account title" />
              <AppInput v-model="row.details" label="Details" />
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
        class="printable-voucher overflow-auto rounded-3xl border border-[#d8d1c5] bg-[#f7f2e8] p-4 shadow-md"
      >
        <div class="voucher-sheet mx-auto bg-[#f3eddf] text-[#222] shadow-sm">
          <div class="grid grid-cols-[1fr_190px] gap-10">
            <div class="min-w-0">
              <div class="voucher-title-block">
                <p class="text-[13px] font-bold">{{ voucher.companyName }}</p>
                <p class="mt-1 text-[13px] font-bold">{{ voucher.title }}</p>
              </div>

              <div class="mt-8 grid grid-cols-[95px_1fr] gap-x-4 gap-y-1 text-[13px]">
                <p class="font-semibold">Paid To:</p>
                <p class="font-bold uppercase">{{ voucher.paidTo || '&nbsp;' }}</p>
                <p class="font-semibold">Particulars:</p>
                <p class="font-bold uppercase">
                  {{ voucher.particulars || '&nbsp;' }}
                  <span v-if="periodLabel"> FOR THE PERIOD OF {{ periodLabel }}</span>
                </p>
              </div>

              <div class="mt-8 grid grid-cols-[95px_1fr] gap-x-4 text-[14px]">
                <p class="font-semibold">Amount:</p>
                <p class="font-bold">{{ amountWords }}</p>
              </div>
            </div>

            <div class="pt-24 text-[14px]">
              <div class="grid grid-cols-[72px_1fr] gap-y-1">
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

          <table class="voucher-table mt-8 w-full text-[11px]">
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
                  {{ row.debit ? formatPlainAmount(toAmount(row.debit)) : '' }}
                </td>
                <td class="text-right">
                  {{ row.credit ? formatPlainAmount(toAmount(row.credit)) : '' }}
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

          <table class="voucher-total-table mt-16 w-full text-[14px] font-semibold">
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

          <div class="mt-20 grid grid-cols-4 gap-8 text-[14px]">
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
  width: 11in;
  min-height: 8.5in;
  padding: 0.52in 0.62in;
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
  padding: 5px 8px;
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
  height: 30px;
  padding: 5px 8px;
  vertical-align: top;
}

.voucher-total-table {
  border-collapse: collapse;
  table-layout: fixed;
}

.voucher-total-table td {
  border-block: 1px solid #222;
  padding: 4px 8px;
}

.signature-line {
  min-height: 32px;
  border-bottom: 1px solid #222;
  font-weight: 700;
  text-align: center;
}

@media print {
  @page {
    size: landscape;
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
    width: 11in;
    min-height: 8.5in;
    box-shadow: none !important;
  }
}
</style>
