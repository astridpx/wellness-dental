<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { AppButton, AppDialog, AppInput, AppLoadingScreen, AppModal } from '@/components/app'
import { useImportedPartnerMembers } from '@/composables'
import { formatCurrency, formatDate } from '@/utils'

const {
  members,
  paymentRecords,
  selectedMember,
  loadingMembers,
  loadingPayments,
  showPaymentsModal,
  errorMessage,
  paymentErrorMessage,
  currentPage,
  totalEntries,
  totalPages,
  filters,
  stats,
  fetchMembers,
  applyFilters,
  clearFilters,
  openPaymentsModal,
  closePaymentsModal,
} = useImportedPartnerMembers()

const showFilterModal = ref(false)

const activeFilterCount = computed(
  () => Object.values(filters).filter((value) => value.trim()).length,
)

function openFilters() {
  showFilterModal.value = true
}

function confirmFilters() {
  showFilterModal.value = false
  applyFilters()
}

function formatDateOnly(value?: string | null) {
  if (!value) return 'N/A'

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return String(value)
}

function formatPaymentPeriod(value?: string | null) {
  if (!value) return 'N/A'

  const normalizedValue = String(value).trim()
  const isDateLike =
    /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ||
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(normalizedValue)

  if (isDateLike) {
    return formatDateOnly(value)
  }

  return String(value)
}
</script>

