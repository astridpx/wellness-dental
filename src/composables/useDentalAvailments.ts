import { reactive, ref } from 'vue'
import type {
  DentalAvailmentApproval,
  DentalAvailmentMemberOption,
  DentalAvailmentRecord,
  DentalProcedureEligibility,
  DentalMemberSearchScope,
  DentalProcedureItemInput,
} from '@/types'
import { useWellnessApi } from './useWellnessApi'

type GeneratedApprovalNoResponse = {
  approvalNo: string
}

export function useDentalAvailments() {
  const { request } = useWellnessApi()

  const creating = ref(false)
  const lookingUp = ref(false)
  const generatingApprovalNo = ref(false)
  const searchingMembers = ref(false)
  const checkingProcedureEligibility = ref(false)
  const errorMessage = ref('')
  const memberSearchErrorMessage = ref('')
  const successMessage = ref('')
  const createdAvailment = ref<DentalAvailmentRecord | null>(null)
  const approvalLookup = ref<DentalAvailmentApproval | null>(null)
  const memberSearchResults = ref<DentalAvailmentMemberOption[]>([])

  const form = reactive({
    approvalNo: '',
    memberName: '',
    availDate: new Date().toISOString().slice(0, 10),
    procedures: '',
    amount: '',
    dentistId: '',
    dentistName: '',
    clinicId: '',
    clinicName: '',
    toothNo: '',
    treatment: '',
    remarks: '',
    clientCode: '',
    planHolderId: '',
    officeCode: '',
    memberSource: '',
    procedureItems: [] as DentalProcedureItemInput[],
  })

  const lookupForm = reactive({
    approvalNo: '',
  })

  function optionalString(value: unknown) {
    return String(value ?? '').trim() || undefined
  }

  function resetForm() {
    form.approvalNo = ''
    form.memberName = ''
    form.availDate = new Date().toISOString().slice(0, 10)
    form.procedures = ''
    form.amount = ''
    form.dentistId = ''
    form.dentistName = ''
    form.clinicId = ''
    form.clinicName = ''
    form.toothNo = ''
    form.treatment = ''
    form.remarks = ''
    form.clientCode = ''
    form.planHolderId = ''
    form.officeCode = ''
    form.memberSource = ''
    form.procedureItems = []
    createdAvailment.value = null
    errorMessage.value = ''
    successMessage.value = ''
  }

  async function createAvailment() {
    creating.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const result = await request<DentalAvailmentRecord>(
      '/wellness/dentalAvailments',
      {
        method: 'POST',
        body: JSON.stringify({
          approvalNo: form.approvalNo.trim() || undefined,
          memberName: form.memberName.trim(),
          availDate: form.availDate,
          procedures: form.procedures.trim(),
          amount: Number(form.amount),
          procedureItems: form.procedureItems,
          dentistId: form.dentistId ? Number(form.dentistId) : undefined,
          dentistName: optionalString(form.dentistName),
          clinicId: form.clinicId ? Number(form.clinicId) : undefined,
          clinicName: optionalString(form.clinicName),
          toothNo: optionalString(form.toothNo),
          treatment: optionalString(form.treatment),
          remarks: optionalString(form.remarks),
          clientCode: optionalString(form.clientCode),
          planHolderId: optionalString(form.planHolderId),
          officeCode: optionalString(form.officeCode),
          memberSource: optionalString(form.memberSource),
        }),
      },
      { includeContentType: true },
    )

    creating.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to create dental availment.'
      return false
    }

    createdAvailment.value = result.data
    const itemCount = Number(result.data?.itemCount || 1)
    successMessage.value = `Dental availment ${result.data?.approvalno || ''} created with ${itemCount} procedure row${itemCount === 1 ? '' : 's'}.`
    return true
  }

  async function searchDentalMembers(search: string, scope: DentalMemberSearchScope = 'ims_all') {
    const query = search.trim()

    if (query.length < 2) {
      memberSearchResults.value = []
      memberSearchErrorMessage.value = ''
      return true
    }

    searchingMembers.value = true
    memberSearchErrorMessage.value = ''

    const params = new URLSearchParams({
      search: query,
      scope,
    })

    const result = await request<DentalAvailmentMemberOption[]>(
      `/wellness/dentalAvailments/memberSearch?${params.toString()}`,
    )

    searchingMembers.value = false

    if (!result.ok) {
      memberSearchErrorMessage.value = result.error || 'Unable to search members.'
      memberSearchResults.value = []
      return false
    }

    memberSearchResults.value = (result.data || []).map((member) => ({
      ...member,
      paid: Boolean(member.paid),
    }))
    return true
  }

  async function checkProcedureEligibility(procedureCode: string) {
    const normalizedProcedureCode = procedureCode.trim()

    if (!form.memberName.trim() || !form.availDate || !normalizedProcedureCode) return null

    checkingProcedureEligibility.value = true
    errorMessage.value = ''

    const params = new URLSearchParams({
      memberName: form.memberName.trim(),
      procedureCode: normalizedProcedureCode,
      availDate: form.availDate,
    })

    if (form.planHolderId.trim()) params.set('planHolderId', form.planHolderId.trim())
    if (form.officeCode.trim()) params.set('officeCode', form.officeCode.trim())
    if (form.clientCode.trim()) params.set('clientCode', form.clientCode.trim())

    const result = await request<DentalProcedureEligibility>(
      `/wellness/dentalAvailments/procedureEligibility?${params.toString()}`,
    )

    checkingProcedureEligibility.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to check procedure interval.'
      return null
    }

    return result.data || null
  }

  async function generateApprovalNo() {
    generatingApprovalNo.value = true
    errorMessage.value = ''

    const result = await request<GeneratedApprovalNoResponse>(
      '/wellness/dentalAvailments/generateApprovalNo',
    )

    generatingApprovalNo.value = false

    if (!result.ok || !result.data?.approvalNo) {
      errorMessage.value = result.error || 'Unable to generate approval number.'
      return false
    }

    form.approvalNo = result.data.approvalNo
    return true
  }

  async function readByApprovalNo() {
    const approvalNo = lookupForm.approvalNo.trim()
    if (!approvalNo) return false

    lookingUp.value = true
    errorMessage.value = ''
    approvalLookup.value = null

    const result = await request<DentalAvailmentApproval>(
      `/wellness/dentalAvailments/${approvalNo}`,
    )

    lookingUp.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to find that approval number.'
      return false
    }

    approvalLookup.value = result.data
    return true
  }

  return {
    approvalLookup,
    createAvailment,
    checkProcedureEligibility,
    checkingProcedureEligibility,
    createdAvailment,
    creating,
    errorMessage,
    form,
    generateApprovalNo,
    generatingApprovalNo,
    lookingUp,
    lookupForm,
    memberSearchErrorMessage,
    memberSearchResults,
    readByApprovalNo,
    resetForm,
    searchDentalMembers,
    searchingMembers,
    successMessage,
  }
}
