<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { AppButton, AppDialog, AppInput, AppLoadingScreen, AppSearchSelect } from '@/components/app'
import { useDentalAvailmentHistory, useDentists, useProcedures } from '@/composables'
import type { DentalAvailmentRecord } from '@/types'
import { addWorkingDays, currentManilaDateInputValue, differenceInWorkingDays, formatDate } from '@/utils'

const dentistBillTarget = ref<{
  record: DentalAvailmentRecord
  billingReceivedAt: string
} | null>(null)
const bulkBillingTarget = ref<{
  billingReceivedAt: string
} | null>(null)
const selectedBillingDentistId = ref<string | number | null>(null)
const billingDentistSearch = ref('')
const billingLookupApprovalNo = ref('')
const billingLookupMemberName = ref('')
const billingLookupSubmitted = ref(false)
const selectedBillingRecordIds = ref<number[]>([])
const selectedBillingRecordMap = ref<Record<number, DentalAvailmentRecord>>({})
const billingDentistOptions = ref<Array<{ value: number; label: string; description: string }>>([])
const retainedBillingDentist = ref<{
  value: number
  label: string
  description: string
} | null>(null)
let billingDentistSearchTimer: number | undefined

const {
  fetchBillingLookup,
  clearBillingLookup,
  billingLookupErrorMessage,
  billingLookupRecords,
  loadingBillingLookup,
  updateDoctorBillingReceivedAt,
  updateDoctorBillingReceivedAtBulk,
  updatingPaymentId,
} = useDentalAvailmentHistory()
const {
  dentists: billingDentists,
  fetchDentists: fetchBillingDentists,
  filters: billingDentistFilters,
  loading: loadingBillingDentists,
} = useDentists({ perPage: 20 })
const { procedures } = useProcedures()

