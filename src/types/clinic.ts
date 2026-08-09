export const CLINIC_TYPE_CODES = ['Dental'] as const

export type KnownClinicTypeCode = (typeof CLINIC_TYPE_CODES)[number]

// Keep the shared contract open-ended so existing backend values remain valid.
export type ClinicTypeCode = KnownClinicTypeCode | (string & {})

export type Clinic = {
  clinicidno: string
  clinicname: string
  address: string
  city: string
  province: string
  contactno: string
  schedule: string
  cliniccode: string
  date_added: string
  Addedby: string
  longtitude: string
  latitude: string
  status: number
  iaccredited: number
  MobileNumber1: string
  MobileNumber2: string
  type: ClinicTypeCode
  provider_app: string
  dentistId: number | null
  dentistname?: string | null
  prcno?: string | null
  email?: string | null
  dentistcode?: string | null
  isActive?: string | number | null
}

export type ClinicFormData = {
  clinicName: string
  address: string
  city: string
  province: string
  contactNumber: string
  schedule: string
  clinicCode: string
  longitude: string
  latitude: string
  status: 'Active' | 'Inactive' | 'Unknown'
  isAccredited: boolean
  mobileNumber1: string
  mobileNumber2: string
  type: ClinicTypeCode
  providerApp: string
  dentistId: number | null
  dentistname: string
  prcno: string
  email: string
  dentistcode: string
  isActive: string
}

export type ClinicFormErrorContext = '' | 'load' | 'validation' | 'save'

export const DEFAULT_CLINIC_TYPE_CODE: ClinicTypeCode = ''

export function normalizeClinicTypeCode(value: string | null | undefined): ClinicTypeCode {
  return value?.trim() ?? DEFAULT_CLINIC_TYPE_CODE
}
