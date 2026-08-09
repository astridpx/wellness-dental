import { reactive, ref } from 'vue'
import { useWellnessApi } from './useWellnessApi'

export type DentalAvailmentRecord = {
  dentalid: number
  approvalno: string
  membername: string
  availdate: string
  dentistid?: number | null
  dentistname?: string | null
  clinicid?: number | null
  clinicname?: string | null
  toothno?: string | null
  procedures: string
  treatment?: string | null
  amount: number
  remarks?: string | null
  clientcode?: string | null
  encodedby?: string | null
  dateencoded?: string | null
  planholderid?: string | null
  officecode?: string | null
  IfPaid?: number | boolean | null
  ifPaid?: number | boolean | null
  ifpaid?: number | boolean | null
  paidAt?: string | null
  dtCancelled?: string | null
  CancelledBy?: string | null
  status?: string
  itemCount?: number
}

export type DentalAvailmentApproval = {
  approvalNo: string
  totalAmount: number
  itemCount: number
  memberName?: string | null
  availDate?: string | null
  rows: DentalAvailmentRecord[]
}

type GeneratedApprovalNoResponse = {
  approvalNo: string
}

export type DentalProcedureItemInput = {
  procedures: string
  amount: number
  toothNo?: string
}

export type DentalMemberSearchScope = 'ims_all' | 'ims_paid' | 'partner_all' | 'partner_paid'

export type DentalAvailmentMemberOption = {
  id: string
  source: 'ims' | 'partner'
  memberName: string
  planHolderId?: string | null
  clientCode?: string | null
  officeCode?: string | null
  companyName?: string | null
  companyCode?: string | null
  policyNumber?: string | null
  planCode?: string | null
  cardNo?: string | null
  idNo?: string | null
  areaLocation?: string | null
  coveredUntil?: string | null
  paid?: boolean
}

export function useDentalAvailments() {
  const { request } = useWellnessApi()

  const creating = ref(false)
  const lookingUp = ref(false)
  const generatingApprovalNo = ref(false)
  const searchingMembers = ref(false)
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
