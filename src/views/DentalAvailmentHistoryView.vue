<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, reactive, ref, watch } from 'vue'
import {
  AppButton,
  AppDialog,
  AppInput,
  AppLoadingScreen,
  AppSearchSelect,
  AppTable,
  AppTextArea,
} from '@/components/app'
import { useClinics, useDentalAvailmentHistory, useDentists, useProcedures } from '@/composables'
import type { DentalAvailmentRecord } from '@/types'
import { addWorkingDays, differenceInWorkingDays, formatDate, formatDateTime, formatMoney } from '@/utils'

const {
  cancelAvailment,
  cancellingId,
  clearFilters,
  currentPage,
  errorMessage,
  filters,
  applyFilters,
  loading,
  records,
  stats,
  successMessage,
  totalEntries,
  totalPages,
  paidRows,
  updateAvailment,
  updateDoctorBillingReceivedAt,
  updateDoctorPaymentStatus,
  uncancelAvailment,
  uncancellingId,
  updatingId,
  updatingPaymentId,
} = useDentalAvailmentHistory()
const { procedures, loadingProcedures } = useProcedures()
const {
  dentists,
  fetchDentists,
  filters: dentistFilters,
  loading: loadingDentists,
} = useDentists({ perPage: 20 })
const { clinics, fetchClinics, filters: clinicFilters, loading: loadingClinics } = useClinics()

const showFilterDialog = ref(false)
const cancelTarget = ref<DentalAvailmentRecord | null>(null)
const uncancelTarget = ref<DentalAvailmentRecord | null>(null)
const editTarget = ref<DentalAvailmentRecord | null>(null)
const billTarget = ref<{
  record: DentalAvailmentRecord
  billingReceivedAt: string
} | null>(null)
const paymentTarget = ref<{
  record: DentalAvailmentRecord
  paid: boolean
  paidAt: string
} | null>(null)
const selectedProcedureId = ref<string | number | null>(null)
const procedureSearch = ref('')
const selectedDentistId = ref<string | number | null>(null)
const dentistSearch = ref('')
const dentistOptions = ref<Array<{ value: number; label: string; description: string }>>([])
const retainedDentist = ref<{ value: number; label: string; description: string } | null>(null)
const retainedDentistRecord = ref<Record<string, unknown> | null>(null)
const selectedClinicId = ref<string | number | null>(null)
const clinicSearch = ref('')
const retainedClinicRecord = ref<Record<string, unknown> | null>(null)
const editForm = reactive({
  availDate: '',
  procedures: '',
  amount: '',
  toothNo: '',
  dentistId: '',
  dentistName: '',
  clinicId: '',
  clinicName: '',
  treatment: '',
  remarks: '',
})

const legacyRateAliases: Record<string, string> = {
  TWLB: 'TWLB',
  OP: 'OP',
  STE: 'STE',
  TF: 'TF',
  AD: 'AD',
  RJ: 'RJ',
  LC: 'LC',
  PF: 'PF',
  CON: 'CON',
  CONS: 'CON',
  CONSULT: 'CON',
  CONSULTATION: 'CON',
  PPEICF: 'PPE_ICF',
  CAN: 'CAN',
}

const activeFilterCount = computed(
  () => Object.values(filters).filter((value) => String(value).trim()).length,
)
const activeProcedureOptions = computed(() =>
  procedures.value
    .filter((procedure) => procedure.active)
    .map((procedure) => ({
      value: procedure.id,
      label: procedure.name,
      description: [procedure.code, procedure.price ? `PHP ${procedure.price}` : 'No default price']
        .filter(Boolean)
        .join(' | '),
    })),
)
const procedureNameMap = computed(
  () => new Map(procedures.value.map((procedure) => [procedure.code.trim().toUpperCase(), procedure.name])),
)
const clinicOptions = computed(() =>
  clinics.value.map((clinic) => ({
    value: clinic.clinicidno,
    label: clinic.clinicname,
    description: [clinic.cliniccode, clinic.city, clinic.province].filter(Boolean).join(' | '),
  })),
)
const editReady = computed(
  () =>
    editForm.availDate &&
    editForm.procedures.trim() &&
    editForm.amount !== '' &&
    editForm.dentistName.trim() &&
    editForm.clinicName.trim(),
)
const toothNumberOptions = ['ALL', ...Array.from({ length: 32 }, (_, index) => String(index + 1))]
let dentistSearchTimer: number | undefined
let clinicSearchTimer: number | undefined

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

