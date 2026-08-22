<script setup lang="ts">
import { Icon } from '@iconify/vue'
import * as XLSX from 'xlsx'
import { computed, onMounted, ref, watch } from 'vue'
import { AppButton, AppInput, AppLoadingScreen, AppSearchSelect, AppTable } from '@/components/app'
import { useAvailmentReports, useDentists } from '@/composables'
import type { AvailmentCompanyFilterBy, AvailmentReportMode } from '@/types'
import { formatDate, formatDateTime, formatMoney } from '@/utils'

const {
  canGenerate,
  clearReport,
  companyErrorMessage,
  errorMessage,
  fetchImsCompanies,
  form,
  generateReport,
  imsCompanies,
  loading,
  loadingCompanies,
  requiresCompany,
  requiresDates,
  requiresDentist,
  rows,
  totalAmount,
} = useAvailmentReports()
const {
  dentists,
  fetchDentists,
  filters: dentistFilters,
  loading: loadingDentists,
} = useDentists({ perPage: 20 })

type DentistOption = {
  value: number
  label: string
  description: string
}

type CompanyOption = {
  value: string
  label: string
  description: string
}

const selectedDentistId = ref<string | number | null>(null)
const dentistSearch = ref('')
const dentistOptions = ref<DentistOption[]>([])
const retainedDentist = ref<DentistOption | null>(null)
const selectedCompanyCode = ref<string | number | null>(null)
const companySearch = ref('')
const companyOptions = ref<CompanyOption[]>([])
const retainedCompany = ref<CompanyOption | null>(null)
let dentistSearchTimer: number | undefined
let companySearchTimer: number | undefined

const reportModes: Array<{
  value: AvailmentReportMode
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'daily',
    label: 'Daily Report',
    description: 'Availments encoded for today.',
    icon: 'feather:calendar',
  },
  {
    value: 'companyPeriod',
    label: 'Company + Availment',
    description: 'Company availments by availment date range.',
    icon: 'feather:layers',
  },
  {
    value: 'dentistPeriod',
    label: 'Dentist + Availment',
    description: 'Dentist availments by availment date range.',
    icon: 'feather:users',
  },
  {
    value: 'period',
    label: 'Availment Date',
    description: 'All valid availments by availment date range.',
    icon: 'feather:clock',
  },
]

const selectedMode = computed(() => reportModes.find((mode) => mode.value === form.mode))
const companyScopeOptions = [
  {
    value: 'all',
    label: 'All',
    description: 'Include all availments without narrowing to one IMS company group.',
  },
  {
    value: 'deployment',
    label: 'Per deployment',
    description: 'Filter availments by one IMS deployment or classification.',
  },
  {
    value: 'motherCompany',
    label: 'Per mother company',
    description: 'Filter availments by one mother company or maincode description.',
  },
] as const
const requiresSpecificCompany = computed(
  () => requiresCompany.value && form.companyScope === 'specificIms',
)
const imsCompanyOptions = computed<CompanyOption[]>(() => {
  if (form.companyFilterBy === 'mainCompany') {
    const uniqueMainCompanies = Array.from(
      new Map(
        imsCompanies.value
          .filter((company) => company.mainCompany?.trim())
          .map((company) => [
            company.mainCompany!.trim(),
            {
              value: company.mainCompany!.trim(),
              label: company.mainCompany!.trim(),
              description: company.companyName || company.officeCode,
            },
          ]),
      ).values(),
    )

    return uniqueMainCompanies
  }

  return imsCompanies.value.map((company) => ({
    value: company.officeCode,
    label: company.companyName,
    description: [company.officeCode, company.mainCompany].filter(Boolean).join(' | '),
  }))
})
const excelColumns = [
  ['no', 'No.'],
  ['companyName', 'Company Name'],
  ['approvalNo', 'Approval No.'],
  ['memberName', 'Member Name'],
  ['availDate', 'Availment Date'],
  ['dentistName', 'Dentist Name'],
  ['clinicName', 'Clinic Name'],
  ['toothNo', 'Tooth No.'],
  ['procedures', 'Procedures'],
  ['amount', 'Amount'],
  ['paymentStatus', 'Payment Status'],
  ['paidToDentistAt', 'Paid to Dentist At'],
  ['remarks', 'Remarks'],
  ['encodedBy', 'Encoded By'],
] as const

