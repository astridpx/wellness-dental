<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { AppButton, AppDialog, AppInput, AppLoadingScreen, AppSearchSelect } from '@/components/app'
import { useDentalAvailmentHistory, useDentists, useProcedures } from '@/composables'
import type { DentalAvailmentRecord } from '@/types'
import {
  currentManilaDateInputValue,
  formatDate,
  formatDateTime,
  formatLongDate,
  formatMoney,
} from '@/utils'

const bulkPaidTarget = ref<{
  paidAt: string
} | null>(null)
const selectedDentistId = ref<string | number | null>(null)
const dentistSearch = ref('')
const lookupApprovalNo = ref('')
const lookupMemberName = ref('')
const lookupSubmitted = ref(false)
const selectedRecordIds = ref<number[]>([])
const selectedRecordMap = ref<Record<number, DentalAvailmentRecord>>({})
const dentistOptions = ref<Array<{ value: number; label: string; description: string }>>([])
const retainedDentist = ref<{
  value: number
  label: string
  description: string
} | null>(null)
let dentistSearchTimer: number | undefined

const {
  fetchBillingLookup,
  clearBillingLookup,
  billingLookupErrorMessage,
  billingLookupRecords,
  loadingBillingLookup,
  updateDoctorPaymentStatusBulk,
  updatingPaymentId,
} = useDentalAvailmentHistory()
const {
  dentists,
  fetchDentists,
  filters: dentistFilters,
  loading: loadingDentists,
} = useDentists({ perPage: 20 })
const { procedures } = useProcedures()

const selectedDentistLabel = computed(() => {
  const matchedDentist = dentists.value.find(
    (dentist) => String(dentist.dentistidno) === String(selectedDentistId.value),
  )

  if (matchedDentist) return formatLegacyDentistName(matchedDentist)
  return retainedDentist.value?.label || ''
})
const lookupCountLabel = computed(
  () =>
    `${billingLookupRecords.value.length} matching availment${
      billingLookupRecords.value.length === 1 ? '' : 's'
    }`,
)
const selectableRecords = computed(() =>
  billingLookupRecords.value.filter((record) => !isDoctorCancelled(record) && !isDoctorPaid(record)),
)
const selectedRecords = computed(() =>
  selectedRecordIds.value
    .map((recordId) => selectedRecordMap.value[recordId])
    .filter((record): record is DentalAvailmentRecord => Boolean(record)),
)
const allSelected = computed(
  () =>
    selectableRecords.value.length > 0 &&
    selectableRecords.value.every((record) => selectedRecordIds.value.includes(record.dentalid)),
)
const procedureNameMap = computed(
  () =>
    new Map(
      procedures.value.map((procedure) => [procedure.code.trim().toUpperCase(), procedure.name]),
    ),
)

function procedureName(value?: string | null) {
  const procedureValue = value?.trim()
  if (!procedureValue) return 'N/A'

  return procedureValue
    .split(',')
    .map((part) => {
      const normalizedPart = part.trim()
      if (!normalizedPart) return ''

      return procedureNameMap.value.get(normalizedPart.toUpperCase()) || normalizedPart
    })
    .filter(Boolean)
    .join(', ')
}

function isDoctorPaid(record?: DentalAvailmentRecord | null) {
  if (!record) return false
  const value = record.IfPaid ?? record.ifPaid ?? record.ifpaid
  return value === true || Number(value || 0) === 1
}

function isDoctorCancelled(record: DentalAvailmentRecord) {
  const status = String(record.status || 'VALID')
    .trim()
    .toUpperCase()

  return ['CANCELLED', 'CANCELED', 'INVALID', 'I'].includes(status)
}

function paymentRecordStatus(record: DentalAvailmentRecord) {
  if (isDoctorCancelled(record)) {
    return {
      label: 'Unavailable',
      className: 'bg-ruby-light text-ruby',
    }
  }

  if (isDoctorPaid(record)) {
    return {
      label: 'Paid',
      className: 'bg-emerald-light text-emerald',
    }
  }

  return {
    label: 'Ready for payment',
    className: 'bg-amber-light text-amber',
  }
}

function formatLegacyDentistName(dentist: {
  dentistname?: string | null
  firstname?: string | null
  middleinitial?: string | null
  lastname?: string | null
}) {
  if (dentist.dentistname?.trim()) return dentist.dentistname.trim()

  const firstName = String(dentist.firstname || '').trim()
  const middleInitial = String(dentist.middleinitial || '')
    .trim()
    .replace(/\.+$/, '')
  const lastName = String(dentist.lastname || '').trim()
  const rightSide = [firstName, middleInitial ? `${middleInitial}.` : ''].filter(Boolean).join(' ')

  return [lastName, rightSide].filter(Boolean).join(', ').trim()
}

