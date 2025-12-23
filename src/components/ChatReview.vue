<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ChatReview from './Icons/ChatReview.vue'
import { toast } from 'vue3-toastify'
import EmptyLoadingAnime from './Icons/EmptyLoadingAnime.vue'
import Loading from './Icons/Loading.vue'
import { useModal } from 'vue-final-modal'
import ModalChatUser from './ModalChatUser.vue'
import AdminUserChat from './AdminUserChat.vue'
import Bin from './Icons/Bin.vue'
import UserChat from './UserChat.vue'
// import { useModal } from 'vue-final-modal'
import ConfirmDeleteRequest from './ConfirmDeleteRequest.vue'

// const issues = ref({})
const loading = ref(false)
// const showBubble = ref(false)
// const adminMessageSent = ref({})
const allProducts = ref([])
const selectedRequest = ref(null)
const allRequests = ref([])
const websiteName = ref('')

const getAllProducts = async () => {
  try {
    loading.value = true
    // await new Promise((resolve) => setTimeout(resolve, 2000))
    const response = await axios.get('/getproduct')
    console.log(response)
    allProducts.value = response.data['all websites']
    // websiteName.value = response.data['all websites'].website

    if (allProducts.value.length > 0) {
      selectedRequest.value = allProducts.value[0]
      websiteName.value = allProducts.value[0].website

      await getAllRequests()
    } else {
      selectedRequest.value = null
      allRequests.value = []
    }
  } catch (err) {
    console.error('Failed to fetch all products:', err)
    toast.warning('No chat for current website, check others')
  } finally {
    loading.value = false
  }
}

// for some reason because the way data, is coming grouped the flat array
const groupByConversation = (messages) => {
  const grouped = {}

  messages.forEach((msg) => {
    if (!grouped[msg.conversation_id]) {
      grouped[msg.conversation_id] = []
    }
    grouped[msg.conversation_id].push(msg)
  })

  return Object.values(grouped)
}

const getAllRequests = async () => {
  if (!websiteName.value) return

  try {
    loading.value = true
    const response = await axios.post('/returnslist', {
      website: websiteName.value,
    })
    console.log(response)
    const flatData = response.data.Returns || []
    allRequests.value = groupByConversation(flatData)
    // if (allRequests.value.length > 0) {
    //   selectedRequest.value = allProducts.value[0]
    // } else {
    //   selectedRequest.value = null
    // }
  } catch (err) {
    console.error('Failed to fetch all request:', err)
    toast.error('Failed to fetch all request:')
  } finally {
    loading.value = false
  }
}

const handleRequest = (product) => {
  selectedRequest.value = product
  websiteName.value = product.website

  allRequests.value = []
  // loading.value = true
  getAllRequests()
}

onMounted(() => {
  getAllProducts()
  // getAllRequests()
})

function openPopup() {
  const { open, close } = useModal({
    component: ModalChatUser,
    attrs: {
      onConfirm() {
        close()
        getAllProducts()
      },
    },
  })

  open()
}

const activeTab = ref('allRequest')
const showItem = (item) => {
  activeTab.value = item
}

// const deleteConversation = async () => {
//   try {
//     await axios.delete('/deletereturns', {
//       website: websiteName.value,
//       conversation_id: conversation_id,
//     })
//     allRequests.value = allRequests.value.filter(
//       (conversation) => conversation[0].conversation_id !== conversation,
//     )
//     toast.success('Message deleted!')
//   } catch (err) {
//     console.error(err)
//     toast.error('Failed to delete message.')
//   }
// }

// const deleteConversation = async (conversationId) => {
//   if (!conversationId || !websiteName.value) {
//     toast.warning('Cannot delete: missing conversation ID or website')
//     return
//   }

//   try {
//     await axios.delete('/deletereturns', {
//       data: {
//         website: websiteName.value,
//         conversation_id: conversationId,
//       },
//     })

//     // Remove the deleted conversation from the UI
//     allRequests.value = allRequests.value.filter(
//       (conversation) => conversation[0].conversation_id !== conversationId,
//     )

//     toast.success('Message deleted!')
//   } catch (err) {
//     console.error(err)
//     toast.error('Failed to delete message.')
//   }
// }

function deleteConversation(conversationId) {
  const { open, close } = useModal({
    component: ConfirmDeleteRequest,
    attrs: {
      website: websiteName.value,
      id: conversationId,
      onConfirm(id) {
        if (id) {
          allRequests.value = allRequests.value.filter((c) => c[0].conversation_id !== id)
        }
        close()
      },
    },
  })

  open()
}
</script>

