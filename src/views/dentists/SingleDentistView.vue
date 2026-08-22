<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AppButton, AppInput, AppLoadingScreen, AppTextArea } from '@/components/app'
import { useDentistBankAccounts, useDentistForm, usePaymentModes } from '@/composables'
import type { DentistBankAccount, DentistBankAccountInput } from '@/types'

const {
  clearError,
  dentistData,
  errorContext,
  errorMessage,
  goBackToList,
  isEditMode,
  loadDentistProfile,
  loading,
  profileMissing,
  save,
  saving,
  successMessage,
} = useDentistForm()
const route = useRoute()
const {
  bankAccountError,
  bankAccounts,
  clearBankAccountError,
  createBankAccount: createBankAccountRequest,
  deleteBankAccount,
  deletingBankAccountId,
  fetchBankAccounts,
  loadingBankAccounts,
  savingBankAccount,
  updateBankAccount: updateBankAccountRequest,
} = useDentistBankAccounts()
const {
  errorMessage: paymentModeError,
  fetchPaymentModes,
  loadingPaymentModes,
  paymentModes,
} = usePaymentModes()

const dentistId = computed(() => Number(route.params.id) || 0)
const selectedPaymentModeIsListed = computed(() =>
  paymentModes.value.some((paymentMode) => paymentMode.name === dentistData.value.modeOfPayment),
)
const dentistName = computed(
  () =>
    [dentistData.value.firstname, dentistData.value.middleInitial, dentistData.value.lastname]
      .filter(Boolean)
      .join(' ') || 'New Dentist',
)

const feeFields = [
  { key: 'TWLB', label: 'TWLB' },
  { key: 'OP', label: 'OP' },
  { key: 'STE', label: 'STE' },
  { key: 'TF', label: 'TF' },
  { key: 'AD', label: 'AD' },
  { key: 'RJ', label: 'RJ' },
  { key: 'LC', label: 'LC' },
  { key: 'PF', label: 'PF' },
  { key: 'CON', label: 'CON' },
  { key: 'ppeIcf', label: 'PPE / ICF' },
  { key: 'can', label: 'CAN' },
] as const

const setupSteps = computed(() => [
  'Identity and credentials',
  'Procedure fee schedule',
  'Account status',
  ...(isEditMode.value ? ['Bank accounts'] : []),
])

const creatingBankAccount = ref(false)
const editingBankAccountId = ref<number | null>(null)
const bankAccountDraft = ref<DentistBankAccountInput | null>(null)
const bankAccountFeedback = ref('')
const bankAccountValidationVisible = ref(false)
const visibleBankAccountId = ref<number | null>(null)
const pendingDeleteBankAccountId = ref<number | null>(null)

const bankAccountEditorOpen = computed(
  () => creatingBankAccount.value || editingBankAccountId.value !== null,
)

const bankAccountDraftIsValid = computed(
  () =>
    Boolean(bankAccountDraft.value?.bankName.trim()) &&
    Boolean(bankAccountDraft.value?.accountName.trim()) &&
    Boolean(bankAccountDraft.value?.accountNumber.trim()),
)

function emptyBankAccountDraft(): DentistBankAccountInput {
  return {
    bankName: '',
    accountName: '',
    accountNumber: '',
    isActive: true,
  }
}

async function createBankAccount() {
  clearBankAccountError()
  bankAccountFeedback.value = ''
  pendingDeleteBankAccountId.value = null
  editingBankAccountId.value = null
  creatingBankAccount.value = true
  bankAccountValidationVisible.value = false
  bankAccountDraft.value = emptyBankAccountDraft()

  await nextTick()
  document.querySelector<HTMLInputElement>('[data-bank-account-editor="new"] input')?.focus()
}

async function editBankAccount(bankAccount: DentistBankAccount) {
  clearBankAccountError()
  bankAccountFeedback.value = ''
  visibleBankAccountId.value = null
  pendingDeleteBankAccountId.value = null
  creatingBankAccount.value = false
  editingBankAccountId.value = bankAccount.id
  bankAccountValidationVisible.value = false
  bankAccountDraft.value = {
    bankName: bankAccount.bankName,
    accountName: bankAccount.accountName,
    accountNumber: bankAccount.accountNumber,
    isActive: bankAccount.isActive,
  }

  await nextTick()
  document
    .querySelector<HTMLInputElement>(`[data-bank-account-editor="${bankAccount.id}"] input`)
    ?.focus()
}

