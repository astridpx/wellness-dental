<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { AppTable } from '@/components/app'

const currentPage = ref(1)
const perPage = ref(5)

const overviewCards = [
  {
    label: 'Recorded procedures',
    value: '148',
    note: 'Treatment and service records logged this week.',
    tone: 'bg-sapphire-light text-sapphire',
    icon: 'feather:clipboard',
  },
  {
    label: 'Pending records',
    value: '12',
    note: 'Entries waiting for review, correction, or completion.',
    tone: 'bg-amber-light text-amber',
    icon: 'feather:clock',
  },
  {
    label: 'Collection records',
    value: '₱86,200',
    note: 'Recorded payment activity across cash, card, and benefit settlements.',
    tone: 'bg-emerald-light text-emerald',
    icon: 'feather:credit-card',
  },
]

const workflowBoard = [
  {
    title: 'Records for review',
    count: 6,
    note: 'Entries that still need coding, verification, or final approval.',
    tone: 'bg-amber-light text-amber',
  },
  {
    title: 'Ready for posting',
    count: 18,
    note: 'Completed records prepared for ledger, claims, or reporting handoff.',
    tone: 'bg-emerald-light text-emerald',
  },
  {
    title: 'Follow-up needed',
    count: 4,
    note: 'Cases with missing details, inactive setup mappings, or mismatched amounts.',
    tone: 'bg-ruby-light text-ruby',
  },
]

const actionRail = [
  'Review procedure mappings for items added in the setup library.',
  'Complete incomplete treatment records before end-of-day reporting.',
  'Verify that payment mode records align with the latest internal collections.',
]

const recentRecords = [
  {
    id: 1,
    patient: 'Ariana Torres',
    provider: 'Dr. Maria Santos',
    service: 'Oral Prophylaxis',
    amount: '₱1,200',
    status: 'Recorded',
  },
  {
    id: 2,
    patient: 'Liam Reyes',
    provider: 'Dr. James Lim',
    service: 'Consultation',
    amount: '₱800',
    status: 'Pending Review',
  },
  {
    id: 3,
    patient: 'Nina Cruz',
    provider: 'Dr. Angela Cruz',
    service: 'Extraction',
    amount: '₱1,500',
    status: 'Recorded',
  },
  {
    id: 4,
    patient: 'Evan Tan',
    provider: 'Dr. Patricia Tan',
    service: 'Dental X-ray',
    amount: '₱650',
    status: 'Posted',
  },
  {
    id: 5,
    patient: 'Mika Santos',
    provider: 'Dr. Carlo Reyes',
    service: 'Cleaning',
    amount: '₱1,200',
    status: 'Pending Review',
  },
  {
    id: 6,
    patient: 'Rico Valdez',
    provider: 'Dr. Maria Santos',
    service: 'Restoration',
    amount: '₱2,300',
    status: 'Recorded',
  },
  {
    id: 7,
    patient: 'Aly Gomez',
    provider: 'Dr. Angela Cruz',
    service: 'Cleaning',
    amount: '₱1,200',
    status: 'Posted',
  },
]

const summaryFeed = [
  {
    title: 'Records synchronization',
    detail: 'Procedure, benefit, and payment mode setup is aligned with the internal recording flow.',
    icon: 'feather:refresh-cw',
  },
  {
    title: 'Internal-use only',
    detail: 'This workspace is focused on staff recording, verification, and reporting, not patient self-service.',
    icon: 'feather:lock',
  },
  {
    title: 'Audit readiness',
    detail: 'User logs and system logs are available for tracing who updated internal entries.',
    icon: 'feather:shield',
  },
]

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return recentRecords.slice(start, start + perPage.value)
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
                A cleaner command view for recording and monitoring.
              </h1>
              <p class="mt-4 max-w-2xl text-base leading-7 text-slate">
                This dashboard is focused on internal work: recording procedures, checking payment
                entries, verifying setup dependencies, and keeping operations ready for reporting.
              </p>
            </div>

            <div
              class="w-full max-w-[260px] rounded-[1.6rem] border border-pebble bg-[linear-gradient(145deg,#fff8ea_0%,#ffffff_100%)] p-5 shadow-sm"
            >
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Workspace mode
              </p>
              <p class="mt-2 text-lg font-black text-onyx">Internal use only</p>
              <p class="mt-2 text-sm leading-6 text-slate">
                Built for staff recording, review, and administrative tracking.
              </p>
              <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-tangerine-light px-3 py-1 text-xs font-semibold text-tangerine">
                <span class="size-1.5 rounded-full bg-tangerine" />
                Staff-only workspace
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
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
              <p class="mt-3 text-3xl font-black text-onyx">{{ card.value }}</p>
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
              :key="item"
              class="rounded-2xl border border-pebble bg-cloud px-4 py-4 text-sm leading-6 text-onyx"
            >
              {{ item }}
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

    <section class="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
              Workflow lanes
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Recording pipeline</h2>
          </div>
          <Icon icon="feather:git-branch" class="h-5 w-5 text-slate" />
        </div>

        <div class="mt-5 space-y-4">
          <article
            v-for="lane in workflowBoard"
            :key="lane.title"
            class="rounded-[1.5rem] border border-pebble bg-cloud p-5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-lg font-black text-onyx">{{ lane.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-slate">{{ lane.note }}</p>
              </div>
              <span :class="lane.tone" class="rounded-full px-3 py-1 text-sm font-bold">
                {{ lane.count }}
              </span>
            </div>
          </article>
        </div>
      </div>

      <div class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
              Recent activity
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Recorded entries</h2>
            <p class="mt-2 text-sm text-slate">
              A live internal view of recently logged treatments, providers, and recorded amounts.
            </p>
          </div>
          <button class="text-sm font-semibold text-sapphire transition hover:text-tangerine">
            Open full records
          </button>
        </div>

        <div class="mt-5 overflow-hidden rounded-[1.5rem] border border-pebble">
          <AppTable
            :theads="['Patient', 'Provider', 'Service', 'Amount', 'Status']"
            :total-entries="recentRecords.length"
            :total-pages="Math.ceil(recentRecords.length / perPage)"
            :current-page="currentPage"
            @update-pg-num="currentPage = $event"
          >
            <template #trs>
              <tr v-for="record in paginatedRecords" :key="record.id">
                <td class="font-medium text-onyx">{{ record.patient }}</td>
                <td>{{ record.provider }}</td>
                <td>{{ record.service }}</td>
                <td>{{ record.amount }}</td>
                <td>
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="
                      record.status === 'Recorded'
                        ? 'bg-emerald-light text-emerald'
                        : record.status === 'Posted'
                          ? 'bg-sky-light text-sky'
                          : 'bg-amber-light text-amber'
                    "
                  >
                    {{ record.status }}
                  </span>
                </td>
              </tr>
            </template>
          </AppTable>
        </div>
      </div>
    </section>
  </div>
</template>
