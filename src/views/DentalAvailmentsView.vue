<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import {
  AppButton,
  AppDialog,
  AppInput,
  AppLoadingScreen,
  AppSearchSelect,
  AppTextArea,
  AppToast,
} from '@/components/app'
import { useClinics, useDentalAvailments, useDentists, useProcedures } from '@/composables'
import type { DentalAvailmentMemberOption, DentalMemberSearchScope } from '@/types'
import { formatDate, formatMoney } from '@/utils'

const {
  approvalLookup,
  createAvailment,
  createdAvailment,
  creating,
  errorMessage,
  form,
  generateApprovalNo,
  generatingApprovalNo,
  lookingUp,
  lookupForm,
  memberSearchErrorMessage,
  memberSearchResults,
  readByApprovalNo,
  resetForm,
  searchDentalMembers,
  searchingMembers,
  successMessage,
} = useDentalAvailments()

const { procedures, loadingProcedures } = useProcedures()
const {
  dentists,
  fetchDentists,
  filters: dentistFilters,
  loading: loadingDentists,
} = useDentists({ perPage: 20 })
const { clinics, fetchClinics, filters: clinicFilters, loading: loadingClinics } = useClinics()

const selectedMember = ref<DentalAvailmentMemberOption | null>(null)
const memberSearch = ref('')
const memberSource = ref<DentalMemberSearchScope>('ims_all')
const selectedProcedureId = ref<string | number | null>(null)
const procedureSearch = ref('')
const selectedDentistId = ref<string | number | null>(null)
const dentistSearch = ref('')
const dentistOptions = ref<Array<{ value: number; label: string; description: string }>>([])
const retainedDentist = ref<{ value: number; label: string; description: string } | null>(null)
const retainedDentistRecord = ref<Record<string, unknown> | null>(null)
const selectedClinicId = ref<string | number | null>(null)
const clinicSearch = ref('')
const retainedClinicRecord = ref<Record<string, unknown> | null>(null)
const memberSearchSubmitted = ref(false)
const showCreateConfirmation = ref(false)
const toast = ref({
  show: false,
  variant: 'success',
  title: '',
  message: '',
})

const legacyRateAliases: Record<string, string> = {
  TWLB: 'TWLB',
  OP: 'OP',
  STE: 'STE',
  TF: 'TF',
  AD: 'AD',
  RJ: 'RJ',
  LC: 'LC',
  PF: 'PF',
  CON: 'CON',
  CONS: 'CON',
  CONSULT: 'CON',
  CONSULTATION: 'CON',
  PPEICF: 'PPE_ICF',
  CAN: 'CAN',
}

const activeProcedureOptions = computed(() =>
  procedures.value
    .filter((procedure) => procedure.active)
    .map((procedure) => ({
      value: procedure.id,
      label: procedure.name,
      description: [procedure.code, procedure.price ? `PHP ${procedure.price}` : 'No default price']
        .filter(Boolean)
        .join(' · '),
    })),
)

const procedureNameMap = computed(
  () => new Map(procedures.value.map((procedure) => [procedure.code.trim().toUpperCase(), procedure.name])),
)

const createReady = computed(
  () =>
    form.memberName.trim() &&
    form.availDate &&
    form.procedureItems.length > 0 &&
    form.dentistName.trim() &&
    form.clinicName.trim() &&
    form.procedureItems.every((item) => item.procedures && Number(item.amount) >= 0),
)
const selectedSourceLabel = computed(
  () => memberSourceOptions.find((option) => option.value === memberSource.value)?.label || '',
)

const memberSourceOptions: Array<{
  value: DentalMemberSearchScope
  label: string
  description: string
}> = [
  {
    value: 'ims_all',
    label: 'IMS all members',
    description: 'Search all IMS members with dental coverage.',
  },
  {
    value: 'partner_all',
    label: 'Partner all members',
    description: 'Search every uploaded partner member.',
  },
]

let dentistSearchTimer: number | undefined
let clinicSearchTimer: number | undefined

