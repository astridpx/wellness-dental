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
  <div
    class="overflow-hidden rounded-[1.5rem] border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_18px_34px_rgba(21,42,78,0.06)]"
  >
    <div class="overflow-x-auto rounded-[1.5rem]">
      <table class="min-w-full w-max table-auto">
        <thead class="border-b border-pebble bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5fb_100%)]">
          <tr>
            <th
              v-for="th in theads"
              :key="th"
              class="whitespace-nowrap px-6 py-4 text-left text-sm font-semibold text-onyx last:text-right"
            >
              {{ th }}
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-pebble/65">
          <slot name="trs" />
        </tbody>
      </table>
    </div>

    <div class="border-t border-pebble/70 px-6 py-4">
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
  @apply px-6 py-4 align-middle text-onyx last:text-right;
  min-width: max-content;
  white-space: nowrap;
}

:deep(tbody tr) {
  @apply transition-colors duration-200;
}

:deep(tbody tr:hover) {
  @apply bg-apricot;
}
</style>
