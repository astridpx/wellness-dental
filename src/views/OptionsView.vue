<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { AppButton, AppDialog, AppInput, AppLoadingScreen, AppModal } from '@/components/app'
import { usePaymentModes, useProcedures } from '@/composables'
import type { PaymentModeOption, ProcedureOption } from '@/composables'

type OptionCategory = 'Procedures' | 'Payment Modes' | 'Benefits'

type OptionItem = {
  id: number
  category: OptionCategory
  name: string
  code: string
  description: string
  price?: number
  active: boolean
  monthInterval?: number
  quantity?: number
}

const categories: Array<{ name: OptionCategory; icon: string; description: string }> = [
  {
    name: 'Procedures',
    icon: 'streamline-ultimate:dentistry-tooth-shield',
    description: 'Procedures and treatments available for scheduling and billing.',
  },
  {
    name: 'Benefits',
    icon: 'boxicons:bookmark-heart',
    description: 'Coverage items, inclusions, and treatment entitlements.',
  },
  {
    name: 'Payment Modes',
    icon: 'feather:credit-card',
    description: 'Ways patients can settle their balances.',
  },
]

const localOptions = ref<OptionItem[]>([
  {
    id: 7,
    category: 'Benefits',
    name: 'Preventive Cleaning Benefit',
    code: 'PCB',
    description: 'Member benefit for routine cleaning coverage.',
    active: true,
  },
  {
    id: 8,
    category: 'Benefits',
    name: 'Simple Extraction Benefit',
    code: 'SEB',
    description: 'Coverage for non-surgical extraction procedures.',
    active: true,
  },
])

const selectedCategory = ref<OptionCategory>('Procedures')
const search = ref('')
const showForm = ref(false)
const showDeleteDialog = ref(false)
const showStatusDialog = ref(false)
const editingId = ref<number | null>(null)
const localErrorMessage = ref('')
const pendingDeleteOption = ref<OptionItem | null>(null)
const pendingStatusOption = ref<OptionItem | null>(null)
const form = ref({
  category: 'Procedures' as OptionCategory,
  name: '',
  code: '',
  description: '',
  price: '',
  monthInterval: '1',
  quantity: '1'
})
const {
  clearProcedureError,
  errorMessage: procedureErrorMessage,
  loadingProcedures,
  procedures,
  saveProcedure: persistProcedure,
  savingProcedure,
  toggleProcedure: persistProcedureToggle
} = useProcedures()
const {
  clearPaymentModeError,
  errorMessage: paymentModeErrorMessage,
  loadingPaymentModes,
  paymentModes,
  savePaymentMode: persistPaymentMode,
  savingPaymentMode,
  togglePaymentMode: persistPaymentModeToggle,
} = usePaymentModes()

const selectedCategoryDetails = computed(() =>
  categories.find((category) => category.name === selectedCategory.value),
)
const options = computed(() => [...localOptions.value, ...procedures.value, ...paymentModes.value])
const categoryOptions = computed(() =>
  options.value.filter((option) => option.category === selectedCategory.value),
)
const filteredOptions = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return categoryOptions.value

  return categoryOptions.value.filter((option) =>
    [option.name, option.code, option.description].some((value) =>
      value.toLowerCase().includes(term),
    ),
  )
})
const totalActiveOptions = computed(() => options.value.filter((option) => option.active).length)
const isPaymentModesSelected = computed(() => selectedCategory.value === 'Payment Modes')
const isProceduresSelected = computed(() => selectedCategory.value === 'Procedures')
const errorMessage = computed(
  () => localErrorMessage.value || procedureErrorMessage.value || paymentModeErrorMessage.value,
)

function getCategoryCount(category: OptionCategory) {
  return options.value.filter((option) => option.category === category).length
}

