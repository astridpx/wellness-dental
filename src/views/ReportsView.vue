<script setup lang="ts">
import { Icon } from '@iconify/vue'
import * as XLSX from 'xlsx'
import { computed, onMounted, ref, watch } from 'vue'
import { AppButton, AppInput, AppLoadingScreen, AppSearchSelect, AppTable } from '@/components/app'
import { useAvailmentReports, useDentists, useProcedures } from '@/composables'
import type { AvailmentCompanyFilterBy, AvailmentReportMode } from '@/types'
import {
  addWorkingDays,
  differenceInWorkingDays,
  autoFitWorksheetColumns,
  formatDate,
  formatDateTime,
  formatExcelDateManila,
  formatExcelDateTimeManila,
  formatMoney,
} from '@/utils'

const {
  canGenerate,
  clearReport,
  companyErrorMessage,
  errorMessage,
  fetchImsCompanies,
  fetchPartnerCompanies,
  form,
  generateReport,
  imsCompanies,
  loading,
  loadingCompanies,
  partnerCompanies,
  requiresCompany,
  requiresDates,
  requiresDentist,
  rows,
} = useAvailmentReports()
const {
  dentists,
  fetchDentists,
  filters: dentistFilters,
  loading: loadingDentists,
} = useDentists({ perPage: 20 })
const { fetchProcedures, procedures } = useProcedures()

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
    value: 'billMonitoring',
    label: 'Billing Monitoring',
    description: 'Monitor dentist bill receipt dates, due dates, and remaining working days.',
    icon: 'feather:alert-circle',
  },
  {
    value: 'paymentMonitoring',
    label: 'Payment Monitoring',
    description: 'Track availments by dentist paid date and review billing-to-payment turnaround.',
    icon: 'feather:check-circle',
  },
  {
    value: 'period',
    label: 'Availment Date',
    description: 'All valid availments by availment date range.',
    icon: 'feather:clock',
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
]

