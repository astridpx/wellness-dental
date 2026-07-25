<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref } from 'vue'
import { AppButton, AppInput, AppLoadingScreen } from '@/components/app'
import { useAuth } from '@/composables'

type OptionCategory = 'Procedures' | 'Payment Modes' | 'Benefits'

type OptionItem = {
  id: number
  category: OptionCategory
  name: string
  code: string
  description: string
  price?: number
  active: boolean
}

type PaymentModeResponse = {
  id: number
  name: string
  code: string
  description: string | null
  isActive: boolean
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

const { getAuthHeaders, logout } = useAuth()
const baseURL = import.meta.env.VITE_APP_MAIN_API_BASE_URL

const options = ref<OptionItem[]>([
  {
    id: 1,
    category: 'Procedures',
    name: 'Dental Consultation',
    code: 'CONSULT',
    description: 'Initial oral assessment and treatment planning.',
    price: 800,
    active: true,
  },
  {
    id: 2,
    category: 'Procedures',
    name: 'Oral Prophylaxis',
    code: 'OP-REG',
    description: 'Regular dental cleaning.',
    price: 1200,
    active: true,
  },
  {
    id: 3,
    category: 'Procedures',
    name: 'Tooth Extraction',
    code: 'EXT-SIMPLE',
    description: 'Simple extraction of a permanent tooth.',
    price: 1500,
    active: true,
  },
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
const editingId = ref<number | null>(null)
const loadingPaymentModes = ref(false)
const savingPaymentMode = ref(false)
const errorMessage = ref('')
const form = ref({
  category: 'Procedures' as OptionCategory,
  name: '',
  code: '',
  description: '',
  price: '',
})

const selectedCategoryDetails = computed(() =>
  categories.find((category) => category.name === selectedCategory.value),
)
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

function mapPaymentModeToOption(paymentMode: PaymentModeResponse): OptionItem {
  return {
    id: paymentMode.id,
    category: 'Payment Modes',
    name: paymentMode.name,
    code: paymentMode.code,
    description: paymentMode.description || 'No description provided.',
    active: Boolean(paymentMode.isActive),
  }
}

function replacePaymentModeOptions(paymentModes: PaymentModeResponse[]) {
  const nonPaymentModeOptions = options.value.filter((option) => option.category !== 'Payment Modes')
  options.value = [...nonPaymentModeOptions, ...paymentModes.map(mapPaymentModeToOption)]
}

async function handleApiError(response: Response) {
  if (response.status === 401 || response.status === 403) {
    await logout(true)
    return true
  }

  return false
}

async function fetchPaymentModes() {
  loadingPaymentModes.value = true
  errorMessage.value = ''

  try {
    const res = await fetch(`${baseURL}/wellness/paymentModes?perPage=100`, {
      headers: getAuthHeaders(false),
    })

    if (await handleApiError(res)) return

    const obj = await res.json()

    if (!res.ok) {
      errorMessage.value = obj.error || 'Unable to load payment modes.'
      return
    }

    replacePaymentModeOptions(Array.isArray(obj.data) ? obj.data : [])
  } catch {
    errorMessage.value = 'Unable to connect to the server.'
  } finally {
    loadingPaymentModes.value = false
  }
}

function selectCategory(category: OptionCategory) {
  selectedCategory.value = category
  search.value = ''
  errorMessage.value = ''
}

function resetForm() {
  editingId.value = null
  form.value = {
    category: selectedCategory.value,
    name: '',
    code: '',
    description: '',
    price: '',
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
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

async function savePaymentMode() {
  savingPaymentMode.value = true
  errorMessage.value = ''

  const name = form.value.name.trim()
  const code = form.value.code.trim().toUpperCase() || name.slice(0, 8).toUpperCase()
  const description = form.value.description.trim() || 'No description provided.'
  const existingOption = editingId.value
    ? options.value.find((option) => option.id === editingId.value && option.category === 'Payment Modes')
    : null

  const payload = {
    name,
    code,
    description,
    isActive: existingOption?.active ?? true,
  }

  try {
    const res = await fetch(
      editingId.value
        ? `${baseURL}/wellness/paymentModes/${editingId.value}`
        : `${baseURL}/wellness/paymentModes`,
      {
        method: editingId.value ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      },
    )

    if (await handleApiError(res)) return

    const obj = await res.json()

    if (!res.ok) {
      errorMessage.value = obj.error || 'Unable to save payment mode.'
      return
    }

    await fetchPaymentModes()
    selectedCategory.value = 'Payment Modes'
    closeForm()
  } catch {
    errorMessage.value = 'Unable to connect to the server.'
  } finally {
    savingPaymentMode.value = false
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
    const index = options.value.findIndex((option) => option.id === editingId.value)
    const existingOption = options.value[index]
    if (existingOption) options.value[index] = { ...existingOption, ...optionData }
  } else {
    options.value.unshift({ id: Date.now(), ...optionData, active: true })
  }

  selectedCategory.value = form.value.category
  closeForm()
}

async function saveOption() {
  const name = form.value.name.trim()
  if (!name) return

  if (form.value.category === 'Payment Modes') {
    await savePaymentMode()
    return
  }

  saveLocalOption()
}

async function togglePaymentMode(option: OptionItem) {
  errorMessage.value = ''

  try {
    const res = await fetch(`${baseURL}/wellness/paymentModes/${option.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: option.name,
        code: option.code,
        description: option.description,
        isActive: !option.active,
      }),
    })

    if (await handleApiError(res)) return

    const obj = await res.json()

    if (!res.ok) {
      errorMessage.value = obj.error || 'Unable to update payment mode status.'
      return
    }

    await fetchPaymentModes()
  } catch {
    errorMessage.value = 'Unable to connect to the server.'
  }
}

function toggleLocalOption(option: OptionItem) {
  option.active = !option.active
}

async function toggleOption(option: OptionItem) {
  if (option.category === 'Payment Modes') {
    await togglePaymentMode(option)
    return
  }

  toggleLocalOption(option)
}

function removeOption(option: OptionItem) {
  if (option.category === 'Payment Modes') {
    errorMessage.value = 'Delete for payment modes is not available yet.'
    return
  }

  options.value = options.value.filter((item) => item.id !== option.id)
}

function formatPrice(price?: number) {
  if (price === undefined) return '—'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)
}

onMounted(async () => {
  await fetchPaymentModes()
})
</script>

<template>
  <div class="space-y-6">
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

    <section class="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="rounded-[1.5rem] border border-pebble bg-white p-4 shadow-sm">
        <p class="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate">
          Setup groups
        </p>
        <div class="space-y-2">
          <button
            v-for="category in categories"
            :key="category.name"
            type="button"
            class="w-full rounded-2xl p-3 text-left transition"
            :class="
              selectedCategory === category.name
                ? 'bg-tangerine-light text-tangerine-dark'
                : 'text-onyx hover:bg-fog'
            "
            @click="selectCategory(category.name)"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-xl"
                :class="selectedCategory === category.name ? 'bg-white' : 'bg-fog'"
              >
                <Icon :icon="category.icon" class="size-4.5" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-bold">{{ category.name }}</span>
                <span class="mt-0.5 block text-xs text-slate">
                  {{ options.filter((option) => option.category === category.name).length }} saved
                </span>
              </span>
              <Icon icon="feather:chevron-right" class="size-4" />
            </div>
          </button>
        </div>
      </aside>

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

        <div v-if="loadingPaymentModes && isPaymentModesSelected" class="mt-5">
          <AppLoadingScreen
            title="Loading payment modes"
            message="Please wait while we retrieve the available settlement options for the clinic."
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
                          class="rounded-lg p-2 text-slate transition hover:bg-fog hover:text-onyx"
                          :title="option.active ? 'Deactivate option' : 'Activate option'"
                          @click="toggleOption(option)"
                        >
                          <Icon
                            :icon="option.active ? 'feather:eye-off' : 'feather:eye'"
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
                          @click="removeOption(option)"
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

    <div
      v-if="showForm"
      class="fixed inset-0 z-50 flex items-end bg-onyx/35 p-4 backdrop-blur-sm sm:items-center sm:justify-center"
    >
      <div class="w-full max-w-xl rounded-[1.5rem] bg-white shadow-2xl">
        <div class="flex items-start justify-between border-b border-pebble px-6 py-5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-tangerine">
              Setup item details
            </p>
            <h2 class="mt-1 text-xl font-black text-onyx">
              {{ editingId ? 'Edit setup item' : 'Add setup item' }}
            </h2>
          </div>
          <button type="button" class="rounded-lg p-2 text-slate hover:bg-fog" @click="closeForm">
            <Icon icon="feather:x" class="size-5" />
          </button>
        </div>
        <form class="space-y-5 p-6" @submit.prevent="saveOption">
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
          <div
            class="flex flex-col-reverse gap-3 border-t border-pebble pt-5 sm:flex-row sm:justify-end"
          >
            <AppButton
              type="button"
              btn-theme="outline"
              class="px-5 py-3 normal-case"
              @click="closeForm"
              >Cancel</AppButton
            >
            <AppButton
              type="submit"
              btn-theme="primary"
              class="px-5 py-3 normal-case"
              :disabled="!form.name.trim() || savingPaymentMode"
            >
              <Icon icon="feather:save" class="size-4" />
              {{ savingPaymentMode && form.category === 'Payment Modes'
                ? 'Saving...'
                : editingId
                  ? 'Save changes'
                  : 'Add setup item' }}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
