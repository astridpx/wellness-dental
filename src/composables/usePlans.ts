import { onMounted, ref } from 'vue'
import { useWellnessApi } from './useWellnessApi'

export type DentalPlan = {
  PlanTypeID: number
  PlanCode: string
  DentalPrem1: number
}

export function usePlans() {
  const { request } = useWellnessApi()

  const plans = ref<DentalPlan[]>([])
  const loadingPlans = ref(true)
  const errorMessage = ref('')

  async function fetchPlans() {
    loadingPlans.value = true
    errorMessage.value = ''

    const result = await request<DentalPlan[] | DentalPlan>('/wellness/plans')

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load plans.'
      loadingPlans.value = false
      return false
    }

    if (Array.isArray(result.data)) {
      plans.value = result.data
    } else {
      plans.value = result.data ? [result.data] : []
    }

    loadingPlans.value = false
    return true
  }

  onMounted(() => {
    void fetchPlans()
  })

  return {
    errorMessage,
    fetchPlans,
    loadingPlans,
    plans,
  }
}
