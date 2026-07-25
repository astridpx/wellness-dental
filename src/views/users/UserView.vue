<script setup lang="ts">
import { AppTable, AppButton, AppDialog, AppInput } from '@/components/app'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables'

type UserRow = {
  id: number
  userNo: string
  name: string
  primaryRole: string
  roles?: string[]
  email: string
  phone: string | null
}

type RoleOption = {
  id: number
  code: string
  name: string
}

const router = useRouter()
const { getAuthHeaders, logout } = useAuth()
const baseURL = import.meta.env.VITE_APP_MAIN_API_BASE_URL

const showDialog = ref(false)
const loading = ref(false)
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

const paginatedUsers = computed(() => users.value)

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

  try {
    const res = await fetch(`${baseURL}/wellness/users?${params.toString()}`, {
      headers: getAuthHeaders(false),
    })

    if (await handleApiError(res)) return

    const obj = await res.json()

    if (!res.ok) {
      errorMessage.value = obj.error || 'Unable to load users.'
      return
    }

    users.value = Array.isArray(obj.data) ? obj.data : []
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
  void fetchUsers()
}

watch(currentPage, () => {
  void fetchUsers()
})

onMounted(async () => {
  await fetchRoles()
  await fetchUsers()
})
</script>

<template>
  <AppDialog title="Filter Users" :show="showDialog" @close="showDialog = false" @confirm="applyFilters">
    <template #dialog-content>
      <div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Search Filters
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Search users by user number, name, email, or assigned role.
          </p>
        </div>
        <div class="grid gap-5">
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">User No.</label>
            <AppInput v-model="filters.userNo" placeholder="USR-XXXX" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Name</label>
            <AppInput v-model="filters.name" placeholder="Olivia Ramos" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Email</label>
            <AppInput v-model="filters.email" placeholder="email@example.com" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Role</label>
            <select v-model="filters.role">
              <option value="">All roles</option>
              <option v-for="role in roles" :key="role.code" :value="role.code">
                {{ role.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#f6fffe_0%,#ffffff_45%,#ebf8fa_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="space-y-4">
          <div
            class="inline-flex items-center rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            Team Access Control
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Clinic Team</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
              Organize front-desk, dental assistant, billing, and administrator access across the
              clinic.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="showDialog = true">
            Filter
          </AppButton>
          <router-link to="/users/add">
            <AppButton btn-theme="primary" class="px-5 py-3 normal-case">Add User</AppButton>
          </router-link>
        </div>
      </div>
      <div class="grid gap-px border-t border-pebble bg-pebble md:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Total Users</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ totalEntries }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Access Roles</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ accessRoleCount }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Setup Focus</p>
          <p class="mt-2 text-sm font-medium leading-6 text-onyx">
            Staff profiles combine role assignment, clinic responsibility, and contact coverage.
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5">
        <h2 class="text-xl font-black text-onyx">Clinic Staff Directory</h2>
        <p class="mt-1 text-sm text-slate">Browse and manage staff access records below.</p>
      </div>

      <p v-if="errorMessage" class="mb-4 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
        {{ errorMessage }}
      </p>

      <div class="overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['User #', 'Name', 'Role Assignment', 'Email', 'Phone', 'Action']"
          :total-entries="totalEntries"
          :total-pages="totalPages"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
        >
          <template #trs>
            <tr v-if="loading">
              <td colspan="6" class="text-center text-slate">Loading users...</td>
            </tr>
            <tr v-else-if="!paginatedUsers.length">
              <td colspan="6" class="text-center text-slate">No users found.</td>
            </tr>
            <tr
              v-for="user in paginatedUsers"
              v-else
              :key="user.id"
              class="cursor-pointer"
              @click="router.push(`/users/${user.id}/edit`)"
            >
              <td class="font-medium text-onyx">{{ user.userNo }}</td>
              <td>{{ user.name }}</td>
              <td>
                <div class="flex flex-wrap justify-end gap-2">
                  <span
                    v-for="roleCode in user.roles?.length ? user.roles : [user.primaryRole || 'No role']"
                    :key="roleCode"
                    class="inline-flex rounded-full bg-tangerine-light px-3 py-1 text-xs font-semibold text-tangerine"
                  >
                    {{ roleCode }}
                  </span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone || 'N/A' }}</td>
              <td class="text-sm font-semibold text-slate">Edit</td>
            </tr>
          </template>
        </AppTable>
      </div>
    </section>
  </div>
</template>
