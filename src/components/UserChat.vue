q
<script setup>
import Filter from './Filter.vue'
import { nextTick, onMounted, onUnmounted, ref, watch, computed } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import Extend from './Icons/Extend.vue'
import { useModal } from 'vue-final-modal'
import ExpendedChat from './ExpendedChat.vue'
import { useAbly } from '../composables/useAbly.js'
import Search from './Icons/Search.vue'
import { nanoid } from 'nanoid'
import { config } from '@/config'
import Delete from './Icons/Delete.vue'
import ModalDeleteChat from './ModalDeleteChat.vue'
import Loading from './Icons/Loading.vue'
import ConfirmDeleteChat from './ConfirmDeleteChat.vue'

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
    // if initialization is successful
    console.log('Ably initialized successfully')

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

    // Subscribe to new messages
    unsubscribeMessages = onNewMessage((messageData) => {
      console.log('New message received:', messageData) // Better session ID comparison

      const messageSessionId = String(messageData.session_id).trim()
      const currentSessionId = selectedSession.value?.session_id
        ? String(selectedSession.value.session_id).trim()
        : null

      const isMessageFromUser = messageData.sender_type === 'user'
      const isCurrentSession = messageSessionId === currentSessionId // Update last message in the chat list (sidebar)

      const chatIndex = allChats.value.findIndex(
        (chat) => chat.session_id === messageData.session_id,
      )

      if (chatIndex !== -1) {
        // Update the last message and timestamp
        allChats.value[chatIndex].last_message = messageData.message
        allChats.value[chatIndex].last_message_time = messageData.timestamp // Mark as unread ONLY if message is from user AND it's NOT the current session

        if (isMessageFromUser) {
          // If it is the current session, mark as read (true). Otherwise, mark as unread (false).
          allChats.value[chatIndex].is_read_admin = isCurrentSession
        } // Move this chat to the top

        const [chat] = allChats.value.splice(chatIndex, 1)
        allChats.value.unshift(chat)
      } // If this message is for the currently open chat, add it to messages

      if (isCurrentSession) {
        // Generate unique ID if backend doesn't provide one
        const messageId =
          messageData.id ||
          `${messageData.session_id}-${messageData.timestamp}-${messageData.sender_type}` // Check if message already exists by unique identifier

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
          }) // If message is from user, mark as read automatically

          // This also takes care of updating selectedSession.value.is_read_admin
          if (isMessageFromUser) {
            markAsRead(selectedSession.value)
          }
        } else {
          console.log('⚠️ Message already exists in current chat, skipping')
        }
      } else {
        console.log('📋 Message is for different session, only updating sidebar')
        console.log('Current session ID:', currentSessionId)
        console.log('Message session ID:', messageSessionId) // Show notification for new message in other sessions

        if (isMessageFromUser) {
          const chat = allChats.value.find((c) => c.session_id === messageData.session_id)
          toast.info(`New message from ${chat?.user_email || 'user'}`)
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

const statusText = computed(() => {
  if (!isConnected.value) {
    return 'Connecting to real-time updates...'
  }
  return 'Online'
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

    // Update local state
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

  // Mark as read
  if (!request.is_read_admin) {
    await markAsRead(request)
  }

  // Load messages
  await getMessages(request.session_id)
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

  // Optimistically add message to UI with a unique temp ID
  const tempId = `temp-${Date.now()}-${Math.random()}`
  const tempMessage = {
    id: tempId,
    message: messageText,
    sender_type: 'admin',
    timestamp: new Date().toISOString(),
    pending: true,
    isTemporary: true, // Mark as temporary
  }

  messages.value.push(tempMessage)

  nextTick(() => {
    scrollToBottom()
  })

  if (inputTypingTimeout) clearTimeout(inputTypingTimeout)
  sendTypingIndicator(selectedSession.value.session_id, false)

  try {
    sending.value = true

    const response = await axios.post('/chat/admin/message', {
      session_id: selectedSession.value.session_id,
      message: messageText,
      website: website,
      sender_type: 'admin',
    })

    // Wait a bit for real-time update, then remove temp message
    setTimeout(() => {
      const tempIndex = messages.value.findIndex((m) => m.id === tempId && m.isTemporary)
      if (tempIndex !== -1) {
        console.log('Removing temporary message after successful send')
        messages.value.splice(tempIndex, 1)
      }
    }, 1000)

    // Mark as read
    selectedSession.value.is_read_admin = true
  } catch (error) {
    console.error('Send error:', error.response?.data || error)

    // Remove failed message immediately
    const tempIndex = messages.value.findIndex((m) => m.id === tempId)
    if (tempIndex !== -1) {
      messages.value.splice(tempIndex, 1)
    }

    // Restore message to input
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
      website: selectedWebsite.value?.website,
      sender_type: 'admin',
    })

    // Remove temp message
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
      website: selectedWebsite.value?.website,
      // Modal Events
      onClose: () => close(),

      onSend: (msg) => handleModalSend(msg),
    },
  })

  open()
}
// const website = selectedWebsite.value?.website || selectedSession.value.website
// const sessionId = selectedSession.value.session_id
// const deleteChatSession = async () => {
//   const sessionId = selectedSession.value.session_id
//   if (!sessionId) {
//     toast.info('No session selected')
//     return
//   }
//   try {
//     deleting.value = true
//     // messagesLoading.value = true
//     const website = selectedWebsite.value?.website || selectedSession.value.website

