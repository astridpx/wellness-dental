<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { AppTable, AppButton, AppDialog, AppInput, AppLoadingScreen } from '@/components/app'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuth } from '@/composables'

type SystemLogRow = {
  id: number
  createdAt: string
  activity: string
  success: boolean
}

const { getAuthHeaders, logout } = useAuth()
const baseURL = import.meta.env.VITE_APP_MAIN_API_BASE_URL

const logs = ref<SystemLogRow[]>([])
const showDialog = ref(false)
const loading = ref(true)
const errorMessage = ref('')
const currentPage = ref(1)
const perPage = ref(10)
const totalEntries = ref(0)
const totalPages = ref(1)

const filters = reactive({
  activity: '',
})

const successCount = computed(() => logs.value.filter((log) => log.success).length)

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function handleApiError(response: Response) {
  if (response.status === 401 || response.status === 403) {
    await logout(true)
    return true
  }

  return false
}

async function fetchLogs() {
  loading.value = true
  errorMessage.value = ''

  const params = new URLSearchParams({
    page: String(currentPage.value),
    perPage: String(perPage.value),
  })

  if (filters.activity) params.set('activity', filters.activity)

  try {
    const res = await fetch(`${baseURL}/wellness/logs/system?${params.toString()}`, {
      headers: getAuthHeaders(false),
    })

    if (await handleApiError(res)) return

    const obj = await res.json()
    if (!res.ok) {
      errorMessage.value = obj.error || 'Unable to load system logs.'
      return
    }

    logs.value = Array.isArray(obj.data) ? obj.data : []
    totalEntries.value = Number(obj.metadata?.totalEntries || 0)
    totalPages.value = Number(obj.metadata?.totalPages || 1)
  } catch {
    errorMessage.value = 'Unable to connect to the server.'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  currentPage.value = 1
  showDialog.value = false
  void fetchLogs()
}

watch(currentPage, () => {
  void fetchLogs()
})

onMounted(async () => {
  await fetchLogs()
})
</script>

<template>
  <AppDialog
    title="Filter System Logs"
    :show="showDialog"
    @close="showDialog = false"
    @confirm="applyFilters"
  >
    <template #dialog-content>
      <div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-sky/15 bg-[linear-gradient(135deg,#f3f8ff_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-sky">Filter Logs</p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Search system-level records to inspect platform behavior and technical events.
          </p>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate">Activity</label>
          <AppInput v-model="filters.activity" placeholder="Search system logs..." />
        </div>
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="feather:activity" class="size-3.5" /> System audit
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">System Logs</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
            Track platform events, session changes, and operational responses from one consistent
            audit workspace.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <AppButton btn-theme="primary" class="px-5 py-3 normal-case" @click="showDialog = true">
            <Icon icon="feather:filter" class="size-4" /> Filter logs
          </AppButton>
        </div>
      </div>
      <div class="grid gap-px border-t border-pebble bg-pebble md:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Visible records</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ logs.length }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Total entries</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ totalEntries }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
            Successful events
          </p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ successCount }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">System Activity</h2>
          <p class="mt-1 text-sm text-slate">
            Browse the latest technical and operational log entries.
          </p>
        </div>
        <p class="text-sm font-medium text-slate">Showing recent entries</p>
      </div>

      <p v-if="errorMessage" class="mb-4 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
        {{ errorMessage }}
      </p>

      <div v-if="loading">
        <AppLoadingScreen
          title="Loading system logs"
          message="Please wait while we gather platform events, technical activity, and audit trail entries."
        />
      </div>

      <div v-else class="overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['Date', 'Activity', 'Status']"
          :total-entries="totalEntries"
          :total-pages="totalPages"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
        >
          <template #trs>
            <tr v-if="!logs.length">
              <td colspan="3" class="text-center text-slate">No system logs found.</td>
            </tr>
            <tr v-for="log in logs" v-else :key="log.id">
              <td class="whitespace-nowrap text-sm text-slate">{{ formatDate(log.createdAt) }}</td>
              <td class="font-medium text-onyx">{{ log.activity }}</td>
              <td>
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="log.success ? 'bg-emerald-light text-emerald' : 'bg-ruby-light text-ruby'"
                >
                  {{ log.success ? 'Success' : 'Failed' }}
                </span>
              </td>
            </tr>
          </template>
        </AppTable>
      </div>
    </section>
  </div>
</template>
