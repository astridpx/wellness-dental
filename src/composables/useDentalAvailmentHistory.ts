import { computed, onMounted, reactive, ref, watch } from 'vue'
import type {
  DentalAvailmentApproval,
  DentalAvailmentHistoryPaginationMetadata,
  DentalAvailmentRecord,
} from '@/types'
import { useDentalAvailments } from './useDentalAvailments'
import { useWellnessApi } from './useWellnessApi'

export function useDentalAvailmentHistory() {
  const { request } = useWellnessApi()
  const { readByApprovalNo: readApproval, lookupForm, approvalLookup } = useDentalAvailments()

  const records = ref<DentalAvailmentRecord[]>([])
  const loading = ref(true)
  const lookingUp = ref(false)
  const cancellingId = ref<number | null>(null)
  const uncancellingId = ref<number | null>(null)
  const updatingId = ref<number | null>(null)
  const updatingPaymentId = ref<number | null>(null)
  const errorMessage = ref('')
  const successMessage = ref('')
  const lookupErrorMessage = ref('')
  const selectedApproval = ref<DentalAvailmentApproval | null>(null)
  const billingLookupRecords = ref<DentalAvailmentRecord[]>([])
  const loadingBillingLookup = ref(false)
  const billingLookupErrorMessage = ref('')
  const lastBillingLookupParams = ref<{
    approvalNo?: string
    dentistName?: string
    memberName?: string
  } | null>(null)
  const currentPage = ref(1)
  const totalEntries = ref(0)
  const totalPages = ref(1)
  const paidRows = ref(0)
  const unpaidRows = ref(0)
  const unpaidAmount = ref(0)
  const totalAmount = ref(0)
  const hasOverallTotalAmount = ref(false)

  const filters = reactive({
    approvalNo: '',
    memberName: '',
    dentistName: '',
    clinicName: '',
    procedure: '',
    clientCode: '',
    encodedBy: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  })

  const stats = computed(() => ({
    totalAvailments: totalEntries.value,
    totalAmount: totalAmount.value,
    hasOverallTotalAmount: hasOverallTotalAmount.value,
    validRows: records.value.filter((record) => (record.status || 'VALID') === 'VALID').length,
  }))

  async function fetchHistory() {
    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: '10',
      sortBy: 'dentalid',
      sortOrder: 'desc',
    })

    if (filters.approvalNo.trim()) params.set('approvalNo', filters.approvalNo.trim())
    if (filters.memberName.trim()) params.set('memberName', filters.memberName.trim())
    if (filters.dentistName.trim()) params.set('dentistName', filters.dentistName.trim())
    if (filters.clinicName.trim()) params.set('clinicName', filters.clinicName.trim())
    if (filters.procedure.trim()) params.set('procedure', filters.procedure.trim())
    if (filters.clientCode.trim()) params.set('clientCode', filters.clientCode.trim())
    if (filters.encodedBy.trim()) params.set('encodedBy', filters.encodedBy.trim())
    if (filters.status.trim()) params.set('status', filters.status.trim())
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)

    const result = await request<DentalAvailmentRecord[]>(
      `/wellness/dentalAvailments?${params.toString()}`,
    )

    loading.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load dental availment history.'
      records.value = []
      totalEntries.value = 0
      totalPages.value = 1
      paidRows.value = 0
      unpaidRows.value = 0
      unpaidAmount.value = 0
      totalAmount.value = 0
      hasOverallTotalAmount.value = false
      return
    }

    const metadata = (result.metadata || {}) as DentalAvailmentHistoryPaginationMetadata
    records.value = result.data || []
    totalEntries.value = Number(metadata.totalEntries || 0)
    totalPages.value = Number(metadata.totalPages || 1)
    paidRows.value = Number(metadata.paidRows || 0)
    unpaidRows.value = Number(metadata.unpaidRows || 0)
    unpaidAmount.value = Number(metadata.unpaidAmount || 0)
    hasOverallTotalAmount.value =
      metadata.totalAmount !== null && metadata.totalAmount !== undefined
    totalAmount.value = hasOverallTotalAmount.value ? Number(metadata.totalAmount || 0) : 0
  }

  function applyFilters() {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }

    void fetchHistory()
  }

  function clearFilters() {
    filters.approvalNo = ''
    filters.memberName = ''
    filters.dentistName = ''
    filters.clinicName = ''
    filters.procedure = ''
    filters.clientCode = ''
    filters.encodedBy = ''
    filters.status = ''
    filters.dateFrom = ''
    filters.dateTo = ''
    applyFilters()
  }

  async function openApprovalDetails(approvalNo: string) {
    lookingUp.value = true
    lookupErrorMessage.value = ''
    selectedApproval.value = null
    lookupForm.approvalNo = approvalNo

    const found = await readApproval()
    lookingUp.value = false

    if (!found || !approvalLookup.value) {
      lookupErrorMessage.value = 'Unable to load approval details.'
      return
    }

    selectedApproval.value = approvalLookup.value
  }

  async function fetchBillingLookup(
    filters: {
      approvalNo?: string
      dentistName?: string
      memberName?: string
    },
    options: { remember?: boolean } = {},
  ) {
    const approvalNo = String(filters.approvalNo || '').trim()
    const dentistName = String(filters.dentistName || '').trim()
    const memberName = String(filters.memberName || '').trim()

    if (!approvalNo && !dentistName && !memberName) {
      billingLookupRecords.value = []
      billingLookupErrorMessage.value = ''
      if (options.remember !== false) {
        lastBillingLookupParams.value = null
      }
      return false
    }

    loadingBillingLookup.value = true
    billingLookupErrorMessage.value = ''

    const params = new URLSearchParams({
      page: '1',
      perPage: '100',
      sortBy: 'availdate',
      sortOrder: 'asc',
    })

    if (approvalNo) params.set('approvalNo', approvalNo)
    if (dentistName) params.set('dentistName', dentistName)
    if (memberName) params.set('memberName', memberName)

    const result = await request<DentalAvailmentRecord[]>(
      `/wellness/dentalAvailments?${params.toString()}`,
    )

    loadingBillingLookup.value = false

    if (!result.ok) {
      billingLookupErrorMessage.value = result.error || 'Unable to load billing lookup results.'
      billingLookupRecords.value = []
      return false
    }

    billingLookupRecords.value = result.data || []
    if (options.remember !== false) {
      lastBillingLookupParams.value = { approvalNo, dentistName, memberName }
    }
    return true
  }

  function clearBillingLookup() {
    billingLookupRecords.value = []
    billingLookupErrorMessage.value = ''
    lastBillingLookupParams.value = null
  }

  async function cancelAvailment(record: DentalAvailmentRecord) {
    cancellingId.value = record.dentalid
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<DentalAvailmentRecord>(
      `/wellness/dentalAvailments/${record.dentalid}/cancel`,
      {
        method: 'PATCH',
      },
    )

    cancellingId.value = null

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to cancel dental availment.'
      return false
    }

    successMessage.value = `Availment ${record.approvalno} was cancelled.`
    await fetchHistory()
    if (selectedApproval.value?.approvalNo === record.approvalno) {
      await openApprovalDetails(record.approvalno)
    }
    return true
  }

  async function uncancelAvailment(record: DentalAvailmentRecord) {
    uncancellingId.value = record.dentalid
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<DentalAvailmentRecord>(
      `/wellness/dentalAvailments/${record.dentalid}/uncancel`,
      {
        method: 'PATCH',
      },
    )

    uncancellingId.value = null

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to uncancel dental availment.'
      return false
    }

    successMessage.value = `Availment ${record.approvalno} was restored.`
    await fetchHistory()
    if (selectedApproval.value?.approvalNo === record.approvalno) {
      await openApprovalDetails(record.approvalno)
    }
    return true
  }

  async function updateAvailment(
    record: DentalAvailmentRecord,
    payload: {
      memberName: string
      availDate: string
      procedures: string
      amount: number
      toothNo?: string
      dentistId?: number
      dentistName: string
      clinicId?: number
      clinicName: string
      treatment?: string
      remarks?: string
    },
  ) {
    updatingId.value = record.dentalid
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<DentalAvailmentRecord>(
      `/wellness/dentalAvailments/${record.dentalid}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      { includeContentType: true },
    )

    updatingId.value = null

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to update dental availment.'
      return false
    }

    successMessage.value = `Availment ${record.approvalno} was updated.`
    await fetchHistory()
    if (selectedApproval.value?.approvalNo === record.approvalno) {
      await openApprovalDetails(record.approvalno)
    }
    return true
  }

  async function updateDoctorPaymentStatus(
    record: DentalAvailmentRecord,
    paid: boolean,
    billingReceivedAt?: string,
    paidAt?: string,
  ) {
    updatingPaymentId.value = record.dentalid
    errorMessage.value = ''
    successMessage.value = ''

    const payload: Record<string, unknown> = {
      paid,
    }

    if (billingReceivedAt !== undefined) {
      payload.billingReceivedAt = billingReceivedAt || null
    }

    if (paid && paidAt !== undefined) {
      payload.paidAt = paidAt || null
    }

    const result = await request<DentalAvailmentRecord>(
      `/wellness/dentalAvailments/${record.dentalid}/payment`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { includeContentType: true },
    )

    updatingPaymentId.value = null

    if (!result.ok) {
      errorMessage.value =
        result.error || `Unable to mark dentist payment as ${paid ? 'paid' : 'unpaid'}.`
      return false
    }

    successMessage.value = `Dentist payment for ${record.approvalno} was marked ${
      paid ? 'paid' : 'unpaid'
    }.`
    await fetchHistory()
    if (lastBillingLookupParams.value) {
      await fetchBillingLookup(lastBillingLookupParams.value, { remember: false })
    }
    if (selectedApproval.value?.approvalNo === record.approvalno) {
      await openApprovalDetails(record.approvalno)
    }
    return true
  }

  async function updateDoctorBillingReceivedAt(
    record: DentalAvailmentRecord,
    billingReceivedAt?: string,
  ) {
    updatingPaymentId.value = record.dentalid
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<DentalAvailmentRecord>(
      `/wellness/dentalAvailments/${record.dentalid}/payment`,
      {
        method: 'PATCH',
        body: JSON.stringify({ billingReceivedAt: billingReceivedAt || null }),
      },
      { includeContentType: true },
    )

    updatingPaymentId.value = null

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to update dentist billing received date.'
      return false
    }

    successMessage.value = `Billing received date for ${record.approvalno} was updated.`
    await fetchHistory()
    if (lastBillingLookupParams.value) {
      await fetchBillingLookup(lastBillingLookupParams.value, { remember: false })
    }
    if (selectedApproval.value?.approvalNo === record.approvalno) {
      await openApprovalDetails(record.approvalno)
    }
    return true
  }

  async function updateDoctorBillingReceivedAtBulk(
    recordsToUpdate: DentalAvailmentRecord[],
    billingReceivedAt?: string,
  ) {
    const dentalIds = Array.from(
      new Set(
        recordsToUpdate
          .map((record) => Number(record.dentalid))
          .filter((dentalId) => Number.isInteger(dentalId) && dentalId > 0),
      ),
    )

    if (!dentalIds.length) {
      errorMessage.value = 'No dental availments were selected for bulk billing update.'
      return false
    }

    updatingPaymentId.value = dentalIds[0] || -1
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<{
      updatedCount: number
      updatedIds: number[]
      missingIds?: number[]
      cancelledIds?: number[]
    }>(
      '/wellness/dentalAvailments/payment/bulk',
      {
        method: 'PATCH',
        body: JSON.stringify({
          dentalIds,
          billingReceivedAt: billingReceivedAt || null,
        }),
      },
      { includeContentType: true },
    )

    updatingPaymentId.value = null

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to update dentist billing received dates.'
      return false
    }

    const updatedCount = Number(result.data?.updatedCount || dentalIds.length)
    successMessage.value = `Billing received date was updated for ${updatedCount} availment${
      updatedCount === 1 ? '' : 's'
    }.`
    await fetchHistory()
    if (lastBillingLookupParams.value) {
      await fetchBillingLookup(lastBillingLookupParams.value, { remember: false })
    }
    return true
  }

  async function updateDoctorPaymentStatusBulk(
    recordsToUpdate: DentalAvailmentRecord[],
    paidAt?: string,
  ) {
    const dentalIds = Array.from(
      new Set(
        recordsToUpdate
          .map((record) => Number(record.dentalid))
          .filter((dentalId) => Number.isInteger(dentalId) && dentalId > 0),
      ),
    )

    if (!dentalIds.length) {
      errorMessage.value = 'No dental availments were selected for bulk payment update.'
      return false
    }

    updatingPaymentId.value = dentalIds[0] || -1
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<{
      updatedCount: number
      updatedIds: number[]
      missingIds?: number[]
      cancelledIds?: number[]
    }>(
      '/wellness/dentalAvailments/payment/mark-paid/bulk',
      {
        method: 'PATCH',
        body: JSON.stringify({
          dentalIds,
          paidAt: paidAt || null,
        }),
      },
      { includeContentType: true },
    )

    updatingPaymentId.value = null

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to mark selected dentist payments as paid.'
      return false
    }

    const updatedCount = Number(result.data?.updatedCount || dentalIds.length)
    successMessage.value = `Dentist payment was marked paid for ${updatedCount} availment${
      updatedCount === 1 ? '' : 's'
    }.`
    await fetchHistory()
    if (lastBillingLookupParams.value) {
      await fetchBillingLookup(lastBillingLookupParams.value, { remember: false })
    }
    return true
  }

  function closeApprovalDetails() {
    selectedApproval.value = null
    lookupErrorMessage.value = ''
  }

  watch(currentPage, () => {
    void fetchHistory()
  })

  onMounted(() => {
    void fetchHistory()
  })

  return {
    clearFilters,
    cancelAvailment,
    cancellingId,
    closeApprovalDetails,
    currentPage,
    errorMessage,
    fetchHistory,
    fetchBillingLookup,
    filters,
    applyFilters,
    clearBillingLookup,
    loading,
    loadingBillingLookup,
    lookingUp,
    billingLookupErrorMessage,
    billingLookupRecords,
    lookupErrorMessage,
    openApprovalDetails,
    records,
    selectedApproval,
    stats,
    successMessage,
    totalEntries,
    totalPages,
    uncancelAvailment,
    uncancellingId,
    paidRows,
    unpaidRows,
    unpaidAmount,
    totalAmount,
    updateAvailment,
    updateDoctorBillingReceivedAt,
    updateDoctorBillingReceivedAtBulk,
    updateDoctorPaymentStatusBulk,
    updateDoctorPaymentStatus,
    updatingPaymentId,
    updatingId,
  }
}
