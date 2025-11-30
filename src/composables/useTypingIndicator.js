// ──────────────────────────────────────────────────────────────
// REACTIVE TYPING INDICATOR PER SESSION
// ──────────────────────────────────────────────────────────────
const typingText = ref('')
let currentTypingRoom = null // Keep track of current room

// Create a dedicated Ably client just for typing (separate from your message channels)
const typingRealtime = new Ably.Realtime({
  key: config.ABLY_KEY,
  clientId: `admin-${nanoid(6)}`, // Unique per admin tab
})

const typingChatClient = new ChatClient(typingRealtime)

const typingOptions = {
  heartbeatThrottleMs: 3000,
}

// Function to join/leave typing room when session changes
watch(selectedSession, async (newSession, oldSession) => {
  // Leave previous room
  if (currentTypingRoom) {
    await currentTypingRoom.detach()
    currentTypingRoom.typing.unsubscribe()
    currentTypingRoom = null
    typingText.value = ''
  }

  // Join new room if session selected
  if (newSession?.session_id) {
    const roomName = `typing:${newSession.session_id}` // Unique per chat session

    try {
      currentTypingRoom = await typingChatClient.rooms.get(roomName, {
        typing: typingOptions,
      })

      await currentTypingRoom.attach()

      // Listen to typing events
      currentTypingRoom.typing.subscribe((event) => {
        const typingIds = Array.from(event.currentTyping).filter(
          (id) => id !== typingChatClient.clientId,
        ) // Exclude self

        if (typingIds.length === 0) {
          typingText.value = ''
        } else if (typingIds.length === 1) {
          const name = typingIds[0].startsWith('admin-') ? 'Admin' : 'User'
          typingText.value = `${name} is typing...`
        } else {
          typingText.value = 'Several people are typing...'
        }
      })
    } catch (err) {
      console.error('Failed to join typing room:', err)
    }
  }
})

// Send typing start when admin types
let typingTimeout = null
watch(newMessage, async (val) => {
  if (!currentTypingRoom?.typing || !val.trim()) return

  clearTimeout(typingTimeout)

  await currentTypingRoom.typing.keystroke()

  // Optional: auto-stop typing after 5s of inactivity
  typingTimeout = setTimeout(async () => {
    if (currentTypingRoom?.typing) {
      await currentTypingRoom.typing.stop()
    }
  }, 5000)
})

// Cleanup on unmount
onUnmounted(() => {
  if (currentTypingRoom) {
    currentTypingRoom.detach()
  }
  typingRealtime.close()
})
