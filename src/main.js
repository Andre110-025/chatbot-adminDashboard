import './assets/main.css'
import 'vue3-toastify/dist/index.css'
import { createApp } from 'vue'
import { createVfm } from 'vue-final-modal'
import { createPinia } from 'pinia'
import { useLoadingStore } from './stores/loadingStore'
import { useAdminStore } from './stores/user'
import App from './App.vue'
import router from './router'
import axios from 'axios'

const app = createApp(App)
const vfm = createVfm()

app.use(createPinia())
app.use(router)

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
const loadingStore = useLoadingStore()
router.beforeEach((to, from, next) => {
  // Start loading before route change
  loadingStore.startLoading(to.name)
  next()
})

router.afterEach(() => {
  // Finish loading after navigation completes
  setTimeout(() => {
    loadingStore.finishLoading()
  }, 800)
})

app.config.globalProperties.$axios = axios
app.use(vfm)
app.mount('#app')

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const adminStore = useAdminStore()
      adminStore.logout()
      router.push('/login')
    }
    return Promise.reject(error)
  },
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // This MUST be in your /public folder
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('✅ PWA Service Worker Registered!', reg.scope))
      .catch((err) => console.error('❌ PWA Service Worker Failed!', err))
  })
}