const formatLegacyDentistName = (dentist: { dentistname?: string | null; firstname?: string | null; middleinitial?: string | null; lastname?: string | null }) => {
  if (dentist.dentistname?.trim()) return dentist.dentistname.trim()

  const firstName = String(dentist.firstname || '').trim()
  const middleInitial = String(dentist.middleinitial || '').trim().replace(/\.+$/, '')
  const lastName = String(dentist.lastname || '').trim()
  const rightSide = [firstName, middleInitial ? `${middleInitial}.` : ''].filter(Boolean).join(' ').trim()

  return [lastName, rightSide].filter(Boolean).join(', ').trim()
}




const clinicOptions = computed(() =>
  clinics.value.map((clinic) => ({
    value: clinic.clinicidno,
    label: clinic.clinicname,
    description: [clinic.cliniccode, clinic.city, clinic.province].filter(Boolean).join(' | '),
  })),
)

const procedureTotal = computed(() =>
  form.procedureItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
)
const toothNumberOptions = ['ALL', ...Array.from({ length: 32 }, (_, index) => String(index + 1))]

function normalizeLegacyRateKey(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return legacyRateAliases[normalized] || null
}

function toLegacyRateNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function readLegacyRateValue(source: Record<string, unknown> | undefined, rateKey: string) {
  if (!source) return null

  const candidates = [
    rateKey,
    rateKey.toLowerCase(),
    rateKey.toUpperCase(),
    rateKey === 'PPE_ICF' ? 'ppe_icf' : null,
    rateKey === 'CAN' ? 'can' : null,
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const parsed = toLegacyRateNumber(source[candidate])
    if (parsed !== null) return parsed
  }

  return null
}

function resolveLegacyProcedureAmount() {
  const rateKey = normalizeLegacyRateKey(form.procedures.trim())
  if (!rateKey) return false

  const selectedDentist =
    (dentists.value.find(
      (dentist) => String(dentist.dentistidno) === String(selectedDentistId.value),
    ) as Record<string, unknown> | undefined) || retainedDentistRecord.value || undefined
  const selectedClinic =
    (clinics.value.find(
      (clinic) => String(clinic.clinicidno) === String(selectedClinicId.value),
    ) as Record<string, unknown> | undefined) || retainedClinicRecord.value || undefined

  const dentistAmount = readLegacyRateValue(selectedDentist, rateKey)
  const clinicAmount = ['TWLB', 'OP', 'STE', 'TF', 'AD', 'RJ', 'LC', 'PF', 'CON'].includes(rateKey)
    ? readLegacyRateValue(selectedClinic, rateKey)
    : null
  const resolvedAmount = dentistAmount ?? clinicAmount

  if (resolvedAmount === null) return false

  form.amount = String(resolvedAmount)
  return true
}

function closeToast() {
  toast.value.show = false
}

function selectMemberSource(value: DentalMemberSearchScope) {
  memberSource.value = value
  memberSearchSubmitted.value = false
  clearSelectedMember()
  memberSearchResults.value = []
}

function selectMember(member: DentalAvailmentMemberOption) {
  selectedMember.value = member
  memberSearch.value = member.memberName
  memberSearchResults.value = []

  form.memberName = member.memberName
  form.planHolderId = String(member.planHolderId || '')
  form.clientCode = String(member.clientCode || '')
  form.officeCode = String(member.officeCode || '')
  form.memberSource = member.source
}

function clearSelectedMember() {
  selectedMember.value = null
  form.memberName = ''
  form.planHolderId = ''
  form.clientCode = ''
  form.officeCode = ''
  form.memberSource = ''
}

function changeSelectedMember() {
  clearSelectedMember()
  memberSearch.value = ''
  memberSearchResults.value = []
  memberSearchSubmitted.value = false
}

function resetAvailmentForm() {
  resetForm()
  selectedMember.value = null
  selectedProcedureId.value = null
  procedureSearch.value = ''
  selectedDentistId.value = null
  dentistSearch.value = ''
  selectedClinicId.value = null
  clinicSearch.value = ''
  clinicFilters.dentistId = ''
  clinicFilters.clinicName = ''
  memberSearch.value = ''
  memberSearchSubmitted.value = false
}

async function submitMemberSearch() {
  clearSelectedMember()
  memberSearchSubmitted.value = true
  await searchDentalMembers(memberSearch.value, memberSource.value)
}

