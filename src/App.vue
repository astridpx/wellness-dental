<script setup lang="ts">
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Icon } from '@iconify/vue'
import { computed, inject, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuth, useNavigation } from '@/composables'

type NavItem = {
  name: string
  href: string
  icon?: string
  children?: Array<{ name: string; path: string; meta: { title: string } }>
}

const route = useRoute()
const router = useRouter()
const { logout, getStoredRoles, getStoredUser } = useAuth()

const sidebarOpen = ref(false)
const appVer = inject('appVer') as string
const appTitle = import.meta.env.VITE_APP_TITLE
const authStateVersion = ref(0)
const routes = router.options.routes
const currentRoles = computed(() => {
  authStateVersion.value
  return getStoredRoles()
})

const navigation = computed<NavItem[]>(() => {
  const filteredRoutes = routes.filter((n) => Array.isArray(n?.meta?.navItem) && n.meta.navItem[0])
  return useNavigation().getNav(filteredRoutes, currentRoles.value) as NavItem[]
})

const currentUser = computed(() => {
  authStateVersion.value
  return getStoredUser()
})

const userEmail = computed(() => {
  return currentUser.value?.email || ''
})

const userName = computed(() => {
  return currentUser.value?.displayName?.trim() || 'Signed-in User'
})

const routeTitle = computed(() => String(route.meta.title || 'Workspace'))
const todayLabel = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date('2026-07-24T09:00:00')),
)

function isActiveLink(href: string) {
  return href === '/' ? route.path === href : route.path.startsWith(href)
}

watch(
  () => route.fullPath,
  () => {
    authStateVersion.value += 1
  },
  { immediate: true },
)
</script>

