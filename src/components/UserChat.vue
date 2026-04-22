<script setup>
import Filter from './Filter.vue'
import { nextTick, onMounted, onUnmounted, ref, watch, computed } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import Extend from './Icons/Extend.vue'
import { useModal } from 'vue-final-modal'
import ExpendedChat from './ExpendedChat.vue'
import { useAbly } from '../composables/useAbly.js'
import { nanoid } from 'nanoid'
import { config } from '@/config'
import Delete from './Icons/Delete.vue'
import Loading from './Icons/Loading.vue'
import ConfirmDeleteChat from './ConfirmDeleteChat.vue'
import ArrowLeft from './Icons/ArrowLeft.vue'

const loading = ref(false)
const deleting = ref(false)
const allChats = ref([])
const selectedWebsite = ref(null)
const selectedRequest = ref(null)
const selectedSession = ref(null)
const messages = ref([])
const messagesLoading = ref(false)
const sending = ref(false)
const newMessage = ref('')

// Mobile-specific state
const showChatView = ref(false)

// Connection status display - disappears after 10 seconds
const showConnectionStatus = ref(true)
setTimeout(() => {
  showConnectionStatus.value = false
}, 10000)

// Initialize Ably
const {
  isConnected,
  initializeAbly,
  onNewSession,
  onNewMessage,
  sendTypingIndicator,
  onUserTyping,
  disconnect: disconnectAbly,
} = useAbly()

// Cleanup functions for Ably subscriptions
let unsubscribeSession = null
let unsubscribeMessages = null

const userTypingMap = ref(new Map())
let typingUnsubscribe = null
let inputTypingTimeout = null

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

// Initialize Ably and set up subscriptions on mount
onMounted(async () => {
  if (selectedWebsite.value) {
    getAllUser(selectedWebsite.value)
  }

  // Initialize Ably connection
  const success = await initializeAbly()

  if (success) {
    console.log('Ably initialized successfully')

    unsubscribeSession = onNewSession((sessionData) => {
      console.log('New session received:', sessionData)

      if (selectedWebsite.value && sessionData.website === selectedWebsite.value.website) {
        const exists = allChats.value.find((chat) => chat.session_id === sessionData.session_id)

        if (!exists) {
          allChats.value.unshift(sessionData)
          toast.success('New chat session started!')
        }
      }
    })

    unsubscribeMessages = onNewMessage((messageData) => {
      console.log('New message received:', messageData)

      const messageSessionId = String(messageData.session_id).trim()
      const currentSessionId = selectedSession.value?.session_id
        ? String(selectedSession.value.session_id).trim()
        : null

      const isMessageFromUser = messageData.sender_type === 'user'
      const isCurrentSession = messageSessionId === currentSessionId

      const chatIndex = allChats.value.findIndex(
        (chat) => chat.session_id === messageData.session_id,
      )

      if (chatIndex !== -1) {
        allChats.value[chatIndex].last_message = messageData.message
        allChats.value[chatIndex].last_message_time = messageData.timestamp

        if (isMessageFromUser) {
          allChats.value[chatIndex].is_read_admin = isCurrentSession
        }

        const [chat] = allChats.value.splice(chatIndex, 1)
        allChats.value.unshift(chat)
      }

      if (isCurrentSession) {
        const messageId =
          messageData.id ||
          `${messageData.session_id}-${messageData.timestamp}-${messageData.sender_type}`

        const messageExists = messages.value.find((m) => {
          const existingId =
            m.id || `${m.session_id || messageSessionId}-${m.timestamp}-${m.sender_type}`
          return existingId === messageId
        })

        if (!messageExists) {
          messages.value.push({
            id: messageId,
            message: messageData.message,
            sender_type: messageData.sender_type,
            timestamp: messageData.timestamp,
          })

          nextTick(() => {
            scrollToBottom()
          })

          if (isMessageFromUser) {
            markAsRead(selectedSession.value)
          }
        }
      } else {
        if (isMessageFromUser) {
          const chat = allChats.value.find((c) => c.session_id === messageData.session_id)
          toast.info(`New message from ${chat?.user_email || 'a user'}`)
        }
      }
    })
    typingUnsubscribe = onUserTyping((data) => {
      userTypingMap.value.set(data.session_id, data.is_typing)
    })
  } else {
    console.error('Failed to initialize Ably')
    toast.error('Real-time connection failed. Messages will not update automatically.')
  }
})