function addProcedureItem() {
  if (!form.procedures.trim() || form.amount === '') return

  form.procedureItems.push({
    procedures: form.procedures.trim(),
    amount: Number(form.amount),
    toothNo: form.toothNo.trim() || undefined,
  })

  selectedProcedureId.value = null
  procedureSearch.value = ''
  form.procedures = ''
  form.amount = ''
  form.toothNo = ''
}

function removeProcedureItem(index: number) {
  form.procedureItems.splice(index, 1)
}

function procedureLabel(code: string) {
  const procedure = procedures.value.find((item) => item.code === code)
  return procedure ? `${procedure.code} | ${procedure.name}` : code
}

function procedureName(value?: string | null) {
  const procedureValue = value?.trim()
  if (!procedureValue) return 'N/A'

  return procedureValue
    .split(',')
    .map((part) => {
      const normalizedPart = part.trim()
      if (!normalizedPart) return ''

      return procedureNameMap.value.get(normalizedPart.toUpperCase()) || normalizedPart
    })
    .filter(Boolean)
    .join(', ')
}

async function submitCreate() {
  const created = await createAvailment()

  toast.value = {
    show: true,
    variant: created ? 'success' : 'error',
    title: created ? 'Availment created' : 'Availment was not created',
    message: created
      ? successMessage.value || 'Dental availment was created.'
      : errorMessage.value || 'Please review the form and try again.',
  }
}

function openCreateConfirmation() {
  if (!createReady.value || creating.value) return
  showCreateConfirmation.value = true
}

function closeCreateConfirmation() {
  if (creating.value) return
  showCreateConfirmation.value = false
}

async function confirmCreate() {
  await submitCreate()
  if (!errorMessage.value) {
    showCreateConfirmation.value = false
  }
}

async function handleGenerateApprovalNo() {
  const generated = await generateApprovalNo()

  toast.value = {
    show: true,
    variant: generated ? 'success' : 'error',
    title: generated ? 'Approval no. generated' : 'Unable to generate',
    message: generated
      ? `Approval number ${form.approvalNo} is ready.`
      : errorMessage.value || 'Please try generating again.',
  }
}

async function submitLookup() {
  const found = await readByApprovalNo()

  toast.value = {
    show: true,
    variant: found ? 'success' : 'error',
    title: found ? 'Approval found' : 'Approval not found',
    message: found
      ? `${approvalLookup.value?.itemCount || 0} availment item(s) loaded.`
      : errorMessage.value || 'Unable to find that approval number.',
  }
}

function memberDescription(member: DentalAvailmentMemberOption) {
  return [
    member.source === 'partner' ? 'Partner upload' : 'IMS',
    member.planCode,
    member.companyName,
    member.policyNumber,
    member.cardNo,
    member.idNo,
    member.areaLocation,
  ]
    .filter(Boolean)
    .join(' | ')
}

function memberPaymentStatus(member: DentalAvailmentMemberOption) {
  if (member.source === 'partner') return member.paid ? 'Marked paid' : 'Unpaid'
  return member.coveredUntil ? 'Cleared payment found' : 'No cleared payment'
}

watch(memberSearch, (search) => {
  memberSearchSubmitted.value = false
  memberSearchResults.value = []
  if (selectedMember.value && search !== selectedMember.value.memberName) {
    clearSelectedMember()
  }
})

watch(selectedProcedureId, (value) => {
  const selected = procedures.value.find((procedure) => String(procedure.id) === String(value))
  if (!selected) return

  form.procedures = selected.code
  if (!resolveLegacyProcedureAmount() && selected.price !== undefined) {
    form.amount = String(selected.price)
  }
})

watch(selectedDentistId, (value) => {
  const selected = dentists.value.find((dentist) => String(dentist.dentistidno) === String(value))
  if (!selected) return

  retainedDentistRecord.value = selected as Record<string, unknown>
  form.dentistId = String(selected.dentistidno)
  form.dentistName = selected.dentistname
  selectedClinicId.value = null
  retainedClinicRecord.value = null
  form.clinicId = ''
  form.clinicName = ''
  clinicSearch.value = ''
  clinicFilters.clinicName = ''
  void fetchClinics()
  resolveLegacyProcedureAmount()
})

