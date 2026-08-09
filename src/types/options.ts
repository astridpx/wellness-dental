export type OptionCategory = 'Procedures' | 'Payment Modes'

export type BusinessPartnerOption = {
  id: number
  name: string
  code: string
  description: string
  active: boolean
}

export type OptionItem = {
  id: number
  category: OptionCategory
  name: string
  code: string
  description: string
  price?: number
  active: boolean
  monthInterval?: number
  quantity?: number
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