// Clean up subscriptions on unmount
onUnmounted(() => {
  if (unsubscribeSession) unsubscribeSession()
  if (unsubscribeMessages) unsubscribeMessages()
  if (typingUnsubscribe) typingUnsubscribe()
  if (inputTypingTimeout) clearTimeout(inputTypingTimeout)
  disconnectAbly()
})

const isCurrentUserTyping = computed(() => {
  if (!selectedSession.value) return false
  return userTypingMap.value.get(selectedSession.value.session_id) || false
})

const handleInputChange = () => {
  if (!selectedSession.value) return

  sendTypingIndicator(selectedSession.value.session_id, true)

  if (inputTypingTimeout) clearTimeout(inputTypingTimeout)

  inputTypingTimeout = setTimeout(() => {
    sendTypingIndicator(selectedSession.value.session_id, false)
  }, 1000)
}

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

    messages.value = response.data.data?.messages || []

    nextTick(() => {
      scrollToBottom()
    })
  } catch (err) {
    console.error('Failed to load messages:', err.response?.data || err)
    toast.error(err.response?.data?.error || 'Failed to load messages')
  } finally {
    messagesLoading.value = false
  }
}

const markAsRead = async (session) => {
  if (!session || session.is_read_admin) return

  const website = selectedWebsite.value?.website || session.website

  try {
    await axios.post('/chat/markread', {
      session_id: session.session_id,
      sender_type: 'admin',
      website: website,
    })

    const chatInList = allChats.value.find((c) => c.session_id === session.session_id)
    if (chatInList) {
      chatInList.is_read_admin = true
    }
    session.is_read_admin = true
  } catch (err) {
    console.warn('Failed to mark as read', err)
  }
}

