<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref } from 'vue'
import { AppDialog, AppTable } from '@/components/app'
import { useBillingStatements } from '@/composables'
import { formatDateTime, formatMoney } from '@/utils/format'
import {
  MONTHLY_ADMINISTRATOR_FEE,
  MONTHLY_SERVER_FEE,
  type BillingStatement,
  formatBillingPeriod,
  getCurrentBillingPeriod,
  getDefaultBillingStatement,
} from '@/utils/billing'

type BillingLineItem = {
  description: string
  recipient: string
  amount: number
}

const selectedPeriod = ref(getCurrentBillingPeriod())
const statement = ref<BillingStatement>(getDefaultBillingStatement(selectedPeriod.value))
const {
  billingStatements,
  billingStatementTotalEntries,
  billingStatementTotalPages,
  errorMessage,
  fetchBillingStatement,
  fetchBillingStatements,
  loadingBillingStatements,
  queueBillingStatementEmail,
  queueingBillingEmail,
  saveBillingStatement,
  savingBillingStatement,
  updateBillingPayment,
} = useBillingStatements()
const billingPage = ref(1)
const billingPerPage = ref(6)
const recipientEmail = ref('iwcwellnesspci@gmail.com')
const recipientName = ref('IWC Wellness and Preventive Consultancy, Inc.')
const emailQueuedMessage = ref('')
const showConfirmDialog = ref(false)
const pendingAction = ref<'paid' | 'unpaid' | 'email' | null>(null)

const lineItems = computed<BillingLineItem[]>(() => [
  {
    description: 'Server fee',
    recipient: 'Jayra Almanzor',
    amount: statement.value.serverFee,
  },
  {
    description: 'Administrator fee',
    recipient: 'Francis Fuentes',
    amount: statement.value.administratorFee,
  },
])

const paidStatusClass = computed(() =>
  statement.value.isPaid ? 'bg-emerald-light text-emerald' : 'bg-ruby-light text-ruby',
)

const currentStatementLabel = computed(() => formatBillingPeriod(selectedPeriod.value))
const hasStatement = computed(() => Boolean(statement.value.id))
const createTotal = computed(() => MONTHLY_SERVER_FEE + MONTHLY_ADMINISTRATOR_FEE)
const canCreateStatement = computed(
  () => !hasStatement.value && !savingBillingStatement.value && !loadingBillingStatements.value,
)
const recentStatements = computed(() => billingStatements.value)
const confirmTitle = computed(() => {
  if (pendingAction.value === 'paid') return 'Mark statement paid?'
  if (pendingAction.value === 'unpaid') return 'Mark statement unpaid?'
  return 'Queue billing email?'
})
const confirmLabel = computed(() => {
  if (pendingAction.value === 'paid') return 'Mark Paid'
  if (pendingAction.value === 'unpaid') return 'Mark Unpaid'
  return 'Queue Email'
})
const confirmMessage = computed(() => {
  if (pendingAction.value === 'paid') {
    return `This will mark ${currentStatementLabel.value} as paid.`
  }
  if (pendingAction.value === 'unpaid') {
    return `This will mark ${currentStatementLabel.value} as unpaid.`
  }
  return `This will insert an eblast email for ${recipientName.value} with subject "Billing Statement - System Server and Administration Fee - ${currentStatementLabel.value}".`
})

async function refreshBillingStatements() {
  await fetchBillingStatements(billingPage.value, billingPerPage.value)
}

async function loadStatement() {
  statement.value =
    (await fetchBillingStatement(selectedPeriod.value)) ||
    getDefaultBillingStatement(selectedPeriod.value)
}

async function createStatement() {
  emailQueuedMessage.value = ''

  const createdStatement = await saveBillingStatement({
    period: selectedPeriod.value,
    serverFee: MONTHLY_SERVER_FEE,
    administratorFee: MONTHLY_ADMINISTRATOR_FEE,
    isPaid: false,
    notes: statement.value.notes,
  })

  if (createdStatement) statement.value = createdStatement
  billingPage.value = 1
  await refreshBillingStatements()
}

