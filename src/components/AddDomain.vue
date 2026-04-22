<script setup>
import { useModal } from 'vue-final-modal'
import { computed, ref, reactive, onMounted, nextTick, watch } from 'vue'
import ModalAddDomain from './ModalAddDomain.vue'
import Plus from './Icons/Plus.vue'
import { useAdminStore } from '@/stores/user'
import axios from 'axios'
import Clipboard from './Icons/Clipboard.vue'
import { toast } from 'vue3-toastify'
import ArrowDown from './Icons/ArrowDown.vue'

const adminStore = useAdminStore()
const loading = ref(false)

const allProducts = ref([])
const selectedRequest = ref(null)
const showProductDropdown = ref(false)

const getAllProducts = async () => {
  try {
    loading.value = true
    const response = await axios.get('/getproduct')
    console.log(response)
    allProducts.value = response.data['all websites']
    if (allProducts.value.length > 0) {
      selectedRequest.value = allProducts.value[0]
    } else {
      selectedRequest.value = null
    }
  } catch (error) {
    console.error('Failed to fetch all products:', error)
    toast.error('Check Internet Connection')
  } finally {
    loading.value = false
  }
}

const handleRequest = (product) => {
  selectedRequest.value = product
  // Close dropdown on mobile after selection
  showProductDropdown.value = false
}

onMounted(() => {
  getAllProducts()
})

function openPopup() {
  const { open, close } = useModal({
    component: ModalAddDomain,
    attrs: {
      onConfirm() {
        close()
      },
    },
  })

  open()
}

const error = ref('No script yet, create a domain to get script')

const generatedScript = computed(() => {
  if (!selectedRequest.value) {
    return error.value
  }

  return `<link rel="stylesheet" href="https://script.botconvo.com/chatbot-widget.css" />

<chatbot-widget 
  website="${selectedRequest.value.website}" 
  api="${selectedRequest.value.api}">
</chatbot-widget>

<script src="https://script.botconvo.com/chatbot-widget.iife.js"><\/script>`
})

function copyCode() {
  if (!selectedRequest.value) {
    toast.error('No website selected')
    return
  }

  navigator.clipboard.writeText(generatedScript.value.trim())
  toast.success('Script copied to clipboard!')
}

// Trigger Prism highlighting when script changes
watch(generatedScript, () => {
  nextTick(() => {
    if (window.Prism) {
      window.Prism.highlightAll()
    }
  })
})
</script>

