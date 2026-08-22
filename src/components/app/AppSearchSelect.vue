<script setup lang="ts">
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxLabel,
  ComboboxOption,
  ComboboxOptions,
  TransitionRoot,
} from '@headlessui/vue'
import { Icon } from '@iconify/vue'
import { ref, watch } from 'vue'

export type SearchSelectOption = {
  value: string | number
  label: string
  description?: string
}

const props = withDefaults(
  defineProps<{
    options: SearchSelectOption[]
    label?: string
    placeholder?: string
    emptyText?: string
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    label: '',
    placeholder: 'Search and select an option',
    emptyText: 'No matching options found.',
    loading: false,
    disabled: false,
  },
)

const model = defineModel<string | number | null>({ default: null })
const search = defineModel<string>('search', { default: '' })
const retainedOption = ref<SearchSelectOption | null>(null)

watch(
  [() => props.options, model],
  ([options, value]) => {
    const normalizedValue = value == null ? null : String(value)

    if (normalizedValue == null) {
      retainedOption.value = null
      return
    }

    const matchedOption = options.find((option) => String(option.value) === normalizedValue)
    if (matchedOption) {
      retainedOption.value = matchedOption
    }
  },
  { immediate: true },
)

function displayValue(value: unknown) {
  const normalizedValue = value == null ? null : String(value)
  if (normalizedValue == null) return ''

  return (
    props.options.find((option) => String(option.value) === normalizedValue)?.label ||
    (retainedOption.value && String(retainedOption.value.value) === normalizedValue
      ? retainedOption.value.label
      : '')
  )
}
</script>

<template>
  <Combobox v-model="model" nullable :disabled="disabled">
    <div class="relative w-full">
      <ComboboxLabel v-if="label" class="mb-2 block text-sm font-medium text-onyx">
        {{ label }}
      </ComboboxLabel>

      <div class="relative">
        <Icon icon="feather:search"
          class="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate" />
        <ComboboxInput
          class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] py-3.5 pr-12 pl-12 text-onyx shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] outline-none transition-all duration-200 placeholder:text-ash hover:border-slate focus:border-tangerine focus:ring-4 focus:ring-focus-ring disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          :display-value="displayValue" :placeholder="loading ? 'Loading options...' : placeholder"
          @change="search = ($event.target as HTMLInputElement).value" />
        <ComboboxButton
          class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate transition hover:text-tangerine">
          <Icon :icon="loading ? 'feather:loader' : 'feather:chevron-down'" class="h-5 w-5"
            :class="{ 'animate-spin': loading }" />
        </ComboboxButton>
      </div>

      <TransitionRoot leave="transition ease-in duration-100" leave-from="opacity-100" leave-to="opacity-0"
        @after-leave="search = ''">
        <ComboboxOptions
          class="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-pebble bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.16)] focus:outline-none">
          <div v-if="!loading && !options.length" class="px-4 py-5 text-center text-sm text-slate">
            {{ emptyText }}
          </div>

          <ComboboxOption v-for="option in options" :key="option.value" v-slot="{ active, selected }"
            :value="option.value" as="template">
            <li class="relative cursor-pointer rounded-xl px-4 py-3 pr-10 transition"
              :class="active ? 'bg-tangerine-light text-tangerine-dark' : 'text-onyx'">
              <p class="text-sm font-semibold">{{ option.label }}</p>
              <p v-if="option.description" class="mt-1 text-xs text-slate">
                {{ option.description }}
              </p>
              <Icon v-if="selected" icon="feather:check"
                class="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-tangerine" />
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </TransitionRoot>
    </div>
  </Combobox>
</template>
