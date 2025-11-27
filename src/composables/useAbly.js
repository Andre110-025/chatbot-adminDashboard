// src/composables/useAbly.js (ADMIN SIDE - FIXED)
import { ref, readonly } from 'vue'
import * as Ably from 'ably'

const ablyService = ref(null)
const isConnected = ref(false)

const ABLY_AUTH_URL = 'https://assitance.storehive.com.ng/public/api/ably/auth'

export function useAbly() {
  const initializeAbly = async () => {
    if (ablyService.value) {
      // console.log('Ably already initialized')
      return true
    }

    try {
      // console.log('🔄 Initializing Ably connection...')

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
      console.log('Auth response:', json)

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
        // console.log('Client ID:', json.data.clientId || 'anonymous')
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
        // console.warn('Ably connection suspended')
        isConnected.value = false
      })

      ably.connection.on('closed', () => {
        // console.log('Ably connection closed')
        isConnected.value = false
      })

      ablyService.value = ably
      return true
    } catch (err) {
      console.error('Ably initialization failed:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
      })
      return false
    }
  }

  const subscribe = (channelName, callback) => {
    if (!ablyService.value) {
      console.error(' Cannot subscribe: Ably not initialized')
      return () => {}
    }

    try {
      const channel = ablyService.value.channels.get(channelName)

      channel.subscribe((msg) => {
        // console.log(`RAW MESSAGE on [${channelName}]:`, {
        //   name: msg.name,
        //   data: msg.data,
        //   timestamp: msg.timestamp,
        // })
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

  // Check msg.name instead of msg.data.event_type
  const onNewSession = (callback) => {
    return subscribe('admin-sessions', (msg) => {
      // console.log('🔔 ADMIN RAW SESSION MESSAGE:', msg)

      //  Check msg.name, not msg.data.event_type
      if (msg.name === 'new.session') {
        // console.log('🆕 Admin received new.session:', msg.data)
        callback(msg.data)
      }
    })
  }

  // Check msg.name instead of msg.data.event_type
  const onNewMessage = (callback) => {
    return subscribe('chat-messages', (msg) => {
      // console.log('🔔 ADMIN RAW CHAT MESSAGE:', msg)

      //  Check msg.name, not msg.data.event_type
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
        // console.log('📩 Message for session filter:', {
        //   eventName: msg.name,
        //   sessionId: msg.data?.session_id,
        //   targetSession: sessionId,
        // })

        // ✅ FIXED: Check msg.name
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
        // console.log(`🔕 Admin stopped listening to session: ${sessionId}`)
      }
    } catch (err) {
      console.error('❌ Subscribe error:', err)
      return () => {}
    }
  }

  const disconnect = () => {
    if (ablyService.value) {
      ablyService.value.close()
      ablyService.value = null
      isConnected.value = false
      // console.log('👋 Ably disconnected')
    }
  }

  return {
    isConnected: readonly(isConnected),
    initializeAbly,
    subscribe,
    onNewSession,
    onNewMessage,
    onAdminReply,
    disconnect,
  }
}
