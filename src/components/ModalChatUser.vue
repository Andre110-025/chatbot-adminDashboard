<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import { VueFinalModal } from 'vue-final-modal'
import Cancel from './Icons/Cancel.vue'
import Reload from './Icons/Reload.vue'
import SendBtn from './Icons/SendBtn.vue'

const loading = ref(false)
const emit = defineEmits(['confirm'])
const props = defineProps({
  issues: {
    type: Array,
    required: true,
  },
})

const userId = props.issues?.[0]?.userId || 'Unknown User'
console.log('id is:', userId)

const chatMessages = ref([])
const adminMessage = ref('')
const sending = ref(false)
const selectedIssue = ref(null)

const fetchMessages = async () => {
  try {
    loading.value = true
    await new Promise((resolve) => setTimeout(resolve, 3000))
    const res = await axios.get(`http://localhost:3000/api/admin/chat/${userId}`)
    console.log('response:', res)
    chatMessages.value = res.data
    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error('Failed to fetch messages:', err)
  } finally {
    loading.value = false
  }
}

const sendAdminMessages = async () => {
  if (!adminMessage.value.trim() || sending.value) return

  const messageToSend = adminMessage.value.trim()
  adminMessage.value = ''

  try {
    sending.value = true
    await axios.post(`http://localhost:3000/api/admin/chat`, {
      userId,
      sender: 'admin',
      message: messageToSend,
    })
    await fetchMessages()
  } catch (err) {
    console.error('Failed to send message:', err)
    adminMessage.value = messageToSend
  } finally {
    sending.value = false
  }
}

const chatContainerRef = ref(null)
const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTo({
      top: chatContainerRef.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchMessages()
})

watch(chatMessages, () => {
  nextTick(() => scrollToBottom())
})
</script>