const selectedBillingDentistLabel = computed(() => {
  const matchedDentist = billingDentists.value.find(
    (dentist) => String(dentist.dentistidno) === String(selectedBillingDentistId.value),
  )

  if (matchedDentist) return formatLegacyDentistName(matchedDentist)
  return retainedBillingDentist.value?.label || ''
})
const billingLookupCountLabel = computed(
  () =>
    `${billingLookupRecords.value.length} matching availment${
      billingLookupRecords.value.length === 1 ? '' : 's'
    }`,
)
const selectableBillingLookupRecords = computed(() =>
  billingLookupRecords.value.filter((record) => !isDoctorCancelled(record)),
)
const selectedBillingRecords = computed(() =>
  selectedBillingRecordIds.value
    .map((recordId) => selectedBillingRecordMap.value[recordId])
    .filter((record): record is DentalAvailmentRecord => Boolean(record)),
)
const allBillingLookupSelected = computed(
  () =>
    selectableBillingLookupRecords.value.length > 0 &&
    selectableBillingLookupRecords.value.every((record) =>
      selectedBillingRecordIds.value.includes(record.dentalid),
    ),
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

function billingRecordStatus(record: DentalAvailmentRecord) {
  const normalizedStatus = String(record.status || 'VALID')
    .trim()
    .toUpperCase()

  if (['CANCELLED', 'CANCELED'].includes(normalizedStatus)) {
    return {
      label: 'Cancelled',
      className: 'bg-ruby-light text-ruby',
    }
  }

  if (['INVALID', 'I'].includes(normalizedStatus)) {
    return {
      label: 'Invalid',
      className: 'bg-amber-light text-amber',
    }
  }

  if (record.billingReceivedAt) {
    return {
      label: 'Billed',
      className: 'bg-sapphire-light text-sapphire',
    }
  }

  return {
    label: 'Ready for billing',
    className: 'bg-emerald-light text-emerald',
  }
}

function normalizeDateInput(value?: string | null) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function dentistBillingDueDate(value?: string | null) {
  return addWorkingDays(value, 10)
}

function dentistBillingDaysRemaining(value?: string | null) {
  const dueDate = dentistBillingDueDate(value)
  if (!dueDate) return null

  return differenceInWorkingDays(new Date(), dueDate)
}

function dentistBillingCountdown(record?: DentalAvailmentRecord | null) {
  if (!record?.billingReceivedAt) {
    return {
      label: 'No billing date',
      className: 'bg-fog text-slate',
    }
  }

  if (isDoctorPaid(record)) {
    return {
      label: 'Paid',
      className: 'bg-emerald-light text-emerald',
    }
  }

  const remaining = dentistBillingDaysRemaining(record.billingReceivedAt)
  if (remaining === null) {
    return {
      label: 'No due date',
      className: 'bg-fog text-slate',
    }
  }

  if (remaining < 0) {
    return {
      label: `Overdue by ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? '' : 's'}`,
      className: 'bg-ruby-light text-ruby',
    }
  }

  if (remaining <= 3) {
    return {
      label: `${remaining} day${remaining === 1 ? '' : 's'} left`,
      className: 'bg-ruby-light text-ruby',
    }
  }

  return {
    label: `${remaining} days left`,
    className: 'bg-amber-light text-amber',
  }
}

function openDentistBillDialog(record: DentalAvailmentRecord) {
  if (updatingPaymentId.value || isDoctorCancelled(record)) return
  dentistBillTarget.value = {
    record,
    billingReceivedAt: normalizeDateInput(record.billingReceivedAt),
  }
}

function closeDentistBillDialog() {
  if (updatingPaymentId.value) return
  dentistBillTarget.value = null
}

async function confirmDentistBill() {
  if (!dentistBillTarget.value) return

  const updated = await updateDoctorBillingReceivedAt(
    dentistBillTarget.value.record,
    dentistBillTarget.value.billingReceivedAt,
  )
  if (updated) dentistBillTarget.value = null
}

function openBulkBillingDialog() {
  if (!selectedBillingRecords.value.length || updatingPaymentId.value) return

  const selectedRecord = selectedBillingRecords.value[0]
  const existingDate =
    selectedBillingRecords.value.length === 1 && selectedRecord
      ? normalizeDateInput(selectedRecord.billingReceivedAt)
      : ''

  bulkBillingTarget.value = {
    billingReceivedAt: existingDate || currentManilaDateInputValue(),
  }
}

function closeBulkBillingDialog() {
  if (updatingPaymentId.value) return
  bulkBillingTarget.value = null
}

async function confirmBulkBilling() {
  if (!bulkBillingTarget.value || !selectedBillingRecords.value.length) return

  const updated = await updateDoctorBillingReceivedAtBulk(
    selectedBillingRecords.value,
    bulkBillingTarget.value.billingReceivedAt,
  )

  if (updated) {
    selectedBillingRecordIds.value = []
    selectedBillingRecordMap.value = {}
    bulkBillingTarget.value = null
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

function clearBillingFinder() {
  selectedBillingDentistId.value = null
  billingDentistSearch.value = ''
  billingDentistFilters.dentistName = ''
  billingLookupApprovalNo.value = ''
  billingLookupMemberName.value = ''
  billingLookupSubmitted.value = false
  selectedBillingRecordIds.value = []
  selectedBillingRecordMap.value = {}
  retainedBillingDentist.value = null
  clearBillingLookup()
  void fetchBillingDentists()
}

async function runBillingLookup() {
  const approvalNo = billingLookupApprovalNo.value.trim()
  const memberName = billingLookupMemberName.value.trim()
  const dentistName = selectedBillingDentistLabel.value.trim()

  if (!approvalNo && !dentistName && !memberName) {
    billingLookupSubmitted.value = false
    clearBillingLookup()
    return
  }

  billingLookupSubmitted.value = true
  await fetchBillingLookup({ approvalNo, dentistName, memberName })
}

function toggleBillingRecordSelection(recordId: number) {
  if (selectedBillingRecordIds.value.includes(recordId)) {
    selectedBillingRecordIds.value = selectedBillingRecordIds.value.filter((id) => id !== recordId)
    const nextSelectedRecordMap = { ...selectedBillingRecordMap.value }
    delete nextSelectedRecordMap[recordId]
    selectedBillingRecordMap.value = nextSelectedRecordMap
    return
  }

  const matchedRecord = billingLookupRecords.value.find((record) => record.dentalid === recordId)
  if (!matchedRecord) return

  selectedBillingRecordIds.value = [...selectedBillingRecordIds.value, recordId]
  selectedBillingRecordMap.value = {
    ...selectedBillingRecordMap.value,
    [recordId]: matchedRecord,
  }
}

function toggleSelectAllBillingLookupRecords() {
  if (allBillingLookupSelected.value) {
    const visibleRecordIds = new Set(selectableBillingLookupRecords.value.map((record) => record.dentalid))
    selectedBillingRecordIds.value = selectedBillingRecordIds.value.filter(
      (recordId) => !visibleRecordIds.has(recordId),
    )
    const nextSelectedRecordMap = { ...selectedBillingRecordMap.value }
    for (const recordId of visibleRecordIds) {
      delete nextSelectedRecordMap[recordId]
    }
    selectedBillingRecordMap.value = nextSelectedRecordMap
    return
  }

  const nextSelectedRecordMap = { ...selectedBillingRecordMap.value }
  for (const record of selectableBillingLookupRecords.value) {
    nextSelectedRecordMap[record.dentalid] = record
  }

  selectedBillingRecordMap.value = nextSelectedRecordMap
  selectedBillingRecordIds.value = Array.from(
    new Set([
      ...selectedBillingRecordIds.value,
      ...selectableBillingLookupRecords.value.map((record) => record.dentalid),
    ]),
  )
}

watch(
  [billingDentists, selectedBillingDentistId],
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
      retainedBillingDentist.value = matchedDentist
    } else if (normalizedSelectedId == null) {
      retainedBillingDentist.value = null
    } else if (retainedBillingDentist.value?.value !== normalizedSelectedId) {
      retainedBillingDentist.value = {
        value: normalizedSelectedId,
        label: selectedBillingDentistLabel.value || 'Selected dentist',
        description: 'Currently selected dentist',
      }
    }

    if (
      normalizedSelectedId != null &&
      !options.some((option) => option.value === normalizedSelectedId) &&
      retainedBillingDentist.value
    ) {
      options.unshift(retainedBillingDentist.value)
    }

    billingDentistOptions.value = options
  },
  { immediate: true },
)

watch(billingDentistSearch, (search) => {
  window.clearTimeout(billingDentistSearchTimer)

  billingDentistSearchTimer = window.setTimeout(() => {
    billingDentistFilters.dentistName = search.trim()
    void fetchBillingDentists()
  }, 350)
})

watch(billingLookupRecords, (records) => {
  if (!records.length) return

  const nextSelectedRecordMap = { ...selectedBillingRecordMap.value }
  for (const record of records) {
    if (selectedBillingRecordIds.value.includes(record.dentalid)) {
      nextSelectedRecordMap[record.dentalid] = record
    }
  }
  selectedBillingRecordMap.value = nextSelectedRecordMap
})
</script>

<template>
  <AppDialog
    title="Receive Dentist Bill"
    :show="Boolean(dentistBillTarget)"
    :disabled="Boolean(updatingPaymentId)"
    :confirm-label="updatingPaymentId ? 'Saving...' : 'Save Billing Date'"
    @close="closeDentistBillDialog"
    @confirm="confirmDentistBill"
  >
    <template #dialog-content>
      <div v-if="dentistBillTarget" class="space-y-4">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Dentist bill
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Record when the dentist or clinic bill was received. This starts the 10 working-day due
            countdown before payment.
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Approval</p>
            <p class="mt-2 font-mono text-sm font-bold text-onyx">
              {{ dentistBillTarget.record.approvalno || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Procedure</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ procedureName(dentistBillTarget.record.procedures) }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4 sm:col-span-2">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Dentist / Clinic</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ dentistBillTarget.record.dentistname || 'N/A' }} ·
              {{ dentistBillTarget.record.clinicname || 'N/A' }}
            </p>
          </div>
        </div>
        <AppInput
          v-model="dentistBillTarget.billingReceivedAt"
          label="Billing Received Date"
          type="date"
        />
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Due Date</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ formatDate(dentistBillingDueDate(dentistBillTarget.billingReceivedAt)) }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Working-Day Status</p>
            <p
              class="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              :class="
                dentistBillingCountdown({
                  ...dentistBillTarget.record,
                  billingReceivedAt: dentistBillTarget.billingReceivedAt,
                }).className
              "
            >
              {{
                dentistBillingCountdown({
                  ...dentistBillTarget.record,
                  billingReceivedAt: dentistBillTarget.billingReceivedAt,
                }).label
              }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    title="Mark Selected Bills"
    :show="Boolean(bulkBillingTarget)"
    :disabled="Boolean(updatingPaymentId) || Boolean(!bulkBillingTarget?.billingReceivedAt)"
    :confirm-label="updatingPaymentId ? 'Saving...' : 'Save Billing Date'"
    @close="closeBulkBillingDialog"
    @confirm="confirmBulkBilling"
  >
    <template #dialog-content>
      <div v-if="bulkBillingTarget" class="space-y-4">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Bulk billing
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Apply one billing received date to the selected availment rows.
          </p>
        </div>

        <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Selected Patients</p>
          <p class="mt-2 text-sm font-bold text-onyx">{{ selectedBillingRecords.length }}</p>
          <div class="mt-3 space-y-2">
            <p
              v-for="record in selectedBillingRecords"
              :key="`selected-bill-${record.dentalid}`"
              class="text-sm text-slate"
            >
              <span class="font-semibold text-onyx">{{ record.membername || 'N/A' }}</span>
              <span class="mx-1">·</span>
              <span class="font-mono">{{ record.approvalno || 'N/A' }}</span>
            </p>
          </div>
        </div>

        <AppInput
          v-model="bulkBillingTarget.billingReceivedAt"
          label="Billing Received Date"
          type="date"
        />
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:p-7">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="feather:file-plus" class="h-4 w-4" />
            Billing Workspace
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">Bill Marking</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Search dental availments by dentist or approval number, select the matching patients,
            and record billing dates from one focused workflow.
          </p>
        </div>
        <div class="flex flex-wrap gap-3 lg:justify-end">
          <RouterLink to="/dental-availment-history">
            <AppButton btn-theme="outline" class="normal-case">
              <Icon icon="feather:clock" class="h-4 w-4" />
              Availment History
            </AppButton>
          </RouterLink>
          <RouterLink to="/dental-availments">
            <AppButton btn-theme="outline" class="normal-case">
              <Icon icon="feather:plus" class="h-4 w-4" />
              New Availment
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Billing finder
          </p>
          <h2 class="mt-2 text-xl font-black text-onyx">Find availments to mark as billed</h2>
          <p class="mt-1 max-w-2xl text-sm leading-6 text-slate">
            Select a dentist or search by approval number to load matching patients, then update
            billing one row at a time or in bulk.
          </p>
        </div>
        <div
          v-if="billingLookupSubmitted && !loadingBillingLookup"
          class="rounded-xl border border-sapphire/15 bg-sapphire-light px-4 py-3 text-sm font-semibold text-sapphire"
        >
          {{ billingLookupCountLabel }}
        </div>
      </div>

      <div class="mt-5 space-y-4">
        <div class="grid gap-4 xl:grid-cols-3">
        <AppSearchSelect
          v-model="selectedBillingDentistId"
          v-model:search="billingDentistSearch"
          :options="billingDentistOptions"
          :loading="loadingBillingDentists"
          label="Dentist"
          placeholder="Search dentist"
          empty-text="No matching dentists found."
        />
        <AppInput
          v-model="billingLookupApprovalNo"
          label="Approval No."
          placeholder="Search approval no."
          icon="feather:hash"
        />
        <AppInput
          v-model="billingLookupMemberName"
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
              (!selectedBillingDentistLabel.trim() &&
                !billingLookupApprovalNo.trim() &&
                !billingLookupMemberName.trim())
            "
            @click="runBillingLookup"
          >
            <Icon
              :icon="loadingBillingLookup ? 'feather:loader' : 'feather:search'"
              class="h-4 w-4"
              :class="{ 'animate-spin': loadingBillingLookup }"
            />
            Search
          </AppButton>
          <AppButton
            btn-theme="outline"
            class="normal-case"
            @click="clearBillingFinder"
          >
            <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
            Clear
          </AppButton>
        </div>
      </div>

      <div
        v-if="billingLookupRecords.length || selectedBillingRecords.length"
        class="mt-4 flex flex-col gap-3 rounded-2xl border border-[#d8c5a0] bg-[linear-gradient(180deg,#fff7eb_0%,#ffffff_100%)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <label class="inline-flex items-center gap-3 text-sm font-semibold text-onyx">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-pebble text-tangerine focus:ring-tangerine"
            :checked="allBillingLookupSelected"
            :disabled="!selectableBillingLookupRecords.length"
            @change="toggleSelectAllBillingLookupRecords"
          />
          Select all available rows
        </label>
        <div class="flex flex-wrap items-center gap-3">
          <p class="text-sm text-slate">
            {{ selectedBillingRecords.length }} patient{{ selectedBillingRecords.length === 1 ? '' : 's' }} selected
          </p>
          <AppButton
            btn-theme="primary"
            class="normal-case"
            :disabled="!selectedBillingRecords.length || Boolean(updatingPaymentId)"
            @click="openBulkBillingDialog"
          >
            <Icon icon="feather:check-square" class="h-4 w-4" />
            Mark Selected as Billed
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
        title="Loading billing matches"
        message="Please wait while we retrieve the matching availment rows."
      />

      <div
        v-else-if="billingLookupSubmitted && !billingLookupRecords.length"
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
                  Availment Date
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Status
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Billing
                </th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-pebble bg-white">
              <tr v-for="record in billingLookupRecords" :key="`billing-${record.dentalid}`">
                <td class="px-4 py-3">
                  <input
                    v-if="!isDoctorCancelled(record)"
                    type="checkbox"
                    class="h-4 w-4 rounded border-pebble text-tangerine focus:ring-tangerine"
                    :checked="selectedBillingRecordIds.includes(record.dentalid)"
                    @change="toggleBillingRecordSelection(record.dentalid)"
                  />
                  <span
                    v-else
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="billingRecordStatus(record).className"
                  >
                    {{ billingRecordStatus(record).label }}
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
                <td class="px-4 py-3 text-sm text-onyx">{{ formatDate(record.availdate) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="billingRecordStatus(record).className"
                  >
                    {{ billingRecordStatus(record).label }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <p class="text-sm font-semibold text-onyx">{{ formatDate(record.billingReceivedAt) }}</p>
                  <p class="mt-1 text-xs text-slate">
                    {{ dentistBillingCountdown(record).label }}
                  </p>
                </td>
                <td class="px-4 py-3">
                  <div v-if="!isDoctorCancelled(record)" class="flex justify-end">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-3.5 py-2 text-xs font-semibold text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="updatingPaymentId === record.dentalid"
                      @click="openDentistBillDialog(record)"
                    >
                      <Icon
                        :icon="
                          updatingPaymentId === record.dentalid ? 'feather:loader' : 'feather:file-plus'
                        "
                        class="h-4 w-4"
                        :class="{ 'animate-spin': updatingPaymentId === record.dentalid }"
                      />
                      {{ record.billingReceivedAt ? 'Update Bill' : 'Receive Bill' }}
                    </button>
                  </div>
                  <span v-else class="block text-right text-sm text-slate">
                    {{ billingRecordStatus(record).label }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>
