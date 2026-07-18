<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import AppButton from '@/components/app/AppButton.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  show: {
    type: Boolean,
    required: true,
  },
  maxWidth: {
    type: String,
    default: 'sm:max-w-lg',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  confirmLabel: {
    type: String,
    default: 'Submit',
  },
})
defineEmits(['close', 'confirm'])
</script>

<template>
  <TransitionRoot as="template" :show="props.show">
    <Dialog class="relative z-10" @close="$emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div
          class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6"
        >
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
              class="relative w-full transform overflow-hidden rounded-4xl border border-white/70 bg-[linear-gradient(180deg,#ffffff_0%,#fffaf3_100%)] p-5 text-left shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-all sm:my-8 sm:p-8"
              :class="props.maxWidth"
            >
              <button
                type="button"
                class="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-pebble bg-white/90 text-lg font-semibold text-slate transition hover:border-tangerine hover:text-tangerine"
                @click="$emit('close')"
              >
                ×
              </button>

              <div class="rounded-[1.5rem] border border-white/80 bg-white/75 p-5 shadow-sm sm:p-6">
                <div class="mb-6 flex items-center gap-3">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-2xl bg-tangerine-light text-xl text-tangerine shadow-sm"
                  >
                    +
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate">
                      Create Flow
                    </p>
                    <DialogTitle as="h3" class="text-2xl font-black text-onyx sm:text-3xl">
                      {{ props.title }}
                    </DialogTitle>
                  </div>
                </div>

                <div class="mt-5">
                  <slot name="dialog-content" />
                </div>
              </div>

              <div class="mt-5 grid gap-3 sm:grid-flow-col sm:grid-cols-2">
                <AppButton btn-theme="outline" class="w-full normal-case" @click="$emit('close')">
                  Cancel
                </AppButton>
                <AppButton
                  :disabled="props.disabled"
                  btn-theme="primary"
                  class="w-full normal-case"
                  @click="$emit('confirm')"
                >
                  {{ props.confirmLabel }}
                </AppButton>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
