import AccountSettingsView from '@/views/AccountSettingsView.vue'
import ClinicView from '@/views/ClinicView.vue'
import DashboardView from '@/views/Dashboardvue.vue'
import LoginView from '@/views/LoginView.vue'
import SystemLogsView from '@/views/SystemLogsView.vue'
import UserLogsView from '@/views/UserLogsView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables'
import DentistView from '@/views/dentists/DentistView.vue'
import PasswordResetUsersView from '@/views/users/PasswordResetUsersView.vue'
import UserView from '@/views/users/UserView.vue'
import SingleDentistView from '@/views/dentists/SingleDentistView.vue'
import SingleUserView from '@/views/users/SingleUserView.vue'
import TransactionView from '@/views/transactions/TransactionView.vue'
import SingleTransactionView from '@/views/transactions/SingleTransactionView.vue'
import OptionsView from '@/views/OptionsView.vue'
import PlansView from '@/views/PlansView.vue'

type RouteNavItem = [boolean, { visibleTo: string[] }]

function getVisibleRoles(metaNavItem: unknown): string[] {
  if (!Array.isArray(metaNavItem) || !metaNavItem[1]?.visibleTo) return []
  return metaNavItem[1].visibleTo
}

function findFirstAccessiblePath(userRoles: string[]) {
  const accessibleRoute = router.options.routes.find((route) => {
    const visibleTo = getVisibleRoles(route.meta?.navItem)
    if (!visibleTo.length) return false
    return visibleTo.some((role) => userRoles.includes(role))
  })

  return accessibleRoute?.path || null
}

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
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionView,
      meta: {
        title: 'Transaction',
        icon: 'feather:credit-card',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
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
      path: '/dentists',
      name: 'dentists',
      component: DentistView,
      meta: {
        title: 'Dentist Profile',
        icon: 'streamline-ultimate:dentistry-tooth-shield',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
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
      path: '/clinic',
      name: 'clinic',
      component: ClinicView,
      meta: {
        title: 'Dental Clinic',
        icon: 'feather:briefcase',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/plans',
      name: 'plans',
      component: PlansView,
      meta: {
        title: 'IMS Dental Plans',
        icon: 'feather:clipboard',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
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
      path: '/users/password-reset',
      name: 'passwordResetUsers',
      component: PasswordResetUsersView,
      meta: {
        title: 'Password Reset Queue',
        icon: 'feather:key',
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
        title: 'Account Setting',
        icon: 'feather:settings',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
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

  const { getToken, getStoredRoles, fetchCurrentUser, logout } = useAuth()
  const token = getToken()

  if (!token && to.path !== '/login') return router.push('/login')
  if (token && to.path === '/login') return router.push('/')

  const visibleTo = getVisibleRoles(to.meta?.navItem)
  if (!token || !visibleTo.length) return

  let currentRoles = getStoredRoles()

  if (!currentRoles.length) {
    const currentUser = await fetchCurrentUser()
    currentRoles = currentUser?.roles || []
  }

  const canAccess = visibleTo.some((role) => currentRoles.includes(role))

  if (!canAccess) {
    const fallbackPath = findFirstAccessiblePath(currentRoles)

    if (fallbackPath && fallbackPath !== to.path) {
      return router.push(fallbackPath)
    }

    await logout(true)
  }
})

export default router
