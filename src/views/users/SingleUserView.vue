<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AppButton, AppInput } from '@/components/app'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables'

type RoleOption = {
  id: number
  code: string
  name: string
}

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
  mustChangePassword: boolean
}

const route = useRoute()
const router = useRouter()
const { getAuthHeaders, logout } = useAuth()
const baseURL = import.meta.env.VITE_APP_MAIN_API_BASE_URL

const isEditMode = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
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
  mustChangePassword: true,
})

async function handleApiError(response: Response) {
  if (response.status === 401 || response.status === 403) {
    await logout(true)
    return true
  }

  return false
}

async function fetchRoles() {
  const res = await fetch(`${baseURL}/wellness/roles`, {
    headers: getAuthHeaders(false),
  })

  if (await handleApiError(res)) return

  const obj = await res.json()
  roles.value = Array.isArray(obj.data) ? obj.data : []
}

async function fetchUser() {
  if (!isEditMode.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const res = await fetch(`${baseURL}/wellness/users/${route.params.id}`, {
      headers: getAuthHeaders(false),
    })

    if (await handleApiError(res)) return

    const obj = await res.json()

    if (!res.ok || !obj.data) {
      errorMessage.value = obj.error || 'Unable to load user.'
      return
    }

    const user = obj.data as UserResponse
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
      mustChangePassword: user.mustChangePassword,
    }
  } catch {
    errorMessage.value = 'Unable to connect to the server.'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  errorMessage.value = ''

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

  try {
    const res = await fetch(
      isEditMode.value
        ? `${baseURL}/wellness/users/${route.params.id}`
        : `${baseURL}/wellness/users`,
      {
        method: isEditMode.value ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      },
    )

    if (await handleApiError(res)) return

    const obj = await res.json()

    if (!res.ok) {
      errorMessage.value = obj.error || 'Unable to save user.'
      return
    }

    await router.push('/users')
  } catch {
    errorMessage.value = 'Unable to connect to the server.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchRoles()
  await fetchUser()
})
</script>

<template>
  <section class="rounded-[1.5rem] border border-pebble bg-white p-6 shadow-sm lg:p-7">
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-black text-onyx">
          {{ isEditMode ? 'Edit Team Member' : 'Create Team Member' }}
        </h2>
        <p class="mt-1 max-w-2xl text-sm leading-6 text-slate">
          Set up staff access, role coverage, and department ownership for the dental clinic.
        </p>
      </div>
      <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="router.push('/users')">
        Back to List
      </AppButton>
    </div>

    <p v-if="errorMessage" class="mb-5 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
      {{ errorMessage }}
    </p>

    <div class="mb-6 grid gap-4 md:grid-cols-3">
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Mode</p>
        <p class="mt-2 text-2xl font-black text-onyx">{{ isEditMode ? 'Edit' : 'Create' }}</p>
      </div>
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Record Type</p>
        <p class="mt-2 text-sm font-medium leading-6 text-onyx">Dental clinic system account</p>
      </div>
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Status</p>
        <p class="mt-2 text-2xl font-black text-onyx">{{ userData.status }}</p>
      </div>
    </div>

    <form class="grid gap-6 xl:grid-cols-[280px_1fr]" @submit.prevent="save">
      <div
        class="rounded-[1.5rem] border border-pebble bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-6"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Profile Panel</p>
        <div
          class="mt-5 flex flex-col items-center rounded-[1.5rem] border border-dashed border-pebble bg-white p-6"
        >
          <div
            class="flex h-32 w-32 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fff4e8_0%,#ffe1bf_100%)]"
          >
            <Icon icon="feather:user" class="size-16 text-tangerine" />
          </div>
          <p class="mt-4 text-sm font-semibold text-onyx">
            {{ userData.firstName || 'New' }} {{ userData.lastName || 'User' }}
          </p>
          <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate">Clinic Team Account</p>
        </div>
      </div>

      <div class="space-y-6">
        <div class="rounded-[1.5rem] border border-pebble bg-snow p-6">
          <h2 class="text-xl font-black text-onyx">Basic Information</h2>
          <div class="mt-5 grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">User Number</label>
              <AppInput
                v-model="userData.userNo"
                :disabled="true"
                placeholder="Auto-generated after save"
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Username</label>
              <AppInput v-model="userData.username" placeholder="username" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">
                {{ isEditMode ? 'New Password (Optional)' : 'Password' }}
              </label>
              <AppInput
                v-model="userData.password"
                type="password"
                :placeholder="isEditMode ? 'Leave blank to keep current password' : 'Minimum 8 characters'"
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">First Name</label>
              <AppInput v-model="userData.firstName" placeholder="Olivia" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Last Name</label>
              <AppInput v-model="userData.lastName" placeholder="Ramos" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Middle Name</label>
              <AppInput v-model="userData.middleName" placeholder="Optional" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Email Address</label>
              <AppInput v-model="userData.email" placeholder="name@clinic.com" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Mobile Number</label>
              <AppInput v-model="userData.phone" placeholder="+63 912 345 6789" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Job Title</label>
              <AppInput v-model="userData.jobTitle" placeholder="Operations Supervisor" />
            </div>
          </div>
        </div>

        <div class="rounded-[1.5rem] border border-pebble bg-snow p-6">
          <h2 class="text-xl font-black text-onyx">Access Setup</h2>
          <div class="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Role Assignment</label>
              <div class="rounded-md border border-gray-200 bg-white px-4 py-3.5">
                <div class="grid gap-3">
                  <label
                    v-for="role in roles"
                    :key="role.code"
                    class="flex items-start gap-3 rounded-xl border border-pebble bg-cloud px-3 py-3 text-sm text-onyx"
                  >
                    <input
                      v-model="userData.roleCodes"
                      :value="role.code"
                      type="checkbox"
                      class="mt-0.5 h-4 w-4 rounded border-gray-300 text-tangerine focus:ring-focus-ring"
                    />
                    <span class="min-w-0">
                      <span class="block font-semibold">{{ role.name }}</span>
                      <span class="block text-xs uppercase tracking-[0.16em] text-slate">
                        {{ role.code }}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Account Status</label>
              <select v-model="userData.status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Department</label>
              <AppInput v-model="userData.department" placeholder="Clinic Administration" />
            </div>
            <div class="md:col-span-2">
              <label class="flex items-center gap-3 rounded-xl border border-pebble bg-cloud px-4 py-3 text-sm text-onyx">
                <input
                  v-model="userData.mustChangePassword"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-tangerine focus:ring-focus-ring"
                />
                <span>
                  Require password change on next login
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <AppButton
            type="button"
            btn-theme="outline"
            class="px-5 py-3 normal-case"
            @click="router.push('/users')"
          >
            Cancel
          </AppButton>
          <AppButton :disabled="loading || saving" type="submit" btn-theme="primary" class="px-5 py-3 normal-case">
            <Icon icon="feather:save" class="size-4" />
            {{ saving ? 'Saving...' : isEditMode ? 'Update User' : 'Save User' }}
          </AppButton>
        </div>
      </div>
    </form>
  </section>
</template>
