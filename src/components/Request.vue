<script setup>
import { computed, ref, reactive, onMounted, watch, nextTick } from 'vue'
import { toast } from 'vue3-toastify'
import { useAdminStore } from '@/stores/user'
import axios from 'axios'
import { useModal } from 'vue-final-modal'
import ModalAddInfo from './ModalAddInfo.vue'
import Plus from './Icons/Plus.vue'
import Filter from './Filter.vue'
import Search from './Icons/Search.vue'
import DOMPurify from 'dompurify'
import Bin from './Icons/Bin.vue'
import ConfirmDelete from './ConfirmDelete.vue'

// optional: create a reusable function
const sanitized = (html) => DOMPurify.sanitize(html)

const adminStore = useAdminStore()
const loading = ref(false)
const allRequests = ref([])
const selectedProductId = ref(null)
const selectedWebsite = ref(null)
// const selectedRequest = ref(null)
const deleteWebsite = ref(null)

const getAllRequests = async (productId) => {
  if (!productId) return
  try {
    loading.value = true
    const response = await axios.get(`/chat/knowledge/${productId}`)
    allRequests.value = response.data.data || []
    console.log(response)

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

// this line right here, wait for child, grabs id, make the api call
watch(selectedProductId, (newId) => {
  getAllRequests(newId)

  deleteWebsite.value = selectedWebsite.value
})
onMounted(() => {
  if (selectedProductId.value) {
    getAllRequests(selectedProductId.value)
  }
})

const selectedRequest = ref(null)
const selectRequest = (request) => {
  selectedRequest.value = request
}

// const selectRequest = (request) => {
//   selectedRequest.value = null // clear previous content first
//   nextTick(() => {
//     selectedRequest.value = request
//   })
// }

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

const search = ref('')
const suggestions = ref([])

const getTitleSuggestion = () => {
  const term = search.value.trim().toLowerCase()

  if (term.length < 3) {
    suggestions.value = []
    return
  }

  suggestions.value = allRequests.value.filter((req) => req.title.toLowerCase().includes(term))
}

watch(search, () => {
  getTitleSuggestion()
})

function deleteConversation(requestId) {
  const { open, close } = useModal({
    component: ConfirmDelete,
    attrs: {
      website: deleteWebsite.value,
      id: requestId,
      onConfirm() {
        close()
      },
    },
  })

  open()
}

// const deleteConversation = async (website) => {
//   if (!website) {
//     toast.warning('Cannot delete')
//     return
//   }

//   try {
//     await axios.delete('/deleteknowledgebase', {
//       website: website,
//     })

//     toast.success('Message deleted!')
//   } catch (err) {
//     console.error(err)
//     toast.error('Failed to delete message.')
//   }
// }

// watch(selectedWebsite, (newWebsite) => {
//   // deleteConversation(newWebsite)
// })
</script>

<template>
  <div class="flex flex-col md:flex-row h-auto md:h-[570px] gap-4">
    <nav
      class="w-full md:w-[270px] bg-white shadow rounded-lg md:ml-1 overflow-y-auto p-5 flex flex-col"
    >
      <div v-if="loading" class="flex justify-center items-center h-40 md:h-60">
        <div
          class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>

      <div class="animate-fadeUp" v-else>
        <h3 class="text-lg font-semibold mb-4">
          <div class="relative w-full max-w-md">
            <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search class="w-5 h-5 text-gray-400" />
            </span>
            <input
              v-model="search"
              type="search"
              placeholder="Search..."
              class="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-mainColor focus:border-mainColor"
            />
          </div>
        </h3>
        <ul class="space-y-2">
          <li
            v-for="(res, index) in suggestions.length ? suggestions : allRequests"
            :key="index"
            class="cursor-pointer"
            @click="selectRequest(res)"
          >
            <span
              :class="[
                'block border bg-gray-50 rounded-lg px-3 py-2 transition flex flex-row justify-between items-center',
                selectedRequest?.id === res
                  ? 'bg-teal-50 text-teal-600 font-semibold border-teal-200'
                  : 'hover:bg-teal-50',
              ]"
            >
              {{ res.title }}
              <button
                class="flex items-end"
                @click="deleteConversation(res.id)"
                title="Delete Knownledge"
              >
                <Bin class="text-red-500" />
              </button>
            </span>
          </li>
        </ul>
      </div>
    </nav>

    <section class="flex-1 bg-white shadow rounded-lg p-6 overflow-y-auto h-auto md:h-full">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 class="text-xl font-semibold text-gray-800">Information Details</h3>

        <div class="flex flex-wrap gap-3">
          <!-- so this guy loads first, because it's a child component -->
          <Filter v-model:selected="selectedProductId" v-model:website="selectedWebsite" />

          <button
            @click="openPopup()"
            class="flex items-center gap-2 bg-mainColor text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow"
          >
            <Plus class="w-5 h-5" />
            Add Info
          </button>
        </div>
      </div>

      <div
        v-if="!selectedRequest"
        class="text-gray-400 text-center py-20 animate-[fadeFloat_0.6s_ease-out]"
      >
        Click a request on the left to see details
      </div>

      <div
        v-else
        class="border bg-gray-50 rounded-lg p-6 shadow-sm animate-fadeUp h-auto md:h-[450px] flex flex-col justify-between"
      >
        <div v-if="loading" class="flex justify-center items-center h-60">
          <div
            class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
          ></div>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div class="flex justify-between items-center">
            <h4 class="text-lg font-semibold text-gray-800">Content</h4>
            <span
              class="text-sm font-medium bg-teal-100 text-teal-700 px-3 py-1 rounded-full border border-teal-200 shadow-sm"
            >
              {{ selectedRequest.category || 'General Content' }}
            </span>
          </div>

          <div>
            <div
              class="max-h-96 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
            >
              <div
                class="prose prose-sm md:prose-base max-w-none pb-4"
                v-html="sanitized(selectedRequest.content)"
              ></div>
            </div>
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

/* Beautiful custom scrollbar – works in Chrome/Edge/Safari */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #9ca3af #f3f4f6;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 8px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 10px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 10px;
  border: 2px solid #f3f4f6;
}

.scrollbar-thin:hover::-webkit-scrollbar-thumb {
  background: #6b7280;
}
</style>