async function updatePaidStatus(isPaid: boolean) {
  emailQueuedMessage.value = ''

  const updatedStatement = await updateBillingPayment({
    period: selectedPeriod.value,
    isPaid,
    paymentReference: statement.value.paymentReference,
    notes: statement.value.notes,
  })

  if (updatedStatement) statement.value = updatedStatement
  await refreshBillingStatements()
}

async function updateNotes(event: Event) {
  emailQueuedMessage.value = ''

  const notes = event.target instanceof HTMLTextAreaElement ? event.target.value : ''
  const updatedStatement = await saveBillingStatement({
    period: selectedPeriod.value,
    serverFee: statement.value.serverFee,
    administratorFee: statement.value.administratorFee,
    isPaid: statement.value.isPaid,
    paidAt: statement.value.paidAt,
    paymentReference: statement.value.paymentReference,
    notes,
  })

  if (updatedStatement) statement.value = updatedStatement
  await refreshBillingStatements()
}

async function handleBillingPageChange(page: number) {
  billingPage.value = page
  await refreshBillingStatements()
}

async function handlePeriodChange() {
  emailQueuedMessage.value = ''
  await loadStatement()
}

function requestPaidStatus(isPaid: boolean) {
  pendingAction.value = isPaid ? 'paid' : 'unpaid'
  showConfirmDialog.value = true
}

function requestQueueEmail() {
  pendingAction.value = 'email'
  showConfirmDialog.value = true
}

function closeConfirmDialog() {
  showConfirmDialog.value = false
  pendingAction.value = null
}

async function queueEmail() {
  emailQueuedMessage.value = ''

  const queued = await queueBillingStatementEmail({
    period: selectedPeriod.value,
    recipientEmail: recipientEmail.value,
    recipientName: recipientName.value,
  })

  if (queued) {
    emailQueuedMessage.value = 'Billing statement email has been queued in eblast.'
  }
}

async function confirmPendingAction() {
  if (pendingAction.value === 'paid') {
    await updatePaidStatus(true)
    closeConfirmDialog()
    return
  }

  if (pendingAction.value === 'unpaid') {
    await updatePaidStatus(false)
    closeConfirmDialog()
    return
  }

  await queueEmail()
  closeConfirmDialog()
}

