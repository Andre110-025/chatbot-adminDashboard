<script setup>
import { ref, onUnmounted } from 'vue'
import * as Ably from 'ably'
import { ChatClient } from '@ably/chat'

export function useTypingIndicator() {
  const isTyping = ref(false)
  const typingUsers = ref([])
  const room = ref(null)
  const chatClient = ref(null)

  const typingOptions = {
    heartbeatThrottleMs: 3000,
  }

  const initializeTyping = async (ablyClient, roomName = 'chat-typing') => {
    try {
      chatClient.value = new ChatClient(ablyClient)

      // Get room with typing capabilities
      room.value = await chatClient.value.rooms.get(roomName, { typing: typingOptions })
      await room.value.attach()

      // Subscribe to typing events
      room.value.typing.subscribe((event) => {
        const typingClientIds = Array.from(event.currentlyTyping).filter(
          (id) => id !== ablyClient.clientId,
        )

        typingUsers.value = typingClientIds
        isTyping.value = typingClientIds.length > 0

        console.log('👀 Typing users:', typingClientIds)
      })

      return true
    } catch (error) {
      console.error('Error initializing typing indicator:', error)
      return false
    }
  }

  const startTyping = async () => {
    if (room.value) {
      await room.value.typing.keystroke()
    }
  }

  const stopTyping = async () => {
    if (room.value) {
      await room.value.typing.keystroke() // Ably handles stopping automatically
    }
  }

  const disconnect = () => {
    if (room.value) {
      room.value.typing.unsubscribe()
      room.value.detach()
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    isTyping,
    typingUsers,
    initializeTyping,
    startTyping,
    stopTyping,
    disconnect,
  }
}
</script>
