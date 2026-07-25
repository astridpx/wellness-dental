<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AppButton, AppInput } from '@/components/app'
import { useUserForm } from '@/composables'

const { errorMessage, goBackToList, isEditMode, loading, roles, save, saving, userData } =
  useUserForm()
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
      <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="goBackToList">
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
            @click="goBackToList"
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
