<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { AppButton, AppInput } from '@/components/app'

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

const categories: Array<{ name: OptionCategory; icon: string; description: string }> = [
  {
    name: 'Procedures',
    icon: 'streamline-ultimate:dentistry-tooth-shield',
    description: 'Services available for treatment and billing.',
  },
  {
    name: 'Benefits',
    icon: 'boxicons:bookmark-heart',
    description: 'Services available for treatment and billing.',
  },
  {
    name: 'Payment Modes',
    icon: 'feather:credit-card',
    description: 'Ways patients can settle their balances.',
  },
]

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
    id: 4,
    category: 'Payment Modes',
    name: 'Cash',
    code: 'CASH',
    description: 'Payment received at the clinic.',
    active: true,
  },
  {
    id: 5,
    category: 'Payment Modes',
    name: 'GCash',
    code: 'GCASH',
    description: 'Payment through GCash.',
    active: true,
  },
  {
    id: 6,
    category: 'Payment Modes',
    name: 'Bank Transfer',
    code: 'BANK',
    description: 'Payment by bank transfer.',
    active: false,
  },
  {
    id: 7,
    category: 'Benefits',
    name: 'Oral Prophylaxis',
    code: 'OP',
    description: 'First visit for a new patient.',
    active: true,
  },
  {
    id: 8,
    category: 'Benefits',
    name: 'Simple tooth extractions; except surgery for impaction',
    code: 'ABC',
    description: 'Recommended by another patient or provider.',
    active: true,
  },
])

const selectedCategory = ref<OptionCategory>('Procedures')
const search = ref('')
const showForm = ref(false)
const editingId = ref<number | null>(null)
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

function selectCategory(category: OptionCategory) {
  selectedCategory.value = category
  search.value = ''
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

function saveOption() {
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

function toggleOption(option: OptionItem) {
  option.active = !option.active
}

function removeOption(option: OptionItem) {
  options.value = options.value.filter((item) => item.id !== option.id)
}

function formatPrice(price?: number) {
  if (price === undefined) return '—'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)
}
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
            <Icon icon="feather:sliders" class="size-3.5" /> Option Directory
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">Options</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
            Maintain the reusable choices that appear across your clinic records, from procedures
            and payment modes to appointment and patient details.
          </p>
        </div>
        <AppButton btn-theme="primary" class="px-5 py-3 normal-case" @click="openCreateForm">
          <Icon icon="feather:plus" class="size-4" /> Add option
        </AppButton>
      </div>
      <div class="grid gap-px border-t border-pebble bg-pebble sm:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Option groups</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ categories.length }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Active options</p>
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
          Option groups
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

        <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-slate">
            {{ filteredOptions.length }}
            {{ filteredOptions.length === 1 ? 'option' : 'options' }} shown
          </p>
          <AppInput
            v-model="search"
            icon="feather:search"
            placeholder="Search options"
            class="sm:max-w-xs"
          />
        </div>

        <!-- TABLE -->
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
              Option details
            </p>
            <h2 class="mt-1 text-xl font-black text-onyx">
              {{ editingId ? 'Edit option' : 'Add option' }}
            </h2>
          </div>
          <button type="button" class="rounded-lg p-2 text-slate hover:bg-fog" @click="closeForm">
            <Icon icon="feather:x" class="size-5" />
          </button>
        </div>
        <form class="space-y-5 p-6" @submit.prevent="saveOption">
          <div>
            <label class="mb-2 block text-sm font-medium text-onyx">Option group</label>
            <select v-model="form.category">
              <option v-for="category in categories" :key="category.name" :value="category.name">
                {{ category.name }}
              </option>
            </select>
          </div>
          <div class="grid gap-5 sm:grid-cols-2">
            <AppInput v-model="form.name" label="Option name" placeholder="e.g. Dental X-ray" />
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
              placeholder="Briefly describe when this option should be used."
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
              :disabled="!form.name.trim()"
            >
              <Icon icon="feather:save" class="size-4" />
              {{ editingId ? 'Save changes' : 'Add option' }}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
