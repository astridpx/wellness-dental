<script setup lang="ts">
defineProps({
  placeholder: String,
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  hasError: {
    type: Boolean,
    default: false,
  },
  rows: {
    type: Number,
    default: 4,
  },
})

const model = defineModel<string>()
</script>

<template>
  <textarea
    v-model="model"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    class="w-full rounded-md border px-4 py-3 text-onyx placeholder:text-ash outline-none transition-all duration-200 focus:ring-4 focus:ring-focus-ring focus:border-tangerine"
    :class="{
      'border-ruby focus:border-ruby focus:ring-ruby/20': hasError,
      'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed': disabled,
      'border-gray-200 bg-white hover:border-slate focus:border-tangerine ': !hasError && !disabled,
    }"
  />
</template>
