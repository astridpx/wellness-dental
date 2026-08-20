export type Dentist = {
  dentistidno: number
  lastname: string
  firstname: string
  middleinitial: string
  specialization: string
  prcno: string
  TWLB: string
  OP: string
  STE: string
  TF: string
  AD: string
  RJ: string
  LC: string
  PF: string
  CON: string
  contactno: string
  email: string
  modeofpayment: string
  bankacct: string
  acctname: string
  remarks: string | null
  agent: string
  dentistname: string
  date_added: string
  addedby: string
  Isactive: string
  PPE_ICF: number
  CAN: number
  dentistcode: string
}

export type DentistFormData = {
  license: string
  firstname: string
  lastname: string
  middleInitial: string
  email: string
  phone: string
  specialty: string
  dentistCode: string
  modeOfPayment: string
  bankAccount: string
  accountName: string
  agent: string
  remarks: string
  TWLB: string
  OP: string
  STE: string
  TF: string
  AD: string
  RJ: string
  LC: string
  PF: string
  CON: string
  ppeIcf: string
  can: string
  status: 'Active' | 'Inactive' | 'Unknown'
}

export type DentistFormErrorContext = '' | 'load' | 'validation' | 'save'
