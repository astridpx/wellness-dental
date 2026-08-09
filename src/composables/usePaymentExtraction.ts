import { computed, reactive, ref } from 'vue'
import { useWellnessApi } from './useWellnessApi'

export type ImsPaymentExtractionRow = {
  no: string
  iwc_accounts: string | null
  ecp_type: string | null
  maincompany: string | null
  umbrellacomp: string | null
  membername: string | null
  origprem: number | string | null
  dentalprem1: number | string | null
  plancode: string | null
  dentalshare: number | string | null
  vat: string
  ar_number: string | null
  or_number: string | null
  posteddate: string | null
  payment_period: string | null
  free: string | null
  planholderid: number | string | null
}

export function usePaymentExtraction() {
  const { request } = useWellnessApi()

  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const rows = ref<ImsPaymentExtractionRow[]>([])
  const form = reactive({
    start: '',
    end: '',
    referenceNo: '',
  })

  const canExtract = computed(
    () => Boolean(form.referenceNo.trim()) || Boolean(form.start && form.end),
  )

  async function extractImsPayments() {
    if (!canExtract.value) {
      errorMessage.value = 'Enter a reference number or a complete date range.'
      return false
    }

    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<ImsPaymentExtractionRow[]>(
      '/wellness/paymentExtraction/ims',
      {
        method: 'POST',
        body: JSON.stringify({
          start: form.start || undefined,
          end: form.end || undefined,
          referenceNo: form.referenceNo.trim() || undefined,
        }),
      },
      { includeContentType: true },
    )

    loading.value = false

    if (!result.ok) {
      rows.value = []
      errorMessage.value = result.error || 'Unable to extract IMS payment rows.'
      return false
    }

    rows.value = result.data || []
    successMessage.value = `${rows.value.length} IMS payment row(s) extracted.`
    return true
  }

  function clearExtraction() {
    form.start = ''
    form.end = ''
    form.referenceNo = ''
    rows.value = []
    errorMessage.value = ''
    successMessage.value = ''
  }

  return {
    canExtract,
    clearExtraction,
    errorMessage,
    extractImsPayments,
    form,
    loading,
    rows,
    successMessage,
  }
}
