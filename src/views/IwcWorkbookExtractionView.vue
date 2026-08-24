<script setup lang="ts">
import { Icon } from '@iconify/vue'
import * as XLSX from 'xlsx'
import { AppButton, AppLoadingScreen, AppTable } from '@/components/app'
import { useIwcBatchExtraction } from '@/composables'
import { formatCurrency, formatDate, formatDateTime } from '@/utils'

const {
  loadingBatchOptions,
  loadingSummary,
  loadingRecords,
  errorMessage,
  batchCode,
  batchOptions,
  summary,
  records,
  currentPage,
  totalEntries,
  totalPages,
  canExtract,
  hasSummary,
  fetchBatchSummary,
  exportBatchRows,
  clearExtraction,
} = useIwcBatchExtraction()

async function exportToExcel() {
  if (!summary.value) return

  const exportRows = await exportBatchRows()
  if (!exportRows.length) return

  const worksheet = XLSX.utils.json_to_sheet(
    exportRows.map((row, index) => ({
      'No.': index + 1,
      'Batch Code': summary.value?.batchCode || '',
      'Company Code': row.companyCode || summary.value?.companyCode || '',
      'Company Name': row.companyName || summary.value?.companyName || '',
      'Member Name': row.fullName,
      'ID No.': row.idNo || '',
      'Card No.': row.cardNo || '',
      'Area/Location': row.areaLocation || '',
      'Dental Premium': row.dentalPremium || '',
      'Payment Period': row.paymentPeriod || '',
      Status: row.paid ? 'Received' : 'Pending',
      'Paid At': row.paidAt || '',
      'Payment Reference': row.paymentReference || '',
    })),
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Imported Batch Rows')
  XLSX.writeFile(workbook, `${summary.value.batchCode}-imported-rows.xlsx`)
}
</script>

<template>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#f7efe2_0%,#ffffff_46%,#eef6ff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:p-7">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="feather:database" class="h-4 w-4" />
            IWC Batch Extraction
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">IWC Batch Totals</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Pick an existing imported IWC batch to load the stored totals and review the member
            rows already saved in the system. No Excel re-upload is needed.
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
            :disabled="!hasSummary"
            @click="exportToExcel"
          >
            <Icon icon="feather:file-text" class="h-4 w-4" />
            Export Rows
          </AppButton>
        </div>
      </div>

      <div class="grid border-t border-pebble/80 bg-white/72 md:grid-cols-4">
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Rows</p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ summary?.importedRows || 0 }}</p>
        </div>
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Received</p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ summary?.paidRows || 0 }}</p>
        </div>
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Pending</p>
          <p class="mt-2 text-2xl font-black text-amber">{{ summary?.unpaidRows || 0 }}</p>
        </div>
        <div class="px-6 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
            Dental Premium
          </p>
          <p class="mt-2 text-2xl font-black text-emerald">
            {{ formatCurrency(summary?.dentalPremiumTotal, 'PHP 0.00') }}
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5">
        <h2 class="text-xl font-black text-onyx">Batch Code</h2>
        <p class="mt-1 text-sm text-slate">
          Select a stored IWC batch code with its company code and upload timestamp.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <label class="mb-2 block text-sm font-medium text-onyx">Batch Code</label>
          <div class="relative">
            <Icon
              icon="feather:hash"
              class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
            />
            <select
              v-model="batchCode"
              class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] py-3.5 pr-4 pl-11 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
              :disabled="loadingBatchOptions || !batchOptions.length"
            >
              <option value="">
                {{
                  loadingBatchOptions
                    ? 'Loading IWC batches...'
                    : batchOptions.length
                      ? 'Select an imported IWC batch'
                      : 'No imported IWC batches found'
                }}
              </option>
              <option
                v-for="batch in batchOptions"
                :key="batch.id"
                :value="batch.batchCode"
              >
                {{ batch.batchCode }} | {{ batch.companyCode }} | {{ formatDateTime(batch.uploadedAt) }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex items-end">
          <AppButton
            btn-theme="primary"
            class="normal-case"
            :disabled="loadingSummary || !canExtract"
            @click="fetchBatchSummary"
          >
            <Icon
              :icon="loadingSummary ? 'feather:loader' : 'feather:search'"
              class="h-4 w-4"
              :class="{ 'animate-spin': loadingSummary }"
            />
            {{ loadingSummary ? 'Loading...' : 'Load Batch' }}
          </AppButton>
        </div>
      </div>

      <p v-if="errorMessage" class="mt-5 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
        {{ errorMessage }}
      </p>
    </section>

    <section v-if="summary" class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5">
        <h2 class="text-xl font-black text-onyx">Batch Summary</h2>
        <p class="mt-1 text-sm text-slate">
          Snapshot of the imported batch already stored in the system.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-[1.3rem] border border-pebble bg-cloud px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Company</p>
          <p class="mt-2 font-bold text-onyx">{{ summary.companyCode }} · {{ summary.companyName }}</p>
        </div>
        <div class="rounded-[1.3rem] border border-pebble bg-cloud px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Sheet</p>
          <p class="mt-2 font-bold text-onyx">{{ summary.sourceSheetName || 'N/A' }}</p>
        </div>
        <div class="rounded-[1.3rem] border border-pebble bg-cloud px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Payment Period</p>
          <p class="mt-2 font-bold text-onyx">{{ summary.paymentPeriod || 'N/A' }}</p>
        </div>
        <div class="rounded-[1.3rem] border border-pebble bg-cloud px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Uploaded</p>
          <p class="mt-2 font-bold text-onyx">{{ formatDateTime(summary.uploadedAt) }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Imported Rows</h2>
          <p class="mt-1 text-sm text-slate">
            Preview the already-imported partner rows under this batch code.
          </p>
        </div>
        <p v-if="summary" class="text-sm text-slate">
          Showing {{ records.length }} of {{ totalEntries }} imported row(s).
        </p>
      </div>

      <AppLoadingScreen
        v-if="loadingRecords"
        title="Loading imported rows"
        message="Please wait while we retrieve the stored partner member records."
      />

      <AppTable
        v-else
        :theads="[
          'Member',
          'Identifier',
          'Location',
          'Dental Premium',
          'Payment Period',
          'Status',
          'Paid At',
        ]"
        :total-entries="totalEntries"
        :total-pages="totalPages"
        :current-page="currentPage"
        @update-pg-num="currentPage = $event"
      >
        <template #trs>
          <tr v-if="!records.length">
            <td colspan="7" class="py-12! text-center! text-sm text-slate">
              No imported rows found for this batch code yet.
            </td>
          </tr>
          <tr v-for="record in records" v-else :key="record.id">
            <td class="font-semibold text-onyx">{{ record.fullName }}</td>
            <td>
              <p class="text-sm text-onyx">{{ record.idNo || record.cardNo || 'N/A' }}</p>
              <p class="mt-1 text-xs text-slate">Row {{ record.rowNumber }}</p>
            </td>
            <td>{{ record.areaLocation || 'N/A' }}</td>
            <td class="font-black text-emerald">{{ formatCurrency(record.dentalPremium) }}</td>
            <td>{{ record.paymentPeriod || 'N/A' }}</td>
            <td>
              <span
                class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                :class="record.paid ? 'bg-emerald-light text-emerald' : 'bg-amber-light text-amber'"
              >
                {{ record.paid ? 'Received' : 'Pending' }}
              </span>
            </td>
            <td>{{ formatDate(record.paidAt) }}</td>
          </tr>
        </template>
      </AppTable>
    </section>
  </div>
</template>
