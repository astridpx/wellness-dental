<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { AppButton, AppInput, AppPagination } from '@/components/app'
import {
  useVoucherAccountLibraries,
  type VoucherAccountCode,
  type VoucherCostCenter,
} from '@/composables'
import { formatDate } from '@/utils'

type LibraryKind = 'accountCode' | 'costCenter'
type LibraryDraft = {
  id: string
  code: string
  title: string
}

const PAGE_SIZE = 5

const { accountCodes, costCenters, deleteItem, filters, loadLibraries, loading, saveItem, saving } =
  useVoucherAccountLibraries()

const activeKind = ref<LibraryKind>('accountCode')
const message = ref('')
const error = ref('')
const drafts = reactive<Record<LibraryKind, LibraryDraft>>({
  accountCode: {
    id: '',
    code: '',
    title: '',
  },
  costCenter: {
    id: '',
    code: '',
    title: '',
  },
})
const currentPages = reactive<Record<LibraryKind, number>>({
  accountCode: 1,
  costCenter: 1,
})

const activeDraft = computed(() => drafts[activeKind.value])
const activeRows = computed(() =>
  activeKind.value === 'accountCode' ? accountCodes.value : costCenters.value,
)
const activeSearchCode = computed({
  get: () => (activeKind.value === 'accountCode' ? filters.accountCode : filters.costCenter),
  set: (value: string) => {
    if (activeKind.value === 'accountCode') filters.accountCode = value
    else filters.costCenter = value
  },
})
const activeSearchTitle = computed({
  get: () => (activeKind.value === 'accountCode' ? filters.accountTitle : filters.costCenterTitle),
  set: (value: string) => {
    if (activeKind.value === 'accountCode') filters.accountTitle = value
    else filters.costCenterTitle = value
  },
})
const hasActiveSearch = computed(() =>
  Boolean(activeSearchCode.value.trim() || activeSearchTitle.value.trim()),
)
const activePage = computed({
  get: () => currentPages[activeKind.value],
  set: (page: number) => {
    currentPages[activeKind.value] = page
  },
})
const totalPages = computed(() => Math.ceil(activeRows.value.length / PAGE_SIZE))
const paginatedRows = computed(() => {
  const start = (activePage.value - 1) * PAGE_SIZE
  return activeRows.value.slice(start, start + PAGE_SIZE)
})
const activeLabels = computed(() =>
  activeKind.value === 'accountCode'
    ? {
        eyebrow: 'Account Codes',
        code: 'Account code',
        title: 'Account title',
        empty: 'No account codes yet.',
        emptySearch: 'No matching account codes found.',
      }
    : {
        eyebrow: 'Cost Centers',
        code: 'Cost center',
        title: 'Cost center title',
        empty: 'No cost centers yet.',
        emptySearch: 'No matching cost centers found.',
      },
)
const isEditing = computed(() => Boolean(activeDraft.value.id))
const formCode = computed({
  get() {
    if (!isEditing.value) return ''
    return activeDraft.value.code
  },
  set(value: string) {
    activeDraft.value.code = value
  },
})
const formCodeLabel = computed(() =>
  activeKind.value === 'accountCode'
    ? 'Account code (assigned on save)'
    : 'Cost center (assigned on save)',
)

watch(
  [() => accountCodes.value.length, () => costCenters.value.length],
  ([accountCodeCount, costCenterCount]) => {
    currentPages.accountCode = Math.min(
      currentPages.accountCode,
      Math.max(1, Math.ceil(accountCodeCount / PAGE_SIZE)),
    )
    currentPages.costCenter = Math.min(
      currentPages.costCenter,
      Math.max(1, Math.ceil(costCenterCount / PAGE_SIZE)),
    )
  },
)

async function applySearch() {
  resetFeedback()
  currentPages[activeKind.value] = 1

  const result = await loadLibraries()
  if (!result.ok) error.value = result.error
}

async function clearSearch() {
  activeSearchCode.value = ''
  activeSearchTitle.value = ''
  await applySearch()
}

function resetFeedback() {
  message.value = ''
  error.value = ''
}

function resetDraft(kind: LibraryKind = activeKind.value) {
  drafts[kind].id = ''
  drafts[kind].code = ''
  drafts[kind].title = ''
}

function editRow(row: VoucherAccountCode | VoucherCostCenter) {
  resetFeedback()
  activeDraft.value.id = row.id
  activeDraft.value.code = row.code
  activeDraft.value.title = row.title
}

async function submitForm() {
  resetFeedback()

  const result = await saveItem(activeKind.value, {
    id: activeDraft.value.id || undefined,
    code: formCode.value,
    title: activeDraft.value.title,
  })

  if (!result.ok) {
    error.value = result.error
    return
  }

  message.value = isEditing.value ? 'Row updated.' : 'Row added.'
  resetDraft()
}

async function removeRow(row: VoucherAccountCode | VoucherCostCenter) {
  resetFeedback()

  const result = await deleteItem(activeKind.value, row.id)

  if (!result.ok) {
    error.value = result.error
    return
  }

  if (activeDraft.value.id === row.id) resetDraft()
  message.value = 'Row deleted.'
}

