<script setup>
import { computed, ref, reactive, onMounted, watch, nextTick } from 'vue'
import { toast } from 'vue3-toastify'
import { useAdminStore } from '@/stores/user'
import axios from 'axios'
import { useModal } from 'vue-final-modal'
import ModalAddInfo from './ModalAddInfo.vue'
import Plus from './Icons/Plus.vue'
import Filter from './Filter.vue'

const adminStore = useAdminStore()
const loading = ref(false)
const allRequests = ref([])
const selectedProductId = ref(null)
// const selectedRequest = ref(null)

const getAllRequests = async (productId) => {
  if (!productId) return
  try {
    loading.value = true
    const response = await axios.get(
      `https://assitance.storehive.com.ng/public/api/chat/knowledge/${productId}`,
    )
    allRequests.value = response.data.data || []

    // auto-select the first request if available
    if (allRequests.value.length > 0) {
      selectedRequest.value = allRequests.value[0]
    } else {
      selectedRequest.value = null
    }
  } catch (error) {
    console.error('Failed to fetch all request:', error)
    toast.error('Check Internet Connection')
  } finally {
    loading.value = false
  }
}

watch(selectedProductId, (newId) => {
  getAllRequests(newId)
})
onMounted(() => {
  getAllRequests
})

const selectedRequest = ref(null)

const selectRequest = (request) => {
  selectedRequest.value = null // clear previous content first
  nextTick(() => {
    selectedRequest.value = request
  })
}

function openPopup() {
  if (!selectedProductId.value) {
    toast.error('Please select a product first')
    return
  }

  const { open, close } = useModal({
    component: ModalAddInfo,
    attrs: {
      productId: selectedProductId.value,
      onConfirm() {
        close()
        getAllRequests(selectedProductId.value)
      },
    },
  })

  open()
}
</script>

<template>
  <div class="flex flex-col md:flex-row h-auto md:h-[570px] gap-4">

    <!-- SIDEBAR -->
    <nav
      class="w-full md:w-[270px] bg-white shadow rounded-lg md:ml-1 overflow-y-auto p-5 flex flex-col"
    >
      <div v-if="loading" class="flex justify-center items-center h-40 md:h-60">
        <div
          class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>

      <div class="animate-fadeUp" v-else>
        <h3 class="text-lg font-semibold mb-4">All Information</h3>
        <ul class="space-y-2">
          <li
            v-for="(res, index) in allRequests"
            :key="index"
            class="cursor-pointer"
            @click="selectRequest(res)"
          >
            <span
              :class="[
                'block border bg-gray-50 rounded-lg px-3 py-2 transition',
                selectedRequest === res
                  ? 'bg-teal-50 text-teal-600 font-semibold border-teal-200'
                  : 'hover:bg-teal-50',
              ]"
            >
              {{ res.title }}
            </span>
          </li>
        </ul>
      </div>
    </nav>

    <!-- DETAILS SECTION -->
    <section
      class="flex-1 bg-white shadow rounded-lg p-6 overflow-y-auto h-auto md:h-full"
    >
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
      >
        <h3 class="text-xl font-semibold text-gray-800">Information Details</h3>

        <div class="flex flex-wrap gap-3">
          <Filter v-model:selected="selectedProductId" />

          <button
            @click="openPopup()"
            class="flex items-center gap-2 bg-mainColor text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow"
          >
            <Plus class="w-5 h-5" />
            Add Info
          </button>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div
        v-if="!selectedRequest"
        class="text-gray-400 text-center py-20 animate-[fadeFloat_0.6s_ease-out]"
      >
        Click a request on the left to see details
      </div>

      <!-- DETAILS CARD -->
      <div
        v-else
        class="border bg-gray-50 rounded-lg p-6 shadow-sm animate-fadeUp h-auto md:h-[450px] flex flex-col justify-between"
      >
        <div v-if="loading" class="flex justify-center items-center h-60">
          <div
            class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
          ></div>
        </div>

        <div v-else class="flex flex-col md:flex-row justify-between gap-6">
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-800 mb-2">Content</h4>
            <p
              class="text-gray-700 whitespace-pre-line leading-relaxed text-[15px] max-w-full md:max-w-[650px]"
            >
              {{ selectedRequest.content }}
            </p>
          </div>

          <div class="flex md:flex-col items-start md:items-end">
            <span
              class="text-sm font-medium bg-teal-100 text-teal-700 px-3 py-1 rounded-full border border-teal-200 shadow-sm"
            >
              {{ selectedRequest.category }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>


<style scoped>
@keyframes fadeFloat {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
