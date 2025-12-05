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
