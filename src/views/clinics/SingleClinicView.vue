<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { watchDebounced } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { AppButton, AppInput, AppLoadingScreen } from '@/components/app'
import { useClinicForm, useDentists } from '@/composables'
import type { ClinicAssignedDentist, Dentist } from '@/types'

const {
  clearError,
  clinicData,
  errorContext,
  errorMessage,
  goBackToList,
  isEditMode,
  loadClinicProfile,
  loadedClinic,
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
  dentist: SelectedDentistDetails
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
const clinicFeeFields = [
  { key: 'TWLB', label: 'TWLB' },
  { key: 'OP', label: 'OP' },
  { key: 'STE', label: 'STE' },
  { key: 'TF', label: 'TF' },
  { key: 'AD', label: 'AD' },
  { key: 'RJ', label: 'RJ' },
  { key: 'LC', label: 'LC' },
  { key: 'PF', label: 'PF' },
  { key: 'CON', label: 'CON' },
] as const

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
  'Dentist assignments',
  'Procedure fee',
  'Location',
  'Contact and schedule',
  'Operating status',
]

function formatLegacyDentistName(dentist: { dentistname?: string | null; firstname?: string | null; middleinitial?: string | null; lastname?: string | null }) {
  if (dentist.dentistname?.trim()) return dentist.dentistname.trim()

  const firstName = String(dentist.firstname || '').trim()
  const middleInitial = String(dentist.middleinitial || '').trim().replace(/\.+$/, '')
  const lastName = String(dentist.lastname || '').trim()
  const rightSide = [firstName, middleInitial ? `${middleInitial}.` : ''].filter(Boolean).join(' ').trim()

  return [lastName, rightSide].filter(Boolean).join(', ').trim()
}

function normalizeDentistStatus(value: string | number | null | undefined) {
  if (String(value) === '1') return 'Active'
  if (String(value) === '0') return 'Inactive'
  return 'Unknown'
}

function mapDentistToSelectedDetails(dentist: Dentist): SelectedDentistDetails {
  return {
    dentistidno: Number(dentist.dentistidno),
    dentistname: formatLegacyDentistName(dentist),
    prcno: dentist.prcno || '',
    email: dentist.email || '',
    dentistcode: dentist.dentistcode || '',
    isActive: String(dentist.Isactive ?? ''),
  }
}

function mapAssignedDentistToSelectedDetails(dentist: ClinicAssignedDentist): SelectedDentistDetails | null {
  if (dentist.dentistId == null) return null

  return {
    dentistidno: Number(dentist.dentistId),
    dentistname: String(dentist.dentistname || 'Assigned dentist'),
    prcno: String(dentist.prcno || ''),
    email: String(dentist.email || ''),
    dentistcode: String(dentist.dentistcode || ''),
    isActive: String(dentist.isActive || ''),
  }
}

const dentistOptions = computed<DentistOption[]>(() =>
  dentists.value.map((dentist) => ({
    value: Number(dentist.dentistidno),
    label: formatLegacyDentistName(dentist),
    description: [dentist.prcno && `PRC ${dentist.prcno}`, dentist.dentistcode]
      .filter(Boolean)
      .join(' · '),
    dentist: mapDentistToSelectedDetails(dentist),
  })),
)

const fallbackAssignedDentists = computed<SelectedDentistDetails[]>(() => {
  const loadedAssignedDentists = loadedClinic.value?.assignedDentists || []
  const fromLoaded = loadedAssignedDentists
    .map(mapAssignedDentistToSelectedDetails)
    .filter((dentist): dentist is SelectedDentistDetails => dentist !== null)

  if (fromLoaded.length) return fromLoaded

  if (clinicData.value.dentistId == null) return []

  return [{
    dentistidno: Number(clinicData.value.dentistId),
    dentistname: clinicData.value.dentistname || 'Assigned dentist',
    prcno: clinicData.value.prcno || '',
    email: clinicData.value.email || '',
    dentistcode: clinicData.value.dentistcode || '',
    isActive: clinicData.value.isActive || '',
  }]
})

