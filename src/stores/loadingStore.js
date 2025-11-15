import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref(true)
  const currentRoute = ref('')

  function startLoading(routeName) {
    isLoading.value = true
    currentRoute.value = routeName
  }

  function finishLoading() {
    isLoading.value = false
  }

  return {
    isLoading,
    currentRoute,
    startLoading,
    finishLoading,
  }
})
