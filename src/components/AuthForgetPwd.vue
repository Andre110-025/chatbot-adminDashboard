<script setup>
import { ref, reactive, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/user'
import Loading from './Icons/Loading.vue'

const router = useRouter()
const adminStore = useAdminStore()

const loading = ref(false)

const userData = reactive({
  email: '',
})

const rules = computed(() => ({
  email: {
    email,
    required,
  },
}))

const v$ = useVuelidate(rules, userData)

const checkEmail = async () => {
  const isFormCorrect = await v$.value.$validate()
  if (!isFormCorrect) return

  try {
    loading.value = true
    const response = await axios.post('/checkemailandsendpasswordtoken', userData)
    console.log(response)

    if (response.status == 200) {
      const userId = response.data.userId
      router.push({ name: 'verifyResetPwd', query: { userId } })
    }
  } catch (error) {
    toast.error('Error trying to get code')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md p-8 rounded-2xl shadow-md">
      <h2 class="text-2xl font-semibold text-gray-900 mb-6 text-center">Forgot Password</h2>

      <p class="text-gray-600 text-center mb-6">
        Enter your registered email address and we’ll send you a link to reset your password.
      </p>

      <form @submit.prevent="checkEmail" class="flex flex-col space-y-4">
        <input
          type="email"
          v-model="userData.email"
          placeholder="Enter your email"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <button
          :disabled="loading || v$.$invalid"
          type="submit"
          class="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loading v-if="loading" />
          <span v-if="!loading">Get Token</span>
        </button>
      </form>

      <div class="flex items-center justify-between mt-4">
        <p class="text-sm text-gray-500">Remember your password?</p>

        <RouterLink
          :to="{ name: 'login' }"
          class="text-gray-700 font-semibold transition-all duration-300 hover:text-gray-900"
        >
          Login
        </RouterLink>
      </div>
    </div>
  </div>
</template>
