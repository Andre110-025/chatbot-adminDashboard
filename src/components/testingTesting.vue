<script setup>
import Filter from './Filter.vue'
import { nextTick, onMounted, onUnmounted, ref, watch, computed } from 'vue' // 👈 Added computed
import axios from 'axios'
import { toast } from 'vue3-toastify'
import Extend from './Icons/Extend.vue'
import { useModal } from 'vue-final-modal'
import ExpendedChat from './ExpendedChat.vue'
import { useAbly } from '../composables/useAbly.js'
import Search from './Icons/Search.vue'
import { useTypingIndicator } from '../composables/useTypingIndicator.js' // 👈 Your typing composable

const loading = ref(false)
const allChats = ref([])
const selectedWebsite = ref(null)
const selectedRequest = ref(null)
const selectedSession = ref(null)
const messages = ref([])
const messagesLoading = ref(false)
const sending = ref(false)
const newMessage = ref('')

// Initialize Ably
const { isConnected, initializeAbly, onNewSession, onNewMessage, disconnect: disconnectAbly } = useAbly()

// 👇 NEW: Initialize Typing Indicator
const { 
  isTyping: isSomeoneTyping, 
  typingUsers, 
  initializeTyping, 
  startTyping,
  disconnect: disconnectTyping 
} = useTypingIndicator()

// Cleanup functions for Ably subscriptions
let unsubscribeSession = null
let unsubscribeMessages = null
let typingTimeout = null // 👈 NEW: For typing timeout

const getAllUser = async (website) => {
  if (!website) return
  try {
    loading.value = true
    const response = await axios.get('/chat/admin/sessions', {
      params: { website },
    })
    console.log('Sessions loaded:', response)
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

// 👇 NEW: Handle typing events
const handleTyping = () => {
  if (selectedSession.value) {
    startTyping()
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    
    // Set new timeout (Ably will handle stopping automatically)
    typingTimeout = setTimeout(() => {
      // Typing will automatically stop via Ably's heartbeat
    }, 1000)
  }
}

// Initialize Ably and set up subscriptions on mount
onMounted(async () => {
  if (selectedWebsite.value) {
    getAllUser(selectedWebsite.value)
  }

  // Initialize Ably connection
  const success = await initializeAbly()

  if (success) {
    console.log('Ably initialized successfully')

    // 👇 NEW: Initialize typing with the same Ably instance
    // Use session-specific room names for each chat
    await initializeTyping(window.ablyInstance, 'admin-chat-room')

    // Subscribe to new sessions
    unsubscribeSession = onNewSession((sessionData) => {
      console.log('New session received:', sessionData)

      // Check if this session belongs to the selected website
      if (selectedWebsite.value && sessionData.website === selectedWebsite.value.website) {
        // Check if session already exists
        const exists = allChats.value.find((chat) => chat.session_id === sessionData.session_id)

        if (!exists) {
          // Add new session to the top of the list
          allChats.value.unshift(sessionData)
          toast.success('New chat session started!')
        }
      }
    })

    unsubscribeMessages = onNewMessage((messageData) => {
      console.log('📨 New message received on admin side:', messageData)
      console.log('Raw message data structure:', JSON.stringify(messageData, null, 2))

      // Update last message in the chat list (sidebar)
      const chatIndex = allChats.value.findIndex(
        (chat) => chat.session_id === messageData.session_id,
      )

      if (chatIndex !== -1) {
        allChats.value[chatIndex].last_message = messageData.message
        allChats.value[chatIndex].last_message_time = messageData.timestamp

        if (messageData.sender_type === 'user') {
          allChats.value[chatIndex].is_read_admin = false
        }

        const [chat] = allChats.value.splice(chatIndex, 1)
        allChats.value.unshift(chat)
      }

      const messageSessionId = String(messageData.session_id).trim()
      const currentSessionId = selectedSession.value?.session_id
        ? String(selectedSession.value.session_id).trim()
        : null

      console.log('🔍 Session ID Check:', {
        messageSessionId,
        currentSessionId,
        match: messageSessionId === currentSessionId,
      })

      if (currentSessionId && messageSessionId === currentSessionId) {
        console.log('✅ Message is for CURRENTLY SELECTED session, adding to chat UI')

        const messageId =
          messageData.id ||
          `${messageData.session_id}-${messageData.timestamp}-${messageData.sender_type}`

        const messageExists = messages.value.find((m) => {
          const existingId =
            m.id || `${m.session_id || messageSessionId}-${m.timestamp}-${m.sender_type}`
          return existingId === messageId
        })

        if (!messageExists) {
          console.log('➕ Adding message to current chat UI')
          messages.value.push({
            id: messageId,
            message: messageData.message,
            sender_type: messageData.sender_type,
            timestamp: messageData.timestamp,
          })

          nextTick(() => {
            scrollToBottom()
          })

          if (messageData.sender_type === 'user') {
            markAsRead(selectedSession.value)
          }
        }
      }
    })
  } else {
    console.error('Failed to initialize Ably')
    toast.error('Real-time connection failed. Messages will not update automatically.')
  }
})

// 👇 NEW: Enhanced status text with typing indicator
const statusText = computed(() => {
  if (!isConnected.value) return 'Connecting...'
  if (isSomeoneTyping.value && typingUsers.value.length > 0) {
    const users = typingUsers.value.join(' and ')
    return `${users} ${typingUsers.value.length === 1 ? 'is' : 'are'} typing...`
  }
  return 'Online'
})

// Clean up subscriptions on unmount
onUnmounted(() => {
  if (unsubscribeSession) unsubscribeSession()
  if (unsubscribeMessages) unsubscribeMessages()
  disconnectAbly()
  disconnectTyping() // 👈 NEW: Clean up typing
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }
})

// ... rest of your existing functions (getMessages, markAsRead, selectRequest, etc.) remain the same ...

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedSession.value) return

  const messageText = newMessage.value
  const website = selectedWebsite.value?.website || selectedSession.value.website

  newMessage.value = ''

  const tempId = `temp-${Date.now()}-${Math.random()}`
  const tempMessage = {
    id: tempId,
    message: messageText,
    sender_type: 'admin',
    timestamp: new Date().toISOString(),
    pending: true,
    isTemporary: true,
  }

  messages.value.push(tempMessage)

  nextTick(() => {
    scrollToBottom()
  })

  try {
    sending.value = true
    console.log('📤 Sending message:', {
      session_id: selectedSession.value.session_id,
      message: messageText,
      website: website,
      sender_type: 'admin',
    })

    const response = await axios.post('/chat/admin/message', {
      session_id: selectedSession.value.session_id,
      message: messageText,
      website: website,
      sender_type: 'admin',
    })

    console.log('Message sent successfully:', response.data)

    setTimeout(() => {
      const tempIndex = messages.value.findIndex((m) => m.id === tempId && m.isTemporary)
      if (tempIndex !== -1) {
        console.log('Removing temporary message after successful send')
        messages.value.splice(tempIndex, 1)
      }
    }, 1000)

    selectedSession.value.is_read_admin = true
  } catch (error) {
    console.error('Send error:', error.response?.data || error)

    const tempIndex = messages.value.findIndex((m) => m.id === tempId)
    if (tempIndex !== -1) {
      messages.value.splice(tempIndex, 1)
    }

    newMessage.value = messageText
    toast.error('Failed to send message')
  } finally {
    sending.value = false
  }
}

