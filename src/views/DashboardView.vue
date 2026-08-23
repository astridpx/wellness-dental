<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AppStatValue, AppTable } from '@/components/app'
import { APP_PER_PAGE } from '@/constants/app'
import { useAuth, useDentists, usePlans, useWellnessApi } from '@/composables'
import type { ActivityItem, DirectoryRow, OverviewCard, SummaryEntityResponse } from '@/types'

const router = useRouter()
const { getStoredRoles } = useAuth()
const { request } = useWellnessApi()

const currentPage = ref(1)
const perPage = ref(APP_PER_PAGE)

const { loading: loadingDentists, totalEntries: dentistTotalEntries } = useDentists()
const { loading: loadingPlans, totalEntries: planTotalEntries } = usePlans()

const roles = computed(() => getStoredRoles())
const canViewUsers = computed(() =>
  roles.value.some((role) => ['superAdmin', 'admin', 'auditor'].includes(role)),
)
const canViewPartnerBatches = computed(() =>
  roles.value.some((role) => ['superAdmin', 'admin', 'auditor'].includes(role)),
)
const canViewBusinessPartners = computed(() =>
  roles.value.some((role) => ['superAdmin', 'admin'].includes(role)),
)

const usersCount = ref(0)
const partnerBatchCount = ref(0)
const businessPartnerCount = ref(0)

const loadingUsersCount = ref(false)
const loadingPartnerBatchCount = ref(false)
const loadingBusinessPartnerCount = ref(false)

const accessibleModuleCount = computed(() => {
  let count = 2

  if (canViewUsers.value) count += 1
  if (canViewBusinessPartners.value) count += 1
  if (canViewPartnerBatches.value) count += 1

  return count
})

const trackedRecordTotal = computed(() => {
  let total = planTotalEntries.value + dentistTotalEntries.value

  if (canViewUsers.value) total += usersCount.value
  if (canViewBusinessPartners.value) total += businessPartnerCount.value
  if (canViewPartnerBatches.value) total += partnerBatchCount.value

  return total
})

const overviewCards = computed<OverviewCard[]>(() => {
  const cards: OverviewCard[] = [
    {
      label: 'Dental plans',
      value: planTotalEntries.value,
      note: 'Plan reference records available for lookup and verification.',
      tone: 'bg-emerald-light text-emerald',
      icon: 'feather:clipboard',
      loading: loadingPlans.value,
    },
    {
      label: 'Dental providers',
      value: dentistTotalEntries.value,
      note: 'Provider profiles currently available in the dentist directory.',
      tone: 'bg-sky-light text-sky',
      icon: 'streamline-ultimate:dentistry-tooth-shield',
      loading: loadingDentists.value,
    },
    {
      label: 'Tracked records',
      value: trackedRecordTotal.value,
      note: 'Combined visible totals across the operational modules shown on this dashboard.',
      tone: 'bg-amber-light text-amber',
      icon: 'feather:database',
      loading:
        loadingPlans.value ||
        loadingDentists.value ||
        loadingUsersCount.value ||
        loadingBusinessPartnerCount.value ||
        loadingPartnerBatchCount.value,
    },
  ]

  if (canViewUsers.value) {
    cards.push({
      label: 'Staff accounts',
      value: usersCount.value,
      note: 'Employee accounts with workspace access.',
      tone: 'bg-tangerine-light text-tangerine',
      icon: 'feather:users',
      loading: loadingUsersCount.value,
    })
  } else {
    cards.push({
      label: 'Workspace access',
      value: accessibleModuleCount.value,
      note: 'Operational modules currently available in your dashboard view.',
      tone: 'bg-tangerine-light text-tangerine',
      icon: 'feather:shield',
      loading: false,
    })
  }

  if (canViewBusinessPartners.value) {
    cards.push({
      label: 'Business partners',
      value: businessPartnerCount.value,
      note: 'Saved upload companies available for controlled partner imports.',
      tone: 'bg-sapphire-light text-sapphire',
      icon: 'feather:briefcase',
      loading: loadingBusinessPartnerCount.value,
    })
  } else {
    cards.push({
      label: 'Module coverage',
      value: accessibleModuleCount.value,
      note: 'Operational directories currently visible from your current role.',
      tone: 'bg-sapphire-light text-sapphire',
      icon: 'feather:grid',
      loading: false,
    })
  }

  if (canViewPartnerBatches.value) {
    cards.push({
      label: 'Partner batches',
      value: partnerBatchCount.value,
      note: 'Imported partner-member batch records currently stored.',
      tone: 'bg-amber-light text-amber',
      icon: 'feather:upload-cloud',
      loading: loadingPartnerBatchCount.value,
    })
  } else {
    cards.push({
      label: 'Dashboard modules',
      value: accessibleModuleCount.value,
      note: 'Total operational modules represented in this dashboard.',
      tone: 'bg-cloud text-onyx',
      icon: 'feather:layout',
      loading: false,
    })
  }

  return cards
})

