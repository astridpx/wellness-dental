<script lang="ts" setup>
import { AppTable, AppButton, AppDialog, AppInput } from '@/components/app'
import { ref } from 'vue'

const activityLogs = [
  {
    date: '2026-07-15 09:15 AM',
    email: 'john.doe@example.com',
    activity: 'Logged in',
    status: 'Success',
  },
  {
    date: '2026-07-15 09:37 AM',
    email: 'jane.smith@example.com',
    activity: 'Created a new employee record',
    status: 'Success',
  },
  {
    date: '2026-07-15 10:12 AM',
    email: 'michael.lee@example.com',
    activity: 'Deleted a document',
    status: 'Failed',
  },
  {
    date: '2026-07-15 10:45 AM',
    email: 'sarah.jones@example.com',
    activity: 'Updated user permissions',
    status: 'Success',
  },
  {
    date: '2026-07-15 11:20 AM',
    email: 'alex.tan@example.com',
    activity: 'Logged out',
    status: 'Success',
  },
]

const showDialog = ref(false)
const currentPage = ref(1)
const perPage = ref(10)
const totalEntries = 200
const totalPages = Math.ceil(totalEntries / perPage.value)
</script>

<template>
  <AppDialog title="Filter User Logs" :show="showDialog" @close="showDialog = false">
    <template #dialog-content>
      <div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-sky/15 bg-[linear-gradient(135deg,#f3f8ff_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-sky">Filter Logs</p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Search log activity to narrow down user history and portal behavior.
          </p>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate">Activity</label>
          <AppInput placeholder="Search activity logs..." />
        </div>
      </div>
    </template>
  </AppDialog>

  <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-black text-onyx">User Logs</h2>
        <p class="mt-1 text-sm text-slate">
          Review user-level actions, sign-ins, and account events across the PPSTA portal.
        </p>
      </div>
      <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="showDialog = true">
        Filter Logs
      </AppButton>
    </div>

    <div class="mb-5 grid gap-4 md:grid-cols-3">
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Visible Rows</p>
        <p class="mt-2 text-2xl font-black text-onyx">{{ activityLogs.length }}</p>
      </div>
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Total Entries</p>
        <p class="mt-2 text-2xl font-black text-onyx">{{ totalEntries }}</p>
      </div>
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Primary Use</p>
        <p class="mt-2 text-sm font-medium leading-6 text-onyx">
          Investigate user behavior, audit actions, and trace operational history.
        </p>
      </div>
    </div>

    <div class="overflow-hidden rounded-[1.5rem] border border-pebble">
      <AppTable
        :theads="['Date', 'Email', 'Activity', 'Status']"
        :total-entries="totalEntries"
        :total-pages="totalPages"
        :current-page="currentPage"
        @update-pg-num="currentPage = $event"
      >
        <template #trs>
          <tr v-for="(log, i) in activityLogs" :key="i">
            <td>{{ log.date }}</td>
            <td class="font-medium text-onyx">{{ log.email }}</td>
            <td>{{ log.activity }}</td>
            <td>
              <span
                class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                :class="
                  log.status === 'Success'
                    ? 'bg-emerald-light text-emerald'
                    : 'bg-ruby-light text-ruby'
                "
              >
                {{ log.status }}
              </span>
            </td>
          </tr>
        </template>
      </AppTable>
    </div>
  </section>
</template>
