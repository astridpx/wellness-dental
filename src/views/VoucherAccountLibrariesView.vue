<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { AppButton, AppDialog, AppInput, AppPagination } from '@/components/app'
import {
  useVoucherAccountLibraries,
  type VoucherAccountCode,
  type VoucherCostCenter,
} from '@/composables'
import { formatDate } from '@/utils'

type LibraryKind = 'accountCode' | 'costCenter'
type LibraryDraft = {
  title: string
}
type LibraryActionTarget = {
  kind: LibraryKind
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
const editTarget = ref<LibraryActionTarget | null>(null)
const deleteTarget = ref<LibraryActionTarget | null>(null)
const editError = ref('')
const deleteError = ref('')
const editDraft = reactive({
  code: '',
  title: '',
})
const drafts = reactive<Record<LibraryKind, LibraryDraft>>({
  accountCode: {
    title: '',
  },
  costCenter: {
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
const editLabels = computed(() =>
  editTarget.value?.kind === 'costCenter'
    ? {
        dialogTitle: 'Edit Cost Center',
        code: 'Cost center',
        title: 'Cost center title',
      }
    : {
        dialogTitle: 'Edit Account Code',
        code: 'Account code',
        title: 'Account title',
      },
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
  drafts[kind].title = ''
}

function createActionTarget(row: VoucherAccountCode | VoucherCostCenter): LibraryActionTarget {
  return {
    kind: activeKind.value,
    id: row.id,
    code: row.code,
    title: row.title,
  }
}

function openEditModal(row: VoucherAccountCode | VoucherCostCenter) {
  resetFeedback()
  editError.value = ''
  editTarget.value = createActionTarget(row)
  editDraft.code = row.code
  editDraft.title = row.title
}

function closeEditModal() {
  if (saving.value) return
  editTarget.value = null
  editError.value = ''
}

async function confirmEdit() {
  const target = editTarget.value
  if (!target) return

  editError.value = ''
  const result = await saveItem(target.kind, {
    id: target.id,
    code: editDraft.code,
    title: editDraft.title,
  })

  if (!result.ok) {
    editError.value = result.error
    return
  }

  editTarget.value = null
  message.value = 'Row updated.'
}

async function submitForm() {
  resetFeedback()

  const result = await saveItem(activeKind.value, {
    code: '',
    title: activeDraft.value.title,
  })

  if (!result.ok) {
    error.value = result.error
    return
  }

  message.value = 'Row added.'
  resetDraft()
}

function openDeleteModal(row: VoucherAccountCode | VoucherCostCenter) {
  resetFeedback()
  deleteError.value = ''
  deleteTarget.value = createActionTarget(row)
}

function closeDeleteModal() {
  if (saving.value) return
  deleteTarget.value = null
  deleteError.value = ''
}

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return

  deleteError.value = ''
  const result = await deleteItem(target.kind, target.id)

  if (!result.ok) {
    deleteError.value = result.error
    return
  }

  deleteTarget.value = null
  message.value = 'Row deleted.'
}

onMounted(async () => {
  const result = await loadLibraries()
  console.log(result)
  if (!result.ok) error.value = result.error
})
</script>

<template>
  <AppDialog
    :title="editLabels.dialogTitle"
    :show="Boolean(editTarget)"
    eyebrow="Library Update"
    icon="✎"
    :disabled="saving"
    :confirm-label="saving ? 'Saving changes...' : 'Save Changes'"
    @close="closeEditModal"
    @confirm="confirmEdit"
  >
    <template #dialog-content>
      <div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Edit library row
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Update the title for this {{ editLabels.code.toLowerCase() }}. The assigned code cannot
            be changed.
          </p>
        </div>

        <div
          v-if="editError"
          class="rounded-2xl border border-ruby bg-ruby-light px-4 py-3 text-sm font-semibold text-ruby"
        >
          {{ editError }}
        </div>

        <div class="grid gap-4">
          <AppInput v-model="editDraft.code" :label="editLabels.code" readonly />
          <AppInput v-model="editDraft.title" :label="editLabels.title" required />
        </div>
      </div>
    </template>
  </AppDialog>

  <AppDialog
    :title="deleteTarget?.kind === 'costCenter' ? 'Delete Cost Center' : 'Delete Account Code'"
    :show="Boolean(deleteTarget)"
    eyebrow="Destructive Action"
    icon="!"
    :disabled="saving"
    :confirm-label="saving ? 'Deleting row...' : 'Delete Row'"
    @close="closeDeleteModal"
    @confirm="confirmDelete"
  >
    <template #dialog-content>
      <div class="space-y-4">
        <div
          class="rounded-[1.5rem] border border-ruby/15 bg-[linear-gradient(135deg,#fff4f4_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-ruby">
            Delete confirmation
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            This will permanently remove the selected row from the account libraries. This action
            cannot be undone.
          </p>
        </div>

        <div
          v-if="deleteError"
          class="rounded-2xl border border-ruby bg-ruby-light px-4 py-3 text-sm font-semibold text-ruby"
        >
          {{ deleteError }}
        </div>

        <div v-if="deleteTarget" class="rounded-2xl border border-pebble bg-cloud px-4 py-4">
          <p class="text-sm font-bold text-onyx">{{ deleteTarget.title }}</p>
          <p class="mt-1 text-xs uppercase tracking-[0.16em] text-slate">
            {{ deleteTarget.code }}
          </p>
        </div>
      </div>
    </template>
  </AppDialog>

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
            New Row
          </div>

          <AppInput
            :model-value="''"
            :label="`${activeLabels.code} (assigned on save)`"
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
              Add Row
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
                      @click="openEditModal(row)"
                    >
                      <Icon icon="feather:edit-2" class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-pebble bg-white text-slate transition hover:border-ruby hover:text-ruby"
                      aria-label="Delete row"
                      title="Delete row"
                      @click="openDeleteModal(row)"
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
