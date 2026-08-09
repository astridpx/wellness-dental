import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RoleOption } from '@/types'
import { useWellnessApi } from './useWellnessApi'

type UserResponse = {
  id: number
  userCode: string
  username: string
  email: string
  firstName: string
  lastName: string
  middleName: string | null
  displayName: string
  department: string | null
  jobTitle: string | null
  mobileNumber: string | null
  roles: string[]
  primaryRole: string
  isActive: boolean
  isLocked: boolean
  lockedUntil: string | null
  mustChangePassword: boolean
}

export function useUserForm() {
  const route = useRoute()
  const router = useRouter()
  const { request } = useWellnessApi()

  const isEditMode = computed(() => !!route.params.id)
  const loading = ref(Boolean(route.params.id))
  const saving = ref(false)
  const unlocking = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const roles = ref<RoleOption[]>([])

  const userData = ref({
    userNo: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    roleCodes: [] as string[],
    department: '',
    jobTitle: '',
    status: 'Active',
    isLocked: false,
    lockedUntil: null as string | null,
    mustChangePassword: true,
  })

  async function fetchRoles() {
    const result = await request<RoleOption[]>('/wellness/roles')
    if (!result.ok) return

    roles.value = Array.isArray(result.data) ? result.data : []
  }

  async function fetchUser() {
    if (!isEditMode.value) {
      loading.value = false
      return
    }

    loading.value = true
    errorMessage.value = ''

    const result = await request<UserResponse>(`/wellness/users/${route.params.id}`)

    if (!result.ok || !result.data) {
      errorMessage.value = result.error || 'Unable to load user.'
      loading.value = false
      return
    }

    const user = result.data
    userData.value = {
      userNo: user.userCode,
      username: user.username,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || '',
      email: user.email,
      phone: user.mobileNumber || '',
      roleCodes: user.roles || [],
      department: user.department || '',
      jobTitle: user.jobTitle || '',
      status: user.isActive ? 'Active' : 'Inactive',
      isLocked: user.isLocked,
      lockedUntil: user.lockedUntil,
      mustChangePassword: user.mustChangePassword,
    }

    loading.value = false
  }

  async function save() {
    saving.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const payload: Record<string, unknown> = {
      username: userData.value.username,
      firstName: userData.value.firstName,
      lastName: userData.value.lastName,
      middleName: userData.value.middleName || null,
      email: userData.value.email,
      mobileNumber: userData.value.phone || null,
      roleCodes: userData.value.roleCodes,
      department: userData.value.department || null,
      jobTitle: userData.value.jobTitle || null,
      isActive: userData.value.status === 'Active',
      mustChangePassword: userData.value.mustChangePassword,
    }

    if (userData.value.password.trim()) {
      payload.password = userData.value.password
    }

    if (!isEditMode.value && !payload.password) {
      errorMessage.value = 'Password is required when creating a user.'
      saving.value = false
      return
    }

    if (!userData.value.roleCodes.length) {
      errorMessage.value = 'Please assign at least one role.'
      saving.value = false
      return
    }

    const result = await request(
      isEditMode.value ? `/wellness/users/${route.params.id}` : '/wellness/users',
      {
        method: isEditMode.value ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      },
      { includeContentType: true },
    )

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to save user.'
      saving.value = false
      return
    }

    saving.value = false
    await router.push('/users')
  }

  async function unlockUser() {
    if (!isEditMode.value || unlocking.value) return false

    unlocking.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<UserResponse>(`/wellness/users/${route.params.id}/unlock`, {
      method: 'PATCH',
    })

    unlocking.value = false

    if (!result.ok || !result.data) {
      errorMessage.value = result.error || 'Unable to unlock user.'
      return false
    }

    const user = result.data
    userData.value.isLocked = user.isLocked
    userData.value.lockedUntil = user.lockedUntil
    successMessage.value = 'User account has been unlocked.'
    return true
  }

  function goBackToList() {
    void router.push('/users')
  }

  onMounted(async () => {
    await fetchRoles()
    await fetchUser()
  })

  return {
    errorMessage,
    goBackToList,
    isEditMode,
    loading,
    roles,
    save,
    saving,
    successMessage,
    unlocking,
    unlockUser,
    userData,
  }
}
