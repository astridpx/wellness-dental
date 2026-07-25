<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { AppButton, AppDialog, AppInput, AppLoadingScreen } from '@/components/app'
import { useUserForm } from '@/composables'

const { errorMessage, goBackToList, isEditMode, loading, roles, save, saving, userData } =
  useUserForm()
const showSaveDialog = ref(false)

const selectedRoleCount = computed(() => userData.value.roleCodes.length)
const displayName = computed(() => {
  const parts = [userData.value.firstName, userData.value.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : 'New User'
})
const selectedRoleNames = computed(() =>
  roles.value
    .filter((role) => userData.value.roleCodes.includes(role.code))
    .map((role) => role.name),
)
const accountStatusOptions = [
  {
    value: 'Active',
    label: 'Active',
    description: 'User can sign in and appear in internal access workflows.',
    icon: 'feather:check-circle',
    classes: 'border-emerald/25 bg-emerald-light text-emerald',
  },
  {
    value: 'Inactive',
    label: 'Inactive',
    description: 'User record stays saved but sign-in access is disabled.',
    icon: 'feather:slash',
    classes: 'border-ruby/20 bg-ruby-light text-ruby',
  },
] as const
const passwordPolicyOptions = [
  {
    value: true,
    label: 'Require reset',
    description: 'The employee must set a new password immediately.',
    icon: 'feather:key',
  },
  {
    value: false,
    label: 'Keep current access',
    description: 'The current password remains valid until manually changed.',
    icon: 'feather:shield',
  },
] as const

function generatePassword() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'
  const passwordLength = 12
  const randomValues = new Uint32Array(passwordLength)

  window.crypto.getRandomValues(randomValues)

  userData.value.password = Array.from(randomValues, (value) => {
    return characters[value % characters.length]
  }).join('')
}

function openSaveDialog() {
  if (loading.value || saving.value) return
  showSaveDialog.value = true
}

function closeSaveDialog() {
  if (saving.value) return
  showSaveDialog.value = false
}

async function confirmSave() {
  await save()
  showSaveDialog.value = false
}
</script>

