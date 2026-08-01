<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AppButton, AppInput, AppLoadingScreen, AppTextArea } from '@/components/app'
import { useDentistForm, usePaymentModes } from '@/composables'

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
const {
  clearPaymentModeError,
  errorMessage: errorPaymentModeMessage,
  fetchPaymentModes,
  loadingPaymentModes,
  paymentModes,
} = usePaymentModes()

const setupSteps = ['Provider identity', 'Credentials', 'Payment profile', 'Account status']
</script>

<template>
  <section class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm">
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

    <div v-if="profileMissing" role="alert" aria-live="assertive"
      class="flex flex-col gap-4 rounded-2xl border border-ruby/20 bg-[linear-gradient(135deg,#fff1f1_0%,#ffffff_100%)] p-5 text-ruby sm:flex-row sm:items-center sm:justify-between">
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
      <AppButton btn-theme="outline" type="button" class="shrink-0 normal-case" @click="loadDentistProfile">
        <Icon icon="feather:refresh-cw" class="h-4 w-4" />
        Try again
      </AppButton>
    </div>

    <div v-else-if="errorMessage" role="alert" aria-live="assertive"
      class="flex items-start gap-3 rounded-2xl border border-ruby/20 bg-ruby-light px-5 py-4 text-ruby">
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
      <button type="button"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-ruby/10"
        aria-label="Dismiss error" @click="clearError">
        <Icon icon="feather:x" class="h-4 w-4" />
      </button>
    </div>

    <div v-if="errorPaymentModeMessage" role="status"
      class="flex flex-col gap-3 rounded-2xl border border-amber/20 bg-amber-light px-5 py-4 text-amber sm:flex-row sm:items-center sm:justify-between">
      <div class="flex min-w-0 items-start gap-3">
        <Icon icon="feather:info" class="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p class="font-bold">Payment options are unavailable</p>
          <p class="mt-1 text-sm leading-6">{{ errorPaymentModeMessage }}</p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <button type="button" class="text-sm font-semibold underline underline-offset-4" @click="fetchPaymentModes">
          Try again
        </button>
        <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-amber/10"
          aria-label="Dismiss payment options error" @click="clearPaymentModeError">
          <Icon icon="feather:x" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <p v-if="successMessage"
      class="rounded-2xl border border-emerald/15 bg-emerald-light px-5 py-4 text-sm font-semibold text-emerald"
      role="status">
      {{ successMessage }}
    </p>

    <AppLoadingScreen v-if="loading" title="Loading dentist profile"
      message="Please wait while we retrieve the provider's identity, credentials, and account details." />

    <form v-else-if="!profileMissing" class="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]" @submit.prevent="save">
      <aside class="space-y-5">
        <div class="rounded-4xl bg-[#122833] p-6 text-white shadow-lg">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine-light">
                Provider profile
              </p>
              <h2 class="mt-2 text-2xl font-black">
                Dr. {{ dentistData.firstname || 'New' }} {{ dentistData.lastname || 'Dentist' }}
              </h2>
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
            <div v-for="(step, index) in setupSteps" :key="step"
              class="flex items-center gap-3 rounded-2xl bg-cloud px-4 py-3">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-onyx text-xs font-bold text-white">
                {{ index + 1 }}
              </span>
              <span class="text-sm font-semibold text-onyx">{{ step }}</span>
            </div>
          </div>
        </div>
      </aside>

      <div class="space-y-6">
        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Section 1
              </p>
              <h2 class="mt-2 text-2xl font-black text-onyx">Identity and credentials</h2>
            </div>
            <span class="rounded-full bg-cloud px-3 py-1 text-xs font-semibold text-slate">Required</span>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <AppInput v-model="dentistData.license" label="PRC License Number" placeholder="PRC-XXXXXXX" />
            </div>
            <AppInput v-model="dentistData.firstname" label="First Name" placeholder="Maria" />
            <AppInput v-model="dentistData.lastname" label="Last Name" placeholder="Santos" />
            <AppInput v-model="dentistData.middleInitial" label="M.I." placeholder="C" />
            <AppInput type="email" v-model="dentistData.email" label="Email Address" placeholder="name@clinic.com" />
            <AppInput v-model="dentistData.phone" label="Mobile Number" placeholder="+63 912 345 6789" />
          </div>
        </section>

        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Section 2
              </p>
              <h2 class="mt-2 text-2xl font-black text-onyx">Provider account details</h2>
            </div>
            <span
              class="rounded-full bg-tangerine-light px-3 py-1 text-xs font-semibold text-tangerine-dark">Operational</span>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <AppInput v-model="dentistData.specialty" label="Specialty" placeholder="General Dentistry" />
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Account Status</label>
              <select v-model="dentistData.status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <AppInput v-model="dentistData.dentistCode" label="Dentist Code" placeholder="DEN-001" />
            <AppInput v-model="dentistData.agent" label="Agent" placeholder="Assigned agent" />
            <!-- <AppInput v-model="dentistData.modeOfPayment" label="Mode of Payment" placeholder="Bank transfer" /> -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Mode of Payment</label>
              <select v-model="dentistData.modeOfPayment" :disabled="loadingPaymentModes">
                <option value="" disabled>
                  {{ loadingPaymentModes ? 'Loading payment modes...' : 'Select Mode of Payment' }}
                </option>
                <option v-for="py in paymentModes" :key="py.id" :value="py.name">
                  {{ py.name }}
                </option>
              </select>
            </div>
            <AppInput v-model="dentistData.accountName" label="Account Name" placeholder="Account holder name" />
            <div class="md:col-span-2">
              <AppInput v-model="dentistData.bankAccount" label="Bank Account" placeholder="Bank account number" />
            </div>
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-onyx">Remarks</label>
              <AppTextArea v-model="dentistData.remarks" placeholder="Additional provider notes" />
            </div>
          </div>
        </section>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AppButton type="button" btn-theme="outline" class="px-5 py-3 normal-case" @click="goBackToList">
            Cancel
          </AppButton>
          <AppButton type="submit" btn-theme="primary" class="px-5 py-3 normal-case" :disabled="saving">
            <Icon :icon="saving ? 'feather:loader' : 'feather:save'" class="size-4"
              :class="{ 'animate-spin': saving }" />
            {{
              saving ? 'Saving...' : isEditMode ? 'Update provider setup' : 'Save provider setup'
            }}
          </AppButton>
        </div>
      </div>
    </form>
  </section>
</template>
