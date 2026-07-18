<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  totalEntries: {
    type: Number,
    default: 0,
  },
  totalPages: {
    type: Number,
    default: 0,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  perPage: {
    type: Number,
    default: 10,
  },
})

const emit = defineEmits<{
  (e: 'updatePgNum', page: number): void
}>()

const page = ref(props.currentPage)

watch(
  () => props.currentPage,
  (value) => (page.value = value),
)

watch(page, (value) => emit('updatePgNum', value))

const start = computed(() => {
  if (!props.totalEntries) return 0
  return (page.value - 1) * props.perPage + 1
})

const end = computed(() => Math.min(page.value * props.perPage, props.totalEntries))

const pages = computed(() => {
  const total = props.totalPages
  const current = page.value

  // If there are 7 pages or fewer, display all page numbers.
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const result: (number | string)[] = [1]

  // Show leading ellipsis when the current page is
  // far enough from the first page.
  if (current > 3) {
    result.push('...')
  }

  // Display the current page along with one page
  // before and one page after it.
  const from = Math.max(2, current - 1)
  const to = Math.min(total - 1, current + 1)

  for (let i = from; i <= to; i++) {
    result.push(i)
  }

  // Show trailing ellipsis when the current page is
  // far enough from the last page.
  if (current < total - 2) {
    result.push('...')
  }

  // Always display the last page.
  result.push(total)

  return result
})
function selectPage(n: number) {
  page.value = n
}

function previousPage() {
  if (page.value > 1) page.value--
}

function nextPage() {
  if (page.value < props.totalPages) page.value++
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex flex-col gap-4 border-t border-gray-200 pt-5 md:flex-row md:items-center md:justify-between"
  >
    <p class="text-sm text-slate">
      Showing
      <span class="font-semibold text-onyx">{{ start }}</span>
      –
      <span class="font-semibold text-onyx">{{ end }}</span>
      of
      <span class="font-semibold text-onyx">{{ totalEntries }}</span>
      entries
    </p>

    <div class="flex items-center gap-2">
      <button
        class="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-slate transition hover:border-tangerine hover:text-tangerine disabled:pointer-events-none disabled:opacity-40"
        :disabled="page === 1"
        @click="previousPage"
      >
        <Icon icon="mingcute:left-line" />
      </button>

      <template v-for="item in pages" :key="`${item}`">
        <span v-if="item === '...'" class="px-2 text-slate"> ... </span>

        <button
          v-else
          class="flex h-10 min-w-10 items-center justify-center rounded-md border px-3 transition"
          :class="
            item === page
              ? 'border-tangerine bg-tangerine text-white shadow-sm'
              : 'border-gray-200 bg-white text-onyx hover:border-tangerine hover:text-tangerine'
          "
          @click="selectPage(item as number)"
        >
          {{ item }}
        </button>
      </template>

      <button
        class="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-slate transition hover:border-tangerine hover:text-tangerine disabled:pointer-events-none disabled:opacity-40"
        :disabled="page === totalPages"
        @click="nextPage"
      >
        <Icon icon="mingcute:right-line" />
      </button>
    </div>
  </nav>
</template>