function resolveSelectedDentist(dentistId: number) {
  const matchedOption = dentistOptions.value.find((option) => option.value === dentistId)
  if (matchedOption) return matchedOption.dentist

  return (
    fallbackAssignedDentists.value.find((dentist) => dentist.dentistidno === dentistId) ||
    null
  )
}

const selectedDentists = computed<SelectedDentistDetails[]>(() =>
  clinicData.value.assignedDentistIds
    .map((dentistId) => resolveSelectedDentist(Number(dentistId)))
    .filter((dentist): dentist is SelectedDentistDetails => dentist !== null),
)

const availableDentistOptions = computed(() => {
  const selectedIds = new Set(clinicData.value.assignedDentistIds)
  return dentistOptions.value.filter((option) => !selectedIds.has(option.value))
})

const assignedDentistName = computed(() => {
  const [firstDentist] = selectedDentists.value
  if (!firstDentist) return 'Not assigned yet'
  if (selectedDentists.value.length === 1) return firstDentist.dentistname
  return `${selectedDentists.value.length} dentists assigned`
})

const selectedDentistStatus = computed(() => {
  if (!selectedDentists.value.length) return 'No dentist selected'

  const activeCount = selectedDentists.value.filter(
    (dentist) => normalizeDentistStatus(dentist.isActive) === 'Active',
  ).length

  return `${activeCount}/${selectedDentists.value.length} active`
})

const clinicStatusLabel = computed(() => clinicData.value.status || 'Unknown')
const clinicCodeLabel = computed(() => clinicData.value.clinicCode || 'Not assigned yet')
const clinicLocationLabel = computed(() =>
  clinicData.value.city || clinicData.value.province
    ? [clinicData.value.city, clinicData.value.province].filter(Boolean).join(', ')
    : 'Not assigned yet',
)
const clinicAccreditationLabel = computed(() =>
  clinicData.value.isAccredited ? 'Accredited' : 'Not accredited',
)

watch(
  selectedDentists,
  (dentistsList) => {
    const primaryDentist = dentistsList[0] || null

    clinicData.value.dentistId = primaryDentist?.dentistidno ?? null
    clinicData.value.dentistname = primaryDentist?.dentistname || ''
    clinicData.value.prcno = primaryDentist?.prcno || ''
    clinicData.value.email = primaryDentist?.email || ''
    clinicData.value.dentistcode = primaryDentist?.dentistcode || ''
    clinicData.value.isActive = primaryDentist?.isActive || ''
  },
  { immediate: true },
)

function addDentistAssignment(option: DentistOption) {
  if (clinicData.value.assignedDentistIds.includes(option.value)) return

  clinicData.value.assignedDentistIds = [
    ...clinicData.value.assignedDentistIds,
    option.value,
  ]
  dentistSearch.value = ''
}

