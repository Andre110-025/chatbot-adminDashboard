<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TopHeading from '@/components/TopHeading.vue'
import SideNavBar from '@/components/SideNavBar.vue'
import InternetConnection from '@/components/InternetConnection.vue'

const isExpanded = ref(false)

const isBrowserOnline = ref(navigator.onLine)

const checkNetwork = () => {
  isBrowserOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', checkNetwork)
  window.addEventListener('offline', checkNetwork)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', checkNetwork)
  window.removeEventListener('offline', checkNetwork)
})

const reloadPage = () => {
  checkNetwork()

  if (isBrowserOnline.value) {
    location.reload()
  }
}
</script>

<template>
  <div class="flex min-h-[100dvh]">
    <SideNavBar v-model:isExpanded="isExpanded" />

    <div
      :class="[
        'flex-1 flex flex-col transition-all duration-300 bg-gray-100',
        isExpanded ? 'sm:ml-64' : 'sm:ml-[85px]',
      ]"
    >
      <div class="m-3 space-y-5 pb-24 sm:pb-0">
        <TopHeading />

        <main>
          <InternetConnection v-if="!isBrowserOnline" :reloadPage="reloadPage" />

          <div v-else>
            <RouterView />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
