<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { AppButton, AppDialog, AppInput, AppTable } from '@/components/app'

const router = useRouter()
const showDialog = ref(false)
const currentPage = ref(1)
const perPage = ref(8)

const dentists = Array.from({ length: 32 }, (_, i) => ({
  id: i + 1,
  license: `PRC-${String(120450 + i).padStart(7, '0')}`,
  name: `Dr. ${['Maria Santos', 'James Lim', 'Angela Cruz', 'Carlo Reyes', 'Patricia Tan'][i % 5]}`,
  specialty: [
    'General Dentistry',
    'Orthodontics',
    'Pediatric Dentistry',
    'Oral Surgery',
    'Periodontics',
  ][i % 5],
  clinic: ['North Wing Clinic', 'Smile Studio', 'Kids Dental Room', 'Surgery Suite', 'Perio Hub'][
    i % 5
  ],
  status: ['Active', 'On Duty', 'Credential Review'][i % 3],
  chair: ['Chair 1', 'Chair 2', 'Chair 3', 'Chair 4', 'Imaging'][i % 5],
}))

const paginatedDentists = computed(() =>
  dentists.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value),
)

const summary = computed(() => [
  {
    label: 'Total providers',
    value: dentists.length,
    note: 'All dentist records in the current clinic system.',
  },
  {
    label: 'Ready for schedule',
    value: dentists.filter((dentist) => dentist.status !== 'Credential Review').length,
    note: 'Providers that can already be booked into live chairs.',
  },
  {
    label: 'Credential review',
    value: dentists.filter((dentist) => dentist.status === 'Credential Review').length,
    note: 'Records waiting for license or setup validation.',
  },
])

const quickViews = [
  { title: 'General Dentistry', count: 8, icon: 'feather:shield', tint: 'bg-sky-light text-sky' },
  {
    title: 'Orthodontics',
    count: 6,
    icon: 'feather:align-justify',
    tint: 'bg-tangerine-light text-tangerine',
  },
  { title: 'Pediatric', count: 5, icon: 'feather:heart', tint: 'bg-emerald-light text-emerald' },
]
</script>

<template>
  <AppDialog title="Filter Dentists" :show="showDialog" @close="showDialog = false">
    <template #dialog-content>
      <div class="space-y-5">
        <div class="rounded-[1.5rem] border border-pebble bg-cloud p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Roster filters
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Filter by license, specialty, clinic, or readiness state.
          </p>
        </div>
        <div class="grid gap-5">
          <AppInput label="PRC License No." placeholder="PRC-XXXXXXX" />
          <AppInput label="Provider Name" placeholder="Dr. Maria Santos" />
          <AppInput label="Specialty" placeholder="Orthodontics" />
          <AppInput label="Clinic / Chair" placeholder="North Wing Clinic" />
        </div>
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div
        class="rounded-4xl bg-[linear-gradient(140deg,#122833_0%,#1b3b49_100%)] p-6 text-white shadow-lg lg:p-8"
      >
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="max-w-2xl">
              <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-tangerine-light">
                Provider Control
              </p>
              <h1 class="mt-3 text-4xl font-black tracking-tight">Dentist roster, rebuilt</h1>
              <p class="mt-4 text-sm leading-7 text-white/68">
                This screen now behaves like a provider operations board with summary signals,
                specialty snapshots, and a more compact active roster below.
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <AppButton
                btn-theme="outline"
                class="border-white/12 bg-white/8 px-5 py-3 normal-case text-white hover:border-white/20 hover:bg-white/14 hover:text-white"
                @click="showDialog = true"
              >
                Filter roster
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
              v-for="card in summary"
              :key="card.label"
              class="rounded-[1.5rem] border border-white/10 bg-white/6 p-5"
            >
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                {{ card.label }}
              </p>
              <p class="mt-3 text-3xl font-black">{{ card.value }}</p>
              <p class="mt-3 text-sm leading-6 text-white/62">{{ card.note }}</p>
            </article>
          </div>
        </div>
      </div>

      <div class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
              Specialty mix
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Coverage snapshot</h2>
          </div>
          <Icon icon="feather:grid" class="h-5 w-5 text-slate" />
        </div>

        <div class="mt-5 grid gap-4">
          <article
            v-for="view in quickViews"
            :key="view.title"
            class="rounded-[1.5rem] border border-pebble bg-cloud p-5"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <span
                  :class="view.tint"
                  class="flex h-11 w-11 items-center justify-center rounded-2xl"
                >
                  <Icon :icon="view.icon" class="h-5 w-5" />
                </span>
                <div>
                  <h3 class="text-lg font-black text-onyx">{{ view.title }}</h3>
                  <p class="text-sm text-slate">Active provider coverage</p>
                </div>
              </div>
              <span class="text-2xl font-black text-onyx">{{ view.count }}</span>
            </div>
          </article>
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
        <button class="text-sm font-semibold text-sapphire transition hover:text-tangerine">
          Export roster
        </button>
      </div>

      <div class="mt-5 overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['Provider', 'Specialty', 'Clinic', 'Chair', 'Status', 'Action']"
          :total-entries="dentists.length"
          :total-pages="Math.ceil(dentists.length / perPage)"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
        >
          <template #trs>
            <tr
              v-for="dentist in paginatedDentists"
              :key="dentist.id"
              class="cursor-pointer"
              @click="router.push(`/dentists/${dentist.id}/edit`)"
            >
              <td>
                <div>
                  <p class="font-semibold text-onyx">{{ dentist.name }}</p>
                  <p class="mt-1 text-xs uppercase tracking-[0.16em] text-smoke">
                    {{ dentist.license }}
                  </p>
                </div>
              </td>
              <td>{{ dentist.specialty }}</td>
              <td>{{ dentist.clinic }}</td>
              <td>{{ dentist.chair }}</td>
              <td>
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    dentist.status === 'Active'
                      ? 'bg-emerald-light text-emerald'
                      : dentist.status === 'On Duty'
                        ? 'bg-sky-light text-sky'
                        : 'bg-amber-light text-amber'
                  "
                >
                  {{ dentist.status }}
                </span>
              </td>
              <td class="text-sm font-semibold text-slate">Open</td>
            </tr>
          </template>
        </AppTable>
      </div>
    </section>
  </div>
</template>
