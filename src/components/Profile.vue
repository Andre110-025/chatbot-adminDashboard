<script setup>
import Loading from './Icons/Loading.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/user'
import { toast } from 'vue3-toastify'

const router = useRouter()
const adminStore = useAdminStore()
const loading = ref(false)

// console.log('All User Info:', adminStore.userInfo)
// console.log('Auth Token:', adminStore.token)

const logoutUser = () => {
  if (loading.value) return
  loading.value = true

  toast.loading('Logging out user...')

  setTimeout(() => {
    adminStore.logout()
    toast.success('Logged out successfully 👋')
    router.push({ name: 'login' })
  }, 3000)
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 dark:text-gray-100 transition-colors"
  >
    <div
      class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-gray-200 animate-fadeUp"
    >
      <div
        class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-mainColor to-red-500 flex items-center justify-center text-white text-2xl font-bold"
      >
        {{ adminStore.userInfo?.full_name?.charAt(0)?.toUpperCase() || 'U' }}
      </div>

      <h2 class="text-xl font-semibold mb-2 text-gray-700">
        {{ adminStore.userInfo?.full_name || 'Guest User' }}
      </h2>
      <p class="text-sm mb-6 text-gray-600">You’re currently logged in. Click below to log out.</p>

      <button
        @click="logoutUser"
        :disabled="loading"
        class="w-full px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <Loading v-if="loading" />
        <span class="text-sm font-medium text-white" v-if="!loading">Log Out</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeUp {
  animation: fadeUp 0.5s ease-out;
}
</style>
