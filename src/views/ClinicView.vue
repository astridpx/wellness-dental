<script setup lang="ts">
import { Icon } from '@iconify/vue'

const clinicHighlights = [
  {
    label: 'Workspace role',
    value: 'Clinic configuration',
    description: 'Manage branch identity, operating references, and staff-facing clinic details.',
    icon: 'feather:briefcase',
  },
  {
    label: 'Operations focus',
    value: 'Internal records',
    description: 'Keep setup information aligned with daily recording, billing, and provider flow.',
    icon: 'feather:clipboard',
  },
  {
    label: 'Setup readiness',
    value: 'Ready for expansion',
    description: 'This page can grow into clinic profile, contact, and branch configuration later.',
    icon: 'feather:layers',
  },
]

const clinicNotes = [
  'Use this area for clinic profile settings, branch details, and internal setup references.',
  'Add future items here such as address, contact channels, operating schedule, and branch codes.',
  'Keep clinic-wide settings separate from users, dentists, plans, and procedure setup.',
]
</script>

<template>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#f7fbff_0%,#ffffff_52%,#fbf6ea_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div class="space-y-4">
          <div
            class="inline-flex items-center rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-tangerine"
          >
            Clinic workspace
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Clinic profile and setup</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
              A dedicated place for clinic-wide information so internal operations stay organized,
              separate from staff accounts, dentist profiles, transactions, and plans.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div
              v-for="item in clinicHighlights"
              :key="item.label"
              class="rounded-[1.4rem] border border-pebble bg-white px-5 py-4 shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#eef3ff_0%,#fbf4e4_100%)] text-tangerine"
                >
                  <Icon :icon="item.icon" class="h-5 w-5" />
                </div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
                  {{ item.label }}
                </p>
              </div>
              <p class="mt-4 text-xl font-black text-onyx">{{ item.value }}</p>
              <p class="mt-2 text-sm leading-6 text-slate">{{ item.description }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-[1.6rem] border border-pebble bg-white p-5 shadow-sm">
          <div class="flex items-start gap-4">
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(145deg,#eef3ff_0%,#fbf4e4_100%)] text-tangerine shadow-sm"
            >
              <Icon icon="feather:home" class="h-7 w-7" />
            </div>
            <div>
              <p class="text-sm font-bold text-onyx">New clinic section</p>
              <p class="mt-1 text-sm leading-6 text-slate">
                This page is ready for clinic information and future branch-level configuration.
              </p>
            </div>
          </div>

          <div class="mt-5 space-y-3">
            <div
              v-for="note in clinicNotes"
              :key="note"
              class="rounded-2xl border border-pebble bg-cloud px-4 py-4 text-sm leading-6 text-onyx"
            >
              {{ note }}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
