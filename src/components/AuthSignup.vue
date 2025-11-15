<script setup>
import { computed, onMounted, ref, reactive, nextTick } from 'vue'
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

const userData = reactive({
  full_name: '',
  email: '',
  phone_number: '',
  business_name: '',
  website: '',
  full_address: '',
  password: '',
  cpassword: '',
  category: '',
})
const { containsLowercase, containsUppercase, containsSpecial, containsNumber } = useHelpers()
const rules = computed(() => ({
  full_name: {
    required: helpers.withMessage('Name is required', required),
    minLength: helpers.withMessage('Name must be at least 8 characters', minLength(8)),
  },
  email: { required, email },
  phone_number: { required },
  business_name: { required },
  website: {
    required: helpers.withMessage('Website Website is required ', required),
    includesHttps: helpers.withMessage(
      "Website must start with 'https://' or 'http://'",
      (value) => {
        if (!value) return false
        return value.startsWith('https://') || value.startsWith('http://')
      },
    ),
  },
  category: { required },
  full_address: { required },
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

const signInForm = async () => {
  const isFormValid = await v$.value.$validate()
  if (!isFormValid) return

  try {
    loading.value = true
    const { cpassword, ...payload } = userData
    const response = await axios.post(
      'https://assitance.storehive.com.ng/public/api/register',
      payload,
    )
    console.log(response)
    data.value = response.data

    adminStore.setUser({
      full_name: userData.full_name,
      phone_number: userData.phone_number,
      email: data.value.success.email,
      business_name: userData.business_name,
      website: userData.website,
      category: userData.category,
      full_address: userData.full_address,
      userId: data.value.success.userId,
      expiry_date: data.value.success.expiry_date,
    })

    if (data.value.success.token && data.value.success.email) {
      const token = data.value.success.token
      console.log('token:', data.value.success.token)
      adminStore.setToken(token)

      router.push({
        name: 'verifyEmail',
        query: {
          email: data.value.success.email,
          token,
        },
      })
    }

    Object.keys(userData).forEach((key) => (userData[key] = ''))
    toast.success('Account created successfully')
  } catch (error) {
    toast.error("Couldn't create account, try again")
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-gray-50 flex items-center justify-center p-4 min-h-screen">
    <div class="w-full max-w-lg h-[90vh] overflow-y-auto">
      <div class="bg-white rounded-lg border shadow-sm border-gray-200 p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Create Account</h2>
            <p class="text-sm text-gray-500 mt-0.5">Get started in minutes</p>
          </div>
          <RouterLink
            :to="{ name: 'login' }"
            class="bg-gray-900 w-[100px] h-[38px] flex items-center justify-center text-white font-semibold rounded-[20px] transition-all duration-300 hover:bg-gray-950 hover:-translate-y-0.5 shadow-md hover:shadow-lg"
          >
            Login
          </RouterLink>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              v-model="userData.full_name"
              @input="v$.full_name.$touch()"
              @blur="v$.full_name.$touch()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <p v-if="v$.full_name.$error" class="text-xs text-red-500 mt-1">
              {{ v$.full_name.$errors[0].$message }}
            </p>
          </div>

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

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                v-model="userData.phone_number"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                v-model="userData.business_name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                v-model="userData.website"
                @input="v$.website.$touch()"
                @blur="v$.website.$touch()"
                placeholder="Enter website name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <p v-if="v$.website.$error" class="text-xs text-red-500 mt-1">
                {{ v$.website.$errors[0]?.$message }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
              <input
                type="text"
                v-model="userData.category"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              v-model="userData.full_address"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

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
            @click="signInForm"
            class="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loading v-if="loading" />
            <span v-if="!loading">Sign Up</span>
          </button>

          <div class="flex items-center justify-center space-x-2 mt-2">
            <input
              id="terms"
              type="checkbox"
              class="h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
            />
            <label for="terms" class="text-xs text-gray-500 select-none">
              By signing up, you agree to our Terms and Privacy Policy.
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
