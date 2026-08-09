import { computed, onMounted, reactive, ref, watch } from 'vue'
import { APP_PER_PAGE } from '@/constants/app'
import type { UserLogRow } from '@/types'
import { useWellnessApi } from './useWellnessApi'

export function useUserLogs() {
  const { request } = useWellnessApi()

  const logs = ref<UserLogRow[]>([])
  const loading = ref(true)
  const errorMessage = ref('')
  const currentPage = ref(1)
  const perPage = ref(APP_PER_PAGE)
  const totalEntries = ref(0)
  const totalPages = ref(1)

  const filters = reactive({
    activity: '',
    email: '',
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
    if (filters.email) params.set('email', filters.email)

    const result = await request<UserLogRow[]>(`/wellness/logs/user?${params.toString()}`)

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load user logs.'
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
