import { onMounted, reactive, ref, watch } from 'vue'
import { useWellnessApi } from './useWellnessApi'

export type Dentist = {
  dentistidno: number
  lastname: string
  firstname: string
  middleinitial: string
  specialization: string
  prcno: string
  TWLB: string
  OP: string
  STE: string
  TF: string
  AD: string
  RJ: string
  LC: string
  PF: string
  CON: string
  contactno: string
  email: string
  modeofpayment: string
  bankacct: string
  acctname: string
  remarks: string | null
  agent: string
  dentistname: string
  date_added: string
  addedby: string
  Isactive: string
  PPE_ICF: number
  CAN: number
  dentistcode: string
}

type UseDentistsOptions = {
  immediate?: boolean
}

export function useDentists(options: UseDentistsOptions = {}) {
  const { request } = useWellnessApi()
  const immediate = options.immediate ?? true

  const dentists = ref<Dentist[]>([])
  const loading = ref(immediate)
  const errorMessage = ref('')
  const currentPage = ref(1)
  const perPage = ref(10)
  const totalEntries = ref(0)
  const totalPages = ref(1)
  const filters = reactive({
    dentistId: '',
    name: '',
    email: '',
    prcno: '',
    code: '',
  })

  async function fetchDentists() {
    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: String(perPage.value),
    })

    if (filters.dentistId) params.set('dentistIdNo', filters.dentistId)
    if (filters.name) params.set('dentistName', filters.name)
    if (filters.email) params.set('email', filters.email)
    if (filters.prcno) params.set('prcno', filters.prcno)
    if (filters.code) params.set('dentistCode', filters.code)

    const result = await request<Dentist[] | Dentist>(`/wellness/dentists?${params.toString()}`)

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load dentists.'
      loading.value = false
      return
    }

    dentists.value = Array.isArray(result.data) ? result.data : result.data ? [result.data] : []

    const metadataTotalEntries = Number(result.metadata?.totalEntries)
    const metadataTotalPages = Number(result.metadata?.totalPages)

    totalEntries.value = Number.isFinite(metadataTotalEntries)
      ? metadataTotalEntries
      : dentists.value.length
    totalPages.value = Number.isFinite(metadataTotalPages)
      ? Math.max(1, metadataTotalPages)
      : Math.max(1, Math.ceil(totalEntries.value / perPage.value))
    loading.value = false
  }

  function applyFilters() {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }

    void fetchDentists()
  }

  onMounted(() => {
    if (immediate) void fetchDentists()
  })

  watch(currentPage, () => {
    void fetchDentists()
  })

  return {
    errorMessage,
    fetchDentists,
    loading,
    dentists,
    applyFilters,
    filters,
    currentPage,
    totalEntries,
    totalPages,
  }
}