<template>
  <div class="flex flex-row px-2 -mt-3">
    <div class="flex flex-row items-center space-x-4">
      <button
        class="mt-2.5 relative pb-2"
        :class="activeTab === 'allRequest' ? 'text-mainColor font-semibold' : 'text-gray-500'"
        @click="showItem('allRequest')"
      >
        All Request
        <span
          v-if="activeTab === 'allRequest'"
          class="absolute left-0 right-0 bottom-[5px] h-[2px] bg-mainColor w-5/6 mx-auto"
        >
        </span>
      </button>

      <button
        class="mt-2.5 relative pb-2"
        :class="activeTab === 'allChats' ? 'text-mainColor font-semibold' : 'text-gray-500'"
        @click="showItem('allChats')"
      >
        All Chats
        <span
          v-if="activeTab === 'allChats'"
          class="absolute left-0 right-0 bottom-[5px] h-[2px] bg-mainColor w-3/4 mx-auto"
        >
        </span>
      </button>
    </div>
  </div>
  <div
    v-if="activeTab === 'allRequest'"
    class="flex flex-col md:flex-row h-auto md:h-[550px] gap-4 mt-4"
  >
    <nav
      class="w-full md:w-[270px] bg-white shadow rounded-lg md:ml-1 overflow-y-auto p-5 flex flex-col"
    >
      <div v-if="loading" class="flex justify-center items-center h-60">
        <div
          class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>

      <div class="animate-fadeUp" v-else>
        <h3 class="text-lg font-semibold mb-4">All Products Chat</h3>

        <ul class="space-y-2">
          <li
            v-for="(res, index) in allProducts"
            :key="index"
            class="cursor-pointer px-2 py-1"
            @click="handleRequest(res)"
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
    <section
      class="flex-1 p-4 min-[451px]:px-6 bg-white h-full shadow rounded-lg overflow-hidden flex flex-col"
    >
      <div
        class="flex flex-col min-[451px]:flex-row justify-between items-start min-[451px]:items-center gap-1 mb-4"
      >
        <div class="flex flex-col">
          <h2 class="text-xl min-[451px]:text-2xl text-gray-800">Chats Review</h2>
          <p class="text-gray-500 text-sm min-[451px]:text-[15px]">
            These are unresponded chat from the user
          </p>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center h-60">
        <div
          class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>

      <div
        v-else-if="allRequests.length === 0"
        class="flex flex-col items-center justify-center h-60 text-gray-500"
      >
        <EmptyLoadingAnime />
      </div>

      <template v-else>
        <div class="flex-1 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pr-1">
          <div class="grid gap-4 mt-2">
            <div
              v-for="(issues, index) in allRequests"
              :key="index"
              class="bg-white shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-all p-4 min-[451px]:p-5 animate-fadeUp"
            >
              <div class="flex justify-between items-start mb-4 gap-2">
                <h3
                  class="text-base min-[451px]:text-lg font-semibold text-gray-800 break-all leading-tight"
                >
                  User:
                  <span class="text-teal-600 font-mono text-sm min-[451px]:text-base">
                    {{ issues[0].conversation_id }}
                  </span>
                </h3>
                <span
                  class="shrink-0 text-[10px] min-[451px]:text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 uppercase tracking-wider"
                >
                  {{ issues.length }} issue{{ issues.length > 1 ? 's' : '' }}
                </span>
              </div>

              <div class="space-y-3">
                <div
                  v-for="(msg, i) in issues"
                  :key="i"
                  class="p-3 min-[451px]:p-4 rounded-lg bg-gray-50 border border-gray-100 shadow-sm"
                >
                  <div class="flex flex-col gap-1">
                    <div class="flex items-start gap-2">
                      <span
                        class="font-bold text-teal-600 text-xs min-[451px]:text-sm uppercase mt-0.5"
                        >User:</span
                      >
                      <p class="text-gray-700 text-sm min-[451px]:text-[15px] leading-relaxed">
                        {{ msg.message }}
                      </p>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                      <p class="text-[10px] text-gray-400">
                        {{
                          new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }}
                        · {{ new Date(msg.created_at).toLocaleDateString() }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end pt-1">
                  <button
                    @click="deleteConversation(issues[0].conversation_id)"
                    class="p-2 hover:bg-red-50 rounded-full transition-colors group"
                    title="Delete conversation"
                  >
                    <Bin class="text-red-400 group-hover:text-red-600 w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </section>
  </div>

  <UserChat v-else-if="activeTab === 'allChats'" class="mt-4" />
</template>

<style scoped>
/* Custom scrollbar styling */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1;
  scroll-behavior: smooth;
}

/* Webkit browsers (Chrome, Safari, Edge) */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #f1f5f9;
  border-radius: 10px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: #f1f5f9;
}

/* Fade animation */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeUp {
  animation: fadeUp 0.5s ease-out;
}
</style>
