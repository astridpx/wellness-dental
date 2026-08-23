import { computed, onMounted, reactive, ref, watch } from 'vue'
import type {
  PartnerMemberBatch,
  PartnerMemberRecord,
  PartnerRecordPaginationMetadata,
  SortablePaginationMetadata,
} from '@/types'
import { useWellnessApi } from './useWellnessApi'

function currentDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export function useBusinessPartnerUploads() {
  const { request } = useWellnessApi()

  const batches = ref<PartnerMemberBatch[]>([])
  const records = ref<PartnerMemberRecord[]>([])
  const selectedBatch = ref<PartnerMemberBatch | null>(null)
  const recordScope = ref<'selected' | 'all'>('selected')

  const loadingBatches = ref(true)
  const loadingRecords = ref(true)
  const uploadingBatch = ref(false)
  const updatingRecordId = ref<number | null>(null)
  const markingPaidBatchId = ref<number | null>(null)

  const batchError = ref('')
  const recordError = ref('')
  const uploadError = ref('')
  const uploadSuccess = ref('')

  const batchCurrentPage = ref(1)
  const batchTotalEntries = ref(0)
  const batchTotalPages = ref(1)

  const recordCurrentPage = ref(1)
  const recordTotalEntries = ref(0)
  const recordTotalPages = ref(1)
  const recordPaidEntries = ref(0)
  const recordUnpaidEntries = ref(0)

  const batchFilters = reactive({
    companyCode: '',
    companyName: '',
  })

  const recordFilters = reactive({
    search: '',
    companyCode: '',
    paid: '',
  })

  const uploadForm = reactive({
    businessPartnerCode: '',
    businessPartnerName: '',
    companyCode: '',
    companyName: '',
    paymentPeriod: '',
    paidAt: currentDateInputValue(),
    sheetName: '',
    remarks: '',
  })

  const batchStats = computed(() => ({
    totalBatches: batchTotalEntries.value,
    activeBatches: batchTotalEntries.value,
    totalMembers: batches.value.reduce((sum, batch) => sum + Number(batch.totalRows || 0), 0),
  }))

  const recordStats = computed(() => ({
    totalMembers: recordTotalEntries.value,
    paidMembers: recordPaidEntries.value,
    unpaidMembers: recordUnpaidEntries.value,
  }))

  async function fetchBatches() {
    loadingBatches.value = true
    batchError.value = ''

    const params = new URLSearchParams({
      page: String(batchCurrentPage.value),
      perPage: '10',
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
    })

    if (batchFilters.companyCode.trim()) params.set('companyCode', batchFilters.companyCode.trim())
    if (batchFilters.companyName.trim()) params.set('companyName', batchFilters.companyName.trim())

    const result = await request<PartnerMemberBatch[]>(
      `/wellness/partnerMembers/batches?${params.toString()}`,
    )

    loadingBatches.value = false

    if (!result.ok) {
      batchError.value = result.error
      batches.value = []
      return
    }

    const metadata = (result.metadata || {}) as SortablePaginationMetadata
    batches.value = result.data || []
    batchTotalEntries.value = Number(metadata.totalEntries || 0)
    batchTotalPages.value = Number(metadata.totalPages || 1)

    if (selectedBatch.value) {
      const refreshedSelectedBatch =
        batches.value.find((batch) => batch.id === selectedBatch.value?.id) || null
      if (refreshedSelectedBatch) selectedBatch.value = refreshedSelectedBatch
    }

    if (!selectedBatch.value && batches.value.length) {
      selectedBatch.value = batches.value[0] || null
    }
  }

  async function fetchRecords() {
    loadingRecords.value = true
    recordError.value = ''

    const params = new URLSearchParams({
      page: String(recordCurrentPage.value),
      perPage: '10',
      sortBy: 'fullName',
      sortOrder: 'asc',
    })

    if (recordScope.value === 'selected' && selectedBatch.value?.id) {
      params.set('batchId', String(selectedBatch.value.id))
    }
    if (recordFilters.search.trim()) params.set('search', recordFilters.search.trim())
    if (recordFilters.companyCode.trim()) {
      params.set('companyCode', recordFilters.companyCode.trim())
    }
    if (recordFilters.paid) params.set('paid', recordFilters.paid)

    const result = await request<PartnerMemberRecord[]>(
      `/wellness/partnerMembers/records?${params.toString()}`,
    )

    loadingRecords.value = false

    if (!result.ok) {
      recordError.value = result.error
      records.value = []
      recordTotalEntries.value = 0
      recordTotalPages.value = 1
      recordPaidEntries.value = 0
      recordUnpaidEntries.value = 0
      return
    }

    const metadata = (result.metadata || {}) as PartnerRecordPaginationMetadata
    records.value = result.data || []
    recordTotalEntries.value = Number(metadata.totalEntries || 0)
    recordTotalPages.value = Number(metadata.totalPages || 1)
    recordPaidEntries.value = Number(metadata.paidRows || 0)
    recordUnpaidEntries.value = Number(metadata.unpaidRows || 0)
  }

  async function uploadBatch(file: File) {
    uploadError.value = ''
    uploadSuccess.value = ''
    uploadingBatch.value = true

    const formData = new FormData()
    formData.append('file', file)
    formData.append('businessPartnerCode', uploadForm.businessPartnerCode.trim())
    formData.append('businessPartnerName', uploadForm.businessPartnerName.trim())
    formData.append('companyCode', uploadForm.companyCode.trim())
    formData.append('companyName', uploadForm.companyName.trim())
    if (uploadForm.paymentPeriod.trim()) formData.append('paymentPeriod', uploadForm.paymentPeriod.trim())
    if (uploadForm.paidAt.trim()) formData.append('paidAt', uploadForm.paidAt.trim())

    if (uploadForm.sheetName.trim()) formData.append('sheetName', uploadForm.sheetName.trim())
    if (uploadForm.remarks.trim()) formData.append('remarks', uploadForm.remarks.trim())

    const result = await request<PartnerMemberBatch>(
      '/wellness/partnerMembers/batches/import',
      {
        method: 'POST',
        body: formData,
      },
      {
        includeContentType: false,
      },
    )

    uploadingBatch.value = false

    if (!result.ok) {
      uploadError.value = result.error
      return false
    }

    uploadSuccess.value = `Member rows imported for ${uploadForm.companyCode.trim() || 'business partner uploads'}.`
    batchCurrentPage.value = 1
    await fetchBatches()
    if (selectedBatch.value) {
      recordCurrentPage.value = 1
      await fetchRecords()
    }

    return true
  }

  async function updatePaymentStatus(
    record: PartnerMemberRecord,
    paid: boolean,
    paymentReference = '',
  ) {
    updatingRecordId.value = record.id
    recordError.value = ''

    const result = await request<PartnerMemberRecord>(
      `/wellness/partnerMembers/records/${record.id}/payment`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          paid,
          paymentReference: paymentReference.trim() || undefined,
        }),
      },
      {
        includeContentType: true,
      },
    )

    updatingRecordId.value = null

    if (!result.ok) {
      recordError.value = result.error
      return false
    }

    await fetchRecords()
    await fetchBatches()
    return true
  }

  async function updateBatchPaymentStatus(
    batch: PartnerMemberBatch,
    paid: boolean,
    paymentReference = '',
  ) {
    markingPaidBatchId.value = batch.id
    batchError.value = ''
    recordError.value = ''

    const result = await request<PartnerMemberBatch>(
      `/wellness/partnerMembers/batches/${batch.id}/payment`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          paid,
          paymentReference: paymentReference.trim() || undefined,
        }),
      },
      {
        includeContentType: true,
      },
    )

    markingPaidBatchId.value = null

    if (!result.ok) {
      const message =
        result.error || `Unable to mark this batch as ${paid ? 'remitted' : 'unremitted'}.`
      batchError.value = message
      recordError.value = message
      return false
    }

    await fetchBatches()
    await fetchRecords()
    return true
  }

  function selectBatch(batch: PartnerMemberBatch) {
    selectedBatch.value = batch
    recordScope.value = 'selected'
    recordCurrentPage.value = 1
    fetchRecords()
  }

  function selectAllBatches() {
    recordScope.value = 'all'
    recordCurrentPage.value = 1
    fetchRecords()
  }

  function resetUploadForm() {
    uploadForm.businessPartnerCode = ''
    uploadForm.businessPartnerName = ''
    uploadForm.companyCode = ''
    uploadForm.companyName = ''
    uploadForm.paymentPeriod = ''
    uploadForm.paidAt = currentDateInputValue()
    uploadForm.sheetName = ''
    uploadForm.remarks = ''
    uploadError.value = ''
    uploadSuccess.value = ''
  }

  watch(
    () => [batchFilters.companyCode, batchFilters.companyName],
    () => {
      batchCurrentPage.value = 1
      fetchBatches()
    },
  )

  watch(batchCurrentPage, () => {
    fetchBatches()
  })

  watch(
    () => [recordFilters.search, recordFilters.companyCode, recordFilters.paid],
    () => {
      recordCurrentPage.value = 1
      fetchRecords()
    },
  )

  watch(recordCurrentPage, () => {
    fetchRecords()
  })

  onMounted(async () => {
    await fetchBatches()
    await fetchRecords()
  })

  return {
    batches,
    records,
    selectedBatch,
    recordScope,
    loadingBatches,
    loadingRecords,
    uploadingBatch,
    updatingRecordId,
    markingPaidBatchId,
    batchError,
    recordError,
    uploadError,
    uploadSuccess,
    batchCurrentPage,
    batchTotalEntries,
    batchTotalPages,
    recordCurrentPage,
    recordTotalEntries,
    recordTotalPages,
    recordPaidEntries,
    recordUnpaidEntries,
    batchFilters,
    recordFilters,
    uploadForm,
    batchStats,
    recordStats,
    fetchBatches,
    fetchRecords,
    uploadBatch,
    updatePaymentStatus,
    updateBatchPaymentStatus,
    selectBatch,
    selectAllBatches,
    resetUploadForm,
  }
}
