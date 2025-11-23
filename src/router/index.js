import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '@/views/AuthView.vue'
import DashboardView from '@/views/DashboardView.vue'
import { useAdminStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
      // name: 'auth',
      component: AuthView,
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('../components/AuthLogin.vue'),
        },
        {
          path: 'signup',
          name: 'signup',
          component: () => import('../components/AuthSignup.vue'),
        },
        {
          path: 'verifyEmail',
          name: 'verifyEmail',
          component: () => import('../components/AuthVerifyEmail.vue'),
        },
        {
          path: 'forgetPwd',
          name: 'forgetPwd',
          component: () => import('../components/AuthForgetPwd.vue'),
        },
        {
          path: 'verifyResetPwd',
          name: 'verifyResetPwd',
          component: () => import('../components/AuthVerifyPwdToken.vue'),
        },
        {
          path: 'changePwd',
          name: 'changePwd',
          component: () => import('../components/AuthChangePwd.vue'),
        },
      ],
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      children: [
        {
          path: '/overview',
          name: 'overview',
          component: () => import('../components/Overview.vue'),
        },
        {
          path: '/request',
          name: 'request',
          component: () => import('../components/Request.vue'),
        },
        {
          path: '/chatreview',
          name: 'chatreview',
          component: () => import('../components/ChatReview.vue'),
        },
        {
          path: '/addDomain',
          name: 'addDomain',
          component: () => import('../components/AddDomain.vue'),
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('../components/Settings.vue'),
        },
        {
          path: '/profile',
          name: 'profile',
          component: () => import('../components/Profile.vue'),
        },
      ],
    },
  ],
})

const publicPages = ['login', 'signup', 'verifyEmail', 'forgetPwd', 'verifyResetPwd', 'changePwd']

router.beforeEach((to, from, next) => {
  const adminStore = useAdminStore()
  const now = new Date()
  const isExpired =
    adminStore.userInfo?.expiry_date && new Date(adminStore.userInfo.expiry_date) <= now
  const isAuthenticated = adminStore.token && !isExpired

  if (!publicPages.includes(to.name) && !isAuthenticated) {
    adminStore.logout()
    return next({ name: 'login' })
  }

  next()
})

export default router
