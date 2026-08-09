export type UserRow = {
  id: number
  userNo: string
  name: string
  primaryRole: string
  roles?: string[]
  email: string
  phone: string | null
  isActive?: boolean
  status?: 'Active' | 'Inactive'
  mustChangePassword?: boolean
}

export type RoleOption = {
  id: number
  code: string
  name: string
}
