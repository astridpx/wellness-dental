import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  useDentalAvailments,
  type DentalAvailmentApproval,
  type DentalAvailmentRecord,
} from './useDentalAvailments'
import { useWellnessApi } from './useWellnessApi'

type PaginationMetadata = {
  page?: number
  perPage?: number
  totalEntries?: number
  totalPages?: number
  paidRows?: number
  unpaidRows?: number
  unpaidAmount?: number
}

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
  const currentPage = ref(1)
  const totalEntries = ref(0)
  const totalPages = ref(1)
  const paidRows = ref(0)
  const unpaidRows = ref(0)
  const unpaidAmount = ref(0)

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
    totalVisible: totalEntries.value,
    totalAmount: records.value.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    validRows: records.value.filter((record) => (record.status || 'VALID') === 'VALID').length,
  }))

  async function fetchHistory() {
    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: '10',
      sortBy: 'availdate',
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
      return
    }

    const metadata = (result.metadata || {}) as PaginationMetadata
    records.value = result.data || []
    totalEntries.value = Number(metadata.totalEntries || 0)
    totalPages.value = Number(metadata.totalPages || 1)
    paidRows.value = Number(metadata.paidRows || 0)
    unpaidRows.value = Number(metadata.unpaidRows || 0)
    unpaidAmount.value = Number(metadata.unpaidAmount || 0)
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

  async function updateDoctorPaymentStatus(record: DentalAvailmentRecord, paid: boolean) {
    updatingPaymentId.value = record.dentalid
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<DentalAvailmentRecord>(
      `/wellness/dentalAvailments/${record.dentalid}/payment`,
      {
        method: 'PATCH',
        body: JSON.stringify({ paid }),
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
    if (selectedApproval.value?.approvalNo === record.approvalno) {
      await openApprovalDetails(record.approvalno)
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
    filters,
    applyFilters,
    loading,
    lookingUp,
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
    updateAvailment,
    updateDoctorPaymentStatus,
    updatingPaymentId,
    updatingId,
  }
}
