<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AppButton, AppInput, AppLoadingScreen, AppTable } from '@/components/app'
import { usePasswordResetAccounts } from '@/composables'
import { useRouter } from 'vue-router'

const router = useRouter()
const { activeResetCount, applyFilters, currentPage, errorMessage, filters, loading, totalEntries, totalPages, users } =
  usePasswordResetAccounts()
</script>

<template>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7eb_0%,#ffffff_44%,#f4f8ff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="space-y-4">
          <div
            class="inline-flex items-center rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            Credential follow-up
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Accounts needing password reset</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
              Review staff accounts that are still marked to change their password on the next
              login and jump straight into the employee record when follow-up is needed.
            </p>
          </div>
        </div>

        <router-link to="/users">
          <AppButton btn-theme="outline" class="px-5 py-3 normal-case">Back to Users</AppButton>
        </router-link>
      </div>

      <div class="grid gap-px border-t border-pebble bg-pebble md:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Reset Queue</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ totalEntries }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Active Accounts</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ activeResetCount }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Focus</p>
          <p class="mt-2 text-sm font-medium leading-6 text-onyx">
            Track onboarding, generated passwords, and users who still need to complete first-time
            password replacement.
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Password reset queue</h2>
          <p class="mt-1 text-sm text-slate">
            Open any record below to clear or keep the password reset requirement.
          </p>
        </div>
        <div class="w-full max-w-md">
          <label class="mb-2 block text-sm font-medium text-slate">Search employee</label>
          <div class="flex gap-3">
            <AppInput v-model="filters.search" placeholder="Search by employee name" />
            <AppButton btn-theme="outline" class="px-5 normal-case" @click="applyFilters">
              Filter
            </AppButton>
          </div>
        </div>
      </div>

      <p v-if="errorMessage" class="mb-4 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
        {{ errorMessage }}
      </p>

      <div v-if="loading">
        <AppLoadingScreen
          title="Loading password reset accounts"
          message="Please wait while we retrieve employee accounts that are still marked for next-login password reset."
        />
      </div>

      <div v-else class="overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['User #', 'Name', 'Role', 'Email', 'Status', 'Reset Flag', 'Action']"
          :total-entries="totalEntries"
          :total-pages="totalPages"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
        >
          <template #trs>
            <tr v-if="!users.length">
              <td colspan="7" class="text-center text-slate">
                No accounts are currently waiting for next-login password reset.
              </td>
            </tr>
            <tr
              v-for="user in users"
              v-else
              :key="user.id"
              class="cursor-pointer"
              @click="router.push(`/users/${user.id}/edit`)"
            >
              <td class="font-medium text-onyx">{{ user.userNo }}</td>
              <td>{{ user.name }}</td>
              <td>
                <span class="inline-flex rounded-full bg-fog px-3 py-1 text-xs font-semibold text-slate">
                  {{ user.primaryRole || 'No role' }}
                </span>
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
                  class="inline-flex rounded-full bg-amber-light px-3 py-1 text-xs font-semibold text-amber"
                >
                  Reset on next login
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-fog px-3 py-2 text-xs font-semibold text-slate transition hover:bg-pebble hover:text-onyx"
                    @click.stop="router.push(`/users/${user.id}/edit`)"
                  >
                    <Icon icon="feather:edit-2" class="size-4" />
                    Open
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