function clearFinder() {
  selectedDentistId.value = null
  dentistSearch.value = ''
  dentistFilters.dentistName = ''
  lookupApprovalNo.value = ''
  lookupMemberName.value = ''
  lookupSubmitted.value = false
  selectedRecordIds.value = []
  selectedRecordMap.value = {}
  retainedDentist.value = null
  clearBillingLookup()
  void fetchDentists()
}

async function runLookup() {
  const approvalNo = lookupApprovalNo.value.trim()
  const memberName = lookupMemberName.value.trim()
  const dentistName = selectedDentistLabel.value.trim()

  if (!approvalNo && !dentistName && !memberName) {
    lookupSubmitted.value = false
    clearBillingLookup()
    return
  }

  lookupSubmitted.value = true
  await fetchBillingLookup({ approvalNo, dentistName, memberName })
}

function toggleRecordSelection(recordId: number) {
  if (selectedRecordIds.value.includes(recordId)) {
    selectedRecordIds.value = selectedRecordIds.value.filter((id) => id !== recordId)
    const nextSelectedRecordMap = { ...selectedRecordMap.value }
    delete nextSelectedRecordMap[recordId]
    selectedRecordMap.value = nextSelectedRecordMap
    return
  }

  const matchedRecord = selectableRecords.value.find((record) => record.dentalid === recordId)
  if (!matchedRecord) return

  selectedRecordIds.value = [...selectedRecordIds.value, recordId]
  selectedRecordMap.value = {
    ...selectedRecordMap.value,
    [recordId]: matchedRecord,
  }
}

function toggleSelectAllRecords() {
  if (allSelected.value) {
    const visibleRecordIds = new Set(selectableRecords.value.map((record) => record.dentalid))
    selectedRecordIds.value = selectedRecordIds.value.filter(
      (recordId) => !visibleRecordIds.has(recordId),
    )
    const nextSelectedRecordMap = { ...selectedRecordMap.value }
    for (const recordId of visibleRecordIds) {
      delete nextSelectedRecordMap[recordId]
    }
    selectedRecordMap.value = nextSelectedRecordMap
    return
  }

  const nextSelectedRecordMap = { ...selectedRecordMap.value }
  for (const record of selectableRecords.value) {
    nextSelectedRecordMap[record.dentalid] = record
  }

  selectedRecordMap.value = nextSelectedRecordMap
  selectedRecordIds.value = Array.from(
    new Set([...selectedRecordIds.value, ...selectableRecords.value.map((record) => record.dentalid)]),
  )
}

function openBulkPaidDialog() {
  if (!selectedRecords.value.length || updatingPaymentId.value) return

  bulkPaidTarget.value = {
    paidAt: currentManilaDateInputValue(),
  }
}

function closeBulkPaidDialog() {
  if (updatingPaymentId.value) return
  bulkPaidTarget.value = null
}

async function confirmBulkPaid() {
  if (!bulkPaidTarget.value || !selectedRecords.value.length) return

  const updated = await updateDoctorPaymentStatusBulk(selectedRecords.value, bulkPaidTarget.value.paidAt)

  if (updated) {
    selectedRecordIds.value = []
    selectedRecordMap.value = {}
    bulkPaidTarget.value = null
  }
}

watch(
  [dentists, selectedDentistId],
  ([availableDentists, selectedId]) => {
    const options = availableDentists.map((dentist) => ({
      value: dentist.dentistidno,
      label: formatLegacyDentistName(dentist),
      description: [dentist.dentistcode, dentist.prcno, dentist.specialization]
        .filter(Boolean)
        .join(' | '),
    }))
    const normalizedSelectedId = selectedId == null ? null : Number(selectedId)
    const matchedDentist = options.find((option) => option.value === normalizedSelectedId)

    if (matchedDentist) {
      retainedDentist.value = matchedDentist
    } else if (normalizedSelectedId == null) {
      retainedDentist.value = null
    } else if (retainedDentist.value?.value !== normalizedSelectedId) {
      retainedDentist.value = {
        value: normalizedSelectedId,
        label: selectedDentistLabel.value || 'Selected dentist',
        description: 'Currently selected dentist',
      }
    }

    if (
      normalizedSelectedId != null &&
      !options.some((option) => option.value === normalizedSelectedId) &&
      retainedDentist.value
    ) {
      options.unshift(retainedDentist.value)
    }

    dentistOptions.value = options
  },
  { immediate: true },
)

