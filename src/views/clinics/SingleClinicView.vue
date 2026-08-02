<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { watchDebounced } from '@vueuse/core'
import { ref, watch } from 'vue'
import { AppButton, AppInput, AppLoadingScreen, AppSearchSelect } from '@/components/app'
import { useClinicForm, useDentists } from '@/composables'

const {
  clearError,
  clinicData,
  errorContext,
  errorMessage,
  goBackToList,
  isEditMode,
  loadClinicProfile,
  loading,
  profileMissing,
  save,
  saving,
  successMessage,
} = useClinicForm()
const {
  applyFilters: applyDentistFilters,
  dentists,
  errorMessage: dentistErrorMessage,
  fetchDentists,
  filters: dentistFilters,
  loading: loadingDentists,
} = useDentists({ perPage: 20 })

type DentistOption = {
  value: number
  label: string
  description: string
}

type SelectedDentistDetails = {
  dentistidno: number
  dentistname: string
  prcno: string
  email: string
  dentistcode: string
  isActive: string
}

const dentistSearch = ref('')
const dentistOptions = ref<DentistOption[]>([])
const assignedDentistName = ref('Not assigned yet')
const selectedDentist = ref<SelectedDentistDetails | null>(null)
const selectedDentistStatus = ref('')

watch(
  [
    dentists,
    () => clinicData.value.dentistId,
    () => clinicData.value.dentistname,
    () => clinicData.value.prcno,
    () => clinicData.value.email,
    () => clinicData.value.dentistcode,
    () => clinicData.value.isActive,
  ],
  ([availableDentists, selectedId, dentistname, prcno, email, dentistcode, isActive]) => {
    const options = availableDentists.map((dentist) => ({
      value: Number(dentist.dentistidno),
      label:
        dentist.dentistname ||
        [dentist.firstname, dentist.middleinitial, dentist.lastname].filter(Boolean).join(' '),
      description: [dentist.prcno && `PRC ${dentist.prcno}`, dentist.dentistcode]
        .filter(Boolean)
        .join(' · '),
    }))

    const normalizedSelectedId = selectedId == null ? null : Number(selectedId)
    const matchedDentist = availableDentists.find(
      (dentist) => Number(dentist.dentistidno) === normalizedSelectedId,
    )

    if (matchedDentist) {
      selectedDentist.value = {
        dentistidno: Number(matchedDentist.dentistidno),
        dentistname:
          matchedDentist.dentistname ||
          [matchedDentist.firstname, matchedDentist.middleinitial, matchedDentist.lastname]
            .filter(Boolean)
            .join(' '),
        prcno: matchedDentist.prcno || '',
        email: matchedDentist.email || '',
        dentistcode: matchedDentist.dentistcode || '',
        isActive: String(matchedDentist.Isactive ?? ''),
      }
    } else if (normalizedSelectedId == null) {
      selectedDentist.value = null
    } else if (selectedDentist.value?.dentistidno !== normalizedSelectedId) {
      selectedDentist.value = {
        dentistidno: normalizedSelectedId,
        dentistname: String(dentistname || 'Assigned dentist'),
        prcno: String(prcno || ''),
        email: String(email || ''),
        dentistcode: String(dentistcode || ''),
        isActive: String(isActive || ''),
      }
    }

    if (
      normalizedSelectedId != null &&
      !options.some((option) => option.value === normalizedSelectedId)
    ) {
      const retainedDentist = selectedDentist.value
      options.unshift({
        value: normalizedSelectedId,
        label: retainedDentist?.dentistname || 'Assigned dentist',
        description:
          [retainedDentist?.prcno && `PRC ${retainedDentist.prcno}`, retainedDentist?.dentistcode]
            .filter(Boolean)
            .join(' · ') || 'Currently assigned dentist',
      })
    }

    dentistOptions.value = options
    assignedDentistName.value =
      options.find((option) => option.value === normalizedSelectedId)?.label || 'Not assigned yet'
    selectedDentistStatus.value = selectedDentist.value
      ? String(selectedDentist.value.isActive) === '1'
        ? 'Active'
        : String(selectedDentist.value.isActive) === '0'
          ? 'Inactive'
          : 'Unknown'
      : ''
  },
  { immediate: true },
)

watchDebounced(
  dentistSearch,
  (dentistName) => {
    dentistFilters.dentistName = dentistName.trim()
    applyDentistFilters()
  },
  { debounce: 400, maxWait: 1000 },
)

const setupSteps = [
  'Clinic identity',
  'Dentist assignment',
  'Location',
  'Contact and schedule',
  'Operating status',
]
</script>