watch(
  [dentists, selectedDentistId],
  ([availableDentists, selectedId]) => {
    const options = availableDentists.map((dentist) => ({
      value: dentist.dentistidno,
      label: formatLegacyDentistName(dentist),
      description: [dentist.dentistcode, dentist.prcno, dentist.specialization]
        .filter(Boolean)
        .join(' | '),
    }))
    const normalizedSelectedId = selectedId == null ? null : Number(selectedId)
    const matchedDentist = options.find((option) => option.value === normalizedSelectedId)

    if (matchedDentist) {
      retainedDentist.value = matchedDentist
      retainedDentistRecord.value =
        (availableDentists.find((dentist) => dentist.dentistidno === normalizedSelectedId) as
          | Record<string, unknown>
          | undefined) || retainedDentistRecord.value
    } else if (normalizedSelectedId == null) {
      retainedDentist.value = null
      retainedDentistRecord.value = null
    } else if (retainedDentist.value?.value !== normalizedSelectedId) {
      retainedDentist.value = {
        value: normalizedSelectedId,
        label: form.dentistName || 'Selected dentist',
        description: 'Currently selected dentist',
      }
    }

    if (
      normalizedSelectedId != null &&
      !options.some((option) => option.value === normalizedSelectedId) &&
      retainedDentist.value
    ) {
      options.unshift(retainedDentist.value)
    }

    dentistOptions.value = options
  },
  { immediate: true },
)

watch(dentistSearch, (search) => {
  window.clearTimeout(dentistSearchTimer)

  dentistSearchTimer = window.setTimeout(() => {
    dentistFilters.dentistName = search.trim()
    void fetchDentists()
  }, 350)
})

watch(selectedClinicId, (value) => {
  const selected = clinics.value.find((clinic) => String(clinic.clinicidno) === String(value))
  if (!selected) return

  retainedClinicRecord.value = selected as Record<string, unknown>
  form.clinicId = String(selected.clinicidno)
  form.clinicName = selected.clinicname
  resolveLegacyProcedureAmount()
})

watch(
  [clinics, selectedClinicId],
  ([availableClinics, selectedId]) => {
    const normalizedSelectedId = selectedId == null ? null : Number(selectedId)

    if (normalizedSelectedId == null) {
      retainedClinicRecord.value = null
      return
    }

    const matchedClinic = availableClinics.find(
      (clinic) => String(clinic.clinicidno) === String(normalizedSelectedId),
    )
    if (matchedClinic) {
      retainedClinicRecord.value = matchedClinic as Record<string, unknown>
    }
  },
  { immediate: true },
)

watch(clinicSearch, (search) => {
  window.clearTimeout(clinicSearchTimer)

  clinicSearchTimer = window.setTimeout(() => {
    clinicFilters.clinicName = search.trim()
    void fetchClinics()
  }, 350)
})


</script>

