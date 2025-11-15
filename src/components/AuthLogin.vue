<script setup>
import { RouterLink } from 'vue-router'
import { ref, reactive, computed, onMounted } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { useAdminStore } from '@/stores/user'
import axios from 'axios'
import Loading from './Icons/Loading.vue'
import EyeOpen from './Icons/EyeOpen.vue'
import EyeClose from './Icons/EyeClose.vue'

const adminStore = useAdminStore()
const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)
const data = ref(null)
const touched = ref(false)

const userData = reactive({
  email: '',
  password: '',
})

const rules = computed(() => ({
  email: { email, required },
  password: { required },
}))

const v$ = useVuelidate(rules, userData)

const loginForm = async () => {
  const isFormValid = await v$.value.$validate()
  if (!isFormValid) return

  try {
    loading.value = true
    const response = await axios.post(
      'https://assitance.storehive.com.ng/public/api/login',
      userData,
    )
    console.log(response)

    data.value = response.data

    adminStore.setToken(data.value.Login.token)
    adminStore.setUser({
      expiry_date: data.value.Login.expiry_date,
      userId: data.value.Login.userId,
    })
    toast.success('Login was successful!')
    setTimeout(() => {
      router.push({ name: 'overview' })
    }, 3000)
  } catch (error) {
    toast.error('Error trying to login')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-gray-50 flex items-center justify-center p-4 min-h-screen">
    <div class="w-full max-w-lg h-[60vh] overflow-y-auto">
      <div class="bg-white rounded-lg border shadow-sm border-gray-200 p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Login</h2>
            <p class="text-sm text-gray-500 mt-0.5">
              Enter your credentials to access your account
            </p>
          </div>
          <RouterLink
            :to="{ name: 'signup' }"
            class="bg-gray-900 w-[100px] h-[38px] flex items-center justify-center text-white font-semibold rounded-[20px] transition-all duration-300 hover:bg-gray-950 hover:-translate-y-0.5 shadow-md hover:shadow-lg"
          >
            Sign Up
          </RouterLink>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              v-model="userData.email"
              @input="v$.email.$touch()"
              @blur="v$.email.$touch()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <p v-if="v$.email.$error" class="text-xs text-red-500 mt-1">
              {{ v$.email.$errors[0]?.$message }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="userData.password"
                @input="(v$.password.$touch(), (touched = true))"
                @blur="(v$.password.$touch(), (touched = true))"
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <EyeOpen v-if="!showPassword" />
                <EyeClose v-else />
              </button>
            </div>
            <ul v-if="touched && v$.password.$error" class="mt-2 text-xs text-red-500 space-y-1">
              <li v-for="(item, i) in v$.password.$errors" :key="i">{{ item.$message }}</li>
            </ul>
          </div>
          <RouterLink
            :to="{ name: 'forgetPwd' }"
            class="flex items-start text-gray-700 font-semibold transition-all duration-300"
          >
            Forgot Password?
          </RouterLink>

          <button
            :disabled="loading || v$.$invalid"
            @click="loginForm"
            class="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loading v-if="loading" />
            <span v-if="!loading">Login</span>
          </button>

          <p class="text-xs text-center text-gray-500">
            By logging in, you agree to our Terms and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
