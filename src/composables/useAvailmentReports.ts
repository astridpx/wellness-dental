import { computed, reactive, ref } from 'vue'
import type {
  AvailmentCompanyFilterBy,
  AvailmentCompanyScope,
  AvailmentReportMode,
  AvailmentReportRow,
  ImsReportCompany,
  PartnerMemberBatch,
  PartnerReportCompany,
} from '@/types'
import { useWellnessApi } from './useWellnessApi'

type ReportMetadata = {
  count?: number
  totalAmount?: number
}

export function useAvailmentReports() {
  const { request } = useWellnessApi()

  const loading = ref(false)
  const loadingCompanies = ref(false)
  const errorMessage = ref('')
  const companyErrorMessage = ref('')
  const rows = ref<AvailmentReportRow[]>([])
  const imsCompanies = ref<ImsReportCompany[]>([])
  const partnerCompanies = ref<PartnerReportCompany[]>([])
  const totalAmount = ref(0)
  const form = reactive({
    mode: 'billMonitoring' as AvailmentReportMode,
    companyScope: 'both' as AvailmentCompanyScope,
    companyFilterBy: 'classification' as AvailmentCompanyFilterBy,
    company: '',
    dentist: '',
    dentistPaymentStatus: '',
    monitoringStatus: '',
    daysRemainingFrom: '',
    daysRemainingTo: '',
    dateFrom: '',
    dateTo: '',
  })

  const requiresCompany = computed(() => form.mode === 'companyPeriod')
  const requiresDentist = computed(() => form.mode === 'dentistPeriod')
  const requiresDates = computed(() =>
    ['companyPeriod', 'dentistPeriod', 'period', 'billMonitoring', 'paymentMonitoring'].includes(form.mode),
  )
  const canGenerate = computed(() => {
    if (requiresCompany.value && form.companyScope === 'specificIms' && !form.company.trim()) {
      return false
    }
    if (requiresDentist.value && !form.dentist.trim()) return false
    if (
      requiresDates.value &&
      (form.mode !== 'billMonitoring' || !form.monitoringStatus.trim()) &&
      (!form.dateFrom || !form.dateTo)
    ) {
      return false
    }
    return true
  })

  async function generateReport() {
    if (!canGenerate.value) {
      errorMessage.value = 'Complete the required filters before generating the report.'
      return false
    }

    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      mode: form.mode,
      companyScope: form.companyScope,
    })

    if (form.companyScope === 'specificIms') {
      params.set('companyFilterBy', form.companyFilterBy)
    }

    if (form.company.trim()) params.set('company', form.company.trim())
    if (form.dentist.trim()) params.set('dentist', form.dentist.trim())
    if (form.dentistPaymentStatus) params.set('dentistPaymentStatus', form.dentistPaymentStatus)
    if (form.dateFrom) params.set('dateFrom', form.dateFrom)
    if (form.dateTo) params.set('dateTo', form.dateTo)

    const result = await request<AvailmentReportRow[]>(
      `/wellness/reports/availments?${params.toString()}`,
    )

    loading.value = false

    if (!result.ok) {
      rows.value = []
      totalAmount.value = 0
      errorMessage.value = result.error || 'Unable to generate report.'
      return false
    }

    const metadata = (result.metadata || {}) as ReportMetadata
    rows.value = result.data || []
    totalAmount.value = Number(metadata.totalAmount || 0)
    return true
  }

  async function fetchImsCompanies(search = '') {
    loadingCompanies.value = true
    companyErrorMessage.value = ''

    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())

    const result = await request<ImsReportCompany[]>(
      `/wellness/reports/imsCompanies?${params.toString()}`,
    )

    loadingCompanies.value = false

    if (!result.ok) {
      imsCompanies.value = []
      companyErrorMessage.value = result.error || 'Unable to load IMS companies.'
      return false
    }

    imsCompanies.value = result.data || []
    return true
  }

  async function fetchPartnerCompanies(search = '') {
    loadingCompanies.value = true
    companyErrorMessage.value = ''

    const params = new URLSearchParams({
      page: '1',
      perPage: '100',
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
    })

    if (search.trim()) {
      params.set('companyName', search.trim())
    }

    const result = await request<PartnerMemberBatch[]>(
      `/wellness/partnerMembers/batches?${params.toString()}`,
    )

    loadingCompanies.value = false

    if (!result.ok) {
      partnerCompanies.value = []
      companyErrorMessage.value = result.error || 'Unable to load partner member companies.'
      return false
    }

    partnerCompanies.value = Array.from(
      new Map(
        (result.data || [])
          .filter((batch) => batch.companyName?.trim() || batch.companyCode?.trim())
          .map((batch) => {
            const companyCode = batch.companyCode?.trim() || batch.companyName.trim()
            const companyName = batch.companyName?.trim() || companyCode

            return [
              companyCode,
              {
                companyCode,
                companyName,
              },
            ]
          }),
      ).values(),
    )

    return true
  }

  function clearReport() {
    form.mode = 'billMonitoring'
    form.companyScope = 'both'
    form.companyFilterBy = 'classification'
    form.company = ''
    form.dentist = ''
    form.dentistPaymentStatus = ''
    form.monitoringStatus = ''
    form.daysRemainingFrom = ''
    form.daysRemainingTo = ''
    form.dateFrom = ''
    form.dateTo = ''
    rows.value = []
    totalAmount.value = 0
    errorMessage.value = ''
  }

  return {
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
    totalAmount,
  }
}
