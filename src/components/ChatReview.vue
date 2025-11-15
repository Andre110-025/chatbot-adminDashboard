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

const issues = ref({})
const loading = ref(false)
const showBubble = ref(false)
const adminMessageSent = ref({})

const getAllChats = async () => {
  try {
    loading.value = true
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const response = await axios.get('http://localhost:3000/api/admin/issues')
    console.log(response)
    issues.value = response.data

    Object.keys(issues.value).forEach(async (userId) => {
      console.log('User ID:', userId)
    })
  } catch (err) {
    console.error('Failed to fetch admin issues:', err)
    toast.error('Check Internet Connection')
  } finally {
    loading.value = false
  }
}

// same one with the pop-up modal
const fetchMessages = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/admin/chat/${userId}`)
    console.log('user-admin:', response)
    adminMessageSent.value = response.data
  } catch (error) {
    console.error('Failed to fetch messages:', error)
  } finally {
    loading.value = false
  }
}

const clearAllIssues = () => {
  issues.value = []
}

function openPopup(issues) {
  const { open, close } = useModal({
    component: ModalChatUser,
    attrs: {
      issues,
      onConfirm() {
        close()
        getAllChats()
      },
    },
  })

  open()
}

onMounted(() => {
  getAllChats()
  fetchMessages()
})

const activeTab = ref('unreadMessages')

const showTab = (active) => {
  activeTab.value = active
}
</script>

<template>
  <section class="p-6 bg-white h-full shadow rounded-lg">
    <div class="flex flex-row justify-between items-center">
      <div class="text-2xl mt-[15px] text-gray-800 flex flex-col">
        <span>Chats Review</span>
        <p class="text-gray-800 text-[15px] mt-[-5px]">These are unresponded chat from the user</p>
      </div>
      <div>
        <button
          :disabled="loading"
          @click="getAllChats"
          class="text-sm bg-mainColor text-white px-3 py-1 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loading v-if="loading" />
          <span class="text-sm font-medium text-white" v-if="!loading">Refresh</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-60">
      <div
        class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
      ></div>
    </div>

    <div v-else-if="Object.keys(issues).length" class="grid gap-5 mt-3.5">
      <div class="animate-fadeUp">
        <div
          v-for="(userMessages, userId) in issues"
          :key="userId"
          class="bg-white shadow-sm rounded-xl border border-gray-200 hover:shadow-md transition-all p-5"
        >
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-semibold text-gray-800">
              User ID:
              <span class="text-teal-600 font-mono">{{ userId }}</span>
            </h3>
            <div class="flex flex-row gap-2">
              <span class="text-sm text-red-600 bg-gray-100 px-2 py-1 rounded-full">
                {{ userMessages.length }} issue<span v-if="userMessages.length > 1">s</span>
              </span>
              <button @click="clearAllIssues" class="text-gray-400 hover:text-red-600 transition">
                <!-- Trash icon SVG -->
                <bin />
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="(msg, i) in userMessages"
              :key="i"
              class="p-4 border border-gray-100 rounded-lg bg-gray-100 shadow transition"
            >
              <p class="text-gray-800">
                <span class="font-medium text-teal-600">User:</span> {{ msg.userText }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ new Date(msg.timestamp).toLocaleString() }}
              </p>
            </div>

            <div v-if="adminMessageSent.length" class="cdUser011011-status-dot"></div>

            <!-- Button wrapper to align right -->
            <div class="flex justify-end pt-2">
              <button
                @click="openPopup(userMessages)"
                class="text-sm bg-mainColor text-white px-3 py-1 rounded-lg hover:bg-teal-700 transition"
              >
                <span class="text-sm font-medium text-white">Chat with user</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center text-center text-gray-500">
      <EmptyLoadingAnime />
    </div>

    <!-- <AdminUserChat v-else-if="activeTab === 'directMessages'" /> -->
  </section>
</template>

<style scoped>
.cdUser011011-status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: cdUser011011-pulse 2s infinite;
}
</style>