onMounted(async () => {
  const result = await loadLibraries()
  console.log(result)
  if (!result.ok) error.value = result.error
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-smoke">Cheque</p>
        <h1 class="mt-2 text-2xl font-black text-onyx">Account Code & Cost Center Management</h1>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
      <form
        class="space-y-5 rounded-3xl border border-[#d8d1c5] bg-[linear-gradient(180deg,#fbf6ee_0%,#eef1ed_100%)] p-5 shadow-sm"
        @submit.prevent="submitForm"
      >
        <div class="grid grid-cols-2 gap-2 rounded-2xl border border-pebble bg-white p-1">
          <button
            type="button"
            class="rounded-xl px-3 py-2 text-sm font-bold transition"
            :class="
              activeKind === 'accountCode'
                ? 'bg-tangerine text-white shadow-sm'
                : 'text-slate hover:bg-tangerine-light hover:text-tangerine'
            "
            @click="activeKind = 'accountCode'"
          >
            Account Codes
          </button>
          <button
            type="button"
            class="rounded-xl px-3 py-2 text-sm font-bold transition"
            :class="
              activeKind === 'costCenter'
                ? 'bg-tangerine text-white shadow-sm'
                : 'text-slate hover:bg-tangerine-light hover:text-tangerine'
            "
            @click="activeKind = 'costCenter'"
          >
            Cost Centers
          </button>
        </div>

        <section class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate"
          >
            <Icon icon="feather:edit-3" class="h-4 w-4" />
            {{ isEditing ? 'Edit Row' : 'New Row' }}
          </div>

          <AppInput
            v-model="formCode"
            :label="formCodeLabel"
            placeholder="Auto assigned on save"
            readonly
          />
          <AppInput v-model="activeDraft.title" :label="activeLabels.title" required />

          <div
            v-if="message || error"
            class="rounded-2xl border px-4 py-3 text-sm font-semibold"
            :class="
              error
                ? 'border-ruby bg-ruby-light text-ruby'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            "
          >
            {{ error || message }}
          </div>

          <div class="flex flex-wrap gap-3">
            <AppButton btn-theme="primary" type="submit" :disabled="saving">
              <Icon
                :icon="saving ? 'feather:loader' : 'feather:save'"
                class="h-4 w-4"
                :class="{ 'animate-spin': saving }"
              />
              {{ isEditing ? 'Update Row' : 'Add Row' }}
            </AppButton>
            <AppButton btn-theme="outline" type="button" @click="resetDraft()">
              <Icon icon="feather:x" class="h-4 w-4" />
              Clear
            </AppButton>
          </div>
        </section>
      </form>

      <section class="overflow-hidden rounded-3xl border border-[#d8d1c5] bg-white shadow-sm">
        <div
          class="flex flex-col gap-2 border-b border-pebble bg-[#f8f2e8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate">
              {{ activeLabels.eyebrow }}
            </p>
            <p class="mt-1 text-sm text-smoke">
              {{ activeRows.length }} {{ hasActiveSearch ? 'matching' : 'saved' }} rows
            </p>
          </div>
        </div>

        <form
          class="grid gap-3 border-b border-pebble bg-white px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
          @submit.prevent="applySearch"
        >
          <AppInput
            v-model="activeSearchCode"
            :label="activeLabels.code"
            :placeholder="`Search ${activeLabels.code.toLowerCase()}`"
            icon="feather:search"
            type="search"
            :disabled="loading"
          />
          <AppInput
            v-model="activeSearchTitle"
            :label="activeLabels.title"
            :placeholder="`Search ${activeLabels.title.toLowerCase()}`"
            icon="feather:search"
            type="search"
            :disabled="loading"
          />
          <div class="flex flex-wrap gap-2">
            <AppButton btn-theme="primary" type="submit" :disabled="loading">
              <Icon icon="feather:search" class="h-4 w-4" />
              Search
            </AppButton>
            <AppButton
              v-if="hasActiveSearch"
              btn-theme="outline"
              type="button"
              :disabled="loading"
              @click="clearSearch"
            >
              <Icon icon="feather:x" class="h-4 w-4" />
              Clear
            </AppButton>
          </div>
        </form>

        <div
          v-if="loading"
          class="flex items-center justify-center gap-3 p-10 text-sm font-semibold text-slate"
        >
          <Icon icon="feather:loader" class="h-5 w-5 animate-spin" />
          Loading rows...
        </div>

        <div v-else-if="!activeRows.length" class="p-10 text-center text-sm text-slate">
          {{ hasActiveSearch ? activeLabels.emptySearch : activeLabels.empty }}
        </div>

        <div v-else class="overflow-auto">
          <table class="w-full min-w-[680px] text-left text-sm">
            <thead class="bg-[#fbf8f1] text-xs uppercase tracking-[0.16em] text-slate">
              <tr>
                <th class="px-5 py-3">{{ activeLabels.code }}</th>
                <th class="px-5 py-3">{{ activeLabels.title }}</th>
                <th class="px-5 py-3">Date</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-pebble">
              <tr v-for="row in paginatedRows" :key="row.id" class="transition hover:bg-[#fffaf0]">
                <td class="px-5 py-4 font-bold text-onyx">{{ row.code }}</td>
                <td class="px-5 py-4 text-onyx">{{ row.title }}</td>
                <td class="px-5 py-4 text-slate">{{ formatDate(row.date) }}</td>
                <td class="px-5 py-4">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-pebble bg-white text-slate transition hover:border-tangerine hover:text-tangerine"
                      aria-label="Edit row"
                      title="Edit row"
                      @click="editRow(row)"
                    >
                      <Icon icon="feather:edit-2" class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-pebble bg-white text-slate transition hover:border-ruby hover:text-ruby"
                      aria-label="Delete row"
                      title="Delete row"
                      @click="removeRow(row)"
                    >
                      <Icon icon="feather:trash-2" class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="totalPages > 1" class="border-t border-pebble px-5 py-4">
            <AppPagination
              :total-entries="activeRows.length"
              :total-pages="totalPages"
              :current-page="activePage"
              :per-page="PAGE_SIZE"
              @update-pg-num="activePage = $event"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
