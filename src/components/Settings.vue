<script setup>
import { ref, reactive, watch, computed } from 'vue'
import Filter from './Filter.vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import Loading from './Icons/Loading.vue'

const selectedWebsite = ref(null)
const selectedApikey = ref(null)
const loading = ref(false)
const showPreviewWindow = ref(false)

const customization = reactive({
  primarycolor: '#10b981',
  secondarycolor: '#059669',
  bubblesize: 64,
  position: 'bottom-right',
  popupwidth: 400,
  bubblewidth: 600,
  borderraduis: 16,
  showavartar: true,
  avartar: 'https://api.iconify.design/ri:robot-2-fill.svg?color=%23005969',
})

watch(
  [() => selectedWebsite.value, () => selectedApikey.value],
  async ([newWebsite, newApikey], [oldWebsite, oldApikey]) => {
    console.log('Website changed to:', newWebsite)
    console.log('API Key changed to:', newApikey)

    if (!newWebsite || !newApikey) {
      return
    }

    try {
      loading.value = true
      console.log('Fetching settings for:', newWebsite, 'with API:', newApikey)

      const response = await axios.get('/getsettings', {
        params: {
          api: newApikey,
          website: newWebsite,
        },
      })
      console.log('API Response:', response)
      if (response.status === 200 && response.data.Settings && response.data.Settings.length > 0) {
        const settings = response.data.Settings[0]
        console.log('Settings found:', response.data.settings)
        Object.assign(customization, {
          primarycolor: settings.primarycolor || '#10b981',
          secondarycolor: settings.secondarycolor || '#059669',
          bubblesize: parseInt(settings.bubblesize) || 64, // Convert to number
          position: settings.position || 'bottom-right',
          popupwidth: parseInt(settings.popupwidth) || 400, // Convert to number
          bubblewidth: parseInt(settings.bubblewidth) || 600, // Convert to number
          borderraduis: parseInt(settings.borderraduis) || 16, // Convert to number
          showavartar: settings.showavartar === 'true' || settings.showavartar === true || true,
          avartar:
            settings.avartar || 'https://api.iconify.design/ri:robot-2-fill.svg?color=%23005969',
        })

        const savedAvatar = avatarOptions.value.find((a) => a.url === customization.avartar)
        if (savedAvatar) {
          selectedAvatar.value = savedAvatar.id
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.warning('Could not fetch settings for this site')
    } finally {
      loading.value = false
    }
  },
)

const positions = [
  { label: 'Bottom Right', value: 'bottom-right', icon: '↘️' },
  { label: 'Bottom Left', value: 'bottom-left', icon: '↙️' },
]

const positionClasses = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
}

const validateColor = () => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

  if (!hexRegex.test(customization.primarycolor)) {
    customization.primarycolor = '#10b981'
  }
  if (!hexRegex.test(customization.secondarycolor)) {
    customization.secondarycolor = '#059669'
  }
}

const resetCustomization = () => {
  Object.assign(customization, {
    primarycolor: '#10b981',
    secondarycolor: '#059669',
    // textColor: '#ffffff',
    bubblesize: 64,
    position: 'bottom-right',
    popupwidth: 400,
    bubblewidth: 600,
    borderraduis: 16,
    showavartar: true,
    avartar: 'https://api.iconify.design/ri:robot-2-fill.svg?color=%23005969',
  })
}

