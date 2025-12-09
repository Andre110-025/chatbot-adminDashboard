<script setup>
import { ref, onMounted, nextTick, watch, onUnmounted, computed } from 'vue'
import axios from 'axios'
import { VueFinalModal } from 'vue-final-modal'
import Cancel from './Icons/Cancel.vue'
import Reload from './Icons/Reload.vue'
import SendBtn from './Icons/SendBtn.vue'

const emit = defineEmits(['close', 'send'])
// const newMessage = ref('')
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
  props.onTypingStop?.()
  emit('close')
}

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

// const formatTime = (timestamp) => {
//   const date = new Date(timestamp)
//   return date.toLocaleTimeString([], {
//     hour: '2-digit',
//     minute: '2-digit',
//   })
// }

// const sendMessage = async () => {
//   if (!newMessage.value.trim() || !selectedSession.value) return

//   try {
//     sending.value = true
//     const response = await axios.post('/chat/admin/message', {
//       session_id: props.session.session_id,
//       message: newMessage.value,
//       website: props.website,
//       sender_type: 'admin',
//     })
//     console.log(response)
//     newMessage.value = ''
//     await getMessages(selectedSession.value.session_id)
//   } catch (error) {
//     toast.error('Failed to send message')
//   } finally {
//     sending.value = false
//   }
// }
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
      class="px-6 py-4 border-b bg-gradient-to-r from-teal-50/50 to-blue-50/50 flex justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"
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
            {{ props.session?.user_email }}
          </p>
          <!-- Show connection status -->
          <div class="flex items-center gap-1 text-xs">
            <span
              class="w-2 h-2 rounded-full"
              :class="connectionStatus.isConnected ? 'bg-green-500' : 'bg-yellow-500'"
            ></span>
            <span class="text-gray-500">
              {{
                connectionStatus.statusText ||
                (connectionStatus.isConnected ? 'Online' : 'Connecting...')
              }}
            </span>
          </div>
        </div>
      </div>

      <button
        @click="closeModal"
        class="p-2.5 rounded-lg bg-red-50 text-red-600 transition-all duration-200 active:scale-95"
      >
        <Cancel />
      </button>
    </header>

    <section class="flex-1 p-6 overflow-y-auto bg-gray-50" ref="chatSection">
      <div v-if="props.loading" class="flex justify-center items-center h-full">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"
          ></div>
          <p class="text-gray-500">Loading messages...</p>
        </div>
      </div>
      <div v-else>
        <div v-for="msg in props.messages" :key="msg.id" class="mb-4">
          <div class="flex" :class="msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'">
            <div
              :class="[
                msg.sender_type === 'admin' ? 'bg-teal-100' : 'bg-gray-100',
                'p-3 rounded-xl shadow',
              ]"
            >
              {{ msg.message }}
            </div>
          </div>

          <div
            class="text-xs text-gray-400 mt-1"
            :class="msg.sender_type === 'admin' ? 'text-right' : 'text-left'"
          >
            {{ props.formatTime(msg.timestamp) }}
          </div>
        </div>
      </div>

      <div v-if="isTyping" class="flex justify-start mb-4">
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
    </section>

    <footer class="p-4 border-t bg-white flex gap-3">
      <div class="flex gap-3">
        <input
          v-model="internalMessage"
          @keyup.enter="handleSend"
          @input="handleInput"
          :disabled="props.sending"
          placeholder="Type your message..."
          class="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <button
          @click="handleSend"
          :disabled="!internalMessage.trim() || props.sending"
          class="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-600 hover:to-teal-700 transition shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
        >
          <svg
            v-if="!props.sending"
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
          <span>{{ props.sending ? 'Sending...' : 'Send' }}</span>
        </button>
      </div>
    </footer>
  </VueFinalModal>
</template>