<template>
  <section class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm">
      <div class="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-tangerine">
            Clinic builder
          </p>
          <h1 class="mt-2 text-3xl font-black text-onyx">
            {{ isEditMode ? 'Clinic setup editor' : 'New clinic setup' }}
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-7 text-slate">
            Maintain the clinic's identity, location, contact channels, schedule, and operating
            status in one profile.
          </p>
        </div>
        <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="goBackToList">
          Back to directory
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
          <p class="font-bold">Unable to load clinic profile</p>
          <p class="mt-1 text-sm leading-6">
            {{ errorMessage || 'The requested clinic profile could not be found.' }}
          </p>
        </div>
      </div>
      <AppButton btn-theme="outline" type="button" class="shrink-0 normal-case" @click="loadClinicProfile">
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
              : 'Unable to save clinic profile'
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

    <p v-if="successMessage"
      class="rounded-2xl border border-emerald/15 bg-emerald-light px-5 py-4 text-sm font-semibold text-emerald"
      role="status">
      {{ successMessage }}
    </p>

    <AppLoadingScreen v-if="loading" title="Loading clinic profile"
      message="Please wait while we retrieve the clinic's identity, location, and operating details." />

    <form v-else-if="!profileMissing" class="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]" @submit.prevent="save">
      <aside class="space-y-5">
        <div class="rounded-4xl bg-[#122833] p-6 text-white shadow-lg">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine-light">
                Clinic profile
              </p>
              <h2 class="mt-2 truncate text-2xl font-black">
                {{ clinicData.clinicName || 'New clinic' }}
              </h2>
            </div>
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/8">
              <Icon icon="feather:briefcase" class="h-7 w-7" />
            </div>
          </div>

          <div class="mt-6 grid gap-3">
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Status</p>
              <p class="mt-2 text-sm font-semibold">{{ clinicData.status }}</p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Clinic code</p>
              <p class="mt-2 text-sm font-semibold">
                {{ clinicData.clinicCode || 'Not assigned yet' }}
              </p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Assigned dentist</p>
              <p class="mt-2 text-sm font-semibold">{{ assignedDentistName }}</p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Location</p>
              <p class="mt-2 text-sm font-semibold">
                {{ clinicData.city || clinicData.province || 'Not assigned yet' }}
              </p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Accreditation</p>
              <p class="mt-2 text-sm font-semibold">
                {{ clinicData.isAccredited ? 'Accredited' : 'Not accredited' }}
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
              <h2 class="mt-2 text-2xl font-black text-onyx">Clinic identity</h2>
            </div>
            <span class="rounded-full bg-cloud px-3 py-1 text-xs font-semibold text-slate">
              Required
            </span>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <AppInput v-model="clinicData.clinicName" label="Clinic Name" placeholder="Wellness Dental Clinic" />
            <AppInput v-model="clinicData.clinicCode" label="Clinic Code" placeholder="WDC-MKT-001" />
            <AppInput v-model="clinicData.type" label="Clinic Type" placeholder="Dental" />
            <AppInput v-model="clinicData.providerApp" label="Provider Application" placeholder="IMS Wellness" />
          </div>
        </section>

        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Section 2
              </p>
              <h2 class="mt-2 text-2xl font-black text-onyx">Dentist assignment</h2>
            </div>
            <span class="rounded-full bg-cloud px-3 py-1 text-xs font-semibold text-slate">
              Required
            </span>
          </div>

          <p class="mt-3 text-sm leading-6 text-slate">
            Search the dentist roster by provider name, PRC number, or dentist code.
          </p>

          <div v-if="dentistErrorMessage"
            class="mt-5 flex flex-col gap-3 rounded-xl bg-amber-light px-4 py-3 text-sm text-amber sm:flex-row sm:items-center sm:justify-between">
            <p>{{ dentistErrorMessage }}</p>
            <button type="button" class="shrink-0 font-semibold underline underline-offset-4" @click="fetchDentists">
              Try again
            </button>
          </div>

          <div class="mt-6">
            <AppSearchSelect v-model="clinicData.dentistId" v-model:search="dentistSearch" :options="dentistOptions"
              :loading="loadingDentists" label="Assigned Dentist" placeholder="Search for a dentist"
              empty-text="No dentists match your search." />
          </div>

          <div class="mt-6 grid gap-5 border-t border-pebble pt-6 md:grid-cols-2">
            <div class="md:col-span-2">
              <AppInput :model-value="selectedDentist?.dentistname || ''" label="Dentist Name"
                placeholder="Select a dentist to view their details" readonly />
            </div>
            <AppInput :model-value="selectedDentist?.email || ''" label="Email Address"
              placeholder="No dentist selected" readonly />
            <AppInput :model-value="selectedDentist?.prcno || ''" label="PRC Number" placeholder="No dentist selected"
              readonly />
            <AppInput :model-value="selectedDentist?.dentistcode || ''" label="Dentist Code"
              placeholder="No dentist selected" readonly />
            <AppInput :model-value="selectedDentistStatus" label="Account Status" placeholder="No dentist selected"
              readonly />
          </div>
        </section>

        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
              Section 3
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Location details</h2>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <AppInput v-model="clinicData.address" label="Street Address"
                placeholder="123 Health Avenue, Barangay Central" />
            </div>
            <AppInput v-model="clinicData.city" label="City" placeholder="Makati City" />
            <AppInput v-model="clinicData.province" label="Province" placeholder="Metro Manila" />
            <AppInput v-model="clinicData.longitude" label="Longitude" placeholder="121.0244" />
            <AppInput v-model="clinicData.latitude" label="Latitude" placeholder="14.5547" />
          </div>
        </section>

        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
              Section 4
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Contact and schedule</h2>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <AppInput v-model="clinicData.contactNumber" label="Contact Number" placeholder="02-8123-4567" />
            <AppInput v-model="clinicData.mobileNumber1" label="Primary Mobile Number" placeholder="09171234567" />
            <AppInput v-model="clinicData.mobileNumber2" label="Secondary Mobile Number" placeholder="09981234567" />
            <AppInput v-model="clinicData.schedule" label="Operating Schedule"
              placeholder="Monday-Friday, 8:00 AM-5:00 PM" />
          </div>
        </section>

        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
              Section 5
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Operating status</h2>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-onyx">Account Status</label>
              <select v-model="clinicData.status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-onyx">Accreditation</label>
              <select v-model="clinicData.isAccredited">
                <option :value="true">Accredited</option>
                <option :value="false">Not accredited</option>
              </select>
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
            {{ saving ? 'Saving...' : isEditMode ? 'Update clinic setup' : 'Save clinic setup' }}
          </AppButton>
        </div>
      </div>
    </form>
  </section>
</template>
