<script setup>
import { useModal } from 'vue-final-modal'
import PopupChatBot from './PopupChatBot.vue'
import User from './Icons/User.vue'

const { open, close } = useModal({
  component: PopupChatBot,
  attrs: {
    onConfirm() {
      close()
    },
  },
})

// Reuse modal instance to avoid recreating on every click
const openChat = () => open()
</script>

<template>
  <transition name="float">
    <button
      @click="openChat"
      aria-label="Open NexDre Chatbot"
      class="group fixed bottom-8 right-8 z-40 flex items-center justify-center rounded-full p-5 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl backdrop-blur-xl border border-white/30 dark:border-emerald-700/50 hover:shadow-emerald-500/25 focus:outline-none focus:ring-4 focus:ring-emerald-400/50 transition-all duration-300 hover:scale-110 active:scale-95"
    >
      <span
        class="absolute inset-0 rounded-full bg-emerald-400/40 animate-pulse-ring pointer-events-none"
      ></span>

      <div class="relative z-10 flex items-center justify-center">
        <User class="w-7 h-7 drop-shadow-md transition-transform group-hover:scale-110" />
      </div>

      <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-300 rounded-full shadow-md">
        <span class="absolute inset-0 rounded-full bg-emerald-300 animate-ping"></span>
      </span>

      <span
        class="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
      >
        Chat with user
        <span
          class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-gray-900"
        ></span>
      </span>
    </button>
  </transition>
</template>
