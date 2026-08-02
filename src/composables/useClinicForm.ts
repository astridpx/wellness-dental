import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CLINICS_ENDPOINT, useClinics, type Clinic } from './useClinics'
import { useWellnessApi } from './useWellnessApi'

export type ClinicFormData = {
  clinicName: string
  address: string
  city: string
  province: string
  contactNumber: string
  schedule: string
  clinicCode: string
  longitude: string
  latitude: string
  status: 'Active' | 'Inactive' | 'Unknown'
  isAccredited: boolean
  mobileNumber1: string
  mobileNumber2: string
  type: string
  providerApp: string
}

export type ClinicFormErrorContext = '' | 'load' | 'validation' | 'save'

const emptyClinicData: ClinicFormData = {
  clinicName: '',
  address: '',
  city: '',
  province: '',
  contactNumber: '',
  schedule: '',
  clinicCode: '',
  longitude: '',
  latitude: '',
  status: 'Active',
  isAccredited: false,
  mobileNumber1: '',
  mobileNumber2: '',
  type: '',
  providerApp: '',
}

export function useClinicForm() {
  const route = useRoute()
  const router = useRouter()
  const { request } = useWellnessApi()
  const { clinics, errorMessage, fetchClinics, filters, loading } = useClinics({
    immediate: false,
  })

  const clinicData = ref<ClinicFormData>({ ...emptyClinicData })
  const loadedClinic = ref<Clinic | null>(null)
  const saving = ref(false)
  const successMessage = ref('')
  const errorContext = ref<ClinicFormErrorContext>('')

  const isEditMode = computed(() => Boolean(route.params.id))
  const profileMissing = computed(
    () => isEditMode.value && !loading.value && loadedClinic.value === null,
  )

  function mapClinicToForm(clinic: Clinic): ClinicFormData {
    return {
      clinicName: clinic.clinicname || '',
      address: clinic.address || '',
      city: clinic.city || '',
      province: clinic.province || '',
      contactNumber: clinic.contactno || '',
      schedule: clinic.schedule || '',
      clinicCode: clinic.cliniccode || '',
      longitude: clinic.longtitude || '',
      latitude: clinic.latitude || '',
      status:
        Number(clinic.status) === 1
          ? 'Active'
          : Number(clinic.status) === 0
            ? 'Inactive'
            : 'Unknown',
      isAccredited: Number(clinic.iaccredited) === 1,
      mobileNumber1: clinic.MobileNumber1 || '',
      mobileNumber2: clinic.MobileNumber2 || '',
      type: clinic.type || '',
      providerApp: clinic.provider_app || '',
    }
  }

  async function loadClinicProfile() {
    const clinicId = String(route.params.id || '')
    successMessage.value = ''
    errorContext.value = ''
    loadedClinic.value = null
    clinics.value = []

    if (!clinicId) {
      filters.clinicIdNo = ''
      clinicData.value = { ...emptyClinicData }
      errorMessage.value = ''
      return
    }

    filters.clinicIdNo = clinicId
    await fetchClinics()

    if (errorMessage.value) {
      errorContext.value = 'load'
      return
    }

    const clinic = clinics.value[0]
    if (!clinic) {
      errorContext.value = 'load'
      return
    }

    loadedClinic.value = clinic
    clinicData.value = mapClinicToForm(clinic)
  }

  function validateForm() {
    if (!clinicData.value.clinicName.trim()) return 'Clinic name is required.'
    if (!clinicData.value.clinicCode.trim()) return 'Clinic code is required.'
    if (!clinicData.value.address.trim()) return 'Clinic address is required.'
    return ''
  }

  function buildPayload() {
    const current = loadedClinic.value

    return {
      clinicname: clinicData.value.clinicName.trim(),
      address: clinicData.value.address.trim(),
      city: clinicData.value.city.trim(),
      province: clinicData.value.province.trim(),
      contactno: clinicData.value.contactNumber.trim(),
      schedule: clinicData.value.schedule.trim(),
      cliniccode: clinicData.value.clinicCode.trim(),
      longtitude: clinicData.value.longitude.trim(),
      latitude: clinicData.value.latitude.trim(),
      status:
        clinicData.value.status === 'Active'
          ? 1
          : clinicData.value.status === 'Inactive'
            ? 0
            : current?.status || 0,
      iaccredited: clinicData.value.isAccredited ? 1 : 0,
      MobileNumber1: clinicData.value.mobileNumber1.trim(),
      MobileNumber2: clinicData.value.mobileNumber2.trim(),
      type: clinicData.value.type.trim(),
      provider_app: clinicData.value.providerApp.trim(),
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

    const result = await request<Clinic>(
      isEditMode.value ? `${CLINICS_ENDPOINT}/${route.params.id}` : CLINICS_ENDPOINT,
      {
        method: isEditMode.value ? 'PUT' : 'POST',
        body: JSON.stringify(buildPayload()),
      },
      { includeContentType: true },
    )

    saving.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to save clinic profile.'
      errorContext.value = 'save'
      return false
    }

    successMessage.value = isEditMode.value
      ? 'Clinic profile updated successfully.'
      : 'Clinic profile created successfully.'
    if (isEditMode.value) await fetchClinics()
    else clinicData.value = { ...emptyClinicData }
    return true
  }

  function clearError() {
    errorMessage.value = ''
    errorContext.value = ''
  }

  function goBackToList() {
    void router.push('/clinic')
  }

  watch(
    () => route.params.id,
    () => void loadClinicProfile(),
    { immediate: true },
  )

  return {
    clearError,
    clinicData,
    errorContext,
    errorMessage,
    goBackToList,
    isEditMode,
    loadClinicProfile,
    loading,
    profileMissing,
    save,
    saving,
    successMessage,
  }
}
