<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AppButton, AppDialog, AppTable } from '@/components/app'
import { Icon } from '@iconify/vue'
import QRCode from 'qrcode'
import { saveAs } from 'file-saver'

const baseURL = import.meta.env.VITE_APP_MAIN_API_BASE_URL

const teachers = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: `Teacher ${i + 1}`,
  school: `School ${(i % 5) + 1}`,
  status: i % 2 === 0 ? 'Active' : 'Inactive',
}))

const showDialog = ref(false)
const currentPage = ref(1)
const perPage = ref(8)

const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  const end = start + perPage.value

  return teachers.slice(start, end)
})

const totalEntries = teachers.length
const totalPages = Math.ceil(totalEntries / perPage.value)

const statCards = computed(() => [
  {
    title: 'Total Teachers',
    value: totalEntries,
    tone: 'from-tangerine-light to-white',
    text: 'text-tangerine-dark',
  },
  {
    title: 'Active Profiles',
    value: teachers.filter((teacher) => teacher.status === 'Active').length,
    tone: 'from-sky-light to-white',
    text: 'text-sky',
  },
  {
    title: 'Pending Review',
    value: 6,
    tone: 'from-amber-light to-white',
    text: 'text-amber',
  },
])

// QR CODE
const DUMMY_ID = ref('123456789')
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const qrCodeUrl = computed(() => `${baseURL}/${DUMMY_ID.value}`)
// Handle Generate QR
async function generateQRCode() {
  if (!qrCanvas.value) return
  await QRCode.toCanvas(qrCanvas.value, qrCodeUrl.value, {
    width: 180,
    margin: 2,
  })
}

// Handle Download QR
async function downloadQR() {
  if (!qrCanvas.value) return

  qrCanvas.value.toBlob((blob) => {
    if (!blob) return

    saveAs(blob, `ppsta-qr-${DUMMY_ID.value}.png`)
  }, 'image/png')
}

onMounted(() => {
  generateQRCode()
})
</script>

<template>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_45%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="space-y-4">
          <div
            class="inline-flex items-center rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            Enrollment Overview
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Teacher Enrollment</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
              Review teacher records, keep enrollment activity visible, and give your team a cleaner
              workspace for day-to-day administration.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <AppButton
            btnTheme="primary"
            class="px-6 py-3 normal-case shadow-sm"
            @click="showDialog = true"
          >
            Enroll Teacher
          </AppButton>
          <button
            class="rounded-2xl border border-pebble bg-white px-5 py-3 text-sm font-semibold text-onyx transition hover:border-slate/40 hover:bg-fog"
          >
            Export Report
          </button>
        </div>
      </div>

      <div class="grid gap-px border-t border-pebble bg-pebble lg:grid-cols-3">
        <article
          v-for="card in statCards"
          :key="card.title"
          class="bg-linear-to-br p-5"
          :class="card.tone"
        >
          <p class="text-sm font-semibold text-slate">{{ card.title }}</p>
          <p class="mt-3 text-3xl font-black" :class="card.text">{{ card.value }}</p>
        </article>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <div class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm lg:p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-onyx">Recent Enrollments</h2>
            <p class="mt-1 text-sm text-slate">
              A quick look at the latest submitted teacher records.
            </p>
          </div>
          <button class="text-sm font-semibold text-sapphire transition hover:text-tangerine">
            View all
          </button>
        </div>

        <div class="mt-5 overflow-hidden rounded-lg border border-pebble">
          <AppTable
            :theads="['Name', 'School', 'Status']"
            :total-entries="totalEntries"
            :total-pages="totalPages"
            :current-page="currentPage"
            @update-pg-num="currentPage = $event"
          >
            <template #trs>
              <tr v-for="teacher in paginatedTeachers" :key="teacher.id">
                <td class="font-medium text-onyx">{{ teacher.name }}</td>
                <td>{{ teacher.school }}</td>
                <td>
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="
                      teacher.status === 'Active'
                        ? 'bg-emerald-light text-emerald'
                        : 'bg-ruby-light text-ruby'
                    "
                  >
                    {{ teacher.status }}
                  </span>
                </td>
              </tr>
            </template>
          </AppTable>
        </div>
      </div>

      <div class="space-y-6">
        <div class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm lg:p-6">
          <h2 class="text-xl font-bold text-onyx">Today’s Focus</h2>
          <ul class="mt-4 space-y-3 text-sm text-slate">
            <li class="rounded-2xl bg-fog px-4 py-3">
              Verify newly submitted profiles before approval.
            </li>
            <li class="rounded-2xl bg-fog px-4 py-3">
              Follow up incomplete teacher enrollment records.
            </li>
            <li class="rounded-2xl bg-fog px-4 py-3">
              Monitor image uploads and consent capture status.
            </li>
          </ul>
        </div>

        <div class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm lg:p-6">
          <h2 class="text-xl font-bold text-onyx">System Notes</h2>
          <p class="mt-3 text-sm leading-7 text-slate">
            This panel can later show announcements, reminders, or operational notes for IMS admins
            and PPSTA staff.
          </p>
        </div>
      </div>
    </section>

    <AppDialog :show="showDialog" title="Enroll Teacher" @close="showDialog = false">
      <template #dialog-content> Teacher enrollment form UI can be connected here next. </template>
    </AppDialog>
  </div>
</template>
