<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import QRCode from 'qrcode'
import { saveAs } from 'file-saver'
import { AppButton, AppDialog, AppTable } from '@/components/app'

const baseURL = import.meta.env.VITE_APP_MAIN_API_BASE_URL

const showDialog = ref(false)
const currentPage = ref(1)
const perPage = ref(5)
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const clinicCode = ref('IMS-DENTAL-CHECKIN')
const qrCodeUrl = computed(() => `${baseURL}/${clinicCode.value}`)

const readinessCards = [
  {
    label: 'Provider setup',
    value: '92%',
    note: 'Licenses and specialties verified for active roster.',
  },
  {
    label: 'Chair utilization',
    value: '14/18',
    note: 'Chairs reserved across morning and afternoon blocks.',
  },
  {
    label: 'Pending collections',
    value: '₱12,450',
    note: 'Open balances waiting for front-desk follow-up.',
  },
]

const workflowBoard = [
  {
    title: 'Credential review',
    count: 3,
    tone: 'bg-amber-light text-amber',
    note: 'Dentists waiting for final compliance checks.',
  },
  {
    title: 'Ready to schedule',
    count: 21,
    tone: 'bg-emerald-light text-emerald',
    note: 'Providers fully mapped to rooms and treatment types.',
  },
  {
    title: 'Front desk escalations',
    count: 4,
    tone: 'bg-sky-light text-sky',
    note: 'Cases needing payment coding or schedule clarification.',
  },
]

const todaySchedule = [
  {
    id: 1,
    patient: 'Ariana Torres',
    dentist: 'Dr. Maria Santos',
    chair: 'Chair 2',
    service: 'Prophylaxis',
    status: 'Confirmed',
  },
  {
    id: 2,
    patient: 'Liam Reyes',
    dentist: 'Dr. James Lim',
    chair: 'Chair 5',
    service: 'Ortho Adjustment',
    status: 'In Chair',
  },
  {
    id: 3,
    patient: 'Nina Cruz',
    dentist: 'Dr. Angela Cruz',
    chair: 'Chair 1',
    service: 'Extraction',
    status: 'Pending',
  },
  {
    id: 4,
    patient: 'Evan Tan',
    dentist: 'Dr. Patricia Tan',
    chair: 'Imaging',
    service: 'Dental X-ray',
    status: 'Confirmed',
  },
  {
    id: 5,
    patient: 'Mika Santos',
    dentist: 'Dr. Carlo Reyes',
    chair: 'Chair 4',
    service: 'Consultation',
    status: 'Pending',
  },
  {
    id: 6,
    patient: 'Rico Valdez',
    dentist: 'Dr. Maria Santos',
    chair: 'Chair 2',
    service: 'Restoration',
    status: 'Confirmed',
  },
  {
    id: 7,
    patient: 'Aly Gomez',
    dentist: 'Dr. Angela Cruz',
    chair: 'Pediatric',
    service: 'Cleaning',
    status: 'In Chair',
  },
]

const actionRail = [
  'Lock dentist specialties before publishing next week schedules.',
  'Map every treatment code to payment modes in options.',
  'Refresh reception QR handoff if intake routing changed.',
]

const paginatedSchedule = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return todaySchedule.slice(start, start + perPage.value)
})

async function generateQRCode() {
  if (!qrCanvas.value) return
  await QRCode.toCanvas(qrCanvas.value, qrCodeUrl.value, {
    width: 180,
    margin: 2,
    color: { dark: '#122833', light: '#ffffff' },
  })
}

function downloadQR() {
  if (!qrCanvas.value) return

  qrCanvas.value.toBlob((blob) => {
    if (!blob) return
    saveAs(blob, `ims-dental-checkin-${clinicCode.value}.png`)
  }, 'image/png')
}

