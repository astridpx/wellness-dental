import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { RoleOption, UserRow } from '@/types'
import { useWellnessApi } from './useWellnessApi'

export function useUsersList() {
  const { request } = useWellnessApi()

  const loading = ref(true)
  const errorMessage = ref('')
  const users = ref<UserRow[]>([])
  const roles = ref<RoleOption[]>([])
  const currentPage = ref(1)
  const perPage = ref(10)
  const totalEntries = ref(0)
  const totalPages = ref(1)

  const filters = reactive({
    userNo: '',
    name: '',
    email: '',
    role: '',
  })

  const accessRoleCount = computed(() => roles.value.length)

  async function fetchRoles() {
    const result = await request<RoleOption[]>('/wellness/roles')
    if (!result.ok) return

    roles.value = Array.isArray(result.data) ? result.data : []
  }

  async function fetchUsers() {
    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: String(perPage.value),
    })

    if (filters.userNo) params.set('userNo', filters.userNo)
    if (filters.name) params.set('name', filters.name)
    if (filters.email) params.set('email', filters.email)
    if (filters.role) params.set('role', filters.role)

    const result = await request<UserRow[]>(`/wellness/users?${params.toString()}`)

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load users.'
      loading.value = false
      return
    }

    users.value = Array.isArray(result.data) ? result.data : []
    totalEntries.value = Number(result.metadata?.totalEntries || 0)
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

  onMounted(async () => {
    await fetchRoles()
    await fetchUsers()
  })

  watch(currentPage, () => {
    void fetchUsers()
  })

  return {
    accessRoleCount,
    applyFilters,
    currentPage,
    errorMessage,
    filters,
    loading,
    roles,
    totalEntries,
    totalPages,
    users,
  }
}
