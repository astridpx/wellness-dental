export type ImsPaymentExtractionRow = {
  no: string
  iwc_accounts: string | null
  ecp_type: string | null
  maincompany: string | null
  umbrellacomp: string | null
  membername: string | null
  origprem: number | string | null
  dentalprem1: number | string | null
  plancode: string | null
  dentalshare: number | string | null
  vat: string
  ar_number: string | null
  or_number: string | null
  posteddate: string | null
  payment_period: string | null
  free: string | null
  planholderid: number | string | null
}
