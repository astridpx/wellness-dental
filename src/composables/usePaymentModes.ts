import { onMounted, ref } from 'vue'
import type { PaymentModeOption } from '@/types'
import { useWellnessApi } from './useWellnessApi'

type PaymentModeResponse = {
  id: number
  name: string
  code: string
  description: string | null
  isActive: boolean
}

type SavePaymentModeInput = {
  id?: number | null
  name: string
  code: string
  description: string
  active: boolean
}

export function usePaymentModes() {
  const { request } = useWellnessApi()

  const paymentModes = ref<PaymentModeOption[]>([])
  const loadingPaymentModes = ref(false)
  const savingPaymentMode = ref(false)
  const errorMessage = ref('')

  function mapPaymentModeToOption(paymentMode: PaymentModeResponse): PaymentModeOption {
    return {
      id: paymentMode.id,
      category: 'Payment Modes',
      name: paymentMode.name,
      code: paymentMode.code,
      description: paymentMode.description || 'No description provided.',
      active: Boolean(paymentMode.isActive),
    }
  }

  async function fetchPaymentModes() {
    loadingPaymentModes.value = true
    errorMessage.value = ''

    const result = await request<PaymentModeResponse[]>('/wellness/paymentModes?perPage=100')

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load payment modes.'
      loadingPaymentModes.value = false
      return false
    }

    paymentModes.value = (Array.isArray(result.data) ? result.data : []).map(mapPaymentModeToOption)
    loadingPaymentModes.value = false
    return true
  }

  async function savePaymentMode(payload: SavePaymentModeInput) {
    savingPaymentMode.value = true
    errorMessage.value = ''

    const result = await request(
      payload.id ? `/wellness/paymentModes/${payload.id}` : '/wellness/paymentModes',
      {
        method: payload.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: payload.name,
          code: payload.code,
          description: payload.description,
          isActive: payload.active,
        }),
      },
      { includeContentType: true },
    )

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to save payment mode.'
      savingPaymentMode.value = false
      return false
    }

    await fetchPaymentModes()
    savingPaymentMode.value = false
    return true
  }

  async function togglePaymentMode(option: PaymentModeOption) {
    errorMessage.value = ''

    const result = await request(
      `/wellness/paymentModes/${option.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: option.name,
          code: option.code,
          description: option.description,
          isActive: !option.active,
        }),
      },
      { includeContentType: true },
    )

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to update payment mode status.'
      return false
    }

    await fetchPaymentModes()
    return true
  }

  async function deletePaymentMode (option: PaymentModeOption) {
    errorMessage.value = ''

    const result = await request(`/wellness/paymentModes/${option.id}`, {
      method: 'DELETE'
    })

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to delete payment mode.'
      return false
    }

    await fetchPaymentModes()
    return true
  }

  function clearPaymentModeError() {
    errorMessage.value = ''
  }

  onMounted(() => {
    void fetchPaymentModes()
  })

  return {
    clearPaymentModeError,
    errorMessage,
    fetchPaymentModes,
    loadingPaymentModes,
    paymentModes,
    savePaymentMode,
    savingPaymentMode,
    deletePaymentMode,
    togglePaymentMode,
  }
}
