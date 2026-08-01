import { onMounted, ref } from 'vue'
import { useWellnessApi } from './useWellnessApi'

type BusinessPartnerResponse = {
  id: number
  name: string
  code: string
  description: string | null
  isActive: boolean
}

export type BusinessPartnerOption = {
  id: number
  name: string
  code: string
  description: string
  active: boolean
}

type SaveBusinessPartnerInput = {
  id?: number | null
  name: string
  code: string
  description: string
  active: boolean
}

export function useBusinessPartners () {
  const { request } = useWellnessApi()

  const businessPartners = ref<BusinessPartnerOption[]>([])
  const loadingBusinessPartners = ref(false)
  const savingBusinessPartner = ref(false)
  const updatingBusinessPartnerId = ref<number | null>(null)
  const errorMessage = ref('')

  function mapBusinessPartner (partner: BusinessPartnerResponse): BusinessPartnerOption {
    return {
      id: partner.id,
      name: partner.name,
      code: partner.code,
      description: partner.description || 'No description provided.',
      active: Boolean(partner.isActive)
    }
  }

  async function fetchBusinessPartners () {
    loadingBusinessPartners.value = true
    errorMessage.value = ''

    const result = await request<BusinessPartnerResponse[]>('/wellness/businessPartners?perPage=100')

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load business partners.'
      loadingBusinessPartners.value = false
      return false
    }

    businessPartners.value = (Array.isArray(result.data) ? result.data : [])
      .map(mapBusinessPartner)
      .sort((a, b) => a.name.localeCompare(b.name))
    loadingBusinessPartners.value = false
    return true
  }

  async function saveBusinessPartner (payload: SaveBusinessPartnerInput) {
    savingBusinessPartner.value = true
    errorMessage.value = ''

    const result = await request(
      payload.id ? `/wellness/businessPartners/${payload.id}` : '/wellness/businessPartners',
      {
        method: payload.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: payload.name,
          code: payload.code,
          description: payload.description,
          isActive: payload.active
        })
      },
      { includeContentType: true }
    )

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to save business partner.'
      savingBusinessPartner.value = false
      return false
    }

    await fetchBusinessPartners()
    savingBusinessPartner.value = false
    return true
  }

  async function toggleBusinessPartner (partner: BusinessPartnerOption) {
    errorMessage.value = ''
    updatingBusinessPartnerId.value = partner.id

    const result = await request(
      `/wellness/businessPartners/${partner.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: partner.name,
          code: partner.code,
          description: partner.description,
          isActive: !partner.active
        })
      },
      { includeContentType: true }
    )

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to update business partner status.'
      updatingBusinessPartnerId.value = null
      return false
    }

    try {
      await fetchBusinessPartners()
    } finally {
      updatingBusinessPartnerId.value = null
    }
    return true
  }

  function clearBusinessPartnerError () {
    errorMessage.value = ''
  }

  onMounted(() => {
    void fetchBusinessPartners()
  })

  return {
    businessPartners,
    clearBusinessPartnerError,
    errorMessage,
    fetchBusinessPartners,
    loadingBusinessPartners,
    saveBusinessPartner,
    savingBusinessPartner,
    toggleBusinessPartner,
    updatingBusinessPartnerId
  }
}
