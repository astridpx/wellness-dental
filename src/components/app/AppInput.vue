<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, useSlots } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
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
  min: [String, Number],
  step: [String, Number],
  inputmode: String as PropType<
    'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  >,
  pattern: String,
  decimalOnly: Boolean,
  required: Boolean,
  readonly: Boolean,
  label: String,
  multiple: Boolean,
  accept: String,
  autocomplete: String,
  fileInputResetClass: Boolean,
  inputClass: {
    type: [String, Array, Object],
  },
  disabled: Boolean,
})

defineEmits(['focus', 'blur'])

const model = defineModel<string | number>()
const showPassword = ref(false)
const slots = useSlots()

const isPasswordField = computed(() => props.type === 'password')
const hasTrailingSlot = computed(() => Boolean(slots.trailing))
const inputType = computed(() =>
  isPasswordField.value ? (showPassword.value ? 'text' : 'password') : props.type,
)

function normalizeDecimal(value: string) {
  const sanitized = value.replace(/[^\d.]/g, '')
  const [whole = '', ...decimalParts] = sanitized.split('.')
  const decimal = decimalParts.join('').slice(0, 2)

  return sanitized.includes('.') ? `${whole || '0'}.${decimal}` : whole
}

function updateModel(event: Event) {
  const input = event.target as HTMLInputElement
  const value = props.decimalOnly ? normalizeDecimal(input.value) : input.value

  if (input.value !== value) input.value = value
  model.value = value
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="mb-2 block text-sm font-medium text-onyx">
      {{ label }}
      <span v-if="required" aria-hidden="true" class="ml-1 text-ruby">*</span>
    </label>

    <div v-if="icon" class="relative">
      <Icon :icon="icon" class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" />

      <input
        :value="model"
        :type="inputType"
        :min="min"
        :step="step"
        :inputmode="inputmode"
        :pattern="pattern"
        :required="required"
        :multiple="multiple"
        :accept="accept"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :placeholder="placeholder"
        :readonly="readonly"
        class="w-full rounded-xl border py-3.5 text-onyx placeholder:text-ash outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 focus:ring-4 focus:ring-focus-ring focus:border-tangerine"
        :class="[
          inputClass,
          {
            'pr-24': isPasswordField && hasTrailingSlot,
            'pr-12': isPasswordField && !hasTrailingSlot,
            'px-12': !isPasswordField,
            'pl-12': true,
            'border-ruby focus:border-ruby focus:ring-ruby/20': hasError,
            'file-input-reset': fileInputResetClass,
            'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400': disabled,
            'border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] hover:border-slate focus:border-tangerine focus:ring-4 focus:ring-focus-ring':
              transparent && !hasError && !disabled,
            'border-transparent bg-[linear-gradient(180deg,#f8f1e4_0%,#fdf9f1_100%)] hover:bg-white focus:border-tangerine focus:bg-white focus:ring-4 focus:ring-focus-ring':
              !transparent && !hasError && !disabled,
          },
        ]"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
        @input="updateModel"
      />

      <div
        v-if="isPasswordField || hasTrailingSlot"
        class="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2"
      >
        <slot name="trailing" />
        <button
          v-if="isPasswordField"
          type="button"
          class="text-slate transition hover:text-onyx"
          @click="showPassword = !showPassword"
        >
          <Icon :icon="showPassword ? 'feather:eye-off' : 'feather:eye'" class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div v-else class="relative">
      <input
        :value="model"
        :type="inputType"
        :min="min"
        :step="step"
        :inputmode="inputmode"
        :pattern="pattern"
        :required="required"
        :multiple="multiple"
        :accept="accept"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :placeholder="placeholder"
        :readonly="readonly"
        class="w-full rounded-xl border py-3.5 text-onyx placeholder:text-ash outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-200 focus:ring-4 focus:ring-focus-ring focus:border-tangerine"
        :class="[
          inputClass,
          {
            'px-4': !isPasswordField,
            'pl-4 pr-24': isPasswordField && hasTrailingSlot,
            'pl-4 pr-12': isPasswordField && !hasTrailingSlot,
            'border-ruby focus:border-ruby focus:ring-ruby/20': hasError,
            'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400': disabled,
            'border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] hover:border-slate focus:border-tangerine':
              transparent && !hasError && !disabled,
            'border-transparent bg-[linear-gradient(180deg,#f8f1e4_0%,#fdf9f1_100%)] hover:bg-white focus:border-tangerine focus:bg-white':
              !transparent && !hasError && !disabled,
          },
        ]"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
        @input="updateModel"
      />

      <div
        v-if="isPasswordField || hasTrailingSlot"
        class="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2"
      >
        <slot name="trailing" />
        <button
          v-if="isPasswordField"
          type="button"
          class="text-slate transition hover:text-onyx"
          @click="showPassword = !showPassword"
        >
          <Icon :icon="showPassword ? 'feather:eye-off' : 'feather:eye'" class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>
