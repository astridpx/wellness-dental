<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppButton, AppInput } from '@/components/app'
import { useAuth } from '@/composables'

const router = useRouter()
const route = useRoute()
const { getStoredUser, login } = useAuth()

const identifier = ref('')
const password = ref('')
const loginError = ref('')
const pleaseWait = ref(false)

async function handleLogin() {
  if (pleaseWait.value) return

  pleaseWait.value = true
  loginError.value = ''

  const loginResult = await login(identifier.value, password.value)

  pleaseWait.value = false

  if (loginResult === true) {
    const user = getStoredUser()
    await router.push(user?.mustChangePassword ? '/accountSettings?forcePasswordReset=1' : '/')
    return
  }

  loginError.value =
    typeof loginResult === 'string' ? loginResult : 'Unable to login at the moment.'
}
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fbf6ea_0%,#f4ead2_42%,#eadfca_100%)]"
  >
    <div class="pointer-events-none absolute inset-0">
      <div
        class="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(176,138,52,0.4)_50%,transparent_100%)]"
      />
      <div class="absolute -left-16 top-12 h-64 w-64 rounded-full bg-tangerine/12 blur-3xl" />
      <div class="absolute right-0 top-18 h-80 w-80 rounded-full bg-sapphire/8 blur-3xl" />
      <div
        class="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/60 blur-3xl"
      />
    </div>

    <div class="relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
      <div class="flex w-full items-center justify-center">
        <div class="w-full max-w-md">
          <div
            class="relative overflow-hidden rounded-4xl border border-white/80 bg-white/88 p-7 shadow-[0_30px_70px_rgba(21,42,78,0.16)] backdrop-blur sm:p-8"
          >
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#153a78_0%,#b08a34_55%,#e0c06b_100%)]"
            />

            <div
              class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#eef3ff_0%,#fbf4e4_100%)] text-tangerine shadow-sm"
            >
              <Icon icon="streamline-ultimate:dentistry-tooth-shield" class="h-6 w-6" />
            </div>

            <div class="mt-6">
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine">
                Welcome Back
              </p>
              <h1 class="mt-2 text-[2rem] font-black tracking-tight text-onyx">Employee Sign In</h1>
              <p class="mt-2 text-sm leading-6 text-slate">
                Sign in to access the WPC dental operations workspace.
              </p>
            </div>

            <form class="mt-8 space-y-5" @submit.prevent="handleLogin">
              <div>
                <label class="mb-2 block text-sm font-semibold text-onyx">
                  Email Address or Username
                </label>
                <AppInput
                  v-model="identifier"
                  type="text"
                  placeholder="name@example.com or username"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold text-onyx">Password</label>
                <AppInput v-model="password" type="password" placeholder="Enter your password" />
              </div>

              <AppButton
                :disabled="pleaseWait"
                btn-theme="primary"
                class="mt-2 h-12 w-full justify-center normal-case"
              >
                {{ pleaseWait ? 'Signing In...' : 'Sign In' }}
              </AppButton>
              <p
                v-if="route.query.forcedLogout || loginError"
                class="rounded-2xl px-4 py-3 text-center text-sm"
                :class="
                  loginError || route.query.forcedLogout
                    ? 'bg-ruby-light text-ruby'
                    : 'bg-sky-light text-sapphire'
                "
              >
                <span v-if="loginError">{{ loginError }}</span>
                <span v-else-if="route.query.passwordResetRequired">
                  Your session was ended because your account requires a password update. Sign in
                  again to continue with the password reset.
                </span>
                <span v-else>
                  You have been logged out due to an expired token or insufficient permissions.
                </span>
              </p>
            </form>

            <div class="mt-7 pt-2 text-center">
              <p class="text-xs text-smoke">
                Secure access • Wellness and Preventive Consultancy Inc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