function isPaid(row: { ifPaid?: boolean | number | string | null }) {
  return row.ifPaid === true || Number(row.ifPaid || 0) === 1
}

function exportReport() {
  if (!rows.value.length) return

  const exportRows = rows.value.map((row, index) =>
    Object.fromEntries(
      excelColumns.map(([key, label]) => [
        label,
        key === 'no'
          ? index + 1
          : key === 'paymentStatus'
            ? isPaid(row)
              ? 'Paid'
              : 'Unpaid'
            : key === 'paidToDentistAt'
                ? formatDateTime(row[key])
                : (row[key] ?? ''),
      ]),
    ),
  )
  const worksheet = XLSX.utils.json_to_sheet(exportRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Availment Report')

  const datePart = new Date().toISOString().slice(0, 10)
  const modePart = selectedMode.value?.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'report'
  XLSX.writeFile(workbook, `wellness-availment-${modePart}-${datePart}.xlsx`)
}

function clearReportsView() {
  clearReport()
  selectedDentistId.value = null
  dentistSearch.value = ''
  dentistFilters.dentistName = ''
  selectedCompanyCode.value = null
  companySearch.value = ''
}

function resetSelectedCompany() {
  form.company = ''
  selectedCompanyCode.value = null
  companySearch.value = ''
}

function selectCompanyScope(value: (typeof companyScopeOptions)[number]['value']) {
  if (value === 'all') {
    form.companyScope = 'both'
    resetSelectedCompany()
    return
  }

  form.companyScope = 'specificIms'
  form.companyFilterBy = value === 'motherCompany' ? 'mainCompany' : 'classification'
  resetSelectedCompany()
}

watch(selectedCompanyCode, (value) => {
  form.company = value == null ? '' : String(value)
})

watch(companySearch, (search) => {
  window.clearTimeout(companySearchTimer)

  companySearchTimer = window.setTimeout(() => {
    void fetchImsCompanies(search)
  }, 350)
})

watch(
  [imsCompanyOptions, selectedCompanyCode],
  ([availableCompanies, selectedValue]) => {
    const options = [...availableCompanies]
    const normalizedSelectedValue = selectedValue == null ? null : String(selectedValue)
    const matchedCompany = options.find(
      (option) => String(option.value) === normalizedSelectedValue,
    )

    if (matchedCompany) {
      retainedCompany.value = matchedCompany
    } else if (normalizedSelectedValue == null) {
      retainedCompany.value = null
    } else if (retainedCompany.value?.value !== normalizedSelectedValue) {
      retainedCompany.value = {
        value: normalizedSelectedValue,
        label: form.company || 'Selected company',
        description: 'Currently selected company',
      }
    }

    if (
      normalizedSelectedValue != null &&
      !options.some((option) => String(option.value) === normalizedSelectedValue) &&
      retainedCompany.value
    ) {
      options.unshift(retainedCompany.value)
    }

    companyOptions.value = options
  },
  { immediate: true },
)

watch(
  [dentists, selectedDentistId],
  ([availableDentists, selectedId]) => {
    const options: DentistOption[] = availableDentists.map((dentist) => ({
      value: Number(dentist.dentistidno),
      label:
        dentist.dentistname ||
        [dentist.firstname, dentist.middleinitial, dentist.lastname].filter(Boolean).join(' '),
      description: [dentist.dentistcode, dentist.prcno, dentist.specialization]
        .filter(Boolean)
        .join(' | '),
    }))
    const normalizedSelectedId = selectedId == null ? null : Number(selectedId)
    const matchedDentist = options.find((option) => option.value === normalizedSelectedId)

    if (matchedDentist) {
      retainedDentist.value = matchedDentist
    } else if (normalizedSelectedId == null) {
      retainedDentist.value = null
    } else if (retainedDentist.value?.value !== normalizedSelectedId) {
      retainedDentist.value = {
        value: normalizedSelectedId,
        label: form.dentist || 'Selected dentist',
        description: 'Currently selected dentist',
      }
    }

    if (
      normalizedSelectedId != null &&
      !options.some((option) => option.value === normalizedSelectedId) &&
      retainedDentist.value
    ) {
      options.unshift(retainedDentist.value)
    }

    dentistOptions.value = options
    form.dentist = normalizedSelectedId == null ? '' : retainedDentist.value?.label || ''
  },
  { immediate: true },
)

watch(dentistSearch, (search) => {
  window.clearTimeout(dentistSearchTimer)

  dentistSearchTimer = window.setTimeout(() => {
    dentistFilters.dentistName = search.trim()
    void fetchDentists()
  }, 350)
})

onMounted(() => {
  void fetchImsCompanies()
})
</script>

<template>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:p-7">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            <Icon icon="feather:bar-chart-2" class="h-4 w-4" />
            Summary Reports
          </div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-onyx">Reports</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Generate valid dental availment reports by company, dentist, date range, or daily
            activity, then export the preview to Excel.
          </p>
        </div>
      </div>

      <div class="grid border-t border-pebble/80 bg-white/72 md:grid-cols-3">
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Rows</p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ rows.length }}</p>
        </div>
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Report Mode</p>
          <p class="mt-2 text-xl font-black text-onyx">{{ selectedMode?.label }}</p>
        </div>
        <div class="px-6 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Total Amount</p>
          <p class="mt-2 text-2xl font-black text-emerald">{{ formatMoney(totalAmount) }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Report Criteria</h2>
          <p class="mt-1 text-sm text-slate">
            Select one report mode and fill only the filters required for that report.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <AppButton btn-theme="outline" class="normal-case" @click="clearReportsView">
            <Icon icon="feather:rotate-ccw" class="h-4 w-4" />
            Clear
          </AppButton>
          <AppButton
            btn-theme="primary"
            class="normal-case"
            :disabled="loading || !canGenerate"
            @click="generateReport"
          >
            <Icon
              :icon="loading ? 'feather:loader' : 'feather:search'"
              class="h-4 w-4"
              :class="{ 'animate-spin': loading }"
            />
            {{ loading ? 'Generating...' : 'Generate' }}
          </AppButton>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          v-for="mode in reportModes"
          :key="mode.value"
          type="button"
          class="min-h-28 rounded-2xl border px-4 py-3 text-left transition"
          :class="
            form.mode === mode.value
              ? 'border-tangerine bg-tangerine-light text-onyx shadow-sm'
              : 'border-pebble bg-cloud text-slate hover:border-tangerine/40 hover:bg-white'
          "
          @click="form.mode = mode.value"
        >
          <Icon :icon="mode.icon" class="h-4 w-4" />
          <p class="mt-3 text-sm font-black">{{ mode.label }}</p>
          <p class="mt-1 text-xs leading-5">{{ mode.description }}</p>
        </button>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <div v-if="requiresCompany" class="md:col-span-2">
          <label class="mb-2 block text-sm font-medium text-onyx">Company Filter</label>
          <div class="grid gap-3 md:grid-cols-3">
            <button
              v-for="scope in companyScopeOptions"
              :key="scope.value"
              type="button"
              class="rounded-2xl border px-4 py-3 text-left transition"
              :class="
                (scope.value === 'all' && form.companyScope === 'both') ||
                (scope.value === 'deployment' &&
                  form.companyScope === 'specificIms' &&
                  form.companyFilterBy === 'classification') ||
                (scope.value === 'motherCompany' &&
                  form.companyScope === 'specificIms' &&
                  form.companyFilterBy === 'mainCompany')
                  ? 'border-tangerine bg-tangerine-light text-onyx shadow-sm'
                  : 'border-pebble bg-cloud text-slate hover:border-tangerine/40 hover:bg-white'
              "
              @click="selectCompanyScope(scope.value)"
            >
              <p class="text-sm font-black">{{ scope.label }}</p>
              <p class="mt-1 text-xs leading-5">{{ scope.description }}</p>
            </button>
          </div>
        </div>
        <AppSearchSelect
          v-if="requiresSpecificCompany"
          v-model="selectedCompanyCode"
          v-model:search="companySearch"
          :options="companyOptions"
          :loading="loadingCompanies"
          :label="
            form.companyFilterBy === 'mainCompany'
              ? 'Specific Mother Company'
              : 'Specific Deployment'
          "
          :placeholder="
            form.companyFilterBy === 'mainCompany'
              ? 'Search mother company'
              : 'Search active IMS deployment'
          "
          empty-text="No active IMS companies found."
        />
        <AppSearchSelect
          v-if="requiresDentist"
          v-model="selectedDentistId"
          v-model:search="dentistSearch"
          :options="dentistOptions"
          :loading="loadingDentists"
          label="Dentist"
          placeholder="Search dentist"
          empty-text="No matching dentists found."
        />
        <AppInput
          v-if="requiresDates"
          v-model="form.dateFrom"
          label="Availment Date From"
          type="date"
        />
        <AppInput
          v-if="requiresDates"
          v-model="form.dateTo"
          label="Availment Date To"
          type="date"
        />
        <div>
          <label class="mb-2 block text-sm font-medium text-onyx">Dentist Payment</label>
          <select
            v-model="form.dentistPaymentStatus"
            class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] px-4 py-3.5 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
          >
            <option value="">All dentist payments</option>
            <option value="paid">Paid only</option>
            <option value="unpaid">Unpaid only</option>
          </select>
        </div>
      </div>

      <p v-if="errorMessage" class="mt-5 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
        {{ errorMessage }}
      </p>
      <p
        v-if="companyErrorMessage"
        class="mt-5 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby"
      >
        {{ companyErrorMessage }}
      </p>
    </section>

    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Generated Report</h2>
          <p class="mt-1 text-sm text-slate">Preview the report rows before exporting to Excel.</p>
        </div>
        <AppButton
          btn-theme="primary"
          class="normal-case"
          :disabled="loading || !rows.length"
          @click="exportReport"
        >
          <Icon icon="feather:file-text" class="h-4 w-4" />
          Export Excel
        </AppButton>
      </div>

      <AppLoadingScreen
        v-if="loading"
        title="Generating report"
        message="Please wait while we load report rows."
      />
      <AppTable
        v-else
        :theads="[
          'Company',
          'Approval',
          'Member',
          'Availment Date',
          'Dentist / Clinic',
          'Procedure',
          'Amount',
          'Payment',
          'Paid to Dentist At',
          'Encoded By',
        ]"
        :total-entries="rows.length"
      >
        <template #trs>
          <tr v-if="!rows.length">
            <td colspan="10" class="py-12! text-center! text-sm text-slate">
              No report rows generated yet.
            </td>
          </tr>
          <tr v-for="(row, index) in rows" v-else :key="`${row.approvalNo}-${index}`">
            <td>{{ row.companyName || 'N/A' }}</td>
            <td>
              <span class="font-mono text-sm font-black text-onyx">
                {{ row.approvalNo || 'N/A' }}
              </span>
            </td>
            <td>{{ row.memberName || 'N/A' }}</td>
            <td>{{ formatDate(row.availDate) }}</td>
            <td>
              <p class="font-semibold text-onyx">{{ row.dentistName || 'N/A' }}</p>
              <p class="mt-1 text-xs text-slate">{{ row.clinicName || 'N/A' }}</p>
            </td>
            <td>
              <p class="font-semibold text-onyx">{{ row.procedures || 'N/A' }}</p>
              <p class="mt-1 text-xs text-slate">Tooth {{ row.toothNo || 'N/A' }}</p>
            </td>
            <td class="font-black text-onyx">{{ formatMoney(row.amount) }}</td>
            <td>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="isPaid(row) ? 'bg-emerald-light text-emerald' : 'bg-amber-light text-amber'"
              >
                {{ isPaid(row) ? 'Paid' : 'Unpaid' }}
              </span>
            </td>
            <td>
              {{ formatDateTime(row.paidToDentistAt) }}
            </td>
            <td>{{ row.encodedBy || 'N/A' }}</td>
          </tr>
        </template>
      </AppTable>
    </section>
  </div>
</template>
