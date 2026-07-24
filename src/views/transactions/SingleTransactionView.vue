<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { AppButton, AppInput } from '@/components/app'

const route = useRoute()
const router = useRouter()
const isEditMode = computed(() => !!route.params.id)
const transactionData = ref(
  isEditMode.value
    ? {
        reference: 'TXN-260701',
        patient: 'Ana Villanueva',
        email: 'ana.villanueva@email.com',
        service: 'Dental Consultation',
        date: '2026-07-01',
        amount: '800',
        method: 'Cash',
        status: 'Paid',
        notes: 'Initial consultation payment.',
      }
    : {
        reference: '',
        patient: '',
        email: '',
        service: '',
        date: '',
        amount: '',
        method: '',
        status: 'Paid',
        notes: '',
      },
)
function save() {
  router.push('/transactions')
}
</script>

<template>
  <section class="rounded-[1.5rem] border border-pebble bg-white p-6 shadow-sm lg:p-7">
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-black text-onyx">
          {{ isEditMode ? 'Edit Billing Record' : 'Create Billing Record' }}
        </h2>
        <p class="mt-1 max-w-2xl text-sm leading-6 text-slate">
          Capture treatment charges, payment method, and collection notes in one billing form.
        </p>
      </div>
      <AppButton
        btn-theme="outline"
        class="px-5 py-3 normal-case"
        @click="router.push('/transactions')"
        >Back to List</AppButton
      >
    </div>
    <div class="mb-6 grid gap-4 md:grid-cols-3">
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Mode</p>
        <p class="mt-2 text-2xl font-black text-onyx">{{ isEditMode ? 'Edit' : 'Create' }}</p>
      </div>
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Record Type</p>
        <p class="mt-2 text-sm font-medium leading-6 text-onyx">Dental service billing record</p>
      </div>
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Status</p>
        <p class="mt-2 text-2xl font-black text-onyx">{{ transactionData.status }}</p>
      </div>
    </div>
    <form class="grid gap-6 xl:grid-cols-[280px_1fr]" @submit.prevent="save">
      <div
        class="rounded-[1.5rem] border border-pebble bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-6"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Transaction Panel</p>
        <div
          class="mt-5 flex flex-col items-center rounded-[1.5rem] border border-dashed border-pebble bg-white p-6"
        >
          <div
            class="flex h-32 w-32 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fff4e8_0%,#ffe1bf_100%)]"
          >
            <Icon icon="feather:credit-card" class="size-16 text-tangerine" />
          </div>
          <p class="mt-4 text-sm font-semibold text-onyx">
            {{ transactionData.patient || 'New Transaction' }}
          </p>
          <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate">Clinic Billing Record</p>
        </div>
      </div>
      <div class="space-y-6">
        <div class="rounded-[1.5rem] border border-pebble bg-snow p-6">
          <h2 class="text-xl font-black text-onyx">Patient & Treatment Information</h2>
          <div class="mt-5 grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Reference Number</label
              ><AppInput v-model="transactionData.reference" placeholder="TXN-XXXXXX" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Patient Name</label
              ><AppInput v-model="transactionData.patient" placeholder="Patient name" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Email Address</label
              ><AppInput v-model="transactionData.email" placeholder="patient@email.com" />
            </div>
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Service</label
              ><AppInput v-model="transactionData.service" placeholder="Dental consultation" />
            </div>
          </div>
        </div>
        <div class="rounded-[1.5rem] border border-pebble bg-snow p-6">
          <h2 class="text-xl font-black text-onyx">Payment Details</h2>
          <div class="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Transaction Date</label
              ><AppInput v-model="transactionData.date" type="date" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Amount</label
              ><AppInput v-model="transactionData.amount" type="number" placeholder="0.00" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Payment Method</label
              ><select v-model="transactionData.method">
                <option disabled value="">Select payment method</option>
                <option>Cash</option>
                <option>GCash</option>
                <option>Bank Transfer</option>
                <option>Card</option>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Payment Status</label
              ><select v-model="transactionData.status">
                <option>Paid</option>
                <option>Pending</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Notes</label
              ><textarea
                v-model="transactionData.notes"
                rows="3"
                placeholder="Optional payment notes"
                class="w-full resize-y rounded-md border border-gray-200 bg-white px-4 py-3 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <AppButton
            type="button"
            btn-theme="outline"
            class="px-5 py-3 normal-case"
            @click="router.push('/transactions')"
            >Cancel</AppButton
          ><AppButton type="submit" btn-theme="primary" class="px-5 py-3 normal-case"
            ><Icon icon="feather:save" class="size-4" />{{
              isEditMode ? 'Update Transaction' : 'Save Transaction'
            }}</AppButton
          >
        </div>
      </div>
    </form>
  </section>
</template>
