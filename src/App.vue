<script setup lang="ts">
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Icon } from '@iconify/vue'
import { computed, inject, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuth, useNavigation } from '@/composables'
import MaintenanceView from '@/views/MaintenanceView.vue'

type NavItem = {
  name: string
  href: string
  icon?: string
  children?: Array<{ name: string; href: string; icon?: string }>
}

const route = useRoute()
const router = useRouter()
const { logout, getStoredRoles, getStoredUser } = useAuth()
const isMaintenanceMode = import.meta.env.VITE_APP_MAINTENANCE_MODE === 'true'

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
const isForcedPasswordResetFlow = computed(
  () => route.path === '/accountSettings' && route.query.forcePasswordReset === '1',
)
const openNavGroups = ref<string[]>([])
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

function isActiveItem(item: NavItem) {
  if (!item.children?.length) return isActiveLink(item.href)
  return item.children.some((child) => isActiveLink(child.href))
}

function isNavGroupOpen(item: NavItem) {
  return openNavGroups.value.includes(item.name) || isActiveItem(item)
}

function toggleNavGroup(name: string) {
  openNavGroups.value = openNavGroups.value.includes(name)
    ? openNavGroups.value.filter((item) => item !== name)
    : [...openNavGroups.value, name]
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
  <MaintenanceView v-if="isMaintenanceMode" />

  <RouterView v-if="route.name === 'login'" />

  <div
    v-else
    class="min-h-screen bg-[radial-gradient(circle_at_top,#f4e7d2_0%,#efe5d8_24%,#e7e6e1_56%,#dde4e8_100%)]"
  >
    <TransitionRoot v-if="!isForcedPasswordResetFlow" as="template" :show="sidebarOpen">
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
                class="scrollbar flex h-full w-full flex-col overflow-y-auto bg-[linear-gradient(180deg,#10232f_0%,#143040_48%,#173544_100%)] px-5 py-6 text-white shadow-[0_28px_70px_rgba(10,28,44,0.4)]"
              >
                <div class="mb-6 flex items-start justify-between">
                  <div>
                    <p
                      class="text-[11px] font-semibold uppercase tracking-[0.32em] text-tangerine-light"
                    >
                      Wellness Dental
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

                <div
                  class="rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.04)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <p class="text-xs uppercase tracking-[0.2em] text-white/55">Current operator</p>
                  <div class="mt-4 flex items-center gap-3">
                    <div
                      class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#c59a42_0%,#a87b23_100%)] text-white shadow-[0_14px_28px_rgba(176,138,52,0.28)]"
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
                  <div v-for="item in navigation" :key="item.name" class="space-y-2">
                    <RouterLink
                      v-if="!item.children?.length"
                      :to="item.href"
                      class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                      :class="
                        isActiveItem(item)
                          ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_100%)] text-onyx shadow-[0_12px_24px_rgba(10,24,38,0.16)]'
                          : 'text-white/78 hover:bg-white/10 hover:text-white'
                      "
                      @click="sidebarOpen = false"
                    >
                      <Icon :icon="item.icon || 'feather:circle'" class="h-5 w-5 shrink-0" />
                      {{ item.name }}
                    </RouterLink>

                    <template v-else>
                      <button
                        type="button"
                        class="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                        :class="
                          isActiveItem(item)
                            ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_100%)] text-white shadow-[0_12px_24px_rgba(10,24,38,0.14)]'
                            : 'text-white/78 hover:bg-white/10 hover:text-white'
                        "
                        @click="toggleNavGroup(item.name)"
                      >
                        <span class="flex items-center gap-3">
                          <Icon :icon="item.icon || 'feather:circle'" class="h-5 w-5 shrink-0" />
                          {{ item.name }}
                        </span>
                        <Icon
                          icon="feather:chevron-down"
                          class="h-4 w-4 shrink-0 transition"
                          :class="isNavGroupOpen(item) ? 'rotate-180' : ''"
                        />
                      </button>

                      <div
                        v-show="isNavGroupOpen(item)"
                        class="ml-4 space-y-2 border-l border-white/12 pl-4"
                      >
                        <RouterLink
                          v-for="child in item.children"
                          :key="child.href"
                          :to="child.href"
                          class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                          :class="
                            isActiveLink(child.href)
                              ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_100%)] text-onyx shadow-[0_12px_24px_rgba(10,24,38,0.16)]'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          "
                          @click="sidebarOpen = false"
                        >
                          <Icon :icon="child.icon || 'feather:circle'" class="h-4 w-4 shrink-0" />
                          {{ child.name }}
                        </RouterLink>
                      </div>
                    </template>
                  </div>
                </nav>

                <button
                  class="mt-6 flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/4 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
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

    <div
      class="mx-auto flex min-h-screen max-w-[1680px] p-3 lg:p-5"
      :class="isForcedPasswordResetFlow ? 'justify-center' : ''"
    >
      <div
        class="flex h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-4xl border border-[#e5dccd] bg-[linear-gradient(180deg,rgba(247,241,233,0.96)_0%,rgba(237,238,233,0.98)_100%)] shadow-[0_24px_60px_rgba(53,64,74,0.14)] backdrop-blur lg:h-[calc(100vh-2.5rem)]"
        :class="isForcedPasswordResetFlow ? 'max-w-5xl' : ''"
      >
        <aside
          v-if="!isForcedPasswordResetFlow"
          class="hidden min-h-0 h-full xl:flex xl:w-86 xl:shrink-0 xl:flex-col xl:border-r xl:border-[#223746] xl:bg-[linear-gradient(180deg,#10232f_0%,#173544_48%,#1d4454_100%)]"
        >
          <div class="scrollbar flex h-full flex-col overflow-y-auto p-5 text-white">
            <div
              class="rounded-[1.6rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p
                    class="text-[11px] font-semibold uppercase tracking-[0.32em] text-tangerine-light"
                  >
                    Wellness Dental
                  </p>
                  <h1 class="mt-2 text-3xl font-black leading-none">Clinic OS</h1>
                </div>
                <div
                  class="rounded-2xl bg-white/8 p-3 text-white/75 shadow-[0_10px_22px_rgba(10,28,44,0.14)]"
                >
                  <Icon icon="streamline-ultimate:dentistry-tooth-shield" class="h-6 w-6" />
                </div>
              </div>

              <p class="mt-4 text-sm leading-6 text-white/65">
                A dental control room for provider setup, treatment flow, billing, and team
                operations.
              </p>
            </div>

            <nav class="mt-6 flex-1 space-y-2">
              <div v-for="item in navigation" :key="item.name" class="space-y-2">
                <RouterLink
                  v-if="!item.children?.length"
                  :to="item.href"
                  class="group flex items-center justify-between rounded-2xl px-4 py-3 transition"
                  :class="
                    isActiveItem(item)
                      ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_100%)] text-onyx shadow-[0_14px_28px_rgba(10,24,38,0.18)]'
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

                <template v-else>
                  <button
                    type="button"
                    class="group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition"
                    :class="
                      isActiveItem(item)
                        ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_100%)] text-white shadow-[0_14px_28px_rgba(10,24,38,0.14)]'
                        : 'text-white/76 hover:bg-white/8 hover:text-white'
                    "
                    @click="toggleNavGroup(item.name)"
                  >
                    <span class="flex items-center gap-3">
                      <Icon :icon="item.icon || 'feather:circle'" class="h-5 w-5 shrink-0" />
                      <span class="text-sm font-semibold">{{ item.name }}</span>
                    </span>
                    <Icon
                      icon="feather:chevron-down"
                      class="h-4 w-4 shrink-0 transition"
                      :class="isNavGroupOpen(item) ? 'rotate-180 opacity-100' : 'opacity-50'"
                    />
                  </button>

                  <div
                    v-show="isNavGroupOpen(item)"
                    class="ml-4 space-y-2 border-l border-white/12 pl-4"
                  >
                    <RouterLink
                      v-for="child in item.children"
                      :key="child.href"
                      :to="child.href"
                      class="group flex items-center justify-between rounded-2xl px-4 py-3 transition"
                      :class="
                        isActiveLink(child.href)
                          ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_100%)] text-onyx shadow-[0_14px_28px_rgba(10,24,38,0.18)]'
                          : 'text-white/70 hover:bg-white/8 hover:text-white'
                      "
                    >
                      <span class="flex items-center gap-3">
                        <Icon :icon="child.icon || 'feather:circle'" class="h-4 w-4 shrink-0" />
                        <span class="text-sm font-semibold">{{ child.name }}</span>
                      </span>
                      <Icon
                        icon="feather:arrow-up-right"
                        class="h-4 w-4 opacity-40 transition group-hover:opacity-100"
                      />
                    </RouterLink>
                  </div>
                </template>
              </div>
            </nav>

            <div
              class="mt-6 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.04)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <p class="text-xs uppercase tracking-[0.22em] text-white/55">Signed in</p>
              <p class="mt-3 text-sm font-semibold">{{ userName }}</p>
              <p class="mt-1 text-xs text-white/55">{{ userEmail || 'No email available' }}</p>
              <button
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4f6fa_100%)] px-4 py-3 text-sm font-semibold text-onyx shadow-[0_14px_26px_rgba(10,24,38,0.14)] transition hover:bg-tangerine-light"
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

        <main class="min-w-0 min-h-0 flex-1">
          <div
            class="flex h-full min-h-full flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(245,240,233,0.92)_0%,rgba(236,239,235,0.96)_100%)]"
          >
            <header
              v-if="!isForcedPasswordResetFlow"
              class="border-b border-[#d7d4cd] bg-[linear-gradient(180deg,rgba(248,243,236,0.94)_0%,rgba(239,239,234,0.88)_100%)] px-4 py-4 sm:px-6 lg:px-8"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex items-start gap-3">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-2xl border border-[#d8d0c3] bg-[linear-gradient(180deg,#f7efe5_0%,#ece7de_100%)] p-3 text-[#203746] shadow-[0_10px_22px_rgba(89,78,63,0.08)] transition hover:border-[#c8b79d] hover:bg-[linear-gradient(180deg,#fbf5ee_0%,#f1ebe2_100%)] xl:hidden"
                    @click="sidebarOpen = true"
                  >
                    <Icon icon="solar:hamburger-menu-linear" class="h-5 w-5" />
                  </button>
                  <div class="hidden xl:block">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-smoke">
                      Control Room
                    </p>
                    <h2 class="mt-1 text-2xl font-black text-onyx">{{ routeTitle }}</h2>
                  </div>
                </div>

                <div class="hidden gap-3 sm:grid-cols-2 lg:flex lg:items-center">
                  <div
                    class="rounded-2xl border border-[#d7d8d2] bg-[linear-gradient(180deg,#f7f1ea_0%,#eceee9_100%)] px-4 py-3 shadow-[0_10px_22px_rgba(74,82,92,0.06)]"
                  >
                    <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke">
                      Today
                    </p>
                    <p class="mt-1 text-sm font-semibold text-onyx">{{ todayLabel }}</p>
                  </div>
                  <div
                    class="rounded-2xl border border-[#d7d8d2] bg-[linear-gradient(180deg,#f6efe7_0%,#edf0ec_100%)] px-4 py-3 shadow-[0_10px_22px_rgba(74,82,92,0.06)]"
                  >
                    <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke">
                      Operator
                    </p>
                    <p class="mt-1 text-sm font-semibold text-onyx">{{ userName }}</p>
                  </div>
                </div>
              </div>
            </header>

            <section
              class="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(244,239,232,0.58)_0%,rgba(234,238,234,0.86)_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8"
            >
              <RouterView />
            </section>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
