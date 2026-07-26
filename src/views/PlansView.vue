<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, reactive, ref } from 'vue'
import {
  AppButton,
  AppDialog,
  AppInput,
  AppLoadingScreen,
  AppStatValue,
  AppTable,
} from '@/components/app'
import { usePlans } from '@/composables'

const { errorMessage, fetchPlans, loading, plans, currentPage, totalEntries, totalPages, applyFilters, filters } = usePlans()


const clearFilters = () => {
  filters.plantypeId = ''
  filters.plancode = ''
  filters.dentalPremium = ''
  filters.planClass = ''

  applyFilters()
}

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


</script>

<template>
  <AppDialog title="Filter Plans" :show="showFilterModal" confirm-label="Apply Filters" @close="showFilterModal = false"
    @confirm="confirmFilters">
    <template #dialog-content>
      <div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Plan Filters
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Narrow the directory by one or more plan values.
          </p>
        </div>

        <div class="grid gap-5">
          <AppInput v-model="filters.plantypeId" label="Plan Type ID" placeholder="e.g. 951" icon="feather:hash" />
          <AppInput v-model="filters.plancode" label="Plan Code" placeholder="e.g. XNT003" icon="feather:tag" />
          <AppInput v-model="filters.dentalPremium" label="Dental Premium 1" placeholder="e.g. 8"
            icon="feather:credit-card" />
          <AppInput v-model="filters.planClass" label="Plan Class" placeholder="e.g. PCP" icon="feather:tag" />
        </div>

        <button type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-slate transition hover:text-tangerine"
          @click="clearFilters">
          <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
          Clear fields
        </button>
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm">
      <div class="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine">
            <Icon icon="feather:shield" class="h-3.5 w-3.5" />
            Plan Reference
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">Dental Plans</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
            Review the dental plan information currently available in the system.
          </p>
        </div>

        <div class="flex items-center gap-4 rounded-[1.5rem] border border-pebble bg-white/85 px-5 py-4 shadow-sm">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-light text-emerald">
            <Icon icon="feather:eye" class="h-5 w-5" />
          </span>
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke">Access</p>
            <p class="mt-1 text-sm font-bold text-onyx">Read only</p>
          </div>
        </div>
      </div>

      <div class="grid gap-px border-t border-pebble bg-pebble sm:grid-cols-2">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Total plans</p>
          <AppStatValue :loading="loading" :value="plans.length" />
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Data status</p>
          <div class="mt-2 flex items-center gap-2 text-sm font-semibold text-onyx">
            <Icon v-if="loading" icon="feather:loader" class="h-4 w-4 animate-spin text-slate" />
            <span v-else class="h-2.5 w-2.5 rounded-full bg-emerald" />
            {{ loading ? 'Loading plans' : 'Available for viewing' }}
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm sm:p-6">
      <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Plan Directory</h2>
          <p class="mt-1 text-sm text-slate">Plan details are displayed exactly as provided.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button v-if="activeFilterCount" type="button"
            class="text-sm font-semibold text-slate transition hover:text-tangerine" @click="clearFilters">
            Clear filters
          </button>
          <AppButton btn-theme="outline" class="normal-case" @click="openFilters">
            <Icon icon="feather:filter" class="h-4 w-4" />
            Filter
            <span v-if="activeFilterCount"
              class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tangerine px-1.5 text-[10px] font-bold text-white">
              {{ activeFilterCount }}
            </span>
          </AppButton>
        </div>
      </div>

      <div v-if="errorMessage"
        class="mb-4 flex flex-col gap-3 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby sm:flex-row sm:items-center sm:justify-between">
        <p>{{ errorMessage }}</p>
        <button type="button" class="shrink-0 font-semibold underline underline-offset-4" @click="fetchPlans">
          Try again
        </button>
      </div>

      <AppLoadingScreen v-if="loading" title="Loading plans"
        message="Please wait while we retrieve the available dental plan records." />

      <div v-else class="overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable :theads="['Plan Type ID', 'Plan Code', 'Plan Class', 'Dental Premium']" :total-entries="totalEntries"
          :total-pages="totalPages" :current-page="currentPage" @update-pg-num="currentPage = $event">
          <template #trs>
            <tr v-for="plan in plans" :key="plan.PlanTypeID">
              <td>
                <span class="font-semibold text-onyx">{{ plan.PlanTypeID }}</span>
              </td>
              <td>
                <span
                  class="inline-flex rounded-full bg-sapphire-light px-3 py-1 text-xs font-bold tracking-[0.08em] text-sapphire">
                  {{ plan.PlanCode }}
                </span>
              </td>
              <td>
                <span class="font-semibold text-onyx">{{ plan.PlanClass }}</span>
              </td>
              <td>
                <span class="font-semibold text-onyx">{{ plan.DentalPrem1 }}</span>
              </td>
            </tr>
            <tr v-if="totalEntries <= 0">
              <td colspan="4" class="w-full py-14! text-center!">
                <div class="flex w-full flex-col items-center">
                  <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog text-smoke">
                    <Icon icon="feather:search" class="h-5 w-5" />
                  </span>
                  <p class="mt-3 font-semibold text-onyx">No plans found</p>
                  <p class="mt-1 text-sm text-slate">Try changing or clearing your filters.</p>
                </div>
              </td>
            </tr>
          </template>
        </AppTable>
      </div>

      <div class="mt-4 flex items-start gap-3 rounded-2xl border border-pebble bg-cloud px-4 py-3 text-sm text-slate">
        <Icon icon="feather:lock" class="mt-0.5 h-4 w-4 shrink-0 text-smoke" />
        <p>This directory is view-only. Plan records cannot be changed from this page.</p>
      </div>
    </section>
  </div>
</template>
