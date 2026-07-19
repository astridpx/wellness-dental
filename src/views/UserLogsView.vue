<script lang="ts" setup>
import { Icon } from '@iconify/vue'
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

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="tabler:address-book" class="size-3.5" /> Activity audit
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">User Logs</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
            Review sign-ins, account updates, and user actions to keep a clear audit trail across
            the portal.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <AppButton btn-theme="outline" class="px-5 py-3 normal-case">
            <Icon icon="feather:download" class="size-4" /> Export
          </AppButton>
          <AppButton btn-theme="primary" class="px-5 py-3 normal-case" @click="showDialog = true">
            <Icon icon="feather:filter" class="size-4" /> Filter logs
          </AppButton>
        </div>
      </div>
      <div class="grid gap-px border-t border-pebble bg-pebble md:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Visible records</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ activityLogs.length }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Total entries</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ totalEntries }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Review focus</p>
          <p class="mt-2 text-sm font-medium leading-6 text-onyx">
            User access and account activity.
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Activity History</h2>
          <p class="mt-1 text-sm text-slate">Browse the latest recorded actions by portal users.</p>
        </div>
        <p class="text-sm font-medium text-slate">Showing recent entries</p>
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
              <td class="whitespace-nowrap text-sm text-slate">{{ log.date }}</td>
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
  </div>
</template>