const selectRequest = async (request) => {
  selectedSession.value = null
  messages.value = []
  await nextTick()
  selectedSession.value = { ...request }

  if (!request.is_read_admin) {
    await markAsRead(request)
  }

  await getMessages(request.session_id)

  // On mobile, switch to chat view
  if (window.innerWidth < 768) {
    showChatView.value = true
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

const chatSection = ref(null)
const scrollToBottom = () => {
  if (chatSection.value) {
    chatSection.value.scrollTop = chatSection.value.scrollHeight
  }
}

watch(
  messages,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  },
  { deep: true },
)

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

  if (inputTypingTimeout) clearTimeout(inputTypingTimeout)
  sendTypingIndicator(selectedSession.value.session_id, false)

  try {
    sending.value = true

    await axios.post('/chat/admin/message', {
      session_id: selectedSession.value.session_id,
      message: messageText,
      website: website,
      sender_type: 'admin',
    })

    setTimeout(() => {
      const tempIndex = messages.value.findIndex((m) => m.id === tempId && m.isTemporary)
      if (tempIndex !== -1) {
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

const handleModalSend = async (msg) => {
  if (!msg.trim() || !selectedSession.value) return

  const tempId = Date.now()
  messages.value.push({
    id: tempId,
    message: msg,
    sender_type: 'admin',
    timestamp: new Date().toISOString(),
    pending: true,
  })

  scrollToBottom()

  try {
    sending.value = true
    await axios.post('/chat/admin/message', {
      session_id: selectedSession.value.session_id,
      message: msg,
      website: selectedWebsite.value?.website || selectedSession.value.website,
      sender_type: 'admin',
    })

    const tempIndex = messages.value.findIndex((m) => m.id === tempId)
    if (tempIndex !== -1) {
      messages.value.splice(tempIndex, 1)
    }
  } catch (err) {
    toast.error('Failed to send message')
    const tempIndex = messages.value.findIndex((m) => m.id === tempId)
    if (tempIndex !== -1) {
      messages.value.splice(tempIndex, 1)
    }
  } finally {
    sending.value = false
  }
}

function deleteConversation() {
  const website = selectedWebsite.value?.website || selectedSession.value?.website || null
  const sessionId = selectedSession.value?.session_id || null

  if (!sessionId || !website) {
    toast.error('Missing info')
    return
  }

  const { open, close } = useModal({
    component: ConfirmDeleteChat,
    attrs: {
      website,
      id: sessionId,
      onConfirm(id) {
        if (id) {
          const index = allChats.value.findIndex((chat) => chat.session_id === id)
          if (index !== -1) allChats.value.splice(index, 1)

          if (selectedSession.value?.session_id === id) {
            selectedSession.value = null
            messages.value = []
            newMessage.value = ''

            if (window.innerWidth < 768) {
              showChatView.value = false
            }
          }
        }
        close()
      },
    },
  })

  open()
}

// Mobile back function
const goBackToList = () => {
  showChatView.value = false
  selectedSession.value = null
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
      website: selectedWebsite.value?.website || selectedSession.value.website,
      onTypingStart: () => {
        if (selectedSession.value) {
          sendTypingIndicator(selectedSession.value.session_id, true)
        }
      },
      onTypingStop: () => {
        if (selectedSession.value) {
          sendTypingIndicator(selectedSession.value.session_id, false)
        }
      },
      getConnectionStatus: () => ({
        isConnected: isConnected.value,
      }),
      getTypingStatus: () => {
        if (!selectedSession.value) return false
        return userTypingMap.value.get(selectedSession.value.session_id) || false
      },
      onClose: () => close(),
      onSend: (msg) => handleModalSend(msg),
    },
  })

  open()
}

const isMobile = ref(false)
const mobileHeightStyle = ref({})

onMounted(() => {
  isMobile.value = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  // Set dynamic height for mobile
  if (isMobile.value && window.visualViewport) {
    mobileHeightStyle.value = {
      height: `${window.visualViewport.height}px`,
    }
  }
})
</script>

<template>
  <div class="block md:hidden overflow-x-hidden">
    <!-- User List View -->
    <div v-if="!showChatView" class="h-full flex flex-col">
      <div class="bg-teal-600 text-white px-4 py-3 shadow-md">
        <div class="flex items-center justify-between mb-3">
          <h1 class="text-xl font-semibold">Chats</h1>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 bg-teal-700 rounded-full text-xs font-medium">
              {{ allChats.length }}
            </span>
          </div>
        </div>
        <Filter v-model:website="selectedWebsite" class="w-full" />
      </div>

      <div
        v-if="showConnectionStatus"
        :class="[
          'mx-3 mt-2 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2',
          isConnected
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        ]"
      >
        <div
          :class="[
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse',
          ]"
        ></div>
        {{ isConnected ? 'Connected' : 'Connecting...' }}
      </div>

      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div
          class="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"
        ></div>
      </div>

      <!-- Chat List -->
      <div v-else class="flex-1 overflow-y-auto bg-white">
        <div
          v-for="chat in allChats"
          :key="chat.session_id"
          @click="selectRequest(chat)"
          class="px-4 py-3 border-b border-gray-100 active:bg-gray-50 transition-colors cursor-pointer"
        >
          <div class="flex items-start gap-3">
            <div class="relative flex-shrink-0"></div>

            <div class="flex-1 min-w-0 overflow-hidden">
              <div class="flex items-baseline justify-between mb-1">
                <h3
                  :class="[
                    'text-base truncate',
                    !chat.is_read_admin
                      ? 'font-semibold text-gray-900'
                      : 'font-medium text-gray-800',
                  ]"
                >
                  {{ chat.user_email }}
                </h3>
                <span class="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {{ formatTime(chat.last_message_time) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <p
                  :class="[
                    'text-sm truncate flex-1',
                    !chat.is_read_admin ? 'text-gray-900 font-medium' : 'text-gray-600',
                  ]"
                >
                  {{ chat.last_message || 'No messages yet' }}
                </p>
                <span
                  v-if="!chat.is_read_admin"
                  class="ml-2 w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"
                ></span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="allChats.length === 0"
          class="flex flex-col items-center justify-center h-full py-16 px-4"
        >
          <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg
              class="w-12 h-12 text-gray-400"
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
          <p class="text-gray-600 font-semibold text-lg mb-1">No chats yet</p>
          <p class="text-gray-500 text-sm text-center">Select a website to view conversations</p>
        </div>
      </div>
    </div>

    <div v-else class="h-[77vh] flex flex-col bg-gray-50">
      <div class="bg-teal-600 text-white px-4 py-3 shadow-md flex items-center gap-3">
        <button
          @click="goBackToList"
          class="p-1 -ml-1 hover:bg-teal-700 rounded-full transition-colors"
        >
          <ArrowLeft class="w-6 h-6" />
        </button>
        <div
          class="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0"
        >
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="font-semibold text-base truncate">{{ selectedSession?.user_email }}</h2>
          <p class="text-xs text-teal-100">{{ selectedSession?.message_count }} messages</p>
        </div>
        <button
          @click="deleteConversation"
          class="p-2 hover:bg-teal-700 rounded-full transition-colors"
        >
          <Delete class="w-5 h-5" />
        </button>
      </div>

      <div
        ref="chatSection"
        class="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        style="
          background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2Y5ZmFmYiIgZmlsbC1vcGFjaXR5PSIuNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==');
          background-color: #efeae2;
        "
      >
        <div v-if="messagesLoading" class="flex justify-center py-8">
          <div
            class="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"
          ></div>
        </div>

        <div v-else>
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['flex mb-2', msg.sender_type === 'admin' ? 'justify-end' : 'justify-start']"
          >
            <div
              :class="[
                'max-w-[80%] px-3 py-2 rounded-lg shadow-sm',
                msg.sender_type === 'admin'
                  ? 'bg-teal-500 text-white rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none',
                msg.pending ? 'opacity-70' : '',
              ]"
            >
              <p class="text-sm leading-relaxed break-words whitespace-pre-wrap">
                {{ msg.message }}
              </p>
              <div
                :class="[
                  'flex items-center justify-end gap-1 mt-1',
                  msg.sender_type === 'admin' ? 'text-teal-100' : 'text-gray-500',
                ]"
              >
                <span class="text-xs">{{ formatTime(msg.timestamp) }}</span>
                <span v-if="msg.pending" class="text-xs">•••</span>
                <svg
                  v-else-if="msg.sender_type === 'admin'"
                  class="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isCurrentUserTyping" class="flex justify-start mb-2">
            <div class="bg-white px-4 py-3 rounded-lg rounded-bl-none shadow-sm">
              <div class="flex gap-1">
                <span
                  class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style="animation-delay: 0ms"
                ></span>
                <span
                  class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style="animation-delay: 150ms"
                ></span>
                <span
                  class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style="animation-delay: 300ms"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white border-t border-gray-200 px-3 py-2">
        <div class="flex items-center gap-2">
          <input
            v-model="newMessage"
            @input="handleInputChange"
            @keyup.enter="sendMessage"
            :disabled="sending"
            placeholder="Type a message"
            class="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          />
          <button
            @click="sendMessage"
            :disabled="!newMessage.trim() || sending"
            class="w-11 h-11 bg-teal-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-400 transition-colors active:scale-95"
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
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Desktop/Tablet View (768px and above) -->
  <div class="hidden md:flex flex-col lg:flex-row lg:h-[calc(100vh-120px)] gap-4 antialiased">
    <div
      v-if="showConnectionStatus && !isConnected"
      class="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2"
    >
      <div class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
      <span class="text-xs sm:text-sm font-medium">Connecting...</span>
    </div>

    <div
      v-if="showConnectionStatus && isConnected"
      class="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2"
    >
      <div class="w-2 h-2 rounded-full bg-green-500"></div>
      <span class="text-xs sm:text-sm font-medium">Live updates</span>
    </div>
    <nav
      class="max-[407px]:w-[95vw] max-[407px]:mx-auto max-[450px]:h-[300px] max-[450px]:w-[350px] w-full lg:w-[320px] flex-shrink-0 bg-white shadow-sm rounded-xl overflow-hidden flex flex-col border border-gray-200 h-[30vh] lg:h-full"
    >
      <div
        class="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-teal-20 to-blue-50 sticky top-0 z-10"
      >
        <h2 class="text-base text-gray-800 font-semibold">All Users</h2>
      </div>

      <div v-if="loading" class="flex justify-center items-center h-40">
        <div
          class="loader w-10 p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>

      <ul v-else class="flex-1 overflow-y-auto animate-fadeUp">
        <li
          v-for="res in allChats"
          :key="res.session_id"
          @click="selectRequest(res)"
          class="cursor-pointer transition-all duration-200 group"
        >
          <div
            :class="[
              'px-3 py-2 transition-all flex items-start gap-3 mx-2 my-2 rounded-lg',
              selectedSession?.session_id === res.session_id
                ? 'bg-teal-50 text-teal-600 font-semibold border-teal-200 border'
                : 'hover:bg-gray-50 border border-transparent',
            ]"
          >
            <div
              class="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow"
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

                <span class="text-xs text-gray-500 flex-shrink-0 ml-2 text-nowrap">
                  {{ formatTime(res.last_message_time) }}
                </span>
              </div>

              <div class="flex justify-between items-end gap-2">
                <p
                  :class="[
                    'text-sm truncate transition-colors flex-1',
                    !res.is_read_admin ? 'text-gray-800 font-medium' : 'text-gray-600',
                  ]"
                >
                  {{ res.last_message }}
                </p>

                <span
                  v-if="res.last_message"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0 shadow-sm"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="hidden sm:inline">Active</span>
                </span>

                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border border-gray-300 flex-shrink-0"
                >
                  <span class="hidden sm:inline">Inactive</span>
                </span>
              </div>

              <span v-if="!res.is_read_admin" class="absolute -top-1 -left-5 pointer-events-none">
                <span class="relative flex">
                  <span
                    class="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-teal-200 opacity-80"
                  ></span>
                  <span
                    class="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-300 shadow"
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

    <!-- Chat Section -->
    <section
      class="flex-1 min-w-0 bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200 flex flex-col h-[65vh] lg:h-full"
    >
      <div
        class="px-4 py-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0"
      >
        <div class="flex flex-col w-full sm:w-auto">
          <h1 class="text-lg sm:text-xl text-gray-800 font-semibold">User Chat</h1>
          <p class="text-gray-600 text-xs sm:text-sm">
            Admin can respond to all unanswered chat from users
          </p>
        </div>
        <div class="w-full sm:w-auto">
          <Filter v-model:website="selectedWebsite" class="w-full" />
        </div>
      </div>

      <div class="flex-1 flex flex-col overflow-hidden min-h-0">
        <header
          class="px-4 py-3 border-b bg-gradient-to-r from-teal-50/50 to-blue-50/50 flex items-center justify-between flex-shrink-0"
        >
          <template v-if="selectedSession">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <div
                class="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow flex-shrink-0"
              >
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm sm:text-base text-teal-600 font-medium truncate">
                  {{ selectedSession.user_email }}
                </p>
                <p class="text-xs text-gray-500 truncate">
                  {{ selectedSession.message_count }} messages
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  @click="openPopup"
                  class="p-1 text-gray-400 hover:text-gray-600"
                  title="Expand chat"
                >
                  <Extend class="w-5 h-5" />
                </button>
                <button
                  @click="deleteConversation()"
                  :disabled="deleting"
                  title="Delete Chat Session"
                  class="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Loading v-if="deleting" class="w-5 h-5 text-gray-700" />
                  <Delete v-else class="text-gray-700 w-5 h-5" />
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shadow">
                <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm sm:text-base text-gray-400 font-medium">No chat selected</p>
                <p class="text-xs text-gray-400 hidden sm:block">
                  Select a conversation from the sidebar
                </p>
              </div>
            </div>
          </template>
        </header>

        <section
          class="flex-1 p-3 sm:p-4 overflow-y-auto bg-gradient-to-b from-gray-50/30 to-white min-h-0"
          id="chatMessagesContainer"
          ref="chatSection"
        >
          <div v-if="!selectedSession" class="h-full flex items-center justify-center">
            <div class="text-center">
              <div
                class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3"
              >
                <svg
                  class="w-7 h-7 sm:w-8 sm:h-8 text-gray-400"
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
              <p class="text-gray-600 font-semibold text-sm sm:text-base">
                Select a session to view messages
              </p>
              <p class="text-gray-400 text-xs mt-1">Choose a conversation from above</p>
            </div>
          </div>

          <div v-else>
            <div v-if="messagesLoading" class="flex justify-center items-center h-32">
              <div
                class="loader w-10 p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
              ></div>
            </div>

            <div v-else class="space-y-2 sm:space-y-3">
              <div
                v-for="m in messages"
                :key="m.id"
                :class="['flex', m.sender_type === 'admin' ? 'justify-end' : 'justify-start']"
              >
                <div
                  :class="[
                    'max-w-[85%] sm:max-w-[75%] px-3 py-2 rounded-2xl shadow break-words',
                    m.sender_type === 'admin'
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200',
                    m.pending ? 'opacity-70' : '',
                  ]"
                >
                  <p class="text-sm leading-relaxed break-words">{{ m.message }}</p>
                  <p
                    :class="[
                      'text-xs mt-1 flex items-center gap-1',
                      m.sender_type === 'admin' ? 'text-teal-100' : 'text-gray-500',
                    ]"
                  >
                    {{ formatTime(m.timestamp) }}
                    <span v-if="m.pending" class="italic">• sending...</span>
                  </p>
                </div>
              </div>

              <!-- Typing Indicator -->
              <div v-if="isCurrentUserTyping" class="flex justify-start">
                <div class="bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
                  <div class="flex gap-1">
                    <span
                      class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style="animation-delay: 0ms"
                    ></span>
                    <span
                      class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style="animation-delay: 150ms"
                    ></span>
                    <span
                      class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style="animation-delay: 300ms"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer class="px-3 sm:px-4 py-3 border-t bg-white flex-shrink-0">
          <div class="flex gap-2">
            <input
              v-model="newMessage"
              @input="handleInputChange"
              @keyup.enter="sendMessage"
              :disabled="!selectedSession || sending"
              placeholder="Type your message..."
              class="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />

            <button
              @click="sendMessage"
              :disabled="!selectedSession || !newMessage.trim() || sending"
              class="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-600 hover:to-teal-700 transition shadow hover:shadow-lg flex items-center justify-center gap-2 flex-shrink-0 text-sm"
            >
              <svg
                v-if="!sending"
                class="w-4 h-4"
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
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></div>
              <span class="hidden sm:inline">{{ sending ? 'Sending...' : 'Send' }}</span>
            </button>
          </div>
        </footer>
      </div>
    </section>
  </div>
</template>

<style scoped>
@media (max-width: 1024px) {
  #chatMessagesContainer {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    max-height: 50vh !important;
  }
}

::-webkit-scrollbar {
  width: 6px;
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

.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.min-h-dvh {
  min-height: 100dvh;
}

.h-dvh {
  height: 100dvh;
}
</style>
