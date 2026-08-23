<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import {
  AppButton,
  AppInput,
  AppLoadingScreen,
  AppModal,
  AppTable,
  AppTextArea,
  AppToast,
} from '@/components/app'
import { useBusinessPartnerUploads, useBusinessPartners } from '@/composables'
import type { PartnerMemberBatch } from '@/types'
import { formatDateTime } from '@/utils'

const {
  batches,
  selectedBatch,
  loadingBatches,
  uploadingBatch,
  markingPaidBatchId,
  batchError,
  uploadError,
  uploadSuccess,
  batchCurrentPage,
  batchTotalEntries,
  batchTotalPages,
  batchFilters,
  uploadForm,
  batchStats,
  uploadBatch,
  downloadTemplate,
  updateBatchPaymentStatus,
  selectBatch,
  resetUploadForm,
} = useBusinessPartnerUploads()
const { businessPartners, loadingBusinessPartners } = useBusinessPartners()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedUploadFile = ref<File | null>(null)
const selectedBusinessPartnerId = ref('')
const availableSheetNames = ref<string[]>([])
const showUploadPanel = ref(false)
const today = new Date()
const selectedPaymentMonth = ref(String(today.getMonth()))
const selectedPaymentYear = ref(String(today.getFullYear()))
const batchPaymentConfirmation = ref<{
  batch: PartnerMemberBatch
  paid: boolean
  paymentReference: string
} | null>(null)
const toast = ref({
  show: false,
  variant: 'success',
  title: '',
  message: '',
})

const uploadReady = computed(() =>
  Boolean(
    selectedUploadFile.value &&
    uploadForm.companyCode.trim() &&
    uploadForm.companyName.trim() &&
    (!requiresManualPaymentPeriod.value || uploadForm.paymentPeriod.trim()) &&
    uploadForm.paidAt.trim() &&
    uploadForm.sheetName.trim(),
  ),
)

const activeBusinessPartners = computed(() =>
  businessPartners.value.filter((partner) => partner.active),
)

const requiresManualPaymentPeriod = computed(() => {
  const partnerCode = uploadForm.businessPartnerCode.trim().toUpperCase()
  return partnerCode !== 'IWC'
})

const paymentMonthOptions = computed(() => {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'long' })

  return Array.from({ length: 12 }, (_, month) => ({
    label: formatter.format(new Date(2000, month, 1)),
    value: String(month),
  }))
})

const paymentYearOptions = computed(() => {
  const currentYear = today.getFullYear()

  return Array.from({ length: 11 }, (_, index) => String(currentYear + 5 - index))
})

function syncPaymentPeriod() {
  if (!requiresManualPaymentPeriod.value) {
    uploadForm.paymentPeriod = ''
    return
  }

  if (!selectedPaymentMonth.value || !selectedPaymentYear.value) {
    uploadForm.paymentPeriod = ''
    return
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  })

  uploadForm.paymentPeriod = formatter.format(
    new Date(Number(selectedPaymentYear.value), Number(selectedPaymentMonth.value), 1),
  )
}

function openFilePicker() {
  fileInputRef.value?.click()
}

async function handleFileSelection(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null

  selectedUploadFile.value = file
  availableSheetNames.value = []
  uploadForm.sheetName = ''

  if (!file) return

  uploadError.value = ''
  uploadSuccess.value = ''

  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    availableSheetNames.value = workbook.SheetNames || []
    uploadForm.sheetName = availableSheetNames.value[0] || ''

    if (!availableSheetNames.value.length) {
      uploadError.value = 'The selected Excel file does not contain any worksheet.'
    }
  } catch {
    selectedUploadFile.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
    uploadError.value =
      'We could not read that Excel file. Please choose a valid .xlsx or .xls file.'
  }
}

function clearSelectedFile() {
  selectedUploadFile.value = null
  availableSheetNames.value = []
  uploadForm.sheetName = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function resetUploadState() {
  resetUploadForm()
  clearSelectedFile()
  selectedBusinessPartnerId.value = ''
  selectedPaymentMonth.value = String(today.getMonth())
  selectedPaymentYear.value = String(today.getFullYear())
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0')
}

function sanitizeReferenceCompanyCode(value?: string | null) {
  return (
    String(value || 'PARTNER')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 24) || 'PARTNER'
  )
}

