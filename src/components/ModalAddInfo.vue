<script setup>
import { computed, ref, reactive } from 'vue'
import { toast } from 'vue3-toastify'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useAdminStore } from '@/stores/user'
import Loading from './Icons/Loading.vue'
import axios from 'axios'
import { VueFinalModal } from 'vue-final-modal'
import Cancel from './Icons/Cancel.vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps({
  productId: Number,
})

console.log(props.productId)

const emit = defineEmits(['confirm'])
const adminStore = useAdminStore()
const token = ref(adminStore.token)
const loading = ref(false)

const requestData = reactive({
  title: '',
  category: '',
  content: '',
})

const rules = computed(() => ({
  title: { required },
  category: { required },
  content: { required },
}))

const v$ = useVuelidate(rules, requestData)

const submitRequest = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return

  // normalize content
  const content = requestData.content.replace(/<p><br><\/p>/g, '').trim()

  try {
    loading.value = true
    const response = await axios.post(
      `https://assitance.storehive.com.ng/public/api/chat/knowledge/${props.productId}`,
      {
        title: requestData.title,
        category: requestData.category,
        content: requestData.content,
        token: token.value,
      },
    )
    console.log(response)
    Object.keys(requestData).forEach((key) => (requestData[key] = ''))
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
    content-class="bg-white w-full max-w-[850px] h-auto rounded-2xl shadow-2xl overflow-hidden z-[70]"
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

    <form @submit.prevent="submitRequest" class="p-6 space-y-8 bg-white">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
          <input
            type="text"
            v-model="requestData.title"
            id="title"
            placeholder="Enter title"
            class="h-11 w-full px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:border-teal-500 focus:bg-white focus:shadow-sm transition-all duration-200"
          />
          <p class="mt-1 text-xs text-gray-400">e.g. Company Information</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
          <input
            type="text"
            v-model="requestData.category"
            id="category"
            placeholder="Enter category"
            class="h-11 w-full px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:border-teal-500 focus:bg-white focus:shadow-sm transition-all duration-200"
          />
          <p class="mt-1 text-xs text-gray-400">e.g. company</p>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Content</label>

          <textarea
            v-model="requestData.content"
            placeholder="Enter content"
            class="w-full h-48 px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white focus:shadow-sm transition-all duration-200"
          ></textarea>

          <p class="mt-1 text-xs text-gray-400">
            Add tone, FAQs, or brand voice guidelines — plain text works for now.
          </p>
        </div>
      </div>

      <div class="flex justify-end pt-2 pr-3">
        <button
          type="submit"
          :disabled="loading"
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

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-150%) skewX(-12deg);
  }
  100% {
    transform: translateX(150%) skewX(-12deg);
  }
}
</style>
