<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  title: {
    type: String,
    default: 'Loading',
  },
  message: {
    type: String,
    default: 'Please wait while the system prepares your data.',
  },
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(145deg,#fff8ef_0%,#ffffff_46%,#f3f7ff_100%)] p-8 shadow-[0_24px_56px_rgba(21,42,78,0.12)]"
  >
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -left-12 top-0 h-40 w-40 rounded-full bg-tangerine/12 blur-3xl" />
      <div class="absolute right-0 top-10 h-48 w-48 rounded-full bg-sky/12 blur-3xl" />
      <div class="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-emerald/10 blur-3xl" />
      <div
        class="absolute inset-y-0 -left-1/3 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] animate-[loading-shimmer_2.4s_linear_infinite]"
      />
    </div>

    <div
      class="relative mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-center"
    >
      <div class="max-w-2xl">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-tangerine/15 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine shadow-sm backdrop-blur"
        >
          <span class="inline-flex h-2 w-2 rounded-full bg-tangerine animate-pulse" />
          Loading Workspace
        </div>

        <div class="mt-6 flex items-center gap-4">
          <div class="relative flex h-18 w-18 items-center justify-center">
            <div
              class="absolute inset-0 rounded-[1.6rem] border border-tangerine/20 bg-white/70 shadow-sm backdrop-blur"
            />
            <div
              class="absolute inset-1 rounded-[1.3rem] border border-white/80 bg-[linear-gradient(145deg,#173f83_0%,#2d5ca8_100%)] shadow-[0_10px_24px_rgba(21,58,120,0.26)]"
            />
            <div
              class="absolute -inset-2 rounded-[1.8rem] border border-tangerine/20 animate-[spin_4s_linear_infinite]"
            />
            <Icon
              icon="streamline-ultimate:dentistry-tooth-shield"
              class="relative h-8 w-8 text-white"
            />
          </div>

          <div>
            <h2 class="text-3xl font-black tracking-tight text-onyx">{{ title }}</h2>
            <p class="mt-2 max-w-xl text-sm leading-6 text-slate">{{ message }}</p>
          </div>
        </div>

        <div class="mt-8 max-w-xl">
          <div
            class="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate"
          >
            <span>Preparing content</span>
            <span>Syncing interface</span>
          </div>
          <div class="mt-3 h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-pebble/80">
            <div
              class="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,#b58a36_0%,#d5b063_55%,#edd7a7_100%)] animate-[loading-progress_1.8s_ease-in-out_infinite]"
            />
          </div>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="rounded-lg border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div class="h-2 w-20 rounded-full bg-tangerine/20" />
            <div class="mt-4 h-3 w-24 rounded-full bg-onyx/10" />
            <div class="mt-3 h-3 w-16 rounded-full bg-onyx/8" />
          </div>
          <div class="rounded-lg border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div class="h-2 w-16 rounded-full bg-sky/20" />
            <div class="mt-4 h-3 w-20 rounded-full bg-onyx/10" />
            <div class="mt-3 h-3 w-28 rounded-full bg-onyx/8" />
          </div>
          <div class="rounded-lg border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div class="h-2 w-14 rounded-full bg-emerald/20" />
            <div class="mt-4 h-3 w-18 rounded-full bg-onyx/10" />
            <div class="mt-3 h-3 w-24 rounded-full bg-onyx/8" />
          </div>
        </div>
      </div>

      <div class="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate">Live Preview</p>
            <p class="mt-2 text-lg font-black text-onyx">Interface skeleton</p>
          </div>
          <div class="flex gap-2">
            <span class="h-3 w-3 rounded-full bg-ruby/70" />
            <span class="h-3 w-3 rounded-full bg-amber/70" />
            <span class="h-3 w-3 rounded-full bg-emerald/70" />
          </div>
        </div>

        <div
          class="mt-5 rounded-[1.4rem] border border-pebble/70 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfc_100%)] p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="h-11 w-11 rounded-2xl bg-[linear-gradient(145deg,#dff7f5_0%,#eef8ff_100%)]"
            />
            <div class="flex-1">
              <div class="h-3 w-28 rounded-full bg-onyx/10" />
              <div class="mt-2 h-2.5 w-40 rounded-full bg-onyx/6" />
            </div>
          </div>

          <div class="mt-5 space-y-3">
            <div
              v-for="item in 4"
              :key="item"
              class="flex items-center gap-3 rounded-2xl border border-white bg-white/90 px-3 py-3 shadow-[0_8px_18px_rgba(22,49,61,0.04)]"
            >
              <div
                class="h-10 w-10 rounded-xl bg-[linear-gradient(145deg,#eef7f8_0%,#f8fbff_100%)]"
              />
              <div class="min-w-0 flex-1">
                <div
                  class="h-3 rounded-full bg-onyx/10"
                  :class="item % 2 === 0 ? 'w-2/3' : 'w-3/4'"
                />
                <div
                  class="mt-2 h-2.5 rounded-full bg-onyx/6"
                  :class="item % 2 === 0 ? 'w-1/3' : 'w-1/2'"
                />
              </div>
              <div class="h-8 w-16 rounded-full bg-tangerine/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes loading-shimmer {
  0% {
    transform: translateX(-10%) skewX(-12deg);
  }

  100% {
    transform: translateX(220%) skewX(-12deg);
  }
}

@keyframes loading-progress {
  0% {
    transform: translateX(-65%);
  }

  50% {
    transform: translateX(55%);
  }

  100% {
    transform: translateX(180%);
  }
}
</style>
