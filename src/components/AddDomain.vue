<script setup>
import { useModal } from 'vue-final-modal'
import { computed, ref, reactive, onMounted } from 'vue'
import ModalAddDomain from './ModalAddDomain.vue'
import Plus from './Icons/Plus.vue'
import { useAdminStore } from '@/stores/user'
import axios from 'axios'

const adminStore = useAdminStore()
const loading = ref(false)

const allProducts = ref([])
const selectedRequest = ref(null)

const getAllProducts = async () => {
  try {
    loading.value = true
    const response = await axios.get('https://assitance.storehive.com.ng/public/api/getproduct')
    console.log(response)
    allProducts.value = response.data['all websites']
  } catch (error) {
    console.error('Failed to fetch all products:', error)
    toast.error('Check Internet Connection')
  } finally {
    loading.value = false
  }
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
</script>

<template>
  <div class="flex h-[570px] gap-4">
    <nav class="w-[270px] bg-white shadow rounded-lg ml-1 overflow-y-auto p-5 flex flex-col">
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
            class="cursor-pointer px-3 py-2"
            @click="selectedRequest = res"
          >
            <span
              :class="[
                'border bg-gray-50 rounded-lg px-3 py-2 transition',
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

    <section class="flex-1 bg-white shadow rounded-lg p-6 overflow-y-auto">
      <div class="flex flex-row justify-between items-center mb-6">
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
      >
        Click a request on the left to see details
      </div>

      <div
        v-else
        class="border bg-gray-50 rounded-lg p-6 shadow-sm animate-fadeUp h-[450px] flex flex-col justify-between"
      >
        <div class="flex justify-between items-start gap-6">
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-800 mb-2">Website</h4>
            <p class="text-gray-700 whitespace-pre-line leading-relaxed text-[15px] max-w-[650px]">
              {{ selectedRequest.website }}
            </p>
          </div>

          <div class="flex flex-col items-end">
            <!-- <h4 class="text-lg font-semibold text-gray-800 mb-2">Category</h4> -->
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
