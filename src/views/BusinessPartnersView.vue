<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AppButton, AppInput, AppLoadingScreen, AppModal, AppStatValue } from '@/components/app'
import { useBusinessPartners } from '@/composables'
import type { BusinessPartnerOption } from '@/composables'

type StatusFilter = 'all' | 'active' | 'inactive'

const router = useRouter()
const {
  businessPartners,
  clearBusinessPartnerError,
  errorMessage,
  fetchBusinessPartners,
  loadingBusinessPartners,
  saveBusinessPartner,
  savingBusinessPartner,
  toggleBusinessPartner,
  updatingBusinessPartnerId,
} = useBusinessPartners()

const search = ref('')
const statusFilter = ref<StatusFilter>('all')
const showForm = ref(false)
const editingId = ref<number | null>(null)
const localErrorMessage = ref('')
const form = ref({
  name: '',
  code: '',
  description: '',
  active: true,
})

const filteredPartners = computed(() => {
  const term = search.value.trim().toLowerCase()

  return businessPartners.value.filter((partner) => {
    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && partner.active) ||
      (statusFilter.value === 'inactive' && !partner.active)

    if (!matchesStatus) return false
    if (!term) return true

    return [partner.name, partner.code, partner.description].some((value) =>
      value.toLowerCase().includes(term),
    )
  })
})

const totalActivePartners = computed(
  () => businessPartners.value.filter((partner) => partner.active).length,
)
const totalInactivePartners = computed(
  () => businessPartners.value.filter((partner) => !partner.active).length,
)
const filteredPartnerCount = computed(() => filteredPartners.value.length)
const combinedError = computed(() => localErrorMessage.value || errorMessage.value)
const formTitle = computed(() =>
  form.value.name || (editingId.value ? 'Update business partner' : 'Create business partner'),
)
const duplicatePartner = computed(() => {
  const normalizedName = form.value.name.trim().toLowerCase()
  const normalizedCode = normalizePartnerCode(form.value.code)

  if (!normalizedName && !normalizedCode) return null

  return (
    businessPartners.value.find((partner) => {
      if (partner.id === editingId.value) return false

      return (
        partner.name.trim().toLowerCase() === normalizedName ||
        partner.code.trim().toUpperCase() === normalizedCode
      )
    }) || null
  )
})
const generatedCodeSuggestion = computed(() => {
  if (!form.value.name.trim()) return ''

  const words = form.value.name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean)

  if (!words.length) return ''

  const initials = words.map((word) => word[0]).join('')
  const fallback = words.join('').slice(0, 6)
  return (initials.length >= 2 ? initials : fallback).toUpperCase()
})

function normalizePartnerCode(value: string) {
  return value.trim().replace(/\s+/g, '-').toUpperCase()
}

function resetForm() {
  editingId.value = null
  form.value = {
    name: '',
    code: '',
    description: '',
    active: true,
  }
}

function resetFilters() {
  search.value = ''
  statusFilter.value = 'all'
}

function openCreateForm() {
  clearBusinessPartnerError()
  localErrorMessage.value = ''
  resetForm()
  showForm.value = true
}

