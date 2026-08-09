import { computed, onMounted, reactive, ref, watch } from 'vue'
import type {
  MembershipPaginationMetadata,
  MembershipPaymentRecord,
  MembershipRecord,
  PaginationMetadata,
} from '@/types'
import { useWellnessApi } from './useWellnessApi'

export function useMembershipDetails() {
  const { request } = useWellnessApi()

  const members = ref<MembershipRecord[]>([])
  const paymentRecords = ref<MembershipPaymentRecord[]>([])
  const selectedMember = ref<MembershipRecord | null>(null)

  const loadingMembers = ref(true)
  const loadingPayments = ref(false)
  const showPaymentsModal = ref(false)

  const errorMessage = ref('')
  const paymentErrorMessage = ref('')

  const currentPage = ref(1)
  const totalEntries = ref(0)
  const totalPages = ref(1)
  const remittedMembers = ref(0)
  const unremittedMembers = ref(0)

  const paymentCurrentPage = ref(1)
  const paymentTotalEntries = ref(0)
  const paymentTotalPages = ref(1)

  const filters = reactive({
    search: '',
    memberName: '',
    company: '',
    planCode: '',
    status: '',
  })

  const stats = computed(() => ({
    totalVisibleMembers: totalEntries.value,
    unremittedMembers: unremittedMembers.value,
    remittedMembers: remittedMembers.value,
  }))

  async function fetchMembers() {
    loadingMembers.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: '10',
      sortBy: 'planholderId',
      sortOrder: 'desc',
    })

    if (filters.search.trim()) params.set('search', filters.search.trim())
    if (filters.memberName.trim()) params.set('memberName', filters.memberName.trim())
    if (filters.company.trim()) params.set('company', filters.company.trim())
    if (filters.planCode.trim()) params.set('planCode', filters.planCode.trim())
    if (filters.status.trim()) params.set('status', filters.status.trim())

    const result = await request<MembershipRecord[]>(
      `/wellness/membershipDetails?${params.toString()}`,
    )

    loadingMembers.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load membership details.'
      members.value = []
      totalEntries.value = 0
      totalPages.value = 1
      remittedMembers.value = 0
      unremittedMembers.value = 0
      return
    }

    const metadata = (result.metadata || {}) as MembershipPaginationMetadata
    members.value = result.data || []
    totalEntries.value = Number(metadata.totalEntries || 0)
    totalPages.value = Number(metadata.totalPages || 1)
    remittedMembers.value = Number(metadata.remittedMembers || 0)
    unremittedMembers.value = Number(metadata.unremittedMembers || 0)
  }

  async function fetchPaymentRecords() {
    if (!selectedMember.value?.planholderId) return

    loadingPayments.value = true
    paymentErrorMessage.value = ''

    const paymentGroupId =
      selectedMember.value.mainPlanholderId || selectedMember.value.planholderId
    const params = new URLSearchParams({
      page: String(paymentCurrentPage.value),
      perPage: '10',
      sortBy: 'paymentCollectionId',
      sortOrder: 'desc',
      mainPlanholderId: paymentGroupId,
    })

    const result = await request<MembershipPaymentRecord[]>(
      `/wellness/membershipDetails/payments?${params.toString()}`,
    )

    loadingPayments.value = false

    if (!result.ok) {
      paymentErrorMessage.value = result.error || 'Unable to load payment details.'
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
    filters.memberName = ''
    filters.company = ''
    filters.planCode = ''
    filters.status = ''
    applyFilters()
  }

  function openPaymentsModal(member: MembershipRecord) {
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
