import { ref, readonly } from 'vue'
import * as Ably from 'ably'

const ablyService = ref(null)
const isConnected = ref(false)

const ABLY_AUTH_URL = 'https://assitance.storehive.com.ng/public/api/ably/auth'

export function useAbly() {
  const typingTimeouts = new Map()

  const initializeAbly = async () => {
    if (ablyService.value) {
      return true
    }

    try {
      const res = await fetch(ABLY_AUTH_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('Auth endpoint error:', errorText)
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }

      const json = await res.json()
      // console.log('Auth response:', json)

      if (!json.success) {
        throw new Error(json.message || json.error || 'Auth failed')
      }

      const ably = new Ably.Realtime({
        token: json.data.token,
        echoMessages: false,
        clientId: json.data.clientId || undefined,
        autoConnect: true,
      })

      ably.connection.on('connected', () => {
        // console.log('✅ Ably CONNECTED (Admin)')
        isConnected.value = true
      })

      ably.connection.on('connecting', () => {
        // console.log('🔄 Ably connecting...')
      })

      ably.connection.on('disconnected', () => {
        // console.log('⚠️ Ably disconnected')
        isConnected.value = false
      })

      ably.connection.on('failed', (error) => {
        console.error('Ably connection failed:', error)
        isConnected.value = false
      })

      ably.connection.on('suspended', () => {
        console.warn('Ably connection suspended')
        isConnected.value = false
      })

      ably.connection.on('closed', () => {
        console.log('Ably connection closed')
        isConnected.value = false
      })

      ablyService.value = ably
      return true
    } catch (err) {
      console.error('Ably initialization failed:', err)
      return false
    }
  }

  const subscribe = (channelName, callback) => {
    if (!ablyService.value) {
      console.error('Cannot subscribe: Ably not initialized')
      return () => {}
    }

    try {
      const channel = ablyService.value.channels.get(channelName)

      channel.subscribe((msg) => {
        callback(msg)
      })

      // console.log(`Subscribed to channel: ${channelName}`)

      return () => {
        channel.unsubscribe()
        // console.log(`Unsubscribed from channel: ${channelName}`)
      }
    } catch (err) {
      console.error(`Subscribe error on ${channelName}:`, err)
      return () => {}
    }
  }

  const onNewSession = (callback) => {
    return subscribe('admin-sessions', (msg) => {
      if (msg.name === 'new.session') {
        // console.log('🆕 Admin received new.session:', msg.data)
        callback(msg.data)
      }
    })
  }

  const onNewMessage = (callback) => {
    return subscribe('chat-messages', (msg) => {
      if (msg.name === 'new.message') {
        // console.log('💬 Admin received new.message:', msg.data)
        callback(msg.data)
      }
    })
  }

  const onAdminReply = (sessionId, callback) => {
    if (!ablyService.value) {
      console.error('❌ Cannot subscribe: Ably not initialized')
      return () => {}
    }

    try {
      const channel = ablyService.value.channels.get('chat-messages')

      const handler = (msg) => {
        if (msg.name === 'new.message' && msg.data) {
          if (msg.data.session_id === sessionId) {
            // console.log('💬 Message received for session:', msg.data)
            callback(msg.data)
          }
        }
      }

      channel.subscribe(handler)
      // console.log(`✅ Admin listening to session: ${sessionId}`)

      return () => {
        channel.unsubscribe(handler)
        console.log(`🔕 Admin stopped listening to session: ${sessionId}`)
      }
    } catch (err) {
      console.error('❌ Subscribe error:', err)
      return () => {}
    }
  }

  // Get channel properly
  const sendTypingIndicator = (sessionId, isTyping) => {
    if (!ablyService.value) {
      console.warn('Cannot send typing indicator: Ably not initialized')
      return
    }

    try {
      // Get channel from ablyService
      const channel = ablyService.value.channels.get('typing-indicator')

      channel.publish('typing', {
        session_id: sessionId,
        sender_type: 'admin',
        is_typing: isTyping,
        timestamp: new Date().toISOString(),
      })

      // console.log('📤 Admin typing indicator sent:', { sessionId, isTyping })
    } catch (err) {
      console.error('Failed to send typing indicator:', err)
    }
  }

  // Get channel properly
  const onUserTyping = (callback) => {
    if (!ablyService.value) {
      console.error('Cannot subscribe to typing: Ably not initialized')
      return () => {}
    }

    try {
      // Get channel from ablyService
      const channel = ablyService.value.channels.get('typing-indicator')

      const listener = (message) => {
        const data = message.data

        // Only process typing events from users
        if (data.sender_type === 'user') {
          console.log('📥 User typing received:', data)
          callback(data)

          // Auto-clear after 3 seconds
          const key = data.session_id
          if (typingTimeouts.has(key)) {
            clearTimeout(typingTimeouts.get(key))
          }

          if (data.is_typing) {
            const timeout = setTimeout(() => {
              callback({ ...data, is_typing: false })
              typingTimeouts.delete(key)
            }, 3000)
            typingTimeouts.set(key, timeout)
          } else {
            typingTimeouts.delete(key)
          }
        }
      }

      channel.subscribe('typing', listener)
      // console.log('✅ Subscribed to user typing indicators')

      return () => {
        channel.unsubscribe('typing', listener)
        typingTimeouts.forEach((timeout) => clearTimeout(timeout))
        typingTimeouts.clear()
        // console.log('🔕 Unsubscribed from typing indicators')
      }
    } catch (err) {
      console.error('Subscribe to typing failed:', err)
      return () => {}
    }
  }

  const disconnect = () => {
    if (ablyService.value) {
      typingTimeouts.forEach((timeout) => clearTimeout(timeout))
      typingTimeouts.clear()
      ablyService.value.close()
      ablyService.value = null
      isConnected.value = false
      console.log('👋 Ably disconnected')
    }
  }

  return {
    isConnected: readonly(isConnected),
    initializeAbly,
    subscribe,
    onNewSession,
    onNewMessage,
    onAdminReply,
    sendTypingIndicator,
    onUserTyping,
    disconnect,
  }
}
