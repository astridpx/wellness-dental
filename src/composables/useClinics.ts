import { onMounted, reactive, ref, watch } from 'vue'
import { APP_PER_PAGE } from '@/constants/app'
import type { Clinic } from '@/types'
import { useWellnessApi } from './useWellnessApi'

export const CLINICS_ENDPOINT = '/wellness/clinics'

type UseClinicsOptions = {
  immediate?: boolean
}

export function useClinics(options: UseClinicsOptions = {}) {
  const { request } = useWellnessApi()
  const immediate = options.immediate ?? true

  const clinics = ref<Clinic[]>([])
  const loading = ref(immediate)
  const errorMessage = ref('')
  const currentPage = ref(1)
  const perPage = ref(APP_PER_PAGE)
  const totalEntries = ref(0)
  const totalPages = ref(1)
  const filters = reactive({
    clinicIdNo: '',
    clinicName: '',
    clinicCode: '',
  })

  async function fetchClinics() {
    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: String(perPage.value),
    })

    if (filters.clinicIdNo) params.set('clinicIdNo', filters.clinicIdNo)
    if (filters.clinicName) params.set('clinicName', filters.clinicName)
    if (filters.clinicCode) params.set('clinicCode', filters.clinicCode)

    const result = await request<Clinic[] | Clinic>(`${CLINICS_ENDPOINT}?${params.toString()}`)

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load clinics.'
      loading.value = false
      return
    }

    clinics.value = Array.isArray(result.data) ? result.data : result.data ? [result.data] : []

    const metadataTotalEntries = Number(result.metadata?.totalEntries)
    const metadataTotalPages = Number(result.metadata?.totalPages)

    totalEntries.value = Number.isFinite(metadataTotalEntries)
      ? metadataTotalEntries
      : clinics.value.length
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

    void fetchClinics()
  }

  onMounted(() => {
    if (immediate) void fetchClinics()
  })

  watch(currentPage, () => {
    void fetchClinics()
  })

  return {
    errorMessage,
    fetchClinics,
    loading,
    clinics,
    applyFilters,
    filters,
    currentPage,
    totalEntries,
    totalPages,
  }
}
