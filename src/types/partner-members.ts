export type PartnerMemberBatch = {
  id: number
  batchCode: string
  companyCode: string
  companyName: string
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

export type PartnerMemberRecord = {
  id: number
  batchId: number
  rowNumber: number
  excelNo?: string | null
  areaLocation: string
  idNo: string
  fullName: string
  cardNo: string
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
