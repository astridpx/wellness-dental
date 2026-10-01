import { ref } from 'vue'
import {
  MONTHLY_ADMINISTRATOR_FEE,
  MONTHLY_BILLING_TOTAL,
  MONTHLY_SERVER_FEE,
  type BillingStatement,
} from '@/utils/billing'
import { useWellnessApi } from './useWellnessApi'

type BillingStatementResponse = {
  id?: number | null
  billingPeriod: string
  serverFee: number | string
  administratorFee: number | string
  totalAmount?: number | string | null
  paid: boolean | number
  paidAt?: string | null
  paymentReference?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

type SaveBillingStatementInput = {
  period: string
  serverFee?: number
  administratorFee?: number
  isPaid?: boolean
  paidAt?: string
  paymentReference?: string
  notes?: string
}

type UpdateBillingPaymentInput = {
  period: string
  isPaid: boolean
  paymentReference?: string
  notes?: string
}

type QueueBillingStatementEmailInput = {
  period: string
  recipientEmail: string
  recipientName: string
}

function mapBillingStatement(statement: BillingStatementResponse): BillingStatement {
  const serverFee = Number(statement.serverFee || MONTHLY_SERVER_FEE)
  const administratorFee = Number(statement.administratorFee || MONTHLY_ADMINISTRATOR_FEE)

  return {
    id: statement.id ? Number(statement.id) : null,
    period: statement.billingPeriod,
    serverFee,
    administratorFee,
    totalAmount: Number(
      statement.totalAmount || serverFee + administratorFee || MONTHLY_BILLING_TOTAL,
    ),
    isPaid: Boolean(statement.paid),
    paidAt: statement.paidAt || '',
    paymentReference: statement.paymentReference || '',
    notes: statement.notes || '',
    createdAt: statement.createdAt || '',
    updatedAt: statement.updatedAt || '',
  }
}

export function useBillingStatements() {
  const { request } = useWellnessApi()

  const billingStatements = ref<BillingStatement[]>([])
  const billingStatementTotalEntries = ref(0)
  const billingStatementTotalPages = ref(1)
  const loadingBillingStatements = ref(false)
  const savingBillingStatement = ref(false)
  const queueingBillingEmail = ref(false)
  const errorMessage = ref('')

  async function fetchBillingStatement(period: string): Promise<BillingStatement | null> {
    loadingBillingStatements.value = true
    errorMessage.value = ''

    const result = await request<BillingStatementResponse | null>(
      `/wellness/billingStatements?billingPeriod=${encodeURIComponent(period)}`,
    )

    loadingBillingStatements.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load billing statement.'
      return null
    }

    return result.data ? mapBillingStatement(result.data) : null
  }

  async function fetchBillingStatements(page = 1, perPage = 6) {
    loadingBillingStatements.value = true
    errorMessage.value = ''

    const result = await request<BillingStatementResponse[]>(
      `/wellness/billingStatements?page=${page}&perPage=${perPage}`,
    )

    loadingBillingStatements.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load billing statements.'
      billingStatements.value = []
      billingStatementTotalEntries.value = 0
      billingStatementTotalPages.value = 1
      return false
    }

    billingStatements.value = (Array.isArray(result.data) ? result.data : []).map(
      mapBillingStatement,
    )
    billingStatementTotalEntries.value = Number(result.metadata?.totalEntries || 0)
    billingStatementTotalPages.value = Number(result.metadata?.totalPages || 1)
    return true
  }

  async function fetchLatestBillingStatement() {
    loadingBillingStatements.value = true
    errorMessage.value = ''

    const result = await request<BillingStatementResponse[]>(
      '/wellness/billingStatements?page=1&perPage=1',
    )

    loadingBillingStatements.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to load latest billing statement.'
      return null
    }

    const [latestStatement] = Array.isArray(result.data) ? result.data : []
    return latestStatement ? mapBillingStatement(latestStatement) : null
  }

  async function saveBillingStatement(payload: SaveBillingStatementInput) {
    savingBillingStatement.value = true
    errorMessage.value = ''

    const result = await request<BillingStatementResponse>(
      '/wellness/billingStatements',
      {
        method: 'POST',
        body: JSON.stringify({
          billingPeriod: payload.period,
          serverFee: payload.serverFee ?? MONTHLY_SERVER_FEE,
          administratorFee: payload.administratorFee ?? MONTHLY_ADMINISTRATOR_FEE,
          paid: payload.isPaid ?? false,
          paidAt: payload.paidAt || null,
          paymentReference: payload.paymentReference || '',
          notes: payload.notes || '',
        }),
      },
      { includeContentType: true },
    )

    savingBillingStatement.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to save billing statement.'
      return null
    }

    return result.data ? mapBillingStatement(result.data) : null
  }

  async function updateBillingPayment(payload: UpdateBillingPaymentInput) {
    savingBillingStatement.value = true
    errorMessage.value = ''

    const result = await request<BillingStatementResponse>(
      `/wellness/billingStatements/${encodeURIComponent(payload.period)}/payment`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          paid: payload.isPaid,
          paymentReference: payload.paymentReference || '',
          notes: payload.notes,
        }),
      },
      { includeContentType: true },
    )

    savingBillingStatement.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to update billing payment status.'
      return null
    }

    return result.data ? mapBillingStatement(result.data) : null
  }

  async function queueBillingStatementEmail(payload: QueueBillingStatementEmailInput) {
    queueingBillingEmail.value = true
    errorMessage.value = ''

    const result = await request(
      `/wellness/billingStatements/${encodeURIComponent(payload.period)}/email`,
      {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: payload.recipientEmail,
          recipientName: payload.recipientName,
        }),
      },
      { includeContentType: true },
    )

    queueingBillingEmail.value = false

    if (!result.ok) {
      errorMessage.value = result.error || 'Unable to queue billing statement email.'
      return false
    }

    return true
  }

  function clearBillingStatementError() {
    errorMessage.value = ''
  }

  return {
    billingStatements,
    billingStatementTotalEntries,
    billingStatementTotalPages,
    clearBillingStatementError,
    errorMessage,
    fetchBillingStatement,
    fetchBillingStatements,
    fetchLatestBillingStatement,
    loadingBillingStatements,
    queueBillingStatementEmail,
    queueingBillingEmail,
    saveBillingStatement,
    savingBillingStatement,
    updateBillingPayment,
  }
}
