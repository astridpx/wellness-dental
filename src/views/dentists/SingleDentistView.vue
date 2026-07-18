<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AppButton, AppInput } from '@/components/app'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isEditMode = computed(() => !!route.params.id)
const dentistData = ref(
  isEditMode.value
    ? {
        license: 'PRC-0123456',
        firstname: 'Maria',
        lastname: 'Santos',
        mi: 'C',
        suffix: '',
        email: 'maria@dentalcare.com',
        phone: '0917 555 0184',
        specialty: 'General Dentistry',
        clinic: 'Dental Care Clinic',
        address: '123 Makati Avenue, Makati City',
        status: 'Active',
      }
    : {
        license: '',
        firstname: '',
        lastname: '',
        mi: '',
        suffix: '',
        email: '',
        phone: '',
        specialty: '',
        clinic: '',
        address: '',
        status: 'Active',
      },
)
function save() {
  router.push('/dentists')
}
</script>

<template>
  <section class="rounded-[1.5rem] border border-pebble bg-white p-6 shadow-sm lg:p-7">
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-black text-onyx">
          {{ isEditMode ? 'Edit Dentist' : 'Create Dentist' }}
        </h2>
        <p class="mt-1 max-w-2xl text-sm leading-6 text-slate">
          Manage dentist information, professional credentials, and clinic details from one
          organized form.
        </p>
      </div>
      <AppButton btn-theme="outline" class="px-5 py-3 normal-case" @click="router.push('/dentists')"
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
        <p class="mt-2 text-sm font-medium leading-6 text-onyx">Dentist provider record</p>
      </div>
      <div class="rounded-lg border border-pebble bg-mist px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Status</p>
        <p class="mt-2 text-2xl font-black text-onyx">{{ dentistData.status }}</p>
      </div>
    </div>
    <form class="grid gap-6 xl:grid-cols-[280px_1fr]" @submit.prevent="save">
      <div
        class="rounded-[1.5rem] border border-pebble bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-6"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Profile Panel</p>
        <div
          class="mt-5 flex flex-col items-center rounded-[1.5rem] border border-dashed border-pebble bg-white p-6"
        >
          <div
            class="flex h-32 w-32 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fff4e8_0%,#ffe1bf_100%)]"
          >
            <Icon
              icon="streamline-ultimate:dentistry-tooth-shield"
              class="size-16 text-tangerine"
            />
          </div>
          <p class="mt-4 text-sm font-semibold text-onyx">
            Dr. {{ dentistData.firstname || 'New' }} {{ dentistData.lastname || 'Dentist' }}
          </p>
          <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate">Dentist Record</p>
        </div>
      </div>
      <div class="space-y-6">
        <div class="rounded-[1.5rem] border border-pebble bg-snow p-6">
          <h2 class="text-xl font-black text-onyx">Basic Information</h2>
          <div class="mt-5 grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">PRC License Number</label
              ><AppInput v-model="dentistData.license" placeholder="PRC-XXXXXXX" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">First Name</label
              ><AppInput v-model="dentistData.firstname" placeholder="Maria" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Last Name</label
              ><AppInput v-model="dentistData.lastname" placeholder="Santos" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">M.I.</label
              ><AppInput v-model="dentistData.mi" placeholder="I" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Suffix</label
              ><AppInput v-model="dentistData.suffix" placeholder="Jr" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Email Address</label
              ><AppInput v-model="dentistData.email" placeholder="name@clinic.com" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Mobile Number</label
              ><AppInput v-model="dentistData.phone" placeholder="+63 912 345 6789" />
            </div>
          </div>
        </div>
        <div class="rounded-[1.5rem] border border-pebble bg-snow p-6">
          <h2 class="text-xl font-black text-onyx">Practice Details</h2>
          <div class="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Specialty</label
              ><AppInput v-model="dentistData.specialty" placeholder="General Dentistry" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Account Status</label
              ><select v-model="dentistData.status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Clinic Name</label
              ><AppInput v-model="dentistData.clinic" placeholder="Name of clinic" />
            </div>
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-slate">Clinic Address</label
              ><AppInput v-model="dentistData.address" placeholder="Clinic address" />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <AppButton
            type="button"
            btn-theme="outline"
            class="px-5 py-3 normal-case"
            @click="router.push('/dentists')"
            >Cancel</AppButton
          ><AppButton type="submit" btn-theme="primary" class="px-5 py-3 normal-case"
            ><Icon icon="feather:save" class="size-4" />{{
              isEditMode ? 'Update Dentist' : 'Save Dentist'
            }}</AppButton
          >
        </div>
      </div>
    </form>
  </section>
</template>
