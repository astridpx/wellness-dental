<script lang="ts" setup>
import { AppButton, AppInput } from '@/components/app'
</script>

<template>
  <section class="rounded-[1.5rem] border border-pebble bg-white p-6 shadow-sm lg:p-7">
    <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div
        class="rounded-[1.5rem] border border-pebble bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-6"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Security Guide</p>
        <h2 class="mt-3 text-2xl font-black text-onyx">Protect Clinic Access</h2>
        <p class="mt-3 text-sm leading-6 text-slate">
          Keep billing, dentist credentials, and patient operations secure with a strong password
          routine.
        </p>

        <div class="mt-6 space-y-3">
          <div class="rounded-2xl bg-fog px-4 py-3 text-sm text-onyx">
            Use at least 12 characters for staff and admin accounts.
          </div>
          <div class="rounded-2xl bg-fog px-4 py-3 text-sm text-onyx">
            Combine uppercase, lowercase, numbers, and symbols.
          </div>
          <div class="rounded-2xl bg-fog px-4 py-3 text-sm text-onyx">
            Rotate credentials quickly when roles or device access changes.
          </div>
        </div>
      </div>

      <form class="rounded-[1.5rem] border border-pebble bg-snow p-6">
        <div class="space-y-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
              Update Credentials
            </p>
            <h2 class="mt-2 text-xl font-black text-onyx">Clinic Account Password</h2>
          </div>

          <div class="grid gap-5">
            <AppInput type="password" icon="mingcute:lock-line" label="New Password" />
            <AppInput type="password" icon="mingcute:lock-line" label="Confirm Password" />
          </div>

          <div class="flex justify-end">
            <AppButton btn-theme="primary" type="submit" class="px-6 py-3 normal-case">
              Save Password
            </AppButton>
          </div>
        </div>
      </form>
    </div>
  </section>
</template>
