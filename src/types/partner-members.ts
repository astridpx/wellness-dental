export type PartnerMemberBatch = {
  id: number
  batchCode: string
  companyCode: string
  companyName: string
  paymentPeriod?: string | null
  sourceFilename: string
  sourceSheetName?: string | null
  sourceMimeType?: string | null
  sourceFileSize?: number | null
  uploadedByUserId?: number | null
  uploadedByUserCode?: string | null
  uploadedByName: string
  uploadedByEmail?: string | null
  uploadedAt: string
  isCurrent: boolean
  status: string
  totalRows: number
  paidRows: number
  unpaidRows: number
  remarks?: string | null
  createdAt?: string
  updatedAt?: string
}

export type PartnerMemberBatchSummary = PartnerMemberBatch & {
  importedRows: number
  dentalPremiumTotal: number
}

export type PartnerMemberRecord = {
  id: number
  batchId: number
  rowNumber: number
  memberId?: number
  excelNo?: string | null
  areaLocation: string
  idNo?: string | null
  fullName: string
  cardNo: string
  dentalPremium?: number | string | null
  paymentPeriod?: string | null
  paid: boolean
  paidAt?: string | null
  paymentReference?: string | null
  remarks?: string | null
  createdAt?: string
  updatedAt?: string
  batchCode?: string
  companyCode?: string
  companyName?: string
  isCurrent?: boolean
  uploadedAt?: string
}

export type ImportedPartnerMember = {
  memberId: number
  companyCode: string
  companyName: string
  excelNo?: string | null
  areaLocation: string
  idNo?: string | null
  fullName: string
  cardNo: string
  currentDentalPremium?: number | string | null
  currentBatchId?: number | null
  currentBatchCode?: string | null
  currentPaymentPeriod?: string | null
  currentBatchUploadedAt?: string | null
  currentPaid?: boolean | null
  currentPaidAt?: string | null
  currentPaymentReference?: string | null
  currentRemarks?: string | null
  createdAt?: string
  updatedAt?: string
}

export type ImportedPartnerMemberPaymentRecord = {
  paymentRecordId: number
  batchId: number
  memberId: number
  paid: boolean
  paidAt?: string | null
  paymentReference?: string | null
  remarks?: string | null
  dentalPremium?: number | string | null
  batchCode?: string | null
  companyCode?: string | null
  companyName?: string | null
  paymentPeriod?: string | null
  uploadedAt?: string | null
  sourceFilename?: string | null
}
