<script setup>
import { VueFinalModal } from 'vue-final-modal'
import Cancel from './Icons/Cancel.vue'
// import Loading from './Icons/Loading.vue'
import { computed, reactive, ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import Loading from './Icons/Loading.vue'
import { toast } from 'vue3-toastify'
import axios from 'axios'

const emit = defineEmits(['confirm'])
const loading = ref(false)
const touched = ref(false)

const domainData = reactive({
  website: '',
  business_name: '',
  business_category: '',
})

const rules = computed(() => ({
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
  business_name: { required },
  business_category: { required },
}))

const v$ = useVuelidate(rules, domainData)

const submitDomain = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return

  try {
    loading.value = true
    const response = await axios.post('https://assitance.storehive.com.ng/public/api/addproduct', {
      website: domainData.website,
      business_name: domainData.business_name,
      category: domainData.business_category,
    })
    console.log(response)
    Object.keys(domainData).forEach((key) => (domainData[key] = ''))
    toast.success('Form submitted successfully')
  } catch (error) {
    toast.error('Could not submit form')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VueFinalModal
    :overlay="true"
    :click-to-close="true"
    :overlay-transition="'vfm-fade'"
    :content-transition="'vfm-fade'"
    overlay-class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
    content-class="bg-white w-[600px] max-w-[850px] h-auto rounded-2xl shadow-2xl overflow-hidden z-[70]"
    class="fixed inset-0 flex items-center justify-center p-4 z-[70]"
  >
    <header
      class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white"
    >
      <div>
        <h2 class="text-xl font-semibold text-gray-800">Website Information</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          Configure your AI chatbot to match your brand and operations.
        </p>
      </div>

      <button
        @click="emit('confirm')"
        class="p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all duration-200 active:scale-95"
        title="Close panel"
      >
        <Cancel />
      </button>
    </header>

    <form @submit.prevent="submitDomain" class="p-6 space-y-8 bg-white">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
        <input
          v-model="domainData.website"
          type="text"
          @input="v$.website.$touch()"
          @blur="v$.website.$touch()"
          placeholder="Enter website name"
          class="h-11 w-full px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:border-teal-500 focus:bg-white focus:shadow-sm transition-all duration-200"
        />
        <p v-if="v$.website.$error" class="text-xs text-red-500 mt-1">
          {{ v$.website.$errors[0]?.$message }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Business Name</label>
        <input
          v-model="domainData.business_name"
          type="text"
          id="business name"
          placeholder="Enter category"
          class="h-11 w-full px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:border-teal-500 focus:bg-white focus:shadow-sm transition-all duration-200"
        />
        <p class="mt-1 text-xs text-gray-400">e.g. Mexon store</p>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Business Category</label>
        <input
          v-model="domainData.business_category"
          type="text"
          id="category"
          placeholder="Enter category"
          class="h-11 w-full px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:border-teal-500 focus:bg-white focus:shadow-sm transition-all duration-200"
        />
        <p class="mt-1 text-xs text-gray-400">e.g. products, ads, e.t.c</p>
      </div>
      <div class="flex justify-end pt-2 pr-3">
        <button
          type="submit"
          :disabled="loading || v$.$invalid"
          class="group relative inline-flex items-center gap-2.5 px-7 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loading v-if="loading" class="w-4 h-4" />
          <span v-else class="relative z-10">Submit Form</span>
          <div
            class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 skew-x-12"
          ></div>
        </button>
      </div>
    </form>
  </VueFinalModal>
</template>