//     const response = await axios.delete(`chat/admin/session/${sessionId}`, {
//       params: { website: website },
//     })
//     toast.success('Chat session deleted')
//     console.log(response)

//     const index = allChats.value.findIndex((chat) => chat.session_id === sessionId)
//     if (index !== -1) {
//       allChats.value.splice(index, 1)
//     }
//     selectedSession.value = null

//     messages.value = []

//     newMessage.value = ''

//     if (allChats.value.length > 0) {
//     }
//   } catch (err) {
//     console.error('Failed to delete chat session:', err)
//     toast.error('Failed to delete chat session')
//   } finally {
//     deleting.value = false
//     // messagesLoading.value = false
//   }
// }

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
          }
        }
        close()
      },
    },
  })

  open()
}

const extendedChat = ref(null)

const extendChat = (chat) => {
  extendedChat.value = chat
  openPopup()
}

const removeActiveTag = ref(true)

setTimeout(() => {
  removeActiveTag.value = false
}, 10000)

const search = ref('')
const suggestions = ref([])

const getEmailSuggestions = () => {
  const term = search.value.trim().toLowerCase()

  if (term.length < 3) {
    suggestions.value = []
    return
  }

  suggestions.value = allChats.value
    .filter((chat) => chat.user_email.toLowerCase().includes(term))
    .slice(0, 5)
}

watch(search, () => {
  getEmailSuggestions()
})
</script>

<template>
  <div class="flex flex-col md:flex-row h-auto md:h-[500px] gap-4">
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
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>

                <span
                  v-else
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border border-gray-300 flex-shrink-0 transition-all duration-300"
                >
                  Inactive
                </span>
              </div>

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
            <div class="flex items-center gap-2">
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
              <button @click="openPopup" class="rounded text-gray-400" title="Expand chat">
                <Extend class="w-6 h-6" />
              </button>
            </div>

            <div class="flex items-center gap-3">
              <p class="text-sm text-gray-600 font-medium">
                {{ selectedSession.message_count }} messages
              </p>
              <button
                @click="deleteConversation()"
                :disabled="deleting"
                title="Delete Chat Session"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Loading v-if="deleting" class="w-5 h-5 text-gray-700" />
                <Delete v-else class="text-gray-700 w-5 h-5" />
              </button>
            </div>
          </template>

          <template v-else>
            <div class="flex items-center gap-2">
              <div
                class="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center shadow-lg"
              >
                <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p class="text-lg text-gray-400">No chat selected</p>
                <p class="text-sm text-gray-400">Select a conversation from the sidebar</p>
              </div>
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
              <div v-if="isCurrentUserTyping" class="flex justify-start mb-3">
                <div class="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div class="flex gap-1.5">
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
        </section>

        <footer class="px-6 py-4 border-t bg-white">
          <div class="flex gap-3">
            <input
              v-model="newMessage"
              @input="handleInputChange"
              @keyup.enter="sendMessage"
              :disabled="!selectedSession || sending"
              placeholder="Type your message..."
              class="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              @click="sendMessage"
              :disabled="!selectedSession || !newMessage.trim() || sending"
              class="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-600 hover:to-teal-700 transition shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
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
</style>
