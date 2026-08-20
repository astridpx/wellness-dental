import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Dentist, DentistFormData, DentistFormErrorContext } from '@/types'
import { useDentists } from './useDentists'
import { useWellnessApi } from './useWellnessApi'

const emptyDentistData: DentistFormData = {
  license: '',
  firstname: '',
  lastname: '',
  middleInitial: '',
  email: '',
  phone: '',
  specialty: '',
  dentistCode: '',
  modeOfPayment: '',
  agent: '',
  remarks: '',
  TWLB: '',
  OP: '',
  STE: '',
  TF: '',
  AD: '',
  RJ: '',
  LC: '',
  PF: '',
  CON: '',
  ppeIcf: '',
  can: '',
  status: 'Active',
}

const procedureFeeFields = [
  ['TWLB', 'TWLB'],
  ['OP', 'OP'],
  ['STE', 'STE'],
  ['TF', 'TF'],
  ['AD', 'AD'],
  ['RJ', 'RJ'],
  ['LC', 'LC'],
  ['PF', 'PF'],
  ['CON', 'CON'],
  ['ppeIcf', 'PPE / ICF'],
  ['can', 'CAN'],
] as const

const procedureFeePattern = /^\d+(?:\.\d{2})?$/

function toFormValue(value: string | number | null | undefined) {
  return value == null ? '' : String(value)
}

function toNumber(value: string) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function useDentistForm() {
  const route = useRoute()
  const router = useRouter()
  const { request } = useWellnessApi()
  const { dentists, errorMessage, fetchDentists, filters, loading } = useDentists({
    immediate: false,
  })

  const dentistData = ref<DentistFormData>({ ...emptyDentistData })
  const loadedDentist = ref<Dentist | null>(null)
  const saving = ref(false)
  const successMessage = ref('')
  const errorContext = ref<DentistFormErrorContext>('')

  const isEditMode = computed(() => Boolean(route.params.id))
  const profileMissing = computed(
    () => isEditMode.value && !loading.value && loadedDentist.value === null,
  )

  function mapDentistToForm(dentist: Dentist): DentistFormData {
    return {
      license: dentist.prcno || '',
      firstname: dentist.firstname || '',
      lastname: dentist.lastname || '',
      middleInitial: dentist.middleinitial || '',
      email: dentist.email || '',
      phone: dentist.contactno || '',
      specialty: dentist.specialization || '',
      dentistCode: dentist.dentistcode || '',
      modeOfPayment: dentist.modeofpayment || '',
      agent: dentist.agent || '',
      remarks: dentist.remarks || '',
      TWLB: toFormValue(dentist.TWLB),
      OP: toFormValue(dentist.OP),
      STE: toFormValue(dentist.STE),
      TF: toFormValue(dentist.TF),
      AD: toFormValue(dentist.AD),
      RJ: toFormValue(dentist.RJ),
      LC: toFormValue(dentist.LC),
      PF: toFormValue(dentist.PF),
      CON: toFormValue(dentist.CON),
      ppeIcf: toFormValue(dentist.PPE_ICF),
      can: toFormValue(dentist.CAN),
      status:
        dentist.Isactive === '1' ? 'Active' : dentist.Isactive === '0' ? 'Inactive' : 'Unknown',
    }
  }

  async function loadDentistProfile() {
    const dentistId = String(route.params.id || '')
    successMessage.value = ''
    errorContext.value = ''
    loadedDentist.value = null
    dentists.value = []

    if (!dentistId) {
      filters.dentistId = ''
      dentistData.value = { ...emptyDentistData }
      errorMessage.value = ''
      return
    }

    filters.dentistId = dentistId
    await fetchDentists()

    if (errorMessage.value) {
      errorContext.value = 'load'
      return
    }

    const dentist = dentists.value[0]
    if (!dentist) {
      errorContext.value = 'load'
      return
    }

    loadedDentist.value = dentist
    dentistData.value = mapDentistToForm(dentist)
  }

  function validateForm() {
    if (!dentistData.value.firstname.trim()) return 'First name is required.'
    if (!dentistData.value.lastname.trim()) return 'Last name is required.'
    if (!dentistData.value.license.trim()) return 'PRC license number is required.'

    for (const [field, label] of procedureFeeFields) {
      const value = dentistData.value[field].trim()
      if (value && !procedureFeePattern.test(value)) {
        return `${label} must be a whole number or use two decimal places (for example, 100 or 100.00).`
      }
    }

    return ''
  }

  function buildPayload() {
    const current = loadedDentist.value

    return {
      lastname: dentistData.value.lastname.trim(),
      firstname: dentistData.value.firstname.trim(),
      middleinitial: dentistData.value.middleInitial.trim(),
      specialization: dentistData.value.specialty.trim(),
      prcno: dentistData.value.license.trim(),
      TWLB: dentistData.value.TWLB.trim(),
      OP: dentistData.value.OP.trim(),
      STE: dentistData.value.STE.trim(),
      TF: dentistData.value.TF.trim(),
      AD: dentistData.value.AD.trim(),
      RJ: dentistData.value.RJ.trim(),
      LC: dentistData.value.LC.trim(),
      PF: dentistData.value.PF.trim(),
      CON: dentistData.value.CON.trim(),
      contactno: dentistData.value.phone.trim(),
      email: dentistData.value.email.trim(),
      modeofpayment: dentistData.value.modeOfPayment.trim(),
      remarks: dentistData.value.remarks.trim() || null,
      agent: dentistData.value.agent.trim(),
      Isactive:
        dentistData.value.status === 'Active'
          ? '1'
          : dentistData.value.status === 'Inactive'
            ? '0'
            : current?.Isactive || '',
      PPE_ICF: toNumber(dentistData.value.ppeIcf),
      CAN: toNumber(dentistData.value.can),
      dentistcode: dentistData.value.dentistCode.trim(),
    }
  }

  async function save() {
    if (saving.value) return false

    errorMessage.value = ''
    successMessage.value = ''
    errorContext.value = ''

    const validationError = validateForm()
    if (validationError) {
      errorMessage.value = validationError
      errorContext.value = 'validation'
      return false
    }

    saving.value = true

    const result = await request<Dentist>(
      isEditMode.value ? `/wellness/dentists/${route.params.id}` : '/wellness/dentists',
      {
        method: isEditMode.value ? 'PUT' : 'POST',
        body: JSON.stringify(buildPayload()),
      },
      { includeContentType: true },
    )

    saving.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to save dentist profile.'
      errorContext.value = 'save'
      return false
    }

    successMessage.value = isEditMode.value
      ? 'Dentist profile updated successfully.'
      : 'Dentist profile created successfully.'
    if (isEditMode.value) await fetchDentists()
    else dentistData.value = { ...emptyDentistData }
    return true
  }

  function clearError() {
    errorMessage.value = ''
    errorContext.value = ''
  }

  function goBackToList() {
    void router.push('/dentists')
  }

  watch(
    () => route.params.id,
    () => void loadDentistProfile(),
    { immediate: true },
  )

  return {
    clearError,
    dentistData,
    errorContext,
    errorMessage,
    goBackToList,
    isEditMode,
    loadDentistProfile,
    loading,
    profileMissing,
    save,
    saving,
    successMessage,
  }
}