const directoryRows = computed<DirectoryRow[]>(() => {
  const rows: DirectoryRow[] = [
    {
      id: 'plans',
      module: 'IMS Dental Plans',
      count: planTotalEntries.value,
      status: loadingPlans.value ? 'Loading' : 'Available',
      route: '/plans',
      note: 'Reference plan records used across the workspace.',
      loading: loadingPlans.value,
    },
    {
      id: 'dentists',
      module: 'Dentist Profile',
      count: dentistTotalEntries.value,
      status: loadingDentists.value ? 'Loading' : 'Available',
      route: '/dentists',
      note: 'Provider directory and profile setup records.',
      loading: loadingDentists.value,
    },
  ]

  if (canViewUsers.value) {
    rows.push({
      id: 'users',
      module: 'Users',
      count: usersCount.value,
      status: loadingUsersCount.value ? 'Loading' : 'Available',
      route: '/users',
      note: 'Staff access and account management records.',
      loading: loadingUsersCount.value,
    })
  }

  if (canViewBusinessPartners.value) {
    rows.push({
      id: 'business-partners',
      module: 'Business Partners',
      count: businessPartnerCount.value,
      status: loadingBusinessPartnerCount.value ? 'Loading' : 'Available',
      route: '/business-partners',
      note: 'Controlled company list used by partner uploads.',
      loading: loadingBusinessPartnerCount.value,
    })
  }

  if (canViewPartnerBatches.value) {
    rows.push({
      id: 'partner-members',
      module: 'Business Partner Uploads',
      count: partnerBatchCount.value,
      status: loadingPartnerBatchCount.value ? 'Loading' : 'Available',
      route: '/partner-members',
      note: 'Upload batch history for partner member files.',
      loading: loadingPartnerBatchCount.value,
    })
  }

  return rows
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return directoryRows.value.slice(start, start + perPage.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(directoryRows.value.length / perPage.value)),
)

const actionRail = computed<ActivityItem[]>(() => {
  const items: ActivityItem[] = [
    {
      title: 'Plan library is loaded',
      detail: `${planTotalEntries.value} plan records are available for verification and lookup.`,
      icon: 'feather:book-open',
    },
    {
      title: 'Provider directory is ready',
      detail: `${dentistTotalEntries.value} provider profiles are currently available in the workspace.`,
      icon: 'feather:user-check',
    },
  ]

  if (canViewUsers.value) {
    items.unshift({
      title: 'Staff accounts are active',
      detail: `${usersCount.value} user accounts are currently tracked in the system.`,
      icon: 'feather:users',
    })
  }

  if (canViewBusinessPartners.value) {
    items.push({
      title: 'Partner upload sources are controlled',
      detail: `${businessPartnerCount.value} business partners are ready for import selection.`,
      icon: 'feather:briefcase',
    })
  }

  return items
})

const summaryFeed = computed<ActivityItem[]>(() => {
  const items: ActivityItem[] = [
    {
      title: 'Membership data removed',
      detail: 'This dashboard now focuses on operational setup and admin directories only.',
      icon: 'feather:slash',
    },
    {
      title: 'Live counts only',
      detail:
        'Cards and tables here use counts from existing pages instead of placeholder figures.',
      icon: 'feather:refresh-cw',
    },
  ]

  if (canViewPartnerBatches.value) {
    items.push({
      title: 'Partner import history is visible',
      detail: `${partnerBatchCount.value} partner-member batches are available for review.`,
      icon: 'feather:archive',
    })
  }

  return items
})

async function fetchUsersCount() {
  if (!canViewUsers.value) return

  loadingUsersCount.value = true
  const result = await request<SummaryEntityResponse[]>('/wellness/users?page=1&perPage=1')
  usersCount.value = result.ok ? Number(result.metadata?.totalEntries || 0) : 0
  loadingUsersCount.value = false
}

async function fetchPartnerBatchCount() {
  if (!canViewPartnerBatches.value) return

  loadingPartnerBatchCount.value = true
  const result = await request<SummaryEntityResponse[]>(
    '/wellness/partnerMembers/batches?page=1&perPage=1',
  )
  partnerBatchCount.value = result.ok ? Number(result.metadata?.totalEntries || 0) : 0
  loadingPartnerBatchCount.value = false
}

async function fetchBusinessPartnerCount() {
  if (!canViewBusinessPartners.value) return

  loadingBusinessPartnerCount.value = true
  const result = await request<SummaryEntityResponse[]>('/wellness/businessPartners?perPage=100')
  businessPartnerCount.value = result.ok && Array.isArray(result.data) ? result.data.length : 0
  loadingBusinessPartnerCount.value = false
}

function openRoute(path: string) {
  void router.push(path)
}

onMounted(() => {
  void fetchUsersCount()
  void fetchPartnerBatchCount()
  void fetchBusinessPartnerCount()
})
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
      <div
        class="relative overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] p-6 shadow-sm lg:p-8"
      >
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute -left-16 top-0 h-48 w-48 rounded-full bg-sapphire/6 blur-3xl" />
          <div class="absolute right-0 top-10 h-64 w-64 rounded-full bg-tangerine/10 blur-3xl" />
          <div class="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-sky/8 blur-3xl" />
        </div>

        <div class="relative flex flex-col gap-8">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div class="max-w-2xl">
              <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-tangerine">
                Internal Records Dashboard
              </p>
              <h1 class="mt-3 max-w-3xl text-4xl font-black tracking-tight text-onyx xl:text-5xl">
                A cleaner command view for operational records.
              </h1>
              <p class="mt-4 max-w-2xl text-base leading-7 text-slate">
                This dashboard focuses on setup, directory, and partner-upload records without
                showing membership data.
              </p>
            </div>

            <div
              class="w-full max-w-70 rounded-[1.6rem] border border-pebble bg-[linear-gradient(145deg,#fff8ea_0%,#ffffff_100%)] p-5 shadow-sm"
            >
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Workspace mode
              </p>
              <p class="mt-2 text-lg font-black text-onyx">Operational overview</p>
              <p class="mt-2 text-sm leading-6 text-slate">
                Cards and summaries here are based on directories and admin modules already in the
                app.
              </p>
              <button
                type="button"
                class="mt-4 inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-3.5 py-2 text-xs font-semibold text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#fcf4e8_0%,#f3e5ce_100%)] hover:text-[#6f4a13]"
                @click="openRoute('/plans')"
              >
                <Icon icon="feather:external-link" class="size-4" />
                Open Plans
              </button>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="card in overviewCards"
              :key="card.label"
              class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-smoke">
                  {{ card.label }}
                </p>
                <span :class="card.tone" class="rounded-2xl p-2">
                  <Icon :icon="card.icon" class="size-4" />
                </span>
              </div>
              <AppStatValue :loading="card.loading" :value="card.value" />
              <p class="mt-3 text-sm leading-6 text-slate">{{ card.note }}</p>
            </article>
          </div>
        </div>
      </div>

      <div class="grid gap-4">
        <div class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Today’s focus
              </p>
              <h2 class="mt-2 text-2xl font-black text-onyx">Action rail</h2>
            </div>
            <Icon icon="feather:target" class="h-6 w-6 text-tangerine" />
          </div>
          <div class="mt-5 space-y-3">
            <div
              v-for="item in actionRail"
              :key="item.title"
              class="rounded-2xl border border-pebble bg-cloud px-4 py-4"
            >
              <div class="flex items-start gap-3">
                <div class="rounded-xl bg-white p-2 text-tangerine shadow-sm">
                  <Icon :icon="item.icon" class="size-4" />
                </div>
                <div>
                  <p class="text-sm font-bold text-onyx">{{ item.title }}</p>
                  <p class="mt-1 text-sm leading-6 text-slate">{{ item.detail }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="rounded-4xl border border-pebble bg-[linear-gradient(135deg,#eef3ff_0%,#ffffff_100%)] p-6 shadow-sm"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
            Workspace notes
          </p>
          <h2 class="mt-2 text-2xl font-black text-onyx">Internal monitoring</h2>
          <div class="mt-5 space-y-3">
            <div
              v-for="item in summaryFeed"
              :key="item.title"
              class="rounded-[1.3rem] border border-pebble bg-white px-4 py-4 shadow-sm"
            >
              <div class="flex items-start gap-3">
                <div class="rounded-xl bg-tangerine-light p-2 text-tangerine">
                  <Icon :icon="item.icon" class="size-4" />
                </div>
                <div>
                  <p class="text-sm font-bold text-onyx">{{ item.title }}</p>
                  <p class="mt-1 text-sm leading-6 text-slate">{{ item.detail }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
            Live directories
          </p>
          <h2 class="mt-2 text-2xl font-black text-onyx">Operational module totals</h2>
          <p class="mt-2 text-sm text-slate">
            A quick view of the non-membership directories and upload modules available in this
            workspace.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-3.5 py-2 text-xs font-semibold text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#fcf4e8_0%,#f3e5ce_100%)] hover:text-[#6f4a13]"
          @click="openRoute('/dentists')"
        >
          <Icon icon="feather:external-link" class="size-4" />
          Open Providers
        </button>
      </div>

      <div class="mt-5 overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['Module', 'Count', 'Status', 'Notes', 'Action']"
          :total-entries="directoryRows.length"
          :total-pages="totalPages"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
        >
          <template #trs>
            <tr v-for="row in paginatedRows" :key="row.id">
              <td class="font-medium text-onyx">{{ row.module }}</td>
              <td>
                <span v-if="row.loading" class="text-slate">Loading...</span>
                <span v-else class="font-semibold text-onyx">{{ row.count }}</span>
              </td>
              <td>
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="row.loading ? 'bg-fog text-slate' : 'bg-emerald-light text-emerald'"
                >
                  {{ row.status }}
                </span>
              </td>
              <td>{{ row.note }}</td>
              <td>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-3.5 py-2 text-xs font-semibold text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#fcf4e8_0%,#f3e5ce_100%)] hover:text-[#6f4a13]"
                  @click="openRoute(row.route)"
                >
                  <Icon icon="feather:external-link" class="size-4" />
                  Open
                </button>
              </td>
            </tr>
          </template>
        </AppTable>
      </div>
    </section>
  </div>
</template>
