<script setup lang="ts">
import { Icon } from '@iconify/vue'
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
  <div
    class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f9ff_0%,#eef2fb_44%,#e4ebf8_100%)]"
  >
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(176,138,52,0.4)_50%,transparent_100%)]" />
      <div class="absolute -left-16 top-12 h-64 w-64 rounded-full bg-tangerine/12 blur-3xl" />
      <div class="absolute right-0 top-18 h-80 w-80 rounded-full bg-sapphire/8 blur-3xl" />
      <div class="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />
    </div>

    <div class="relative grid min-h-screen lg:grid-cols-[46%_54%]">
      <div
        class="relative hidden overflow-hidden bg-[linear-gradient(155deg,#0f2348_0%,#123365_42%,#214a86_100%)] lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-16"
      >
        <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div class="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border border-white/10" />
        <div class="absolute right-14 top-28 h-24 w-24 rounded-[2rem] bg-white/7" />
        <div class="absolute bottom-28 left-18 h-18 w-18 rounded-full bg-tangerine/25 blur-xl" />
        <div class="absolute inset-y-0 right-10 w-px bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.14)_20%,rgba(255,255,255,0.04)_80%,transparent_100%)]" />

        <div class="relative z-10 max-w-md text-white">
          <div
            class="inline-flex items-center gap-3 rounded-full border border-white/14 bg-white/8 px-4 py-2 backdrop-blur"
          >
            <span
              class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,rgba(255,255,255,0.18)_0%,rgba(176,138,52,0.28)_100%)] text-tangerine-light"
            >
              <Icon icon="streamline-ultimate:dentistry-tooth-shield" class="h-5 w-5" />
            </span>
            <span class="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
              WPC Dental Suite
            </span>
          </div>

          <h1 class="mt-8 text-4xl font-black tracking-tight xl:text-5xl">
            Brand-led access for modern dental operations.
          </h1>
          <p class="mt-5 max-w-md text-sm leading-7 text-white/74">
            A polished internal workspace for employee access, provider setup, clinic billing, and
            day-to-day coordination across your dental team.
          </p>

          <div class="mt-10 space-y-4">
            <div
              class="rounded-[1.75rem] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] p-5 backdrop-blur"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                    Employee Access
                  </p>
                  <p class="mt-3 text-2xl font-black">Secure internal sign-in</p>
                  <p class="mt-3 max-w-sm text-sm leading-6 text-white/68">
                    Built for staff, administrators, and clinic operators using one controlled
                    dental platform.
                  </p>
                </div>
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-tangerine-light"
                >
                  <Icon icon="feather:shield" class="h-5 w-5" />
                </div>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-[1.5rem] border border-white/10 bg-white/7 p-4 backdrop-blur">
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  Identity
                </p>
                <p class="mt-3 text-lg font-black">Navy and gold</p>
                <p class="mt-2 text-sm leading-6 text-white/65">
                  Updated to reflect the Wellness and Preventive Consultancy brand palette.
                </p>
              </div>
              <div class="rounded-[1.5rem] border border-white/10 bg-white/7 p-4 backdrop-blur">
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  Workflow
                </p>
                <p class="mt-3 text-lg font-black">Dental operations</p>
                <p class="mt-2 text-sm leading-6 text-white/65">
                  Keep permissions, provider setup, and billing aligned in one system.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p class="relative z-10 text-xs text-white/50">
          Wellness and Preventive Consultancy Inc. employee workspace
        </p>
      </div>

      <div class="flex items-center justify-center px-6 py-10 sm:px-10">
        <div class="w-full max-w-md">
          <div class="mb-8 lg:hidden">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-tangerine">WPC Dental Suite</p>
            <p class="mt-2 text-2xl font-black text-onyx">Employee Access</p>
          </div>

          <div
            class="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/88 p-7 shadow-[0_30px_70px_rgba(21,42,78,0.16)] backdrop-blur sm:p-8"
          >
            <div class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#153a78_0%,#b08a34_55%,#e0c06b_100%)]" />

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
                :class="loginError ? 'bg-ruby-light text-ruby' : 'bg-sky-light text-sapphire'"
              >
                <span v-if="loginError">{{ loginError }}</span>
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