onMounted(async () => {
  await loadStatement()
  await refreshBillingStatements()
})
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm lg:p-8">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
            Super Admin Billing
          </p>
          <h1 class="mt-2 text-3xl font-black text-onyx lg:text-4xl">Billing statement</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Monthly internal billing for server and administrator fees.
          </p>
        </div>

        <div class="w-full max-w-xs">
          <label
            for="billing-period"
            class="text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke"
          >
            Month period
          </label>
          <input
            id="billing-period"
            v-model="selectedPeriod"
            type="month"
            class="mt-2 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-sm font-semibold text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
            @change="handlePeriodChange"
          />
        </div>
      </div>
    </section>

    <div
      v-if="errorMessage"
      class="rounded-2xl border border-ruby/30 bg-ruby-light px-4 py-3 text-sm font-semibold text-ruby"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="emailQueuedMessage"
      class="rounded-2xl border border-emerald/30 bg-emerald-light px-4 py-3 text-sm font-semibold text-emerald"
    >
      {{ emailQueuedMessage }}
    </div>

    <section class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
              {{ currentStatementLabel }}
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Statement breakdown</h2>
          </div>

          <span
            class="inline-flex w-max items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold"
            :class="hasStatement ? paidStatusClass : 'bg-fog text-slate'"
          >
            <Icon
              :icon="
                !hasStatement
                  ? 'feather:minus-circle'
                  : statement.isPaid
                    ? 'feather:check-circle'
                    : 'feather:clock'
              "
              class="size-4"
            />
            {{ !hasStatement ? 'No statement' : statement.isPaid ? 'Paid' : 'Unpaid' }}
          </span>
        </div>

        <div
          v-if="!hasStatement"
          class="mt-5 rounded-[1.5rem] border border-dashed border-pebble bg-cloud p-6"
        >
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="text-sm font-bold text-onyx">Create billing statement</p>
              <p class="mt-2 text-sm leading-6 text-slate">
                Use the server fee template for {{ currentStatementLabel }}. The recipient name is
                entered only when queueing the email.
              </p>
            </div>
            <div class="rounded-2xl border border-pebble bg-white px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-smoke">Total</p>
              <p class="mt-1 text-xl font-black text-onyx">{{ formatMoney(createTotal) }}</p>
            </div>
          </div>

          <div class="mt-5 grid gap-3 rounded-2xl border border-pebble bg-white p-4">
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="font-semibold text-slate">Server fee - Jayra Almanzor</span>
              <span class="font-bold text-onyx">{{ formatMoney(MONTHLY_SERVER_FEE) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="font-semibold text-slate">Administrator fee - Francis Fuentes</span>
              <span class="font-bold text-onyx">{{ formatMoney(MONTHLY_ADMINISTRATOR_FEE) }}</span>
            </div>
          </div>

          <button
            type="button"
            class="mt-4 inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-4 py-2.5 text-sm font-semibold text-[#8c6320] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#fcf4e8_0%,#f3e5ce_100%)] hover:text-[#6f4a13] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!canCreateStatement"
            @click="createStatement"
          >
            <Icon
              :icon="savingBillingStatement ? 'feather:loader' : 'feather:plus'"
              class="size-4"
              :class="{ 'animate-spin': savingBillingStatement }"
            />
            {{ savingBillingStatement ? 'Creating' : 'Create Statement' }}
          </button>
        </div>

        <div v-else class="mt-5 overflow-hidden rounded-[1.5rem] border border-pebble">
          <AppTable :theads="['Fee', 'Payee', 'Amount']" :total-entries="lineItems.length">
            <template #trs>
              <tr v-for="item in lineItems" :key="item.description">
                <td class="font-semibold text-onyx">{{ item.description }}</td>
                <td>{{ item.recipient }}</td>
                <td class="font-bold text-onyx">{{ formatMoney(item.amount) }}</td>
              </tr>
              <tr class="bg-cloud">
                <td class="font-black text-onyx">Monthly total</td>
                <td class="font-semibold text-slate">Due for {{ currentStatementLabel }}</td>
                <td class="font-black text-onyx">{{ formatMoney(statement.totalAmount) }}</td>
              </tr>
            </template>
          </AppTable>
        </div>
      </div>

      <aside class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
        <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
          Payment control
        </p>
        <h2 class="mt-2 text-2xl font-black text-onyx">
          {{ hasStatement ? formatMoney(statement.totalAmount) : 'No statement' }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-slate">
          Mark this month as paid once the server and administrator fees are settled.
        </p>

        <div class="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition"
            :class="
              statement.isPaid
                ? 'border-emerald bg-emerald-light text-emerald'
                : 'border-pebble bg-white text-slate hover:border-emerald hover:text-emerald'
            "
            :disabled="!hasStatement || savingBillingStatement || loadingBillingStatements"
            @click="requestPaidStatus(true)"
          >
            <Icon
              :icon="savingBillingStatement ? 'feather:loader' : 'feather:check'"
              class="size-4"
              :class="{ 'animate-spin': savingBillingStatement }"
            />
            {{ savingBillingStatement ? 'Saving' : 'Paid' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition"
            :class="
              !statement.isPaid
                ? 'border-ruby bg-ruby-light text-ruby'
                : 'border-pebble bg-white text-slate hover:border-ruby hover:text-ruby'
            "
            :disabled="!hasStatement || savingBillingStatement || loadingBillingStatements"
            @click="requestPaidStatus(false)"
          >
            <Icon icon="feather:x" class="size-4" />
            Unpaid
          </button>
        </div>

        <div class="mt-5 rounded-2xl border border-pebble bg-cloud p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Last paid</p>
          <p class="mt-2 text-sm font-bold text-onyx">
            {{ statement.paidAt ? formatDateTime(statement.paidAt) : 'Not paid yet' }}
          </p>
        </div>

        <label
          for="billing-notes"
          class="mt-5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke"
        >
          Notes
        </label>
        <textarea
          id="billing-notes"
          :value="statement.notes"
          rows="4"
          class="mt-2 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-sm text-onyx outline-none"
          placeholder="Add reference number or payment notes"
          :disabled="!hasStatement || savingBillingStatement || loadingBillingStatements"
          @change="updateNotes"
        />

        <div class="mt-6 border-t border-pebble pt-5">
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke">
            Email statement
          </p>
          <div class="mt-3 grid gap-3">
            <label class="block">
              <span class="text-xs font-semibold text-slate">Recipient name</span>
              <input
                v-model="recipientName"
                type="text"
                class="mt-1 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                placeholder="Recipient name"
              />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-slate">Recipient email</span>
              <input
                v-model="recipientEmail"
                type="email"
                class="mt-1 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-sm text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                placeholder="recipient@email.com"
              />
            </label>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-4 py-2.5 text-sm font-semibold text-[#8c6320] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#fcf4e8_0%,#f3e5ce_100%)] hover:text-[#6f4a13] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="queueingBillingEmail || !hasStatement || !recipientEmail || !recipientName"
              @click="requestQueueEmail"
            >
              <Icon
                :icon="queueingBillingEmail ? 'feather:loader' : 'feather:send'"
                class="size-4"
                :class="{ 'animate-spin': queueingBillingEmail }"
              />
              {{ queueingBillingEmail ? 'Queueing' : 'Queue Email' }}
            </button>
          </div>
        </div>
      </aside>
    </section>

    <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
          Recent status
        </p>
        <h2 class="mt-2 text-2xl font-black text-onyx">Monthly billing periods</h2>
      </div>

      <div class="mt-5 overflow-hidden rounded-[1.5rem] border border-pebble">
        <div v-if="!recentStatements.length" class="bg-cloud px-6 py-8 text-sm text-slate">
          No billing statements have been created yet.
        </div>
        <AppTable
          v-else
          :theads="['Period', 'Total', 'Status', 'Paid Date']"
          :total-entries="billingStatementTotalEntries"
          :total-pages="billingStatementTotalPages"
          :current-page="billingPage"
          @update-pg-num="handleBillingPageChange"
        >
          <template #trs>
            <tr v-for="item in recentStatements" :key="item.period">
              <td class="font-semibold text-onyx">{{ formatBillingPeriod(item.period) }}</td>
              <td class="font-bold text-onyx">{{ formatMoney(item.totalAmount) }}</td>
              <td>
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="item.isPaid ? 'bg-emerald-light text-emerald' : 'bg-ruby-light text-ruby'"
                >
                  {{ item.isPaid ? 'Paid' : 'Unpaid' }}
                </span>
              </td>
              <td>{{ item.paidAt ? formatDateTime(item.paidAt) : 'N/A' }}</td>
            </tr>
          </template>
        </AppTable>
      </div>
    </section>

    <AppDialog
      :show="showConfirmDialog"
      :title="confirmTitle"
      eyebrow="Confirm Action"
      icon="!"
      :confirm-label="confirmLabel"
      :disabled="savingBillingStatement || queueingBillingEmail"
      @close="closeConfirmDialog"
      @confirm="confirmPendingAction"
    >
      <template #dialog-content>
        <p class="text-sm leading-6 text-slate">{{ confirmMessage }}</p>
      </template>
    </AppDialog>
  </div>
</template>
