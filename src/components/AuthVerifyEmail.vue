<script setup>
import { ref, onMounted, nextTick, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import Loading from './Icons/Loading.vue'
import { useAdminStore } from '@/stores/user'

const code = ref(['', '', '', '', '', ''])
const inputs = ref([])
const adminStore = useAdminStore()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const userId = computed(() => adminStore.userInfo.userId)
const token = computed(() => route.query.token)
const countdown = ref(60)
const showResend = ref(false)
const email = ref('')
let interval = null

console.log('userId:', userId.value)
console.log('token:', token.value)

const getVerifyEmail = async () => {
  const userEmail = route.query.email
  if (!userEmail) return

  email.value = userEmail

  try {
    const response = await axios.patch('/checkemailandsendtoken', { email: userEmail })
    console.log(response)
  } catch (error) {
    toast.error('Error sending verification email')
    console.error('Error sending verification email:', error)
  }
}

onMounted(() => {
  getVerifyEmail()
  startCountdown()
})

const onInput = (index, event) => {
  const val = event.target.value
  if (!/^\d$/.test(val)) {
    code.value[index] = ''
    return
  }
  if (index < 5) {
    nextTick(() => inputs.value[index + 1].focus())
  }
}

const onBackspace = (index, event) => {
  if (code.value[index] === '' && index > 0) {
    nextTick(() => inputs.value[index - 1].focus())
  }
}

const submitCode = async () => {
  if (code.value.some((d) => d === '')) {
    toast.error('Please enter the full 6-digit code')
    return
  }
  console.log('token before submit:', adminStore.token.value)
  try {
    loading.value = true
    const enteredCode = code.value.join('')
    const response = await axios.patch('/verifyemail', {
      userid: userId.value,
      token: Number(enteredCode),
    })
    toast.success('Account Created Successfully')
    router.push({ name: 'overview' })
    console.log(response)
  } catch (error) {
    toast.error('Error sending verification code')
    console.error('Error sending verification code:', error)
  } finally {
    loading.value = false
  }
}

const startCountdown = () => {
  showResend.value = false
  countdown.value = 60
  interval = setInterval(() => {
    countdown.value--
    if (countdown.value === 0) {
      clearInterval(interval)
      showResend.value = true
    }
  }, 1000)
}

const resendOtp = () => {
  getVerifyEmail()
  toast.info('Code resent, check your mail')
  startCountdown()
}

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<template>
  <div class="bg-gray-50 flex items-center justify-center p-4 min-h-screen">
    <div class="w-full max-w-lg h-[60vh] flex flex-col items-center justify-center">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Enter Verification Code</h2>

      <p class="text-gray-700 text-center w-[300px] mb-6 leading-relaxed">
        Enter the OTP sent to <strong>{{ email }}</strong>
      </p>

      <div class="flex space-x-2 mb-6 w-[300px] justify-center">
        <input
          v-for="(digit, index) in code"
          :key="index"
          type="text"
          maxlength="1"
          class="w-12 h-12 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-lg font-medium bg-white shadow-sm"
          v-model="code[index]"
          @input="onInput(index, $event)"
          @keydown.backspace="onBackspace(index, $event)"
          ref="inputs"
        />
      </div>

      <p class="w-[300px] text-sm text-gray-800 text-center mb-6">
        Note: Check your spam or promotions folder if you don't see the OTP in your inbox.
      </p>

      <p
        v-if="showResend"
        @click="resendOtp"
        class="w-[300px] text-sm text-gray-900 text-center mb-6 cursor-pointer hover:underline"
      >
        Resend OTP
      </p>

      <p v-else class="w-[300px] text-sm text-gray-500 text-center mb-6">
        You can resend code in {{ countdown }}s
      </p>

      <button
        :disabled="loading || code.some((d) => d === '')"
        @click="submitCode"
        class="w-[300px] bg-gray-900 text-white py-2.5 rounded-md font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Loading v-if="loading" />
        <span v-if="!loading">Submit Code</span>
      </button>
    </div>
  </div>
</template>