<template>
  <VueFinalModal
    :overlay="true"
    :click-to-close="true"
    :overlay-transition="'vfm-fade'"
    :content-transition="'vfm-fade'"
    overlay-class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
    content-class="bg-white w-full max-w-[900px] h-[650px] rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden"
    class="fixed inset-0 flex items-center justify-center z-[70]"
  >
    <header
      class="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            class="text-white"
          >
            <path
              fill="currentColor"
              d="M12 23C6.443 21.765 2 16.522 2 11V5l10-4l10 4v6c0 5.524-4.443 10.765-10 12M4 6v5a10.58 10.58 0 0 0 8 10a10.58 10.58 0 0 0 8-10V6l-8-3Z"
            />
            <circle cx="12" cy="8.5" r="2.5" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-800">Admin Support Panel</h2>
          <p class="text-sm text-gray-500">User ID: {{ userId }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          @click="fetchMessages"
          :disabled="loading"
          class="p-2.5 rounded-lg bg-blue-50 text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          title="Refresh messages"
        >
          <Reload :class="{ 'animate-spin': loading }" />
        </button>
        <button
          @click="emit('confirm')"
          class="p-2.5 rounded-lg bg-red-50 text-red-600 transition-all duration-200 active:scale-95"
          title="Close panel"
        >
          <Cancel />
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside v-if="issues.length" class="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div class="px-4 py-3 border-b border-gray-200 bg-white">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-700 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                class="text-amber-500"
              >
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m1 15h-2v-2h2zm0-4h-2V7h2z"
                />
              </svg>
              User Requests
            </h3>
            <span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              {{ issues.length }}
            </span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div
            v-for="(issue, i) in issues"
            :key="i"
            @click="selectedIssue = i"
            :class="[
              'relative bg-white p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
              selectedIssue === i
                ? 'border-amber-400 shadow-md transform scale-[1.02]'
                : 'border-gray-200',
            ]"
          >
            <div
              class="absolute -left-2 top-5 w-0 h-0 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-white"
            ></div>

            <div class="flex items-start gap-2">
              <div
                class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  class="text-white"
                >
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3s1.34-3 3-3m0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08c1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22"
                  />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-gray-800 text-sm leading-relaxed break-words">
                  {{ issue.userText }}
                </p>
                <div class="flex items-center gap-1 mt-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    class="text-gray-400"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m4.2 14.2L11 13V7h1.5v5.2l4.5 2.7z"
                    />
                  </svg>
                  <span class="text-gray-500 text-xs">{{ formatTime(issue.timestamp) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div class="flex-1 flex flex-col bg-white">
        <div class="flex-1 overflow-hidden">
          <div ref="chatContainerRef" class="h-full overflow-y-auto p-6 space-y-4">
            <div
              v-if="loading && chatMessages.length === 0"
              class="flex flex-col items-center justify-center h-full gap-3"
            >
              <div
                class="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"
              ></div>
              <p class="text-gray-500 text-sm">Loading conversation...</p>
            </div>

            <div
              v-else-if="chatMessages.length === 0"
              class="flex flex-col items-center justify-center h-full gap-3 text-gray-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                class="opacity-50"
              >
                <path
                  fill="currentColor"
                  d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 14H6l-2 2V4h16z"
                />
              </svg>
              <div class="text-center">
                <p class="text-gray-600 font-medium">No messages yet</p>
                <p class="text-sm text-gray-400 mt-1">
                  Start the conversation by sending a message
                </p>
              </div>
            </div>

            <div
              v-for="(msg, i) in chatMessages"
              :key="i"
              :class="[
                'flex gap-3 items-end animate-slideIn',
                msg.sender === 'admin' ? 'justify-end' : 'justify-start',
              ]"
            >
              <div
                v-if="msg.sender === 'user'"
                class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  class="text-white"
                >
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3s1.34-3 3-3m0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08c1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22"
                  />
                </svg>
              </div>

              <div
                :class="[
                  'flex flex-col gap-1 max-w-[70%]',
                  msg.sender === 'admin' ? 'items-end' : 'items-start',
                ]"
              >
                <div
                  :class="[
                    'px-4 py-3 rounded-2xl shadow-sm',
                    msg.sender === 'admin'
                      ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200',
                  ]"
                >
                  <p class="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                    {{ msg.text }}
                  </p>
                </div>
                <span class="text-xs text-gray-400 px-2">{{ formatTime(msg.timestamp) }}</span>
              </div>

              <div
                v-if="msg.sender === 'admin'"
                class="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  class="text-white"
                >
                  <path
                    fill="currentColor"
                    d="M12 23C6.443 21.765 2 16.522 2 11V5l10-4l10 4v6c0 5.524-4.443 10.765-10 12M4 6v5a10.58 10.58 0 0 0 8 10a10.58 10.58 0 0 0 8-10V6l-8-3Z"
                  />
                  <circle cx="12" cy="8.5" r="2.5" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 bg-gray-50 p-4">
          <div class="flex gap-3 items-end max-w-4xl mx-auto">
            <div class="flex-1 relative">
              <textarea
                v-model="adminMessage"
                @keyup.enter.exact="sendAdminMessages"
                @keydown.enter.shift.prevent="adminMessage += '\n'"
                :disabled="sending"
                placeholder="Type your message... (Shift+Enter for new line)"
                rows="1"
                class="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
                style="min-height: 48px; max-height: 120px"
              ></textarea>
              <div class="absolute right-3 bottom-3 text-xs text-gray-400">
                {{ adminMessage.length }}
              </div>
            </div>
            <button
              @click="sendAdminMessages"
              :disabled="!adminMessage.trim() || sending"
              class="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center flex-shrink-0"
            >
              <SendBtn v-if="!sending" />
              <div
                v-else
                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </VueFinalModal>
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}

/* Custom scrollbar */
aside::-webkit-scrollbar,
[ref='chatContainerRef']::-webkit-scrollbar {
  width: 6px;
}

aside::-webkit-scrollbar-track,
[ref='chatContainerRef']::-webkit-scrollbar-track {
  background: transparent;
}

aside::-webkit-scrollbar-thumb,
[ref='chatContainerRef']::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

/* Smooth transitions */
* {
  transition-property:
    color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow,
    transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