function generatePaymentReference(companyCode?: string | null) {
  const now = new Date()
  const date = [
    now.getFullYear(),
    padDatePart(now.getMonth() + 1),
    padDatePart(now.getDate()),
  ].join('')
  const time = [
    padDatePart(now.getHours()),
    padDatePart(now.getMinutes()),
    padDatePart(now.getSeconds()),
  ].join('')

  return `${sanitizeReferenceCompanyCode(companyCode)}-PAY-${date}-${time}`
}

function generateBatchPaymentReference() {
  if (!batchPaymentConfirmation.value) return

  batchPaymentConfirmation.value.paymentReference = generatePaymentReference(
    batchPaymentConfirmation.value.batch.companyCode,
  )
}

async function submitUpload() {
  if (!selectedUploadFile.value) return

  const uploaded = await uploadBatch(selectedUploadFile.value)
  if (!uploaded) return

  clearSelectedFile()
  resetUploadForm()
  showUploadPanel.value = false
}

function openBatchPaymentConfirmation(paid: boolean, batch = selectedBatch.value) {
  if (!batch || markingPaidBatchId.value) return

  batchPaymentConfirmation.value = {
    batch,
    paid,
    paymentReference: paid ? generatePaymentReference(batch.companyCode) : '',
  }
}

function closeBatchPaymentConfirmation() {
  if (markingPaidBatchId.value) return

  batchPaymentConfirmation.value = null
}

async function confirmBatchPaymentStatus() {
  if (!batchPaymentConfirmation.value) return

  const { batch, paid, paymentReference } = batchPaymentConfirmation.value
  const updated = await updateBatchPaymentStatus(batch, paid, paymentReference)

  if (!updated) {
    toast.value = {
      show: true,
      variant: 'error',
      title: 'Batch was not updated',
      message: batchError.value || `Unable to mark this batch as ${paid ? 'received' : 'pending'}.`,
    }
    return
  }

  toast.value = {
    show: true,
    variant: 'success',
    title: paid ? 'Batch marked as received' : 'Batch marked as pending',
    message: `${batch.batchCode} now has all members marked ${paid ? 'received' : 'pending'}.`,
  }
  batchPaymentConfirmation.value = null
}

function closeToast() {
  toast.value.show = false
}

