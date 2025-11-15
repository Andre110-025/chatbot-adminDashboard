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
      beforeEnter: (to, from, next) => {
        const adminStore = useAdminStore()
        const now = new Date()
        if (!adminStore.token && adminStore.userInfo.expiry_date < now) {
          next()
        } else {
          next({ name: 'overview' })
        }
      },
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

export default router
