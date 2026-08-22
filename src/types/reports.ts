export type AvailmentReportMode = 'companyPeriod' | 'dentistPeriod' | 'period' | 'daily'

export type AvailmentCompanyScope = 'both' | 'ims' | 'partner' | 'specificIms'

export type AvailmentCompanyFilterBy = 'classification' | 'mainCompany'

export type AvailmentReportRow = {
  companyName?: string | null
  approvalNo?: string | null
  memberName?: string | null
  availDate?: string | null
  dentistName?: string | null
  clinicName?: string | null
  toothNo?: string | null
  procedures?: string | null
  amount?: number | string | null
  ifPaid?: boolean | number | string | null
  paidToDentistAt?: string | null
  paymentReceived?: boolean | number | string | null
  paymentReceivedAt?: string | null
  remarks?: string | null
  encodedBy?: string | null
}

export type ImsReportCompany = {
  officeCode: string
  companyName: string
  mainCompany?: string | null
}

export type PartnerReportCompany = {
  companyCode: string
  companyName: string
}