<template>
  <AppDialog
    title="Filter Imported Members"
    :show="showFilterModal"
    max-width="sm:max-w-4xl"
    confirm-label="Apply Filters"
    @close="showFilterModal = false"
    @confirm="confirmFilters"
  >
    <template #dialog-content>
      <div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Imported Member Filters
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Search the current imported member directory and open month-by-month payment history.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <AppInput
            v-model="filters.search"
            label="Quick Search"
            placeholder="Member, ID no., card no., or location"
            icon="feather:search"
          />
          <AppInput
            v-model="filters.companyCode"
            label="Company Code"
            placeholder="e.g. HB or IWC"
            icon="feather:hash"
          />
          <AppInput
            v-model="filters.companyName"
            label="Company Name"
            placeholder="e.g. Healthbridge"
            icon="feather:briefcase"
          />
          <div>
            <label class="mb-2 block text-sm font-medium text-onyx">Current Payment Status</label>
            <select
              v-model="filters.paid"
              class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] px-4 py-3.5 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
            >
              <option value="">All statuses</option>
              <option value="true">Received only</option>
              <option value="false">Pending only</option>
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

  <AppModal
    :show="showPaymentsModal"
    title="Imported Member Payment History"
    subtitle="Monthly batch history for this imported member"
    max-width="sm:max-w-5xl"
    @close="closePaymentsModal"
  >
    <div class="space-y-6 p-6">
      <section
        class="grid gap-4 rounded-[1.5rem] border border-pebble bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5 md:grid-cols-2"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Member</p>
          <p class="mt-2 text-sm font-bold text-onyx">{{ selectedMember?.fullName || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Company</p>
          <p class="mt-2 text-sm font-bold text-onyx">
            {{ selectedMember?.companyCode || 'N/A' }} · {{ selectedMember?.companyName || 'N/A' }}
          </p>
        </div>
      </section>

      <div
        v-if="paymentErrorMessage"
        class="flex flex-col gap-3 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby sm:flex-row sm:items-center sm:justify-between"
      >
        <p>{{ paymentErrorMessage }}</p>
        <button
          type="button"
          class="shrink-0 font-semibold underline underline-offset-4"
          @click="openPaymentsModal(selectedMember!)"
        >
          Try again
        </button>
      </div>

      <AppLoadingScreen
        v-if="loadingPayments"
        title="Loading payment history"
        message="Please wait while we load imported member payment records."
      />

      <div
        v-else
        class="overflow-hidden rounded-[1.5rem] border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_18px_34px_rgba(21,42,78,0.06)]"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 table-auto">
            <thead
              class="border-b border-pebble bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5fb_100%)]"
            >
              <tr>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Batch</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Payment Period</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Dental Premium</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Status</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Reference</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Date Collected</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Uploaded</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-pebble/65">
              <tr
                v-for="payment in paymentRecords"
                :key="payment.paymentRecordId"
                class="transition-colors duration-200 hover:bg-apricot"
              >
                <td class="px-6 py-4 align-top text-onyx">
                  <p class="font-semibold text-onyx">{{ payment.batchCode || 'N/A' }}</p>
                  <p class="mt-1 text-xs text-slate">{{ payment.sourceFilename || 'N/A' }}</p>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  {{ formatPaymentPeriod(payment.paymentPeriod) }}
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  {{ formatCurrency(payment.dentalPremium) }}
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="
                      payment.paid ? 'bg-emerald-light text-emerald' : 'bg-amber-light text-amber'
                    "
                  >
                    {{ payment.paid ? 'Received' : 'Pending' }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <span class="font-mono text-xs font-semibold text-slate">
                    {{ payment.paymentReference || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top text-onyx">{{ formatDate(payment.paidAt) }}</td>
                <td class="px-6 py-4 align-top text-onyx">{{ formatDate(payment.uploadedAt) }}</td>
              </tr>
              <tr v-if="!paymentRecords.length">
                <td colspan="7" class="w-full px-6 py-14 text-center text-onyx">
                  <div class="flex w-full flex-col items-center">
                    <span
                      class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog text-smoke"
                    >
                      <Icon icon="feather:credit-card" class="h-5 w-5" />
                    </span>
                    <p class="mt-3 font-semibold text-onyx">No payment history found</p>
                    <p class="mt-1 text-sm text-slate">
                      This imported member does not have any saved monthly batch history yet.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <AppButton btn-theme="outline" class="normal-case" @click="closePaymentsModal">
          Close
        </AppButton>
      </div>
    </template>
  </AppModal>

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#f7efe2_0%,#ffffff_48%,#eef6ff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="feather:users" class="h-3.5 w-3.5" />
            Partner Directory
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">Imported Members</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Browse the current imported partner-member directory and inspect each member's payment
            history across monthly uploads.
          </p>
        </div>

        <div class="rounded-[1.6rem] border border-pebble bg-white/90 p-5 shadow-sm">
          <div class="flex items-start gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(145deg,#efe4cf_0%,#e2ece9_100%)] text-tangerine shadow-sm"
            >
              <Icon icon="feather:clock" class="h-6 w-6" />
            </div>
            <div>
              <p class="text-sm font-bold text-onyx">History view</p>
              <p class="mt-1 text-sm leading-6 text-slate">
                Open any member to see their month-by-month uploaded payment status without scanning
                each batch manually.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-px border-t border-pebble bg-pebble sm:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Visible members</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ stats.totalVisibleMembers }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Received</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ stats.paidMembers }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Pending</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ stats.unpaidMembers }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm sm:p-6">
      <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Imported Member Directory</h2>
          <p class="mt-1 text-sm text-slate">
            Search the canonical imported-member list and open each member's payment history.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            v-if="activeFilterCount"
            type="button"
            class="text-sm font-semibold text-slate transition hover:text-tangerine"
            @click="clearFilters"
          >
            Clear filters
          </button>
          <AppButton btn-theme="outline" class="normal-case" @click="openFilters">
            <Icon icon="feather:filter" class="h-4 w-4" />
            Filter
            <span
              v-if="activeFilterCount"
              class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tangerine px-1.5 text-[10px] font-bold text-white"
            >
              {{ activeFilterCount }}
            </span>
          </AppButton>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="mb-4 flex flex-col gap-3 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby sm:flex-row sm:items-center sm:justify-between"
      >
        <p>{{ errorMessage }}</p>
        <button
          type="button"
          class="shrink-0 font-semibold underline underline-offset-4"
          @click="fetchMembers"
        >
          Try again
        </button>
      </div>

      <AppLoadingScreen
        v-if="loadingMembers"
        title="Loading imported members"
        message="Please wait while we retrieve the imported partner-member directory."
      />

      <div
        v-else
        class="overflow-hidden rounded-[1.5rem] border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_18px_34px_rgba(21,42,78,0.06)]"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-230 table-auto">
            <thead
              class="border-b border-pebble bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5fb_100%)]"
            >
              <tr>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Member</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Company</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Payment Period</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Dental Premium</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">
                  Received from Partner
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Status</th>
                <th class="px-6 py-4 text-right text-sm font-semibold text-onyx">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-pebble/65">
              <tr
                v-for="member in members"
                :key="member.memberId"
                class="transition-colors duration-200 hover:bg-apricot"
              >
                <td class="px-6 py-4 align-top text-onyx">
                  <div class="min-w-60">
                    <p class="font-semibold text-onyx">{{ member.fullName }}</p>
                    <p class="mt-1 text-xs text-slate">
                      {{ member.idNo || member.cardNo || 'No identifier' }}
                    </p>
                    <p class="mt-1 text-xs text-slate">{{ member.areaLocation || 'N/A' }}</p>
                  </div>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <span class="block min-w-55 whitespace-normal wrap-break-word">
                    {{ member.companyCode }} · {{ member.companyName }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <div class="min-w-40">
                    <span
                      class="inline-flex rounded-full bg-sapphire-light px-3 py-1 text-xs font-bold tracking-[0.08em] text-sapphire"
                    >
                      {{ formatPaymentPeriod(member.currentPaymentPeriod) }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <div class="min-w-36 text-sm font-semibold text-onyx">
                    {{ formatCurrency(member.currentDentalPremium) }}
                  </div>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <div class="min-w-32 text-sm text-slate">
                    {{ formatDateOnly(member.currentPaidAt) }}
                  </div>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="
                      member.currentPaid
                        ? 'bg-emerald-light text-emerald'
                        : 'bg-amber-light text-amber'
                    "
                  >
                    {{ member.currentPaid ? 'Received' : 'Pending' }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top text-right text-onyx">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-3.5 py-2 text-xs font-semibold text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#f5e3c6_0%,#ead6b5_100%)]"
                    @click="openPaymentsModal(member)"
                  >
                    <Icon icon="feather:eye" class="h-4 w-4" />
                    View History
                  </button>
                </td>
              </tr>
              <tr v-if="totalEntries <= 0">
                <td colspan="7" class="w-full px-6 py-14 text-center text-onyx">
                  <div class="flex w-full flex-col items-center">
                    <span
                      class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog text-smoke"
                    >
                      <Icon icon="feather:search" class="h-5 w-5" />
                    </span>
                    <p class="mt-3 font-semibold text-onyx">No imported members found</p>
                    <p class="mt-1 text-sm text-slate">
                      Try changing the filters or import a partner-member file first.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="border-t border-pebble/70 px-6 py-4">
          <div
            class="flex flex-col gap-3 text-sm text-slate sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              Showing page {{ currentPage }} of {{ totalPages }} with {{ totalEntries }} total
              members.
            </p>
            <div class="flex items-center gap-2">
              <AppButton
                btn-theme="outline"
                class="normal-case"
                :disabled="currentPage <= 1"
                @click="currentPage -= 1"
              >
                Previous
              </AppButton>
              <AppButton
                btn-theme="outline"
                class="normal-case"
                :disabled="currentPage >= totalPages"
                @click="currentPage += 1"
              >
                Next
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