watch(dentistSearch, (search) => {
  window.clearTimeout(dentistSearchTimer)

  dentistSearchTimer = window.setTimeout(() => {
    dentistFilters.dentistName = search.trim()
    void fetchDentists()
  }, 350)
})

watch(billingLookupRecords, (records) => {
  if (!records.length) return

  const selectableIds = new Set(selectableRecords.value.map((record) => record.dentalid))
  const nextSelectedRecordMap = { ...selectedRecordMap.value }
  selectedRecordIds.value = selectedRecordIds.value.filter((recordId) => selectableIds.has(recordId))

  for (const record of records) {
    if (selectedRecordIds.value.includes(record.dentalid)) {
      nextSelectedRecordMap[record.dentalid] = record
    }
  }
  selectedRecordMap.value = nextSelectedRecordMap
})
</script>

<template>
  <AppDialog
    title="Mark Selected as Paid"
    :show="Boolean(bulkPaidTarget)"
    :disabled="Boolean(updatingPaymentId) || Boolean(!bulkPaidTarget?.paidAt)"
    :confirm-label="updatingPaymentId ? 'Saving...' : 'Mark Selected Paid'"
    @close="closeBulkPaidDialog"
    @confirm="confirmBulkPaid"
  >
    <template #dialog-content>
      <div v-if="bulkPaidTarget" class="space-y-4">
        <div
          class="rounded-[1.5rem] border border-emerald/15 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald">
            Bulk payment
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Mark the selected availment rows as paid to the dentist using one paid date.
          </p>
        </div>

        <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Selected Patients</p>
          <p class="mt-2 text-sm font-bold text-onyx">{{ selectedRecords.length }}</p>
          <div class="mt-3 space-y-2">
            <p
              v-for="record in selectedRecords"
              :key="`selected-paid-${record.dentalid}`"
              class="text-sm text-slate"
            >
              <span class="font-semibold text-onyx">{{ record.membername || 'N/A' }}</span>
              <span class="mx-1">·</span>
              <span class="font-mono">{{ record.approvalno || 'N/A' }}</span>
            </p>
          </div>
        </div>

        <AppInput v-model="bulkPaidTarget.paidAt" label="Paid Date" type="date" />
        <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Selected Date</p>
          <p class="mt-2 text-sm font-bold text-onyx">
            {{ formatLongDate(bulkPaidTarget.paidAt) }}
          </p>
        </div>
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#ecfdf5_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:p-7">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald"
          >
            <Icon icon="feather:dollar-sign" class="h-4 w-4" />
            Payment Workspace
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">Payment Marking</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Search dental availments, select unpaid rows, and mark dentist payments as paid in bulk.
          </p>
        </div>
        <div class="flex flex-wrap gap-3 lg:justify-end">
          <RouterLink to="/bill-marking">
            <AppButton btn-theme="outline" class="normal-case">
              <Icon icon="feather:file-plus" class="h-4 w-4" />
              Bill Marking
            </AppButton>
          </RouterLink>
          <RouterLink to="/dental-availment-history">
            <AppButton btn-theme="outline" class="normal-case">
              <Icon icon="feather:clock" class="h-4 w-4" />
              Availment History
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald">
            Payment finder
          </p>
          <h2 class="mt-2 text-xl font-black text-onyx">Find availments to mark as paid</h2>
          <p class="mt-1 max-w-2xl text-sm leading-6 text-slate">
            Select a dentist or search by approval number or member name, then select unpaid rows for
            bulk payment marking.
          </p>
        </div>
        <div
          v-if="lookupSubmitted && !loadingBillingLookup"
          class="rounded-xl border border-sapphire/15 bg-sapphire-light px-4 py-3 text-sm font-semibold text-sapphire"
        >
          {{ lookupCountLabel }}
        </div>
      </div>

      <div class="mt-5 space-y-4">
        <div class="grid gap-4 xl:grid-cols-3">
          <AppSearchSelect
            v-model="selectedDentistId"
            v-model:search="dentistSearch"
            :options="dentistOptions"
            :loading="loadingDentists"
            label="Dentist"
            placeholder="Search dentist"
            empty-text="No matching dentists found."
          />
          <AppInput
            v-model="lookupApprovalNo"
            label="Approval No."
            placeholder="Search approval no."
            icon="feather:hash"
          />
          <AppInput
            v-model="lookupMemberName"
            label="Member Name"
            placeholder="Search member name"
            icon="feather:user"
          />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <AppButton
            btn-theme="primary"
            class="normal-case"
            :disabled="
              loadingBillingLookup ||
              (!selectedDentistLabel.trim() && !lookupApprovalNo.trim() && !lookupMemberName.trim())
            "
            @click="runLookup"
          >
            <Icon
              :icon="loadingBillingLookup ? 'feather:loader' : 'feather:search'"
              class="h-4 w-4"
              :class="{ 'animate-spin': loadingBillingLookup }"
            />
            Search
          </AppButton>
          <AppButton btn-theme="outline" class="normal-case" @click="clearFinder">
            <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
            Clear
          </AppButton>
        </div>
      </div>

      <div
        v-if="billingLookupRecords.length || selectedRecords.length"
        class="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald/20 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_100%)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <label class="inline-flex items-center gap-3 text-sm font-semibold text-onyx">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-pebble text-emerald focus:ring-emerald"
            :checked="allSelected"
            :disabled="!selectableRecords.length"
            @change="toggleSelectAllRecords"
          />
          Select all unpaid rows
        </label>
        <div class="flex flex-wrap items-center gap-3">
          <p class="text-sm text-slate">
            {{ selectedRecords.length }} patient{{ selectedRecords.length === 1 ? '' : 's' }} selected
          </p>
          <AppButton
            btn-theme="primary"
            class="normal-case"
            :disabled="!selectedRecords.length || Boolean(updatingPaymentId)"
            @click="openBulkPaidDialog"
          >
            <Icon icon="feather:dollar-sign" class="h-4 w-4" />
            Mark Selected as Paid
          </AppButton>
        </div>
      </div>

      <p
        v-if="billingLookupErrorMessage"
        class="mt-4 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby"
      >
        {{ billingLookupErrorMessage }}
      </p>

      <AppLoadingScreen
        v-else-if="loadingBillingLookup"
        class="mt-4"
        title="Loading payment matches"
        message="Please wait while we retrieve the matching availment rows."
      />

      <div
        v-else-if="lookupSubmitted && !billingLookupRecords.length"
        class="mt-4 rounded-xl border border-dashed border-pebble bg-white px-4 py-5 text-sm text-slate"
      >
        No matching availments found for that search. Any previously selected patients are still kept above.
      </div>

      <div
        v-else-if="billingLookupRecords.length"
        class="mt-4 overflow-hidden rounded-2xl border border-pebble"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-pebble">
            <thead class="bg-cloud">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Select
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Approval
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Patient
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Dentist / Clinic
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Procedure
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Amount
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Billing
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-pebble bg-white">
              <tr v-for="record in billingLookupRecords" :key="`payment-${record.dentalid}`">
                <td class="px-4 py-3">
                  <input
                    v-if="!isDoctorCancelled(record) && !isDoctorPaid(record)"
                    type="checkbox"
                    class="h-4 w-4 rounded border-pebble text-emerald focus:ring-emerald"
                    :checked="selectedRecordIds.includes(record.dentalid)"
                    @change="toggleRecordSelection(record.dentalid)"
                  />
                  <span
                    v-else
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="paymentRecordStatus(record).className"
                  >
                    {{ paymentRecordStatus(record).label }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="font-mono text-sm font-black text-onyx">{{ record.approvalno }}</span>
                </td>
                <td class="px-4 py-3">
                  <p class="font-semibold text-onyx">{{ record.membername || 'N/A' }}</p>
                  <p class="mt-1 text-xs text-slate">{{ record.clientcode || 'No client code' }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="font-semibold text-onyx">{{ record.dentistname || 'N/A' }}</p>
                  <p class="mt-1 text-xs text-slate">{{ record.clinicname || 'N/A' }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="font-semibold text-onyx">{{ procedureName(record.procedures) }}</p>
                  <p class="mt-1 text-xs text-slate">Tooth {{ record.toothno || 'N/A' }}</p>
                </td>
                <td class="px-4 py-3 text-sm font-black text-onyx">{{ formatMoney(record.amount) }}</td>
                <td class="px-4 py-3">
                  <p class="text-sm font-semibold text-onyx">{{ formatDate(record.billingReceivedAt) }}</p>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="paymentRecordStatus(record).className"
                  >
                    {{ paymentRecordStatus(record).label }}
                  </span>
                  <p class="mt-1 text-xs text-slate">{{ formatDateTime(record.paidAt) }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>