function getCategoryAccent(category: OptionCategory) {
  if (category === 'Procedures') {
    return {
      surface: 'from-sapphire-light via-white to-snow',
      badge: 'bg-sapphire text-white',
      text: 'text-sapphire',
      ring: 'ring-sapphire/12',
    }
  }

  if (category === 'Payment Modes') {
    return {
      surface: 'from-tangerine-light via-white to-snow',
      badge: 'bg-tangerine text-white',
      text: 'text-tangerine-dark',
      ring: 'ring-tangerine/12',
    }
  }

  return {
    surface: 'from-emerald-light via-white to-snow',
    badge: 'bg-emerald text-white',
    text: 'text-emerald',
    ring: 'ring-emerald/12',
  }
}

function isPaymentModeOption(option: OptionItem | PaymentModeOption): option is PaymentModeOption {
  return option.category === 'Payment Modes'
}

function isProcedureOption(option: OptionItem | ProcedureOption): option is ProcedureOption {
  return option.category === 'Procedures' && 'monthInterval' in option && 'quantity' in option
}

function selectCategory(category: OptionCategory) {
  selectedCategory.value = category
  search.value = ''
  localErrorMessage.value = ''
  clearProcedureError()
  clearPaymentModeError()
}

function resetForm() {
  editingId.value = null
  form.value = {
    category: selectedCategory.value,
    name: '',
    code: '',
    description: '',
    price: '',
    monthInterval: '1',
    quantity: '1'
  }
}

function openCreateForm() {
  resetForm()
  showForm.value = true
}