onMounted(generateQRCode)
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
      <div class="overflow-hidden rounded-4xl bg-[#122833] p-6 text-white shadow-lg lg:p-8">
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div class="max-w-2xl">
              <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-tangerine-light">
                Dentist Setup Board
              </p>
              <h1 class="mt-3 text-4xl font-black tracking-tight">A new clinic command layout</h1>
              <p class="mt-4 text-sm leading-7 text-white/68">
                This dashboard is now structured like an operations room: readiness signals up top,
                workflow lanes in the middle, and daily clinical movement below.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <AppButton
                btn-theme="primary"
                class="px-6 py-3 normal-case shadow-sm"
                @click="showDialog = true"
              >
                Check-In QR
              </AppButton>
              <button
                class="rounded-2xl border border-white/14 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                Export Shift Summary
              </button>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <article
              v-for="card in readinessCards"
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
          class="rounded-4xl border border-pebble bg-[linear-gradient(135deg,#e8faf7_0%,#ffffff_100%)] p-6 shadow-sm"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
            Clinic signal
          </p>
          <h2 class="mt-2 text-2xl font-black text-onyx">Patient intake gateway</h2>
          <p class="mt-3 text-sm leading-6 text-slate">
            Keep this QR ready at reception so the redesigned flow also has a clear physical entry
            point.
          </p>
          <div class="mt-5 flex items-center gap-4">
            <div class="rounded-[1.5rem] bg-white p-3 shadow-sm">
              <canvas ref="qrCanvas" />
            </div>
            <button
              class="rounded-2xl bg-onyx px-4 py-3 text-sm font-semibold text-white transition hover:bg-sapphire"
              @click="downloadQR"
            >
              Download QR
            </button>
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
            <h2 class="mt-2 text-2xl font-black text-onyx">Provider pipeline</h2>
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
              Live clinic flow
            </p>
            <h2 class="mt-2 text-2xl font-black text-onyx">Chairside schedule</h2>
            <p class="mt-2 text-sm text-slate">
              A denser operational view instead of the old generic dashboard table.
            </p>
          </div>
          <button class="text-sm font-semibold text-sapphire transition hover:text-tangerine">
            Open full schedule
          </button>
        </div>

        <div class="mt-5 overflow-hidden rounded-[1.5rem] border border-pebble">
          <AppTable
            :theads="['Patient', 'Dentist', 'Chair', 'Service', 'Status']"
            :total-entries="todaySchedule.length"
            :total-pages="Math.ceil(todaySchedule.length / perPage)"
            :current-page="currentPage"
            @update-pg-num="currentPage = $event"
          >
            <template #trs>
              <tr v-for="schedule in paginatedSchedule" :key="schedule.id">
                <td class="font-medium text-onyx">{{ schedule.patient }}</td>
                <td>{{ schedule.dentist }}</td>
                <td>{{ schedule.chair }}</td>
                <td>{{ schedule.service }}</td>
                <td>
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="
                      schedule.status === 'Confirmed'
                        ? 'bg-emerald-light text-emerald'
                        : schedule.status === 'In Chair'
                          ? 'bg-sky-light text-sky'
                          : 'bg-amber-light text-amber'
                    "
                  >
                    {{ schedule.status }}
                  </span>
                </td>
              </tr>
            </template>
          </AppTable>
        </div>
      </div>
    </section>

    <AppDialog :show="showDialog" title="Clinic Check-In QR" @close="showDialog = false">
      <template #dialog-content>
        <div class="space-y-4 text-center">
          <p class="text-sm leading-6 text-slate">
            Display this code at reception so patients can open the clinic intake or check-in flow.
          </p>
          <div class="flex justify-center rounded-[1.5rem] bg-fog p-5">
            <canvas ref="qrCanvas" />
          </div>
          <div class="flex justify-center">
            <AppButton btn-theme="primary" class="px-5 py-3 normal-case" @click="downloadQR">
              Download QR
            </AppButton>
          </div>
        </div>
      </template>
    </AppDialog>
  </div>
</template>
