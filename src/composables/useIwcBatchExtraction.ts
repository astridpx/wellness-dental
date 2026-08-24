import { computed, onMounted, ref, watch } from 'vue'
import type {
  PartnerMemberBatch,
  PartnerMemberBatchSummary,
  PartnerMemberRecord,
  PartnerRecordPaginationMetadata,
  SortablePaginationMetadata,
} from '@/types'
import { useWellnessApi } from './useWellnessApi'

export function useIwcBatchExtraction() {
  const { request } = useWellnessApi()

  const loadingBatchOptions = ref(false)
  const loadingSummary = ref(false)
  const loadingRecords = ref(false)
  const errorMessage = ref('')
  const batchCode = ref('')
  const batchOptions = ref<PartnerMemberBatch[]>([])
  const summary = ref<PartnerMemberBatchSummary | null>(null)
  const records = ref<PartnerMemberRecord[]>([])
  const currentPage = ref(1)
  const totalEntries = ref(0)
  const totalPages = ref(1)

  const canExtract = computed(() => Boolean(batchCode.value.trim()))
  const hasSummary = computed(() => Boolean(summary.value))

  async function fetchBatchOptions() {
    loadingBatchOptions.value = true

    const params = new URLSearchParams({
      page: '1',
      perPage: '200',
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
      companyCode: 'IWC',
    })

    const result = await request<PartnerMemberBatch[]>(
      `/wellness/partnerMembers/batches?${params.toString()}`,
    )

    loadingBatchOptions.value = false

    if (!result.ok) {
      batchOptions.value = []
      errorMessage.value = result.error || 'Unable to load available IWC batch codes.'
      return false
    }

    batchOptions.value = (result.data || []).slice().sort((left, right) => {
      const leftTime = new Date(left.uploadedAt).getTime()
      const rightTime = new Date(right.uploadedAt).getTime()
      return rightTime - leftTime
    })

    const metadata = (result.metadata || {}) as SortablePaginationMetadata
    const totalAvailable = Number(metadata.totalEntries || batchOptions.value.length)

    if (!batchCode.value && batchOptions.value.length) {
      batchCode.value = batchOptions.value[0]?.batchCode || ''
    }

    if (totalAvailable > batchOptions.value.length) {
      errorMessage.value = `Showing the most recent ${batchOptions.value.length} IWC batches in the dropdown.`
    }

    return true
  }

  async function fetchBatchSummary() {
    if (!canExtract.value) {
      errorMessage.value = 'Enter a batch code to extract imported totals.'
      return false
    }

    loadingSummary.value = true
    errorMessage.value = ''
    summary.value = null
    records.value = []
    totalEntries.value = 0
    totalPages.value = 1

    const params = new URLSearchParams({
      batchCode: batchCode.value.trim(),
    })

    const result = await request<PartnerMemberBatchSummary>(
      `/wellness/partnerMembers/batches/summary?${params.toString()}`,
    )

    loadingSummary.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load partner member batch summary.'
      return false
    }

    summary.value = result.data || null
    currentPage.value = 1
    await fetchBatchRecords()
    return true
  }

  async function fetchBatchRecords() {
    if (!summary.value?.id) return

    loadingRecords.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      batchId: String(summary.value.id),
      page: String(currentPage.value),
      perPage: '25',
      sortBy: 'fullName',
      sortOrder: 'asc',
    })

    const result = await request<PartnerMemberRecord[]>(
      `/wellness/partnerMembers/records?${params.toString()}`,
    )

    loadingRecords.value = false

    if (!result.ok) {
      records.value = []
      totalEntries.value = 0
      totalPages.value = 1
      errorMessage.value = result.error || 'Unable to load partner member rows for this batch.'
      return false
    }

    records.value = result.data || []

    const metadata = (result.metadata || {}) as PartnerRecordPaginationMetadata
    totalEntries.value = Number(metadata.totalEntries || 0)
    totalPages.value = Number(metadata.totalPages || 1)
    return true
  }

  async function exportBatchRows() {
    if (!summary.value?.id) return []

    const params = new URLSearchParams({
      batchId: String(summary.value.id),
      page: '1',
      perPage: String(Math.max(summary.value.importedRows || summary.value.totalRows || 1, 1)),
      sortBy: 'fullName',
      sortOrder: 'asc',
    })

    const result = await request<PartnerMemberRecord[]>(
      `/wellness/partnerMembers/records?${params.toString()}`,
    )

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to export partner member rows.'
      return []
    }

    return result.data || []
  }

  function clearExtraction() {
    errorMessage.value = ''
    summary.value = null
    records.value = []
    currentPage.value = 1
    totalEntries.value = 0
    totalPages.value = 1
  }

  watch(currentPage, () => {
    if (!summary.value) return
    void fetchBatchRecords()
  })

  onMounted(() => {
    void fetchBatchOptions()
  })

  return {
    loadingBatchOptions,
    loadingSummary,
    loadingRecords,
    errorMessage,
    batchCode,
    batchOptions,
    summary,
    records,
    currentPage,
    totalEntries,
    totalPages,
    canExtract,
    hasSummary,
    fetchBatchOptions,
    fetchBatchSummary,
    fetchBatchRecords,
    exportBatchRows,
    clearExtraction,
  }
}
