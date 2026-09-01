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
  encodedByName?: string | null
  dateencoded?: string | null
  entryTime?: string | null
  planholderid?: string | null
  officecode?: string | null
  IfPaid?: number | boolean | null
  ifPaid?: number | boolean | null
  ifpaid?: number | boolean | null
  paidAt?: string | null
  billingReceivedAt?: string | null
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

export type DentalProcedureItemInput = {
  procedures: string
  amount: number
  toothNo?: string
  bypassProcedureInterval?: boolean
}

export type DentalProcedureEligibility = {
  eligible: boolean
  procedureCode: string
  procedureName?: string | null
  monthInterval?: number | null
  lastAvailDate?: string | null
  nextEligibleDate?: string | null
  daysRemaining?: number | null
  message?: string | null
}

export type DentalMemberSearchScope =
  | 'ims_all'
  | 'ims_paid'
  | 'partner_all'
  | 'partner_paid'
  | 'manual'

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
