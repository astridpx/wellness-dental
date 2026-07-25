import { onMounted, ref } from 'vue'
import { useWellnessApi } from './useWellnessApi'

type ProcedureResponse = {
  id: number
  name: string
  procedureCode: string
  description: string | null
  monthInterval: number
  quantity: number
  defaultPrice: number | null
  isActive: boolean
}

export type ProcedureOption = {
  id: number
  category: 'Procedures'
  name: string
  code: string
  description: string
  price?: number
  active: boolean
  monthInterval: number
  quantity: number
}

type SaveProcedureInput = {
  id?: number | null
  name: string
  procedureCode: string
  description: string
  monthInterval: number
  quantity: number
  defaultPrice: number | null
  active: boolean
}

export function useProcedures () {
  const { request } = useWellnessApi()

  const procedures = ref<ProcedureOption[]>([])
  const loadingProcedures = ref(false)
  const savingProcedure = ref(false)
  const errorMessage = ref('')

  function mapProcedureToOption (procedure: ProcedureResponse): ProcedureOption {
    return {
      id: procedure.id,
      category: 'Procedures',
      name: procedure.name,
      code: procedure.procedureCode,
      description: procedure.description || 'No description provided.',
      price:
        procedure.defaultPrice === null || procedure.defaultPrice === undefined
          ? undefined
          : Number(procedure.defaultPrice),
      active: Boolean(procedure.isActive),
      monthInterval: Number(procedure.monthInterval) || 1,
      quantity: Number(procedure.quantity) || 1
    }
  }

  async function fetchProcedures () {
    loadingProcedures.value = true
    errorMessage.value = ''

    const result = await request<ProcedureResponse[]>('/wellness/procedures?perPage=100')

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load procedures.'
      loadingProcedures.value = false
      return false
    }

    procedures.value = (Array.isArray(result.data) ? result.data : []).map(mapProcedureToOption)
    loadingProcedures.value = false
    return true
  }

  async function saveProcedure (payload: SaveProcedureInput) {
    savingProcedure.value = true
    errorMessage.value = ''

    const result = await request(
      payload.id ? `/wellness/procedures/${payload.id}` : '/wellness/procedures',
      {
        method: payload.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: payload.name,
          procedureCode: payload.procedureCode,
          description: payload.description,
          monthInterval: payload.monthInterval,
          quantity: payload.quantity,
          defaultPrice: payload.defaultPrice,
          isActive: payload.active
        })
      },
      { includeContentType: true }
    )

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to save procedure.'
      savingProcedure.value = false
      return false
    }

    await fetchProcedures()
    savingProcedure.value = false
    return true
  }

  async function toggleProcedure (option: ProcedureOption) {
    errorMessage.value = ''

    const result = await request(
      `/wellness/procedures/${option.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: option.name,
          procedureCode: option.code,
          description: option.description,
          monthInterval: option.monthInterval,
          quantity: option.quantity,
          defaultPrice: option.price ?? null,
          isActive: !option.active
        })
      },
      { includeContentType: true }
    )

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to update procedure status.'
      return false
    }

    await fetchProcedures()
    return true
  }

  async function deleteProcedure (option: ProcedureOption) {
    errorMessage.value = ''

    const result = await request(`/wellness/procedures/${option.id}`, {
      method: 'DELETE'
    })

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to delete procedure.'
      return false
    }

    await fetchProcedures()
    return true
  }

  function clearProcedureError () {
    errorMessage.value = ''
  }

  onMounted(() => {
    void fetchProcedures()
  })

  return {
    clearProcedureError,
    errorMessage,
    fetchProcedures,
    loadingProcedures,
    procedures,
    saveProcedure,
    savingProcedure,
    deleteProcedure,
    toggleProcedure
  }
}
