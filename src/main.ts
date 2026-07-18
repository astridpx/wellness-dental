import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from '@/router'
import '@/assets/css/main.css'

// dayjs
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// datepicker
import '@vuepic/vue-datepicker/dist/main.css'

const app = createApp(App)

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Manila')

app.use(createPinia())
app.use(router)
app.provide('dayjs', dayjs)
app.provide('appVer', '')

app.mount('#app')
