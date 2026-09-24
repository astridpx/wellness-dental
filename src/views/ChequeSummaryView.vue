<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { AppButton, AppInput, AppModal } from '@/components/app'
import { useChequeSummaryReports, type ChequeSummaryRecord } from '@/composables'
import { formatDateTime, formatMoney } from '@/utils'

const {
  deleteRecord,
  errorMessage,
  filteredRecords,
  filters,
  loadRecords,
  loading,
  resetFilters,
  saving,
  summary,
} = useChequeSummaryReports({ autoLoad: true })
const recordToDelete = ref<ChequeSummaryRecord | null>(null)

const typeOptions = [
  { value: 'all', label: 'All documents' },
  { value: 'voucher', label: 'Vouchers' },
  { value: 'cheque', label: 'Cheques' },
] as const

const statCards = computed(() => [
  {
    label: 'Voucher Created',
    value: summary.value.vouchers,
    icon: 'feather:file-text',
  },
  {
    label: 'Cheque Printed',
    value: summary.value.cheques,
    icon: 'feather:printer',
  },
  {
    label: 'Total Records',
    value: summary.value.total,
    icon: 'feather:archive',
  },
  {
    label: 'Total Amount',
    value: formatMoney(summary.value.amount),
    icon: 'feather:dollar-sign',
  },
])

function documentLabel(record: ChequeSummaryRecord) {
  return record.kind === 'voucher' ? 'Voucher' : 'Cheque'
}

function secondaryDetail(record: ChequeSummaryRecord) {
  if (record.kind === 'voucher') return record.preparedBy || record.accountName || 'N/A'
  return record.bankName || record.accountName || 'N/A'
}

async function confirmDeleteRecord() {
  if (!recordToDelete.value) return

  const deleted = await deleteRecord(recordToDelete.value.id)
  if (deleted) recordToDelete.value = null
}
</script>