function cancelBankAccountEdit() {
  creatingBankAccount.value = false
  editingBankAccountId.value = null
  bankAccountDraft.value = null
  bankAccountValidationVisible.value = false
}

async function submitBankAccount() {
  bankAccountValidationVisible.value = true
  if (!bankAccountDraft.value || !bankAccountDraftIsValid.value || !dentistId.value) return

  const wasCreating = creatingBankAccount.value
  const saved = editingBankAccountId.value
    ? await updateBankAccountRequest(
        dentistId.value,
        editingBankAccountId.value,
        bankAccountDraft.value,
      )
    : await createBankAccountRequest(dentistId.value, bankAccountDraft.value)
  if (!saved) return

  cancelBankAccountEdit()
  bankAccountFeedback.value = wasCreating
    ? 'Bank account added successfully.'
    : 'Bank account updated successfully.'
}

function requestBankAccountDelete(bankAccountId: number) {
  clearBankAccountError()
  bankAccountFeedback.value = ''
  visibleBankAccountId.value = null
  pendingDeleteBankAccountId.value = bankAccountId
}

async function confirmBankAccountDelete(bankAccount: DentistBankAccount) {
  if (!dentistId.value) return

  const deleted = await deleteBankAccount(dentistId.value, bankAccount.id)
  if (!deleted) return

  pendingDeleteBankAccountId.value = null
  bankAccountFeedback.value = `${bankAccount.bankName} account ending in ${bankAccount.accountNumber.slice(-4)} was deleted.`
}

function maskedAccountNumber(accountNumber: string) {
  if (accountNumber.length <= 4) return accountNumber

  return `${'•'.repeat(accountNumber.length - 4)} ${accountNumber.slice(-4)}`
}

function toggleAccountNumberVisibility(bankAccountId: number) {
  visibleBankAccountId.value = visibleBankAccountId.value === bankAccountId ? null : bankAccountId
}

watch(
  [isEditMode, dentistId],
  ([editing, id]) => {
    cancelBankAccountEdit()
    pendingDeleteBankAccountId.value = null
    bankAccountFeedback.value = ''
    if (editing && id) void fetchBankAccounts(id)
  },
  { immediate: true },
)
</script>

