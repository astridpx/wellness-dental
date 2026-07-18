<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  transparent: {
    type: Boolean,
    default: true,
  },
  placeholder: String,
  icon: String,
  hasError: Boolean,
  type: {
    type: String,
    default: 'text',
  },
  readonly: Boolean,
  label: String,
  multiple: Boolean,
  accept: String,
  fileInputResetClass: Boolean,
  inputClass: {
    type: [String, Array, Object],
  },
  disabled: Boolean,
})

defineEmits(['focus', 'blur'])

const model = defineModel<string | number>()
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="mb-2 block text-sm font-medium text-onyx">
      {{ label }}
    </label>

    <div v-if="icon" class="relative">
      <Icon :icon="icon" class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" />

      <input
        v-model="model"
        :type="type"
        :multiple="multiple"
        :accept="accept"
        :disabled="disabled"
        :placeholder="placeholder"
        :readonly="readonly"
        class="w-full rounded-md border px-12 py-3.5 text-onyx placeholder:text-ash outline-none transition-all duration-200 focus:ring-4 focus:ring-focus-ring focus:border-tangerine"
        :class="[
          inputClass,
          {
            'border-ruby focus:border-ruby focus:ring-ruby/20': hasError,
            'file-input-reset': fileInputResetClass,
            'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400': disabled,
            'border-gray-200 bg-white hover:border-slate focus:border-tangerine focus:ring-4 focus:ring-focus-ring':
              transparent && !hasError && !disabled,
            'border-transparent bg-apricot hover:bg-white focus:border-tangerine focus:bg-white focus:ring-4 focus:ring-focus-ring':
              !transparent && !hasError && !disabled,
          },
        ]"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />

      <slot />
    </div>

    <input
      v-else
      v-model="model"
      :type="type"
      :multiple="multiple"
      :accept="accept"
      :disabled="disabled"
      :placeholder="placeholder"
      :readonly="readonly"
      class="w-full rounded-md border px-4 py-3.5 text-onyx placeholder:text-ash outline-none transition-all duration-200 focus:ring-4 focus:ring-focus-ring focus:border-tangerine"
      :class="[
        inputClass,
        {
          'border-ruby focus:border-ruby focus:ring-ruby/20': hasError,
          'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400': disabled,
          'border-gray-200 bg-white hover:border-slate focus:border-tangerine':
            transparent && !hasError && !disabled,
          'border-transparent bg-apricot hover:bg-white focus:border-tangerine focus:bg-white':
            !transparent && !hasError && !disabled,
        },
      ]"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    />
  </div>
</template>
