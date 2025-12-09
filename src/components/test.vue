<script setup>
import Filter from './Filter.vue'
import { nextTick, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import Extend from './Icons/Extend.vue'
import { useModal } from 'vue-final-modal'
import ExpendedChat from './ExpendedChat.vue'

const loading = ref(false)
const allChats = ref([])
const selectedWebsite = ref(null)
const selectedRequest = ref(null)
const selectedSession = ref(null)
const messages = ref([])
const messagesLoading = ref(false)
const sending = ref(false)
const newMessage = ref('')

const getAllUser = async (website) => {
  if (!website) return
  try {
    loading.value = true
    const response = await axios.get('/chat/admin/sessions', {
      params: { website },
    })
    console.log(response)
    allChats.value = response.data.data || []

    if (allChats.value.length > 0) {
      selectedRequest.value = allChats.value[0]
    } else {
      selectedRequest.value = null
    }
  } catch (error) {
    console.error('Failed to fetch all request:', error)
    toast.warning('No chat for current website, check others')
  } finally {
    loading.value = false
  }
}

watch(selectedWebsite, (val) => {
  getAllUser(val)
})

onMounted(() => {
  if (selectedWebsite.value) {
    getAllUser(selectedWebsite.value)
  }
})

const getMessages = async (sessionId) => {
  if (!sessionId) {
    messages.value = []
    return
  }

  const website = selectedWebsite.value?.website
  const fallbackWebsite =
    selectedSession.value?.website ||
    allChats.value.find((c) => c.session_id === sessionId)?.website

  const finalWebsite = website || fallbackWebsite

  if (!finalWebsite) {
    toast.error('No website selected')
    return
  }

  try {
    messagesLoading.value = true
    const response = await axios.get(`/chat/admin/session/${sessionId}`, {
      params: { website: finalWebsite },
    })

    console.log('Messages:', response.data)
    messages.value = response.data.data?.messages || []

    scrollToBottom()
  } catch (err) {
    console.error('Failed to load messages:', err.response?.data || err)
    toast.error(err.response?.data?.error || 'Failed to load messages')
  } finally {
    messagesLoading.value = false
  }
}

const checkReadStatus = async (session) => {
  if (!session || session.is_read_admin) return

  const website = selectedWebsite.value?.website
  try {
    await axios.post('/chat/markread', {
      session_id: session.session_id,
      sender_type: 'admin',
      website: finalWebsite,
    })
    session.is_read_admin = true
  } catch (err) {
    console.warn('Failed to persist read status', err)
  }
}

const selectRequest = async (request) => {
  selectedSession.value = null
  messages.value = []

  await nextTick()

  selectedSession.value = request

  // Properly determine website
  const website = selectedWebsite.value?.website || request.website

  // 1. Mark as read on backend + update local state reactively
  if (!request.is_read_admin && website) {
    try {
      await axios.post('/chat/markread', {
        session_id: request.session_id,
        sender_type: 'admin',
        website: website,
      })

      // Properly update the source array (reactively)
      const chatInList = allChats.value.find((c) => c.session_id === request.session_id)
      if (chatInList) {
        chatInList.is_read_admin = true
      }

      // Also update the selected one just in case
      request.is_read_admin = true
    } catch (err) {
      console.warn('Failed to mark as read', err)
    }
  }

  // Then load messages
  await getMessages(request.session_id)
}

// const selectRequest = async (request) => {
//   selectedSession.value = null
//   messages.value = []
//   nextTick(async () => {
//     selectedSession.value = request
//     await getMessages(request.session_id)
//     checkReadStatus(request)
//   })
// }

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

const chatSection = ref(null)
const scrollToBottom = () => {
  nextTick(() => {
    if (chatSection.value) {
      chatSection.value.scrollTop = chatSection.value.scrollHeight
    }
  })
}

watch(messages, () => {
  scrollToBottom()
})

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedSession.value) return

  try {
    sending.value = true
    const response = await axios.post('/chat/admin/message', {
      session_id: selectedSession.value.session_id,
      message: newMessage.value,
      website: selectedWebsite.value,
      sender_type: 'admin',
    })
    console.log(response)
    newMessage.value = ''
    // mark as read
    selectedSession.value.is_read_admin = true
    await getMessages(selectedSession.value.session_id)
  } catch (error) {
    toast.error('Failed to send message')
  } finally {
    sending.value = false
  }
}

