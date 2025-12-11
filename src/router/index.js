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
          meta: { title: 'Login' },
        },
        {
          path: 'signup',
          name: 'signup',
          component: () => import('../components/AuthSignup.vue'),
          meta: { title: 'Signup' },
        },
        {
          path: 'verifyEmail',
          name: 'verifyEmail',
          component: () => import('../components/AuthVerifyEmail.vue'),
          meta: { title: 'Verify Email' },
        },
        {
          path: 'forgetPwd',
          name: 'forgetPwd',
          component: () => import('../components/AuthForgetPwd.vue'),
          meta: { title: 'Forget Password' },
        },
        {
          path: 'verifyResetPwd',
          name: 'verifyResetPwd',
          component: () => import('../components/AuthVerifyPwdToken.vue'),
          meta: { title: 'Verify Reset' },
        },
        {
          path: 'changePwd',
          name: 'changePwd',
          component: () => import('../components/AuthChangePwd.vue'),
          meta: { title: 'Change Password' },
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
          meta: { title: 'Overview' },
        },
        {
          path: '/request',
          name: 'request',
          component: () => import('../components/Request.vue'),
          meta: { title: 'Knowledge base' },
        },
        {
          path: '/chatreview',
          name: 'chatreview',
          component: () => import('../components/ChatReview.vue'),
          meta: { title: 'Chat Review' },
        },
        {
          path: '/addDomain',
          name: 'addDomain',
          component: () => import('../components/AddDomain.vue'),
          meta: { title: 'Manage Domain' },
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('../components/Settings.vue'),
          meta: { title: 'Settings' },
        },
        {
          path: '/profile',
          name: 'profile',
          component: () => import('../components/Profile.vue'),
          meta: { title: 'Profile' },
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
