<script setup lang="ts">
import { Icon } from '@iconify/vue'
import * as XLSX from 'xlsx'
import { computed } from 'vue'
import { AppButton, AppInput, AppLoadingScreen, AppTable } from '@/components/app'
import { usePaymentExtraction } from '@/composables'
import { formatCurrency, formatDate } from '@/utils'

const { canExtract, clearExtraction, errorMessage, extractImsPayments, form, loading, rows } =
  usePaymentExtraction()

const totalDentalShare = computed(() =>
  rows.value.reduce((sum, row) => sum + Number(row.dentalshare || 0), 0),
)
const uniqueCompanies = computed(
  () => new Set(rows.value.map((row) => row.maincompany).filter(Boolean)).size,
)

const excelColumns = [
  ['no', 'No.'],
  ['iwc_accounts', 'IWC Accounts'],
  ['ecp_type', 'ECP Type'],
  ['maincompany', 'Main Company'],
  ['umbrellacomp', 'Umbrella Company'],
  ['membername', 'Member Name'],
  ['origprem', 'Original Premium'],
  ['dentalprem1', 'Dental Premium'],
  ['plancode', 'Plan Code'],
  ['dentalshare', 'Dental Share'],
  ['vat', 'VAT'],
  ['ar_number', 'AR Number'],
  ['or_number', 'OR Number'],
  ['posteddate', 'Posted Date'],
  ['payment_period', 'Payment Period'],
  ['free', 'Free'],
  ['planholderid', 'Planholder ID'],
] as const

function exportToExcel() {
  if (!rows.value.length) return

  const exportRows = rows.value.map((row, index) =>
    Object.fromEntries(
      excelColumns.map(([key, label]) => [label, key === 'no' ? index + 1 : (row[key] ?? '')]),
    ),
  )
  const worksheet = XLSX.utils.json_to_sheet(exportRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'IMS Wellness Payables')

  const datePart =
    form.referenceNo.trim() ||
    [form.start, form.end].filter(Boolean).join('_to_') ||
    new Date().toISOString().slice(0, 10)

  XLSX.writeFile(workbook, `ims-wellness-payables-${datePart}.xlsx`)
}
</script>

<template>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:p-7">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="feather:download-cloud" class="h-4 w-4" />
            IMS Wellness Payables
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">IMS Wellness Payables</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Extract IMS wellness dental payment rows by process date range or payment reference
            number, then export the result to Excel.
          </p>
        </div>
        <div class="flex flex-wrap gap-3 lg:justify-end">
          <AppButton btn-theme="outline" class="normal-case" @click="clearExtraction">
            <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
            Clear
          </AppButton>
          <AppButton
            btn-theme="primary"
            class="normal-case"
            :disabled="loading || !canExtract"
            @click="extractImsPayments"
          >
            <Icon
              :icon="loading ? 'feather:loader' : 'feather:search'"
              class="h-4 w-4"
              :class="{ 'animate-spin': loading }"
            />
            {{ loading ? 'Extracting...' : 'Extract Rows' }}
          </AppButton>
        </div>
      </div>

      <div class="grid border-t border-pebble/80 bg-white/72 md:grid-cols-3">
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Rows</p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ rows.length }}</p>
        </div>
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Companies</p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ uniqueCompanies }}</p>
        </div>
        <div class="px-6 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Dental Share</p>
          <p class="mt-2 text-2xl font-black text-emerald">
            {{ formatCurrency(totalDentalShare, 'PHP 0.00') }}
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5">
        <h2 class="text-xl font-black text-onyx">Extraction Criteria</h2>
        <p class="mt-1 text-sm text-slate">
          Use a complete date range, a payment reference number, or both.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <AppInput v-model="form.start" label="Posted Start Date" type="date" />
        <AppInput v-model="form.end" label="Posted End Date" type="date" />
        <AppInput
          v-model="form.referenceNo"
          label="Reference No."
          placeholder="Optional reference no."
          icon="feather:hash"
        />
      </div>

      <p v-if="errorMessage" class="mt-5 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
        {{ errorMessage }}
      </p>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Extracted IMS Rows</h2>
          <p class="mt-1 text-sm text-slate">
            Preview the extraction before downloading the Excel file.
          </p>
        </div>
        <AppButton
          btn-theme="primary"
          class="normal-case"
          :disabled="loading || !rows.length"
          @click="exportToExcel"
        >
          <Icon icon="feather:file-text" class="h-4 w-4" />
          Export Excel
        </AppButton>
      </div>

      <AppLoadingScreen
        v-if="loading"
        title="Extracting payment rows"
        message="Please wait while we prepare the IMS payment extraction."
      />
      <AppTable
        v-else
        :theads="[
          'Company',
          'Member',
          'Plan Code',
          'Dental Share',
          'AR / OR',
          'Posted Date',
          'Period',
        ]"
        :total-entries="rows.length"
      >
        <template #trs>
          <tr v-if="!rows.length">
            <td colspan="7" class="py-12! text-center! text-sm text-slate">
              No extracted rows yet.
            </td>
          </tr>
          <tr v-for="(row, index) in rows" v-else :key="`${row.planholderid}-${index}`">
            <td>
              <p class="font-semibold text-onyx">{{ row.maincompany || 'N/A' }}</p>
              <p class="mt-1 text-xs text-slate">{{ row.umbrellacomp || 'N/A' }}</p>
            </td>
            <td>{{ row.membername || 'N/A' }}</td>
            <td>{{ row.plancode || 'N/A' }}</td>
            <td class="font-black text-onyx">{{ formatCurrency(row.dentalshare) }}</td>
            <td>
              <p class="font-mono text-xs text-slate">AR {{ row.ar_number || 'N/A' }}</p>
              <p class="mt-1 font-mono text-xs text-slate">OR {{ row.or_number || 'N/A' }}</p>
            </td>
            <td>{{ formatDate(row.posteddate) }}</td>
            <td>{{ formatDate(row.payment_period) }}</td>
          </tr>
        </template>
      </AppTable>
    </section>
  </div>
</template>