const selectedMode = computed(() => reportModes.find((mode) => mode.value === form.mode))
const isBillMonitoringMode = computed(() => form.mode === 'billMonitoring')
const isPaymentMonitoringMode = computed(() => form.mode === 'paymentMonitoring')
const showMonitoringDueFilters = computed(() => isBillMonitoringMode.value)
const showRemarksColumn = computed(
  () =>
    form.mode === 'companyPeriod' ||
    form.mode === 'dentistPeriod' ||
    form.mode === 'paymentMonitoring' ||
    form.mode === 'billMonitoring' ||
    form.mode === 'period',
)
const showBillingColumns = computed(() => isBillMonitoringMode.value || isPaymentMonitoringMode.value)
const showDentistPaymentFilter = computed(
  () => form.mode === 'dentistPeriod' || form.mode === 'billMonitoring',
)
const showDentistFilter = computed(
  () =>
    form.mode === 'dentistPeriod' ||
    form.mode === 'billMonitoring' ||
    form.mode === 'paymentMonitoring',
)
const companyScopeOptions = [
  {
    value: 'all',
    label: 'All',
    description: 'Include IMS availments together with all uploaded partner-member companies.',
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
  {
    value: 'partnerCompany',
    label: 'Partner member company',
    description: 'Filter availments by one uploaded partner-member company such as HB or IWC.',
  },
] as const
const requiresSpecificCompany = computed(
  () =>
    requiresCompany.value &&
    (form.companyScope === 'specificIms' || form.companyScope === 'partner'),
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
              description: '',
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
const partnerCompanyOptions = computed<CompanyOption[]>(() =>
  partnerCompanies.value.map((company) => ({
    value: company.companyCode,
    label: company.companyName,
    description: company.companyCode,
  })),
)
const activeCompanySourceOptions = computed<CompanyOption[]>(() =>
  form.companyScope === 'partner' ? partnerCompanyOptions.value : imsCompanyOptions.value,
)
const selectedCompanyLabel = computed(() => {
  if (!requiresCompany.value) return 'All Companies'

  if (retainedCompany.value?.label?.trim()) return retainedCompany.value.label.trim()
  if (form.company.trim()) return form.company.trim()

  if (form.companyScope === 'both') return 'All Companies'
  if (form.companyScope === 'ims') return 'All IMS Companies'
  if (form.companyScope === 'partner') return 'All Partner Member Companies'

  return 'All Companies'
})
const selectedCompanyScopeLabel = computed(() => {
  if (!requiresCompany.value) return 'Not applicable'

  if (form.companyScope === 'partner') return 'Partner Member Company'
  if (form.companyScope === 'specificIms') {
    return form.companyFilterBy === 'mainCompany' ? 'Per Mother Company' : 'Per Deployment'
  }

  if (form.companyScope === 'ims') return 'IMS Companies Only'
  return 'All Companies'
})
const selectedReportTitle = computed(() => {
  if (form.mode === 'companyPeriod') {
    if (form.companyScope === 'partner') return 'Partner Company + Availment Report'
    if (form.companyFilterBy === 'mainCompany') return 'Mother Company + Availment Report'
    return 'Company + Availment Report'
  }

  if (form.mode === 'dentistPeriod') return 'Dentist + Availment Report'
  if (form.mode === 'billMonitoring') return 'Billing Monitoring Report'
  if (form.mode === 'paymentMonitoring') return 'Wellness Availment Payment Monitoring Report'
  if (form.mode === 'period') return 'Availment Date Report'
  return 'Availment Report'
})
const dateRangeLabel = computed(() => {
  if (isBillMonitoringMode.value) return 'Billing Received Date'
  if (isPaymentMonitoringMode.value) return 'Paid Date'
  return 'Availment Date'
})
const normalizedDaysRemainingFrom = computed(() => {
  const value = Number(form.daysRemainingFrom)
  return Number.isInteger(value) ? value : null
})
const normalizedDaysRemainingTo = computed(() => {
  const value = Number(form.daysRemainingTo)
  return Number.isInteger(value) ? value : null
})
const visibleRows = computed(() =>
  rows.value.filter((row) => {
    if (!showMonitoringDueFilters.value) return true

    const paid = isPaid(row)
    const remaining = billingDaysRemaining(row.billingReceivedAt)
    const monitoringStatus = form.monitoringStatus.trim()

    if (monitoringStatus === 'overdueOnly') {
      return !paid && remaining !== null && remaining < 0
    }

    if (monitoringStatus === 'dueSoonOnly') {
      if (paid || remaining === null || remaining < 0) return false

      const min = normalizedDaysRemainingFrom.value ?? 1
      const max = normalizedDaysRemainingTo.value ?? 10
      return remaining >= min && remaining <= max
    }

    if (
      !paid &&
      remaining !== null &&
      normalizedDaysRemainingFrom.value !== null &&
      remaining < normalizedDaysRemainingFrom.value
    ) {
      return false
    }

    if (
      !paid &&
      remaining !== null &&
      normalizedDaysRemainingTo.value !== null &&
      remaining > normalizedDaysRemainingTo.value
    ) {
      return false
    }

    return true
  }),
)
const visibleTotalAmount = computed(() =>
  visibleRows.value.reduce((sum, row) => sum + Number(row.amount || 0), 0),
)
const excelColumns = computed(() => [
  ['no', 'No.'],
  ['companyName', 'Company Name'],
  ['approvalNo', 'Approval No.'],
  ['memberName', 'Member Name'],
  ['availDate', 'Availment Date'],
  ['dentistName', 'Dentist Name'],
  ['clinicName', 'Clinic Name'],
  ['toothNo', 'Tooth No.'],
  ['procedureName', 'Procedure Name'],
  ...(showBillingColumns.value
    ? [
        ['billingReceivedAt', 'Billing Received Date'],
        ['dueDate', 'Due Date'],
        [isPaymentMonitoringMode.value ? 'paymentLeadTime' : 'daysRemaining', isPaymentMonitoringMode.value ? 'Turnaround' : 'Days Remaining'],
      ]
    : []),
  ['amount', 'Amount'],
  ['paymentStatus', 'Payment Status'],
  ['paidToDentistAt', 'Paid to Dentist At'],
  ['remarks', 'Remarks'],
  ['encodedBy', 'Encoded By'],
] as const)

const procedureNameMap = computed(
  () => new Map(procedures.value.map((procedure) => [procedure.code.trim().toUpperCase(), procedure.name])),
)

function procedureName(value?: string | null) {
  const procedureValue = value?.trim()
  if (!procedureValue) return 'N/A'

  return procedureValue
    .split(',')
    .map((part) => {
      const normalizedPart = part.trim()
      if (!normalizedPart) return ''

      return procedureNameMap.value.get(normalizedPart.toUpperCase()) || normalizedPart
    })
    .filter(Boolean)
    .join(', ')
}

function isPaid(row: { ifPaid?: boolean | number | string | null }) {
  return row.ifPaid === true || Number(row.ifPaid || 0) === 1
}

function billingDueDate(value?: string | null) {
  return addWorkingDays(value, 10)
}

function billingDaysRemaining(value?: string | null) {
  const dueDate = billingDueDate(value)
  if (!dueDate) return null
  return differenceInWorkingDays(new Date(), dueDate)
}

function billingStatusLabel(value?: string | null, paid?: boolean) {
  if (!value) return 'No billing date'
  if (paid) return 'Paid'

  const remaining = billingDaysRemaining(value)
  if (remaining === null) return 'No due date'
  if (remaining < 0) return `Overdue by ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? '' : 's'}`
  if (remaining <= 3) return `${remaining} day${remaining === 1 ? '' : 's'} left`
  return `${remaining} days left`
}

function billingStatusClass(value?: string | null, paid?: boolean) {
  if (!value) return 'bg-fog text-slate'
  if (paid) return 'bg-emerald-light text-emerald'

  const remaining = billingDaysRemaining(value)
  if (remaining !== null && remaining <= 3) return 'bg-ruby-light text-ruby'
  if (remaining !== null && remaining < 0) return 'bg-ruby-light text-ruby'
  return 'bg-amber-light text-amber'
}

function paymentLeadTimeLabel(
  billingReceivedAt?: string | null,
  paidToDentistAt?: string | null,
) {
  if (!billingReceivedAt || !paidToDentistAt) return 'N/A'

  const paidDate = new Date(paidToDentistAt)
  const dueDate = billingDueDate(billingReceivedAt)
  if (Number.isNaN(paidDate.getTime()) || !dueDate) return 'N/A'

  const workingDays = differenceInWorkingDays(new Date(billingReceivedAt), paidDate)
  const dueDelta = differenceInWorkingDays(paidDate, dueDate)
  if (workingDays === null || dueDelta === null) return 'N/A'

  if (dueDelta < 0) {
    return `${workingDays} work day${workingDays === 1 ? '' : 's'} | ${Math.abs(dueDelta)} day${Math.abs(dueDelta) === 1 ? '' : 's'} late`
  }

  if (dueDelta === 0) {
    return `${workingDays} work day${workingDays === 1 ? '' : 's'} | On due date`
  }

  return `${workingDays} work day${workingDays === 1 ? '' : 's'} | ${dueDelta} day${dueDelta === 1 ? '' : 's'} early`
}

function exportCellValue(
  row: Record<string, unknown>,
  key: string,
  index: number,
) {
  if (key === 'no') return index + 1
  if (key === 'availDate') return formatExcelDateManila(row.availDate as string | null | undefined)
  if (key === 'procedureName') return procedureName(row.procedures as string | null | undefined)
  if (key === 'paymentStatus') {
    return isPaid({ ifPaid: row.ifPaid as boolean | number | string | null | undefined })
      ? 'Paid'
      : 'Unpaid'
  }
  if (key === 'billingReceivedAt') {
    return formatExcelDateManila(row.billingReceivedAt as string | null | undefined)
  }
  if (key === 'dueDate') {
    return formatExcelDateManila(billingDueDate(row.billingReceivedAt as string | null | undefined))
  }
  if (key === 'daysRemaining') {
    return billingStatusLabel(
      row.billingReceivedAt as string | null | undefined,
      isPaid({ ifPaid: row.ifPaid as boolean | number | string | null | undefined }),
    )
  }
  if (key === 'paymentLeadTime') {
    return paymentLeadTimeLabel(
      row.billingReceivedAt as string | null | undefined,
      row.paidToDentistAt as string | null | undefined,
    )
  }
  if (key === 'paidToDentistAt') {
    return formatExcelDateTimeManila(row.paidToDentistAt as string | null | undefined)
  }

  return row[key] ?? ''
}

function paymentFilterLabel() {
  if (form.dentistPaymentStatus === 'paid') return 'Paid only'
  if (form.dentistPaymentStatus === 'unpaid') return 'Unpaid only'
  return 'All dentist payments'
}

function exportReport() {
  if (!visibleRows.value.length) return

  const exportRows = visibleRows.value.map((row, index) =>
    Object.fromEntries(
      excelColumns.value.map(([key, label]) => [
        label,
        exportCellValue(row as Record<string, unknown>, key, index),
        ]),
    ),
  )
  const reportGeneratedAt = formatExcelDateTimeManila(new Date(), '')
  const dateFromLabel = form.dateFrom ? formatDate(form.dateFrom) : 'N/A'
  const dateToLabel = form.dateTo ? formatDate(form.dateTo) : 'N/A'
  const totalRows = visibleRows.value.length
  const totalAmountLabel = formatMoney(visibleTotalAmount.value)
  const headerRows = [
    ['IWC WELLNESS AND PREVENTIVE CONSULTANCY INC.'],
    [selectedReportTitle.value],
    [],
    ['REPORT DETAILS'],
    ['Date and Time Generated', reportGeneratedAt],
    ['Company Selected', selectedCompanyLabel.value],
    [`${dateRangeLabel.value} From`, dateFromLabel],
    [`${dateRangeLabel.value} To`, dateToLabel],
    ...(showMonitoringDueFilters.value
      ? [
          ['Monitoring Status', form.monitoringStatus === 'overdueOnly'
            ? 'Overdue only'
            : form.monitoringStatus === 'dueSoonOnly'
              ? 'Due soon only'
              : 'All billing rows'],
          ['Days Remaining From', form.daysRemainingFrom || 'N/A'],
          ['Days Remaining To', form.daysRemainingTo || 'N/A'],
        ]
      : []),
    [],
    ['SUMMARY'],
    ['Total Rows', totalRows],
    ['Total Amount', totalAmountLabel],
    [],
    ['AVAILMENT DATA'],
    [],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(headerRows)
  const dataStartRow = headerRows.length + 1
  XLSX.utils.sheet_add_json(worksheet, exportRows, {
    origin: `A${dataStartRow}`,
    skipHeader: false,
  })

  const lastColumnIndex = Math.max(0, excelColumns.value.length - 1)
  worksheet['!merges'] = [
    XLSX.utils.decode_range(`A1:${XLSX.utils.encode_col(lastColumnIndex)}1`),
    XLSX.utils.decode_range(`A2:${XLSX.utils.encode_col(lastColumnIndex)}2`),
  ]
  worksheet['!autofilter'] = {
    ref: `A${dataStartRow}:${XLSX.utils.encode_col(lastColumnIndex)}${dataStartRow + exportRows.length}`,
  }
  autoFitWorksheetColumns(worksheet)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Availment Report')

  const datePart = new Date().toISOString().slice(0, 10)
  const modePart = selectedMode.value?.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'report'
  const companyPart = selectedCompanyLabel.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const fileParts = ['wellness-availment', modePart, companyPart || 'all-companies', datePart]
  XLSX.writeFile(workbook, `${fileParts.join('-')}.xlsx`)
}

function clearReportsView() {
  clearReport()
  selectedDentistId.value = null
  dentistSearch.value = ''
  dentistFilters.dentistName = ''
  selectedCompanyCode.value = null
  companySearch.value = ''
}

watch(
  () => form.mode,
  (mode) => {
    if (mode !== 'billMonitoring') {
      form.monitoringStatus = ''
      form.daysRemainingFrom = ''
      form.daysRemainingTo = ''
    }
  },
)

watch(
  () => form.monitoringStatus,
  (status) => {
    if (status === 'dueSoonOnly') {
      if (!form.daysRemainingFrom) form.daysRemainingFrom = '1'
      if (!form.daysRemainingTo) form.daysRemainingTo = '10'
      return
    }

    form.daysRemainingFrom = ''
    form.daysRemainingTo = ''
  },
)

function resetSelectedCompany() {
  form.company = ''
  selectedCompanyCode.value = null
  companySearch.value = ''
}

function selectCompanyScope(value: (typeof companyScopeOptions)[number]['value']) {
  if (value === 'all') {
    form.companyScope = 'both'
    form.companyFilterBy = 'classification'
    resetSelectedCompany()
    return
  }

  if (value === 'partnerCompany') {
    form.companyScope = 'partner'
    form.companyFilterBy = 'classification'
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
    if (form.companyScope === 'partner') {
      void fetchPartnerCompanies(search)
      return
    }

    void fetchImsCompanies(search)
  }, 350)
})

watch(
  [activeCompanySourceOptions, selectedCompanyCode],
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
  () => form.companyScope,
  (scope) => {
    if (scope === 'partner') {
      void fetchPartnerCompanies(companySearch.value)
      return
    }

    if (scope === 'specificIms') {
      void fetchImsCompanies(companySearch.value)
    }
  },
)

watch(
  [dentists, selectedDentistId],
  ([availableDentists, selectedId]) => {
    const options: DentistOption[] = availableDentists.map((dentist) => ({
      value: Number(dentist.dentistidno),
      label: formatLegacyDentistName(dentist),
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
  void fetchPartnerCompanies()
  void fetchProcedures()
})


function formatLegacyDentistName(dentist: { dentistname?: string | null; firstname?: string | null; middleinitial?: string | null; lastname?: string | null }) {
  if (dentist.dentistname?.trim()) return dentist.dentistname.trim()

  const firstName = String(dentist.firstname || '').trim()
  const middleInitial = String(dentist.middleinitial || '').trim().replace(/\.+$/, '')
  const lastName = String(dentist.lastname || '').trim()
  const rightSide = [firstName, middleInitial ? `${middleInitial}.` : ''].filter(Boolean).join(' ').trim()

  return [lastName, rightSide].filter(Boolean).join(', ').trim()
}
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
            Generate polished dental availment reports by billing date, paid date, company, dentist,
            or availment period, then export the preview to Excel.
          </p>
        </div>
      </div>

      <div class="grid border-t border-pebble/80 bg-white/72 md:grid-cols-3">
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Rows</p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ visibleRows.length }}</p>
        </div>
        <div class="border-b border-pebble/80 px-6 py-4 md:border-b-0 md:border-r">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Report Mode</p>
          <p class="mt-2 text-xl font-black text-onyx">{{ selectedMode?.label }}</p>
        </div>
        <div class="px-6 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Total Amount</p>
          <p class="mt-2 text-2xl font-black text-emerald">{{ formatMoney(visibleTotalAmount) }}</p>
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
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                  form.companyFilterBy === 'mainCompany') ||
                (scope.value === 'partnerCompany' && form.companyScope === 'partner')
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
            form.companyScope === 'partner'
              ? 'Specific Partner Member Company'
              : form.companyFilterBy === 'mainCompany'
                ? 'Specific Mother Company'
                : 'Specific Deployment'
          "
          :placeholder="
            form.companyScope === 'partner'
              ? 'Search partner member company'
              : form.companyFilterBy === 'mainCompany'
                ? 'Search mother company'
                : 'Search active IMS deployment'
          "
          :empty-text="
            form.companyScope === 'partner'
              ? 'No partner member companies found.'
              : 'No active IMS companies found.'
          "
        />
        <AppSearchSelect
          v-if="showDentistFilter"
          v-model="selectedDentistId"
          v-model:search="dentistSearch"
          :options="dentistOptions"
          :loading="loadingDentists"
          label="Dentist"
          placeholder="Search dentist"
          empty-text="No matching dentists found."
        />
        <div v-if="showDentistPaymentFilter">
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
        <div v-if="requiresDates" class="grid gap-4 md:col-span-2 md:grid-cols-2">
          <AppInput v-model="form.dateFrom" :label="`${dateRangeLabel} From`" type="date" />
          <AppInput v-model="form.dateTo" :label="`${dateRangeLabel} To`" type="date" />
        </div>
        <div v-if="showMonitoringDueFilters" class="grid gap-4 md:col-span-2 md:grid-cols-3">
          <div>
            <label class="mb-2 block text-sm font-medium text-onyx">Due Monitoring</label>
            <select
              v-model="form.monitoringStatus"
              class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] px-4 py-3.5 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
            >
              <option value="">All billing rows</option>
              <option value="overdueOnly">Overdue only</option>
              <option value="dueSoonOnly">Due soon only</option>
            </select>
          </div>
          <AppInput
            v-if="form.monitoringStatus === 'dueSoonOnly'"
            v-model="form.daysRemainingFrom"
            label="Days Remaining From"
            type="number"
            min="0"
            placeholder="1"
          />
          <AppInput
            v-if="form.monitoringStatus === 'dueSoonOnly'"
            v-model="form.daysRemainingTo"
            label="Days Remaining To"
            type="number"
            min="0"
            placeholder="10"
          />
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
          :disabled="loading || !visibleRows.length"
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
        :theads="
          [
            'Company',
            'Approval',
            'Member',
            'Availment Date',
            'Dentist / Clinic',
            'Procedure',
            ...(showBillingColumns
              ? ['Billing Received', 'Due Date', isPaymentMonitoringMode ? 'Turnaround' : 'Days Remaining']
              : []),
            'Amount',
            'Payment',
            'Paid to Dentist At',
            ...(showRemarksColumn ? ['Remarks'] : []),
            'Encoded By',
          ]
        "
        :total-entries="visibleRows.length"
      >
        <template #trs>
          <tr v-if="!visibleRows.length">
            <td
              :colspan="8 + (showBillingColumns ? 3 : 0) + 2 + (showRemarksColumn ? 1 : 0)"
              class="py-12! text-center! text-sm text-slate"
            >
              {{ rows.length ? 'No report rows match the current monitoring filters.' : 'No report rows generated yet.' }}
            </td>
          </tr>
          <tr v-for="(row, index) in visibleRows" v-else :key="`${row.approvalNo}-${index}`">
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
              <p class="font-semibold text-onyx">{{ procedureName(row.procedures) }}</p>
              <p class="mt-1 text-xs text-slate">Tooth {{ row.toothNo || 'N/A' }}</p>
            </td>
            <td v-if="showBillingColumns">{{ formatDate(row.billingReceivedAt) }}</td>
            <td v-if="showBillingColumns">{{ formatDate(billingDueDate(row.billingReceivedAt)) }}</td>
            <td v-if="showBillingColumns">
              <template v-if="isPaymentMonitoringMode">
                {{ paymentLeadTimeLabel(row.billingReceivedAt, row.paidToDentistAt) }}
              </template>
              <span
                v-else
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="billingStatusClass(row.billingReceivedAt, isPaid(row))"
              >
                {{ billingStatusLabel(row.billingReceivedAt, isPaid(row)) }}
              </span>
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
            <td v-if="showRemarksColumn">
              <span class="block max-w-56 whitespace-normal text-sm text-slate">
                {{ row.remarks || 'N/A' }}
              </span>
            </td>
            <td>{{ row.encodedBy || 'N/A' }}</td>
          </tr>
        </template>
      </AppTable>
    </section>
  </div>
</template>
