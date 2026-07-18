<script setup lang="ts">
import { AppTable, AppButton, AppDialog, AppInput } from '@/components/app'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showDialog = ref(false)
const currentPage = ref(1)
const perPage = ref(10)
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
  email: `dentist${i + 1}@dentalcare.com`,
  phone: `0917 555 ${String(1000 + i).slice(-4)}`,
}))
const paginatedDentists = computed(() =>
  dentists.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value),
)
const totalEntries = dentists.length
const totalPages = Math.ceil(totalEntries / perPage.value)
</script>

<template>
  <AppDialog title="Filter Dentists" :show="showDialog" @close="showDialog = false"
    ><template #dialog-content
      ><div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Search Filters
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Search dentists by license number, name, specialty, or contact details.
          </p>
        </div>
        <div class="grid gap-5">
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">PRC License No.</label
            ><AppInput placeholder="PRC-XXXXXXX" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Name</label
            ><AppInput placeholder="Dr. Maria Santos" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Specialty</label
            ><AppInput placeholder="General Dentistry" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Email</label
            ><AppInput placeholder="email@example.com" />
          </div>
        </div></div></template
  ></AppDialog>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_45%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="space-y-4">
          <div
            class="inline-flex items-center rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            Provider Directory
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Dentists</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
              Review dentist records, keep professional credentials organized, and prepare data for
              clinic operations.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="showDialog = true"
            >Filter</AppButton
          ><AppButton btn-theme="outline" class="px-5 py-3 normal-case">Export</AppButton
          ><router-link to="/dentists/add"
            ><AppButton btn-theme="primary" class="px-5 py-3 normal-case"
              >Add Dentist</AppButton
            ></router-link
          >
        </div>
      </div>
      <div class="grid gap-px border-t border-pebble bg-pebble md:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Total Dentists</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ totalEntries }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Per Page</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ perPage }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Coverage</p>
          <p class="mt-2 text-sm font-medium leading-6 text-onyx">
            Dentist records include license credentials, clinical specialties, and contact details.
          </p>
        </div>
      </div>
    </section>
    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5">
        <h2 class="text-xl font-black text-onyx">Dentist List</h2>
        <p class="mt-1 text-sm text-slate">Browse and manage dentist records below.</p>
      </div>
      <div class="overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['License #', 'Name', 'Specialty', 'Email', 'Phone', 'Action']"
          :total-entries="totalEntries"
          :total-pages="totalPages"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
          ><template #trs
            ><tr
              v-for="dentist in paginatedDentists"
              :key="dentist.id"
              class="cursor-pointer"
              @click="router.push(`/dentists/${dentist.id}/edit`)"
            >
              <td class="font-medium text-onyx">{{ dentist.license }}</td>
              <td>{{ dentist.name }}</td>
              <td>{{ dentist.specialty }}</td>
              <td>{{ dentist.email }}</td>
              <td>{{ dentist.phone }}</td>
              <td class="text-sm font-semibold text-slate">Edit</td>
            </tr></template
          ></AppTable
        >
      </div>
    </section>
  </div>
</template>
