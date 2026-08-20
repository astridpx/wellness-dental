import { ref } from 'vue'
import type { DentistBankAccount, DentistBankAccountInput } from '@/types'
import { useWellnessApi } from './useWellnessApi'

const bankAccountsPath = '/wellness/dentists/bankAccount'

type BankAccountResponse = Omit<DentistBankAccount, 'isActive'> & {
  isActive: boolean | number | string
}

export function useDentistBankAccounts() {
  const { request } = useWellnessApi()

  const bankAccounts = ref<DentistBankAccount[]>([])
  const loadingBankAccounts = ref(false)
  const savingBankAccount = ref(false)
  const deletingBankAccountId = ref<number | null>(null)
  const bankAccountError = ref('')

  function normalizeBankAccount(account: BankAccountResponse): DentistBankAccount {
    return {
      ...account,
      id: Number(account.id),
      dentistId: Number(account.dentistId),
      isActive:
        account.isActive === true ||
        account.isActive === 1 ||
        account.isActive === '1' ||
        account.isActive === 'true',
    }
  }

  async function fetchBankAccounts(dentistId: number) {
    loadingBankAccounts.value = true
    bankAccountError.value = ''

    const result = await request<BankAccountResponse[]>(`${bankAccountsPath}/${dentistId}`)

    if (!result.ok) {
      bankAccounts.value = []
      bankAccountError.value = result.error || 'Unable to load bank accounts.'
      loadingBankAccounts.value = false
      return false
    }

    bankAccounts.value = (Array.isArray(result.data) ? result.data : [])
      .map(normalizeBankAccount)
      .sort((a, b) => a.id - b.id)
    loadingBankAccounts.value = false
    return true
  }

  function bankAccountBody(payload: DentistBankAccountInput) {
    return JSON.stringify({
      bankName: payload.bankName.trim(),
      accountName: payload.accountName.trim(),
      accountNumber: payload.accountNumber.trim(),
      isActive: payload.isActive,
    })
  }

  async function createBankAccount(dentistId: number, payload: DentistBankAccountInput) {
    savingBankAccount.value = true
    bankAccountError.value = ''

    const result = await request(
      `${bankAccountsPath}/${dentistId}`,
      {
        method: 'POST',
        body: bankAccountBody(payload),
      },
      { includeContentType: true },
    )

    if (!result.ok) {
      bankAccountError.value = result.error || 'Unable to create the bank account.'
      savingBankAccount.value = false
      return false
    }

    const refreshed = await fetchBankAccounts(dentistId)
    savingBankAccount.value = false
    return refreshed
  }

  async function updateBankAccount(
    dentistId: number,
    bankAccountId: number,
    payload: DentistBankAccountInput,
  ) {
    savingBankAccount.value = true
    bankAccountError.value = ''

    const result = await request(
      `${bankAccountsPath}/${bankAccountId}`,
      {
        method: 'PUT',
        body: bankAccountBody(payload),
      },
      { includeContentType: true },
    )

    if (!result.ok) {
      bankAccountError.value = result.error || 'Unable to update the bank account.'
      savingBankAccount.value = false
      return false
    }

    const refreshed = await fetchBankAccounts(dentistId)
    savingBankAccount.value = false
    return refreshed
  }

  async function deleteBankAccount(dentistId: number, bankAccountId: number) {
    deletingBankAccountId.value = bankAccountId
    bankAccountError.value = ''

    const result = await request(`${bankAccountsPath}/${bankAccountId}`, { method: 'DELETE' })

    if (!result.ok) {
      bankAccountError.value = result.error || 'Unable to delete the bank account.'
      deletingBankAccountId.value = null
      return false
    }

    const refreshed = await fetchBankAccounts(dentistId)
    deletingBankAccountId.value = null
    return refreshed
  }

  function clearBankAccountError() {
    bankAccountError.value = ''
  }

  return {
    bankAccountError,
    bankAccounts,
    clearBankAccountError,
    createBankAccount,
    deleteBankAccount,
    deletingBankAccountId,
    fetchBankAccounts,
    loadingBankAccounts,
    savingBankAccount,
    updateBankAccount,
  }
}
