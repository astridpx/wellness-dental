<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, reactive, ref } from 'vue'
import { AppButton, AppInput } from '@/components/app'
import { amountToChequeWords, currentManilaDateInputValue, formatPlainAmount } from '@/utils'

type ChequeFieldKey = 'payee' | 'amountWords' | 'amount' | 'date'

type ChequeTemplateField = {
  key: ChequeFieldKey
  label: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  align?: 'left' | 'center' | 'right'
}

const bpiTemplate = {
  name: 'BPI Cheque',
  bankName: 'Bank of the Philippine Islands',
  width: 203.2,
  height: 76.2,
  fields: [
    {
      key: 'payee',
      label: 'Payee',
      x: 20,
      y: 25,
      width: 106,
      height: 8,
      fontSize: 15,
    },
    {
      key: 'amountWords',
      label: 'Amount in words',
      x: 15,
      y: 35,
      width: 140,
      height: 8,
      fontSize: 14,
    },
    {
      key: 'amount',
      label: 'Amount',
      x: 160,
      y: 25,
      width: 31,
      height: 8,
      fontSize: 15,
      align: 'left',
    },
    {
      key: 'date',
      label: 'Date',
      x: 158,
      y: 12,
      width: 31,
      height: 8,
      fontSize: 12,
      align: 'center',
    },
  ] satisfies ChequeTemplateField[],
}

const cheque = reactive({
  template: bpiTemplate.name,
  accountName:
    import.meta.env.VITE_APP_VOUCHER_COMPANY_NAME ||
    'IWC Wellness and Preventive Consultancy, Inc.',
  accountNo: '4981-0121-22',
  payee: '',
  date: currentManilaDateInputValue(),
  amount: '',
  amountWords: '',
})
const showGuides = ref(true)

const formattedAmount = computed(() => formatPlainAmount(cheque.amount))
const generatedAmountWords = computed(() => amountToChequeWords(cheque.amount).toUpperCase())
const chequeAmountWords = computed(() => cheque.amountWords.trim() || generatedAmountWords.value)
const templateFields = computed(() => bpiTemplate.fields)

function fieldStyle(field: ChequeTemplateField) {
  return {
    left: `${field.x}mm`,
    top: `${field.y}mm`,
    width: `${field.width}mm`,
    minHeight: `${field.height}mm`,
    fontSize: `${field.fontSize}px`,
    textAlign: field.align || 'left',
  }
}

function fieldValue(field: ChequeTemplateField) {
  if (field.key === 'payee') return cheque.payee
  if (field.key === 'amountWords') return chequeAmountWords.value
  if (field.key === 'amount') return formattedAmount.value
  return ''
}

function formatChequeDate(value: string) {
  if (!value) return ['', '', '', '', '', '', '', '']

  const [year = '', month = '', day = ''] = value.split('-')
  return [
    month[0] || '',
    month[1] || '',
    day[0] || '',
    day[1] || '',
    year[0] || '',
    year[1] || '',
    year[2] || '',
    year[3] || '',
  ]
}

