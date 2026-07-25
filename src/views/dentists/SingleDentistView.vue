<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { AppButton, AppInput } from '@/components/app'

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
        schedule: 'Mon-Fri • 9:00 AM - 5:00 PM',
        chair: 'Chair 2',
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
        schedule: '',
        chair: '',
        status: 'Active',
      },
)

const setupSteps = ['Provider identity', 'Credentials', 'Clinic assignment', 'Chair and schedule']

function save() {
  router.push('/dentists')
}
</script>

<template>
  <section class="space-y-6">
    <section
      class="overflow-hidden rounded-4xl border border-pebble bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_48%,#f8fbff_100%)] shadow-sm"
    >
      <div class="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-tangerine">
            Dentist builder
          </p>
          <h1 class="mt-2 text-3xl font-black text-onyx">
            {{ isEditMode ? 'Provider setup editor' : 'New provider setup' }}
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-7 text-slate">
            This form is restructured as a clinic setup workspace, with a persistent provider
            summary panel on the left and grouped build sections on the right.
          </p>
        </div>
        <AppButton
          btn-theme="outline"
          class="px-5 py-3 normal-case"
          @click="router.push('/dentists')"
        >
          Back to roster
        </AppButton>
      </div>
    </section>

    <form class="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]" @submit.prevent="save">
      <aside class="space-y-5">
        <div class="rounded-4xl bg-[#122833] p-6 text-white shadow-lg">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine-light">
                Provider profile
              </p>
              <h2 class="mt-2 text-2xl font-black">
                Dr. {{ dentistData.firstname || 'New' }} {{ dentistData.lastname || 'Dentist' }}
              </h2>
            </div>
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8">
              <Icon icon="streamline-ultimate:dentistry-tooth-shield" class="h-7 w-7" />
            </div>
          </div>

          <div class="mt-6 grid gap-3">
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Status</p>
              <p class="mt-2 text-sm font-semibold">{{ dentistData.status }}</p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Specialty</p>
              <p class="mt-2 text-sm font-semibold">
                {{ dentistData.specialty || 'Not assigned yet' }}
              </p>
            </div>
            <div class="rounded-2xl bg-white/8 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.18em] text-white/50">Chair setup</p>
              <p class="mt-2 text-sm font-semibold">{{ dentistData.chair || 'No chair mapped' }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-4xl border border-pebble bg-white p-5 shadow-sm">
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
            Build sequence
          </p>
          <div class="mt-4 space-y-3">
            <div
              v-for="(step, index) in setupSteps"
              :key="step"
              class="flex items-center gap-3 rounded-2xl bg-cloud px-4 py-3"
            >
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full bg-onyx text-xs font-bold text-white"
              >
                {{ index + 1 }}
              </span>
              <span class="text-sm font-semibold text-onyx">{{ step }}</span>
            </div>
          </div>
        </div>
      </aside>

      <div class="space-y-6">
        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Section 1
              </p>
              <h2 class="mt-2 text-2xl font-black text-onyx">Identity and credentials</h2>
            </div>
            <span class="rounded-full bg-cloud px-3 py-1 text-xs font-semibold text-slate"
              >Required</span
            >
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <div class="md:col-span-2">
              <AppInput
                v-model="dentistData.license"
                label="PRC License Number"
                placeholder="PRC-XXXXXXX"
              />
            </div>
            <AppInput v-model="dentistData.firstname" label="First Name" placeholder="Maria" />
            <AppInput v-model="dentistData.lastname" label="Last Name" placeholder="Santos" />
            <AppInput v-model="dentistData.mi" label="M.I." placeholder="C" />
            <AppInput v-model="dentistData.suffix" label="Suffix" placeholder="Jr." />
            <AppInput
              v-model="dentistData.email"
              label="Email Address"
              placeholder="name@clinic.com"
            />
            <AppInput
              v-model="dentistData.phone"
              label="Mobile Number"
              placeholder="+63 912 345 6789"
            />
          </div>
        </section>

        <section class="rounded-4xl border border-pebble bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-smoke">
                Section 2
              </p>
              <h2 class="mt-2 text-2xl font-black text-onyx">Clinic mapping</h2>
            </div>
            <span
              class="rounded-full bg-tangerine-light px-3 py-1 text-xs font-semibold text-tangerine-dark"
              >Operational</span
            >
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <AppInput
              v-model="dentistData.specialty"
              label="Specialty"
              placeholder="General Dentistry"
            />
            <div>
              <label class="mb-2 block text-sm font-medium text-slate">Account Status</label>
              <select v-model="dentistData.status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <AppInput
                v-model="dentistData.clinic"
                label="Clinic Name"
                placeholder="Dental Care Clinic"
              />
            </div>
            <AppInput v-model="dentistData.chair" label="Assigned Chair" placeholder="Chair 2" />
            <AppInput
              v-model="dentistData.schedule"
              label="Default Schedule"
              placeholder="Mon-Fri • 9:00 AM - 5:00 PM"
            />
            <div class="md:col-span-2">
              <AppInput
                v-model="dentistData.address"
                label="Clinic Address"
                placeholder="Clinic address"
              />
            </div>
          </div>
        </section>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AppButton
            type="button"
            btn-theme="outline"
            class="px-5 py-3 normal-case"
            @click="router.push('/dentists')"
          >
            Cancel
          </AppButton>
          <AppButton type="submit" btn-theme="primary" class="px-5 py-3 normal-case">
            <Icon icon="feather:save" class="size-4" />
            {{ isEditMode ? 'Update provider setup' : 'Save provider setup' }}
          </AppButton>
        </div>
      </div>
    </form>
  </section>
</template>
