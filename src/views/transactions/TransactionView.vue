<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AppButton, AppDialog, AppInput, AppLoadingScreen, AppTable } from '@/components/app'
import { useBusinessPartnerUploads, useDentalAvailmentHistory, useProcedures } from '@/composables'
import type { DentalAvailmentRecord, PartnerMemberRecord } from '@/types'
import { formatDate, formatDateTime, formatMoney } from '@/utils'

type LedgerTab = 'dentist' | 'partner'

const router = useRouter()
const activeTab = ref<LedgerTab>('dentist')
const showFilterDialog = ref(false)
const dentistPaymentTarget = ref<{ record: DentalAvailmentRecord; paid: boolean } | null>(null)
const partnerPaymentTarget = ref<{
  record: PartnerMemberRecord
  paid: boolean
  paymentReference: string
} | null>(null)

const {
  currentPage: dentistCurrentPage,
  errorMessage: dentistErrorMessage,
  filters: dentistFilters,
  applyFilters: applyDentistFilters,
  loading: loadingDentistPayments,
  records: dentistRows,
  paidRows: dentistPaidRows,
  unpaidRows: dentistUnpaidRows,
  unpaidAmount: visibleDentistPayable,
  totalEntries: dentistTotalEntries,
  totalPages: dentistTotalPages,
  updateDoctorPaymentStatus,
  updatingPaymentId,
} = useDentalAvailmentHistory()

const {
  records: partnerRows,
  recordScope,
  loadingRecords: loadingPartnerPayments,
  updatingRecordId,
  recordError: partnerErrorMessage,
  recordFilters,
  recordCurrentPage,
  recordTotalEntries,
  recordPaidEntries: partnerReceivedRows,
  recordUnpaidEntries: partnerPendingRows,
  recordTotalPages,
  updatePaymentStatus,
} = useBusinessPartnerUploads()
const { procedures } = useProcedures()

recordScope.value = 'all'

const tabs: Array<{ value: LedgerTab; label: string; icon: string }> = [
  { value: 'dentist', label: 'Dentist Payments', icon: 'feather:briefcase' },
  { value: 'partner', label: 'Payments Received', icon: 'feather:repeat' },
]

const dentistFilterCount = computed(
  () =>
    [dentistFilters.memberName, dentistFilters.clientCode, dentistFilters.status].filter((value) =>
      String(value).trim(),
    ).length,
)
const partnerFilterCount = computed(
  () =>
    [recordFilters.search, recordFilters.companyCode, recordFilters.paid].filter((value) =>
      String(value).trim(),
    ).length,
)
const activeFilterCount = computed(() =>
  activeTab.value === 'dentist' ? dentistFilterCount.value : partnerFilterCount.value,
)
const dentistStatusOptions = computed(() => {
  const statuses = new Set<string>()

  for (const record of dentistRows.value) {
    const status = String(record.status || '').trim()
    if (status) statuses.add(status)
  }

  if (dentistFilters.status.trim()) {
    statuses.add(dentistFilters.status.trim())
  }

  return Array.from(statuses).sort((left, right) => left.localeCompare(right))
})
const procedureNameMap = computed(
  () => new Map(procedures.value.map((procedure) => [procedure.code.trim().toUpperCase(), procedure.name])),
)