function printCheque() {
  const chequeSheet = document.querySelector('.cheque-sheet')
  if (!chequeSheet) {
    window.print()
    return
  }

  const printFrame = document.createElement('iframe')
  printFrame.title = 'Cheque print'
  printFrame.style.position = 'fixed'
  printFrame.style.right = '0'
  printFrame.style.bottom = '0'
  printFrame.style.width = '0'
  printFrame.style.height = '0'
  printFrame.style.border = '0'
  document.body.appendChild(printFrame)

  const printDocument = printFrame.contentDocument
  if (!printDocument) {
    printFrame.remove()
    window.print()
    return
  }

  printDocument.open()
  printDocument.write(`
    <!doctype html>
    <html>
      <head>
        <style>
          @page {
            size: 203.2mm 76.2mm;
            margin: 0;
          }

          html,
          body {
            width: 203.2mm;
            height: 76.2mm;
            margin: 0;
            overflow: hidden;
            background: #fff;
          }

          .cheque-sheet {
            position: relative;
            width: 203.2mm;
            height: 76.2mm;
            overflow: hidden;
            background: transparent;
            font-family: Arial, Helvetica, sans-serif;
          }

          .cheque-field-frame {
            display: none !important;
          }

          .cheque-field {
            position: absolute;
            z-index: 2;
            margin: 0;
            overflow-wrap: normal;
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: 700;
            letter-spacing: 0;
            line-height: 1.2;
            text-transform: uppercase;
          }

          .cheque-field-amountWords {
            overflow: visible;
            white-space: nowrap;
          }

          .cheque-date-digits {
            display: grid;
            grid-template-columns: repeat(8, 0.52fr);
            gap: 0;
            text-align: center;
          }
        </style>
      </head>
      <body>${chequeSheet.outerHTML}</body>
    </html>
  `)
  printDocument.close()

  printFrame.onload = () => {
    printFrame.contentWindow?.focus()
    printFrame.contentWindow?.print()
    window.setTimeout(() => printFrame.remove(), 1000)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-smoke">Cheque</p>
        <h1 class="mt-2 text-2xl font-black text-onyx">Cheque Writer</h1>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm font-semibold text-onyx shadow-sm transition hover:border-tangerine hover:text-tangerine"
          @click="showGuides = !showGuides"
        >
          <Icon :icon="showGuides ? 'feather:eye' : 'feather:eye-off'" class="h-4 w-4" />
          {{ showGuides ? 'Guides On' : 'Guides Off' }}
        </button>
        <AppButton btn-theme="primary" type="button" @click="printCheque">
          <Icon icon="feather:printer" class="h-4 w-4" />
          Print Cheque
        </AppButton>
      </div>
    </div>

    <div class="grid gap-6 2xl:grid-cols-[minmax(360px,520px)_1fr]">
      <form
        class="no-print space-y-5 rounded-3xl border border-[#d8d1c5] bg-[linear-gradient(180deg,#fbf6ee_0%,#eef1ed_100%)] p-5 shadow-sm"
        @submit.prevent="printCheque"
      >
        <section class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate"
          >
            <Icon icon="feather:sliders" class="h-4 w-4" />
            Template
          </div>

          <div class="rounded-2xl border border-[#ded7cc] bg-white/72 p-4">
            <p class="text-sm font-black text-onyx">{{ bpiTemplate.name }}</p>
            <p class="mt-1 text-sm text-slate">{{ bpiTemplate.bankName }}</p>
            <p class="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-smoke">
              {{ bpiTemplate.width }}mm x {{ bpiTemplate.height }}mm
            </p>
            <p class="mt-3 text-xs leading-5 text-slate">
              Default layout follows the public 203.2mm x 76.2mm Philippine cheque format guidance.
              Use test prints to fine tune printer offsets.
            </p>
          </div>
        </section>

        <section class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate"
          >
            <Icon icon="feather:edit-3" class="h-4 w-4" />
            Cheque Data
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput v-model="cheque.accountName" label="Account name" />
            <AppInput v-model="cheque.accountNo" label="Account no." />
            <AppInput v-model="cheque.date" type="date" label="Date" />
            <AppInput v-model="cheque.payee" label="Pay to the order of" />
            <AppInput
              v-model="cheque.amount"
              decimal-only
              inputmode="decimal"
              label="Amount"
              placeholder="0.00"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-onyx">Amount in words</label>
            <textarea
              v-model="cheque.amountWords"
              class="min-h-24 w-full rounded-xl border border-pebble bg-white px-4 py-3 text-onyx outline-none transition placeholder:text-ash focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
              :placeholder="generatedAmountWords"
            />
          </div>
        </section>
      </form>

      <section
        class="printable-cheque overflow-auto rounded-3xl border border-[#d8d1c5] bg-[linear-gradient(180deg,#fbf7ef_0%,#eef1ed_100%)] p-4 shadow-md"
      >
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-black text-onyx">{{ bpiTemplate.name }} Preview</p>
            <p class="mt-1 text-xs text-slate">Only black field text prints on the real cheque.</p>
          </div>
          <div class="flex gap-2 text-xs font-semibold text-slate">
            <span class="rounded-full bg-sapphire-light px-3 py-1 text-sapphire">BPI</span>
            <span class="rounded-full bg-emerald-light px-3 py-1 text-emerald"
              >Pre-printed cheque</span
            >
          </div>
        </div>

        <div class="cheque-stage">
          <div
            class="cheque-sheet mx-auto text-[#111]"
            :class="{ 'cheque-sheet-guides-hidden': !showGuides }"
          >
            <div
              v-for="field in templateFields"
              :key="field.key"
              class="cheque-field-frame"
              :style="fieldStyle(field)"
            >
              <span class="cheque-field-label">{{ field.label }}</span>
            </div>

            <p
              v-for="field in templateFields"
              :key="`${field.key}-print`"
              class="cheque-field"
              :class="[`cheque-field-${field.key}`]"
              :style="fieldStyle(field)"
            >
              <span v-if="field.key === 'date'" class="cheque-date-digits">
                <span v-for="(part, index) in formatChequeDate(cheque.date)" :key="index">
                  {{ part }}
                </span>
              </span>
              <span v-else>{{ fieldValue(field) }}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cheque-stage {
  min-width: max-content;
  padding: 24px;
}

.cheque-sheet {
  position: relative;
  width: 203.2mm;
  height: 76.2mm;
  overflow: hidden;
  border: 1px solid #d8c783;
  background:
    linear-gradient(90deg, rgba(194, 148, 43, 0.08) 1px, transparent 1px),
    linear-gradient(180deg, #fff8df 0%, #fbf0c7 100%);
  background-size:
    2mm 100%,
    100% 100%;
  box-shadow: 0 26px 60px rgba(53, 64, 74, 0.16);
  font-family: Arial, Helvetica, sans-serif;
}

.cheque-field-frame {
  position: absolute;
  z-index: 1;
  border: 1px dashed rgba(21, 58, 120, 0.55);
  background: rgba(255, 255, 255, 0.22);
  pointer-events: none;
}

.cheque-field-label {
  position: absolute;
  left: 0;
  top: -18px;
  border-radius: 999px;
  background: #edf2ff;
  padding: 2px 7px;
  color: #153a78;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0;
  white-space: nowrap;
}

.cheque-field {
  position: absolute;
  z-index: 2;
  margin: 0;
  overflow-wrap: normal;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
  text-transform: uppercase;
}

.cheque-field-amountWords {
  overflow: visible;
  white-space: nowrap;
}

.cheque-date-digits {
  display: grid;
  grid-template-columns: repeat(8, 0.52fr);
  gap: 0;
  text-align: center;
}

.cheque-sheet-guides-hidden {
  background: #fffbe8;
}

.cheque-sheet-guides-hidden .cheque-field-frame {
  display: none;
}
</style>
