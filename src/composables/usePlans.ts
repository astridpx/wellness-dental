import { onMounted, reactive, ref, watch } from 'vue'
import { APP_PER_PAGE } from '@/constants/app'
import type { DentalPlan } from '@/types'
import { useWellnessApi } from './useWellnessApi'
import qs from 'qs'

export function usePlans() {
  const { request } = useWellnessApi()

  const plans = ref<DentalPlan[]>([])
  const loading = ref(true)
  const errorMessage = ref('')
  const currentPage = ref(1)
  const perPage = ref(APP_PER_PAGE)
  const totalEntries = ref(0)
  const totalPages = ref(1)
  const filters = reactive({
    plantypeId: '',
    plancode: '',
    dentalPremium: '',
    planClass: '',
  })

  async function fetchPlans() {
    loading.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: String(perPage.value),
    })


    if (filters.plantypeId) params.set('planTypeID', filters.plantypeId)
    if (filters.plancode) params.set('planCode', filters.plancode)
    if (filters.dentalPremium) params.set('dentalPremium', filters.dentalPremium)
    if (filters.planClass) params.set('planClass', filters.planClass)

    const result = await request<DentalPlan[] | DentalPlan>(`/wellness/plans?${params.toString()}`)

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load plans.'
      loading.value = false
      return
    }

    plans.value = Array.isArray(result.data) ? result.data : []
    totalEntries.value = Number(result.metadata?.totalEntries || 0)
    totalPages.value = Number(result.metadata?.totalPages || 1)
    loading.value = false
  }

  function applyFilters() {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }

    void fetchPlans()
  }

  onMounted(() => {
    void fetchPlans()
  })

  watch(currentPage, () => {
    void fetchPlans()
  })

  return {
    errorMessage,
    fetchPlans,
    loading,
    plans,
    applyFilters,
    filters,
    currentPage,
    totalEntries,
    totalPages,
  }
}
