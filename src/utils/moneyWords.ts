type MoneyValue = number | string | null | undefined

function toAmount(value: MoneyValue) {
  const amountValue = Number(String(value || '').replace(/,/g, ''))
  return Number.isFinite(amountValue) ? amountValue : 0
}

function integerToWords(value: number): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ]

  if (value < 20) return ones[value] || ''
  if (value < 100) {
    return `${tens[Math.floor(value / 10)] || ''}${value % 10 ? ` ${ones[value % 10] || ''}` : ''}`
  }
  if (value < 1000) {
    return `${ones[Math.floor(value / 100)] || ''} Hundred${
      value % 100 ? ` ${integerToWords(value % 100)}` : ''
    }`
  }
  if (value < 1000000) {
    return `${integerToWords(Math.floor(value / 1000))} Thousand${
      value % 1000 ? ` ${integerToWords(value % 1000)}` : ''
    }`
  }
  if (value < 1000000000) {
    return `${integerToWords(Math.floor(value / 1000000))} Million${
      value % 1000000 ? ` ${integerToWords(value % 1000000)}` : ''
    }`
  }

  return `${integerToWords(Math.floor(value / 1000000000))} Billion${
    value % 1000000000 ? ` ${integerToWords(value % 1000000000)}` : ''
  }`
}

export function formatPlainAmount(value: MoneyValue) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toAmount(value))
}

export function amountToWords(value: MoneyValue) {
  const amount = toAmount(value)
  if (!amount) return 'Zero'

  const whole = Math.floor(amount)
  const cents = Math.round((amount - whole) * 100)
  return `${integerToWords(whole)} & ${String(cents).padStart(2, '0')}/100`
}

export function amountToChequeWords(value: MoneyValue) {
  const amount = toAmount(value)
  if (!amount) return 'Zero Pesos'

  const totalCentavos = Math.round(amount * 100)
  const whole = Math.floor(totalCentavos / 100)
  const centavos = totalCentavos % 100
  const pesoLabel = whole === 1 ? 'Peso' : 'Pesos'

  if (!centavos) return `${integerToWords(whole)} ${pesoLabel} Only`

  return `${integerToWords(whole) || 'Zero'} ${pesoLabel} And ${String(centavos).padStart(2, '0')}/100 Only`
}

export function parsePlainAmount(value: MoneyValue) {
  return toAmount(value)
}
