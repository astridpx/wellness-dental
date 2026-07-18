export const MIN_PASSWORD_LENGTH = 12
export const DEFAULT_GENERATED_PASSWORD_LENGTH = 12

export function generateSecurePassword(length = DEFAULT_GENERATED_PASSWORD_LENGTH) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  const randomValues = new Uint32Array(length)

  crypto.getRandomValues(randomValues)

  return Array.from(randomValues, (value) => chars[value % chars.length]).join('')
}

export function getPasswordValidationMessage(password: string, isEditing = false) {
  const trimmedPassword = password.trim()

  if (isEditing && !trimmedPassword) return ''
  if (trimmedPassword && trimmedPassword.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  return ''
}