const handleModalSend = async (msg) => {
  if (!msg.trim() || !selectedSession.value) return

  messages.value.push({
    id: Date.now(),
    message: msg,
    sender_type: 'admin',
    timestamp: Date.now(),
  })

  scrollToBottom()

  try {
    sending.value = true
    await axios.post('/chat/admin/message', {
      session_id: selectedSession.value.session_id,
      message: msg,
      website: selectedWebsite.value,
      sender_type: 'admin',
    })
  } catch (err) {
    toast.error('Failed to send message')
  } finally {
    sending.value = false
  }
}

function openPopup() {
  const { open, close } = useModal({
    component: ExpendedChat,
    attrs: {
      session: selectedSession.value,
      messages: messages.value,
      sending: sending.value,
      loading: messagesLoading.value,
      newMessage: newMessage.value,
      formatTime: formatTime,

      // Modal Events
      onClose: () => close(),

      onSend: (msg) => handleModalSend(msg),
    },
  })

  open()
}

const extendedChat = ref(null)

const extendChat = (chat) => {
  extendedChat.value = chat
  openPopup()
}

const deleteChatSession = async () => {
  const sessionId = selectedSession.value.session_id
  if (!sessionId) {
    toast.info('No session selected')
    return
  }

  try {
    deleting.value = true
    const website = selectedWebsite.value?.website || selectedSession.value.website

    const response = await axios.delete(`chat/admin/session/${sessionId}`, {
      params: { website: website },
    })

    console.log('Delete response:', response)
    toast.success('Chat session marked as inactive')

    // UPDATE THIS PART: Instead of removing, mark as inactive
    const index = allChats.value.findIndex((chat) => chat.session_id === sessionId)
    if (index !== -1) {
      // Mark as inactive instead of removing
      allChats.value[index] = {
        ...allChats.value[index],
        last_message: 'Chat cleared by admin',
        last_message_time: new Date().toISOString(),
        message_count: 0,
        is_active: false,
        is_deleted: true, // Optional: add a flag
        is_read_admin: true, // Mark as read since it's cleared
      }

      // Optional: Move to bottom to keep UI clean
      const [inactiveChat] = allChats.value.splice(index, 1)
      allChats.value.push(inactiveChat)
    }

    // Clear current chat if it's the one being deleted
    if (selectedSession.value?.session_id === sessionId) {
      selectedSession.value = null
      messages.value = []
      newMessage.value = ''
    }
  } catch (err) {
    console.error('Failed to delete chat session:', err)
    toast.error('Failed to delete chat session')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col md:flex-row h-auto md:h-[500px] gap-4">
    <!-- Sidebar with User List -->
    <nav
      class="w-full md:w-[320px] bg-white shadow-lg rounded-xl overflow-hidden flex flex-col border border-gray-200"
    >
      <div
        class="px-5 py-4 border-b flex items-center justify-between bg-gradient-to-r from-teal-20 to-blue-50"
      >
        <h2 class="text-lg text-gray-800">All Users</h2>
      </div>

      <div v-if="loading" class="flex justify-center items-center h-60">
        <div
          class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>

      <ul v-else class="flex-1 overflow-y-auto">
        <li
          v-for="res in allChats"
          :key="res.session_id"
          class="cursor-pointer transition-all duration-200"
          @click="selectRequest(res)"
        >
          <div
            :class="[
              'px-4 py-3 transition-all flex items-start gap-3 mx-2 my-2 rounded-lg',
              selectedSession?.session_id === res.session_id
                ? 'bg-teal-50 text-teal-600 font-semibold border-teal-200 border'
                : 'hover:bg-gray-50 border border-transparent',
            ]"
          >
            <div
              class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md"
            >
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>

            <div class="flex-1 min-w-0 relative">
              <div
                v-if="!res.is_read_admin"
                class="absolute inset-0 bg-red-50/60 rounded-lg -z-10"
              ></div>

              <div class="flex justify-between items-start mb-1">
                <div class="flex-1 min-w-0">
                  <span
                    :class="[
                      'block truncate text-sm leading-tight transition-all',
                      !res.is_read_admin ? 'font-bold text-gray-900' : 'font-medium text-gray-600',
                    ]"
                  >
                    {{ res.user_email }}
                  </span>
                </div>

                <span class="text-xs text-gray-500 flex-shrink-0 ml-3">
                  {{ formatTime(res.last_message_time) }}
                </span>
              </div>

              <p
                :class="[
                  'text-sm truncate transition-colors',
                  !res.is_read_admin ? 'text-gray-800 font-medium' : 'text-gray-600',
                ]"
              >
                {{ res.last_message }}
              </p>

              <span v-if="!res.is_read_admin" class="absolute -top-1 -left-6 pointer-events-none">
                <span class="relative flex">
                  <span
                    class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-teal-200 opacity-80"
                  ></span>
                  <span
                    class="relative inline-flex rounded-full h-3 w-3 bg-teal-300 shadow-lg"
                  ></span>
                </span>
              </span>
            </div>
          </div>
        </li>

        <li v-if="!allChats.length" class="p-8 text-center">
          <div
            class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3"
          >
            <svg
              class="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p class="text-gray-500 font-medium">No chats found</p>
        </li>
      </ul>
    </nav>

    <section
      class="flex-1 bg-white h-full shadow-lg rounded-xl overflow-hidden border border-gray-200 flex flex-col"
    >
      <div
        class="px-6 py-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gradient-to-r from-white to-gray-50"
      >
        <div class="flex flex-col">
          <h1 class="text-2xl text-gray-800">User Chat</h1>
          <p class="text-gray-600 text-sm">Admin can respond to all unanswered chat from users</p>
        </div>
        <Filter v-model:website="selectedWebsite" />
      </div>

      <section class="flex-1 flex flex-col overflow-hidden">
        <header
          class="px-6 py-4 border-b bg-gradient-to-r from-teal-50/50 to-blue-50/50 flex items-center justify-between"
        >
          <template v-if="selectedSession">
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg"
              >
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p class="text-lg text-teal-600">
                  {{ selectedSession.user_email }}
                </p>
              </div>
            </div>

            <div class="flex items-center">
              <p class="text-sm text-gray-600 font-medium">
                {{ selectedSession.message_count }} messages
              </p>
              <button @click="openPopup" class="p-2 rounded text-mainColor" title="Expand chat">
                <Extend />
              </button>
            </div>
          </template>
        </header>

        <section
          class="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-50/30 to-white"
          id="chatMessagesContainer"
          ref="chatSection"
        >
          <div v-if="!selectedSession" class="h-[200px] flex items-center justify-center">
            <div class="text-center">
              <div
                class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-10 h-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p class="text-gray-600 font-semibold text-lg">Select a session to view messages</p>
              <p class="text-gray-400 text-sm mt-1">Choose a conversation from the sidebar</p>
            </div>
          </div>

          <div v-else>
            <div v-if="messagesLoading" class="flex justify-center items-center h-60">
              <div
                class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
              ></div>
            </div>

            <div v-else class="space-y-3 min-h-0">
              <!-- Messages -->
              <div
                v-for="m in messages"
                :key="m.id"
                :class="['flex', m.sender_type === 'admin' ? 'justify-end' : 'justify-start']"
              >
                <div
                  :class="[
                    'max-w-[75%] px-4 py-3 rounded-2xl shadow-md transition-all hover:shadow-lg',
                    m.sender_type === 'admin'
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200',
                  ]"
                >
                  <p class="text-sm leading-relaxed break-words">{{ m.message }}</p>
                  <p
                    :class="[
                      'text-xs mt-2',
                      m.sender_type === 'admin' ? 'text-teal-100' : 'text-gray-500',
                    ]"
                  >
                    {{ formatTime(m.timestamp) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Input Footer -->
        <footer class="px-6 py-4 border-t bg-white">
          <div class="flex gap-3">
            <input
              v-model="newMessage"
              @keyup.enter="sendMessage"
              :disabled="!selectedSession || sending"
              placeholder="Type your message..."
              class="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              @click="sendMessage"
              :disabled="!selectedSession || !newMessage.trim() || sending"
              class="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-600 hover:to-teal-700 transition shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg
                v-if="!sending"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <div
                v-else
                class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></div>
              <span>{{ sending ? 'Sending...' : 'Send' }}</span>
            </button>
          </div>
        </footer>
      </section>
    </section>
  </div>

  <li
    v-for="res in suggestions.length ? suggestions : allChats"
    :key="(suggestions.length ? 's-' : 'a-') + res.session_id"
    @click="selectRequest(res)"
    class="cursor-pointer transition-all duration-200 group relative"
  >
    <div
      :class="[
        'px-4 py-3 transition-all flex items-start gap-3 mx-2 my-2 rounded-lg',
        selectedSession?.session_id === res.session_id
          ? 'bg-teal-50 text-teal-600 font-semibold border-teal-200 border'
          : 'hover:bg-gray-50 border border-transparent',
      ]"
    >
      <!-- Avatar -->
      <div
        class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md"
      >
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <!-- Content Area -->
      <div class="flex-1 min-w-0 relative">
        <!-- Unread background -->
        <div v-if="!res.is_read_admin" class="absolute inset-0 bg-red-50/60 rounded-lg -z-10"></div>

        <!-- Top row: Email + Time + Actions -->
        <div class="flex justify-between items-start mb-1">
          <div class="flex-1 min-w-0">
            <span
              :class="[
                'block truncate text-sm leading-tight transition-all',
                !res.is_read_admin ? 'font-bold text-gray-900' : 'font-medium text-gray-600',
              ]"
            >
              {{ res.user_email }}
            </span>
          </div>

          <!-- Time + Actions Container -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-xs text-gray-500">
              {{ formatTime(res.last_message_time) }}
            </span>

            <!-- Three-dot Menu Button - Shows on hover for ALL items -->
            <button
              @click.stop="toggleMenu(res.session_id)"
              class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
              :class="{ 'opacity-100': activeMenuId === res.session_id }"
              aria-label="More options"
            >
              <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Last message -->
        <p
          :class="[
            'text-sm truncate transition-colors pr-8',
            !res.is_read_admin ? 'text-gray-800 font-medium' : 'text-gray-600',
          ]"
        >
          {{ res.last_message }}
        </p>

        <!-- Unread indicator -->
        <span v-if="!res.is_read_admin" class="absolute -top-1 -left-6 pointer-events-none">
          <span class="relative flex">
            <span
              class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-teal-200 opacity-80"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-teal-300 shadow-lg"></span>
          </span>
        </span>
      </div>
    </div>

    <!-- Dropdown Menu (Shows for the clicked item only) -->
    <div
      v-if="activeMenuId === res.session_id"
      class="absolute right-4 z-50 mt-1 w-32 rounded-md bg-white shadow-lg border border-gray-200 py-1"
      @click.stop
    >
      <button
        @click="deleteChat(res.session_id)"
        class="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Delete Chat
      </button>
    </div>
  </li>
  <!-- Change the button class from this: -->

  <!-- To this (always visible): -->
  <!-- <button 
  @click.stop="toggleMenu(res.session_id)"
  class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none"
  :class="{'opacity-100 bg-gray-100': activeMenuId === res.session_id}"
