<script setup>
import { RouterView, useRouter } from 'vue-router'
import { ref, watch } from 'vue'
import LoadingBar from './components/LoadingBar.vue'
import { useLoadingStore } from './stores/loadingStore'
import { ModalsContainer } from 'vue-final-modal'

const router = useRouter()
const loadingStore = useLoadingStore()
const isRouteReady = ref(false)

router.beforeEach(() => {
  isRouteReady.value = false
})

router.afterEach(() => {
  setTimeout(() => {
    isRouteReady.value = true
  }, 700)
})
</script>

<template>
  <LoadingBar color="#05716c" :height="3" />
  <div v-if="isRouteReady">
    <RouterView />
    <ModalsContainer />
  </div>
</template>