<template>
  <section class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-tangerine">
            Dentist builder
          </p>
          <h1 class="mt-2 text-3xl font-black text-onyx">
            {{ isEditMode ? 'Provider setup editor' : 'New provider setup' }}
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-7 text-slate">
            This form is restructured as a clinic setup workspace, with a persistent provider
            summary panel on the left and grouped build sections on the right.
          </p>
        </div>
        <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="goBackToList">
          Back to roster
        </AppButton>
      </div>
    </section>

    <div
      v-if="profileMissing"
      role="alert"
      aria-live="assertive"
      class="flex flex-col gap-4 rounded-2xl border border-ruby/20 bg-[linear-gradient(135deg,#fff1f1_0%,#ffffff_100%)] p-5 text-ruby sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex min-w-0 items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ruby-light">
          <Icon icon="feather:alert-triangle" class="h-5 w-5" />
        </span>
        <div>
          <p class="font-bold">Unable to load dentist profile</p>
          <p class="mt-1 text-sm leading-6">
            {{ errorMessage || 'The requested dentist profile could not be found.' }}
          </p>
        </div>
      </div>
      <AppButton
        btn-theme="outline"
        type="button"
        class="shrink-0 normal-case"
        @click="loadDentistProfile"
      >
        <Icon icon="feather:refresh-cw" class="h-4 w-4" />
        Try again
      </AppButton>
    </div>

    <div
      v-else-if="errorMessage"
      role="alert"
      aria-live="assertive"
      class="flex items-start gap-3 rounded-2xl border border-ruby/20 bg-ruby-light px-5 py-4 text-ruby"
    >
      <Icon icon="feather:alert-circle" class="mt-0.5 h-5 w-5 shrink-0" />
      <div class="min-w-0 flex-1">
        <p class="font-bold">
          {{
            errorContext === 'validation'
              ? 'Review the required details'
              : 'Unable to save dentist profile'
          }}
        </p>
        <p class="mt-1 text-sm leading-6">{{ errorMessage }}</p>
      </div>
      <button
        type="button"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-ruby/10"
        aria-label="Dismiss error"
        @click="clearError"
      >
        <Icon icon="feather:x" class="h-4 w-4" />
      </button>
    </div>

    <p
      v-if="successMessage"
      class="rounded-2xl border border-emerald/15 bg-emerald-light px-5 py-4 text-sm font-semibold text-emerald"
      role="status"
    >
      {{ successMessage }}
    </p>

    <AppLoadingScreen
      v-if="loading"
      title="Loading dentist profile"
      message="Please wait while we retrieve the provider's identity, credentials, and account details."
    />

    <div v-else-if="!profileMissing" class="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside class="space-y-5">
        <div class="rounded-4xl bg-[#122833] p-6 text-white shadow-lg">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine-light">
                Provider profile
              </p>
              <h2 class="mt-2 text-2xl font-black">Dr. {{ dentistName }}</h2>
            </div>
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8">
              <Icon icon="streamline-ultimate:dentistry-tooth-shield" class="h-7 w-7" />
            </div>
          </div>

          <div class="mt-6 grid gap-3">
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Status</p>
              <p class="mt-2 text-sm font-semibold">{{ dentistData.status }}</p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Specialty</p>
              <p class="mt-2 text-sm font-semibold">
                {{ dentistData.specialty || 'Not assigned yet' }}
              </p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Dentist code</p>
              <p class="mt-2 text-sm font-semibold">
                {{ dentistData.dentistCode || 'Not assigned yet' }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-4xl border border-pebble bg-white p-5 shadow-sm">
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
            Build sequence
          </p>
          <div class="mt-4 space-y-3">
            <div
              v-for="(step, index) in setupSteps"
              :key="step"
              class="flex items-center gap-3 rounded-2xl bg-cloud px-4 py-3"
            >
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full bg-onyx text-xs font-bold text-white"
              >
                {{ index + 1 }}
              </span>
              <span class="text-sm font-semibold text-onyx">{{ step }}</span>
            </div>
          </div>
        </div>
      </aside>

      <div class="space-y-6">
        <form class="space-y-6" @submit.prevent="save">
          <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                  Section 1
                </p>
                <h2 class="mt-2 text-2xl font-black text-onyx">Identity and credentials</h2>
              </div>
              <span class="rounded-full bg-cloud px-3 py-1 text-xs font-semibold text-slate"
                >Required</span
              >
            </div>

            <div class="mt-6 grid gap-5 md:grid-cols-2">
              <div class="md:col-span-2">
                <AppInput
                  v-model="dentistData.license"
                  label="PRC License Number"
                  placeholder="PRC-XXXXXXX"
                  :required="!isEditMode"
                />
              </div>
              <AppInput
                v-model="dentistData.firstname"
                label="First Name"
                placeholder="Maria"
                required
              />
              <AppInput
                v-model="dentistData.lastname"
                label="Last Name"
                placeholder="Santos"
                required
              />
              <AppInput v-model="dentistData.middleInitial" label="M.I." placeholder="C" />
              <AppInput
                type="email"
                v-model="dentistData.email"
                label="Email Address"
                placeholder="name@clinic.com"
                required
              />
              <AppInput
                v-model="dentistData.phone"
                label="Mobile Number"
                placeholder="+63 912 345 6789"
              />
            </div>
          </section>

          <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                  Section 2
                </p>
                <h2 class="mt-2 text-2xl font-black text-onyx">Procedure fee schedule</h2>
              </div>
              <span
                class="rounded-full bg-emerald-light px-3 py-1 text-xs font-semibold text-emerald"
              >
                Editable rates
              </span>
            </div>

            <p class="mt-3 text-sm leading-6 text-slate">
              Enter each provider rate as a non-negative amount.
            </p>

            <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AppInput
                v-for="field in feeFields"
                :key="field.key"
                v-model="dentistData[field.key]"
                type="text"
                inputmode="decimal"
                pattern="[0-9]+([.][0-9]{2})?"
                decimal-only
                :label="field.label"
                placeholder="100.00"
              />
            </div>
          </section>

          <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                  Section 3
                </p>
                <h2 class="mt-2 text-2xl font-black text-onyx">Provider account details</h2>
              </div>
              <span
                class="rounded-full bg-tangerine-light px-3 py-1 text-xs font-semibold text-tangerine-dark"
                >Operational</span
              >
            </div>

            <div class="mt-6 grid gap-5 md:grid-cols-2">
              <AppInput
                v-model="dentistData.specialty"
                label="Specialty"
                placeholder="General Dentistry"
              />
              <div>
                <label class="mb-2 block text-sm font-medium text-slate">Account Status</label>
                <select v-model="dentistData.status">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <AppInput
                v-model="dentistData.dentistCode"
                label="Dentist Code"
                readonly
                placeholder="Auto Generated"
              />
              <AppInput v-model="dentistData.agent" label="Agent" placeholder="Assigned agent" />
              <div class="md:col-span-2">
                <template v-if="paymentModeError">
                  <AppInput
                    v-model="dentistData.modeOfPayment"
                    label="Mode of payment"
                    placeholder="e.g. Bank transfer"
                  />
                  <div class="mt-2 flex items-center justify-between gap-3 text-xs text-amber">
                    <span
                      >Payment mode options could not be loaded. You can enter one manually.</span
                    >
                    <button
                      type="button"
                      class="shrink-0 font-semibold underline underline-offset-4"
                      @click="fetchPaymentModes"
                    >
                      Retry
                    </button>
                  </div>
                </template>
                <template v-else>
                  <label class="mb-2 block text-sm font-medium text-onyx">Mode of payment</label>
                  <select v-model="dentistData.modeOfPayment" :disabled="loadingPaymentModes">
                    <option value="" disabled>
                      {{
                        loadingPaymentModes ? 'Loading payment modes...' : 'Select mode of payment'
                      }}
                    </option>
                    <option
                      v-if="dentistData.modeOfPayment && !selectedPaymentModeIsListed"
                      :value="dentistData.modeOfPayment"
                    >
                      {{ dentistData.modeOfPayment }} (current)
                    </option>
                    <option
                      v-for="paymentMode in paymentModes"
                      :key="paymentMode.id"
                      :value="paymentMode.name"
                    >
                      {{ paymentMode.name }}
                    </option>
                  </select>
                </template>
              </div>
              <div class="md:col-span-2">
                <label class="mb-2 block text-sm font-medium text-onyx">Remarks</label>
                <AppTextArea
                  v-model="dentistData.remarks"
                  placeholder="Additional provider notes"
                />
              </div>
            </div>
          </section>

          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AppButton
              type="button"
              btn-theme="outline"
              class="px-5 py-3 normal-case"
              @click="goBackToList"
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              btn-theme="primary"
              class="px-5 py-3 normal-case"
              :disabled="saving"
            >
              <Icon
                :icon="saving ? 'feather:loader' : 'feather:save'"
                class="size-4"
                :class="{ 'animate-spin': saving }"
              />
              {{
                saving ? 'Saving...' : isEditMode ? 'Update provider setup' : 'Save provider setup'
              }}
            </AppButton>
          </div>
        </form>

        <section v-if="isEditMode" class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Payment details
              </p>
              <h2 class="mt-2 text-2xl font-black text-onyx">Bank accounts</h2>
              <p class="mt-3 text-sm leading-6 text-slate">
                Manage payout accounts separately from the dentist profile.
              </p>
            </div>
            <AppButton
              type="button"
              btn-theme="primary-alt"
              class="w-fit shrink-0 normal-case"
              :disabled="bankAccountEditorOpen || loadingBankAccounts"
              @click="createBankAccount"
            >
              <Icon icon="feather:plus" class="h-4 w-4" />
              Add bank account
            </AppButton>
          </div>

          <div
            class="mt-5 flex items-start gap-3 rounded-2xl border border-sapphire/15 bg-sapphire-light px-4 py-3 text-sapphire"
          >
            <Icon icon="feather:info" class="mt-0.5 h-5 w-5 shrink-0" />
            <p class="text-sm leading-6">
              Bank account changes save immediately and do not require updating the dentist profile.
              Account numbers are hidden by default for privacy.
            </p>
          </div>

          <div
            v-if="bankAccountError"
            class="mt-4 flex items-start gap-3 rounded-2xl border border-ruby/20 bg-ruby-light px-4 py-3 text-ruby"
            role="alert"
          >
            <Icon icon="feather:alert-circle" class="mt-0.5 h-5 w-5 shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold">Bank account action failed</p>
              <p class="mt-1 text-sm leading-6">{{ bankAccountError }}</p>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-ruby/10"
              aria-label="Dismiss bank account error"
              @click="clearBankAccountError"
            >
              <Icon icon="feather:x" class="h-4 w-4" />
            </button>
          </div>

          <p
            v-if="bankAccountFeedback"
            class="mt-4 flex items-center gap-2 rounded-2xl border border-emerald/15 bg-emerald-light px-4 py-3 text-sm font-semibold text-emerald"
            role="status"
            aria-live="polite"
          >
            <Icon icon="feather:check-circle" class="h-5 w-5 shrink-0" />
            {{ bankAccountFeedback }}
          </p>

          <div
            v-if="creatingBankAccount && bankAccountDraft"
            data-bank-account-editor="new"
            class="mt-5 rounded-3xl border-2 border-sapphire/25 bg-[linear-gradient(135deg,#f5f8ff_0%,#ffffff_100%)] p-5 shadow-sm"
            @keydown.esc.prevent="cancelBankAccountEdit"
          >
            <div class="flex items-start gap-3">
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sapphire text-white"
              >
                <Icon icon="feather:plus" class="h-5 w-5" />
              </span>
              <div>
                <h3 class="font-black text-onyx">New bank account</h3>
                <p class="mt-1 text-sm leading-6 text-slate">
                  Enter the account exactly as it appears in the bank's records.
                </p>
              </div>
            </div>

            <div class="mt-5 grid gap-5 md:grid-cols-2">
              <AppInput
                v-model="bankAccountDraft.bankName"
                label="Bank name *"
                placeholder="e.g. BPI"
                autocomplete="organization"
                :has-error="bankAccountValidationVisible && !bankAccountDraft.bankName.trim()"
              />
              <AppInput
                v-model="bankAccountDraft.accountName"
                label="Account holder name *"
                placeholder="e.g. Juan Dela Cruz"
                autocomplete="name"
                :has-error="bankAccountValidationVisible && !bankAccountDraft.accountName.trim()"
              />
              <AppInput
                v-model="bankAccountDraft.accountNumber"
                label="Account number *"
                placeholder="Enter the complete account number"
                inputmode="numeric"
                autocomplete="off"
                :has-error="bankAccountValidationVisible && !bankAccountDraft.accountNumber.trim()"
              />
              <div>
                <label class="mb-2 block text-sm font-medium text-onyx">Status</label>
                <select v-model="bankAccountDraft.isActive" class="w-full">
                  <option :value="true">Active — available for payouts</option>
                  <option :value="false">Inactive — keep on record</option>
                </select>
              </div>
            </div>

            <p
              v-if="bankAccountValidationVisible && !bankAccountDraftIsValid"
              class="mt-4 flex items-center gap-2 text-sm font-medium text-ruby"
              role="alert"
            >
              <Icon icon="feather:alert-circle" class="h-4 w-4 shrink-0" />
              Complete all three required fields to add this account.
            </p>

            <div
              class="mt-5 flex flex-col-reverse gap-3 border-t border-pebble pt-4 sm:flex-row sm:justify-end"
            >
              <AppButton
                type="button"
                btn-theme="outline"
                class="normal-case"
                :disabled="savingBankAccount"
                @click="cancelBankAccountEdit"
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                btn-theme="primary-alt"
                class="normal-case"
                :disabled="savingBankAccount"
                @click="submitBankAccount"
              >
                <Icon
                  :icon="savingBankAccount ? 'feather:loader' : 'feather:plus-circle'"
                  class="h-4 w-4"
                  :class="{ 'animate-spin': savingBankAccount }"
                />
                {{ savingBankAccount ? 'Adding account...' : 'Add account' }}
              </AppButton>
            </div>
          </div>

          <div
            v-if="loadingBankAccounts"
            class="mt-6 grid place-items-center rounded-3xl border border-dashed border-pebble bg-cloud/40 px-6 py-12 text-center"
            role="status"
          >
            <Icon icon="feather:loader" class="h-6 w-6 animate-spin text-sapphire" />
            <p class="mt-3 text-sm font-semibold text-onyx">Loading bank accounts...</p>
          </div>

          <div
            v-else-if="!bankAccounts.length && !creatingBankAccount"
            class="mt-6 grid place-items-center rounded-3xl border border-dashed border-pebble bg-cloud/40 px-6 py-12 text-center"
          >
            <span
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sapphire shadow-sm"
            >
              <Icon icon="feather:credit-card" class="h-6 w-6" />
            </span>
            <h3 class="mt-4 font-black text-onyx">No bank accounts yet</h3>
            <p class="mt-2 max-w-sm text-sm leading-6 text-slate">
              Add the dentist's first payout account. You can update or remove it at any time.
            </p>
            <AppButton
              type="button"
              btn-theme="primary-alt"
              class="mt-5 normal-case"
              @click="createBankAccount"
            >
              <Icon icon="feather:plus" class="h-4 w-4" />
              Add first account
            </AppButton>
          </div>

          <div v-else-if="!loadingBankAccounts" class="mt-6 space-y-4">
            <article
              v-for="(bankAccount, index) in bankAccounts"
              :key="bankAccount.id"
              class="rounded-3xl border p-5 transition-colors"
              :class="
                editingBankAccountId === bankAccount.id
                  ? 'border-tangerine/40 bg-tangerine-light/30'
                  : 'border-pebble bg-cloud/40'
              "
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sapphire shadow-sm"
                  >
                    <Icon icon="feather:credit-card" class="h-5 w-5" />
                  </span>
                  <div>
                    <p class="font-bold text-onyx">Bank account {{ index + 1 }}</p>
                    <p class="mt-1 text-xs text-smoke">Account ID {{ bankAccount.id }}</p>
                  </div>
                </div>
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    bankAccount.isActive ? 'bg-emerald-light text-emerald' : 'bg-fog text-smoke'
                  "
                >
                  {{ bankAccount.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <div
                v-if="editingBankAccountId === bankAccount.id && bankAccountDraft"
                :data-bank-account-editor="bankAccount.id"
                class="mt-5 grid gap-5 md:grid-cols-2"
                @keydown.enter.prevent="submitBankAccount"
                @keydown.esc.prevent="cancelBankAccountEdit"
              >
                <AppInput
                  v-model="bankAccountDraft.bankName"
                  label="Bank name *"
                  placeholder="e.g. BPI"
                  :has-error="bankAccountValidationVisible && !bankAccountDraft.bankName.trim()"
                />
                <AppInput
                  v-model="bankAccountDraft.accountName"
                  label="Account holder name *"
                  placeholder="e.g. Juan Dela Cruz"
                  :has-error="bankAccountValidationVisible && !bankAccountDraft.accountName.trim()"
                />
                <AppInput
                  v-model="bankAccountDraft.accountNumber"
                  label="Account number *"
                  placeholder="Enter the complete account number"
                  inputmode="numeric"
                  :has-error="
                    bankAccountValidationVisible && !bankAccountDraft.accountNumber.trim()
                  "
                />
                <div>
                  <label class="mb-2 block text-sm font-medium text-onyx">Status</label>
                  <select v-model="bankAccountDraft.isActive" class="w-full">
                    <option :value="true">Active — available for payouts</option>
                    <option :value="false">Inactive — keep on record</option>
                  </select>
                </div>
                <p
                  v-if="bankAccountValidationVisible && !bankAccountDraftIsValid"
                  class="flex items-center gap-2 text-sm font-medium text-ruby md:col-span-2"
                  role="alert"
                >
                  <Icon icon="feather:alert-circle" class="h-4 w-4 shrink-0" />
                  Complete all three required fields to save this account.
                </p>
              </div>

              <dl v-else class="mt-5 grid gap-4 md:grid-cols-3">
                <div class="rounded-2xl bg-white px-4 py-3">
                  <dt class="text-[11px] font-semibold uppercase tracking-[0.16em] text-smoke">
                    Bank name
                  </dt>
                  <dd class="mt-2 text-sm font-semibold text-onyx">{{ bankAccount.bankName }}</dd>
                </div>
                <div class="rounded-2xl bg-white px-4 py-3">
                  <dt class="text-[11px] font-semibold uppercase tracking-[0.16em] text-smoke">
                    Account name
                  </dt>
                  <dd class="mt-2 text-sm font-semibold text-onyx">
                    {{ bankAccount.accountName }}
                  </dd>
                </div>
                <div class="rounded-2xl bg-white px-4 py-3">
                  <dt class="text-[11px] font-semibold uppercase tracking-[0.16em] text-smoke">
                    Account number
                  </dt>
                  <dd class="mt-2 flex items-center justify-between gap-3 text-sm text-onyx">
                    <span class="break-all font-semibold tabular-nums">
                      {{
                        visibleBankAccountId === bankAccount.id
                          ? bankAccount.accountNumber
                          : maskedAccountNumber(bankAccount.accountNumber)
                      }}
                    </span>
                    <button
                      type="button"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate transition hover:bg-cloud hover:text-onyx focus:outline-none focus:ring-4 focus:ring-focus-ring"
                      :aria-label="
                        visibleBankAccountId === bankAccount.id
                          ? `Hide account number for bank account ${index + 1}`
                          : `Show account number for bank account ${index + 1}`
                      "
                      @click="toggleAccountNumberVisibility(bankAccount.id)"
                    >
                      <Icon
                        :icon="
                          visibleBankAccountId === bankAccount.id
                            ? 'feather:eye-off'
                            : 'feather:eye'
                        "
                        class="h-4 w-4"
                      />
                    </button>
                  </dd>
                </div>
              </dl>

              <div class="mt-5 border-t border-pebble pt-4">
                <template v-if="editingBankAccountId === bankAccount.id">
                  <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <AppButton
                      type="button"
                      btn-theme="outline"
                      class="normal-case"
                      :disabled="savingBankAccount"
                      @click="cancelBankAccountEdit"
                    >
                      Cancel
                    </AppButton>
                    <AppButton
                      type="button"
                      btn-theme="primary-alt"
                      class="normal-case"
                      :disabled="savingBankAccount"
                      @click="submitBankAccount"
                    >
                      <Icon
                        :icon="savingBankAccount ? 'feather:loader' : 'feather:save'"
                        class="h-4 w-4"
                        :class="{ 'animate-spin': savingBankAccount }"
                      />
                      {{ savingBankAccount ? 'Saving account...' : 'Save account' }}
                    </AppButton>
                  </div>
                </template>
                <div
                  v-else-if="pendingDeleteBankAccountId === bankAccount.id"
                  class="flex flex-col gap-4 rounded-2xl border border-ruby/15 bg-ruby-light p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div class="flex items-start gap-3 text-ruby">
                    <Icon icon="feather:alert-triangle" class="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p class="text-sm font-bold">Delete this bank account?</p>
                      <p class="mt-1 text-xs leading-5">
                        This action cannot be undone. The dentist profile will not be changed.
                      </p>
                    </div>
                  </div>
                  <div class="flex shrink-0 gap-3">
                    <AppButton
                      type="button"
                      btn-theme="outline"
                      class="normal-case"
                      :disabled="deletingBankAccountId === bankAccount.id"
                      @click="pendingDeleteBankAccountId = null"
                    >
                      Keep account
                    </AppButton>
                    <AppButton
                      type="button"
                      btn-theme="danger"
                      class="normal-case"
                      :disabled="deletingBankAccountId === bankAccount.id"
                      @click="confirmBankAccountDelete(bankAccount)"
                    >
                      <Icon
                        :icon="
                          deletingBankAccountId === bankAccount.id
                            ? 'feather:loader'
                            : 'feather:trash-2'
                        "
                        class="h-4 w-4"
                        :class="{ 'animate-spin': deletingBankAccountId === bankAccount.id }"
                      />
                      {{
                        deletingBankAccountId === bankAccount.id ? 'Deleting...' : 'Delete account'
                      }}
                    </AppButton>
                  </div>
                </div>
                <div v-else class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <AppButton
                    type="button"
                    btn-theme="outline"
                    class="normal-case text-ruby"
                    :disabled="bankAccountEditorOpen"
                    @click="requestBankAccountDelete(bankAccount.id)"
                  >
                    <Icon icon="feather:trash-2" class="h-4 w-4" />
                    Delete
                  </AppButton>
                  <AppButton
                    type="button"
                    btn-theme="outline"
                    class="normal-case"
                    :disabled="bankAccountEditorOpen"
                    @click="editBankAccount(bankAccount)"
                  >
                    <Icon icon="feather:edit-2" class="h-4 w-4" />
                    Edit account
                  </AppButton>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