const saveCustomization = async () => {
  if (!selectedWebsite.value) return

  try {
    loading.value = true
    const response = await axios.post('/addsettings', {
      website: selectedWebsite.value,
      primarycolor: customization.primarycolor,
      secondarycolor: customization.secondarycolor,
      bubblesize: customization.bubblesize,
      position: customization.position,
      popupwidth: customization.popupwidth,
      bubblewidth: customization.bubblewidth,
      borderraduis: customization.borderraduis,
      avartar: customization.avartar,
      showavartar: customization.showavartar,
    })
    console.log(response)
    toast.success('Settings saved successfully')
  } catch (error) {
    toast.error('Could not save settings')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const avatarOptions = ref([
  // BOT AVATARS - Using Iconify bot icons
  {
    id: 'ai_bot',
    name: 'AI Assistant',
    url: 'https://api.iconify.design/ri:robot-2-fill.svg?color=%23005969',
    type: 'bot',
  },
  {
    id: 'robot1',
    name: 'Robot',
    url: 'https://api.iconify.design/ri:robot-fill.svg?color=%23005969',
    type: 'bot',
  },
  {
    id: 'bot_chat',
    name: 'Chat Bot',
    url: 'https://api.iconify.design/ri:chatbot-fill.svg?color=%23005969',
    type: 'bot',
  },
  {
    id: 'bot_smart',
    name: 'Smart Bot',
    url: 'https://api.iconify.design/ri:android-fill.svg?color=%23005969',
    type: 'bot',
  },
  {
    id: 'bot_ai',
    name: 'AI Brain',
    url: 'https://api.iconify.design/ri:brain-fill.svg?color=%23005969',
    type: 'bot',
  },
  {
    id: 'bot_cpu',
    name: 'CPU Bot',
    url: 'https://api.iconify.design/ri:cpu-fill.svg?color=%23005969',
    type: 'bot',
  },

  // HUMAN AVATARS - Using Iconify human icons
  {
    id: 'agent_male',
    name: 'Male Agent',
    url: 'https://api.iconify.design/ri:user-3-fill.svg?color=%23005969',
    type: 'human',
  },
  {
    id: 'agent_female',
    name: 'Female Agent',
    url: 'https://api.iconify.design/ri:user-fill.svg?color=%23005969',
    type: 'human',
  },
  {
    id: 'support_male',
    name: 'Support Agent',
    url: 'https://api.iconify.design/ri:customer-service-2-fill.svg?color=%23005969',
    type: 'human',
  },
  {
    id: 'support_female',
    name: 'Help Desk',
    url: 'https://api.iconify.design/ri:customer-service-fill.svg?color=%23005969',
    type: 'human',
  },
  {
    id: 'business_man',
    name: 'Business',
    url: 'https://api.iconify.design/ri:user-5-fill.svg?color=%23005969',
    type: 'human',
  },
  {
    id: 'business_woman',
    name: 'Executive',
    url: 'https://api.iconify.design/ri:user-4-fill.svg?color=%23005969',
    type: 'human',
  },
  {
    id: 'tech_support',
    name: 'Tech Support',
    url: 'https://api.iconify.design/ri:computer-fill.svg?color=%23005969',
    type: 'human',
  },
  {
    id: 'customer_service',
    name: 'Customer Service',
    url: 'https://api.iconify.design/ri:service-fill.svg?color=%23005969',
    type: 'human',
  },
  {
    id: 'assistant',
    name: 'Assistant',
    url: 'https://api.iconify.design/ri:user-star-fill.svg?color=%23005969',
    type: 'human',
  },
  {
    id: 'message_bot',
    name: 'Message Bot',
    url: 'https://api.iconify.design/ri:message-2-fill.svg?color=%23005969',
    type: 'bot',
  },
])

const selectedAvatar = ref('ai_bot')

// Select avatar
const selectAvatar = (avatarId) => {
  selectedAvatar.value = avatarId

  // Update customization object
  const avatar = avatarOptions.value.find((a) => a.id === avatarId)
  if (avatar) {
    customization.avartar = avatar.url
  }
}

// Get current selected avatar
const currentAvatar = computed(() => {
  return avatarOptions.value.find((a) => a.id === selectedAvatar.value) || avatarOptions.value[0]
})

// This is what gets sent to backend
const currentAvatarUrl = computed(() => {
  return customization.avartar || 'https://api.iconify.design/ri:robot-2-fill.svg?color=%23005969'
})
</script>

<template>
  <div class="p-6 bg-white shadow rounded-lg">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <h2 class="text-2xl sm:text-3xl font-semibold">Chatbot Appearance</h2>
      <Filter v-model:website="selectedWebsite" v-model:apikey="selectedApikey" />
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-4">
      <Loading class="w-6 h-6 mx-auto" />
      <p class="text-sm text-gray-500 mt-2">Loading settings...</p>
      <div class="flex justify-center items-center h-60">
        <div
          class="loader w-[40px] p-[3px] aspect-square rounded-full bg-mainColor animate-spin-smooth"
        ></div>
      </div>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-6">
      <!-- Left: Customization Controls -->
      <div class="lg:w-2/5 space-y-6">
        <!-- Avatar Selector -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Chatbot Avatar</h3>

          <!-- Avatar Preview -->
          <div class="mb-4 p-4 border rounded-lg bg-gray-50">
            <div class="flex items-center justify-center mb-2">
              <div class="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow">
                <img
                  :src="currentAvatarUrl"
                  class="w-full h-full object-cover"
                  alt="Selected Avatar"
                />
              </div>
            </div>
            <p class="text-sm text-center text-gray-600">
              {{ currentAvatar.name || 'AI Bot' }}
            </p>
          </div>

          <!-- Fixed: 2 columns on mobile, 3 on tablet+ -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="avatar in avatarOptions"
              :key="avatar.id"
              @click="selectAvatar(avatar.id)"
              class="p-2 border rounded hover:bg-gray-50 transition-colors"
              :class="
                selectedAvatar === avatar.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
              "
            >
              <img :src="avatar.url" class="w-8 h-8 mx-auto rounded" :alt="avatar.name" />
              <div class="text-xs text-center mt-1 truncate">{{ avatar.name }}</div>
            </button>
          </div>
        </div>

        <!-- Color Scheme -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Color Scheme</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <input
                  type="color"
                  v-model="customization.primarycolor"
                  class="w-12 h-12 cursor-pointer rounded border mx-auto sm:mx-0"
                />
                <input
                  type="text"
                  v-model="customization.primarycolor"
                  class="flex-1 px-3 py-2 border rounded-md font-mono text-sm sm:text-base"
                  @change="validateColor"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <input
                  type="color"
                  v-model="customization.secondarycolor"
                  class="w-12 h-12 cursor-pointer rounded border mx-auto sm:mx-0"
                />
                <input
                  type="text"
                  v-model="customization.secondarycolor"
                  class="flex-1 px-3 py-2 border rounded-md font-mono text-sm sm:text-base"
                  @change="validateColor"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Bubble Settings -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Chat Bubble</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Bubble Size</label>
              <input
                type="range"
                v-model="customization.bubblesize"
                min="48"
                max="80"
                class="w-full"
              />
              <div class="text-xs text-gray-500 text-center">{{ customization.bubblesize }}px</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <!-- Fixed: 1 column on mobile, 2 on tablet+ -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  v-for="pos in positions"
                  :key="pos.value"
                  @click="customization.position = pos.value"
                  class="p-3 border rounded-md text-center hover:bg-gray-50"
                  :class="customization.position === pos.value ? 'bg-teal-50 border-teal-200' : ''"
                >
                  <div class="text-lg mb-1">{{ pos.icon }}</div>
                  <div class="text-xs">{{ pos.label }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Window -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Chat Window</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Chat Width</label>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <input
                  type="range"
                  v-model="customization.popupwidth"
                  min="300"
                  max="500"
                  class="flex-1"
                />
                <span class="text-sm font-mono text-center sm:text-left"
                  >{{ customization.popupwidth }}px</span
                >
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Chat Height</label>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <input
                  type="range"
                  v-model="customization.bubblewidth"
                  min="400"
                  max="700"
                  class="flex-1"
                />
                <span class="text-sm font-mono text-center sm:text-left"
                  >{{ customization.bubblewidth }}px</span
                >
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
              <input
                type="range"
                v-model="customization.borderraduis"
                min="0"
                max="24"
                class="w-full"
              />
              <div class="text-xs text-gray-500 text-center">
                {{ customization.borderraduis }}px
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Show Avatar</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="customization.showavartar" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"
                ></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Save/Reset Buttons -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="resetCustomization"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            @click="saveCustomization"
            :disabled="loading"
            class="flex-1 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loading v-if="loading" class="w-4 h-4 inline mr-2" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <!-- Right: Live Preview -->
      <div class="lg:w-3/5">
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-4">Live Preview</h3>

          <div
            class="border rounded-lg bg-gray-50 p-4 min-h-[400px] md:min-h-[500px] relative overflow-hidden"
          >
            <!-- Chat bubble container with responsive positioning -->
            <div
              class="absolute transition-all duration-300 z-10"
              :class="[
                positionClasses[customization.position],
                'sm:scale-100 scale-75', // Scale down more on mobile
              ]"
              style="touch-action: manipulation"
            >
              <!-- Chat Bubble - make it clickable -->
              <div
                @click="showPreviewWindow = !showPreviewWindow"
                class="rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95"
                :style="{
                  width: customization.bubblesize + 'px',
                  height: customization.bubblesize + 'px',
                  backgroundColor: customization.primarycolor,
                }"
              >
                <div class="w-full h-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M2 22V9q0-.825.588-1.413Q3.175 7 4 7h2V4q0-.825.588-1.413Q7.175 2 8 2h12q.825 0 1.413.587Q22 3.175 22 4v8q0 .825-.587 1.412Q20.825 14 20 14h-2v3q0 .825-.587 1.413Q16.825 19 16 19H5Zm6-10h8V9H8Zm-4 5h12v-3H8q-.825 0-1.412-.588Q6 12.825 6 12V9H4Zm14-5h2V4H8v3h8q.825 0 1.413.587Q18 8.175 18 9Z"
                    />
                  </svg>
                </div>
              </div>

              <!-- Chat Window Preview -->
              <div
                v-if="showPreviewWindow"
                class="absolute bottom-full mb-4 right-0 rounded-lg shadow-xl overflow-hidden transition-all duration-300"
                :style="{
                  width: `min(${customization.popupwidth}px, 85vw)`, // Slightly smaller on mobile
                  height: `min(${customization.bubblewidth}px, 50vh)`, // Smaller height on mobile
                  backgroundColor: 'white',
                  borderRadius: customization.borderraduis + 'px',
                  border: `1px solid ${customization.secondarycolor}20`,
                  maxWidth: '100%',
                  zIndex: 20,
                }"
              >
                <!-- Header -->
                <div
                  class="p-3 sm:p-4"
                  :style="{
                    backgroundColor: customization.primarycolor,
                    color: 'white',
                  }"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 sm:gap-3">
                      <div
                        v-if="customization.showavartar"
                        class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                        :style="{ backgroundColor: customization.secondarycolor }"
                      >
                        <img
                          :src="currentAvatarUrl"
                          class="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                          alt="Chatbot Avatar"
                        />
                      </div>
                      <div class="min-w-0">
                        <div class="font-semibold text-sm sm:text-base truncate">ChatBot</div>
                        <div class="text-xs opacity-90">Online • Ready to help</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Messages -->
                <div class="p-3 sm:p-4 flex-1 overflow-hidden h-[calc(100%-120px)]">
                  <div class="space-y-2 sm:space-y-3">
                    <!-- Bot Message -->
                    <div class="flex gap-2">
                      <div
                        v-if="customization.showavartar"
                        class="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                        :style="{ backgroundColor: customization.primarycolor }"
                      >
                        <img
                          :src="currentAvatarUrl"
                          class="w-4 h-4 sm:w-6 sm:h-6 rounded-full object-cover"
                          alt="Bot"
                        />
                      </div>
                      <div
                        class="rounded-2xl px-3 py-2 sm:px-4 sm:py-3 max-w-[75%]"
                        :style="{
                          backgroundColor: customization.secondarycolor + '20',
                          color: '#333',
                        }"
                      >
                        <div class="text-xs sm:text-sm">Hello! How can I help you today?</div>
                      </div>
                    </div>

                    <!-- User Message -->
                    <div class="flex gap-2 justify-end">
                      <div
                        class="rounded-2xl px-3 py-2 sm:px-4 sm:py-3 max-w-[75%]"
                        :style="{
                          backgroundColor: customization.primarycolor,
                          color: 'white',
                        }"
                      >
                        <div class="text-xs sm:text-sm">I need help with my order</div>
                      </div>
                      <div
                        v-if="customization.showavartar"
                        class="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-gray-300"
                      >
                        <div class="text-xs font-bold">U</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Input -->
                <div class="p-2 sm:p-3 border-t">
                  <div class="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      class="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border focus:outline-none focus:ring-2 text-xs sm:text-sm"
                      :style="{
                        borderColor: customization.secondarycolor + '50',
                        '--tw-ring-color': customization.primarycolor + '30',
                      }"
                    />
                    <button
                      class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                      :style="{ backgroundColor: customization.primarycolor }"
                    >
                      <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mobile Controls (simplified) -->
            <div class="absolute bottom-4 left-0 right-0 px-4">
              <div class="flex flex-col gap-2">
                <!-- Toggle button - simplified -->
                <button
                  @click="showPreviewWindow = !showPreviewWindow"
                  class="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium transition-colors mx-auto sm:mx-0"
                >
                  {{ showPreviewWindow ? 'Hide Chat Window' : 'Show Chat Window' }}
                </button>

                <!-- Simple mobile hint - only show when needed -->
                <div v-if="!showPreviewWindow" class="sm:hidden text-center">
                  <p class="text-xs text-gray-500">Tap the bubble or button above to preview</p>
                </div>

                <!-- Close hint - only show when window is open -->
                <div v-if="showPreviewWindow" class="sm:hidden text-center">
                  <p class="text-xs text-gray-500">Tap the bubble again to close</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Range input styling */
input[type='range'] {
  -webkit-appearance: none;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #10b981;
  border-radius: 50%;
  cursor: pointer;
}
</style>
