<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppButton, AppInput } from '@/components/app'
import { useAuth } from '@/composables'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

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
    await router.push('/')
    return
  }

  loginError.value =
    typeof loginResult === 'string' ? loginResult : 'Unable to login at the moment.'
}
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(135deg,#f6fffe_0%,#edf6f7_55%,#e5f3f5_100%)]">
    <div class="grid min-h-screen lg:grid-cols-[38%_62%]">
      <div
        class="relative hidden overflow-hidden bg-sapphire lg:flex flex-col justify-between p-14 text-snow xl:p-16"
      >
        <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div class="absolute -bottom-36 -left-24 h-80 w-80 rounded-full border border-white/10" />
        <div class="absolute right-12 top-24 h-28 w-28 rounded-4xl bg-white/8" />
        <div class="absolute bottom-24 left-18 h-18 w-18 rounded-full bg-tangerine/20 blur-xl" />

        <div class="relative z-10">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <svg
              class="h-7 w-7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 11c2.761 0 5-2.239 5-5S14.761 1 12 1 7 3.239 7 6s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5Z"
              />
            </svg>
          </div>

          <p class="mt-7 text-xs font-bold uppercase tracking-[0.28em] text-tangerine-light">
            IMS Dental
          </p>
          <h1 class="mt-3 text-4xl font-black tracking-tight">Clinic Command Center</h1>

          <p class="mt-5 max-w-sm text-sm leading-7 text-white/70">
            Keep dentists, treatment setup, payments, and front-desk operations aligned from one
            secure dental workspace.
          </p>
        </div>

        <p class="relative z-10 text-xs text-white/55">Secure dental operations workspace</p>
      </div>

      <div class="flex items-center justify-center px-6 py-10 sm:px-10">
        <div class="w-full max-w-md">
          <div class="mb-10 lg:hidden">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-tangerine">IMS Dental</p>
            <p class="mt-2 text-xl font-black text-onyx">Clinic Command Center</p>
          </div>
          <div class="rounded-[1.5rem] border border-pebble bg-snow p-7 shadow-sm sm:p-9">
            <div>
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-tangerine-light"
              >
                <svg
                  class="h-6 w-6 text-tangerine"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 11c2.761 0 5-2.239 5-5S14.761 1 12 1 7 3.239 7 6s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5Z"
                  />
                </svg>
              </div>

              <h2 class="mt-5 text-2xl font-black tracking-tight text-onyx">Sign in</h2>
              <p class="mt-2 text-sm text-slate">
                Sign in to manage dentist setup, billing, and clinic operations.
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
                <div class="mb-2 flex justify-between">
                  <label class="text-sm font-semibold text-onyx">Password</label>
                </div>
                <AppInput v-model="password" type="password" placeholder="Enter your password" />
              </div>

              <AppButton
                :disabled="pleaseWait"
                btn-theme="primary"
                class="mt-2 h-12 w-full normal-case"
              >
                {{ pleaseWait ? 'Signing In...' : 'Sign In' }}
              </AppButton>

              <p
                v-if="route.query.forcedLogout || loginError"
                class="text-center text-sm"
                :class="loginError ? 'text-red-700' : 'text-slate'"
              >
                <span v-if="loginError">{{ loginError }}</span>
                <span v-else>
                  You have been logged out due to an expired token or insufficient permissions.
                </span>
              </p>
            </form>

            <p class="mt-7 border-t border-pebble pt-5 text-center text-xs text-smoke">
              Secure access • Integrated Management Services Dental Suite
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
