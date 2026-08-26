<script setup lang="ts">
const appTitle = import.meta.env.VITE_APP_TITLE || 'IMS WELLNESS DASHBOARD'
</script>

<template>
  <main
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#132739_0%,#173247_30%,#1d4761_62%,#f2e6d0_180%)] px-6 py-12 text-white"
  >
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute -left-24 top-16 h-64 w-64 rounded-full bg-[#d2a648]/20 blur-3xl"
      />
      <div
        class="absolute right-0 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl"
      />
      <div
        class="absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#f4e7c5]/18 blur-3xl"
      />
    </div>

    <section
      class="relative w-full max-w-3xl rounded-4xl border border-white/15 bg-white/8 p-8 shadow-[0_24px_90px_rgba(5,14,22,0.38)] backdrop-blur-xl sm:p-12"
    >
      <p class="text-xs font-semibold uppercase tracking-[0.34em] text-[#f3d690]">
        Scheduled maintenance
      </p>
      <h1 class="mt-4 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
        {{ appTitle }} is temporarily unavailable
      </h1>
      <p class="mt-5 max-w-2xl text-base leading-7 text-white/76 sm:text-lg">
        We’re making a few updates behind the scenes. Please check back shortly.
      </p>

      <div
        class="mt-10 grid gap-4 rounded-[1.5rem] border border-white/12 bg-black/10 p-5 text-sm text-white/78"
      >
        <div>
          <p class="font-semibold text-white">Status</p>
          <p class="mt-2">Maintenance mode is currently enabled for this environment.</p>
        </div>
      </div>
    </section>
  </main>
</template>