function normalizeLegacyRateKey(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return legacyRateAliases[normalized] || null
}

function toLegacyRateNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function readLegacyRateValue(source: Record<string, unknown> | undefined, rateKey: string) {
  if (!source) return null

  const candidates = [
    rateKey,
    rateKey.toLowerCase(),
    rateKey.toUpperCase(),
    rateKey === 'PPE_ICF' ? 'ppe_icf' : null,
    rateKey === 'CAN' ? 'can' : null,
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const parsed = toLegacyRateNumber(source[candidate])
    if (parsed !== null) return parsed
  }

  return null
}

function resolveLegacyProcedureAmount() {
  const rateKey = normalizeLegacyRateKey(editForm.procedures.trim())
  if (!rateKey) return false

  const selectedDentist =
    (dentists.value.find(
      (dentist) => String(dentist.dentistidno) === String(selectedDentistId.value),
    ) as Record<string, unknown> | undefined) || retainedDentistRecord.value || undefined
  const selectedClinic =
    (clinics.value.find(
      (clinic) => String(clinic.clinicidno) === String(selectedClinicId.value),
    ) as Record<string, unknown> | undefined) || retainedClinicRecord.value || undefined

  const dentistAmount = readLegacyRateValue(selectedDentist, rateKey)
  const clinicAmount = ['TWLB', 'OP', 'STE', 'TF', 'AD', 'RJ', 'LC', 'PF', 'CON'].includes(rateKey)
    ? readLegacyRateValue(selectedClinic, rateKey)
    : null
  const resolvedAmount = dentistAmount ?? clinicAmount

  if (resolvedAmount === null) return false

  editForm.amount = String(resolvedAmount)
  return true
}

function confirmFilters() {
  showFilterDialog.value = false
  applyFilters()
}

function openCancelDialog(record: DentalAvailmentRecord) {
  cancelTarget.value = record
}

function closeCancelDialog() {
  if (cancellingId.value) return
  cancelTarget.value = null
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  const cancelled = await cancelAvailment(cancelTarget.value)
  if (cancelled) cancelTarget.value = null
}

function openUncancelDialog(record: DentalAvailmentRecord) {
  uncancelTarget.value = record
}

function closeUncancelDialog() {
  if (uncancellingId.value) return
  uncancelTarget.value = null
}

async function confirmUncancel() {
  if (!uncancelTarget.value) return
  const restored = await uncancelAvailment(uncancelTarget.value)
  if (restored) uncancelTarget.value = null
}

function isDoctorPaid(record?: DentalAvailmentRecord | null) {
  if (!record) return false
  const value = record.IfPaid ?? record.ifPaid ?? record.ifpaid
  return value === true || Number(value || 0) === 1
}

function isValidAvailment(record?: DentalAvailmentRecord | null) {
  if (!record) return false
  return String(record.status || 'VALID').toUpperCase() === 'VALID'
}

function billingDueDate(value?: string | null) {
  return addWorkingDays(value, 10)
}

function billingDaysRemaining(value?: string | null) {
  const dueDate = billingDueDate(value)
  if (!dueDate) return null

  return differenceInWorkingDays(new Date(), dueDate)
}

