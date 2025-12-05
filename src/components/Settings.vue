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
  avartar: 'https://cdn-icons-png.flaticon.com/512/2933/2933245.png',
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
      if (response.status === 200 && response.data.settings) {
        console.log('Settings found:', response.data.settings)
        Object.assign(customization, {
          primarycolor: response.data.settings.primarycolor || '#10b981',
          secondarycolor: response.data.settings.secondarycolor || '#059669',
          bubblesize: response.data.settings.bubblesize || 64,
          position: response.data.settings.position || 'bottom-right',
          popupwidth: response.data.settings.popupwidth || 400,
          bubblewidth: response.data.settings.bubblewidth || 600,
          borderraduis: response.data.settings.borderraduis || 16,
          showavartar: response.data.settings.avartar || true,
          avartar:
            response.data.settings.avartar ||
            'https://cdn-icons-png.flaticon.com/512/2933/2933245.png',
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
  { immediate: true },
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
  if (!hexRegex.test(customization.textColor)) {
    customization.textColor = '#ffffff'
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
    avartar: 'https://cdn-icons-png.flaticon.com/512/2933/2933245.png',
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
  // BOT AVATARS
  {
    id: 'ai_bot',
    name: 'AI Bot',
    url: 'https://cdn-icons-png.flaticon.com/512/2933/2933245.png',
    type: 'bot',
  },
  {
    id: 'robot1',
    name: 'Robot 1',
    url: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    type: 'bot',
  },
  {
    id: 'robot2',
    name: 'Robot 2',
    url: 'https://cdn-icons-png.flaticon.com/512/4712/4712029.png',
    type: 'bot',
  },
  {
    id: 'bot_blue',
    name: 'Blue Bot',
    url: 'https://cdn-icons-png.flaticon.com/512/2204/2204714.png',
    type: 'bot',
  },
  {
    id: 'bot_purple',
    name: 'Purple Bot',
    url: 'https://cdn-icons-png.flaticon.com/512/4712/4712009.png',
    type: 'bot',
  },
  {
    id: 'bot_green',
    name: 'Green Bot',
    url: 'https://cdn-icons-png.flaticon.com/512/4712/4712026.png',
    type: 'bot',
  },

  // HUMAN AVATARS
  {
    id: 'agent_male',
    name: 'Male Agent',
    url: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
    type: 'human',
  },
  {
    id: 'agent_female',
    name: 'Female Agent',
    url: 'https://cdn-icons-png.flaticon.com/512/4323/4323003.png',
    type: 'human',
  },
  {
    id: 'support_male',
    name: 'Support Guy',
    url: 'https://cdn-icons-png.flaticon.com/512/4333/4333615.png',
    type: 'human',
  },
  {
    id: 'support_female',
    name: 'Support Girl',
    url: 'https://cdn-icons-png.flaticon.com/512/4323/4323004.png',
    type: 'human',
  },
  {
    id: 'business_man',
    name: 'Business Man',
    url: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
    type: 'human',
  },
  {
    id: 'business_woman',
    name: 'Business Woman',
    url: 'https://cdn-icons-png.flaticon.com/512/4140/4140051.png',
    type: 'human',
  },
  {
    id: 'tech_support',
    name: 'Tech Support',
    url: 'https://cdn-icons-png.flaticon.com/512/4333/4333607.png',
    type: 'human',
  },
  {
    id: 'customer_service',
    name: 'Customer Service',
    url: 'https://cdn-icons-png.flaticon.com/512/4333/4333608.png',
    type: 'human',
  },
  {
    id: 'assistant',
    name: 'Assistant',
    url: 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png',
    type: 'human',
  },
  {
    id: 'friendly_bot',
    name: 'Friendly Bot',
    url: 'https://cdn-icons-png.flaticon.com/512/2593/2593788.png',
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
  return customization.avartar || 'https://cdn-icons-png.flaticon.com/512/2933/2933245.png'
})
</script>

<template>
  <div class="p-6 bg-white shadow rounded-lg">
    <div class="flex flex-row justify-between items-center">
      <h2 class="text-3xl font-semibold mb-6">Chatbot Appearance</h2>
      <Filter v-model:website="selectedWebsite" v-model:apikey="selectedApikey" />
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-4">
      <Loading class="w-6 h-6 mx-auto" />
      <p class="text-sm text-gray-500 mt-2">Loading settings...</p>
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

          <!-- Avatar Options -->
          <div class="grid grid-cols-3 gap-2">
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
              <div class="flex items-center gap-4">
                <input
                  type="color"
                  v-model="customization.primarycolor"
                  class="w-12 h-12 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  v-model="customization.primarycolor"
                  class="flex-1 px-3 py-2 border rounded-md font-mono"
                  @change="validateColor"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div class="flex items-center gap-4">
                <input
                  type="color"
                  v-model="customization.secondarycolor"
                  class="w-12 h-12 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  v-model="customization.secondarycolor"
                  class="flex-1 px-3 py-2 border rounded-md font-mono"
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
              <div class="grid grid-cols-2 gap-2">
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
              <div class="flex items-center gap-4">
                <input
                  type="range"
                  v-model="customization.popupwidth"
                  min="300"
                  max="500"
                  class="flex-1"
                />
                <span class="text-sm font-mono">{{ customization.popupwidth }}px</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Chat Height</label>
              <div class="flex items-center gap-4">
                <input
                  type="range"
                  v-model="customization.bubblewidth"
                  min="400"
                  max="700"
                  class="flex-1"
                />
                <span class="text-sm font-mono">{{ customization.bubblewidth }}px</span>
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
        <div class="flex gap-3">
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
            <Loading v-if="loading" class="w-4 h-4" />
            <span v-if="!loading">Save Changes</span>
          </button>
        </div>
      </div>

      <!-- Right: Live Preview -->
      <div class="lg:w-3/5">
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-4">Live Preview</h3>

          <div class="border rounded-lg bg-gray-50 p-4 min-h-[500px] relative">
            <div class="bg-white rounded p-4 mb-4 shadow-sm">
              <p>Welcome to your chat</p>
            </div>
            <div
              class="absolute transition-all duration-300"
              :class="positionClasses[customization.position]"
            >
              <!-- Chat Bubble -->
              <div
                class="rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105"
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
                  width: customization.popupwidth + 'px',
                  height: customization.bubblewidth + 'px',
                  backgroundColor: 'white',
                  borderRadius: customization.borderraduis + 'px',
                  border: `1px solid ${customization.secondarycolor}20`,
                }"
              >
                <!-- Header -->
                <div
                  class="p-4"
                  :style="{
                    backgroundColor: customization.primarycolor,
                    color: 'white',
                  }"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div
                        v-if="customization.showavartar"
                        class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                        :style="{ backgroundColor: customization.secondarycolor }"
                      >
                        <img
                          :src="currentAvatarUrl"
                          class="w-8 h-8 rounded-full object-cover"
                          alt="Chatbot Avatar"
                        />
                      </div>
                      <div>
                        <div class="font-semibold">ChatBot</div>
                        <div class="text-sm opacity-90">Online • Ready to help</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Messages -->
                <div class="p-4 flex-1 overflow-hidden h-[calc(100%-140px)]">
                  <div class="space-y-3">
                    <!-- Bot Message -->
                    <div class="flex gap-2">
                      <div
                        v-if="customization.showavartar"
                        class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                        :style="{ backgroundColor: customization.primarycolor }"
                      >
                        <img
                          :src="currentAvatarUrl"
                          class="w-6 h-6 rounded-full object-cover"
                          alt="Bot"
                        />
                      </div>
                      <div
                        class="rounded-2xl px-4 py-3 max-w-[80%]"
                        :style="{
                          backgroundColor: customization.secondarycolor + '20',
                          color: '#333',
                        }"
                      >
                        <div class="text-sm">Hello! How can I help you today?</div>
                      </div>
                    </div>

                    <!-- User Message -->
                    <div class="flex gap-2 justify-end">
                      <div
                        class="rounded-2xl px-4 py-3 max-w-[80%]"
                        :style="{
                          backgroundColor: customization.primarycolor,
                          color: 'white',
                        }"
                      >
                        <div class="text-sm">I need help with my order</div>
                      </div>
                      <div
                        v-if="customization.showavartar"
                        class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-gray-300"
                      >
                        <div class="text-xs font-bold">U</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Input -->
                <div class="p-3 border-t">
                  <div class="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      class="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2"
                      :style="{
                        borderColor: customization.secondarycolor + '50',
                        '--tw-ring-color': customization.primarycolor + '30',
                      }"
                    />
                    <button
                      class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      :style="{ backgroundColor: customization.primarycolor }"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Toggle Preview Button -->
            <div class="absolute bottom-4 left-4">
              <button
                @click="showPreviewWindow = !showPreviewWindow"
                class="px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 text-sm"
              >
                {{ showPreviewWindow ? 'Hide Chat Window' : 'Show Chat Window' }}
              </button>
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
