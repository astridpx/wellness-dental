<script setup lang="ts">
import { AppTable, AppButton, AppDialog, AppInput } from '@/components/app'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showDialog = ref(false)
const currentPage = ref(1)
const perPage = ref(10)
const users = Array.from({ length: 28 }, (_, i) => ({
  id: i + 1,
  userNo: `USR-${String(1001 + i)}`,
  name: ['Olivia Ramos', 'Marcus Lee', 'Sofia Villanueva', 'Ethan Wu'][i % 4],
  role: ['Administrator', 'Front Desk', 'Dental Assistant', 'Billing'][i % 4],
  email: `user${i + 1}@dentalcare.com`,
  phone: `0917 555 ${String(2000 + i).slice(-4)}`,
}))
const paginatedUsers = computed(() =>
  users.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value),
)
const totalEntries = users.length
const totalPages = Math.ceil(totalEntries / perPage.value)
</script>

<template>
  <AppDialog title="Filter Users" :show="showDialog" @close="showDialog = false"
    ><template #dialog-content
      ><div class="space-y-5">
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
            <label class="mb-2 block text-sm font-medium text-slate">User No.</label
            ><AppInput placeholder="USR-XXXX" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Name</label
            ><AppInput placeholder="Olivia Ramos" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Email</label
            ><AppInput placeholder="email@example.com" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Role</label
            ><AppInput placeholder="Administrator" />
          </div>
        </div></div></template
  ></AppDialog>
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
          <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="showDialog = true"
            >Filter</AppButton
          ><AppButton btn-theme="outline" class="px-5 py-3 normal-case">Export</AppButton
          ><router-link to="/users/add"
            ><AppButton btn-theme="primary" class="px-5 py-3 normal-case"
              >Add User</AppButton
            ></router-link
          >
        </div>
      </div>
      <div class="grid gap-px border-t border-pebble bg-pebble md:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Total Users</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ totalEntries }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Access Roles</p>
          <p class="mt-2 text-3xl font-black text-onyx">
            {{ new Set(users.map((user) => user.role)).size }}
          </p>
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
      <div class="overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['User #', 'Name', 'Role', 'Email', 'Phone', 'Action']"
          :total-entries="totalEntries"
          :total-pages="totalPages"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
          ><template #trs
            ><tr
              v-for="user in paginatedUsers"
              :key="user.id"
              class="cursor-pointer"
              @click="router.push(`/users/${user.id}/edit`)"
            >
              <td class="font-medium text-onyx">{{ user.userNo }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.role }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone }}</td>
              <td class="text-sm font-semibold text-slate">Edit</td>
            </tr></template
          ></AppTable
        >
      </div>
    </section>
  </div>
</template>
