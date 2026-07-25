<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  value: {
    type: [String, Number],
    default: '',
  },
  loadingLabel: {
    type: String,
    default: 'Loading',
  },
  valueClass: {
    type: [String, Array, Object],
    default: 'mt-2 text-3xl font-black text-onyx',
  },
  loadingClass: {
    type: [String, Array, Object],
    default: 'mt-2 flex items-center gap-2 text-slate',
  },
})
</script>

<template>
  <div v-if="loading" :class="loadingClass">
    <Icon icon="feather:loader" class="h-5 w-5 animate-spin" />
    <span class="text-sm font-semibold">{{ loadingLabel }}</span>
  </div>
  <p v-else :class="valueClass">{{ value }}</p>
</template>
