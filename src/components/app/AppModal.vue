<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: 'sm:max-w-xl',
  },
})

defineEmits(['close'])
</script>

<template>
  <TransitionRoot as="template" :show="props.show">
    <Dialog class="relative z-50" @close="$emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-onyx/35 backdrop-blur-sm transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 sm:items-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="flex max-h-[calc(100vh-2rem)] w-full transform flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl transition-all sm:max-h-[calc(100vh-3rem)]"
              :class="props.maxWidth"
            >
              <div class="shrink-0 flex items-start justify-between border-b border-pebble px-6 py-5">
                <div>
                  <p
                    v-if="props.subtitle"
                    class="text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
                  >
                    {{ props.subtitle }}
                  </p>
                  <DialogTitle as="h2" class="mt-1 text-xl font-black text-onyx">
                    {{ props.title }}
                  </DialogTitle>
                </div>
                <button
                  type="button"
                  class="rounded-lg p-2 text-slate transition hover:bg-fog"
                  @click="$emit('close')"
                >
                  <span class="sr-only">Close modal</span>
                  ×
                </button>
              </div>

              <div class="scrollbar min-h-0 flex-1 overflow-y-scroll">
                <slot />
              </div>

              <div
                v-if="$slots.footer"
                class="shrink-0 border-t border-pebble px-6 py-5"
              >
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
