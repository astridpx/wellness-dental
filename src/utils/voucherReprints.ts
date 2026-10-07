const VOUCHER_REPRINT_STORAGE_KEY = 'wellness:voucherReprints'
const CHEQUE_REPRINT_STORAGE_KEY = 'wellness:chequeReprints'

export type VoucherReprintRow = {
  id: number
  accountCode: string
  costCenter: string
  accountTitleName: string
  accountTitle: string
  costCenterTitle: string
  debit: string
  credit: string
  details: string
}

export type VoucherReprintSnapshot = {
  summaryRecordId?: number
  savedAt: string
  voucher: {
    companyName: string
    title: string
    paidTo: string
    particulars: string
    periodFrom: string
    periodTo: string
    referenceNo: string
    date: string
    checkNo: string
    preparedBy: string
    checkedBy: string
    approvedBy: string
    receivedBy: string
    receivedDate: string
  }
  rows: VoucherReprintRow[]
}

export type ChequeReprintSnapshot = {
  summaryRecordId?: number
  savedAt: string
  cheque: {
    accountName: string
    payee: string
    date: string
    amount: string
    amountWords: string
  }
  template: {
    name: string
    bankName: string
    width: number
    height: number
    fields: Array<{
      key: string
      label: string
      x: number
      y: number
      width: number
      height: number
      fontSize: number
      align?: 'left' | 'center' | 'right'
    }>
    datePartOffsets: Record<string, number>
  }
}

type VoucherReprintStore = Record<string, VoucherReprintSnapshot>
type ChequeReprintStore = Record<string, ChequeReprintSnapshot>

function readReprintStore<T>(storageKey: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeReprintStore<T>(storageKey: string, store: Record<string, T>) {
  localStorage.setItem(storageKey, JSON.stringify(store))
}

export function saveVoucherReprintSnapshot(snapshot: VoucherReprintSnapshot) {
  if (!snapshot.summaryRecordId) return

  const store = readReprintStore<VoucherReprintSnapshot>(VOUCHER_REPRINT_STORAGE_KEY)
  store[String(snapshot.summaryRecordId)] = snapshot
  writeReprintStore(VOUCHER_REPRINT_STORAGE_KEY, store)
}

export function getVoucherReprintSnapshot(summaryRecordId: number | string) {
  const store = readReprintStore<VoucherReprintSnapshot>(VOUCHER_REPRINT_STORAGE_KEY)
  return store[String(summaryRecordId)] || null
}

export function hasVoucherReprintSnapshot(summaryRecordId: number | string) {
  return Boolean(getVoucherReprintSnapshot(summaryRecordId))
}

export function saveChequeReprintSnapshot(snapshot: ChequeReprintSnapshot) {
  if (!snapshot.summaryRecordId) return

  const store = readReprintStore<ChequeReprintSnapshot>(CHEQUE_REPRINT_STORAGE_KEY)
  store[String(snapshot.summaryRecordId)] = snapshot
  writeReprintStore(CHEQUE_REPRINT_STORAGE_KEY, store)
}

export function getChequeReprintSnapshot(summaryRecordId: number | string) {
  const store = readReprintStore<ChequeReprintSnapshot>(CHEQUE_REPRINT_STORAGE_KEY)
  return store[String(summaryRecordId)] || null
}

export function hasChequeReprintSnapshot(summaryRecordId: number | string) {
  return Boolean(getChequeReprintSnapshot(summaryRecordId))
}
