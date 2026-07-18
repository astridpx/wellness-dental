<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed } from 'vue'

const { align } = defineProps({
  text: String,
  align: {
    type: String as PropType<'left' | 'center' | 'right'>,
    default: 'center',
  },
})

// const alignClass = computed(() => ({
//   left: '',
//   center: '-translate-x-1/2',
//   right: '-translate-x-full',
// })[props.align])
const alignClass = computed(
  () =>
    ({
      left: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      right: 'right-0',
    })[align],
)
</script>

<template>
  <div class="group relative inline-block cursor-pointer">
    <slot name="trigger" />

    <div
      :class="alignClass"
      class="absolute bottom-full z-30 mb-2 hidden whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block"
    >
      {{ text }}
    </div>
  </div>
</template>