function billingCountdown(record?: DentalAvailmentRecord | null) {
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

  const remaining = billingDaysRemaining(record.billingReceivedAt)
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

function currentDateInputValue() {
  return '2026-08-26'
}

function openBillDialog(record: DentalAvailmentRecord) {
  if (updatingPaymentId.value) return
  billTarget.value = {
    record,
    billingReceivedAt: normalizeDateInput(record.billingReceivedAt),
  }
}

function closeBillDialog() {
  if (updatingPaymentId.value) return
  billTarget.value = null
}

async function confirmBillStatus() {
  if (!billTarget.value) return

  const updated = await updateDoctorBillingReceivedAt(
    billTarget.value.record,
    billTarget.value.billingReceivedAt,
  )
  if (updated) billTarget.value = null
}

function openPaymentDialog(record: DentalAvailmentRecord, paid: boolean) {
  if (updatingPaymentId.value || !record.billingReceivedAt) return
  paymentTarget.value = {
    record,
    paid,
    paidAt: paid ? normalizeDateInput(record.paidAt) || currentDateInputValue() : '',
  }
}

function closePaymentDialog() {
  if (updatingPaymentId.value) return
  paymentTarget.value = null
}

async function confirmPaymentStatus() {
  if (!paymentTarget.value) return

  const updated = await updateDoctorPaymentStatus(
    paymentTarget.value.record,
    paymentTarget.value.paid,
    undefined,
    paymentTarget.value.paidAt,
  )
  if (updated) paymentTarget.value = null
}

function normalizeDateInput(value?: string | null) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function openEditDialog(record: DentalAvailmentRecord) {
  if (!isValidAvailment(record) || updatingId.value) return

  editTarget.value = record
  editForm.availDate = normalizeDateInput(record.availdate)
  editForm.procedures = record.procedures || ''
  editForm.amount = String(record.amount ?? '')
  editForm.toothNo = record.toothno || ''
  editForm.dentistId = record.dentistid ? String(record.dentistid) : ''
  editForm.dentistName = record.dentistname || ''
  editForm.clinicId = record.clinicid ? String(record.clinicid) : ''
  editForm.clinicName = record.clinicname || ''
  editForm.treatment = record.treatment || ''
  editForm.remarks = record.remarks || ''
  selectedProcedureId.value =
    procedures.value.find((procedure) => procedure.code === record.procedures)?.id || null
  selectedDentistId.value = record.dentistid || null
  selectedClinicId.value = record.clinicid || null
  procedureSearch.value = ''
  dentistSearch.value = ''
  clinicSearch.value = ''
}

function handleRowEdit(record: DentalAvailmentRecord) {
  openEditDialog(record)
}

function closeEditDialog() {
  if (updatingId.value) return
  editTarget.value = null
}

async function confirmEdit() {
  if (!editTarget.value || !editReady.value) return

  const updated = await updateAvailment(editTarget.value, {
    availDate: editForm.availDate,
    procedures: editForm.procedures.trim(),
    amount: Number(editForm.amount),
    toothNo: editForm.toothNo.trim() || undefined,
    dentistId: editForm.dentistId ? Number(editForm.dentistId) : undefined,
    dentistName: editForm.dentistName.trim(),
    clinicId: editForm.clinicId ? Number(editForm.clinicId) : undefined,
    clinicName: editForm.clinicName.trim(),
    treatment: editForm.treatment.trim() || undefined,
    remarks: editForm.remarks.trim() || undefined,
  })

  if (updated) editTarget.value = null
}

watch(selectedProcedureId, (value) => {
  const selected = procedures.value.find((procedure) => String(procedure.id) === String(value))
  if (!selected) return

  editForm.procedures = selected.code
  if (!resolveLegacyProcedureAmount() && selected.price !== undefined) {
    editForm.amount = String(selected.price)
  }
})

watch(selectedDentistId, (value) => {
  const selected = dentists.value.find((dentist) => String(dentist.dentistidno) === String(value))
  if (!selected) return

  retainedDentistRecord.value = selected as Record<string, unknown>
  editForm.dentistId = String(selected.dentistidno)
  editForm.dentistName = selected.dentistname
  resolveLegacyProcedureAmount()
})

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
      retainedDentistRecord.value =
        (availableDentists.find((dentist) => dentist.dentistidno === normalizedSelectedId) as
          | Record<string, unknown>
          | undefined) || retainedDentistRecord.value
    } else if (normalizedSelectedId == null) {
      retainedDentist.value = null
      retainedDentistRecord.value = null
    } else if (retainedDentist.value?.value !== normalizedSelectedId) {
      retainedDentist.value = {
        value: normalizedSelectedId,
        label: editForm.dentistName || 'Selected dentist',
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

watch(selectedClinicId, (value) => {
  const selected = clinics.value.find((clinic) => String(clinic.clinicidno) === String(value))
  if (!selected) return

  retainedClinicRecord.value = selected as Record<string, unknown>
  editForm.clinicId = String(selected.clinicidno)
  editForm.clinicName = selected.clinicname
  resolveLegacyProcedureAmount()
})

watch(
  [clinics, selectedClinicId],
  ([availableClinics, selectedId]) => {
    const normalizedSelectedId = selectedId == null ? null : Number(selectedId)

    if (normalizedSelectedId == null) {
      retainedClinicRecord.value = null
      return
    }

    const matchedClinic = availableClinics.find(
      (clinic) => String(clinic.clinicidno) === String(normalizedSelectedId),
    )
    if (matchedClinic) {
      retainedClinicRecord.value = matchedClinic as Record<string, unknown>
    }
  },
  { immediate: true },
)

watch(clinicSearch, (search) => {
  window.clearTimeout(clinicSearchTimer)

  clinicSearchTimer = window.setTimeout(() => {
    clinicFilters.clinicName = search.trim()
    void fetchClinics()
  }, 350)
})




function formatLegacyDentistName(dentist: { dentistname?: string | null; firstname?: string | null; middleinitial?: string | null; lastname?: string | null }) {
  if (dentist.dentistname?.trim()) return dentist.dentistname.trim()

  const firstName = String(dentist.firstname || '').trim()
  const middleInitial = String(dentist.middleinitial || '').trim().replace(/\.+$/, '')
  const lastName = String(dentist.lastname || '').trim()
  const rightSide = [firstName, middleInitial ? `${middleInitial}.` : ''].filter(Boolean).join(' ').trim()

  return [lastName, rightSide].filter(Boolean).join(', ').trim()
}
</script>

<template>
  <AppDialog
    title="Filter Availment History"
    :show="showFilterDialog"
    max-width="sm:max-w-4xl"
    confirm-label="Apply Filters"
    @close="showFilterDialog = false"
    @confirm="confirmFilters"
  >
    <template #dialog-content>
      <div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Search history
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Filter dental availment rows by approval, member, provider, procedure, date, and status.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <AppInput
            v-model="filters.approvalNo"
            label="Approval No."
            placeholder="9-digit approval no."
            icon="feather:key"
          />
          <AppInput
            v-model="filters.memberName"
            label="Member Name"
            placeholder="Search member"
            icon="feather:user"
          />
          <AppInput
            v-model="filters.dentistName"
            label="Dentist Name"
            placeholder="Search dentist"
            icon="feather:user-check"
          />
          <AppInput
            v-model="filters.clinicName"
            label="Clinic Name"
            placeholder="Search clinic"
            icon="feather:briefcase"
          />
          <AppInput
            v-model="filters.procedure"
            label="Procedure Code"
            placeholder="e.g. DC"
            icon="feather:tag"
          />
          <AppInput
            v-model="filters.encodedBy"
            label="Encoded By"
            placeholder="Username"
            icon="feather:edit-3"
          />
          <AppInput v-model="filters.dateFrom" label="Date From" type="date" />
          <AppInput v-model="filters.dateTo" label="Date To" type="date" />
          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-onyx">Status</label>
            <select
              v-model="filters.status"
              class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] px-4 py-3.5 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
            >
              <option value="">All statuses</option>
              <option value="valid">Valid</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-slate transition hover:text-tangerine"
          @click="clearFilters"
        >
          <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
          Clear fields
        </button>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    title="Cancel Availment"
    :show="Boolean(cancelTarget)"
    :disabled="Boolean(cancellingId)"
    :confirm-label="cancellingId ? 'Cancelling...' : 'Confirm Cancel'"
    @close="closeCancelDialog"
    @confirm="confirmCancel"
  >
    <template #dialog-content>
      <div class="space-y-4">
        <div class="rounded-[1.5rem] border border-ruby/15 bg-ruby-light p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-ruby">Cancellation</p>
          <p class="mt-2 text-sm leading-6 text-slate">
            This will mark the selected availment row as invalid using the legacy cancellation
            fields.
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Approval</p>
            <p class="mt-2 font-mono text-sm font-bold text-onyx">
              {{ cancelTarget?.approvalno || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Procedure</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ cancelTarget?.procedures || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4 sm:col-span-2">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Member</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ cancelTarget?.membername || 'N/A' }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    title="Uncancel Availment"
    :show="Boolean(uncancelTarget)"
    :disabled="Boolean(uncancellingId)"
    :confirm-label="uncancellingId ? 'Restoring...' : 'Confirm Uncancel'"
    @close="closeUncancelDialog"
    @confirm="confirmUncancel"
  >
    <template #dialog-content>
      <div class="space-y-4">
        <div class="rounded-[1.5rem] border border-emerald/15 bg-emerald-light p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald">
            Restore availment
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            This will restore the selected availment row by setting the transaction back to active.
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Approval</p>
            <p class="mt-2 font-mono text-sm font-bold text-onyx">
              {{ uncancelTarget?.approvalno || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Procedure</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ uncancelTarget?.procedures || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4 sm:col-span-2">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Member</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ uncancelTarget?.membername || 'N/A' }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    title="Receive Dentist Bill"
    :show="Boolean(billTarget)"
    :disabled="Boolean(updatingPaymentId)"
    :confirm-label="updatingPaymentId ? 'Saving...' : 'Save Billing Date'"
    @close="closeBillDialog"
    @confirm="confirmBillStatus"
  >
    <template #dialog-content>
      <div v-if="billTarget" class="space-y-4">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Dentist bill
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Record when the dentist or clinic bill was received. This starts the 10 working-day
            due countdown before payment.
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Approval</p>
            <p class="mt-2 font-mono text-sm font-bold text-onyx">
              {{ billTarget.record.approvalno || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Procedure</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ billTarget.record.procedures || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4 sm:col-span-2">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Dentist / Clinic</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ billTarget.record.dentistname || 'N/A' }} ·
              {{ billTarget.record.clinicname || 'N/A' }}
            </p>
          </div>
        </div>
        <AppInput
          v-model="billTarget.billingReceivedAt"
          label="Billing Received Date"
          type="date"
        />
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Due Date</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ formatDate(billingDueDate(billTarget.billingReceivedAt)) }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Working-Day Status</p>
            <p
              class="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              :class="
                billingCountdown({
                  ...billTarget.record,
                  billingReceivedAt: billTarget.billingReceivedAt,
                }).className
              "
            >
              {{
                billingCountdown({
                  ...billTarget.record,
                  billingReceivedAt: billTarget.billingReceivedAt,
                }).label
              }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    :title="paymentTarget?.paid ? 'Mark dentist as paid' : 'Mark dentist as unpaid'"
    :show="Boolean(paymentTarget)"
    :disabled="Boolean(updatingPaymentId) || Boolean(paymentTarget?.paid && !paymentTarget.paidAt)"
    :confirm-label="
      updatingPaymentId
        ? 'Saving...'
        : paymentTarget?.paid
          ? 'Mark Dentist Paid'
          : 'Mark Dentist Unpaid'
    "
    @close="closePaymentDialog"
    @confirm="confirmPaymentStatus"
  >
    <template #dialog-content>
      <div v-if="paymentTarget" class="space-y-4">
        <div
          class="rounded-[1.5rem] border border-emerald/15 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald">
            Dentist payment
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            This final step marks the availment as paid after the dentist bill has already been
            received.
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Approval</p>
            <p class="mt-2 font-mono text-sm font-bold text-onyx">
              {{ paymentTarget.record.approvalno || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Billing Received</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ formatDate(paymentTarget.record.billingReceivedAt) }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4 sm:col-span-2">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Dentist / Clinic</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ paymentTarget.record.dentistname || 'N/A' }} ·
              {{ paymentTarget.record.clinicname || 'N/A' }}
            </p>
          </div>
        </div>
        <AppInput
          v-if="paymentTarget.paid"
          v-model="paymentTarget.paidAt"
          label="Paid Date"
          type="date"
        />
        <p v-else class="rounded-xl bg-fog px-4 py-3 text-sm text-slate">
          This will clear the saved paid date for this availment row.
        </p>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    title="Edit Availment"
    :show="Boolean(editTarget)"
    :disabled="Boolean(updatingId) || !editReady"
    :confirm-label="updatingId ? 'Saving...' : 'Save Changes'"
    max-width="sm:max-w-4xl"
    @close="closeEditDialog"
    @confirm="confirmEdit"
  >
    <template #dialog-content>
      <div class="space-y-5">
        <div class="rounded-[1.5rem] border border-sapphire/15 bg-sapphire-light p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-sapphire">
            Valid availment row
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Update the procedure row under approval
            <span class="font-mono font-bold text-onyx">{{ editTarget?.approvalno }}</span
            >.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <AppInput v-model="editForm.availDate" label="Availment Date" type="date" />
          <AppSearchSelect
            v-model="selectedProcedureId"
            v-model:search="procedureSearch"
            :options="activeProcedureOptions"
            :loading="loadingProcedures"
            label="Procedure"
            placeholder="Search procedure"
            empty-text="No active procedures found."
          />
          <AppInput
            v-model="editForm.amount"
            label="Amount"
            type="number"
            placeholder="0.00"
            icon="feather:hash"
          />
          <div>
            <label class="mb-2 block text-sm font-medium text-onyx">Tooth No.</label>
            <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <AppInput
                v-model="editForm.toothNo"
                placeholder="Optional tooth number or ALL"
                icon="feather:hash"
                list="edit-tooth-number-options"
              />
              <AppButton
                type="button"
                btn-theme="outline"
                class="normal-case sm:min-w-24"
                @click="editForm.toothNo = 'ALL'"
              >
                ALL
              </AppButton>
            </div>
            <datalist id="edit-tooth-number-options">
              <option v-for="option in toothNumberOptions" :key="option" :value="option" />
            </datalist>
          </div>
          <AppSearchSelect
            v-model="selectedDentistId"
            v-model:search="dentistSearch"
            :options="dentistOptions"
            :loading="loadingDentists"
            label="Dentist Name"
            placeholder="Search dentist"
            empty-text="No matching dentists found."
          />
          <AppSearchSelect
            v-model="selectedClinicId"
            v-model:search="clinicSearch"
            :options="clinicOptions"
            :loading="loadingClinics"
            label="Clinic Name"
            placeholder="Search clinic"
            empty-text="No matching clinics found."
          />
          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-onyx">Treatment</label>
            <AppTextArea
              v-model="editForm.treatment"
              placeholder="Optional treatment details"
              :rows="3"
            />
          </div>
          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-onyx">Remarks</label>
            <AppTextArea v-model="editForm.remarks" placeholder="Optional notes" :rows="3" />
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff5e6_0%,#ffffff_44%,#f7fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-start lg:p-7">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-white px-3 py-1 text-xs font-bold text-tangerine shadow-sm"
          >
            <Icon icon="feather:archive" class="h-4 w-4" />
            Dental Approval Archive
          </div>
          <h1 class="mt-4 text-3xl font-black text-onyx">Availment History</h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate">
            Review created approval rows, open grouped approval details, and manage valid dental
            availments from one workspace.
          </p>
        </div>

        <div class="flex flex-wrap gap-3 lg:justify-end">
          <RouterLink to="/dental-availments">
            <AppButton btn-theme="outline" class="normal-case">
              <Icon icon="feather:plus" class="h-4 w-4" />
              New Availment
            </AppButton>
          </RouterLink>
          <AppButton btn-theme="primary" class="normal-case" @click="showFilterDialog = true">
            <Icon icon="feather:filter" class="h-4 w-4" />
            Filters
            <span
              v-if="activeFilterCount"
              class="rounded-full bg-white/20 px-2 py-0.5 text-xs font-black text-white"
            >
              {{ activeFilterCount }}
            </span>
          </AppButton>
        </div>
      </div>

      <div class="grid border-t border-pebble/80 bg-white/72 md:grid-cols-3">
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
            Filtered Rows
          </p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ stats.totalVisible }}</p>
        </div>
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
            Overall Total Amount
          </p>
          <p class="mt-2 text-2xl font-black text-onyx">
            {{ stats.hasOverallTotalAmount ? formatMoney(stats.totalAmount) : 'Unavailable' }}
          </p>
          <p v-if="!stats.hasOverallTotalAmount" class="mt-1 text-xs text-slate">
            Backend total amount is not included in the history response yet.
          </p>
        </div>
        <div class="px-6 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Paid Rows</p>
          <p class="mt-2 text-2xl font-black text-emerald">{{ paidRows }}</p>
        </div>
      </div>
    </section>

    <p v-if="errorMessage" class="rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
      {{ errorMessage }}
    </p>
    <p v-if="successMessage" class="rounded-xl bg-emerald-light px-4 py-3 text-sm text-emerald">
      {{ successMessage }}
    </p>

    <AppLoadingScreen
      v-if="loading"
      title="Loading availment history"
      message="Please wait while we load dental approval rows."
    />

    <section v-else class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Approval Row History</h2>
          <p class="mt-1 text-sm text-slate">
            Browse each saved procedure row. Select a valid row to edit it, or use the row actions
            for payment updates and cancellation.
          </p>
        </div>
        <div class="rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate">
          {{ totalEntries }} total rows
        </div>
      </div>

      <AppTable
        :theads="[
          'Approval',
          'Availment Date',
          'Member',
          'Procedure',
          'Dentist / Clinic',
          'Billing Received',
          'Due Date',
          'Days Remaining',
          'Amount',
          'Dentist Payment',
          'Paid to Dentist At',
          'Remarks',
          'Status',
          'Actions',
        ]"
        :total-entries="totalEntries"
        :total-pages="totalPages"
        :current-page="currentPage"
        @update-pg-num="currentPage = $event"
      >
        <template #trs>
          <tr v-if="!records.length">
            <td colspan="14" class="py-10! text-center! text-sm text-slate">
              No availment history found.
            </td>
          </tr>

          <tr
            v-for="record in records"
            v-else
            :key="record.dentalid"
            :class="
              isValidAvailment(record)
                ? 'cursor-pointer transition-colors hover:bg-[#fffaf1] focus-within:bg-[#fffaf1]'
                : ''
            "
            :tabindex="isValidAvailment(record) ? 0 : undefined"
            :role="isValidAvailment(record) ? 'button' : undefined"
            @click="handleRowEdit(record)"
            @keydown.enter="handleRowEdit(record)"
            @keydown.space.prevent="handleRowEdit(record)"
          >
            <td>
              <span class="font-mono text-sm font-black text-onyx">{{ record.approvalno }}</span>
            </td>
            <td class="text-sm text-slate">{{ formatDate(record.availdate) }}</td>
            <td>
              <span class="block max-w-64 whitespace-normal text-sm font-bold text-onyx">
                {{ record.membername }}
              </span>
              <span class="mt-1 block text-xs text-slate">{{ record.clientcode || 'N/A' }}</span>
            </td>
            <td>
              <span class="text-sm font-bold text-onyx">{{ procedureName(record.procedures) }}</span>
              <span class="mt-1 block text-xs text-slate">Tooth {{ record.toothno || 'N/A' }}</span>
            </td>
            <td>
              <span class="block text-sm font-bold text-onyx">{{
                record.dentistname || 'N/A'
              }}</span>
              <span class="mt-1 block text-xs text-slate">{{ record.clinicname || 'N/A' }}</span>
            </td>
            <td class="text-sm text-slate">{{ formatDate(record.billingReceivedAt) }}</td>
            <td class="text-sm text-slate">{{ formatDate(billingDueDate(record.billingReceivedAt)) }}</td>
            <td>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="billingCountdown(record).className"
              >
                {{ billingCountdown(record).label }}
              </span>
            </td>
            <td class="text-sm font-black text-onyx">{{ formatMoney(record.amount) }}</td>
            <td>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="
                  isDoctorPaid(record)
                    ? 'bg-emerald-light text-emerald'
                    : 'bg-amber-light text-amber'
                "
              >
                {{ isDoctorPaid(record) ? 'Paid' : 'Unpaid' }}
              </span>
            </td>
            <td class="text-sm text-slate">
              {{ isDoctorPaid(record) ? formatDateTime(record.paidAt) : 'N/A' }}
            </td>
            <td>
              <span class="block max-w-56 whitespace-normal text-sm text-slate">
                {{ record.remarks || 'N/A' }}
              </span>
            </td>
            <td>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="
                  isValidAvailment(record)
                    ? 'bg-emerald-light text-emerald'
                    : 'bg-ruby-light text-ruby'
                "
              >
                {{ record.status || 'VALID' }}
              </span>
            </td>
            <td>
              <div class="flex flex-wrap justify-end gap-2">
                <button
                  v-if="isValidAvailment(record)"
                  type="button"
                  class="inline-flex size-10 items-center justify-center rounded-full border border-tangerine/20 bg-tangerine-light/35 text-tangerine-dark transition hover:border-tangerine/40 hover:bg-white"
                  title="Edit availment"
                  aria-label="Edit availment"
                  @click.stop="openEditDialog(record)"
                >
                  <Icon icon="feather:edit-2" class="h-4 w-4" />
                </button>
                <button
                  v-if="isValidAvailment(record)"
                  type="button"
                  class="inline-flex size-10 items-center justify-center rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] disabled:cursor-not-allowed disabled:opacity-60"
                  :title="record.billingReceivedAt ? 'Update bill received' : 'Receive bill'"
                  :aria-label="record.billingReceivedAt ? 'Update bill received' : 'Receive bill'"
                  :disabled="updatingPaymentId === record.dentalid"
                  @click.stop="openBillDialog(record)"
                >
                  <Icon
                    :icon="
                      updatingPaymentId === record.dentalid
                        ? 'feather:loader'
                        : 'feather:file-plus'
                    "
                    class="h-4 w-4"
                    :class="{ 'animate-spin': updatingPaymentId === record.dentalid }"
                  />
                </button>
                <button
                  v-if="isValidAvailment(record) && record.billingReceivedAt"
                  type="button"
                  class="inline-flex size-10 items-center justify-center rounded-full text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  :class="
                    isDoctorPaid(record)
                      ? 'border border-[#cbd7dd] bg-[linear-gradient(180deg,#edf5f7_0%,#e2ecef_100%)] text-[#2d5562] shadow-[0_10px_20px_rgba(54,89,99,0.08)] hover:border-[#9bb6bf]'
                      : 'border border-emerald/20 bg-emerald-light text-emerald hover:border-emerald/40 hover:bg-white'
                  "
                  :title="isDoctorPaid(record) ? 'Mark unpaid' : 'Mark paid'"
                  :aria-label="isDoctorPaid(record) ? 'Mark unpaid' : 'Mark paid'"
                  :disabled="updatingPaymentId === record.dentalid"
                  @click.stop="openPaymentDialog(record, !isDoctorPaid(record))"
                >
                  <Icon
                    :icon="
                      updatingPaymentId === record.dentalid
                        ? 'feather:loader'
                        : isDoctorPaid(record)
                          ? 'feather:rotate-ccw'
                          : 'feather:check-circle'
                    "
                    class="h-4 w-4"
                    :class="{ 'animate-spin': updatingPaymentId === record.dentalid }"
                  />
                </button>
                <button
                  v-if="isValidAvailment(record)"
                  type="button"
                  class="inline-flex size-10 items-center justify-center rounded-full border border-ruby/20 bg-ruby-light text-ruby transition hover:bg-ruby hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  title="Cancel availment"
                  aria-label="Cancel availment"
                  :disabled="cancellingId === record.dentalid"
                  @click.stop="openCancelDialog(record)"
                >
                  <Icon
                    :icon="cancellingId === record.dentalid ? 'feather:loader' : 'feather:x-circle'"
                    class="h-4 w-4"
                    :class="{ 'animate-spin': cancellingId === record.dentalid }"
                  />
                </button>
                <button
                  v-else
                  type="button"
                  class="inline-flex size-10 items-center justify-center rounded-full border border-emerald/20 bg-emerald-light text-emerald transition hover:border-emerald/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  title="Uncancel availment"
                  aria-label="Uncancel availment"
                  :disabled="uncancellingId === record.dentalid"
                  @click.stop="openUncancelDialog(record)"
                >
                  <Icon
                    :icon="
                      uncancellingId === record.dentalid ? 'feather:loader' : 'feather:rotate-ccw'
                    "
                    class="h-4 w-4"
                    :class="{ 'animate-spin': uncancellingId === record.dentalid }"
                  />
                </button>
              </div>
            </td>
          </tr>
        </template>
      </AppTable>
    </section>
  </div>
</template>
