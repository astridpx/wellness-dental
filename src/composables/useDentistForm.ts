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
  bankAccount: '',
  accountName: '',
  agent: '',
  remarks: '',
  status: 'Active',
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
      bankAccount: dentist.bankacct || '',
      accountName: dentist.acctname || '',
      agent: dentist.agent || '',
      remarks: dentist.remarks || '',
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
      TWLB: current?.TWLB || '',
      OP: current?.OP || '',
      STE: current?.STE || '',
      TF: current?.TF || '',
      AD: current?.AD || '',
      RJ: current?.RJ || '',
      LC: current?.LC || '',
      PF: current?.PF || '',
      CON: current?.CON || '',
      contactno: dentistData.value.phone.trim(),
      email: dentistData.value.email.trim(),
      modeofpayment: dentistData.value.modeOfPayment.trim(),
      bankacct: dentistData.value.bankAccount.trim(),
      acctname: dentistData.value.accountName.trim(),
      remarks: dentistData.value.remarks.trim() || null,
      agent: dentistData.value.agent.trim(),
      Isactive:
        dentistData.value.status === 'Active'
          ? '1'
          : dentistData.value.status === 'Inactive'
            ? '0'
            : current?.Isactive || '',
      PPE_ICF: current?.PPE_ICF || 0,
      CAN: current?.CAN || 0,
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
    if (isEditMode.value)
      await fetchDentists()
    else
      dentistData.value = emptyDentistData
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