function removeDentistAssignment(dentistId: number) {
  clinicData.value.assignedDentistIds = clinicData.value.assignedDentistIds.filter(
    (assignedDentistId) => assignedDentistId !== dentistId,
  )
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function submitClinicForm() {
  await save()
  scrollToTop()
}
</script>

<template>
  <section class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
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
          <p class="font-bold">Unable to load clinic profile</p>
          <p class="mt-1 text-sm leading-6">
            {{ errorMessage || 'The requested clinic profile could not be found.' }}
          </p>
        </div>
      </div>
      <AppButton
        btn-theme="outline"
        type="button"
        class="shrink-0 normal-case"
        @click="loadClinicProfile"
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
              : 'Unable to save clinic profile'
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
      title="Loading clinic profile"
      message="Please wait while we retrieve the clinic's identity, location, and operating details."
    />

    <form
      v-else-if="!profileMissing"
      class="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]"
      @submit.prevent="submitClinicForm"
    >
      <aside class="space-y-5">
        <div class="rounded-4xl bg-[#122833] p-6 text-white shadow-lg xl:sticky xl:top-6">
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

          <div class="mt-4 flex flex-wrap gap-2">
            <span
              class="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white"
            >
              {{ clinicStatusLabel }}
            </span>
            <span
              class="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white"
            >
              {{ clinicAccreditationLabel }}
            </span>
          </div>

          <div class="mt-6 grid gap-3">
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Status</p>
              <p class="mt-2 text-sm font-semibold">{{ clinicStatusLabel }}</p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Clinic code</p>
              <p class="mt-2 text-sm font-semibold">{{ clinicCodeLabel }}</p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Assigned dentists</p>
              <p class="mt-2 text-sm font-semibold">{{ assignedDentistName }}</p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Location</p>
              <p class="mt-2 text-sm font-semibold">{{ clinicLocationLabel }}</p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Accreditation</p>
              <p class="mt-2 text-sm font-semibold">{{ clinicAccreditationLabel }}</p>
            </div>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div class="rounded-2xl bg-white/8 px-4 py-4">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Provider app</p>
              <p class="mt-2 text-sm font-semibold">
                {{ clinicData.providerApp || 'Not assigned yet' }}
              </p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-4">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Clinic type</p>
              <p class="mt-2 text-sm font-semibold">{{ clinicData.type || 'Not assigned yet' }}</p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-4">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Dentist status</p>
              <p class="mt-2 text-sm font-semibold">
                {{ selectedDentistStatus }}
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

        <div
          class="rounded-[1.4rem] border border-[#e2d7c2] bg-[linear-gradient(135deg,#fffaf1_0%,#f8f6ef_100%)] px-4 py-4 shadow-sm"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-tangerine">
            Workspace note
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Use this panel as the clinic snapshot while the right side handles setup details,
            dentist assignment, rates, and operating information.
          </p>
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
            <AppInput
              v-model="clinicData.clinicName"
              label="Clinic Name"
              placeholder="Wellness Dental Clinic"
            />
            <AppInput
              v-model="clinicData.clinicCode"
              label="Clinic Code"
              placeholder="CJD-STA.ROSA"
            />
            <AppInput v-model="clinicData.type" label="Clinic Type" placeholder="Dental" />
            <AppInput
              v-model="clinicData.providerApp"
              label="Provider Application"
              placeholder="IMS Wellness"
            />
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
            Search the dentist roster by provider name, PRC number, or dentist code, then add one
            or more dentists to this clinic.
          </p>

          <div
            v-if="dentistErrorMessage"
            class="mt-5 flex flex-col gap-3 rounded-xl bg-amber-light px-4 py-3 text-sm text-amber sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{{ dentistErrorMessage }}</p>
            <button
              type="button"
              class="shrink-0 font-semibold underline underline-offset-4"
              @click="fetchDentists"
            >
              Try again
            </button>
          </div>

          <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div class="space-y-4">
              <AppInput
                v-model="dentistSearch"
                label="Find Dentists"
                placeholder="Search by name, PRC number, or dentist code"
              />

              <div class="rounded-3xl border border-pebble bg-cloud/55 p-3">
                <div class="flex items-center justify-between gap-3 px-2 pb-3">
                  <p class="text-sm font-semibold text-onyx">Search results</p>
                  <span class="text-xs text-slate">
                    {{ loadingDentists ? 'Loading...' : `${availableDentistOptions.length} available` }}
                  </span>
                </div>

                <div
                  v-if="availableDentistOptions.length"
                  class="max-h-80 space-y-2 overflow-y-auto pr-1"
                >
                  <button
                    v-for="option in availableDentistOptions"
                    :key="option.value"
                    type="button"
                    class="flex w-full items-start justify-between gap-4 rounded-2xl border border-transparent bg-white px-4 py-3 text-left shadow-sm transition hover:border-tangerine/30 hover:bg-tangerine-light/40"
                    @click="addDentistAssignment(option)"
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-onyx">{{ option.label }}</p>
                      <p class="mt-1 text-xs text-slate">
                        {{ option.description || 'Dentist record available for assignment' }}
                      </p>
                    </div>
                    <span class="shrink-0 rounded-full bg-onyx px-3 py-1 text-xs font-semibold text-white">
                      Add
                    </span>
                  </button>
                </div>

                <div
                  v-else
                  class="rounded-2xl border border-dashed border-pebble bg-white px-4 py-6 text-center text-sm text-slate"
                >
                  {{
                    dentistSearch
                      ? 'No dentists match your search.'
                      : 'All loaded dentists are already assigned or no dentists are available yet.'
                  }}
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="rounded-3xl border border-pebble bg-white p-4 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-onyx">Assigned dentists</p>
                    <p class="mt-1 text-xs text-slate">
                      The first assigned dentist is used as the primary summary on this profile.
                    </p>
                  </div>
                  <span class="rounded-full bg-cloud px-3 py-1 text-xs font-semibold text-slate">
                    {{ clinicData.assignedDentistIds.length }} selected
                  </span>
                </div>

                <div v-if="selectedDentists.length" class="mt-4 space-y-3">
                  <article
                    v-for="dentist in selectedDentists"
                    :key="dentist.dentistidno"
                    class="rounded-2xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] p-4"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <p class="text-sm font-semibold text-onyx">{{ dentist.dentistname }}</p>
                          <span
                            v-if="dentist.dentistidno === clinicData.assignedDentistIds[0]"
                            class="rounded-full bg-tangerine-light px-2.5 py-1 text-[11px] font-semibold text-tangerine"
                          >
                            Primary
                          </span>
                        </div>
                        <p class="mt-1 text-xs text-slate">
                          {{
                            [dentist.prcno && `PRC ${dentist.prcno}`, dentist.dentistcode]
                              .filter(Boolean)
                              .join(' · ') || 'Dentist details'
                          }}
                        </p>
                      </div>
                      <button
                        type="button"
                        class="rounded-full border border-ruby/20 bg-ruby-light px-3 py-1 text-xs font-semibold text-ruby transition hover:border-ruby/40"
                        @click="removeDentistAssignment(dentist.dentistidno)"
                      >
                        Remove
                      </button>
                    </div>

                    <div class="mt-4 grid gap-3 md:grid-cols-2">
                      <div class="rounded-2xl bg-cloud px-3 py-3">
                        <p class="text-[11px] uppercase tracking-[0.18em] text-smoke">Email</p>
                        <p class="mt-1 text-sm font-medium text-onyx">
                          {{ dentist.email || 'No email on file' }}
                        </p>
                      </div>
                      <div class="rounded-2xl bg-cloud px-3 py-3">
                        <p class="text-[11px] uppercase tracking-[0.18em] text-smoke">Status</p>
                        <p class="mt-1 text-sm font-medium text-onyx">
                          {{ normalizeDentistStatus(dentist.isActive) }}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>

                <div
                  v-else
                  class="mt-4 rounded-2xl border border-dashed border-pebble bg-cloud px-4 py-6 text-center text-sm text-slate"
                >
                  No dentists assigned yet.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Section 3
              </p>
              <h2 class="mt-2 text-2xl font-black text-onyx">Procedure fee</h2>
            </div>
            <span
              class="rounded-full bg-emerald-light px-3 py-1 text-xs font-semibold text-emerald"
            >
              Editable rates
            </span>
          </div>

          <p class="mt-3 text-sm leading-6 text-slate">
            Enter each clinic rate as a whole number or with two decimal places.
          </p>

          <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AppInput
              v-for="field in clinicFeeFields"
              :key="field.key"
              v-model="clinicData[field.key]"
              type="text"
              inputmode="decimal"
              pattern="[0-9]+([.][0-9]{2})?"
              decimal-only
              :label="field.label"
              placeholder="100"
            />
          </div>
        </section>

        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
              Section 4
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Location details</h2>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <AppInput
                v-model="clinicData.address"
                label="Street Address"
                placeholder="123 Health Avenue, Barangay Central"
              />
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
              Section 5
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Contact and schedule</h2>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <AppInput
              v-model="clinicData.contactNumber"
              label="Contact Number"
              placeholder="02-8123-4567"
            />
            <AppInput
              v-model="clinicData.mobileNumber1"
              label="Primary Mobile Number"
              placeholder="09171234567"
            />
            <AppInput
              v-model="clinicData.mobileNumber2"
              label="Secondary Mobile Number"
              placeholder="09981234567"
            />
            <AppInput
              v-model="clinicData.schedule"
              label="Operating Schedule"
              placeholder="Monday-Friday, 8:00 AM-5:00 PM"
            />
          </div>
        </section>

        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
              Section 6
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
            {{ saving ? 'Saving...' : isEditMode ? 'Update clinic setup' : 'Save clinic setup' }}
          </AppButton>
        </div>
      </div>
    </form>
  </section>
</template>
