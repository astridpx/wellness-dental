import AccountSettingsView from '@/views/AccountSettingsView.vue'
import DashboardView from '@/views/Dashboardvue.vue'
import LoginView from '@/views/LoginView.vue'
import SystemLogsView from '@/views/SystemLogsView.vue'
import UserLogsView from '@/views/UserLogsView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables'
import { getRoleFromToken } from '@/utils'
import DentistView from '@/views/dentists/DentistView.vue'
import UserView from '@/views/users/UserView.vue'
import SingleDentistView from '@/views/dentists/SingleDentistView.vue'
import SingleUserView from '@/views/users/SingleUserView.vue'
import TransactionView from '@/views/transactions/TransactionView.vue'
import SingleTransactionView from '@/views/transactions/SingleTransactionView.vue'
import OptionsView from '@/views/OptionsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'Dashboard',
        icon: 'feather:home',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor'] }],
      },
    },
    {
      path: '/dentists',
      name: 'dentists',
      component: DentistView,
      meta: {
        title: 'Dentists',
        icon: 'streamline-ultimate:dentistry-tooth-shield',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor'] }],
      },
    },
    {
      path: '/dentists/add',
      name: 'addDentists',
      component: SingleDentistView,
      meta: {
        title: 'Add Dentists',
        icon: 'feather:home',
        navItem: [false, { visibleTo: ['superAdmin', 'admin', 'auditor'] }],
      },
    },
    {
      path: '/dentists/:id/edit',
      name: 'editDentists',
      component: SingleDentistView,
      meta: {
        title: 'Edit Dentists',
        icon: 'feather:home',
        navItem: [false, { visibleTo: ['superAdmin', 'admin', 'auditor'] }],
      },
    },
    {
      path: '/users',
      name: 'users',
      component: UserView,
      meta: {
        title: 'Users',
        icon: 'feather:users',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor'] }],
      },
    },
    {
      path: '/users/add',
      name: 'addUsers',
      component: SingleUserView,
      meta: {
        title: 'Add Users',
        icon: 'feather:home',
        navItem: [false, { visibleTo: ['superAdmin', 'admin', 'auditor'] }],
      },
    },
    {
      path: '/users/:id/edit',
      name: 'editUsers',
      component: SingleUserView,
      meta: {
        title: 'Edit Users',
        icon: 'feather:home',
        navItem: [false, { visibleTo: ['superAdmin', 'admin', 'auditor'] }],
      },
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionView,
      meta: {
        title: 'Transactions',
        icon: 'feather:credit-card',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor'] }],
      },
    },
    {
      path: '/transactions/add',
      name: 'addTransaction',
      component: SingleTransactionView,
      meta: { title: 'Add Transaction', navItem: [false, { visibleTo: ['superAdmin', 'admin'] }] },
    },
    {
      path: '/transactions/:id/edit',
      name: 'editTransaction',
      component: SingleTransactionView,
      meta: { title: 'Edit Transaction', navItem: [false, { visibleTo: ['superAdmin', 'admin'] }] },
    },
    {
      path: '/options',
      name: 'options',
      component: OptionsView,
      meta: {
        title: 'Options',
        icon: 'feather:sliders',
        navItem: [true, { visibleTo: ['superAdmin', 'admin'] }],
      },
    },
    {
      path: '/userlogs',
      name: 'userlogs',
      component: UserLogsView,
      meta: {
        title: 'User Logs',
        icon: 'tabler:address-book',
        navItem: [true, { visibleTo: ['superAdmin'] }],
      },
    },
    {
      path: '/systemlogs',
      name: 'systemlogs',
      component: SystemLogsView,
      meta: {
        title: 'System Logs',
        icon: 'feather:activity',
        navItem: [true, { visibleTo: ['superAdmin'] }],
      },
    },
    {
      path: '/accountSettings',
      name: 'accountSettings',
      component: AccountSettingsView,
      meta: {
        title: 'Account Settings',
        icon: 'feather:settings',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor'] }],
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: 'Login',
        navItem: [false],
      },
    },
  ],
})

router.beforeEach(async (to) => {
  document.title = `${to.meta.title} - ${import.meta.env.VITE_APP_TITLE}`

  // const { getToken, logout } = useAuth()
  // const token = getToken()

  // if (!token && to.path !== '/login') return router.push('/login')

  // if (token) {
  //   const currentRole = isExtOrg ? getRoleFromToken(localStorage.getItem(lsTokenKey)) : 'superAdmin'

  //   if (to.path === '/login') return router.push('/')

  //   if (to.meta?.navItem && !Array.isArray(to.meta.navItem)) return logout(true)

  //   if (isExtOrg && !canAccessExternalRoute(currentRole, String(to.name || ''))) {
  //     if (currentRole === 'auditor') return router.push('/')
  //     return router.push('/')
  //   }
  // }
})

export default router
