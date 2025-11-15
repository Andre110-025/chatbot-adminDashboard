<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useLoadingStore } from '@/stores/loadingStore'

const props = defineProps({
  color: { type: String, default: '#00DC82' },
  height: { type: Number, default: 3 },
})

const loadingStore = useLoadingStore()

const loading = ref(false)
const percentage = ref(0)
const isLoading = ref(false)
let interval = null

const startLoading = () => {
  loading.value = true
  isLoading.value = true
  percentage.value = 0

  interval = setInterval(() => {
    if (percentage.value < 100) {
      // picks a random step from 1–5% add it to 1 to create a jumpy load
      percentage.value += Math.floor(Math.random() * 5) + 1
    }
  }, 200)
}

const finishLoading = () => {
  percentage.value = 100
  if (interval) {
    clearInterval(interval)
    interval = null
  }

  setTimeout(() => {
    loading.value = false
    isLoading.value = false

    loadingStore.finishLoading()
  }, 500)
}

watch(
  () => loadingStore.isLoading,
  // val watches loadingstore state, if true start, if false end
  (val) => (val ? startLoading() : finishLoading()),
)

onMounted(() => {
  if (loadingStore.isLoading) {
    startLoading()
  } else {
    if (loadingStore.isLoading) {
      loadingStore.finishLoading()
    }
  }
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})
</script>

<template>
  <div class="fixed top-0 left-0 right-0 z-[999999]" :style="{ height: `${height}px` }">
    <div
      class="relative h-full transition-all duration-400"
      :class="isLoading ? 'transition-width duration-100' : ''"
      :style="{
        // if true asign percentage value, else false
        width: loading ? `${percentage}%` : '0%',
        // if true show bar, else false
        opacity: loading ? 1 : 0,
        backgroundColor: color,
      }"
    ></div>
  </div>
</template>
