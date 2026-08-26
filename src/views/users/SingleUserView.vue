<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { AppButton, AppDialog, AppInput, AppLoadingScreen } from '@/components/app'
import { useUserForm } from '@/composables'
import { formatDateTime, generateSecurePassword } from '@/utils'

const {
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
} = useUserForm()
const showSaveDialog = ref(false)
const showUnlockDialog = ref(false)

const selectedRoleCount = computed(() => (userData.value.roleCode ? 1 : 0))
const displayName = computed(() => {
  const parts = [userData.value.firstName, userData.value.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : 'New User'
})
const selectedRoleNames = computed(() =>
  roles.value.filter((role) => role.code === userData.value.roleCode).map((role) => role.name),
)
const selectedRoleLabel = computed(() => selectedRoleNames.value[0] || 'Not assigned')
const accountStatusLabel = computed(() =>
  userData.value.isLocked ? 'Locked' : userData.value.status || 'Inactive',
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
  userData.value.password = generateSecurePassword()
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

function openUnlockDialog() {
  if (!isEditMode.value || !userData.value.isLocked || unlocking.value) return
  showUnlockDialog.value = true
}

function closeUnlockDialog() {
  if (unlocking.value) return
  showUnlockDialog.value = false
}

async function confirmUnlock() {
  const unlocked = await unlockUser()
  if (unlocked) showUnlockDialog.value = false
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
                ? 'Please confirm that you want to update this employee profile, role assignment, and account settings.'
                : 'Please confirm that you want to create this employee account with the current details and role setup.'
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
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Role</p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ selectedRoleNames[0] || 'Not selected yet' }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    title="Unlock account"
    :show="showUnlockDialog"
    :disabled="unlocking"
    :confirm-label="unlocking ? 'Unlocking...' : 'Unlock Account'"
    @close="closeUnlockDialog"
    @confirm="confirmUnlock"
  >
    <template #dialog-content>
      <div class="space-y-4">
        <div class="rounded-[1.5rem] border border-ruby/15 bg-ruby-light p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-ruby">Account unlock</p>
          <p class="mt-2 text-sm leading-6 text-slate">
            This clears failed login attempts and removes the lock for
            <span class="font-bold text-onyx">{{ displayName }}</span
            >.
          </p>
        </div>
        <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Locked until</p>
          <p class="mt-2 text-sm font-bold text-onyx">
            {{ formatDateTime(userData.lockedUntil, 'Not set') }}
          </p>
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
          Set up staff access, role assignment, department ownership, and credential controls from
          one focused profile workspace.
        </p>
      </div>
      <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="goBackToList">
        Back to List
      </AppButton>
    </div>

    <p v-if="errorMessage" class="rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
      {{ errorMessage }}
    </p>
    <p v-if="successMessage" class="rounded-xl bg-emerald-light px-4 py-3 text-sm text-emerald">
      {{ successMessage }}
    </p>

    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
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

        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-[1.4rem] border border-pebble bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Assigned role</p>
            <p class="mt-2 text-lg font-black text-onyx">
              {{ selectedRoleNames[0] || 'Not assigned' }}
            </p>
          </div>
          <div class="rounded-[1.4rem] border border-pebble bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Status</p>
            <p
              class="mt-2 text-2xl font-black"
              :class="
                userData.isLocked
                  ? 'text-ruby'
                  : userData.status === 'Active'
                    ? 'text-emerald'
                    : 'text-ruby'
              "
            >
              {{ userData.isLocked ? 'Locked' : userData.status }}
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

    <form
      class="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]"
      @submit.prevent="openSaveDialog"
    >
      <div
        class="h-fit rounded-[1.9rem] border border-pebble bg-[linear-gradient(160deg,#f7f3ea_0%,#ffffff_34%,#f8fbff_100%)] p-6 shadow-sm xl:sticky xl:top-6"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Profile panel</p>
            <p class="mt-1 text-sm text-slate">Quick account summary and ownership details.</p>
          </div>
          <div
            class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fff4e8_0%,#f3dcc0_100%)] text-tangerine shadow-[0_10px_24px_rgba(176,138,52,0.14)]"
          >
            <Icon icon="feather:user" class="size-5" />
          </div>
        </div>

        <div
          class="mt-5 flex flex-col items-center rounded-[1.6rem] border border-dashed border-[#d8d6d0] bg-white/92 p-6 text-center"
        >
          <div
            class="flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#fff7ea_0%,#fde3bf_70%,#f7d19d_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          >
            <Icon icon="feather:user" class="size-16 text-tangerine" />
          </div>
          <p class="mt-4 text-base font-bold text-onyx">{{ displayName }}</p>
          <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate">Clinic team account</p>
          <div class="mt-4 flex flex-wrap justify-center gap-2">
            <span
              class="inline-flex rounded-full bg-tangerine-light px-3 py-1 text-xs font-semibold text-tangerine"
            >
              {{ selectedRoleLabel }}
            </span>
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              :class="
                accountStatusLabel === 'Active'
                  ? 'bg-emerald-light text-emerald'
                  : accountStatusLabel === 'Locked'
                    ? 'bg-ruby-light text-ruby'
                    : 'bg-fog text-slate'
              "
            >
              {{ accountStatusLabel }}
            </span>
          </div>
        </div>

        <div class="mt-5 grid gap-3">
          <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
              <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Department</p>
              <p class="mt-2 text-sm font-bold text-onyx">
                {{ userData.department || 'Not assigned' }}
              </p>
            </div>
            <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
              <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Phone</p>
              <p class="mt-2 text-sm font-bold text-onyx">{{ userData.phone || 'Not provided' }}</p>
            </div>
            <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
              <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Password rule</p>
              <p class="mt-2 text-sm font-bold text-onyx">
                {{ userData.mustChangePassword ? 'Reset required on next login' : 'No forced reset' }}
              </p>
            </div>
          </div>

          <div
            class="rounded-[1.4rem] border border-[#e2d7c2] bg-[linear-gradient(135deg,#fffaf1_0%,#f8f6ef_100%)] px-4 py-4"
          >
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-tangerine">
              Workspace note
            </p>
            <p class="mt-2 text-sm leading-6 text-slate">
              Use this panel to quickly verify access, department ownership, and password behavior
              before saving.
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div
          class="rounded-[1.9rem] border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] p-6 shadow-sm"
        >
          <div
            class="mb-6 flex flex-col gap-4 border-b border-pebble pb-5 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-[#e3d8c6] bg-[#fff8ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-tangerine"
              >
                <Icon icon="feather:id-card" class="size-3.5" />
                Basic details
              </div>
              <h2 class="mt-3 text-xl font-black text-onyx">Identity and contact information</h2>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate">
                Capture the employee's login credentials, profile details, and internal department
                ownership in one balanced section.
              </p>
            </div>
          </div>

          <div class="grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">
                Username
                <span aria-hidden="true" class="ml-1 text-ruby">*</span>
              </label>
              <AppInput v-model="userData.username" placeholder="username" required />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">
                {{ isEditMode ? 'New Password (Optional)' : 'Password' }}
                <span v-if="!isEditMode" aria-hidden="true" class="ml-1 text-ruby">*</span>
              </label>
              <AppInput
                v-model="userData.password"
                type="password"
                :required="!isEditMode"
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
              <label class="mb-2 block text-sm font-medium text-slate">
                First Name
                <span aria-hidden="true" class="ml-1 text-ruby">*</span>
              </label>
              <AppInput v-model="userData.firstName" placeholder="Olivia" required />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">
                Last Name
                <span aria-hidden="true" class="ml-1 text-ruby">*</span>
              </label>
              <AppInput v-model="userData.lastName" placeholder="Ramos" required />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Middle Name</label>
              <AppInput v-model="userData.middleName" placeholder="Optional" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">
                Email Address
                <span aria-hidden="true" class="ml-1 text-ruby">*</span>
              </label>
              <AppInput v-model="userData.email" placeholder="name@clinic.com" required />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Mobile Number</label>
              <AppInput v-model="userData.phone" placeholder="+63 912 345 6789" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Department</label>
              <AppInput v-model="userData.department" placeholder="Clinic Administration" />
            </div>
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Job Title</label>
              <AppInput v-model="userData.jobTitle" placeholder="Operations Supervisor" />
            </div>
          </div>
        </div>

        <div
          class="rounded-[1.9rem] border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] p-6 shadow-sm"
        >
          <div
            class="mb-6 flex flex-col gap-4 border-b border-pebble pb-5 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-[#dbe7f7] bg-sapphire-light px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sapphire"
              >
                <Icon icon="feather:shield" class="size-3.5" />
                Access setup
              </div>
              <h2 class="mt-3 text-xl font-black text-onyx">Role, status, and account rules</h2>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate">
                Define what this employee can access, whether the account is enabled, and how
                password recovery should behave.
              </p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-pebble bg-cloud px-4 py-3">
                <p class="text-[11px] uppercase tracking-[0.18em] text-smoke">Assigned role</p>
                <p class="mt-1 text-sm font-bold text-onyx">{{ selectedRoleLabel }}</p>
              </div>
              <div class="rounded-2xl border border-pebble bg-cloud px-4 py-3">
                <p class="text-[11px] uppercase tracking-[0.18em] text-smoke">Account status</p>
                <p class="mt-1 text-sm font-bold text-onyx">{{ accountStatusLabel }}</p>
              </div>
            </div>
          </div>

          <div class="grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">
                Role Assignment
                <span aria-hidden="true" class="ml-1 text-ruby">*</span>
              </label>
              <div class="rounded-lg border border-pebble bg-white p-3">
                <div class="grid gap-2.5 md:grid-cols-2">
                  <label
                    v-for="role in roles"
                    :key="role.code"
                    class="flex items-center gap-2.5 rounded-xl border border-pebble bg-cloud px-3 py-2.5 text-sm text-onyx transition hover:border-tangerine/30 hover:bg-white"
                    :class="
                      userData.roleCode === role.code ? 'border-tangerine bg-white shadow-sm' : ''
                    "
                  >
                    <input
                      v-model="userData.roleCode"
                      :value="role.code"
                      type="radio"
                      name="user-role"
                      class="h-4 w-4 shrink-0 border-gray-300 text-tangerine focus:ring-focus-ring"
                    />
                    <span class="min-w-0 leading-5">
                      <span class="block font-semibold">{{ role.name }}</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="mb-3 block text-sm font-medium text-slate">Account Status</label>
              <div
                v-if="isEditMode && userData.isLocked"
                class="mb-4 flex flex-col gap-3 rounded-xl border border-ruby/20 bg-ruby-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p class="text-sm font-bold text-ruby">Account is locked</p>
                  <p class="mt-1 text-sm text-slate">
                    Locked until {{ formatDateTime(userData.lockedUntil, 'Not set') }}.
                  </p>
                </div>
                <AppButton
                  type="button"
                  btn-theme="danger"
                  class="normal-case"
                  :disabled="unlocking"
                  @click="openUnlockDialog"
                >
                  <Icon
                    :icon="unlocking ? 'feather:loader' : 'feather:unlock'"
                    class="h-4 w-4"
                    :class="{ 'animate-spin': unlocking }"
                  />
                  {{ unlocking ? 'Unlocking...' : 'Unlock Account' }}
                </AppButton>
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <button
                  v-for="option in accountStatusOptions"
                  :key="option.value"
                  type="button"
                  class="rounded-2xl border px-4 py-4 text-left transition"
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

            <div class="md:col-span-2">
              <label class="mb-3 block text-sm font-medium text-slate">Password Policy</label>
              <div class="grid gap-3 md:grid-cols-2">
                <button
                  v-for="option in passwordPolicyOptions"
                  :key="option.label"
                  type="button"
                  class="rounded-2xl border px-4 py-4 text-left transition"
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

            <div class="md:col-span-2 rounded-[1.4rem] border border-pebble bg-cloud p-4">
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p class="text-sm font-bold text-onyx">Selected access coverage</p>
                  <p class="mt-1 text-sm text-slate">
                    {{
                      selectedRoleNames[0]
                        ? `${selectedRoleNames[0]} is assigned to this employee account.`
                        : 'No role selected yet.'
                    }}
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
