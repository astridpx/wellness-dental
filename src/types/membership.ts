export type MembershipRecord = {
  planholderId: string
  mainPlanholderId?: string | null
  memberName: string
  officeCode?: string | null
  company?: string | null
  planCode?: string | null
  dentalPremium?: number | string | null
  birthDate?: string | null
  sex?: string | null
  effectiveDate?: string | null
  lastPaymentDate?: string | null
  startCoverDate?: string | null
  imsCardNumber?: string | null
  status?: string | null
  remittedPaymentCount?: number | string | null
  unremittedPaymentCount?: number | string | null
}

export type MembershipPaymentRecord = {
  paymentCollectionId: number
  planholderId: string
  mainPlanholderId?: string | null
  planCode?: string | null
  paymentPeriod?: string | null
  referenceNumber?: string | null
  membershipFee?: number | string | null
  paymentMode?: string | null
  dateReceived?: string | null
  datePosted?: string | null
  dateClearedByFinance?: string | null
  remittedWell?: string | null
  orNumber?: string | null
  orDate?: string | null
  remarks?: string | null
}