<template>
  <AppDialog
    title="Confirm user changes"
    :show="showSaveDialog"
    :disabled="saving"
    :confirm-label="saving ? 'Saving...' : isEditMode ? 'Confirm Update' : 'Confirm Save'"
    @close="closeSaveDialog"
    @confirm="confirmSave"
  >
    <template #dialog-content>
      <div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Save Confirmation
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            {{
              isEditMode
                ? 'Please confirm that you want to update this employee profile, access coverage, and account settings.'
                : 'Please confirm that you want to create this employee account with the current details and access setup.'
            }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Employee</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ displayName }}</p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Username</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ userData.username || 'Not set yet' }}</p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Status</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ userData.status }}</p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Roles</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ selectedRoleCount }}</p>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <div v-if="loading" class="space-y-6">
    <AppLoadingScreen
      title="Loading user profile"
      message="Please wait while we retrieve account details, role assignments, and staff information."
    />
  </div>

  <section v-else class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine">
          Team member workspace
        </p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-onyx">
          {{ isEditMode ? 'Edit Team Member' : 'Create Team Member' }}
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate">
          Set up staff access, role coverage, department ownership, and credential controls from one
          focused profile workspace.
        </p>
      </div>
      <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="goBackToList">
        Back to List
      </AppButton>
    </div>

    <p v-if="errorMessage" class="rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
      {{ errorMessage }}
    </p>

    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#f8fbff_0%,#ffffff_52%,#fbf7ee_100%)] shadow-sm"
    >
      <div class="space-y-5 p-6">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
            Staff account overview
          </p>
          <h2 class="mt-2 text-4xl font-black tracking-tight text-onyx">{{ displayName }}</h2>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Manage access configuration, personal details, and internal ownership information for
            this staff profile.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-[1.4rem] border border-pebble bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Mode</p>
            <p class="mt-2 text-2xl font-black text-onyx">
              {{ isEditMode ? 'Edit' : 'Create' }}
            </p>
          </div>
          <div class="rounded-[1.4rem] border border-pebble bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
              Assigned roles
            </p>
            <p class="mt-2 text-2xl font-black text-onyx">{{ selectedRoleCount }}</p>
          </div>
          <div class="rounded-[1.4rem] border border-pebble bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Status</p>
            <p
              class="mt-2 text-2xl font-black"
              :class="userData.status === 'Active' ? 'text-emerald' : 'text-ruby'"
            >
              {{ userData.status }}
            </p>
          </div>
          <div class="rounded-[1.4rem] border border-pebble bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Department</p>
            <p class="mt-2 text-lg font-black text-onyx">
              {{ userData.department || 'Not assigned' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <form class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]" @submit.prevent="openSaveDialog">
      <div
        class="h-fit rounded-[1.75rem] border border-pebble bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_100%)] p-6 shadow-sm"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Profile panel</p>
        <div
          class="mt-5 flex flex-col items-center rounded-[1.5rem] border border-dashed border-pebble bg-white p-6"
        >
          <div
            class="flex h-32 w-32 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fff4e8_0%,#ffe1bf_100%)]"
          >
            <Icon icon="feather:user" class="size-16 text-tangerine" />
          </div>
          <p class="mt-4 text-sm font-semibold text-onyx">{{ displayName }}</p>
          <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate">Clinic team account</p>
        </div>

        <div class="mt-5 space-y-3">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Phone</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ userData.phone || 'Not provided' }}</p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Password rule</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{
                userData.mustChangePassword
                  ? 'Password reset required on next login'
                  : 'No forced password reset'
              }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="rounded-[1.75rem] border border-pebble bg-snow p-6 shadow-sm">
          <div class="mb-5">
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-smoke">
              Basic details
            </p>
            <h2 class="mt-2 text-xl font-black text-onyx">Identity and contact information</h2>
          </div>

          <div class="grid gap-5 md:grid-cols-2">
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
                :placeholder="
                  isEditMode ? 'Leave blank to keep current password' : 'Minimum 8 characters'
                "
              >
                <template #trailing>
                  <button
                    type="button"
                    class="text-slate transition hover:text-tangerine"
                    title="Generate password"
                    aria-label="Generate password"
                    @click="generatePassword"
                  >
                    <Icon icon="feather:disc" class="h-5 w-5" />
                  </button>
                </template>
              </AppInput>
              <p class="mt-2 text-xs text-slate">
                Click the disc icon to generate a secure password instantly.
              </p>
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
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Job Title</label>
              <AppInput v-model="userData.jobTitle" placeholder="Operations Supervisor" />
            </div>
          </div>
        </div>

        <div class="rounded-[1.75rem] border border-pebble bg-snow p-6 shadow-sm">
          <div class="mb-5">
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-smoke">
              Access setup
            </p>
            <h2 class="mt-2 text-xl font-black text-onyx">Roles, status, and account rules</h2>
            <p class="mt-2 text-sm leading-6 text-slate">
              Control what this employee can access, whether the account is currently enabled, and
              how password recovery should behave.
            </p>
          </div>

          <div class="grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Role Assignment</label>
              <div class="rounded-lg border border-pebble bg-white p-4">
                <div class="grid gap-3 md:grid-cols-2">
                  <label
                    v-for="role in roles"
                    :key="role.code"
                    class="flex items-start gap-3 rounded-xl border border-pebble bg-cloud px-3 py-3 text-sm text-onyx transition hover:border-tangerine/30 hover:bg-white"
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

            <div class="md:col-span-2">
              <label class="mb-3 block text-sm font-medium text-slate">Account Status</label>
              <div class="grid gap-3 md:grid-cols-2">
                <button
                  v-for="option in accountStatusOptions"
                  :key="option.value"
                  type="button"
                  class="rounded-lg border px-4 py-4 text-left transition"
                  :class="
                    userData.status === option.value
                      ? option.classes
                      : 'border-pebble bg-white text-slate hover:border-tangerine/25 hover:bg-cloud'
                  "
                  @click="userData.status = option.value"
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl"
                      :class="
                        userData.status === option.value
                          ? 'bg-white/75'
                          : 'bg-[linear-gradient(135deg,#f8fbff_0%,#fbf4e4_100%)] text-tangerine'
                      "
                    >
                      <Icon :icon="option.icon" class="size-5" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-bold">{{ option.label }}</p>
                      <p class="mt-1 text-sm leading-6">
                        {{ option.description }}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Department</label>
              <AppInput v-model="userData.department" placeholder="Clinic Administration" />
            </div>

            <div class="md:col-span-2">
              <label class="mb-3 block text-sm font-medium text-slate">Password Policy</label>
              <div class="grid gap-3 md:grid-cols-2">
                <button
                  v-for="option in passwordPolicyOptions"
                  :key="option.label"
                  type="button"
                  class="rounded-lg border px-4 py-4 text-left transition"
                  :class="
                    userData.mustChangePassword === option.value
                      ? 'border-sapphire/20 bg-sapphire-light text-sapphire-dark'
                      : 'border-pebble bg-white text-slate hover:border-tangerine/25 hover:bg-cloud'
                  "
                  @click="userData.mustChangePassword = option.value"
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl"
                      :class="
                        userData.mustChangePassword === option.value
                          ? 'bg-white text-sapphire'
                          : 'bg-[linear-gradient(135deg,#f8fbff_0%,#fbf4e4_100%)] text-tangerine'
                      "
                    >
                      <Icon :icon="option.icon" class="size-5" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-bold">{{ option.label }}</p>
                      <p class="mt-1 text-sm leading-6">
                        {{ option.description }}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div class="md:col-span-2 rounded-lg border border-pebble bg-white p-4">
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p class="text-sm font-bold text-onyx">Selected access coverage</p>
                  <p class="mt-1 text-sm text-slate">
                    {{ selectedRoleCount }} role{{ selectedRoleCount === 1 ? '' : 's' }} assigned
                    for this employee account.
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="roleName in selectedRoleNames"
                    :key="roleName"
                    class="inline-flex rounded-full bg-tangerine-light px-3 py-1 text-xs font-semibold text-tangerine"
                  >
                    {{ roleName }}
                  </span>
                  <span
                    v-if="!selectedRoleNames.length"
                    class="inline-flex rounded-full bg-fog px-3 py-1 text-xs font-semibold text-slate"
                  >
                    No role selected yet
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AppButton
            type="button"
            btn-theme="outline"
            class="px-5 py-3 normal-case"
            @click="goBackToList"
          >
            Cancel
          </AppButton>
          <AppButton
            :disabled="loading || saving"
            type="submit"
            btn-theme="primary"
            class="px-5 py-3 normal-case"
          >
            <Icon icon="feather:save" class="size-4" />
            {{ saving ? 'Saving...' : isEditMode ? 'Update User' : 'Save User' }}
          </AppButton>
        </div>
      </div>
    </form>
  </section>
</template>
