import BusinessPartnersView from '@/views/BusinessPartnersView.vue'
import AccountSettingsView from '@/views/AccountSettingsView.vue'
import ClinicView from '@/views/clinics/ClinicView.vue'
import DashboardView from '@/views/DashboardView.vue'
import DentalAvailmentsView from '@/views/DentalAvailmentsView.vue'
import DentalAvailmentHistoryView from '@/views/DentalAvailmentHistoryView.vue'
import BillMarkingView from '@/views/BillMarkingView.vue'
import LoginView from '@/views/LoginView.vue'
import ReportsView from '@/views/ReportsView.vue'
import SystemLogsView from '@/views/SystemLogsView.vue'
import UserLogsView from '@/views/UserLogsView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables'
import DentistView from '@/views/dentists/DentistView.vue'
import UserView from '@/views/users/UserView.vue'
import SingleDentistView from '@/views/dentists/SingleDentistView.vue'
import SingleUserView from '@/views/users/SingleUserView.vue'
import TransactionView from '@/views/transactions/TransactionView.vue'
import OptionsView from '@/views/OptionsView.vue'
import BusinessPartnerUploadsView from '@/views/BusinessPartnerUploadsView.vue'
import ImportedPartnerMembersView from '@/views/ImportedPartnerMembersView.vue'
import IwcWorkbookExtractionView from '@/views/IwcWorkbookExtractionView.vue'
import PaymentExtractionView from '@/views/PaymentExtractionView.vue'
import PlansView from '@/views/PlansView.vue'
import MembershipDetailsView from '@/views/MembershipDetailsView.vue'
import SingleClinicView from '@/views/clinics/SingleClinicView.vue'

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

