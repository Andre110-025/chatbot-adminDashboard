<script setup>
import { ref, onMounted } from 'vue'
import Filter from './Filter.vue'
import Notification from './Icons/Notification.vue'
import Search from './Icons/Search.vue'
import Logo from './Logo.vue'
import Download from './Icons/Download.vue'
import { usePWAInstall } from '@/composables/usePWAInstall'

const { canInstall, installApp, isInstalled } = usePWAInstall()

const showDownloadBtn = ref(false)

// Setup everything on mount
onMounted(() => {
  const isPWA = window.matchMedia('(display-mode: standalone)').matches

  if (!isPWA) {
    showDownloadBtn.value = true
  }
})

const checkIfInstalled = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  // ...
  isInstalled.value = isStandalone || isStandaloneIOS
}
</script>

<template>
  <header
    class="h-[60px] flex flex-row justify-between items-center px-5 shadow bg-white rounded-lg"
  >
    <Logo class="w-[155px] h-[45px]" />
    <div class="flex flex-row items-center gap-4">
      <Notification class="text-mainColor w-6 h-6" />
      <div>
        <div v-if="!isInstalled">
          <button
            v-if="canInstall"
            @click="installApp"
            class="h-[37px] rounded-xl bg-mainColor text-white font-semibold shadow-lg flex items-center justify-center gap-2 w-[40px] px-0 min-[450px]:w-[120px] min-[450px]:px-4"
          >
            <Download class="w-5 h-5" />
            <span class="hidden min-[450px]:inline">Install</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
