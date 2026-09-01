<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AppButton, AppInput, AppLoadingScreen, AppModal } from '@/components/app'
import { useMembershipDetails } from '@/composables'
import { formatCurrency } from '@/utils'

const {
  members,
  paymentRecords,
  selectedMember,
  loadingMembers,
  loadingPayments,
  showPaymentsModal,
  hasSearched,
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
} = useMembershipDetails()

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

  const normalized = String(value).trim()
  return normalized.includes('T') ? normalized.split('T')[0] || normalized : normalized
}

function getPaymentRemittanceStatus(payment: { remittedWell?: string | null }) {
  if (payment.remittedWell) {
    return {
      label: 'Remitted',
      className: 'bg-emerald-light text-emerald',
    }
  }

  return {
    label: 'Not remitted',
    className: 'bg-ruby-light text-ruby',
  }
}

function getWellnessRemittanceCode(payment: {
  remcodeWell?: string | null
  remcode_well?: string | null
  remcodewell?: string | null
  remCodeWell?: string | null
  remcode?: string | null
}) {
  const record = payment as Record<string, unknown>
  const candidates = [
    payment.remcodeWell,
    payment.remcode_well,
    payment.remcodewell,
    payment.remCodeWell,
    payment.remcode,
    record.remcodeWell,
    record.remcode_well,
    record.remcodewell,
    record.remCodeWell,
    record.remcode,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return 'N/A'
}
</script>

<template>
  <AppModal
    :show="showPaymentsModal"
    title="Membership Payment History"
    subtitle="Payment records for the shared main planholder group"
    max-width="sm:max-w-5xl"
    @close="closePaymentsModal"
  >
    <div class="space-y-6 p-6">
      <section
        class="grid gap-4 rounded-[1.5rem] border border-pebble bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5 md:grid-cols-2"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Member</p>
          <p class="mt-2 text-sm font-bold text-onyx">{{ selectedMember?.memberName || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Plan Code</p>
          <p class="mt-2 text-sm font-bold text-onyx">{{ selectedMember?.planCode || 'N/A' }}</p>
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
        message="Please wait while we load membership payment records."
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
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Plan</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Dental Premium</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Remittance</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">
                  Wellness Remittance Code
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Period</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">
                  Date Collected
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-pebble/65">
              <tr
                v-for="payment in paymentRecords"
                :key="payment.paymentCollectionId"
                class="transition-colors duration-200 hover:bg-apricot"
              >
                <td class="px-6 py-4 align-top text-onyx">
                  <span
                    class="inline-flex rounded-full bg-sapphire-light px-3 py-1 text-xs font-bold tracking-[0.08em] text-sapphire"
                  >
                    {{ payment.planCode || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  {{ formatCurrency(selectedMember?.dentalPremium) }}
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                    :class="getPaymentRemittanceStatus(payment).className"
                  >
                    {{ getPaymentRemittanceStatus(payment).label }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  {{ getWellnessRemittanceCode(payment) }}
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <span class="font-semibold text-onyx">
                    {{ formatDateOnly(payment.paymentPeriod) }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  {{ formatDateOnly(payment.dateReceived) }}
                </td>
              </tr>
              <tr v-if="!paymentRecords.length">
                <td colspan="6" class="w-full px-6 py-14 text-center text-onyx">
                  <div class="flex w-full flex-col items-center">
                    <span
                      class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog text-smoke"
                    >
                      <Icon icon="feather:credit-card" class="h-5 w-5" />
                    </span>
                    <p class="mt-3 font-semibold text-onyx">No payments found</p>
                    <p class="mt-1 text-sm text-slate">
                      This member group has no visible dental-premium payment history yet.
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
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff3e0_0%,#ffffff_48%,#eef6ff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="feather:shield" class="h-3.5 w-3.5" />
            Payment Verification
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">IMS Membership Details</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Verify membership information and cleared payment history for members whose plans
            include dental premium coverage. Plans without dental premium are automatically hidden.
          </p>

          <div class="mt-6 max-w-3xl rounded-[1.75rem] border border-pebble bg-white/90 p-4 shadow-sm">
            <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              <AppInput
                v-model="filters.search"
                label="Search Member"
                placeholder="Member name, card number, or birth date"
                icon="feather:search"
                @keydown.enter="applyFilters"
              />
              <AppButton class="normal-case md:self-end" @click="applyFilters">
                <Icon icon="feather:search" class="h-4 w-4" />
                Search
              </AppButton>
              <AppButton
                v-if="filters.search.trim()"
                btn-theme="outline"
                class="normal-case md:self-end"
                @click="clearFilters"
              >
                Clear
              </AppButton>
            </div>
            <p class="mt-3 text-sm text-slate">
              Search first to load the IMS verification directory.
            </p>
          </div>
        </div>

        <div class="rounded-[1.6rem] border border-pebble bg-white/90 p-5 shadow-sm">
          <div class="flex items-start gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(145deg,#efe4cf_0%,#e2ece9_100%)] text-tangerine shadow-sm"
            >
              <Icon icon="feather:check-circle" class="h-6 w-6" />
            </div>
            <div>
              <p class="text-sm font-bold text-onyx">Eligibility rule</p>
              <p class="mt-1 text-sm leading-6 text-slate">
                Only members whose Dental Premium value exists on their plan can appear in this
                directory.
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
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
            Not remitted members
          </p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ stats.unremittedMembers }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
            Remitted members
          </p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ stats.remittedMembers }}</p>
        </div>
      </div>
    </section>

    <section
      v-if="hasSearched"
      class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm sm:p-6"
    >
      <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Verification Directory</h2>
          <p class="mt-1 text-sm text-slate">
            Search results for members whose plans include dental premium coverage.
          </p>
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
        title="Loading membership details"
        message="Please wait while we retrieve dental-premium membership records."
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
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Agent</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Company</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-onyx">Plan</th>
                <th class="px-6 py-4 text-right text-sm font-semibold text-onyx">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-pebble/65">
              <tr
                v-for="member in members"
                :key="member.planholderId"
                class="transition-colors duration-200 hover:bg-apricot"
              >
                <td class="px-6 py-4 align-top text-onyx">
                  <div class="min-w-60">
                    <p class="font-semibold text-onyx">{{ member.memberName }}</p>
                    <p class="mt-1 text-xs text-slate">
                      {{ member.imsCardNumber || 'No card number' }}
                    </p>
                  </div>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <span class="block min-w-44 whitespace-normal wrap-break-word">
                    {{ member.agentName || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <span class="block min-w-55 whitespace-normal wrap-break-word">
                    {{ member.company || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top text-onyx">
                  <div class="min-w-40">
                    <span
                      class="inline-flex rounded-full bg-sapphire-light px-3 py-1 text-xs font-bold tracking-[0.08em] text-sapphire"
                    >
                      {{ member.planCode || 'N/A' }}
                    </span>
                    <p class="mt-2 text-xs text-slate">
                      Premium: {{ member.dentalPremium || 'N/A' }}
                    </p>
                  </div>
                </td>
                <td class="px-6 py-4 align-top text-right text-onyx">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-3.5 py-2 text-xs font-semibold text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#f5e3c6_0%,#ead6b5_100%)]"
                    @click="openPaymentsModal(member)"
                  >
                    <Icon icon="feather:eye" class="h-4 w-4" />
                    View Payments
                  </button>
                </td>
              </tr>
              <tr v-if="totalEntries <= 0">
                <td colspan="5" class="w-full px-6 py-14 text-center text-onyx">
                  <div class="flex w-full flex-col items-center">
                    <span
                      class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog text-smoke"
                    >
                      <Icon icon="feather:search" class="h-5 w-5" />
                    </span>
                    <p class="mt-3 font-semibold text-onyx">No eligible members found</p>
                    <p class="mt-1 text-sm text-slate">
                      Try a different search term. Members on non-dental-premium plans will not
                      appear here.
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
