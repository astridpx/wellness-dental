<script setup lang="ts">
defineProps({
  btnTheme: {
    type: String,
    default: '',
    validator: (value: string) => ['primary', 'primary-alt', 'outline', 'danger'].includes(value),
  },
})
</script>

<template>
  <button
    class="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold tracking-[0.03em] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[--color-focus-ring] active:scale-[0.99] disabled:cursor-not-allowed disabled:border-pebble disabled:bg-fog disabled:text-smoke uppercase"
    :class="{
      /* Orange (Primary CTA) */
      'border-tangerine bg-[linear-gradient(180deg,#c19845_0%,#aa7f27_100%)] text-snow shadow-[0_14px_26px_rgba(176,138,52,0.26)] hover:border-tangerine-dark hover:bg-[linear-gradient(180deg,#b58a36_0%,#946918_100%)] hover:shadow-[0_18px_34px_rgba(176,138,52,0.3)]':
        btnTheme === 'primary',

      /* Blue */
      'border-sapphire bg-[linear-gradient(180deg,#1d4b96_0%,#143a78_100%)] text-snow shadow-[0_14px_26px_rgba(21,58,120,0.24)] hover:border-sapphire-dark hover:bg-[linear-gradient(180deg,#173f83_0%,#0f2e61_100%)] hover:shadow-[0_18px_34px_rgba(21,58,120,0.28)]':
        btnTheme === 'primary-alt',

      /* Outline */
      'border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] text-onyx shadow-[0_10px_20px_rgba(21,42,78,0.05)] hover:border-tangerine hover:bg-tangerine-light hover:text-tangerine':
        btnTheme === 'outline',

      /* Danger */
      'border-ruby bg-[linear-gradient(180deg,#df6565_0%,#cb4f4f_100%)] text-snow shadow-[0_14px_26px_rgba(212,85,85,0.22)] hover:bg-red-600 hover:border-red-600':
        btnTheme === 'danger',
    }"
  >
    <slot />
  </button>
</template>