<template>
  <div class="space-y-6">
    <AppModal
      :show="Boolean(recordToDelete)"
      title="Delete Record?"
      subtitle="Cheque Summary"
      max-width="sm:max-w-lg"
      @close="recordToDelete = null"
    >
      <div class="space-y-4 px-6 py-5">
        <p class="text-sm leading-6 text-slate">
          This will remove the selected voucher or cheque summary record.
        </p>
        <div v-if="recordToDelete" class="grid gap-3 rounded-2xl border border-[#ded7cc] bg-[#fbf7ef] p-4 text-sm">
          <div class="flex justify-between gap-4">
            <span class="font-semibold text-slate">Type</span>
            <span class="font-bold text-onyx">{{ documentLabel(recordToDelete) }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="font-semibold text-slate">Cheque no.</span>
            <span class="font-bold text-onyx">{{ recordToDelete.checkNo || 'N/A' }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="font-semibold text-slate">Payee</span>
            <span class="font-bold text-onyx">{{ recordToDelete.payee || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="grid gap-3 sm:grid-cols-2">
          <AppButton
            btn-theme="outline"
            type="button"
            class="w-full justify-center"
            :disabled="saving"
            @click="recordToDelete = null"
          >
            Cancel
          </AppButton>
          <AppButton
            btn-theme="danger"
            type="button"
            class="w-full justify-center"
            :disabled="saving"
            @click="confirmDeleteRecord"
          >
            <Icon
              :icon="saving ? 'feather:loader' : 'feather:trash-2'"
              class="h-4 w-4"
              :class="{ 'animate-spin': saving }"
            />
            {{ saving ? 'Deleting' : 'Delete' }}
          </AppButton>
        </div>
      </template>
    </AppModal>

    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-smoke">Cheque</p>
        <h1 class="mt-2 text-2xl font-black text-onyx">Voucher & Cheque Summary</h1>
      </div>

      <div class="flex flex-wrap gap-3">
        <AppButton btn-theme="outline" type="button" @click="loadRecords">
          <Icon icon="feather:refresh-cw" class="h-4 w-4" />
          Refresh
        </AppButton>
        <AppButton btn-theme="outline" type="button" @click="resetFilters">
          <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
          Reset
        </AppButton>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-ruby bg-ruby-light px-4 py-3 text-sm font-semibold text-ruby"
    >
      {{ errorMessage }}
    </div>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-xl border border-[#d8d1c5] bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-slate">
              {{ card.label }}
            </p>
            <p class="mt-3 text-2xl font-black text-onyx">{{ card.value }}</p>
          </div>
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-tangerine-light text-tangerine">
            <Icon :icon="card.icon" class="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-[#d8d1c5] bg-white shadow-sm">
      <div
        class="grid gap-4 border-b border-pebble bg-[#f8f2e8] p-5 lg:grid-cols-[180px_1fr_170px_170px]"
      >
        <label>
          <span class="mb-2 block text-sm font-medium text-onyx">Type</span>
          <select
            v-model="filters.kind"
            class="h-13 w-full rounded-xl border border-pebble bg-white px-4 text-sm font-semibold text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
          >
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <AppInput v-model="filters.search" label="Search" placeholder="Payee, ref no., cheque no., bank" />
        <AppInput v-model="filters.dateFrom" type="date" label="Printed from" />
        <AppInput v-model="filters.dateTo" type="date" label="Printed to" />
      </div>

      <div
        v-if="loading"
        class="flex items-center justify-center gap-3 p-10 text-sm font-semibold text-slate"
      >
        <Icon icon="feather:loader" class="h-5 w-5 animate-spin" />
        Loading summary...
      </div>

      <div v-else-if="!filteredRecords.length" class="p-10 text-center text-sm text-slate">
        No voucher or cheque print records found.
      </div>

      <div v-else class="overflow-auto">
        <table class="w-full min-w-[980px] text-left text-sm">
          <thead class="bg-[#fbf8f1] text-xs uppercase tracking-[0.16em] text-slate">
            <tr>
              <th class="px-5 py-3">Printed</th>
              <th class="px-5 py-3">Type</th>
              <th class="px-5 py-3">Reference No.</th>
              <th class="px-5 py-3">Cheque No.</th>
              <th class="px-5 py-3">Payee</th>
              <th class="px-5 py-3 text-right">Amount</th>
              <th class="px-5 py-3">Detail</th>
              <th class="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-pebble">
            <tr
              v-for="record in filteredRecords"
              :key="record.id"
              class="transition hover:bg-[#fffaf0]"
            >
              <td class="px-5 py-4 text-slate">{{ formatDateTime(record.createdAt) }}</td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em]"
                  :class="
                    record.kind === 'voucher'
                      ? 'border-sapphire/20 bg-sapphire/10 text-sapphire'
                      : 'border-tangerine/25 bg-tangerine-light text-tangerine'
                  "
                >
                  <Icon
                    :icon="record.kind === 'voucher' ? 'feather:file-text' : 'feather:printer'"
                    class="h-3.5 w-3.5"
                  />
                  {{ documentLabel(record) }}
                </span>
              </td>
              <td class="px-5 py-4 font-bold text-onyx">{{ record.referenceNo || 'N/A' }}</td>
              <td class="px-5 py-4 font-bold text-onyx">{{ record.checkNo || 'N/A' }}</td>
              <td class="px-5 py-4 text-onyx">{{ record.payee || 'N/A' }}</td>
              <td class="px-5 py-4 text-right font-bold text-onyx">
                {{ formatMoney(record.amount) }}
              </td>
              <td class="px-5 py-4 text-slate">{{ secondaryDetail(record) }}</td>
              <td class="px-5 py-4">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-pebble bg-white text-slate transition hover:border-ruby hover:text-ruby"
                    aria-label="Delete summary record"
                    title="Delete summary record"
                    @click="recordToDelete = record"
                  >
                    <Icon icon="feather:trash-2" class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
