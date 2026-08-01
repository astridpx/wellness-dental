<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  AppTable,
  AppButton,
  AppDialog,
  AppInput,
  AppLoadingScreen,
  AppStatValue,
} from '@/components/app'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useUsersList } from '@/composables'

const router = useRouter()
const showDialog = ref(false)
const {
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
} = useUsersList()

function confirmFilters() {
  showDialog.value = false
  applyFilters()
}
</script>

<template>
  <AppDialog
    title="Filter Users"
    :show="showDialog"
    @close="showDialog = false"
    @confirm="confirmFilters"
  >
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
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="space-y-4">
          <div
            class="inline-flex items-center rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            Team Access Control
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Wellness Team</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
              Organize front-desk, dental assistant, billing, and administrator access.
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
          <AppStatValue :loading="loading" :value="totalEntries" />
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Access Roles</p>
          <AppStatValue :loading="loading" :value="accessRoleCount" />
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Setup Focus</p>
          <p class="mt-2 text-sm font-medium leading-6 text-onyx">
            Staff profiles combine role assignment, responsibility, and contact coverage.
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5">
        <h2 class="text-xl font-black text-onyx">Wellness Staff Directory</h2>
        <p class="mt-1 text-sm text-slate">Browse and manage staff access records below.</p>
      </div>

      <p v-if="errorMessage" class="mb-4 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
        {{ errorMessage }}
      </p>

      <div v-if="loading">
        <AppLoadingScreen
          title="Loading wellness users"
          message="Please wait while we retrieve staff accounts, role assignments, and contact coverage."
        />
      </div>

      <div v-else class="overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="[
            'Name',
            'Role Assignment',
            'Email',
            'Status',
            'Password Reset',
            'Action',
          ]"
          :total-entries="totalEntries"
          :total-pages="totalPages"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
        >
          <template #trs>
            <tr v-if="!users.length">
              <td colspan="6" class="text-center text-slate">No users found.</td>
            </tr>
            <tr
              v-for="user in users"
              v-else
              :key="user.id"
              class="cursor-pointer"
              @click="router.push(`/users/${user.id}/edit`)"
            >
              <td>{{ user.name }}</td>
              <td>
                <div class="flex flex-wrap justify-end gap-2">
                  <span
                    v-for="roleCode in user.roles?.length
                      ? user.roles
                      : [user.primaryRole || 'No role']"
                    :key="roleCode"
                    class="inline-flex rounded-full bg-tangerine-light px-3 py-1 text-xs font-semibold text-tangerine"
                  >
                    {{ roleCode }}
                  </span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    (user.status || (user.isActive ? 'Active' : 'Inactive')) === 'Active'
                      ? 'bg-emerald-light text-emerald'
                      : 'bg-ruby-light text-ruby'
                  "
                >
                  {{ user.status || (user.isActive ? 'Active' : 'Inactive') }}
                </span>
              </td>
              <td>
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    user.mustChangePassword ? 'bg-amber-light text-amber' : 'bg-fog text-slate'
                  "
                >
                  {{ user.mustChangePassword ? 'Required' : 'Not required' }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-3.5 py-2 text-xs font-semibold text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#fcf4e8_0%,#f3e5ce_100%)] hover:text-[#6f4a13]"
                    @click.stop="router.push(`/users/${user.id}/edit`)"
                  >
                    <Icon icon="feather:edit-2" class="size-4" />
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </AppTable>
      </div>
    </section>
  </div>
</template>
