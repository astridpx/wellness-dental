import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useWellnessApi } from './useWellnessApi'

export type PasswordResetUserRow = {
  id: number
  userNo: string
  name: string
  primaryRole: string
  roles?: string[]
  email: string
  phone: string | null
  isActive?: boolean
  status?: 'Active' | 'Inactive'
  mustChangePassword?: boolean
}

export function usePasswordResetAccounts() {
  const { request } = useWellnessApi()

  const loading = ref(true)
  const errorMessage = ref('')
  const users = ref<PasswordResetUserRow[]>([])
  const currentPage = ref(1)
  const perPage = ref(10)
  const totalEntries = ref(0)
  const totalPages = ref(1)

  const filters = reactive({
    search: '',
  })

  const activeResetCount = computed(
    () => users.value.filter((user) => (user.status || (user.isActive ? 'Active' : 'Inactive')) === 'Active').length,
  )

  async function fetchUsers() {
    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: String(perPage.value),
      mustChangePassword: 'true',
    })

    if (filters.search.trim()) params.set('name', filters.search.trim())

    const result = await request<PasswordResetUserRow[]>(`/wellness/users?${params.toString()}`)

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load password reset accounts.'
      loading.value = false
      return
    }

    const allUsers = Array.isArray(result.data) ? result.data : []
    users.value = allUsers.filter((user) => user.mustChangePassword !== false)
    totalEntries.value = Number(result.metadata?.totalEntries || users.value.length || 0)
    totalPages.value = Number(result.metadata?.totalPages || 1)
    loading.value = false
  }

  function applyFilters() {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }

    void fetchUsers()
  }

  onMounted(() => {
    void fetchUsers()
  })

  watch(currentPage, () => {
    void fetchUsers()
  })

  return {
    activeResetCount,
    applyFilters,
    currentPage,
    errorMessage,
    filters,
    loading,
    totalEntries,
    totalPages,
    users,
  }
}
