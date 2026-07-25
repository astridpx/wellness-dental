<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppButton, AppInput } from '@/components/app'
import { useAuth, useWellnessApi } from '@/composables'

type PasswordResponse = {
  passwordUpdated: boolean
  requiresReset: boolean
}

const route = useRoute()
const router = useRouter()
const { fetchCurrentUser, getStoredUser } = useAuth()
const { request } = useWellnessApi()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const mustChangePassword = ref(Boolean(getStoredUser()?.mustChangePassword))

const isForcedReset = computed(
  () => mustChangePassword.value || route.query.forcePasswordReset === '1',
)

const panelTitle = computed(() =>
  isForcedReset.value ? 'Password Reset Required' : 'Clinic Account Password',
)

const panelDescription = computed(() =>
  isForcedReset.value
    ? 'Your account is marked for a next-login password reset. Please set a new password before continuing.'
    : 'Update your account password to keep clinic access secure.',
)

async function refreshCurrentUserState() {
  const currentUser = await fetchCurrentUser()
  mustChangePassword.value = Boolean(currentUser?.mustChangePassword)
}

async function savePassword() {
  if (saving.value) return

  errorMessage.value = ''
  successMessage.value = ''

  if (!isForcedReset.value && !currentPassword.value.trim()) {
    errorMessage.value = 'Current password is required.'
    return
  }

  if (newPassword.value.length < 12) {
    errorMessage.value = 'New password must be at least 12 characters long.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'New password and confirm password do not match.'
    return
  }

  saving.value = true

  const result = await request<PasswordResponse>(
    '/wellness/auth/password',
    {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      }),
    },
    { includeContentType: true },
  )

  saving.value = false

  if (!result.ok) {
    errorMessage.value = result.error || 'Unable to update password.'
    return
  }

  await refreshCurrentUserState()

  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  successMessage.value = isForcedReset.value
    ? 'Password updated successfully. You can now continue using the portal.'
    : 'Password updated successfully.'

  if (!mustChangePassword.value && route.query.forcePasswordReset === '1') {
    await router.replace('/')
  }
}

onMounted(async () => {
  await refreshCurrentUserState()
})
</script>

<template>
  <section class="rounded-[1.5rem] border border-pebble bg-white p-6 shadow-sm lg:p-7">
    <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div
        class="rounded-[1.5rem] border border-pebble bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-6"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Security Guide</p>
        <h2 class="mt-3 text-2xl font-black text-onyx">Protect Clinic Access</h2>
        <p class="mt-3 text-sm leading-6 text-slate">
          Keep billing, dentist credentials, and patient operations secure with a strong password
          routine.
        </p>

        <div class="mt-6 space-y-3">
          <div class="rounded-2xl bg-fog px-4 py-3 text-sm text-onyx">
            Use at least 12 characters for staff and admin accounts.
          </div>
          <div class="rounded-2xl bg-fog px-4 py-3 text-sm text-onyx">
            Choose a password that is difficult to guess and not reused from other accounts.
          </div>
          <div class="rounded-2xl bg-fog px-4 py-3 text-sm text-onyx">
            Rotate credentials quickly when roles or device access changes.
          </div>
        </div>
      </div>

      <form class="rounded-[1.5rem] border border-pebble bg-snow p-6" @submit.prevent="savePassword">
        <div class="space-y-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
              Update Credentials
            </p>
            <h2 class="mt-2 text-xl font-black text-onyx">{{ panelTitle }}</h2>
            <p class="mt-2 text-sm leading-6 text-slate">{{ panelDescription }}</p>
          </div>

          <p
            v-if="isForcedReset"
            class="rounded-2xl border border-amber/20 bg-[linear-gradient(135deg,#fff8e8_0%,#ffffff_100%)] px-4 py-3 text-sm text-amber"
          >
            Access to the rest of the portal is limited until this password reset is completed.
          </p>

          <p
            v-if="errorMessage"
            class="rounded-2xl border border-ruby/15 bg-ruby-light px-4 py-3 text-sm text-ruby"
          >
            {{ errorMessage }}
          </p>

          <p
            v-if="successMessage"
            class="rounded-2xl border border-emerald/15 bg-emerald-light px-4 py-3 text-sm text-emerald"
          >
            {{ successMessage }}
          </p>

          <div class="grid gap-5">
            <AppInput
              v-if="!isForcedReset"
              v-model="currentPassword"
              type="password"
              icon="mingcute:lock-line"
              label="Current Password"
            />
            <AppInput
              v-model="newPassword"
              type="password"
              icon="mingcute:lock-line"
              label="New Password"
              placeholder="Minimum 12 characters"
            />
            <AppInput
              v-model="confirmPassword"
              type="password"
              icon="mingcute:lock-line"
              label="Confirm Password"
              placeholder="Repeat your new password"
            />
          </div>

          <div class="flex justify-end">
            <AppButton
              btn-theme="primary"
              type="submit"
              class="px-6 py-3 normal-case"
              :disabled="saving"
            >
              {{ saving ? 'Saving Password...' : 'Save Password' }}
            </AppButton>
          </div>
        </div>
      </form>
    </div>
  </section>
</template>