<template>
  <RouterView v-if="route.name === 'login'" />

  <div v-else class="min-h-screen bg-[linear-gradient(180deg,#f7fbfc_0%,#eef6f7_36%,#e7eff2_100%)]">
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog as="div" class="relative z-50 xl:hidden" @close="sidebarOpen = false">
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-onyx/35 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="flex h-full w-full max-w-sm flex-1">
              <div
                class="scrollbar flex h-full w-full flex-col overflow-y-auto bg-[#122833] px-5 py-6 text-white shadow-2xl"
              >
                <div class="mb-6 flex items-start justify-between">
                  <div>
                    <p
                      class="text-[11px] font-semibold uppercase tracking-[0.32em] text-tangerine-light"
                    >
                      IMS Dental
                    </p>
                    <h2 class="mt-2 text-2xl font-black">Clinic OS</h2>
                  </div>
                  <button
                    type="button"
                    class="rounded-2xl bg-white/10 p-2.5"
                    @click="sidebarOpen = false"
                  >
                    <Icon icon="feather:x" class="h-5 w-5" />
                  </button>
                </div>

                <div class="rounded-[1.75rem] border border-white/10 bg-white/6 p-4">
                  <p class="text-xs uppercase tracking-[0.2em] text-white/55">Current operator</p>
                  <div class="mt-4 flex items-center gap-3">
                    <div
                      class="flex h-12 w-12 items-center justify-center rounded-2xl bg-tangerine text-white"
                    >
                      <Icon icon="feather:user" class="h-5 w-5" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold">{{ userName }}</p>
                      <p class="truncate text-xs text-white/65">
                        {{ userEmail || 'No email available' }}
                      </p>
                    </div>
                  </div>
                </div>

                <nav class="mt-6 flex-1 space-y-2">
                  <RouterLink
                    v-for="item in navigation"
                    :key="item.name"
                    :to="item.href"
                    class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                    :class="
                      isActiveLink(item.href)
                        ? 'bg-white text-onyx'
                        : 'text-white/78 hover:bg-white/10 hover:text-white'
                    "
                    @click="sidebarOpen = false"
                  >
                    <Icon :icon="item.icon || 'feather:circle'" class="h-5 w-5 shrink-0" />
                    {{ item.name }}
                  </RouterLink>
                </nav>

                <button
                  class="mt-6 flex w-full items-center gap-3 rounded-2xl border border-white/12 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                  @click="logout()"
                >
                  <Icon icon="feather:log-out" class="h-5 w-5" />
                  Logout
                </button>

                <div class="mt-5 text-center text-xs text-white/40">
                  <p>{{ appTitle }}</p>
                  <p class="mt-1">Version {{ appVer }}</p>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <div class="mx-auto flex h-screen max-w-[1680px] gap-4 overflow-hidden p-4 lg:p-6">
      <aside class="hidden h-full xl:flex xl:w-75 xl:shrink-0 xl:flex-col">
        <div
          class="scrollbar flex h-full flex-col overflow-y-auto rounded-4xl bg-[#122833] p-5 text-white shadow-lg"
        >
          <div class="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p
                  class="text-[11px] font-semibold uppercase tracking-[0.32em] text-tangerine-light"
                >
                  IMS Dental
                </p>
                <h1 class="mt-2 text-3xl font-black leading-none">Clinic OS</h1>
              </div>
              <div class="rounded-2xl bg-white/8 p-3 text-white/75">
                <Icon icon="streamline-ultimate:dentistry-tooth-shield" class="h-6 w-6" />
              </div>
            </div>
            <p class="mt-4 text-sm leading-6 text-white/65">
              A dental control room for provider setup, treatment flow, billing, and team
              operations.
            </p>
          </div>

          <nav class="mt-6 flex-1 space-y-2">
            <RouterLink
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              class="group flex items-center justify-between rounded-2xl px-4 py-3 transition"
              :class="
                isActiveLink(item.href)
                  ? 'bg-white text-onyx'
                  : 'text-white/76 hover:bg-white/8 hover:text-white'
              "
            >
              <span class="flex items-center gap-3">
                <Icon :icon="item.icon || 'feather:circle'" class="h-5 w-5 shrink-0" />
                <span class="text-sm font-semibold">{{ item.name }}</span>
              </span>
              <Icon
                icon="feather:arrow-up-right"
                class="h-4 w-4 opacity-40 transition group-hover:opacity-100"
              />
            </RouterLink>
          </nav>

          <div class="mt-6 rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase tracking-[0.22em] text-white/55">Signed in</p>
            <p class="mt-3 text-sm font-semibold">{{ userName }}</p>
            <p class="mt-1 text-xs text-white/55">{{ userEmail || 'No email available' }}</p>
            <button
              class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-onyx transition hover:bg-tangerine-light"
              @click="logout()"
            >
              <Icon icon="feather:log-out" class="h-4 w-4" />
              Logout
            </button>
          </div>

          <div class="mt-5 text-center text-xs text-white/35">
            <p>{{ appTitle }}</p>
            <p class="mt-1">Version {{ appVer }}</p>
          </div>
        </div>
      </aside>

      <main class="min-w-0 flex-1">
        <div
          class="flex h-full min-h-[calc(100vh-2rem)] flex-col rounded-4xl border border-white/70 bg-white/80 shadow-lg backdrop-blur"
        >
          <header class="border-b border-pebble/80 px-4 py-4 sm:px-6 lg:px-8">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex items-start gap-3">
                <button
                  type="button"
                  class="inline-flex rounded-2xl bg-fog p-3 text-onyx xl:hidden"
                  @click="sidebarOpen = true"
                >
                  <Icon icon="feather:menu" class="h-5 w-5" />
                </button>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-smoke">
                    Control Room
                  </p>
                  <h2 class="mt-1 text-2xl font-black text-onyx">{{ routeTitle }}</h2>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center">
                <div class="rounded-2xl border border-pebble bg-cloud px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke">
                    Today
                  </p>
                  <p class="mt-1 text-sm font-semibold text-onyx">{{ todayLabel }}</p>
                </div>
                <div class="rounded-2xl border border-pebble bg-white px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke">
                    Operator
                  </p>
                  <p class="mt-1 text-sm font-semibold text-onyx">{{ userName }}</p>
                </div>
              </div>
            </div>
          </header>

          <section class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <RouterView />
          </section>
        </div>
      </main>
    </div>
  </div>
</template>
