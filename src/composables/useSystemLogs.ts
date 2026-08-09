import { computed, onMounted, reactive, ref, watch } from 'vue'
import { APP_PER_PAGE } from '@/constants/app'
import type { SystemLogRow } from '@/types'
import { useWellnessApi } from './useWellnessApi'

export function useSystemLogs() {
  const { request } = useWellnessApi()

  const logs = ref<SystemLogRow[]>([])
  const loading = ref(true)
  const errorMessage = ref('')
  const currentPage = ref(1)
  const perPage = ref(APP_PER_PAGE)
  const totalEntries = ref(0)
  const totalPages = ref(1)

  const filters = reactive({
    activity: '',
  })

  const successCount = computed(() => logs.value.filter((log) => log.success).length)

  async function fetchLogs() {
    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: String(perPage.value),
    })

    if (filters.activity) params.set('activity', filters.activity)

    const result = await request<SystemLogRow[]>(`/wellness/logs/system?${params.toString()}`)

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load system logs.'
      loading.value = false
      return
    }

    logs.value = Array.isArray(result.data) ? result.data : []
    totalEntries.value = Number(result.metadata?.totalEntries || 0)
    totalPages.value = Number(result.metadata?.totalPages || 1)
    loading.value = false
  }

  function applyFilters() {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }

    void fetchLogs()
  }

  onMounted(() => {
    void fetchLogs()
  })

  watch(currentPage, () => {
    void fetchLogs()
  })

  return {
    applyFilters,
    currentPage,
    errorMessage,
    filters,
    loading,
    logs,
    successCount,
    totalEntries,
    totalPages,
  }
}
