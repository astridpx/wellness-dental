<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import {
  AppButton,
  AppDialog,
  AppInput,
  AppLoadingScreen,
  AppStatValue,
  AppTable,
} from '@/components/app'
import { useClinics } from '@/composables'

const router = useRouter()
const showDialog = ref(false)
const {
  clinics,
  loading,
  errorMessage,
  currentPage,
  totalEntries,
  totalPages,
  applyFilters,
  fetchClinics,
  filters,
} = useClinics()

const emptyFilters = {
  clinicIdNo: '',
  clinicName: '',
  clinicCode: '',
}
const draftFilters = ref({ ...emptyFilters })
const activeFilterCount = computed(
  () => Object.values(filters).filter((value) => value.trim()).length,
)

function openFilters() {
  draftFilters.value = { ...filters }
  showDialog.value = true
}

function confirmFilters() {
  Object.assign(filters, draftFilters.value)
  showDialog.value = false
  applyFilters()
}

function clearFilterFields() {
  draftFilters.value = { ...emptyFilters }
}

function clearFilters() {
  Object.assign(filters, emptyFilters)
  draftFilters.value = { ...emptyFilters }
  showDialog.value = false
  applyFilters()
}

function clinicStatus(value: string | number | null | undefined) {
  if (String(value) === '1') {
    return { label: 'Active', classes: 'bg-emerald-light text-emerald' }
  }

  if (String(value) === '0') {
    return { label: 'Inactive', classes: 'bg-amber-light text-amber' }
  }

  return { label: 'Unknown', classes: 'bg-fog text-slate' }
}

function accreditationStatus(value: string | number | null | undefined) {
  return String(value) === '1'
    ? { label: 'Accredited', classes: 'bg-sapphire-light text-sapphire' }
    : { label: 'Not accredited', classes: 'bg-fog text-slate' }
}

const summaryCards = computed(() => [
  {
    label: activeFilterCount.value ? 'Matching clinics' : 'Total clinics',
    value: totalEntries.value,
    note: activeFilterCount.value
      ? 'Clinic records matching the filters currently applied.'
      : 'All clinic records available in the directory.',
    icon: 'feather:briefcase',
    tint: 'bg-sapphire-light text-sapphire',
  },
  {
    label: 'Visible records',
    value: clinics.value.length,
    note: 'Clinic records loaded on the current page.',
    icon: 'feather:list',
    tint: 'bg-emerald-light text-emerald',
  },
  {
    label: 'Directory page',
    value: `${currentPage.value} / ${totalPages.value}`,
    note: 'Your position in the clinic directory results.',
    icon: 'feather:book-open',
    tint: 'bg-tangerine-light text-tangerine',
  },
])
</script>

