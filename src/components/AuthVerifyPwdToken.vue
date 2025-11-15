<script setup>
import { ref, nextTick, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import { useAdminStore } from '@/stores/user'

const adminStore = useAdminStore()
const router = useRouter()
const loading = ref(false)
const code = ref(['', '', '', '', '', ''])
const inputs = ref([])

const userId = computed(() => adminStore.userInfo.userId)

const verifyCode = async () => {
  if (loading.value) return
  if (code.value.some((d) => d === '')) return

  loading.value = true
  try {
    const enteredCode = code.value.join('')
    const response = await axios.post(
      'https://assitance.storehive.com.ng/public/api/checkpasswordtoken',
      {
        userid: userId.value,
        token: Number(enteredCode),
      },
    )
    console.log(response)
    toast.success('Code verified successfully!')
    router.push({ name: 'changePwd' })
  } catch (error) {
    toast.error('Invalid or expired code')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// Move to next input automatically
const onInput = (index, event) => {
  const val = event.target.value
  if (!/^\d$/.test(val)) {
    code.value[index] = ''
    return
  }

  if (index < 5) {
    nextTick(() => inputs.value[index + 1].focus())
  }

  // Check if all 6 digits are filled, then submit automatically
  if (code.value.every((d) => d !== '')) {
    verifyCode()
  }
}

const onBackspace = (index, event) => {
  if (code.value[index] === '' && index > 0) {
    nextTick(() => inputs.value[index - 1].focus())
  }
}

onMounted(() => {
  nextTick(() => inputs.value[0]?.focus())
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm text-center">
      <h2 class="text-2xl font-semibold mb-6 text-gray-900">Enter Verification Code</h2>
      <p class="text-gray-600 mb-6">Enter the 6-digit code sent to your email</p>

      <div class="flex justify-center space-x-2 mb-6">
        <input
          v-for="(digit, index) in code"
          :key="index"
          type="text"
          maxlength="1"
          v-model="code[index]"
          @input="onInput(index, $event)"
          @keydown.backspace="onBackspace(index, $event)"
          ref="inputs"
          class="w-12 h-12 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-lg font-medium"
        />
      </div>
    </div>
  </div>
</template>
