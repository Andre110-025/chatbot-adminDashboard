<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { useHelpers } from '../helper'
import { useVuelidate } from '@vuelidate/core'
import { useAdminStore } from '@/stores/user'
import { toast } from 'vue3-toastify'
import { RouterLink, useRouter } from 'vue-router'
import { required, email, minLength, helpers, sameAs } from '@vuelidate/validators'
import axios from 'axios'
import EyeOpen from './Icons/EyeOpen.vue'
import EyeClose from './Icons/EyeClose.vue'
import Loading from './Icons/Loading.vue'

const loading = ref(false)
const adminStore = useAdminStore()
const router = useRouter()
const showPwd = ref(false)
const data = ref(null)
const touched = ref(false)

const userId = computed(() => adminStore.userInfo.userId)

const userData = reactive({
  password: '',
  cpassword: '',
})
const { containsLowercase, containsUppercase, containsSpecial, containsNumber } = useHelpers()
const rules = computed(() => ({
  password: {
    required,
    minLength: helpers.withMessage('Password must be at least 6 characters long', minLength(6)),
    containsUpperCase: helpers.withMessage('Password must include an uppercase', containsUppercase),
    containsLowerCase: helpers.withMessage('Password must include lowercase', containsLowercase),
    containsNumber: helpers.withMessage('Password must include numbers', containsNumber),
    containsSpecial: helpers.withMessage(
      'Password must include any of (#?!@$()`~%^&*-+=)',
      containsSpecial,
    ),
  },
  cpassword: {
    required: helpers.withMessage('Password confirmation is required', required),
    sameAsPassword: helpers.withMessage(
      "Passwords don't match",
      sameAs(computed(() => userData.password)),
    ),
  },
}))
const v$ = useVuelidate(rules, userData)

const changePassword = async () => {
  const isFormValid = await v$.value.$validate()
  if (!isFormValid) return

  try {
    loading.value = true
    const { cpassword, ...payload } = userData
    const response = await axios.patch(
      'https://assitance.storehive.com.ng/public/api/changepassword',
      {
        userid: userId.value,
        password: userData.password,
      },
    )
    console.log(response)
    toast.success('Password Updated Successfully')
    router.push({ name: 'overview' })
  } catch (error) {
    toast.error('Unable to reset password!')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md p-8 rounded-2xl shadow-md">
      <h2 class="text-2xl font-semibold text-gray-900 mb-6 text-center">Change Password</h2>

      <p class="text-gray-600 text-center mb-6">
        Enter your new password below to reset your account access.
      </p>

      <form @submit.prevent="changePassword" class="flex flex-col space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
          <div class="relative">
            <input
              :type="showPwd ? 'text' : 'password'"
              v-model="userData.password"
              @input="(v$.password.$touch(), (touched = true))"
              @blur="(v$.password.$touch(), (touched = true))"
              class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              @click="showPwd = !showPwd"
            >
              <EyeOpen v-if="!showPwd" />
              <EyeClose v-else />
            </button>
          </div>
          <ul v-if="touched && v$.password.$error" class="mt-2 text-xs text-red-500 space-y-1">
            <li v-for="(item, i) in v$.password.$errors" :key="i">{{ item.$message }}</li>
          </ul>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div class="relative">
            <input
              :type="showPwd ? 'text' : 'password'"
              v-model="userData.cpassword"
              @input="(v$.cpassword.$touch(), (touched = true))"
              @blur="(v$.cpassword.$touch(), (touched = true))"
              class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              @click="showPwd = !showPwd"
            >
              <EyeOpen v-if="!showPwd" />
              <EyeClose v-else />
            </button>
          </div>
          <ul v-if="touched && v$.cpassword.$error" class="mt-2 text-xs text-red-500 space-y-1">
            <li v-for="(item, i) in v$.cpassword.$errors" :key="i">{{ item.$message }}</li>
          </ul>
        </div>

        <button
          :disabled="loading || v$.$invalid"
          type="submit"
          class="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loading v-if="loading" />
          <span v-if="!loading">Update Password</span>
        </button>
      </form>

      <RouterLink
        :to="{ name: 'login' }"
        class="block text-center text-gray-700 font-semibold mt-6 transition-all duration-300 hover:text-black"
      >
        Back to Login
      </RouterLink>
    </div>
  </div>
</template>
