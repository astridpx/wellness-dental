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
import { useDentists } from '@/composables'

const router = useRouter()
const showDialog = ref(false)
const {
  dentists,
  loading,
  errorMessage,
  currentPage,
  totalEntries,
  totalPages,
  applyFilters,
  fetchDentists,
  filters,
} = useDentists()

const emptyFilters = {
  dentistId: '',
  dentistName: '',
  email: '',
  prcno: '',
  code: '',
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

function dentistStatus(value: string | number | null | undefined) {
  if (String(value) === '1') {
    return {
      label: 'Active',
      classes: 'bg-emerald-light text-emerald',
    }
  }

  if (String(value) === '0') {
    return {
      label: 'Inactive',
      classes: 'bg-amber-light text-amber',
    }
  }

  return {
    label: 'Unknown',
    classes: 'bg-fog text-slate',
  }
}

const summaryCards = computed(() => [
  {
    label: activeFilterCount.value ? 'Matching providers' : 'Total providers',
    value: totalEntries.value,
    note: activeFilterCount.value
      ? 'Dentists matching the filters currently applied.'
      : 'All dentist records available in the directory.',
    icon: 'feather:users',
    tint: 'bg-sapphire-light text-sapphire',
  },
  {
    label: 'Visible records',
    value: dentists.value.length,
    note: 'Provider records loaded on the current page.',
    icon: 'feather:list',
    tint: 'bg-emerald-light text-emerald',
  },
  {
    label: 'Directory page',
    value: `${currentPage.value} / ${totalPages.value}`,
    note: 'Your position in the current directory results.',
    icon: 'feather:book-open',
    tint: 'bg-tangerine-light text-tangerine',
  },
])
</script>

<template>
  <AppDialog
    title="Filter Dentists"
    :show="showDialog"
    confirm-label="Apply Filters"
    @close="showDialog = false"
    @confirm="confirmFilters"
  >
    <template #dialog-content>
      <div class="space-y-5">
        <div class="rounded-[1.5rem] border border-pebble bg-cloud p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Roster filters
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Narrow the directory by dentist ID, provider details, or license information.
          </p>
        </div>
        <div class="grid gap-5">
          <!-- <AppInput v-model="draftFilters.dentistId" label="Dentist ID" placeholder="e.g. 1024" icon="feather:hash" /> -->
          <AppInput
            v-model="draftFilters.prcno"
            label="PRC License No."
            placeholder="XXXXXXX"
            icon="feather:award"
          />
          <AppInput
            v-model="draftFilters.dentistName"
            label="Dentist Name"
            placeholder="Dr. Maria Santos"
            icon="feather:user"
          />
          <AppInput
            v-model="draftFilters.email"
            label="Email Address"
            placeholder="dentist@example.com"
            icon="feather:mail"
          />
          <AppInput
            v-model="draftFilters.code"
            label="Dentist Code"
            placeholder="e.g. DXXX-0001"
            icon="feather:tag"
          />
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-slate transition hover:text-tangerine"
          @click="clearFilterFields"
        >
          <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
          Clear fields
        </button>
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section>
      <div
        class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] p-6 shadow-sm lg:p-8"
      >
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="max-w-2xl">
              <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-tangerine">
                Provider Control
              </p>
              <h1 class="mt-3 text-4xl font-black tracking-tight text-onyx">
                Dentist roster, rebuilt
              </h1>
              <p class="mt-4 text-sm leading-7 text-slate">
                Monitor provider records, review profile readiness, and manage the live dentist
                directory from one workspace.
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="openFilters">
                <Icon icon="feather:filter" class="h-4 w-4" />
                Filter roster
                <span
                  v-if="activeFilterCount"
                  class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tangerine px-1.5 text-[10px] font-bold text-white"
                >
                  {{ activeFilterCount }}
                </span>
              </AppButton>
              <router-link to="/dentists/add">
                <AppButton btn-theme="primary" class="px-5 py-3 normal-case"
                  >New dentist setup</AppButton
                >
              </router-link>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <article
              v-for="card in summaryCards"
              :key="card.label"
              class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                  {{ card.label }}
                </p>
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-xl"
                  :class="card.tint"
                >
                  <Icon :icon="card.icon" class="h-4 w-4" />
                </span>
              </div>
              <AppStatValue :loading="loading" :value="card.value" />
              <p class="mt-3 text-sm leading-6 text-slate">{{ card.note }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
            Live roster
          </p>
          <h2 class="mt-2 text-2xl font-black text-onyx">Operational dentist directory</h2>
          <p class="mt-2 text-sm text-slate">
            A denser roster view for real clinic setup work, not the older generic management
            pattern.
          </p>
        </div>
        <button
          v-if="activeFilterCount"
          type="button"
          class="text-sm font-semibold text-sapphire transition hover:text-tangerine"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>

      <div
        v-if="errorMessage"
        class="mt-5 flex flex-col gap-3 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby sm:flex-row sm:items-center sm:justify-between"
      >
        <p>{{ errorMessage }}</p>
        <button
          type="button"
          class="shrink-0 font-semibold underline underline-offset-4"
          @click="fetchDentists"
        >
          Try again
        </button>
      </div>

      <AppLoadingScreen
        v-if="loading"
        class="mt-5"
        title="Loading dentist roster"
        message="Please wait while we retrieve provider profiles, credentials, and directory details."
      />

      <div v-else class="mt-5 overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['Provider', 'Email', 'Dentist Code', 'Status', 'Added By', 'Action']"
          :total-entries="totalEntries"
          :total-pages="totalPages"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
        >
          <template #trs>
            <tr v-if="!dentists.length">
              <td colspan="6" class="w-full py-14! text-center!">
                <div class="flex w-full flex-col items-center">
                  <span
                    class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog text-smoke"
                  >
                    <Icon icon="feather:search" class="h-5 w-5" />
                  </span>
                  <p class="mt-3 font-semibold text-onyx">No dentists found</p>
                  <p class="mt-1 text-sm text-slate">Try changing or clearing your filters.</p>
                </div>
              </td>
            </tr>
            <tr
              @click="router.push(`/dentists/${dentist.dentistidno}/edit`)"
              v-for="dentist in dentists"
              v-else
              :key="dentist.dentistidno"
              class="cursor-pointer"
            >
              <td>
                <div>
                  <p class="font-semibold text-onyx text-nowrap">{{ dentist.dentistname }}</p>
                  <p class="mt-1 text-xs uppercase tracking-[0.16em] text-smoke">
                    {{ dentist.prcno || 'N/A' }}
                  </p>
                </div>
              </td>
              <td>{{ dentist.email ? dentist.email.toLocaleLowerCase() : 'N/A' }}</td>
              <td class="text-nowrap">{{ dentist.dentistcode || 'N/A' }}</td>
              <td>
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="dentistStatus(dentist.Isactive).classes"
                >
                  {{ dentistStatus(dentist.Isactive).label }}
                </span>
              </td>
              <td>{{ dentist.addedby }}</td>
              <!-- <td>
                <button type="button"
                  class="inline-flex items-center gap-2 rounded-xl bg-fog px-3 py-2 text-xs font-semibold text-slate transition hover:bg-pebble hover:text-onyx"
                  @click.stop="router.push(`/dentists/${dentist.dentistidno}/edit`)">
                  <Icon icon="feather:edit-2" class="h-4 w-4" />
                  Open
                </button>
              </td> -->
              <td class="px-5 py-4">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-3.5 py-2 text-xs font-semibold text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#fcf4e8_0%,#f3e5ce_100%)] hover:text-[#6f4a13]"
                    @click.stop="router.push(`/dentists/${dentist.dentistidno}/edit`)"
                  >
                    <Icon icon="feather:edit-2" class="size-4" />
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </AppTable>
      </div>
    </section>
  </div>
</template>
