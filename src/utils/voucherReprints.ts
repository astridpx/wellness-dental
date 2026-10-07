const VOUCHER_REPRINT_STORAGE_KEY = 'wellness:voucherReprints'

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

type VoucherReprintStore = Record<string, VoucherReprintSnapshot>

function readVoucherReprintStore(): VoucherReprintStore {
  try {
    const raw = localStorage.getItem(VOUCHER_REPRINT_STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeVoucherReprintStore(store: VoucherReprintStore) {
  localStorage.setItem(VOUCHER_REPRINT_STORAGE_KEY, JSON.stringify(store))
}

export function saveVoucherReprintSnapshot(snapshot: VoucherReprintSnapshot) {
  if (!snapshot.summaryRecordId) return

  const store = readVoucherReprintStore()
  store[String(snapshot.summaryRecordId)] = snapshot
  writeVoucherReprintStore(store)
}

export function getVoucherReprintSnapshot(summaryRecordId: number | string) {
  const store = readVoucherReprintStore()
  return store[String(summaryRecordId)] || null
}

export function hasVoucherReprintSnapshot(summaryRecordId: number | string) {
  return Boolean(getVoucherReprintSnapshot(summaryRecordId))
}
