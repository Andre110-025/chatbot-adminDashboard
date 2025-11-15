import './assets/main.css'
import 'vue3-toastify/dist/index.css'
// import 'vue-final-modal/dist/style.css'
import { createApp } from 'vue'
import { createVfm } from 'vue-final-modal'
import { createPinia } from 'pinia'
import { useLoadingStore } from './stores/loadingStore'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const vfm = createVfm()

app.use(createPinia())
app.use(router)

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

app.use(vfm)
app.mount('#app')
