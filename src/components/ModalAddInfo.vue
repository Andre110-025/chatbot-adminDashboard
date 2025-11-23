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
    const response = await axios.post(`/chat/knowledge/${props.productId}`, {
      title: requestData.title,
      category: requestData.category,
      content: requestData.content,
      token: token.value,
    })
    console.log(response)
    Object.keys(requestData).forEach((key) => (requestData[key] = ''))
    toast.success('Form submitted successfully')
    setTimeout(() => {
      emit('confirm')
      window.location.reload()
    }, 3000)
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
    content-class="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden z-[70] flex flex-col"
    class="fixed inset-0 flex items-center justify-center p-4 z-[70]"
  >
    <!-- HEADER -->
    <header
      class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0"
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
      >
        <Cancel />
      </button>
    </header>

    <!-- MAIN CONTENT — NOW SCROLLABLE -->
    <div class="flex-1 overflow-y-auto px-6 pt-6 pb-2">
      <form @submit.prevent="submitRequest" class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Title & Category (unchanged) -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
            <input
              v-model="requestData.title"
              placeholder="Enter title"
              class="h-11 w-full px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:border-teal-500 focus:bg-white focus:shadow-sm transition-all duration-200"
            />
            <p class="mt-1 text-xs text-gray-400">e.g. Company Information</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
            <input
              v-model="requestData.category"
              placeholder="Enter category"
              class="h-11 w-full px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:border-teal-500 focus:bg-white focus:shadow-sm transition-all duration-200"
            />
            <p class="mt-1 text-xs text-gray-400">e.g. company</p>
          </div>

          <!-- QUILL EDITOR — PERFECT SIZE -->
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Content</label>
            <div class="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
              <QuillEditor
                v-model:content="requestData.content"
                contentType="html"
                theme="snow"
                toolbar="full"
                placeholder="Start typing your content..."
                class="h-80"
              />
            </div>
            <p class="mt-1 text-xs text-gray-400">
              Add tone, FAQs, or brand voice guidelines — Rich text supported — format away!
            </p>
          </div>
        </div>
      </form>
    </div>

    <!-- FIXED FOOTER WITH SUBMIT BUTTON -->
    <div class="flex justify-end px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
      <button
        type="submit"
        @click="submitRequest"
        :disabled="loading || v$.$invalid"
        class="group relative inline-flex items-center gap-2.5 px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Loading v-if="loading" class="w-5 h-5" />
        <span v-else class="relative z-10">Submit Information</span>
        <div
          class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 skew-x-12"
        ></div>
      </button>
    </div>
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

:deep(.ql-container) {
  height: 340px !important;
  border-bottom-left-radius: 0.75rem !important;
  border-bottom-right-radius: 0.75rem !important;
}

:deep(.ql-editor) {
  min-height: unset !important;
  overflow-y: auto !important;
  padding: 16px !important;
  font-size: 14.5px;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
  line-height: 1.7;
}
:deep(.ql-editor::-webkit-scrollbar) {
  width: 8px;
}

:deep(.ql-editor::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.ql-editor::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

:deep(.ql-editor::-webkit-scrollbar-thumb:hover) {
  background: #94a3b8;
  background-clip: content-box;
}

/* Toolbar stays on top */
:deep(.ql-toolbar) {
  border-top-left-radius: 0.75rem !important;
  border-top-right-radius: 0.75rem !important;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
  background: #f8fafc;
}
</style>
