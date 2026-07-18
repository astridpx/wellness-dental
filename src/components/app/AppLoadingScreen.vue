<script setup lang="ts">
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
    class="overflow-hidden rounded-[1.5rem] border border-pebble bg-[radial-gradient(circle_at_top_left,#fff8ef_0%,#ffffff_48%,#f8fbff_100%)] p-8 shadow-sm"
  >
    <div class="mx-auto flex max-w-xl flex-col items-center text-center">
      <div class="relative flex h-20 w-20 items-center justify-center">
        <div
          class="absolute inset-0 rounded-full border-4 border-tangerine/15 border-t-tangerine animate-spin"
        />
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-tangerine-light text-sm font-black uppercase tracking-[0.18em] text-tangerine"
        >
          IMS
        </div>
      </div>

      <p class="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate">
        System Loading
      </p>
      <h2 class="mt-2 text-2xl font-black tracking-tight text-onyx">{{ title }}</h2>
      <p class="mt-3 max-w-md text-sm leading-6 text-slate">{{ message }}</p>

      <div class="mt-6 grid w-full max-w-sm gap-3 sm:grid-cols-3">
        <div class="h-2 rounded-full bg-tangerine/80" />
        <div class="h-2 rounded-full bg-tangerine/45" />
        <div class="h-2 rounded-full bg-tangerine/20" />
      </div>
    </div>
  </div>
</template>