function formatFileSize(value?: number | null) {
  if (!value) return 'N/A'
  if (value < 1024) return `${value} B`

  const kb = value / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`

  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

watch(selectedBusinessPartnerId, (value) => {
  const selectedPartner = activeBusinessPartners.value.find(
    (partner) => String(partner.id) === value,
  )

  if (!selectedPartner) {
    uploadForm.businessPartnerCode = ''
    uploadForm.businessPartnerName = ''
    uploadForm.companyCode = ''
    uploadForm.companyName = ''
    return
  }

  uploadForm.businessPartnerCode = selectedPartner.code
  uploadForm.businessPartnerName = selectedPartner.name
  uploadForm.companyCode = selectedPartner.code
  uploadForm.companyName = selectedPartner.name
})

watch(
  [selectedPaymentMonth, selectedPaymentYear, requiresManualPaymentPeriod],
  () => {
    syncPaymentPeriod()
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#f7efe2_0%,#f5f2eb_44%,#edf2ef_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:p-8">
        <div class="space-y-4">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-tangerine"
          >
            <Icon icon="feather:upload-cloud" class="h-3.5 w-3.5" />
            Partner member imports
          </div>

          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Business Partner Uploads</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate">
              Upload partner Excel lists, create monthly batches, and manage batch-level payment
              tracking for service billing.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-[1.4rem] border border-pebble bg-white/88 px-5 py-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
                Imported batches
              </p>
              <p class="mt-3 text-3xl font-black text-onyx">{{ batchStats.totalBatches }}</p>
              <p class="mt-2 text-sm text-slate">Uploaded partner files stored in the database.</p>
            </div>
            <div class="rounded-[1.4rem] border border-pebble bg-white/88 px-5 py-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
                Active batches
              </p>
              <p class="mt-3 text-3xl font-black text-onyx">{{ batchStats.activeBatches }}</p>
              <p class="mt-2 text-sm text-slate">
                Imports currently included in the partner member list.
              </p>
            </div>
            <div class="rounded-[1.4rem] border border-pebble bg-white/88 px-5 py-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
                Uploaded rows
              </p>
              <p class="mt-3 text-3xl font-black text-onyx">{{ batchStats.totalMembers }}</p>
              <p class="mt-2 text-sm text-slate">Rows currently stored across uploaded batches.</p>
            </div>
          </div>
        </div>

        <div class="rounded-[1.6rem] border border-pebble bg-white/90 p-5 shadow-sm">
          <div class="flex items-start gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(145deg,#efe4cf_0%,#e2ece9_100%)] text-tangerine shadow-sm"
            >
              <Icon icon="feather:database" class="h-6 w-6" />
            </div>
            <div>
              <p class="text-sm font-bold text-onyx">Import workflow</p>
              <p class="mt-1 text-sm leading-6 text-slate">
                Each import becomes a monthly batch. We sync members by identity, refresh the
                company's current partner list, and keep the payment status for that uploaded month.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[1.75rem] border border-pebble bg-white p-5 shadow-sm lg:p-6">
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-smoke">
            Batch upload
          </p>
          <h2 class="mt-2 text-xl font-black text-onyx">Import a new partner Excel file</h2>
          <p class="mt-1 text-sm text-slate">
            Read the Excel contents, sync recurring members for the selected company, and create
            this month's payment batch without duplicating the same person record.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-3 rounded-full border border-pebble bg-cloud px-4 py-2 text-sm font-semibold text-onyx transition hover:border-tangerine/40 hover:bg-white"
          @click="showUploadPanel = !showUploadPanel"
        >
          <span
            class="relative h-6 w-11 rounded-full transition"
            :class="showUploadPanel ? 'bg-emerald' : 'bg-smoke/35'"
          >
            <span
              class="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition"
              :class="showUploadPanel ? 'left-6' : 'left-1'"
            />
          </span>
          Excel upload
        </button>
      </div>

      <div v-if="showUploadPanel" class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div class="grid gap-5 md:grid-cols-2">
          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-onyx">Business Partner</label>
            <select
              v-model="selectedBusinessPartnerId"
              class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] px-4 py-3.5 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
              :disabled="loadingBusinessPartners"
            >
              <option value="">
                {{
                  loadingBusinessPartners
                    ? 'Loading business partners...'
                    : activeBusinessPartners.length
                      ? 'Select a business partner'
                      : 'No active business partners available'
                }}
              </option>
              <option
                v-for="partner in activeBusinessPartners"
                :key="partner.id"
                :value="String(partner.id)"
              >
                {{ partner.code }} - {{ partner.name }}
              </option>
            </select>
            <p class="mt-2 text-xs text-slate">
              Use the controlled list from the Business Partners page so upload values stay
              consistent.
            </p>
          </div>
          <AppInput
            v-model="uploadForm.companyCode"
            label="Company Code"
            placeholder="Selected from business partner"
            icon="feather:hash"
            readonly
          />
          <AppInput
            v-model="uploadForm.companyName"
            label="Company Name"
            placeholder="Selected from business partner"
            icon="feather:home"
            readonly
          />
          <AppInput
            v-model="uploadForm.paidAt"
            label="Received Date"
            type="date"
            icon="feather:check-circle"
          />
          <div v-if="requiresManualPaymentPeriod" class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-onyx">Payment Period</label>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="relative">
                <Icon
                  icon="feather:calendar"
                  class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                />
                <select
                  v-model="selectedPaymentMonth"
                  class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] py-3.5 pr-4 pl-11 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
                >
                  <option value="">Select month</option>
                  <option
                    v-for="paymentMonth in paymentMonthOptions"
                    :key="paymentMonth.value"
                    :value="paymentMonth.value"
                  >
                    {{ paymentMonth.label }}
                  </option>
                </select>
              </div>
              <select
                v-model="selectedPaymentYear"
                class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] py-3.5 pr-4 pl-11 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
              >
                <option value="">Select year</option>
                <option
                  v-for="paymentYear in paymentYearOptions"
                  :key="paymentYear"
                  :value="paymentYear"
                >
                  {{ paymentYear }}
                </option>
              </select>
            </div>
          </div>
          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-onyx">Upload Notes</label>
            <AppTextArea
              v-model="uploadForm.remarks"
              placeholder="Optional notes about the file, coverage period, or partner remarks."
              :rows="4"
            />
          </div>
        </div>

        <div
          class="rounded-[1.5rem] border border-pebble bg-[linear-gradient(145deg,#f8f1e6_0%,#eef3ee_100%)] p-5"
        >
          <input
            ref="fileInputRef"
            type="file"
            class="hidden"
            accept=".xlsx,.xls"
            @change="handleFileSelection"
          />

          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
            Excel import source
          </p>

          <button
            type="button"
            class="mt-4 flex w-full items-center justify-center gap-3 rounded-[1.4rem] border border-dashed border-[#d7c29f] bg-white/80 px-4 py-6 text-sm font-semibold text-[#7a5922] transition hover:border-[#c59a42] hover:bg-white"
            @click="openFilePicker"
          >
            <Icon icon="feather:file-plus" class="h-5 w-5" />
            {{ selectedUploadFile ? 'Replace Excel file' : 'Choose Excel file to import' }}
          </button>

          <div
            v-if="selectedUploadFile"
            class="mt-4 rounded-[1.3rem] border border-pebble bg-white/88 px-4 py-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-bold text-onyx">{{ selectedUploadFile.name }}</p>
                <p class="mt-1 text-xs text-slate">
                  {{ formatFileSize(selectedUploadFile.size) }}
                </p>
              </div>
              <button
                type="button"
                class="rounded-xl bg-fog px-3 py-2 text-xs font-semibold text-slate transition hover:bg-pebble hover:text-onyx"
                @click="clearSelectedFile"
              >
                Remove
              </button>
            </div>

            <div v-if="availableSheetNames.length" class="mt-4">
              <label class="mb-2 block text-sm font-medium text-onyx">Worksheet to import</label>
              <select
                v-model="uploadForm.sheetName"
                class="w-full rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] px-4 py-3.5 text-onyx outline-none transition focus:border-tangerine focus:ring-4 focus:ring-focus-ring"
              >
                <option
                  v-for="sheetName in availableSheetNames"
                  :key="sheetName"
                  :value="sheetName"
                >
                  {{ sheetName }}
                </option>
              </select>
              <p class="mt-2 text-xs text-slate">
                Choose which worksheet in this workbook should be imported.
              </p>
            </div>
          </div>

          <p v-if="uploadError" class="mt-4 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
            {{ uploadError }}
          </p>
          <p
            v-if="uploadSuccess"
            class="mt-4 rounded-xl bg-emerald-light px-4 py-3 text-sm text-emerald"
          >
            {{ uploadSuccess }}
          </p>

          <div class="mt-5 flex flex-wrap gap-3">
            <AppButton
              btn-theme="primary"
              class="normal-case"
              :disabled="!uploadReady || uploadingBatch"
              @click="submitUpload"
            >
              <Icon
                :icon="uploadingBatch ? 'feather:loader' : 'feather:upload-cloud'"
                class="h-4 w-4"
                :class="uploadingBatch ? 'animate-spin' : ''"
              />
              {{ uploadingBatch ? 'Importing...' : 'Import Batch' }}
            </AppButton>
            <AppButton btn-theme="outline" class="normal-case" @click="downloadTemplate">
              <Icon icon="feather:download" class="h-4 w-4" />
              Download Template
            </AppButton>
            <AppButton btn-theme="outline" class="normal-case" @click="resetUploadState">
              Reset
            </AppButton>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[1.75rem] border border-pebble bg-white p-5 shadow-sm lg:p-6">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-xl font-black text-onyx">Active Batch Imports</h2>
          <p class="mt-1 text-sm text-slate">
            Review active uploads per company and update payment status by batch.
          </p>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <AppInput
            v-model="batchFilters.companyCode"
            placeholder="Filter company code"
            icon="feather:hash"
          />
          <AppInput
            v-model="batchFilters.companyName"
            placeholder="Filter company name"
            icon="feather:search"
          />
        </div>
      </div>

      <p v-if="batchError" class="mb-4 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
        {{ batchError }}
      </p>

      <AppLoadingScreen
        v-if="loadingBatches"
        title="Loading batch imports"
        message="Please wait while we retrieve the uploaded partner member files."
      />

      <div v-else class="overflow-hidden rounded-[1.5rem] border border-pebble">
        <AppTable
          :theads="['Batch', 'Company', 'Rows', 'Uploaded', 'Action']"
          :total-entries="batchTotalEntries"
          :total-pages="batchTotalPages"
          :current-page="batchCurrentPage"
          @update-pg-num="batchCurrentPage = $event"
        >
          <template #trs>
            <tr v-if="!batches.length">
              <td colspan="5" class="w-full py-14! text-center!">
                <div class="flex w-full flex-col items-center">
                  <span
                    class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog text-smoke"
                  >
                    <Icon icon="feather:archive" class="h-5 w-5" />
                  </span>
                  <p class="mt-3 font-semibold text-onyx">No batches found</p>
                  <p class="mt-1 text-sm text-slate">
                    Import the first Excel file to start tracking members.
                  </p>
                </div>
              </td>
            </tr>
            <tr
              v-for="batch in batches"
              v-else
              :key="batch.id"
              class="cursor-pointer"
              :class="selectedBatch?.id === batch.id ? 'bg-apricot' : ''"
              @click="selectBatch(batch)"
            >
              <td>
                <div>
                  <p class="font-semibold text-onyx">{{ batch.batchCode }}</p>
                  <p class="mt-1 text-xs text-slate">{{ batch.sourceFilename }}</p>
                </div>
              </td>
              <td>
                <div>
                  <p class="font-semibold text-onyx">{{ batch.companyCode }}</p>
                  <p class="mt-1 text-xs text-slate">{{ batch.companyName }}</p>
                </div>
              </td>
              <td>
                <div class="space-y-1">
                  <p class="font-semibold text-onyx">{{ batch.totalRows }} total</p>
                  <p class="text-xs text-emerald">{{ batch.paidRows }} received</p>
                  <p class="text-xs text-amber">{{ batch.unpaidRows }} pending</p>
                </div>
              </td>
              <td>
                <div>
                  <p class="font-semibold text-onyx">{{ formatDateTime(batch.uploadedAt) }}</p>
                  <p class="mt-1 text-xs text-slate">{{ batch.uploadedByName }}</p>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="flex justify-end gap-2">
                  <button
                    v-if="batch.unpaidRows > 0"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-[linear-gradient(180deg,#e8f7ed_0%,#d9f0e2_100%)] px-3.5 py-2 text-xs font-semibold text-emerald shadow-[0_10px_20px_rgba(34,141,82,0.1)] transition hover:border-emerald/50 hover:bg-[linear-gradient(180deg,#f2fbf5_0%,#e3f5eb_100%)]"
                    :disabled="markingPaidBatchId === batch.id"
                    @click.stop="openBatchPaymentConfirmation(true, batch)"
                  >
                    <Icon
                      :icon="
                        markingPaidBatchId === batch.id ? 'feather:loader' : 'feather:check-circle'
                      "
                      class="size-4"
                      :class="markingPaidBatchId === batch.id ? 'animate-spin' : ''"
                    />
                    {{ markingPaidBatchId === batch.id ? 'Saving...' : 'Mark All Received' }}
                  </button>
                  <button
                    v-if="batch.paidRows > 0"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full border border-[#cbd7dd] bg-[linear-gradient(180deg,#edf5f7_0%,#e2ecef_100%)] px-3.5 py-2 text-xs font-semibold text-[#2d5562] shadow-[0_10px_20px_rgba(54,89,99,0.08)] transition hover:border-[#9bb6bf] hover:bg-[linear-gradient(180deg,#f6fbfc_0%,#eaf1f3_100%)]"
                    :disabled="markingPaidBatchId === batch.id"
                    @click.stop="openBatchPaymentConfirmation(false, batch)"
                  >
                    <Icon
                      :icon="
                        markingPaidBatchId === batch.id ? 'feather:loader' : 'feather:rotate-ccw'
                      "
                      class="size-4"
                      :class="markingPaidBatchId === batch.id ? 'animate-spin' : ''"
                    />
                    {{ markingPaidBatchId === batch.id ? 'Saving...' : 'Mark All Pending' }}
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </AppTable>
      </div>
    </section>

    <AppModal
      :show="Boolean(batchPaymentConfirmation)"
      :title="
        batchPaymentConfirmation?.paid ? 'Mark batch as received' : 'Mark batch as pending payment'
      "
      subtitle="Payment received confirmation"
      max-width="sm:max-w-lg"
      @close="closeBatchPaymentConfirmation"
    >
      <div v-if="batchPaymentConfirmation" class="space-y-5 px-6 py-5">
        <div class="flex items-start gap-4">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            :class="
              batchPaymentConfirmation.paid
                ? 'bg-emerald-light text-emerald'
                : 'bg-fog text-[#2d5562]'
            "
          >
            <Icon
              :icon="batchPaymentConfirmation.paid ? 'feather:check-circle' : 'feather:rotate-ccw'"
              class="h-5 w-5"
            />
          </span>
          <div>
            <p class="font-bold text-onyx">{{ batchPaymentConfirmation.batch.batchCode }}</p>
            <p class="mt-1 text-sm text-slate">
              {{ batchPaymentConfirmation.batch.companyCode }} ·
              {{ batchPaymentConfirmation.batch.companyName }}
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-pebble bg-cloud px-4 py-4">
          <div class="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Total</p>
              <p class="mt-1 font-bold text-onyx">
                {{ batchPaymentConfirmation.batch.totalRows }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Received</p>
              <p class="mt-1 font-bold text-emerald">
                {{ batchPaymentConfirmation.batch.paidRows }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Pending</p>
              <p class="mt-1 font-bold text-amber">
                {{ batchPaymentConfirmation.batch.unpaidRows }}
              </p>
            </div>
          </div>
        </div>

        <p class="text-sm leading-6 text-slate">
          This will mark every member in this batch as
          {{ batchPaymentConfirmation.paid ? 'received' : 'pending' }} and refresh the batch totals.
        </p>

        <div v-if="batchPaymentConfirmation.paid" class="space-y-2">
          <AppInput
            v-model="batchPaymentConfirmation.paymentReference"
            label="Payment Reference No."
            placeholder="Required reference no."
            icon="feather:hash"
          />
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-semibold text-tangerine transition hover:text-tangerine-dark"
            @click="generateBatchPaymentReference"
          >
            <Icon icon="feather:refresh-cw" class="h-4 w-4" />
            Generate reference
          </button>
        </div>
        <p v-else class="rounded-xl bg-fog px-4 py-3 text-sm text-slate">
          Existing payment reference numbers for this batch will be cleared.
        </p>
      </div>

      <template #footer>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AppButton
            btn-theme="outline"
            class="normal-case"
            :disabled="Boolean(markingPaidBatchId)"
            @click="closeBatchPaymentConfirmation"
          >
            Cancel
          </AppButton>
          <AppButton
            btn-theme="primary"
            class="normal-case"
            :disabled="
              Boolean(markingPaidBatchId) ||
              Boolean(
                batchPaymentConfirmation?.paid && !batchPaymentConfirmation.paymentReference.trim(),
              )
            "
            @click="confirmBatchPaymentStatus"
          >
            <Icon
              :icon="
                markingPaidBatchId
                  ? 'feather:loader'
                  : batchPaymentConfirmation?.paid
                    ? 'feather:check-circle'
                    : 'feather:rotate-ccw'
              "
              class="h-4 w-4"
              :class="markingPaidBatchId ? 'animate-spin' : ''"
            />
            {{
              markingPaidBatchId
                ? 'Saving...'
                : batchPaymentConfirmation?.paid
                  ? 'Mark All Received'
                  : 'Mark All Pending'
            }}
          </AppButton>
        </div>
      </template>
    </AppModal>

    <AppToast
      :show="toast.show"
      :variant="toast.variant"
      :title="toast.title"
      :message="toast.message"
      @close="closeToast"
    />
  </div>
</template>
