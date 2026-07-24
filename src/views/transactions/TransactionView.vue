<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AppButton, AppDialog, AppInput, AppTable } from '@/components/app'

const router = useRouter()
const showDialog = ref(false)
const currentPage = ref(1)
const perPage = ref(10)
const transactions = Array.from({ length: 36 }, (_, i) => ({
  id: i + 1,
  reference: `TXN-${String(260701 + i).padStart(6, '0')}`,
  patient: ['Ana Villanueva', 'Miguel Ramos', 'Clarisse Tan', 'John dela Cruz', 'Mia Santos'][
    i % 5
  ],
  service: [
    'Dental Consultation',
    'Teeth Cleaning',
    'Dental X-ray',
    'Orthodontic Adjustment',
    'Tooth Extraction',
  ][i % 5],
  date: `Jul ${String((i % 18) + 1).padStart(2, '0')}, 2026`,
  amount: `₱${[800, 1500, 650, 2200, 1800][i % 5]?.toLocaleString()}`,
  status: i % 7 === 0 ? 'Pending' : 'Paid',
}))
const paginatedTransactions = computed(() =>
  transactions.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value),
)
const totalEntries = transactions.length
const totalPages = Math.ceil(totalEntries / perPage.value)
const paidCount = transactions.filter((transaction) => transaction.status === 'Paid').length
</script>

<template>
  <AppDialog title="Filter Transactions" :show="showDialog" @close="showDialog = false"
    ><template #dialog-content
      ><div class="space-y-5">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Search Filters
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Search transactions by reference number, patient, service, or payment status.
          </p>
        </div>
        <div class="grid gap-5">
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Reference Number</label
            ><AppInput placeholder="TXN-XXXXXX" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Patient Name</label
            ><AppInput placeholder="Patient name" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Service</label
            ><AppInput placeholder="Dental consultation" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate">Payment Status</label
            ><AppInput placeholder="Paid or pending" />
          </div>
        </div></div></template
  ></AppDialog>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#f6fffe_0%,#ffffff_45%,#ebf8fa_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="space-y-4">
          <div
            class="inline-flex items-center rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            Billing & Collections
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Dental Billing</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
              Track treatment charges, payment status, and same-day collections for the dental
              clinic.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="showDialog = true"
            >Filter</AppButton
          ><AppButton btn-theme="outline" class="px-5 py-3 normal-case">Export</AppButton
          ><router-link to="/transactions/add"
            ><AppButton btn-theme="primary" class="px-5 py-3 normal-case"
              >Add Transaction</AppButton
            ></router-link
          >
        </div>
      </div>
      <div class="grid gap-px border-t border-pebble bg-pebble md:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
            Total Transactions
          </p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ totalEntries }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Paid Records</p>
          <p class="mt-2 text-3xl font-black text-onyx">{{ paidCount }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Billing Focus</p>
          <p class="mt-2 text-sm font-medium leading-6 text-onyx">
            Each billing record links the patient, dental service, amount due, and payment state.
          </p>
        </div>
      </div>
    </section>
    <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm">
      <div class="mb-5">
        <h2 class="text-xl font-black text-onyx">Billing Ledger</h2>
        <p class="mt-1 text-sm text-slate">Browse and manage clinic payment records below.</p>
      </div>
      <div class="overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['Reference #', 'Patient', 'Service', 'Date', 'Amount', 'Status', 'Action']"
          :total-entries="totalEntries"
          :total-pages="totalPages"
          :current-page="currentPage"
          @update-pg-num="currentPage = $event"
          ><template #trs
            ><tr
              v-for="transaction in paginatedTransactions"
              :key="transaction.id"
              class="cursor-pointer"
              @click="router.push(`/transactions/${transaction.id}/edit`)"
            >
              <td class="font-medium text-onyx">{{ transaction.reference }}</td>
              <td>{{ transaction.patient }}</td>
              <td>{{ transaction.service }}</td>
              <td>{{ transaction.date }}</td>
              <td class="font-semibold text-onyx">{{ transaction.amount }}</td>
              <td>
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    transaction.status === 'Paid'
                      ? 'bg-emerald-light text-emerald'
                      : 'bg-amber-light text-amber'
                  "
                  >{{ transaction.status }}</span
                >
              </td>
              <td class="text-sm font-semibold text-slate">Edit</td>
            </tr></template
          ></AppTable
        >
      </div>
    </section>
  </div>
</template>
