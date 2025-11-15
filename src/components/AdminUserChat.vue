<script setup>
import { ref } from 'vue'
import axios from 'axios'
import EmptyNoMessage from './Icons/EmptyNoMessage.vue'
import { toast } from 'vue3-toastify'
import Loading from './Icons/Loading.vue'
// import { send } from 'vite'

const userId = ref('')
const issues = ref([])
const statusMessage = ref('')
const loading = ref(false)
const showChat = ref(false)

const verifyUser = async () => {
  if (!userId.value.trim()) return

  issues.value = []
  statusMessage.value = ''

  try {
    loading.value = true
    await new Promise((resolve) => setTimeout(resolve, 3000))
    const response = await axios.get(`http://localhost:3000/api/admin/verify/${userId.value}`)
    console.log(response)
    if (response.status === 200) {
      issues.value = response.data.issue
      showChat.value = response.data.exists
    }
  } catch (error) {
    console.error('Failed to fetch user issues:', error)
    // toast.error('Check Internet Connection')
  } finally {
    loading.value = false
  }
}

const adminMessage = ref('')
const userText = ref('')

const adminSendMessage = async () => {
  if (!adminMessage.value.trim())
    try {
      const messageData = {
        userText: adminMessage.value.trim(),
        userId: userId.value,
        sender: 'admin',
      }
      const response = await axios.post('http://localhost:3000/api/admin/reply', messageData)

      issues.value.push({
        userText: adminMessage.value.trim(),
        timestamp: new Date(),
        sender: 'admin',
      })

      adminMessage.value = ''
    } catch (error) {
      console.error('Error sending message:', error)
    }
}
</script>

<template>
  <section class="p-6 bg-white rounded-lg shadow-md h-[600px] flex flex-col">
    <div class="flex flex-row justify-between items-center mb-4">
      <div>
        <h2 class="text-2xl font-semibold text-gray-800">Admin Chat</h2>
        <p class="text-sm text-gray-500 -mt-[2px]">Admin can respond to user requests directly</p>
      </div>

      <div class="flex gap-2">
        <input
          v-model="userId"
          @keyup.enter="verifyUser"
          type="search"
          placeholder="Enter user ID..."
          class="w-48 md:w-56 py-2 px-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-mainColor/40 focus:border-mainColor outline-none transition-all duration-200 hover:bg-white"
        />
        <button
          :disabled="loading || !userId.trim()"
          @click="verifyUser"
          class="w-[90px] py-2 bg-mainColor text-white rounded-lg shadow-sm hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loading v-if="loading" />
          <span class="font-medium text-white" v-if="!loading">Search</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center flex-1">
      <div
        class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
      ></div>
    </div>

    <div v-else-if="showChat" class="flex flex-col flex-1">
      <div
        class="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4 animate-fadeUp"
      >
        <div
          v-for="(item, index) in issues"
          :key="index"
          :class="item.sender === 'admin' ? 'flex justify-end' : 'flex justify-start'"
        >
          <div
            :class="
              item.sender === 'admin'
                ? 'bg-mainColor text-white'
                : 'bg-white text-gray-800 border border-gray-200'
            "
            class="p-3 rounded-xl shadow max-w-[75%]"
          >
            <p class="text-sm">{{ item.userText }}</p>
            <span class="text-xs opacity-80 block mt-1 text-right">
              {{ item.sender === 'admin' ? 'Admin · ' : 'User · ' }}
              {{
                new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }}
            </span>
          </div>
        </div>

        <!-- <div class="flex items-start justify-end">
          <div class="bg-mainColor text-white p-3 rounded-xl shadow max-w-[75%]">
            <p class="text-sm">{{ userText }}</p>
            <span class="text-xs text-gray-200 block mt-1 text-right"
              >Admin ·
              {{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span
            >
          </div>
        </div> -->
      </div>

      <div class="mt-4 flex items-center space-x-2">
        <input
          v-model="adminMessage"
          @keyup.enter="adminSendMessage"
          type="text"
          placeholder="Type your message..."
          class="flex-1 py-2.5 px-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-mainColor/40 focus:border-mainColor outline-none transition-all duration-200 hover:bg-white"
        />
        <button
          :disabled="!adminMessagemessage.trim()"
          @click="adminSendMessage"
          class="bg-mainColor hover:bg-mainColor/90 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200"
        >
          Send
        </button>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center flex-1">
      <EmptyNoMessage />
      <p class="text-gray-500 mt-2 text-sm">
        {{
          userId ? 'No pending issues found for this user.' : 'Enter a user ID to start chatting.'
        }}
      </p>
    </div>
  </section>
</template>