function formatStatusLabel(value?: string | null) {
  const normalized = String(value || '').trim()
  if (!normalized) return 'N/A'

  return normalized
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

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

function getDoctorPaymentStatus(record: DentalAvailmentRecord) {
  if (isDoctorCancelled(record)) {
    return {
      label: 'Cancelled',
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
    label: 'Unpaid',
    className: 'bg-amber-light text-amber',
  }
}

function openDentistPaymentDialog(record: DentalAvailmentRecord, paid: boolean) {
  if (updatingPaymentId.value || isDoctorCancelled(record)) return
  dentistPaymentTarget.value = { record, paid }
}

function closeDentistPaymentDialog() {
  if (updatingPaymentId.value) return
  dentistPaymentTarget.value = null
}

async function confirmDentistPaymentStatus() {
  if (!dentistPaymentTarget.value) return

  const updated = await updateDoctorPaymentStatus(
    dentistPaymentTarget.value.record,
    dentistPaymentTarget.value.paid,
  )
  if (updated) dentistPaymentTarget.value = null
}

function openPartnerPaymentDialog(record: PartnerMemberRecord, paid: boolean) {
  if (updatingRecordId.value) return
  partnerPaymentTarget.value = {
    record,
    paid,
    paymentReference: paid ? record.paymentReference || '' : '',
  }
}

function closePartnerPaymentDialog() {
  if (updatingRecordId.value) return
  partnerPaymentTarget.value = null
}

async function confirmPartnerPayment() {
  if (!partnerPaymentTarget.value) return

  const updated = await updatePaymentStatus(
    partnerPaymentTarget.value.record,
    partnerPaymentTarget.value.paid,
    partnerPaymentTarget.value.paymentReference,
  )
  if (updated) partnerPaymentTarget.value = null
}

function confirmFilters() {
  showFilterDialog.value = false
  if (activeTab.value === 'dentist') applyDentistFilters()
}

function clearActiveFilters() {
  if (activeTab.value === 'dentist') {
    dentistFilters.memberName = ''
    dentistFilters.clientCode = ''
    dentistFilters.status = ''
    applyDentistFilters()
    return
  }

  recordFilters.search = ''
  recordFilters.companyCode = ''
  recordFilters.paid = ''
}
</script>

<template>
  <AppDialog
    :title="activeTab === 'dentist' ? 'Filter Dentist Payments' : 'Filter Payments Received'"
    :show="showFilterDialog"
    max-width="sm:max-w-3xl"
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
            Ledger filters
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            {{
              activeTab === 'dentist'
                ? 'Narrow dentist payment rows by member, company/client code, and availment status.'
                : 'Narrow received-payment rows by member, company code, and payment state.'
            }}
          </p>
        </div>

        <div v-if="activeTab === 'dentist'" class="grid gap-5 md:grid-cols-2">
          <AppInput
            v-model="dentistFilters.memberName"
            label="Member Name"
            placeholder="Search member"
            icon="feather:search"
          />
          <AppInput
            v-model="dentistFilters.clientCode"
            label="Company / Client Code"
            placeholder="IMS, partner code"
            icon="feather:hash"
          />
          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-onyx">Availment Status</label>
            <select
              v-model="dentistFilters.status"
              class="w-full rounded-xl border border-pebble bg-white px-4 py-3.5 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
            >
              <option value="">All availments</option>
              <option v-for="status in dentistStatusOptions" :key="status" :value="status">
                {{ formatStatusLabel(status) }}
              </option>
            </select>
          </div>
        </div>

        <div v-else class="grid gap-5 md:grid-cols-2">
          <AppInput
            v-model="recordFilters.search"
            label="Member Search"
            placeholder="Member, card no., ID no."
            icon="feather:search"
          />
          <AppInput
            v-model="recordFilters.companyCode"
            label="Company Code"
            placeholder="IMS, partner code"
            icon="feather:hash"
          />
          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-onyx">Payment State</label>
            <select
              v-model="recordFilters.paid"
              class="w-full rounded-xl border border-pebble bg-white px-4 py-3.5 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
            >
              <option value="">All payment states</option>
              <option value="true">Received only</option>
              <option value="false">Pending only</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-slate transition hover:text-tangerine"
          @click="clearActiveFilters"
        >
          <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
          Clear fields
        </button>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    :title="dentistPaymentTarget?.paid ? 'Mark dentist as paid' : 'Mark dentist as unpaid'"
    :show="Boolean(dentistPaymentTarget)"
    :disabled="Boolean(updatingPaymentId)"
    :confirm-label="
      updatingPaymentId
        ? 'Saving...'
        : dentistPaymentTarget?.paid
          ? 'Mark Dentist Paid'
          : 'Mark Dentist Unpaid'
    "
    @close="closeDentistPaymentDialog"
    @confirm="confirmDentistPaymentStatus"
  >
    <template #dialog-content>
      <div v-if="dentistPaymentTarget" class="space-y-4">
        <div
          class="rounded-[1.5rem] border border-emerald/15 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald">
            Dentist payment
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            This tracks whether the dentist or clinic has already been paid for this availment
            row.
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Approval</p>
            <p class="mt-2 font-mono text-sm font-bold text-onyx">
              {{ dentistPaymentTarget.record.approvalno || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Procedure</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ procedureName(dentistPaymentTarget.record.procedures) }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4 sm:col-span-2">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Dentist / Clinic</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ dentistPaymentTarget.record.dentistname || 'N/A' }} ·
              {{ dentistPaymentTarget.record.clinicname || 'N/A' }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    :title="partnerPaymentTarget?.paid ? 'Mark payment received' : 'Mark payment as pending'"
    :show="Boolean(partnerPaymentTarget)"
    :disabled="
      Boolean(updatingRecordId) ||
      Boolean(partnerPaymentTarget?.paid && !partnerPaymentTarget.paymentReference.trim())
    "
    :confirm-label="
      updatingRecordId ? 'Saving...' : partnerPaymentTarget?.paid ? 'Mark Received' : 'Mark Pending'
    "
    @close="closePartnerPaymentDialog"
    @confirm="confirmPartnerPayment"
  >
    <template #dialog-content>
      <div v-if="partnerPaymentTarget" class="space-y-4">
        <div class="rounded-[1.5rem] border border-tangerine/15 bg-tangerine-light p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Payment received
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            This tracks whether the we received payment from the business partner or IMS for the
            listed member.
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4 sm:col-span-2">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Member</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ partnerPaymentTarget.record.fullName }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Card No.</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ partnerPaymentTarget.record.cardNo || 'N/A' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Partner</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ partnerPaymentTarget.record.companyCode || 'N/A' }}
            </p>
          </div>
        </div>
        <AppInput
          v-if="partnerPaymentTarget.paid"
          v-model="partnerPaymentTarget.paymentReference"
          label="Payment Reference No."
          placeholder="Required reference no."
          icon="feather:hash"
        />
        <p v-else class="rounded-xl bg-fog px-4 py-3 text-sm text-slate">
          This will clear the saved payment reference number for this member.
        </p>
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
            <Icon icon="feather:credit-card" class="h-4 w-4" />
            Payments Received Ledger
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">Transactions</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Track the two finance flows in the wellness program: dentist payments from availments
            and payments received from partner or IMS member batches.
          </p>
        </div>
        <div class="flex flex-wrap gap-3 lg:justify-end">
          <AppButton
            btn-theme="outline"
            class="normal-case"
            @click="router.push('/dental-availment-history')"
          >
            <Icon icon="feather:clock" class="h-4 w-4" />
            Availment History
          </AppButton>
          <AppButton
            btn-theme="outline"
            class="normal-case"
            @click="router.push('/partner-members')"
          >
            <Icon icon="feather:users" class="h-4 w-4" />
            Business Partner Uploads
          </AppButton>
        </div>
      </div>

      <div class="grid border-t border-pebble/80 bg-white/72 md:grid-cols-4">
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
            Dentist Payables
          </p>
          <p class="mt-2 text-2xl font-black text-onyx">
            {{ formatMoney(visibleDentistPayable) }}
          </p>
        </div>
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
            Unpaid Availments
          </p>
          <p class="mt-2 text-2xl font-black text-amber">{{ dentistUnpaidRows }}</p>
        </div>
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
            Payments Received
          </p>
          <p class="mt-2 text-2xl font-black text-emerald">{{ partnerReceivedRows }}</p>
        </div>
        <div class="px-6 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
            Pending Payment
          </p>
          <p class="mt-2 text-2xl font-black text-amber">{{ partnerPendingRows }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Finance Ledger</h2>
          <p class="mt-1 text-sm text-slate">
            Switch between dentist payments and payments received without leaving the page.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex rounded-xl border border-pebble bg-cloud p-1">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              type="button"
              class="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition"
              :class="
                activeTab === tab.value
                  ? 'bg-white text-onyx shadow-sm'
                  : 'text-slate hover:bg-white/70 hover:text-onyx'
              "
              @click="activeTab = tab.value"
            >
              <Icon :icon="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </div>
          <AppButton btn-theme="outline" class="normal-case" @click="showFilterDialog = true">
            <Icon icon="feather:filter" class="h-4 w-4" />
            Filters
            <span
              v-if="activeFilterCount"
              class="rounded-full bg-tangerine px-2 py-0.5 text-xs font-black text-white"
            >
              {{ activeFilterCount }}
            </span>
          </AppButton>
        </div>
      </div>

      <template v-if="activeTab === 'dentist'">
        <p
          v-if="dentistErrorMessage"
          class="mb-4 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby"
        >
          {{ dentistErrorMessage }}
        </p>
        <AppLoadingScreen
          v-if="loadingDentistPayments"
          title="Loading dentist payments"
          message="Please wait while we retrieve dental availment rows."
        />
        <AppTable
          v-else
          :theads="[
            'Approval',
            'Member',
            'Dentist / Clinic',
            'Procedure',
            'Availment Date',
            'Amount',
            'Status',
            'Action',
          ]"
          :total-entries="dentistTotalEntries"
          :total-pages="dentistTotalPages"
          :current-page="dentistCurrentPage"
          @update-pg-num="dentistCurrentPage = $event"
        >
          <template #trs>
            <tr v-if="!dentistRows.length">
              <td colspan="8" class="py-12! text-center! text-sm text-slate">
                No dentist payment rows found.
              </td>
            </tr>
            <tr v-for="record in dentistRows" v-else :key="record.dentalid">
              <td>
                <span class="font-mono text-sm font-black text-onyx">{{ record.approvalno }}</span>
              </td>
              <td>{{ record.membername }}</td>
              <td>
                <p class="font-semibold text-onyx">{{ record.dentistname || 'N/A' }}</p>
                <p class="mt-1 text-xs text-slate">{{ record.clinicname || 'N/A' }}</p>
              </td>
              <td>
                <p class="font-semibold text-onyx">{{ procedureName(record.procedures) }}</p>
                <p class="mt-1 text-xs text-slate">Tooth {{ record.toothno || 'N/A' }}</p>
              </td>
              <td>{{ formatDate(record.availdate) }}</td>
              <td class="font-black text-onyx">{{ formatMoney(record.amount) }}</td>
              <td>
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="getDoctorPaymentStatus(record).className"
                >
                  {{ getDoctorPaymentStatus(record).label }}
                </span>
              </td>
              <td>
                <div v-if="!isDoctorCancelled(record)" class="flex justify-end">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                    :class="
                      isDoctorPaid(record)
                        ? 'border border-[#cbd7dd] bg-[linear-gradient(180deg,#edf5f7_0%,#e2ecef_100%)] text-[#2d5562] shadow-[0_10px_20px_rgba(54,89,99,0.08)] hover:border-[#9bb6bf]'
                        : 'border border-emerald/20 bg-emerald-light text-emerald hover:border-emerald/40 hover:bg-white'
                    "
                    :disabled="updatingPaymentId === record.dentalid"
                    @click="openDentistPaymentDialog(record, !isDoctorPaid(record))"
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
                    {{ isDoctorPaid(record) ? 'Mark Unpaid' : 'Mark Paid' }}
                  </button>
                </div>
                <span v-else class="text-sm text-slate">N/A</span>
              </td>
            </tr>
          </template>
        </AppTable>
      </template>

      <template v-else>
        <p
          v-if="partnerErrorMessage"
          class="mb-4 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby"
        >
          {{ partnerErrorMessage }}
        </p>
        <AppLoadingScreen
          v-if="loadingPartnerPayments"
          title="Loading payments received"
          message="Please wait while we retrieve imported partner member rows."
        />
        <AppTable
          v-else
          :theads="[
            'Member',
            'Partner',
            'Card No.',
            'Batch',
            'Uploaded',
            'Status',
            'Received Date',
            'Action',
          ]"
          :total-entries="recordTotalEntries"
          :total-pages="recordTotalPages"
          :current-page="recordCurrentPage"
          @update-pg-num="recordCurrentPage = $event"
        >
          <template #trs>
            <tr v-if="!partnerRows.length">
              <td colspan="8" class="py-12! text-center! text-sm text-slate">
                No payment received rows found.
              </td>
            </tr>
            <tr v-for="record in partnerRows" v-else :key="record.id">
              <td>
                <p class="font-semibold text-onyx">{{ record.fullName }}</p>
                <p class="mt-1 text-xs text-slate">{{ record.idNo || 'N/A' }}</p>
              </td>
              <td>
                <p class="font-semibold text-onyx">{{ record.companyCode || 'N/A' }}</p>
                <p class="mt-1 text-xs text-slate">{{ record.companyName || 'N/A' }}</p>
              </td>
              <td>{{ record.cardNo || 'N/A' }}</td>
              <td>{{ record.batchCode || 'N/A' }}</td>
              <td>{{ formatDateTime(record.uploadedAt) }}</td>
              <td>
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    record.paid ? 'bg-emerald-light text-emerald' : 'bg-amber-light text-amber'
                  "
                >
                  {{ record.paid ? 'Received' : 'Pending' }}
                </span>
              </td>
              <td>{{ record.paid ? formatDate(record.paidAt) : 'N/A' }}</td>
              <td>
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                    :class="
                      record.paid
                        ? 'border border-[#cbd7dd] bg-[linear-gradient(180deg,#edf5f7_0%,#e2ecef_100%)] text-[#2d5562] shadow-[0_10px_20px_rgba(54,89,99,0.08)] hover:border-[#9bb6bf]'
                        : 'border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] hover:border-[#c59a42]'
                    "
                    :disabled="updatingRecordId === record.id"
                    @click="openPartnerPaymentDialog(record, !record.paid)"
                  >
                    <Icon
                      :icon="
                        updatingRecordId === record.id
                          ? 'feather:loader'
                          : record.paid
                            ? 'feather:rotate-ccw'
                            : 'feather:check-circle'
                      "
                      class="h-4 w-4"
                      :class="{ 'animate-spin': updatingRecordId === record.id }"
                    />
                    {{ record.paid ? 'Mark Pending' : 'Mark Received' }}
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </AppTable>
      </template>
    </section>
  </div>
</template>