> -->
</template>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@keyframes pulse-strong {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.animate-ping-strong {
  animation: pulse-strong 1.5s ease-in-out infinite;
}
li:hover .bg-red-50\/60 {
  background-color: rgba(254, 226, 226, 0.8) !important;
}
</style>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import axios from 'axios'
import { VueFinalModal } from 'vue-final-modal'
import Cancel from './Icons/Cancel.vue'
import Reload from './Icons/Reload.vue'
import SendBtn from './Icons/SendBtn.vue'

const emit = defineEmits(['close', 'send'])
const props = defineProps({
  session: Object,
  messages: Array,
  website: String,
  loading: Boolean,
  sending: Boolean,
  newMessage: String,
  formatTime: Function,
  onTypingStart: Function,
  onTypingStop: Function,
  getConnectionStatus: Function,
  getTypingStatus: Function,
})

console.log('ExpendedChat props:', props.website)

const internalMessage = ref('')
const typingTimeout = ref(null)

// Create computed properties for reactive values
const connectionStatus = computed(() => props.getConnectionStatus?.() || {})
const isTyping = computed(() => props.getTypingStatus?.() || false)

watch(
  () => props.newMessage,
  (val) => {
    internalMessage.value = val
  },
  { immediate: true },
)

const handleSend = () => {
  if (!internalMessage.value.trim()) return

  // Stop typing indicator
  props.onTypingStop?.()

  emit('send', internalMessage.value)
  internalMessage.value = ''
}

const closeModal = () => {
  // Make sure typing indicator is stopped
  props.onTypingStop?.()
  emit('close')
}

// Handle typing indicators on input
const handleInput = () => {
  // Clear existing timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  // Start typing
  props.onTypingStart?.()

  // Set timeout to stop typing after 1 second of inactivity
  typingTimeout.value = setTimeout(() => {
    props.onTypingStop?.()
  }, 1000)
}

// Cleanup on unmount
onUnmounted(() => {
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  // Ensure typing is stopped
  props.onTypingStop?.()
})

// Watch for internal message changes to trigger typing
watch(internalMessage, () => {
  if (internalMessage.value.trim()) {
    handleInput()
  } else {
    props.onTypingStop?.()
  }
})
</script>

<template>
  <!-- this is for the dashboard overview -->
  <main class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
    <div class="flex flex-wrap lg:flex-nowrap gap-6 w-full">
      <div
        class="flex flex-row items-center flex-1 min-w-[300px] h-[190px] shadow-sm bg-white rounded-lg overflow-hidden"
      >
        <div class="flex flex-col p-6 flex-1 gap-3">
          <h2 class="text-lg text-mainColor font-semibold">Welcome Back, {{ firstName }} 🎉</h2>
          <p class="text-sm text-gray-600 leading-relaxed">
            Your platform is running smoothly today.<br />
            Check key stats to stay on top of performance.
          </p>
          <RouterLink
            :to="{ name: 'chatreview' }"
            class="w-[110px] px-4 py-2 bg-mainColor text-white rounded-lg shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
          >
            View Chat
          </RouterLink>
        </div>
        <div class="ml-auto h-full flex items-end">
          <Illustration />
        </div>
      </div>

      <div class="flex flex-row flex-wrap justify-between gap-5 min-w-[350px]">
        <div
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition animate-fadeUp"
        >
          <div v-if="loading" class="flex justify-center items-center h-[139px] w-[155px]">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>

          <div v-else-if="Object.keys(allChats).length" class="animate-fadeUp">
            <div class="relative bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div
                class="absolute top-3 right-3 w-8 h-8 bg-blue-50 text-blue-500 flex items-center justify-center rounded-lg"
              >
                <UserIcon />
              </div>

              <p class="text-gray-500 text-sm mb-1">Total Users</p>
              <div class="mt-3 h-[1px] bg-gray-100 w-full"></div>
              <h2 class="text-2xl font-bold text-gray-800">{{ Object.keys(allChats).length }}</h2>

              <p class="text-xs text-gray-400 mt-2">Across all sources</p>
            </div>
          </div>

          <div v-else class="w-[155px]">
            <NoUserFound />
          </div>
        </div>

        <div
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div v-if="loading" class="flex justify-center items-center h-[139px] w-[155px]">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>
          <div v-else-if="Object.values(allMessages).flat().length" class="animate-fadeUp">
            <div class="relative bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div
                class="absolute top-3 right-3 w-8 h-8 bg-blue-50 text-blue-500 flex items-center justify-center rounded-lg"
              >
                <Message />
              </div>

              <p class="text-gray-500 text-sm mb-1">Total Messages</p>
              <div class="mt-3 h-[1px] bg-gray-100 w-full"></div>
              <h2 class="text-2xl font-bold text-gray-800">
                {{ totalMessageCount }}
              </h2>

              <p class="text-xs text-gray-400 mt-2">Across all sources</p>
            </div>
          </div>
          <div v-else class="w-[155px]">
            <NoMessageFound />
          </div>
        </div>
      </div>
    </div>
    <div class="w-full flex items-center justify-end mt-2 mb-1">
      <div class="flex items-center gap-3">
        <Filter v-model:website="selectedWebsite" />
      </div>
    </div>

    <section class="w-full mt-4 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-800">User Activity</h2>
            <button
              @click="getAllUser"
              class="text-sm bg-mainColor text-white px-3 py-1 rounded-lg hover:bg-teal-700 transition"
            >
              Refresh
            </button>
          </div>

          <div class="flex justify-center items-center h-[250px]">
            <canvas ref="userChartRef" class="max-w-[250px]"></canvas>
          </div>
        </div>

        <div
          class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div v-if="loading" class="flex justify-center items-center h-40">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>

          <div v-else-if="allMessages">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">Recent Conversations</h2>

            <div class="space-y-4 max-h-[260px] overflow-y-auto">
              <div
                v-for="(recent, index) in allMessages.slice(0, 3)"
                :key="index"
                class="border-b border-gray-100 pb-3 last:border-0"
              >
                <div class="flex justify-between items-center">
                  <h3 class="font-medium text-gray-700">User: {{ recent.id }}</h3>
                  <span class="text-xs text-gray-400">{{ recent.message.length }} msgs</span>
                </div>
                <p class="text-sm text-mainColor truncate mt-1">
                  {{ recent.message }}
                </p>
              </div>
            </div>
          </div>
          <div v-else>
            <EmptyNoMessage />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<template>
  <!-- this for the settings part -->
  <div class="p-6 bg-white shadow rounded-lg">
    <div class="flex flex-row justify-between items-center">
      <h2 class="text-3xl font-semibold mb-6">Chatbot Appearance</h2>
      <Filter v-model:website="selectedWebsite" v-model:apikey="selectedApikey" />
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-4">
      <Loading class="w-6 h-6 mx-auto" />
      <p class="text-sm text-gray-500 mt-2">Loading settings...</p>
      <div class="flex justify-center items-center h-60">
        <div
          class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-6">
      <!-- Left: Customization Controls -->
      <div class="lg:w-2/5 space-y-6">
        <!-- Avatar Selector -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Chatbot Avatar</h3>

          <!-- Avatar Preview -->
          <div class="mb-4 p-4 border rounded-lg bg-gray-50">
            <div class="flex items-center justify-center mb-2">
              <div class="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow">
                <img
                  :src="currentAvatarUrl"
                  class="w-full h-full object-cover"
                  alt="Selected Avatar"
                />
              </div>
            </div>
            <p class="text-sm text-center text-gray-600">
              {{ currentAvatar.name || 'AI Bot' }}
            </p>
          </div>

          <!-- Avatar Options -->
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="avatar in avatarOptions"
              :key="avatar.id"
              @click="selectAvatar(avatar.id)"
              class="p-2 border rounded hover:bg-gray-50 transition-colors"
              :class="
                selectedAvatar === avatar.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
              "
            >
              <img :src="avatar.url" class="w-8 h-8 mx-auto rounded" :alt="avatar.name" />
              <div class="text-xs text-center mt-1 truncate">{{ avatar.name }}</div>
            </button>
          </div>
        </div>

        <!-- Color Scheme -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Color Scheme</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div class="flex items-center gap-4">
                <input
                  type="color"
                  v-model="customization.primarycolor"
                  class="w-12 h-12 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  v-model="customization.primarycolor"
                  class="flex-1 px-3 py-2 border rounded-md font-mono"
                  @change="validateColor"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div class="flex items-center gap-4">
                <input
                  type="color"
                  v-model="customization.secondarycolor"
                  class="w-12 h-12 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  v-model="customization.secondarycolor"
                  class="flex-1 px-3 py-2 border rounded-md font-mono"
                  @change="validateColor"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Bubble Settings -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Chat Bubble</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Bubble Size</label>
              <input
                type="range"
                v-model="customization.bubblesize"
                min="48"
                max="80"
                class="w-full"
              />
              <div class="text-xs text-gray-500 text-center">{{ customization.bubblesize }}px</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="pos in positions"
                  :key="pos.value"
                  @click="customization.position = pos.value"
                  class="p-3 border rounded-md text-center hover:bg-gray-50"
                  :class="customization.position === pos.value ? 'bg-teal-50 border-teal-200' : ''"
                >
                  <div class="text-lg mb-1">{{ pos.icon }}</div>
                  <div class="text-xs">{{ pos.label }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Window -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Chat Window</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Chat Width</label>
              <div class="flex items-center gap-4">
                <input
                  type="range"
                  v-model="customization.popupwidth"
                  min="300"
                  max="500"
                  class="flex-1"
                />
                <span class="text-sm font-mono">{{ customization.popupwidth }}px</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Chat Height</label>
              <div class="flex items-center gap-4">
                <input
                  type="range"
                  v-model="customization.bubblewidth"
                  min="400"
                  max="700"
                  class="flex-1"
                />
                <span class="text-sm font-mono">{{ customization.bubblewidth }}px</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
              <input
                type="range"
                v-model="customization.borderraduis"
                min="0"
                max="24"
                class="w-full"
              />
              <div class="text-xs text-gray-500 text-center">
                {{ customization.borderraduis }}px
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Show Avatar</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="customization.showavartar" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"
                ></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Save/Reset Buttons -->
        <div class="flex gap-3">
          <button
            @click="resetCustomization"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            @click="saveCustomization"
            :disabled="loading"
            class="flex-1 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loading v-if="loading" class="w-4 h-4" />
            <span v-if="!loading">Save Changes</span>
          </button>
        </div>
      </div>

      <!-- Right: Live Preview -->
      <div class="lg:w-3/5">
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-4">Live Preview</h3>

          <div class="border rounded-lg bg-gray-50 p-4 min-h-[500px] relative">
            <div class="bg-white rounded p-4 mb-4 shadow-sm">
              <p>Welcome to your chat</p>
            </div>
            <div
              class="absolute transition-all duration-300"
              :class="positionClasses[customization.position]"
            >
              <!-- Chat Bubble -->
              <div
                class="rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105"
                :style="{
                  width: customization.bubblesize + 'px',
                  height: customization.bubblesize + 'px',
                  backgroundColor: customization.primarycolor,
                }"
              >
                <div class="w-full h-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M2 22V9q0-.825.588-1.413Q3.175 7 4 7h2V4q0-.825.588-1.413Q7.175 2 8 2h12q.825 0 1.413.587Q22 3.175 22 4v8q0 .825-.587 1.412Q20.825 14 20 14h-2v3q0 .825-.587 1.413Q16.825 19 16 19H5Zm6-10h8V9H8Zm-4 5h12v-3H8q-.825 0-1.412-.588Q6 12.825 6 12V9H4Zm14-5h2V4H8v3h8q.825 0 1.413.587Q18 8.175 18 9Z"
                    />
                  </svg>
                </div>
              </div>

              <!-- Chat Window Preview -->
              <div
                v-if="showPreviewWindow"
                class="absolute bottom-full mb-4 right-0 rounded-lg shadow-xl overflow-hidden transition-all duration-300"
                :style="{
                  width: customization.popupwidth + 'px',
                  height: customization.bubblewidth + 'px',
                  backgroundColor: 'white',
                  borderRadius: customization.borderraduis + 'px',
                  border: `1px solid ${customization.secondarycolor}20`,
                }"
              >
                <!-- Header -->
                <div
                  class="p-4"
                  :style="{
                    backgroundColor: customization.primarycolor,
                    color: 'white',
                  }"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div
                        v-if="customization.showavartar"
                        class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                        :style="{ backgroundColor: customization.secondarycolor }"
                      >
                        <img
                          :src="currentAvatarUrl"
                          class="w-8 h-8 rounded-full object-cover"
                          alt="Chatbot Avatar"
                        />
                      </div>
                      <div>
                        <div class="font-semibold">ChatBot</div>
                        <div class="text-sm opacity-90">Online • Ready to help</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Messages -->
                <div class="p-4 flex-1 overflow-hidden h-[calc(100%-140px)]">
                  <div class="space-y-3">
                    <!-- Bot Message -->
                    <div class="flex gap-2">
                      <div
                        v-if="customization.showavartar"
                        class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                        :style="{ backgroundColor: customization.primarycolor }"
                      >
                        <img
                          :src="currentAvatarUrl"
                          class="w-6 h-6 rounded-full object-cover"
                          alt="Bot"
                        />
                      </div>
                      <div
                        class="rounded-2xl px-4 py-3 max-w-[80%]"
                        :style="{
                          backgroundColor: customization.secondarycolor + '20',
                          color: '#333',
                        }"
                      >
                        <div class="text-sm">Hello! How can I help you today?</div>
                      </div>
                    </div>

                    <!-- User Message -->
                    <div class="flex gap-2 justify-end">
                      <div
                        class="rounded-2xl px-4 py-3 max-w-[80%]"
                        :style="{
                          backgroundColor: customization.primarycolor,
                          color: 'white',
                        }"
                      >
                        <div class="text-sm">I need help with my order</div>
                      </div>
                      <div
                        v-if="customization.showavartar"
                        class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-gray-300"
                      >
                        <div class="text-xs font-bold">U</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Input -->
                <div class="p-3 border-t">
                  <div class="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      class="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2"
                      :style="{
                        borderColor: customization.secondarycolor + '50',
                        '--tw-ring-color': customization.primarycolor + '30',
                      }"
                    />
                    <button
                      class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      :style="{ backgroundColor: customization.primarycolor }"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Toggle Preview Button -->
            <div class="absolute bottom-4 left-4">
              <button
                @click="showPreviewWindow = !showPreviewWindow"
                class="px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 text-sm"
              >
                {{ showPreviewWindow ? 'Hide Chat Window' : 'Show Chat Window' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
