<script setup lang="ts">
import AppPagination from './AppPagination.vue'

defineProps({
  theads: {
    type: Array<string>,
    required: true,
  },
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
})

const emit = defineEmits<{
  (e: 'updatePgNum', page: number): void
}>()
</script>

<template>
  <div class="overflow-hidsden rounded-md border border-gray-200 bg-white shadow-sm">
    <div class="overflow-x-scroll grid rounded-md">
      <table class="min-w-full">
        <thead class="border-b border-gray-200 bg-cloud">
          <tr>
            <th
              v-for="th in theads"
              :key="th"
              class="px-6 py-4 text-left text-sm font-semibold text-onyx last:text-right"
            >
              {{ th }}
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100">
          <slot name="trs" />
        </tbody>
      </table>
    </div>

    <div class="px-6 py-4">
      <AppPagination
        :total-entries="totalEntries"
        :total-pages="totalPages"
        :current-page="currentPage"
        @update-pg-num="emit('updatePgNum', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
@reference '../../assets/css/main.css';

:deep(td) {
  @apply px-6 py-4 text-onyx last:text-right;
}

:deep(tbody tr) {
  @apply transition-colors duration-200;
}

:deep(tbody tr:hover) {
  @apply bg-apricot;
}
</style>
