<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'success',
    validator: (value: string) => ['success', 'error', 'info'].includes(value),
  },
  duration: {
    type: Number,
    default: 3600,
  },
})

const emit = defineEmits(['close'])

let closeTimer: ReturnType<typeof window.setTimeout> | null = null

const icon = computed(() => {
  if (props.variant === 'error') return 'feather:alert-circle'
  if (props.variant === 'info') return 'feather:info'
  return 'feather:check-circle'
})

const toneClasses = computed(() => {
  if (props.variant === 'error') {
    return {
      wrapper: 'border-ruby/25 bg-[linear-gradient(180deg,#fff8f8_0%,#ffecec_100%)]',
      icon: 'bg-ruby-light text-ruby',
      title: 'text-ruby',
    }
  }

  if (props.variant === 'info') {
    return {
      wrapper: 'border-sapphire/20 bg-[linear-gradient(180deg,#f6faff_0%,#edf5ff_100%)]',
      icon: 'bg-sapphire/10 text-sapphire',
      title: 'text-sapphire',
    }
  }

  return {
    wrapper: 'border-emerald/25 bg-[linear-gradient(180deg,#f7fff9_0%,#eaf8ef_100%)]',
    icon: 'bg-emerald-light text-emerald',
    title: 'text-emerald',
  }
})

function clearCloseTimer() {
  if (!closeTimer) return

  window.clearTimeout(closeTimer)
  closeTimer = null
}

watch(
  () => [props.show, props.duration],
  () => {
    clearCloseTimer()
    if (!props.show || props.duration <= 0) return

    closeTimer = window.setTimeout(() => emit('close'), props.duration)
  },
  { immediate: true },
)

onBeforeUnmount(clearCloseTimer)
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-to-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
  >
    <div
      v-if="props.show"
      class="fixed top-4 right-4 left-4 z-[70] sm:left-auto sm:w-full sm:max-w-sm"
      role="status"
      aria-live="polite"
    >
      <div
        class="flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_50px_rgba(19,39,69,0.16)]"
        :class="toneClasses.wrapper"
      >
        <span
          class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          :class="toneClasses.icon"
        >
          <Icon :icon="icon" class="h-4.5 w-4.5" />
        </span>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold" :class="toneClasses.title">{{ props.title }}</p>
          <p v-if="props.message" class="mt-1 text-sm leading-5 text-slate">
            {{ props.message }}
          </p>
        </div>

        <button
          type="button"
          class="rounded-lg p-1.5 text-slate transition hover:bg-white/70 hover:text-onyx"
          @click="emit('close')"
        >
          <span class="sr-only">Close notification</span>
          <Icon icon="feather:x" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>
