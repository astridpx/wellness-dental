import { computed, onMounted, reactive, ref, watch } from 'vue'
import type {
  ImportedPartnerMember,
  ImportedPartnerMemberPaginationMetadata,
  ImportedPartnerMemberPaymentRecord,
  PaginationMetadata,
} from '@/types'
import { useWellnessApi } from './useWellnessApi'

export function useImportedPartnerMembers() {
  const { request } = useWellnessApi()

  const members = ref<ImportedPartnerMember[]>([])
  const paymentRecords = ref<ImportedPartnerMemberPaymentRecord[]>([])
  const selectedMember = ref<ImportedPartnerMember | null>(null)

  const loadingMembers = ref(true)
  const loadingPayments = ref(false)
  const showPaymentsModal = ref(false)

  const errorMessage = ref('')
  const paymentErrorMessage = ref('')

  const currentPage = ref(1)
  const totalEntries = ref(0)
  const totalPages = ref(1)
  const paidMembers = ref(0)
  const unpaidMembers = ref(0)

  const paymentCurrentPage = ref(1)
  const paymentTotalEntries = ref(0)
  const paymentTotalPages = ref(1)

  const filters = reactive({
    search: '',
    companyCode: '',
    companyName: '',
    paid: '',
  })

  const stats = computed(() => ({
    totalVisibleMembers: totalEntries.value,
    paidMembers: paidMembers.value,
    unpaidMembers: unpaidMembers.value,
  }))

  async function fetchMembers() {
    loadingMembers.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: '10',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })

    if (filters.search.trim()) params.set('search', filters.search.trim())
    if (filters.companyCode.trim()) params.set('companyCode', filters.companyCode.trim())
    if (filters.companyName.trim()) params.set('companyName', filters.companyName.trim())
    if (filters.paid.trim()) params.set('paid', filters.paid.trim())

    const result = await request<ImportedPartnerMember[]>(
      `/wellness/partnerMembers/importedMembers?${params.toString()}`,
    )

    loadingMembers.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load imported partner members.'
      members.value = []
      totalEntries.value = 0
      totalPages.value = 1
      paidMembers.value = 0
      unpaidMembers.value = 0
      return
    }

    const metadata = (result.metadata || {}) as ImportedPartnerMemberPaginationMetadata
    members.value = result.data || []
    totalEntries.value = Number(metadata.totalEntries || 0)
    totalPages.value = Number(metadata.totalPages || 1)
    paidMembers.value = Number(metadata.paidMembers || 0)
    unpaidMembers.value = Number(metadata.unpaidMembers || 0)
  }

  async function fetchPaymentRecords() {
    if (!selectedMember.value?.memberId) return

    loadingPayments.value = true
    paymentErrorMessage.value = ''

    const params = new URLSearchParams({
      page: String(paymentCurrentPage.value),
      perPage: '10',
    })

    const result = await request<ImportedPartnerMemberPaymentRecord[]>(
      `/wellness/partnerMembers/importedMembers/${selectedMember.value.memberId}/payments?${params.toString()}`,
    )

    loadingPayments.value = false

    if (!result.ok) {
      paymentErrorMessage.value = result.error || 'Unable to load imported member payment history.'
      paymentRecords.value = []
      paymentTotalEntries.value = 0
      paymentTotalPages.value = 1
      return
    }

    const metadata = (result.metadata || {}) as PaginationMetadata
    paymentRecords.value = result.data || []
    paymentTotalEntries.value = Number(metadata.totalEntries || 0)
    paymentTotalPages.value = Number(metadata.totalPages || 1)
  }

  function applyFilters() {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }

    void fetchMembers()
  }

  function clearFilters() {
    filters.search = ''
    filters.companyCode = ''
    filters.companyName = ''
    filters.paid = ''
    applyFilters()
  }

  function openPaymentsModal(member: ImportedPartnerMember) {
    selectedMember.value = member
    showPaymentsModal.value = true
    paymentCurrentPage.value = 1
    paymentRecords.value = []
    void fetchPaymentRecords()
  }

  function closePaymentsModal() {
    showPaymentsModal.value = false
    selectedMember.value = null
    paymentRecords.value = []
    paymentErrorMessage.value = ''
    paymentCurrentPage.value = 1
    paymentTotalEntries.value = 0
    paymentTotalPages.value = 1
  }

  watch(currentPage, () => {
    void fetchMembers()
  })

  watch(paymentCurrentPage, () => {
    if (!showPaymentsModal.value) return
    void fetchPaymentRecords()
  })

  onMounted(() => {
    void fetchMembers()
  })

  return {
    members,
    paymentRecords,
    selectedMember,
    loadingMembers,
    loadingPayments,
    showPaymentsModal,
    errorMessage,
    paymentErrorMessage,
    currentPage,
    totalEntries,
    totalPages,
    paymentCurrentPage,
    paymentTotalEntries,
    paymentTotalPages,
    filters,
    stats,
    fetchMembers,
    applyFilters,
    clearFilters,
    openPaymentsModal,
    closePaymentsModal,
  }
}
