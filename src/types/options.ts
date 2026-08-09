export type BusinessPartnerOption = {
  id: number
  name: string
  code: string
  description: string
  active: boolean
}

export type PaymentModeOption = {
  id: number
  category: 'Payment Modes'
  name: string
  code: string
  description: string
  price?: number
  active: boolean
}

export type ProcedureOption = {
  id: number
  category: 'Procedures'
  name: string
  code: string
  description: string
  price?: number
  active: boolean
  monthInterval: number
  quantity: number
}