<template>
  <AppDialog title="Filter Clinics" :show="showDialog" confirm-label="Apply Filters" @close="showDialog = false"
    @confirm="confirmFilters">
    <template #dialog-content>
      <div class="space-y-5">
        <div class="rounded-[1.5rem] border border-pebble bg-cloud p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Directory filters
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Narrow the clinic directory by clinic name or assigned clinic code.
          </p>
        </div>

        <div class="grid gap-5">
          <AppInput v-model="draftFilters.clinicName" label="Clinic Name" placeholder="Wellness Dental Clinic"
            icon="feather:briefcase" />
          <AppInput v-model="draftFilters.clinicCode" label="Clinic Code" placeholder="WDC-MKT-001"
            icon="feather:tag" />
        </div>

        <button type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-slate transition hover:text-tangerine"
          @click="clearFilterFields">
          <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
          Clear fields
        </button>
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] p-6 shadow-sm lg:p-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="max-w-2xl">
            <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-tangerine">
              Clinic Control
            </p>
            <h1 class="mt-3 text-4xl font-black tracking-tight text-onyx">Clinic directory</h1>
            <p class="mt-4 text-sm leading-7 text-slate">
              Review branch identity, location, contact details, accreditation, and operating status
              from one workspace.
            </p>
          </div>

          <div class="flex flex-wrap gap-3 shrink-0">
            <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="openFilters">
              <Icon icon="feather:filter" class="h-4 w-4" />
              Filter clinics
              <span v-if="activeFilterCount"
                class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tangerine px-1.5 text-[10px] font-bold text-white">
                {{ activeFilterCount }}
              </span>
            </AppButton>
            <router-link to="/clinic/add">
              <AppButton btn-theme="primary" class="px-5 py-3 normal-case">
                New clinic setup
              </AppButton>
            </router-link>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <article v-for="card in summaryCards" :key="card.label"
            class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between gap-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                {{ card.label }}
              </p>
              <span class="flex h-9 w-9 items-center justify-center rounded-xl" :class="card.tint">
                <Icon :icon="card.icon" class="h-4 w-4" />
              </span>
            </div>
            <AppStatValue :loading="loading" :value="card.value" />
            <p class="mt-3 text-sm leading-6 text-slate">{{ card.note }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
            Live directory
          </p>
          <h2 class="mt-2 text-2xl font-black text-onyx">Operational clinic records</h2>
          <p class="mt-2 text-sm text-slate">
            Select a clinic to review its complete setup or update its information.
          </p>
        </div>
        <button v-if="activeFilterCount" type="button"
          class="text-sm font-semibold text-sapphire transition hover:text-tangerine" @click="clearFilters">
          Clear filters
        </button>
      </div>

      <div v-if="errorMessage"
        class="mt-5 flex flex-col gap-3 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby sm:flex-row sm:items-center sm:justify-between">
        <p>{{ errorMessage }}</p>
        <button type="button" class="shrink-0 font-semibold underline underline-offset-4" @click="fetchClinics">
          Try again
        </button>
      </div>

      <AppLoadingScreen v-if="loading" class="mt-5" title="Loading clinic directory"
        message="Please wait while we retrieve clinic profiles, locations, and operating details." />

      <div v-else class="mt-5">
        <AppTable :theads="[
          'Clinic',
          'Location',
          'Clinic Code',
          'Contact',
          'Accreditation',
          'Status',
          'Action',
        ]" :total-entries="totalEntries" :total-pages="totalPages" :current-page="currentPage"
          @update-pg-num="currentPage = $event">
          <template #trs>
            <tr v-if="!clinics.length">
              <td colspan="7" class="w-full py-14! text-center!">
                <div class="flex w-full flex-col items-center">
                  <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog text-smoke">
                    <Icon icon="feather:search" class="h-5 w-5" />
                  </span>
                  <p class="mt-3 font-semibold text-onyx">No clinics found</p>
                  <p class="mt-1 text-sm text-slate">Try changing or clearing your filters.</p>
                </div>
              </td>
            </tr>

            <tr v-for="clinic in clinics" v-else :key="clinic.clinicidno || clinic.cliniccode" class="cursor-pointer"
              @click="router.push(`/clinic/${clinic.clinicidno}/edit`)">
              <td>
                <p class="font-semibold text-nowrap text-onyx">{{ clinic.clinicname }}</p>
                <p class="mt-1 text-xs uppercase tracking-[0.16em] text-smoke">
                  {{ clinic.type || 'Clinic' }}
                </p>
              </td>
              <td>
                <p class="text-nowrap">{{ clinic.city || 'N/A' }}</p>
                <p class="mt-1 text-xs text-smoke">
                  {{ clinic.province || clinic.address || 'N/A' }}
                </p>
              </td>
              <td class="text-nowrap">{{ clinic.cliniccode || 'N/A' }}</td>
              <td>
                <p class="text-nowrap">{{ clinic.contactno || clinic.MobileNumber1 || 'N/A' }}</p>
                <p v-if="clinic.MobileNumber1" class="mt-1 text-xs text-smoke">
                  {{ clinic.MobileNumber1 }}
                </p>
              </td>
              <td>
                <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-nowrap"
                  :class="accreditationStatus(clinic.iaccredited).classes">
                  {{ accreditationStatus(clinic.iaccredited).label }}
                </span>
              </td>
              <td>
                <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="clinicStatus(clinic.status).classes">
                  {{ clinicStatus(clinic.status).label }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex justify-end">
                  <span
                    class="inline-flex items-center gap-2 rounded-full border border-[#cbd7dd] bg-[linear-gradient(180deg,#edf5f7_0%,#e2ecef_100%)] px-3.5 py-2 text-xs font-semibold tracking-[0.03em] text-[#2d5562] shadow-[0_10px_20px_rgba(54,89,99,0.08)]">
                    <Icon icon="feather:external-link" class="size-4" />
                    Open
                  </span>
                </div>
              </td>
            </tr>
          </template>
        </AppTable>
      </div>
    </section>
  </div>
</template>