function openEditForm(option: OptionItem) {
  editingId.value = option.id
  form.value = {
    category: option.category,
    name: option.name,
    code: option.code,
    description: option.description,
    price: option.price?.toString() ?? '',
    monthInterval: String(option.monthInterval ?? 1),
    quantity: String(option.quantity ?? 1)
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

function confirmDelete(option: OptionItem) {
  if (option.category === 'Procedures') {
    localErrorMessage.value = 'Delete for procedures is not available yet.'
    return
  }

  if (option.category === 'Payment Modes') {
    localErrorMessage.value = 'Delete for payment modes is not available yet.'
    return
  }

  pendingDeleteOption.value = option
  showDeleteDialog.value = true
}

function closeDeleteDialog() {
  showDeleteDialog.value = false
  pendingDeleteOption.value = null
}

function confirmStatusChange(option: OptionItem) {
  pendingStatusOption.value = option
  showStatusDialog.value = true
}

function closeStatusDialog() {
  showStatusDialog.value = false
  pendingStatusOption.value = null
}

async function savePaymentMode() {
  const name = form.value.name.trim()
  const code = form.value.code.trim().toUpperCase() || name.slice(0, 8).toUpperCase()
  const description = form.value.description.trim() || 'No description provided.'
  const existingOption = editingId.value
    ? options.value.find((option) => option.id === editingId.value && option.category === 'Payment Modes')
    : null

  const saved = await persistPaymentMode({
    id: editingId.value,
    name,
    code,
    description,
    active: existingOption?.active ?? true,
  })

  if (saved) {
    selectedCategory.value = 'Payment Modes'
    closeForm()
  }
}

async function saveProcedure() {
  const name = form.value.name.trim()
  const procedureCode = form.value.code.trim().toUpperCase() || name.slice(0, 8).toUpperCase()
  const description = form.value.description.trim() || 'No description provided.'
  const monthInterval = Number(form.value.monthInterval)
  const quantity = Number(form.value.quantity)
  const defaultPrice =
    form.value.price.trim() === '' || Number.isNaN(Number(form.value.price))
      ? null
      : Number(form.value.price)
  const existingOption = editingId.value
    ? options.value.find((option) => option.id === editingId.value && option.category === 'Procedures')
    : null

  if (!Number.isInteger(monthInterval) || monthInterval <= 0) {
    localErrorMessage.value = 'Month interval must be a whole number greater than zero.'
    return
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    localErrorMessage.value = 'Quantity must be a whole number greater than zero.'
    return
  }

  const saved = await persistProcedure({
    id: editingId.value,
    name,
    procedureCode,
    description,
    monthInterval,
    quantity,
    defaultPrice,
    active: existingOption?.active ?? true
  })

  if (saved) {
    selectedCategory.value = 'Procedures'
    closeForm()
  }
}

function saveLocalOption() {
  const name = form.value.name.trim()
  if (!name) return

  const optionData = {
    category: form.value.category,
    name,
    code: form.value.code.trim().toUpperCase() || name.slice(0, 8).toUpperCase(),
    description: form.value.description.trim() || 'No description provided.',
    price:
      form.value.category === 'Procedures' && form.value.price !== ''
        ? Number(form.value.price)
        : undefined,
  }

  if (editingId.value) {
    const index = localOptions.value.findIndex((option) => option.id === editingId.value)
    const existingOption = localOptions.value[index]
    if (existingOption) localOptions.value[index] = { ...existingOption, ...optionData }
  } else {
    localOptions.value.unshift({ id: Date.now(), ...optionData, active: true })
  }

  selectedCategory.value = form.value.category
  closeForm()
}

async function saveOption() {
  const name = form.value.name.trim()
  if (!name) return

  if (form.value.category === 'Procedures') {
    await saveProcedure()
    return
  }

  if (form.value.category === 'Payment Modes') {
    await savePaymentMode()
    return
  }

  saveLocalOption()
}

function toggleLocalOption(option: OptionItem) {
  option.active = !option.active
}

async function toggleOption(option: OptionItem) {
  if (isProcedureOption(option)) {
    await persistProcedureToggle(option)
    return
  }

  if (isPaymentModeOption(option)) {
    await persistPaymentModeToggle(option)
    return
  }

  toggleLocalOption(option)
}

async function applyStatusChange() {
  if (!pendingStatusOption.value) return

  await toggleOption(pendingStatusOption.value)
  closeStatusDialog()
}

function removeOption() {
  if (!pendingDeleteOption.value) return

  localOptions.value = localOptions.value.filter((item) => item.id !== pendingDeleteOption.value?.id)
  closeDeleteDialog()
}

function formatPrice(price?: number) {
  if (price === undefined) return '—'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)
}

function getProcedureMonthInterval(option: OptionItem): number {
  return isProcedureOption(option) ? option.monthInterval : 1
}

function getProcedureQuantity(option: OptionItem): number {
  return isProcedureOption(option) ? option.quantity : 1
}
</script>

<template>
  <div class="space-y-6">
    <AppDialog
      :title="pendingStatusOption?.active ? 'Deactivate setup item' : 'Activate setup item'"
      :show="showStatusDialog"
      :confirm-label="pendingStatusOption?.active ? 'Deactivate item' : 'Activate item'"
      @close="closeStatusDialog"
      @confirm="applyStatusChange"
    >
      <template #dialog-content>
        <div class="space-y-4">
          <div
            class="rounded-[1.5rem] border p-5"
            :class="
              pendingStatusOption?.active
                ? 'border-amber/20 bg-[linear-gradient(135deg,#fff8e8_0%,#ffffff_100%)]'
                : 'border-emerald/15 bg-[linear-gradient(135deg,#effaf4_0%,#ffffff_100%)]'
            "
          >
            <p
              class="text-xs font-semibold uppercase tracking-[0.22em]"
              :class="pendingStatusOption?.active ? 'text-amber' : 'text-emerald'"
            >
              Status confirmation
            </p>
            <p class="mt-2 text-sm leading-6 text-slate">
              {{
                pendingStatusOption?.active
                  ? 'This item will be marked inactive and may no longer appear as an available option in active workflows.'
                  : 'This item will be marked active and can be used again in available workflows.'
              }}
            </p>
          </div>

          <div
            v-if="pendingStatusOption"
            class="rounded-2xl border border-pebble bg-cloud px-4 py-4"
          >
            <p class="text-sm font-semibold text-onyx">{{ pendingStatusOption.name }}</p>
            <p class="mt-1 text-xs uppercase tracking-[0.16em] text-slate">
              {{ pendingStatusOption.code }}
            </p>
            <p class="mt-2 text-sm text-slate">{{ pendingStatusOption.description }}</p>
          </div>
        </div>
      </template>
    </AppDialog>

    <AppDialog
      title="Delete setup item"
      :show="showDeleteDialog"
      confirm-label="Delete item"
      @close="closeDeleteDialog"
      @confirm="removeOption"
    >
      <template #dialog-content>
        <div class="space-y-4">
          <div
            class="rounded-[1.5rem] border border-ruby/15 bg-[linear-gradient(135deg,#fff4f4_0%,#ffffff_100%)] p-5"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-ruby">Delete confirmation</p>
            <p class="mt-2 text-sm leading-6 text-slate">
              This will permanently remove the selected setup item from this list.
            </p>
          </div>

          <div v-if="pendingDeleteOption" class="rounded-2xl border border-pebble bg-cloud px-4 py-4">
            <p class="text-sm font-semibold text-onyx">{{ pendingDeleteOption.name }}</p>
            <p class="mt-1 text-xs uppercase tracking-[0.16em] text-slate">
              {{ pendingDeleteOption.code }}
            </p>
            <p class="mt-2 text-sm text-slate">{{ pendingDeleteOption.description }}</p>
          </div>
        </div>
      </template>
    </AppDialog>

    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="feather:sliders" class="size-3.5" /> Dental Setup Library
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">Clinic Setup Options</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
            Maintain reusable dental setup choices such as procedures, payment modes, and benefit
            mappings used across the clinic.
          </p>
        </div>
        <AppButton btn-theme="primary" class="px-5 py-3 normal-case" @click="openCreateForm">
          <Icon icon="feather:plus" class="size-4" /> Add setup item
        </AppButton>
      </div>
      <div class="grid gap-px border-t border-pebble bg-pebble sm:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Setup groups</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ categories.length }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Active items</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ totalActiveOptions }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Current group</p>
          <p class="mt-2 text-lg font-bold text-onyx">{{ selectedCategory }}</p>
        </div>
      </div>
    </section>

    <section class="space-y-6">
      <div class="rounded-[1.75rem] border border-pebble bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate">Setup groups</p>
              <h2 class="mt-2 text-2xl font-black text-onyx">Category selector</h2>
            </div>
            <div class="rounded-2xl border border-pebble bg-cloud px-4 py-3 text-sm text-slate">
              <span class="font-semibold text-onyx">{{ selectedCategory }}</span>
              <span class="mx-2 text-smoke">•</span>
              {{ getCategoryCount(selectedCategory) }} saved
            </div>
          </div>

          <div class="scrollbar -mx-1 overflow-x-auto px-1 pb-1">
            <div class="flex min-w-max gap-3">
              <button
                v-for="category in categories"
                :key="category.name"
                type="button"
                class="group w-[240px] shrink-0 rounded-[1.5rem] border p-4 text-left transition-all duration-200"
                :class="
                  selectedCategory === category.name
                    ? `border-transparent bg-gradient-to-br ${getCategoryAccent(category.name).surface} shadow-sm ring-1 ${getCategoryAccent(category.name).ring}`
                    : 'border-pebble bg-white hover:border-tangerine/35 hover:bg-fog/40'
                "
                @click="selectCategory(category.name)"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                    :class="
                      selectedCategory === category.name
                        ? getCategoryAccent(category.name).badge
                        : 'bg-fog text-slate group-hover:bg-white'
                    "
                  >
                    <Icon :icon="category.icon" class="size-5" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="flex items-center justify-between gap-3">
                      <span class="text-sm font-black text-onyx">{{ category.name }}</span>
                      <span
                        class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        :class="
                          selectedCategory === category.name
                            ? 'bg-white/90 text-onyx'
                            : 'bg-fog text-slate'
                        "
                      >
                        {{ getCategoryCount(category.name) }}
                      </span>
                    </span>
                    <span class="mt-2 line-clamp-2 block text-sm leading-6 text-slate">
                      {{ category.description }}
                    </span>
                  </span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>

      <div class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm lg:p-6">
        <div
          class="flex flex-col gap-4 border-b border-pebble pb-5 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <div class="flex items-center gap-2">
              <Icon
                :icon="selectedCategoryDetails?.icon || 'feather:sliders'"
                class="size-5 text-tangerine"
              />
              <h2 class="text-xl font-black text-onyx">{{ selectedCategory }}</h2>
            </div>
            <p class="mt-1 text-sm text-slate">{{ selectedCategoryDetails?.description }}</p>
          </div>
          <AppButton btn-theme="outline" class="px-4 py-2.5 normal-case" @click="openCreateForm">
            <Icon icon="feather:plus" class="size-4" /> Add {{ selectedCategory.slice(0, -1) }}
          </AppButton>
        </div>

        <p v-if="errorMessage" class="mt-5 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
          {{ errorMessage }}
        </p>

        <div v-if="(loadingProcedures && isProceduresSelected) || (loadingPaymentModes && isPaymentModesSelected)" class="mt-5">
          <AppLoadingScreen
            :title="isProceduresSelected ? 'Loading procedures' : 'Loading payment modes'"
            :message="
              isProceduresSelected
                ? 'Please wait while we retrieve the available dental procedures for the clinic.'
                : 'Please wait while we retrieve the available settlement options for the clinic.'
            "
          />
        </div>

        <template v-else>
          <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-slate">
              {{ filteredOptions.length }}
              {{ filteredOptions.length === 1 ? 'item' : 'items' }} shown
            </p>
            <AppInput
              v-model="search"
              icon="feather:search"
              placeholder="Search setup items"
              class="sm:max-w-xs"
            />
          </div>

          <div
            v-if="filteredOptions.length"
            class="mt-5 overflow-hidden rounded-2xl border border-pebble"
          >
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead class="border-b border-pebble bg-cloud">
                  <tr>
                    <th
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                    >
                      Option
                    </th>
                    <th
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                    >
                      Code
                    </th>
                    <th
                      v-if="selectedCategory === 'Procedures'"
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                    >
                      Interval
                    </th>
                    <th
                      v-if="selectedCategory === 'Procedures'"
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                    >
                      Quantity
                    </th>
                    <th
                      v-if="selectedCategory === 'Procedures'"
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                    >
                      Price
                    </th>
                    <th
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                    >
                      Status
                    </th>
                    <th
                      class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-pebble">
                  <tr
                    v-for="option in filteredOptions"
                    :key="option.id"
                    class="transition hover:bg-apricot"
                  >
                    <td class="px-5 py-4">
                      <p class="font-bold text-onyx">{{ option.name }}</p>
                      <p class="mt-1 max-w-md text-sm text-slate">{{ option.description }}</p>
                    </td>
                    <td class="px-5 py-4">
                      <code class="rounded-md bg-fog px-2 py-1 text-xs font-semibold text-slate">{{
                        option.code
                      }}</code>
                    </td>
                    <td v-if="selectedCategory === 'Procedures'" class="px-5 py-4 text-slate">
                      {{ getProcedureMonthInterval(option) }} month{{
                        getProcedureMonthInterval(option) === 1 ? '' : 's'
                      }}
                    </td>
                    <td v-if="selectedCategory === 'Procedures'" class="px-5 py-4 text-slate">
                      {{ getProcedureQuantity(option) }}
                    </td>
                    <td v-if="selectedCategory === 'Procedures'" class="px-5 py-4 text-slate">
                      {{ formatPrice(option.price) }}
                    </td>
                    <td class="px-5 py-4">
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold"
                        :class="option.active ? 'bg-emerald-light text-emerald' : 'bg-fog text-slate'"
                        @click="toggleOption(option)"
                      >
                        <span
                          class="size-1.5 rounded-full"
                          :class="option.active ? 'bg-emerald' : 'bg-slate'"
                        />
                        {{ option.active ? 'Active' : 'Inactive' }}
                      </button>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex justify-end gap-1">
                        <button
                          type="button"
                          class="rounded-lg p-2 transition"
                          :title="option.active ? 'Deactivate option' : 'Activate option'"
                          :class="
                            option.active
                              ? 'text-amber hover:bg-amber-light hover:text-amber'
                              : 'text-emerald hover:bg-emerald-light hover:text-emerald'
                          "
                          @click="confirmStatusChange(option)"
                        >
                          <Icon
                            :icon="
                              option.active
                                ? 'feather:toggle-right'
                                : 'feather:toggle-left'
                            "
                            class="size-4"
                          />
                        </button>
                        <button
                          type="button"
                          class="rounded-lg p-2 text-slate transition hover:bg-fog hover:text-onyx"
                          title="Edit option"
                          @click="openEditForm(option)"
                        >
                          <Icon icon="feather:edit-2" class="size-4" />
                        </button>
                        <button
                          type="button"
                          class="rounded-lg p-2 text-slate transition hover:bg-ruby-light hover:text-ruby"
                          title="Delete option"
                          @click="confirmDelete(option)"
                        >
                          <Icon icon="feather:trash-2" class="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            v-else
            class="mt-5 rounded-2xl border border-dashed border-pebble bg-cloud px-6 py-12 text-center"
          >
            <div
              class="mx-auto flex size-11 items-center justify-center rounded-xl bg-white text-tangerine shadow-sm"
            >
              <Icon icon="feather:search" class="size-5" />
            </div>
            <h3 class="mt-4 font-bold text-onyx">No options found</h3>
            <p class="mt-1 text-sm text-slate">
              Try another search term or add a new option to this group.
            </p>
          </div>
        </template>
      </div>
    </section>

    <AppModal
      :show="showForm"
      :title="editingId ? 'Edit setup item' : 'Add setup item'"
      subtitle="Setup item details"
      max-width="sm:max-w-xl"
      @close="closeForm"
    >
      <form id="setup-item-form" class="space-y-5 p-6" @submit.prevent="saveOption">
        <div class="space-y-5 p-6">
          <div>
            <label class="mb-2 block text-sm font-medium text-onyx">Setup group</label>
            <select v-model="form.category">
              <option v-for="category in categories" :key="category.name" :value="category.name">
                {{ category.name }}
              </option>
            </select>
          </div>
          <div class="grid gap-5 sm:grid-cols-2">
            <AppInput v-model="form.name" label="Item name" placeholder="e.g. Dental X-ray" />
            <AppInput v-model="form.code" label="Code" placeholder="e.g. XRAY" />
          </div>
          <AppInput
            v-if="form.category === 'Procedures'"
            v-model="form.monthInterval"
            label="Month interval"
            type="number"
            min="1"
            placeholder="1"
          />
          <AppInput
            v-if="form.category === 'Procedures'"
            v-model="form.quantity"
            label="Quantity"
            type="number"
            min="1"
            placeholder="1"
          />
          <AppInput
            v-if="form.category === 'Procedures'"
            v-model="form.price"
            label="Default price (PHP)"
            type="number"
            placeholder="0.00"
          />
          <div>
            <label class="mb-2 block text-sm font-medium text-onyx">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Briefly describe when this setup item should be used."
              class="w-full resize-y rounded-md border border-gray-200 bg-white px-4 py-3 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
            ></textarea>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AppButton
            type="button"
            btn-theme="outline"
            class="px-5 py-3 normal-case"
            @click="closeForm"
          >
            Cancel
          </AppButton>
          <AppButton
            form="setup-item-form"
            type="submit"
            btn-theme="primary"
            class="px-5 py-3 normal-case"
            :disabled="!form.name.trim() || savingProcedure || savingPaymentMode"
          >
            <Icon icon="feather:save" class="size-4" />
            {{
              form.category === 'Procedures' && savingProcedure
                ? 'Saving...'
                : savingPaymentMode && form.category === 'Payment Modes'
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Add setup item'
            }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