<template>
  <!-- MOBILE VIEW -->
  <div class="block md:hidden p-4">
    <div class="flex flex-col gap-4">
      <!-- Add Domain Button -->
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800">Websites</h3>
        <button
          @click="openPopup()"
          class="flex items-center gap-2 bg-mainColor text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow text-sm"
        >
          <Plus class="w-4 h-4" />
          Add Domain
        </button>
      </div>

      <!-- Product Dropdown -->
      <div class="relative">
        <button
          @click="showProductDropdown = !showProductDropdown"
          class="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 text-left shadow-sm hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <span class="font-medium text-gray-700 flex-shrink-0">Product:</span>
            <span class="text-teal-600 font-semibold truncate">
              {{ selectedRequest?.business_name || 'Select a product' }}
            </span>
          </div>
          <ArrowDown
            class="w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2"
            :class="{ 'rotate-180': showProductDropdown }"
          />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showProductDropdown"
          class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <div v-if="loading" class="p-4 text-center">
            <div class="loader w-6 h-6 rounded-full bg-mainColor animate-spin mx-auto"></div>
          </div>

          <ul v-else class="py-1">
            <li
              v-for="(res, index) in allProducts"
              :key="index"
              @click="handleRequest(res)"
              class="px-4 py-3 cursor-pointer hover:bg-teal-50 transition-colors"
              :class="
                selectedRequest === res ? 'bg-teal-50 text-teal-600 font-semibold' : 'text-gray-700'
              "
            >
              <div class="flex items-center justify-between">
                <span class="truncate">{{ res.business_name }}</span>
                <span v-if="selectedRequest === res" class="text-teal-500 text-sm"> ✓ </span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Selected Website Details -->
      <div v-if="selectedRequest" class="border bg-gray-50 rounded-lg p-4 shadow-sm animate-fadeUp">
        <div class="flex flex-col gap-3">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-gray-600 mb-1">Website</h4>
              <p class="text-gray-800 text-sm break-all">
                {{ selectedRequest.website }}
              </p>
            </div>
            <span
              class="text-xs font-medium bg-teal-100 text-teal-700 px-2 py-1 rounded-full border border-teal-200 shadow-sm ml-2 flex-shrink-0"
            >
              {{ selectedRequest.category }}
            </span>
          </div>
        </div>
      </div>

      <!-- Generated Script -->
      <div
        v-if="selectedRequest"
        class="border border-gray-200 bg-white rounded-lg p-4 shadow-sm animate-fadeUp"
      >
        <div class="relative">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-sm font-semibold text-gray-800">Integration Script</h4>
            <button
              @click="copyCode"
              class="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded hover:bg-gray-700 transition"
            >
              <Clipboard class="w-4 h-4" />
              Copy
            </button>
          </div>
          <div class="overflow-x-auto rounded-lg">
            <pre class="language-markup !m-0 !bg-[#1e293b] !p-4 !text-xs">
              <code>{{ generatedScript }}</code>
            </pre>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !selectedRequest" class="text-center py-12 text-gray-400">
        <p>No websites available. Add a domain to get started.</p>
      </div>
    </div>
  </div>

  <!-- DESKTOP/TABLET VIEW -->
  <div class="hidden md:flex flex-col md:flex-row h-auto md:h-[570px] gap-4">
    <nav
      class="w-full md:w-[270px] bg-white shadow rounded-lg md:ml-1 overflow-y-auto p-5 flex flex-col"
    >
      <div v-if="loading" class="flex justify-center items-center h-60">
        <div
          class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>

      <div class="animate-fadeUp" v-else>
        <h3 class="text-lg font-semibold mb-4">All Website</h3>

        <ul class="space-y-2">
          <li
            v-for="(res, index) in allProducts"
            :key="index"
            class="cursor-pointer px-2 py-1"
            @click="selectedRequest = res"
          >
            <span
              :class="[
                'border bg-gray-50 rounded-lg px-3 py-2 block transition',
                selectedRequest === res
                  ? 'bg-teal-50 text-teal-600 font-semibold border-teal-200'
                  : 'hover:bg-teal-50',
              ]"
            >
              {{ res.business_name }}
            </span>
          </li>
        </ul>
      </div>
    </nav>

    <section class="flex-1 bg-white shadow rounded-lg p-6 overflow-y-auto min-h-[400px]">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 class="text-xl font-semibold text-gray-800">Add new website</h3>

        <button
          @click="openPopup()"
          class="flex items-center gap-2 bg-mainColor text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow"
        >
          <Plus class="w-5 h-5" />
          Add Domain
        </button>
      </div>

      <div
        v-if="!selectedRequest"
        class="text-gray-400 text-center py-20 animate-[fadeFloat_0.6s_ease-out]"
      ></div>

      <div
        v-else
        class="border bg-gray-50 rounded-lg p-6 shadow-sm animate-fadeUp flex flex-col gap-6"
      >
        <div v-if="loading" class="flex justify-center items-center h-60">
          <div
            class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
          ></div>
        </div>
        <div class="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-800 mb-2">Website</h4>
            <p class="text-gray-700 whitespace-pre-line leading-relaxed text-[15px]">
              {{ selectedRequest.website }}
            </p>
          </div>

          <div class="flex flex-col items-start sm:items-end">
            <span
              class="text-sm font-medium bg-teal-100 text-teal-700 px-3 py-1 rounded-full border border-teal-200 shadow-sm"
            >
              {{ selectedRequest.category }}
            </span>
          </div>
        </div>
      </div>
      <div
        class="mt-5 border border-gray-200 bg-white rounded-lg p-6 shadow-sm animate-fadeUp min-h-[320px] md:h-[320px] flex flex-col"
      >
        <div v-if="loading" class="flex justify-center items-center h-60">
          <div
            class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
          ></div>
        </div>
        <div v-if="selectedRequest" class="relative">
          <div
            class="absolute top-2 right-2 bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded z-10"
          >
            <Clipboard @click="copyCode" class="w-6 h-6 cursor-pointer" />
          </div>
          <div class="overflow-x-auto rounded-lg">
            <pre class="language-markup !m-0 !bg-[#1e293b] !p-6 !text-sm">
              <code>{{ generatedScript }}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Prevent Prism from affecting dropdown */
div:not(pre *) {
  background-color: initial !important;
}

/* Ensure dropdown has correct background */
.relative > div {
  background-color: white !important;
}

.overflow-x-auto {
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

pre[class*='language-'],
code[class*='language-'] {
  white-space: pre-wrap !important;
  word-break: break-word !important;
  overflow-x: auto !important;
  max-width: 100% !important;
}

pre {
  margin: 0 !important;
  background-color: #1e293b !important;
  padding: 1.5rem !important;
  font-size: 0.875rem !important;
  border-radius: 0.5rem;
}

code {
  display: block;
}

pre::-webkit-scrollbar {
  height: 8px;
}

pre::-webkit-scrollbar-track {
  background: #0f172a;
  border-radius: 0 0 0.5rem 0.5rem;
}

pre::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

pre::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

@media (max-width: 640px) {
  pre {
    padding: 1rem !important;
    font-size: 0.75rem !important;
  }
}

@media (max-width: 768px) {
  pre {
    font-size: 0.8125rem !important;
  }
}
</style>
