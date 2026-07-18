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
    class="inline-flex items-center justify-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[--color-focus-ring] active:scale-[0.99] disabled:cursor-not-allowed disabled:border-pebble disabled:bg-fog disabled:text-smoke uppercase"
    :class="{
      /* Orange (Primary CTA) */
      'border-tangerine bg-tangerine text-snow hover:border-tangerine-dark hover:bg-tangerine-dark':
        btnTheme === 'primary',

      /* Blue */
      'border-sapphire bg-sapphire text-snow hover:border-sapphire-dark hover:bg-sapphire-dark':
        btnTheme === 'primary-alt',

      /* Outline */
      'border-pebble bg-snow text-onyx hover:border-tangerine hover:bg-tangerine-light hover:text-tangerine':
        btnTheme === 'outline',

      /* Danger */
      'border-ruby bg-ruby text-snow hover:bg-red-600 hover:border-red-600': btnTheme === 'danger',
    }"
  >
    <slot />
  </button>
</template>