// ... rest of your existing functions remain the same ...
</script>

<template>
  <div class="flex flex-col md:flex-row h-auto md:h-[500px] gap-4">
    <!-- Connection Status Indicators -->
    <div
      v-if="!isConnected && removeActiveTag"
      class="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
    >
      <div class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
      <span class="text-sm font-medium">Connecting to real-time updates...</span>
    </div>

    <div
      v-if="isConnected && removeActiveTag"
      class="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
    >
      <div class="w-2 h-2 rounded-full bg-green-500"></div>
      <span class="text-sm font-medium">Live updates active</span>
    </div>

    <!-- Sidebar -->
    <nav
      class="w-full md:w-[320px] bg-white shadow-lg rounded-xl overflow-hidden flex flex-col border border-gray-200"
    >
      <div
        class="px-5 py-4 border-b flex items-center gap-3 bg-gradient-to-r from-teal-20 to-blue-50"
      >
        <h2 class="text-lg text-gray-800 whitespace-nowrap">All Users</h2>
      </div>

      <div v-if="loading" class="flex justify-center items-center h-60">
        <div
          class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>

      <ul v-else class="flex-1 overflow-y-auto animate-fadeUp">
        <li
          v-for="res in suggestions.length ? suggestions : allChats"
          :key="(suggestions.length ? 's-' : 'a-') + res.session_id"
          @click="selectRequest(res)"
          class="cursor-pointer transition-all duration-200"
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
      </ul>
    </nav>

    <!-- Main Chat Area -->
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
                <!-- 👇 NEW: Typing status indicator -->
                <p v-if="isSomeoneTyping && typingUsers.length > 0" class="text-sm text-gray-500">
                  {{ typingUsers.join(' and ') }} {{ typingUsers.length === 1 ? 'is' : 'are' }} typing...
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
                    m.pending ? 'opacity-70' : '',
                  ]"
                >
                  <p class="text-sm leading-relaxed break-words">{{ m.message }}</p>
                  <p
                    :class="[
                      'text-xs mt-2 flex items-center gap-1',
                      m.sender_type === 'admin' ? 'text-teal-100' : 'text-gray-500',
                    ]"
                  >
                    {{ formatTime(m.timestamp) }}
                    <span v-if="m.pending" class="italic">• sending...</span>
                  </p>
                </div>
              </div>

              <!-- 👇 NEW: Typing indicator bubble -->
              <div v-if="isSomeoneTyping && typingUsers.length > 0" class="message-row user">
                <div class="message-bubble user">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 👇 UPDATED: Input with typing detection -->
        <footer class="px-6 py-4 border-t bg-white">
          <div class="flex gap-3">
            <input
              v-model="newMessage"
              @keydown="handleTyping" <!-- 👈 NEW: Typing detection -->
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
</template>

<style scoped>
/* Add typing indicator styles */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* Rest of your existing styles... */
</style>