function openEditForm(partner: BusinessPartnerOption) {
  clearBusinessPartnerError()
  localErrorMessage.value = ''
  editingId.value = partner.id
  form.value = {
    name: partner.name,
    code: partner.code,
    description: partner.description,
    active: partner.active,
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  localErrorMessage.value = ''
  resetForm()
}

function applySuggestedCode() {
  if (!generatedCodeSuggestion.value) return
  form.value.code = generatedCodeSuggestion.value
}

async function submitForm() {
  const name = form.value.name.trim()
  const code = normalizePartnerCode(form.value.code)

  localErrorMessage.value = ''

  if (!name || !code) {
    localErrorMessage.value = 'Company code and company name are required.'
    return
  }

  if (duplicatePartner.value) {
    localErrorMessage.value = `A partner with this company code or name already exists: ${duplicatePartner.value.code} - ${duplicatePartner.value.name}.`
    return
  }

  const saved = await saveBusinessPartner({
    id: editingId.value,
    name,
    code,
    description: form.value.description.trim() || 'No description provided.',
    active: form.value.active,
  })

  if (saved) closeForm()
}

async function togglePartner(partner: BusinessPartnerOption) {
  await toggleBusinessPartner(partner)
}

function openPartnerMemberImports() {
  void router.push('/partner-members')
}
</script>

<template>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#f7efe2_0%,#f5f2eb_44%,#edf2ef_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:p-8">
        <div class="space-y-4">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="feather:briefcase" class="size-3.5" />
            Business partner registry
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Business Partners</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
              Maintain the official company codes and company names used in partner-member uploads
              so imports stay consistent and avoid manual entry mistakes.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <AppButton btn-theme="primary" class="px-5 py-3 normal-case" @click="openCreateForm">
              <Icon icon="feather:plus" class="size-4" /> Add business partner
            </AppButton>
            <AppButton
              btn-theme="outline"
              class="px-5 py-3 normal-case"
              @click="openPartnerMemberImports"
            >
              <Icon icon="feather:upload-cloud" class="size-4" /> Open partner member imports
            </AppButton>
          </div>
        </div>
      </div>

      <div class="grid gap-px border-t border-pebble bg-pebble sm:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Saved partners</p>
          <AppStatValue :loading="loadingBusinessPartners" :value="businessPartners.length" />
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Active partners</p>
          <AppStatValue :loading="loadingBusinessPartners" :value="totalActivePartners" />
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
            Inactive partners
          </p>
          <AppStatValue :loading="loadingBusinessPartners" :value="totalInactivePartners" />
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm sm:p-6">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Company Code and Name List</h2>
          <p class="mt-1 text-sm text-slate">
            These values are shared with the partner-member import page.
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <AppInput
            v-model="search"
            icon="feather:search"
            placeholder="Search business partners"
            class="sm:min-w-72"
          />
          <AppButton
            v-if="search || statusFilter !== 'all'"
            btn-theme="outline"
            class="normal-case"
            @click="resetFilters"
          >
            <Icon icon="feather:rotate-ccw" class="size-4" /> Reset filters
          </AppButton>
        </div>
      </div>

      <div class="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition"
          :class="
            statusFilter === 'all'
              ? 'border-tangerine bg-tangerine-light text-tangerine'
              : 'border-pebble bg-white text-slate hover:border-tangerine hover:text-tangerine'
          "
          @click="statusFilter = 'all'"
        >
          All
          <span class="rounded-full bg-white px-2 py-0.5 text-xs text-onyx">
            {{ businessPartners.length }}
          </span>
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition"
          :class="
            statusFilter === 'active'
              ? 'border-emerald/30 bg-emerald-light text-emerald'
              : 'border-pebble bg-white text-slate hover:border-emerald hover:text-emerald'
          "
          @click="statusFilter = 'active'"
        >
          Active
          <span class="rounded-full bg-white px-2 py-0.5 text-xs text-onyx">
            {{ totalActivePartners }}
          </span>
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition"
          :class="
            statusFilter === 'inactive'
              ? 'border-ruby/30 bg-ruby-light text-ruby'
              : 'border-pebble bg-white text-slate hover:border-ruby hover:text-ruby'
          "
          @click="statusFilter = 'inactive'"
        >
          Inactive
          <span class="rounded-full bg-white px-2 py-0.5 text-xs text-onyx">
            {{ totalInactivePartners }}
          </span>
        </button>

        <div class="ml-auto text-sm text-slate">
          Showing <span class="font-bold text-onyx">{{ filteredPartnerCount }}</span> of
          <span class="font-bold text-onyx">{{ businessPartners.length }}</span> partners
        </div>
      </div>

      <div
        v-if="combinedError"
        class="mb-4 flex flex-col gap-3 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby sm:flex-row sm:items-center sm:justify-between"
      >
        <p>{{ combinedError }}</p>
        <button
          type="button"
          class="shrink-0 font-semibold underline underline-offset-4"
          @click="fetchBusinessPartners"
        >
          Try again
        </button>
      </div>

      <AppLoadingScreen
        v-if="loadingBusinessPartners"
        title="Loading business partners"
        message="Please wait while we retrieve the saved company code and company name list."
      />

      <div
        v-else-if="filteredPartners.length"
        class="overflow-hidden rounded-2xl border border-pebble"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="border-b border-pebble bg-cloud">
              <tr>
                <th
                  class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                >
                  Company Name
                </th>
                <th
                  class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                >
                  Company Code
                </th>
                <th
                  class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate"
                >
                  Description
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
                v-for="partner in filteredPartners"
                :key="partner.id"
                class="transition hover:bg-apricot"
              >
                <td class="px-5 py-4">
                  <p class="font-bold text-onyx">{{ partner.name }}</p>
                </td>
                <td class="px-5 py-4">
                  <code class="rounded-md bg-fog px-2 py-1 text-xs font-semibold text-slate">{{
                    partner.code
                  }}</code>
                </td>
                <td class="px-5 py-4 text-slate">{{ partner.description }}</td>
                <td class="px-5 py-4">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    :class="
                      partner.active ? 'bg-emerald-light text-emerald' : 'bg-ruby-light text-ruby'
                    "
                    :disabled="updatingBusinessPartnerId === partner.id"
                    @click="togglePartner(partner)"
                  >
                    <Icon
                      v-if="updatingBusinessPartnerId === partner.id"
                      icon="feather:loader"
                      class="size-3.5 animate-spin"
                    />
                    <span
                      v-else
                      class="size-1.5 rounded-full"
                      :class="partner.active ? 'bg-emerald' : 'bg-ruby'"
                    />
                    {{
                      updatingBusinessPartnerId === partner.id
                        ? 'Updating...'
                        : partner.active
                          ? 'Active'
                          : 'Inactive'
                    }}
                  </button>
                </td>
                <td class="px-5 py-4">
                  <div class="flex justify-end">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-full border border-[#d8c5a0] bg-[linear-gradient(180deg,#f8eddc_0%,#efe1cb_100%)] px-3.5 py-2 text-xs font-semibold text-[#8c6320] shadow-[0_10px_20px_rgba(176,138,52,0.12)] transition hover:border-[#c59a42] hover:bg-[linear-gradient(180deg,#fcf4e8_0%,#f3e5ce_100%)] hover:text-[#6f4a13]"
                      :disabled="updatingBusinessPartnerId === partner.id"
                      @click="openEditForm(partner)"
                    >
                      <Icon icon="feather:edit-2" class="size-4" />
                      Edit
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
        class="rounded-2xl border border-dashed border-pebble bg-cloud px-6 py-12 text-center"
      >
        <div
          class="mx-auto flex size-11 items-center justify-center rounded-xl bg-white text-tangerine shadow-sm"
        >
          <Icon icon="feather:briefcase" class="size-5" />
        </div>
        <h3 class="mt-4 font-bold text-onyx">
          {{ businessPartners.length ? 'No partners match these filters' : 'No business partners found' }}
        </h3>
        <p class="mt-1 text-sm text-slate">
          {{
            businessPartners.length
              ? 'Try changing the search or status filter to widen the results.'
              : 'Add your first company code and company name so uploads can use a controlled list.'
          }}
        </p>
      </div>
    </section>

    <AppModal
      :show="showForm"
      :title="editingId ? 'Edit business partner' : 'Add business partner'"
      subtitle="Business partner details"
      max-width="sm:max-w-4xl"
      @close="closeForm"
    >
      <form class="space-y-6 p-6" @submit.prevent="submitForm">
        <section
          class="rounded-[1.6rem] border border-pebble bg-[radial-gradient(circle_at_top_left,#f8fbff_0%,#ffffff_52%,#fbf7ee_100%)] p-5"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-smoke">
            Partner details
          </p>
          <h3 class="mt-2 text-2xl font-black text-onyx">
            {{ formTitle }}
          </h3>
          <p class="mt-2 text-sm leading-6 text-slate">
            Save the official company code and company name that should appear in uploads.
          </p>
        </section>

        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div class="grid gap-5 md:grid-cols-2">
            <AppInput
              v-model="form.code"
              label="Company Code"
              placeholder="e.g. IWC"
              icon="feather:hash"
            />
            <AppInput
              v-model="form.name"
              label="Company Name"
              placeholder="e.g. Industrial Wellness Corp"
              icon="feather:briefcase"
            />
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Description</label>
              <textarea
                v-model="form.description"
                rows="4"
                class="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                placeholder="Optional notes for this business partner."
              />
            </div>
            <label
              class="md:col-span-2 flex items-center gap-3 rounded-2xl border border-pebble bg-cloud px-4 py-4 text-sm text-onyx"
            >
              <input v-model="form.active" type="checkbox" class="h-4 w-4 accent-[#aa7f27]" />
              Keep this business partner active for uploads
            </label>
          </div>

          <aside class="rounded-[1.5rem] border border-pebble bg-cloud p-5">
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-smoke">
              Preview
            </p>
            <div class="mt-4 rounded-2xl border border-pebble bg-white px-4 py-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                Company Code
              </p>
              <p class="mt-2 text-lg font-black text-onyx">
                {{ normalizePartnerCode(form.code) || 'Pending code' }}
              </p>
              <p class="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                Company Name
              </p>
              <p class="mt-2 font-bold text-onyx">
                {{ form.name.trim() || 'Pending business partner name' }}
              </p>
            </div>

            <div
              v-if="generatedCodeSuggestion && !form.code.trim()"
              class="mt-4 rounded-2xl border border-dashed border-pebble bg-white px-4 py-4"
            >
              <p class="text-sm font-semibold text-onyx">Suggested code</p>
              <p class="mt-1 text-sm text-slate">
                Use <strong>{{ generatedCodeSuggestion }}</strong> based on the current company
                name.
              </p>
              <button
                type="button"
                class="mt-3 text-sm font-semibold text-tangerine transition hover:text-tangerine-dark"
                @click="applySuggestedCode"
              >
                Apply suggestion
              </button>
            </div>

            <div
              v-if="duplicatePartner"
              class="mt-4 rounded-2xl border border-ruby/20 bg-ruby-light px-4 py-4 text-sm text-ruby"
            >
              Similar existing record: {{ duplicatePartner.code }} - {{ duplicatePartner.name }}
            </div>
          </aside>
        </div>

        <div class="flex flex-wrap justify-end gap-3 border-t border-pebble pt-5">
          <AppButton btn-theme="outline" class="normal-case" type="button" @click="closeForm">
            Cancel
          </AppButton>
          <AppButton
            btn-theme="primary"
            class="normal-case"
            type="submit"
            :disabled="savingBusinessPartner"
          >
            <Icon
              :icon="savingBusinessPartner ? 'feather:loader' : 'feather:save'"
              class="size-4"
              :class="savingBusinessPartner ? 'animate-spin' : ''"
            />
            {{ savingBusinessPartner ? 'Saving...' : editingId ? 'Save Changes' : 'Create Partner' }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>