<template>
  <AppDialog
    title="Create Approval"
    :show="showCreateConfirmation"
    :disabled="Boolean(creating)"
    :confirm-label="creating ? 'Creating...' : 'Confirm Create'"
    max-width="sm:max-w-3xl"
    @close="closeCreateConfirmation"
    @confirm="confirmCreate"
  >
    <template #dialog-content>
      <div class="space-y-4">
        <div
          class="rounded-[1.5rem] border border-tangerine/15 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)] p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-tangerine">
            Approval confirmation
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Review the approval details before creating the availment record.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Approval</p>
            <p class="mt-2 font-mono text-sm font-bold text-onyx">
              {{ form.approvalNo || 'Auto generate' }}
            </p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Availment Date</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ formatDate(form.availDate) }}</p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4 sm:col-span-2">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Member</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ form.memberName || 'N/A' }}</p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Dentist</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ form.dentistName || 'N/A' }}</p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Clinic</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ form.clinicName || 'N/A' }}</p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Procedure Rows</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ form.procedureItems.length }}</p>
          </div>
          <div class="rounded-2xl border border-pebble bg-white px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.2em] text-smoke">Total Amount</p>
            <p class="mt-2 text-sm font-bold text-onyx">{{ formatMoney(procedureTotal) }}</p>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>

  <div class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="space-y-4">
          <div
            class="inline-flex items-center rounded-full border border-tangerine/20 bg-tangerine-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tangerine"
          >
            Dental Approval Desk
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight text-onyx">Dental Availments</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate">
              Search members, build procedure rows, generate approvals, and verify existing approval
              numbers from one focused workspace.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <router-link to="/dental-availment-history">
            <AppButton btn-theme="outline" class="px-5 py-3 normal-case">
              <Icon icon="feather:clock" class="h-4 w-4" />
              History
            </AppButton>
          </router-link>
          <AppButton
            btn-theme="primary"
            class="px-5 py-3 normal-case"
            @click="handleGenerateApprovalNo"
          >
            <Icon
              :icon="generatingApprovalNo ? 'feather:loader' : 'feather:shuffle'"
              class="h-4 w-4"
              :class="{ 'animate-spin': generatingApprovalNo }"
            />
            Generate No.
          </AppButton>
        </div>
      </div>
      <div class="grid gap-px border-t border-pebble bg-pebble md:grid-cols-3">
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Approval No.</p>
          <p class="mt-2 font-mono text-2xl font-black text-onyx">
            {{ form.approvalNo || 'Auto' }}
          </p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Procedure Rows</p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ form.procedureItems.length }}</p>
        </div>
        <div class="bg-white px-6 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Running Total</p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ formatMoney(procedureTotal) }}</p>
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
      <section class="rounded-[1.5rem] border border-pebble bg-white p-5 shadow-sm lg:p-6">
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-xl font-black text-onyx">New Dental Availment</h2>
            <p class="mt-1 text-sm text-slate">
              Search a member first, then complete the approval details.
            </p>
          </div>
          <div class="rounded-xl border border-sapphire/15 bg-sapphire-light px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-sapphire">
              Approval no.
            </p>
            <p class="mt-1 font-mono text-lg font-black text-sapphire-dark">
              {{ form.approvalNo || 'Auto' }}
            </p>
          </div>
        </div>

        <div class="space-y-5">
          <div
            class="rounded-2xl border border-pebble bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-4"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke">
                  Member source
                </p>
                <p class="mt-1 text-sm font-bold text-onyx">{{ selectedSourceLabel }}</p>
              </div>
              <Icon icon="feather:users" class="h-5 w-5 text-tangerine" />
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                v-for="option in memberSourceOptions"
                :key="option.value"
                type="button"
                class="rounded-xl border px-4 py-3 text-left transition"
                :class="
                  memberSource === option.value
                    ? 'border-tangerine bg-tangerine-light text-tangerine-dark shadow-sm'
                    : 'border-pebble bg-white text-slate hover:border-tangerine/50 hover:bg-cloud'
                "
                @click="selectMemberSource(option.value)"
              >
                <span class="flex items-start gap-3">
                  <span
                    class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white"
                    :class="memberSource === option.value ? 'text-tangerine' : 'text-slate'"
                  >
                    <Icon
                      :icon="option.value === 'ims_all' ? 'feather:database' : 'feather:briefcase'"
                      class="h-4 w-4"
                    />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-sm font-bold">{{ option.label }}</span>
                    <span class="mt-1 block text-xs leading-5">{{ option.description }}</span>
                  </span>
                </span>
              </button>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <AppInput
                v-model="memberSearch"
                label="Search Member"
                placeholder="Search by name, card no., birth date, or policy no."
                icon="feather:search"
              />
              <AppButton
                type="button"
                btn-theme="primary"
                class="normal-case sm:min-w-36"
                :disabled="searchingMembers || memberSearch.trim().length < 2"
                @click="submitMemberSearch"
              >
                <Icon
                  :icon="searchingMembers ? 'feather:loader' : 'feather:search'"
                  class="h-4 w-4"
                  :class="{ 'animate-spin': searchingMembers }"
                />
                Search
              </AppButton>
            </div>

            <div
              v-if="searchingMembers"
              class="mt-3 flex items-center gap-2 rounded-xl border border-pebble bg-white px-4 py-3 text-sm text-slate"
            >
              <Icon icon="feather:loader" class="h-4 w-4 animate-spin" />
              Searching members...
            </div>
            <p
              v-else-if="memberSearchErrorMessage"
              class="mt-3 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby"
            >
              {{ memberSearchErrorMessage }}
            </p>
            <div
              v-else-if="memberSearchSubmitted && memberSearchResults.length"
              class="mt-3 max-h-72 overflow-auto rounded-xl border border-pebble bg-white p-2"
            >
              <button
                v-for="member in memberSearchResults"
                :key="member.id"
                type="button"
                class="block w-full rounded-lg px-3 py-3 text-left transition hover:bg-tangerine-light"
                @click="selectMember(member)"
              >
                <span class="flex items-start justify-between gap-3">
                  <span class="min-w-0">
                    <span class="block text-sm font-bold text-onyx">{{ member.memberName }}</span>
                    <span class="mt-1 block text-xs leading-5 text-slate">
                      {{ memberDescription(member) }}
                    </span>
                  </span>
                  <span
                    class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    :class="member.paid ? 'bg-emerald-light text-emerald' : 'bg-fog text-slate'"
                  >
                    {{ memberPaymentStatus(member) }}
                  </span>
                </span>
              </button>
            </div>
            <p
              v-else-if="memberSearchSubmitted"
              class="mt-3 rounded-xl border border-pebble bg-white px-4 py-3 text-sm text-slate"
            >
              No matching members found.
            </p>

            <div
              v-if="selectedMember"
              class="mt-4 flex flex-col gap-3 rounded-xl border border-emerald/20 bg-emerald-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex min-w-0 items-start gap-3">
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald"
                >
                  <Icon icon="feather:check-circle" class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-emerald">
                    Selected member
                  </p>
                  <p class="mt-1 font-black text-onyx">{{ selectedMember.memberName }}</p>
                  <p class="mt-1 text-xs leading-5 text-slate">
                    {{ memberDescription(selectedMember) }}
                  </p>
                  <p class="mt-1 text-xs font-semibold text-emerald">
                    {{ memberPaymentStatus(selectedMember) }}
                  </p>
                </div>
              </div>
              <AppButton btn-theme="outline" class="normal-case" @click="changeSelectedMember">
                Change
              </AppButton>
            </div>
          </div>

          <div class="rounded-2xl border border-pebble bg-white p-4">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-smoke">
                  Approval details
                </p>
                <p class="mt-1 text-sm text-slate">Procedure, amount, clinic, and notes.</p>
              </div>
              <Icon icon="feather:file-plus" class="h-5 w-5 text-tangerine" />
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div class="md:col-span-2">
                <label class="mb-2 block text-sm font-medium text-onyx">Approval No.</label>
                <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <AppInput
                    v-model="form.approvalNo"
                    placeholder="Generate or leave blank"
                    icon="feather:key"
                    input-class="font-mono"
                  />
                  <AppButton
                    type="button"
                    btn-theme="outline"
                    class="normal-case sm:min-w-44"
                    :disabled="generatingApprovalNo"
                    @click="handleGenerateApprovalNo"
                  >
                    <Icon
                      :icon="generatingApprovalNo ? 'feather:loader' : 'feather:shuffle'"
                      class="h-4 w-4"
                      :class="{ 'animate-spin': generatingApprovalNo }"
                    />
                    {{ generatingApprovalNo ? 'Generating...' : 'Generate' }}
                  </AppButton>
                </div>
              </div>

              <AppSearchSelect
                v-model="selectedDentistId"
                v-model:search="dentistSearch"
                :options="dentistOptions"
                :loading="loadingDentists"
                label="Dentist Name"
                placeholder="Search dentist"
                empty-text="No matching dentists found."
              />
              <AppSearchSelect
                v-model="selectedClinicId"
                v-model:search="clinicSearch"
                :options="clinicOptions"
                :loading="loadingClinics"
                label="Clinic Name"
                placeholder="Search clinic"
                empty-text="No matching clinics found."
              />
              <AppInput v-model="form.availDate" label="Availment Date" type="date" />

              <AppSearchSelect
                v-model="selectedProcedureId"
                v-model:search="procedureSearch"
                :options="activeProcedureOptions"
                :loading="loadingProcedures"
                label="Procedure"
                placeholder="Search procedure"
                empty-text="No active procedures found."
              />
              <AppInput
                v-model="form.amount"
                label="Amount"
                type="number"
                placeholder="0.00"
                icon="feather:hash"
              />
              <div>
                <label class="mb-2 block text-sm font-medium text-onyx">Tooth No.</label>
                <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <AppInput
                    v-model="form.toothNo"
                    placeholder="Optional tooth number or ALL"
                    icon="feather:hash"
                    list="tooth-number-options"
                  />
                  <AppButton
                    type="button"
                    btn-theme="outline"
                    class="normal-case sm:min-w-24"
                    @click="form.toothNo = 'ALL'"
                  >
                    ALL
                  </AppButton>
                </div>
                <datalist id="tooth-number-options">
                  <option v-for="option in toothNumberOptions" :key="option" :value="option" />
                </datalist>
              </div>
              <div class="flex items-end">
                <AppButton
                  type="button"
                  btn-theme="outline"
                  class="w-full normal-case"
                  :disabled="!form.procedures.trim() || form.amount === ''"
                  @click="addProcedureItem"
                >
                  <Icon icon="feather:plus-circle" class="h-4 w-4" />
                  Add Procedure
                </AppButton>
              </div>

              <div class="md:col-span-2">
                <div
                  class="overflow-hidden rounded-xl border border-pebble bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]"
                >
                  <div
                    class="flex items-center justify-between gap-3 border-b border-pebble px-4 py-3"
                  >
                    <div>
                      <p class="text-sm font-bold text-onyx">Procedure rows</p>
                      <p class="text-xs text-slate">
                        Each row will be inserted under the same approval number.
                      </p>
                    </div>
                    <p class="text-sm font-black text-onyx">{{ formatMoney(procedureTotal) }}</p>
                  </div>
                  <div v-if="form.procedureItems.length" class="divide-y divide-pebble">
                    <div
                      v-for="(item, index) in form.procedureItems"
                      :key="`${item.procedures}-${index}`"
                      class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div class="min-w-0">
                        <p class="text-sm font-bold text-onyx">
                          {{ procedureLabel(item.procedures) }}
                        </p>
                        <p class="mt-1 text-xs text-slate">
                          Tooth {{ item.toothNo || 'N/A' }} | {{ formatMoney(item.amount) }}
                        </p>
                      </div>
                      <button
                        type="button"
                        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ruby/20 bg-ruby-light text-ruby transition hover:bg-ruby hover:text-white"
                        title="Remove procedure"
                        aria-label="Remove procedure"
                        @click="removeProcedureItem(index)"
                      >
                        <Icon icon="feather:trash-2" class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p v-else class="px-4 py-5 text-center text-sm text-slate">
                    No procedure rows added yet.
                  </p>
                </div>
              </div>

              <div class="md:col-span-2">
                <label class="mb-2 block text-sm font-medium text-onyx">Treatment</label>
                <AppTextArea
                  v-model="form.treatment"
                  placeholder="Optional treatment details"
                  :rows="3"
                />
              </div>

              <div class="md:col-span-2">
                <label class="mb-2 block text-sm font-medium text-onyx">Remarks</label>
                <AppTextArea v-model="form.remarks" placeholder="Optional notes" :rows="3" />
              </div>
            </div>
          </div>
        </div>

        <p v-if="errorMessage" class="mt-5 rounded-xl bg-ruby-light px-4 py-3 text-sm text-ruby">
          {{ errorMessage }}
        </p>

        <div class="mt-6 flex flex-wrap gap-3">
          <AppButton
            btn-theme="primary"
            class="normal-case"
            :disabled="!createReady || creating"
            @click="openCreateConfirmation"
          >
            <Icon
              :icon="creating ? 'feather:loader' : 'feather:check-circle'"
              class="h-4 w-4"
              :class="creating ? 'animate-spin' : ''"
            />
            {{ creating ? 'Creating...' : 'Create Approval' }}
          </AppButton>
          <AppButton
            btn-theme="outline"
            class="normal-case"
            :disabled="creating"
            @click="resetAvailmentForm"
          >
            Reset
          </AppButton>
        </div>

        <div
          v-if="createdAvailment"
          class="mt-6 rounded-[1.4rem] border border-emerald/20 bg-emerald-light px-5 py-4"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald">
            Created approval
          </p>
          <p class="mt-2 text-2xl font-black text-onyx">{{ createdAvailment.approvalno }}</p>
          <p class="mt-1 text-sm text-slate">
            {{ createdAvailment.membername }} · {{ formatMoney(createdAvailment.amount) }}
          </p>
        </div>
      </section>

      <section
        class="rounded-[1.75rem] border border-pebble bg-white p-5 shadow-sm lg:p-6 xl:sticky xl:top-6"
      >
        <div class="mb-5">
          <h2 class="text-xl font-black text-onyx">Approval Lookup</h2>
          <p class="mt-1 text-sm text-slate">Enter a 9-digit approval number to verify it.</p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
          <AppInput
            v-model="lookupForm.approvalNo"
            placeholder="Approval no."
            icon="feather:search"
            input-class="font-mono"
          />
          <AppButton
            btn-theme="primary"
            class="shrink-0 normal-case"
            :disabled="lookingUp || lookupForm.approvalNo.trim().length !== 9"
            @click="submitLookup"
          >
            <Icon
              :icon="lookingUp ? 'feather:loader' : 'feather:search'"
              class="h-4 w-4"
              :class="lookingUp ? 'animate-spin' : ''"
            />
            Find
          </AppButton>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div class="rounded-[1.4rem] border border-pebble bg-cloud px-4 py-4">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-smoke">
              Current approval
            </p>
            <p class="mt-2 font-mono text-lg font-black text-onyx">
              {{ form.approvalNo || 'Auto generate' }}
            </p>
            <p class="mt-1 text-sm text-slate">{{ form.memberName || 'No member selected yet' }}</p>
          </div>
          <div class="rounded-[1.4rem] border border-pebble bg-cloud px-4 py-4">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-smoke">
              Current provider
            </p>
            <p class="mt-2 text-sm font-bold text-onyx">
              {{ form.dentistName || 'No dentist selected' }}
            </p>
            <p class="mt-1 text-sm text-slate">{{ form.clinicName || 'No clinic selected' }}</p>
          </div>
        </div>

        <div class="mt-4 rounded-[1.4rem] border border-[#e2d7c2] bg-[linear-gradient(135deg,#fffaf1_0%,#f8f6ef_100%)] px-4 py-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-tangerine">
            Quick check
          </p>
          <p class="mt-2 text-sm leading-6 text-slate">
            Use this panel to verify an existing approval number or quickly review the current
            draft before creating a new availment.
          </p>
        </div>

        <AppLoadingScreen
          v-if="lookingUp"
          class="mt-5"
          title="Looking up approval"
          message="Please wait while we verify the dental approval."
        />

        <div v-else-if="approvalLookup" class="mt-6 space-y-4">
          <div class="rounded-[1.4rem] border border-pebble bg-cloud px-5 py-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Approval no.</p>
            <p class="mt-2 text-2xl font-black text-onyx">{{ approvalLookup.approvalNo }}</p>
            <p class="mt-1 text-sm text-slate">
              {{ approvalLookup.memberName || 'N/A' }} ·
              {{ formatDate(approvalLookup.availDate) }}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border border-pebble px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Items</p>
              <p class="mt-1 text-xl font-black text-onyx">{{ approvalLookup.itemCount }}</p>
            </div>
            <div class="rounded-2xl border border-pebble px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Total</p>
              <p class="mt-1 text-xl font-black text-onyx">
                {{ formatMoney(approvalLookup.totalAmount) }}
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="row in approvalLookup.rows"
              :key="row.dentalid"
              class="rounded-2xl border border-pebble px-4 py-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-bold text-onyx">{{ procedureName(row.procedures) }}</p>
                  <p class="mt-1 text-xs text-slate">
                    {{ row.clinicname || 'No clinic' }} · {{ row.dentistname || 'No dentist' }}
                    {{ row.toothno ? `· Tooth ${row.toothno}` : '' }}
                  </p>
                </div>
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    row.status === 'VALID'
                      ? 'bg-emerald-light text-emerald'
                      : 'bg-ruby-light text-ruby'
                  "
                >
                  {{ row.status || 'VALID' }}
                </span>
              </div>
              <p class="mt-3 text-sm font-semibold text-onyx">{{ formatMoney(row.amount) }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <AppToast
      :show="toast.show"
      :variant="toast.variant"
      :title="toast.title"
      :message="toast.message"
      @close="closeToast"
    />
  </div>
</template>
