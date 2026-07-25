<script setup lang="ts">
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Icon } from '@iconify/vue'
import { useAuth } from '@/composables'
import { inject, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isActiveLink = (href: string) =>
  !!(href === '/' ? route.path === href : route.path.startsWith(href))
const navigation = inject('navigation') as Array<any> //Array<INavItem>
const sidebarOpen = inject('sidebarOpen') as boolean
const appVer = inject('appVer') as string
const childrenOpen = ref('')
const { logout } = useAuth()

const appTitle = import.meta.env.VITE_APP_TITLE
const year = new Date().getFullYear()
</script>

<template>
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
        <div class="fixed inset-0 bg-transparent" />
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
          <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
            <TransitionChild
              as="template"
              enter="ease-in-out duration-300"
              enter-from="opacity-0"
              enter-to="opacity-100"
              leave="ease-in-out duration-300"
              leave-from="opacity-100"
              leave-to="opacity-0"
            >
              <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" class="-m-2.5 p-2.5" @click="sidebarOpen = false">
                  <Icon icon="feather:x" class="h-6 w-6 text-dark" aria-hidden="true" />
                </button>
              </div>
            </TransitionChild>
            <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-dark p-6">
              <slot name="beforeNavMobile" />
              <nav class="mt-8 flex flex-1 flex-col">
                <ul role="list" class="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" class="-mx-2 space-y-3">
                      <li v-for="item in navigation" :key="item.name">
                        <RouterLink
                          v-if="!item.children?.length"
                          :to="item.href"
                          class="group flex gap-x-3 rounded-md p-4 text-lg font-semibold"
                          :class="[
                            isActiveLink(item.href)
                              ? 'bg-medium-blue text-light-two'
                              : 'text-light-one hover:text-light-two hover:bg-medium-blue',
                          ]"
                        >
                          <Icon :icon="item.icon" class="h-7 w-7 shrink-0" />
                          {{ item.name }}
                        </RouterLink>

                        <template v-else>
                          <div
                            class="group flex gap-x-3 rounded-md p-4 text-lg font-semibold cursor-pointer"
                            :class="[
                              isActiveLink(item.href)
                                ? 'bg-medium-blue text-light-two'
                                : 'text-light-one hover:text-light-two hover:bg-medium-blue',
                            ]"
                            @click="childrenOpen = item.name"
                          >
                            <Icon :icon="item.icon" class="h-7 w-7 shrink-0" />
                            {{ item.name }}
                          </div>

                          <ul
                            v-show="childrenOpen === item.name"
                            class="ml-14 mt-1 flex flex-col gap-y-2 text-lg text-light-two"
                          >
                            <li v-for="child in item.children" :key="child.name">
                              <RouterLink
                                :to="child.path"
                                class="hover:text-medium-blue focus:text-medium-blue"
                              >
                                {{ child.meta.title }}
                              </RouterLink>
                            </li>
                          </ul>
                        </template>
                      </li>

                      <li>
                        <a
                          href="#"
                          class="group flex gap-x-3 rounded-md p-4 text-lg font-semibold text-light-one hover:text-light-two hover:bg-medium-blue"
                          @click.prevent="logout()"
                        >
                          <Icon
                            icon="feather:log-out"
                            class="h-7 w-7 shrink-0"
                            aria-hidden="true"
                          />
                          Logout
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </nav>

              <p class="text-center text-sm text-light-two font-light">
                <strong class="block uppercase pb-1.5">{{ appTitle }}</strong>
                <span class="block pb-1.5">Version {{ appVer }}</span>
                <br />
                All times are Philippine Standard Time.
                <br />
                &copy; {{ year }} Integrated Management Services, Inc.
              </p>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>

  <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-81 lg:flex-col">
    <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-amber-100 p-6">
      <slot name="beforeNav" />

      <nav class="mt-8 flex flex-1 flex-col">
        <ul role="list" class="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" class="-mx-2 space-y-3">
              <li v-for="item in navigation" :key="item.name">
                <RouterLink
                  v-if="!item.children?.length"
                  :to="item.href"
                  class="group flex items-center gap-x-3 rounded-md p-4 text-lg font-semibold"
                  :class="[
                    isActiveLink(item.href)
                      ? 'bg-medium-blue text-light-two'
                      : 'text-light-one hover:text-light-two hover:bg-medium-blue',
                  ]"
                >
                  <Icon :icon="item.icon" class="h-7 w-7 shrink-0" />
                  {{ item.name }}
                </RouterLink>

                <template v-else>
                  <div
                    class="group flex gap-x-3 rounded-md p-4 text-lg font-semibold cursor-pointer"
                    :class="[
                      isActiveLink(item.href)
                        ? 'bg-medium-blue text-light-two'
                        : 'text-light-one hover:text-light-two hover:bg-medium-blue',
                    ]"
                    @click="childrenOpen = item.name"
                  >
                    <Icon :icon="item.icon" class="h-7 w-7 shrink-0" />
                    {{ item.name }}
                  </div>

                  <ul
                    v-show="childrenOpen === item.name"
                    class="ml-14 mt-1 flex flex-col gap-y-2 text-lg text-light-two"
                  >
                    <li v-for="child in item.children" :key="child.name">
                      <RouterLink
                        :to="child.path"
                        class="hover:text-medium-blue focus:text-medium-blue"
                      >
                        {{ child.meta.title }}
                      </RouterLink>
                    </li>
                  </ul>
                </template>
              </li>

              <li>
                <a
                  href="#"
                  class="group flex gap-x-3 rounded-md p-4 text-lg font-semibold text-light-one hover:text-light-two hover:bg-medium-blue"
                  @click.prevent="logout()"
                >
                  <Icon icon="feather:log-out" class="h-7 w-7 shrink-0" />
                  Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      <p class="text-center text-sm text-light-two font-light">
        <strong class="block uppercase pb-1.5">{{ appTitle }}</strong>
        <span class="block pb-1.5">Version {{ appVer }}</span>
        All times are Philippine Standard Time.
        <br />
        &copy; {{ year }} Integrated Management Services, Inc.
      </p>
    </div>
  </div>
</template>
