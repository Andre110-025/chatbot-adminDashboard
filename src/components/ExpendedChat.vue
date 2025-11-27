<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
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
})

console.log('ExpendedChat props:', props.website)

const internalMessage = ref('')

watch(
  () => props.newMessage,
  (val) => {
    internalMessage.value = val
  },
  { immediate: true },
)

const handleSend = () => {
  emit('send', internalMessage.value)
  internalMessage.value = ''
}

const closeModal = () => {
  emit('close')
}

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

        <p class="text-lg text-teal-600">
          {{ props.session?.user_email }}
        </p>
      </div>

      <button
        @click="closeModal"
        class="p-2.5 rounded-lg bg-red-50 text-red-600 transition-all duration-200 active:scale-95"
      >
        <Cancel />
      </button>
    </header>

    <section class="flex-1 p-6 overflow-y-auto bg-gray-50" ref="chatSection">
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
    </section>

    <footer class="p-4 border-t bg-white flex gap-3">
      <input
        v-model="internalMessage"
        @keyup.enter="handleSend"
        placeholder="Type a message..."
        class="flex-1 border rounded-lg px-3 py-2"
      />

      <button
        :disabled="props.sending"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg"
        @click="handleSend"
      >
        {{ props.sending ? 'Sending…' : 'Send' }}
      </button>
    </footer>
  </VueFinalModal>
</template>
