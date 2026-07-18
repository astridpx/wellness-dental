<script setup lang="ts">
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Icon } from '@iconify/vue'
import { computed, inject, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuth, useNavigation } from '@/composables'
import { getRoleFromToken } from '@/utils'

type NavItem = {
  name: string
  href: string
  icon?: string
  children?: Array<{ name: string; path: string; meta: { title: string } }>
}

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()

const sidebarOpen = ref(false)
const appVer = inject('appVer') as string
const appTitle = import.meta.env.VITE_APP_TITLE
const isExtOrg = import.meta.env.VITE_APP_IS_EXTERNAL_ORG === 'true'
const lsEmailKey = isExtOrg
  ? import.meta.env.VITE_APP_LOCAL_STORAGE_EMAIL_EXTORG
  : import.meta.env.VITE_APP_LOCAL_STORAGE_EMAIL
const lsTokenKey = isExtOrg
  ? import.meta.env.VITE_APP_LOCAL_STORAGE_TOKEN_KEY_EXTORG
  : import.meta.env.VITE_APP_LOCAL_STORAGE_TOKEN_KEY

const authStateVersion = ref(0)
const routes = router.options.routes
const currentRole = computed(() => {
  authStateVersion.value
  if (!isExtOrg) return 'superAdmin'
  return getRoleFromToken(localStorage.getItem(lsTokenKey)) || ''
})
const navigation = computed<NavItem[]>(() => {
  const filteredRoutes = routes.filter((n) => Array.isArray(n?.meta?.navItem) && n.meta.navItem[0])
  const navItems = useNavigation().getNav(
    filteredRoutes,
    [currentRole.value].filter(Boolean),
  ) as NavItem[]

  return navItems
})

const userEmail = computed(() => {
  authStateVersion.value
  return localStorage.getItem(lsEmailKey) || ''
})
const userName = computed(() => {
  const email = userEmail.value.trim()
  if (!email) return 'Signed-in User'

  const baseName = (email.split('@')[0] ?? email).replace(/[._-]+/g, ' ').trim()
  if (!baseName) return email

  return baseName
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
})

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

  <div
    v-else
    class="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff4e8,#f5f7fb_28%,#eef4ff_100%)]"
  >
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog as="div" class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-onyx/30 backdrop-blur-sm" />
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
            <DialogPanel class="relative mr-10 flex w-full max-w-xs flex-1">
              <div
                class="flex min-h-full w-full flex-col rounded-r-4xl bg-snow px-5 py-6 shadow-2xl"
              >
                <div class="mb-6 flex items-center justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.25em] text-tangerine">
                      PPSTA
                    </p>
                    <h2 class="mt-1 text-lg font-bold text-onyx">Admin Portal</h2>
                  </div>
                  <button
                    type="button"
                    class="rounded-full p-2 text-slate"
                    @click="sidebarOpen = false"
                  >
                    <Icon icon="feather:x" class="h-5 w-5" />
                  </button>
                </div>

                <div
                  class="rounded-2xl bg-[linear-gradient(135deg,#37CBB8_0%,#2ea89b_65%,#1f7f77_100%)] px-4 py-4 text-white shadow-md"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18 ring-1 ring-white/20"
                    >
                      <Icon icon="feather:user" class="h-6 w-6" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold">{{ userName }}</p>
                      <p class="truncate text-xs text-white/75">
                        {{ userEmail || 'No email available' }}
                      </p>
                    </div>
                  </div>
                </div>

                <nav class="mt-6 flex-1">
                  <ul class="space-y-2">
                    <li v-for="item in navigation" :key="item.name">
                      <RouterLink
                        :to="item.href"
                        class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200"
                        :class="
                          isActiveLink(item.href)
                            ? 'bg-tangerine-light text-tangerine-dark shadow-sm'
                            : 'text-onyx hover:bg-fog'
                        "
                        @click="sidebarOpen = false"
                      >
                        <Icon :icon="item.icon || 'feather:circle'" class="h-5 w-5 shrink-0" />
                        {{ item.name }}
                      </RouterLink>
                    </li>
                  </ul>
                </nav>

                <div class="border-t border-pebble pt-4">
                  <button
                    class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-onyx transition hover:bg-fog"
                    @click="logout()"
                  >
                    <Icon icon="feather:log-out" class="h-5 w-5" />
                    Logout
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <div class="flex min-h-screen flex-col lg:flex-row">
      <aside class="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:p-5">
        <div
          class="flex h-full flex-col rounded-4xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur"
        >
          <div class="border-b border-pebble pb-5">
            <div class="space-y-3">
              <div
                class="rounded-[1.5rem] border border-dashed border-pebble bg-linear-to-br from-fog to-white px-4 py-4 text-center shadow-sm"
              >
                <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-smoke">
                  IMS Logo
                </p>
                <div
                  class="mt-3 flex h-20 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate"
                >
                  Place IMS Logo
                </div>
              </div>
            </div>
            <h1 class="mt-5 text-2xl font-black tracking-tight text-onyx">Admin Portal</h1>
            <p class="mt-2 text-sm leading-6 text-slate">
              Teacher enrollment and records management.
            </p>
          </div>

          <div
            class="mt-5 rounded-[1.5rem] bg-[linear-gradient(135deg,#37CBB8_0%,#2ea89b_65%,#1f7f77_100%)] p-4 text-white shadow-md"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18 ring-1 ring-white/20"
              >
                <Icon icon="feather:user" class="h-6 w-6" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ userName }}</p>
                <p class="truncate text-xs text-white/75">
                  {{ userEmail || 'No email available' }}
                </p>
              </div>
            </div>
          </div>

          <nav class="mt-6 flex-1">
            <ul class="space-y-2">
              <li v-for="item in navigation" :key="item.name">
                <RouterLink
                  :to="item.href"
                  class="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200"
                  :class="
                    isActiveLink(item.href)
                      ? 'bg-tangerine-light text-tangerine-dark shadow-sm'
                      : 'text-onyx hover:bg-fog'
                  "
                >
                  <Icon :icon="item.icon || 'feather:circle'" class="h-5 w-5 shrink-0" />
                  {{ item.name }}
                </RouterLink>
              </li>
            </ul>
          </nav>

          <div class="mt-6 border-t border-pebble pt-4">
            <button
              class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-onyx transition hover:bg-fog"
              @click="logout()"
            >
              <Icon icon="feather:log-out" class="h-5 w-5" />
              Logout
            </button>
          </div>

          <p class="mt-6 text-center text-xs leading-5 text-smoke">
            <strong class="block pb-1 font-bold uppercase tracking-[0.2em] text-slate">{{
              appTitle
            }}</strong>
            Version {{ appVer || 'dev' }}
          </p>
        </div>
      </aside>

      <div class="flex min-h-screen min-w-0 flex-1 flex-col p-4 lg:p-5 lg:pl-0">
        <section
          class="min-h-0 flex-1 overflow-hidden rounded-4xl border border-white/70 bg-white/85 shadow-lg backdrop-blur"
        >
          <div class="h-full overflow-y-auto p-5 lg:p-7">
            <button
              type="button"
              class="mb-4 inline-flex rounded-2xl bg-fog p-3 text-onyx lg:hidden"
              @click="sidebarOpen = true"
            >
              <Icon icon="feather:menu" class="h-5 w-5" />
            </button>
            <RouterView />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