function isPasswordResetRoute(path: string) {
  return path === '/accountSettings'
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
        title: 'Transactions',
        icon: 'feather:credit-card',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/dental-availments',
      name: 'dentalAvailments',
      component: DentalAvailmentsView,
      meta: {
        title: 'Dental Availments',
        icon: 'feather:file-text',
        navGroup: {
          name: 'Availments',
          icon: 'feather:file-text',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/dental-availment-history',
      name: 'dentalAvailmentHistory',
      component: DentalAvailmentHistoryView,
      meta: {
        title: 'Availment History',
        icon: 'feather:clock',
        navGroup: {
          name: 'Availments',
          icon: 'feather:file-text',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/bill-marking',
      name: 'billMarking',
      component: BillMarkingView,
      meta: {
        title: 'Bill Marking',
        icon: 'feather:file-plus',
        navGroup: {
          name: 'Availments',
          icon: 'feather:file-text',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsView,
      meta: {
        title: 'Reports',
        icon: 'feather:bar-chart-2',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/dentists',
      name: 'dentists',
      component: DentistView,
      meta: {
        title: 'Dentist Profile',
        icon: 'streamline-ultimate:dentistry-tooth-shield',
        navGroup: {
          name: 'Dentist',
          icon: 'feather:briefcase',
        },
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
        navItem: [false, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/dentists/:id/edit',
      name: 'editDentists',
      component: SingleDentistView,
      meta: {
        title: 'Edit Dentists',
        icon: 'feather:home',
        navItem: [false, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/clinic',
      name: 'clinic',
      component: ClinicView,
      meta: {
        title: 'Dental Clinic',
        icon: 'feather:briefcase',
        navGroup: {
          name: 'Dentist',
          icon: 'feather:briefcase',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/clinic/add',
      name: 'addClinic',
      component: SingleClinicView,
      meta: {
        title: 'Add Clinic',
        navItem: [false, { visibleTo: ['superAdmin', 'admin', 'regUser'] }],
      },
    },
    {
      path: '/clinic/:id/edit',
      name: 'editClinic',
      component: SingleClinicView,
      meta: {
        title: 'Edit Clinic',
        navItem: [false, { visibleTo: ['superAdmin', 'admin', 'regUser'] }],
      },
    },
    {
      path: '/plans',
      name: 'plans',
      component: PlansView,
      meta: {
        title: 'IMS Dental Plans',
        icon: 'feather:clipboard',
        navGroup: {
          name: 'IMS',
          icon: 'feather:layers',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/membership-details',
      name: 'membershipDetails',
      component: MembershipDetailsView,
      meta: {
        title: 'IMS Membership Details',
        icon: 'feather:shield',
        navGroup: {
          name: 'IMS',
          icon: 'feather:layers',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/payment-extraction',
      name: 'paymentExtraction',
      component: PaymentExtractionView,
      meta: {
        title: 'IMS Payables',
        icon: 'feather:download-cloud',
        navGroup: {
          name: 'IMS',
          icon: 'feather:layers',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/partner-members/iwc-workbook-extraction',
      name: 'iwcWorkbookExtraction',
      component: IwcWorkbookExtractionView,
      meta: {
        title: 'IWC Batch Totals',
        icon: 'feather:database',
        navGroup: {
          name: 'Partners',
          icon: 'feather:users',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/partner-members/imported',
      name: 'importedPartnerMembers',
      component: ImportedPartnerMembersView,
      meta: {
        title: 'Imported Members',
        icon: 'feather:users',
        navGroup: {
          name: 'Partners',
          icon: 'feather:users',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/partner-members',
      name: 'partnerMembers',
      component: BusinessPartnerUploadsView,
      meta: {
        title: 'Business Partner Uploads',
        icon: 'feather:upload-cloud',
        navGroup: {
          name: 'Partners',
          icon: 'feather:users',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/business-partners',
      name: 'businessPartners',
      component: BusinessPartnersView,
      meta: {
        title: 'Business Partners',
        icon: 'feather:briefcase',
        navGroup: {
          name: 'Partners',
          icon: 'feather:users',
        },
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'regUser'] }],
      },
    },
    {
      path: '/users',
      name: 'users',
      component: UserView,
      meta: {
        title: 'Users',
        icon: 'feather:users',
        navItem: [true, { visibleTo: ['superAdmin', 'admin'] }],
      },
    },
    {
      path: '/users/add',
      name: 'addUsers',
      component: SingleUserView,
      meta: {
        title: 'Add Users',
        icon: 'feather:home',
        navItem: [false, { visibleTo: ['superAdmin', 'admin'] }],
      },
    },
    {
      path: '/users/:id/edit',
      name: 'editUsers',
      component: SingleUserView,
      meta: {
        title: 'Edit Users',
        icon: 'feather:home',
        navItem: [false, { visibleTo: ['superAdmin', 'admin'] }],
      },
    },
    {
      path: '/options',
      name: 'options',
      component: OptionsView,
      meta: {
        title: 'Setup Library',
        icon: 'feather:sliders',
        navItem: [true, { visibleTo: ['superAdmin', 'admin', 'auditor', 'regUser'] }],
      },
    },
    {
      path: '/userlogs',
      name: 'userlogs',
      component: UserLogsView,
      meta: {
        title: 'User Logs',
        icon: 'tabler:address-book',
        navGroup: {
          name: 'Logs',
          icon: 'feather:activity',
        },
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
        navGroup: {
          name: 'Logs',
          icon: 'feather:activity',
        },
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

  const { getToken, getStoredRoles, fetchCurrentUser, logout, logoutForPasswordReset } = useAuth()
  const token = getToken()
  let currentUser = null as Awaited<ReturnType<typeof fetchCurrentUser>> | null

  if (!token && to.path !== '/login') return router.push('/login')
  if (token && to.path === '/login') {
    currentUser = await fetchCurrentUser()

    if (currentUser?.mustChangePassword) {
      return router.push('/accountSettings?forcePasswordReset=1')
    }

    return router.push('/')
  }

  const visibleTo = getVisibleRoles(to.meta?.navItem)
  if (!token || !visibleTo.length) return

  let currentRoles = getStoredRoles()

  if (!currentRoles.length) {
    currentUser = await fetchCurrentUser()
    currentRoles = currentUser?.roles || []
  }

  if (!currentUser && token) {
    currentUser = await fetchCurrentUser()
  }

  if (currentUser?.mustChangePassword && !isPasswordResetRoute(to.path)) {
    await logoutForPasswordReset()
    return
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
