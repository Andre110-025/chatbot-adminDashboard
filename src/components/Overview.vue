<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import { Chart, registerables } from 'chart.js'
import Illustration from './Icons/Illustration.vue'
import MiniChat from './Icons/miniChat.vue'
import { toast } from 'vue3-toastify'
import NoUserFound from './Icons/NoUserFound.vue'
import NoMessageFound from './Icons/NoMessageFound.vue'
import NoActiveUser from './Icons/NoActiveUser.vue'
import EmptyNoMessage from './Icons/EmptyNoMessage.vue'
import NoMostActive from './Icons/NoMostActive.vue'
import { useAdminStore } from '@/stores/user'
import Filter from './Filter.vue'
import UserIcon from './Icons/UserIcon.vue'
import Message from './Icons/message.vue'
import ActiveUser from './Icons/ActiveUser.vue'
import { RouterLink } from 'vue-router'

Chart.register(...registerables)

const adminStore = useAdminStore()
const allChats = ref({})
const allMessages = ref([])
const userChartRef = ref(null)
const messageChartRef = ref(null)
const selectedWebsite = ref(null)
const selectedRequest = ref(null)
const smallChartRef = ref(null)
const loading = ref(false)
let userChart = null
let messageChart = null

// console.log(adminStore.userInfo.userId)
// const userId = computed(() => adminStore.userInfo.userId)
// console.log(userId.value)

// const getAllChats = async () => {
//   try {
//     loading.value = true
//     await new Promise((resolve) => setTimeout(resolve, 3000))
//     const response = await axios.get('http://localhost:3000/api/chats')
//     allChats.value = response.data
//   } catch (error) {
//     console.error(error)
//     toast.info('Unable to get messages, try again')
//   } finally {
//     loading.value = false
//   }
// }

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

const totalMessageCount = computed(() =>
  allChats.value.reduce((sum, chat) => sum + (chat.message_count || 0), 0),
)

const getMessages = async (sessionId) => {
  if (!sessionId) {
    allMessages.value = []
    return
  }

  try {
    const response = await axios.get(`/chat/admin/session/${sessionId}`, {
      params: { website: selectedWebsite.value },
    })
    console.log(response)

    allMessages.value = response.data.data.messages
  } catch (err) {
    console.error('Failed to load messages:', err.response?.data || err)
    toast.warning(err.response?.data?.error || 'Could to load messages, try again')
  }
}

watch(selectedRequest, (newVal) => {
  if (newVal) {
    getMessages(newVal.session_id)
  }
})

const renderUserChart = () => {
  const totalUsers = allChats.value.length
  const totalMessages = totalMessageCount.value

  if (userChart) userChart.destroy()

  userChart = new Chart(userChartRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Users', 'Message'],
      datasets: [
        {
          data: [totalUsers, totalMessages],
          backgroundColor: ['#14b8a6', '#FF8A65'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: { enabled: true },
      },
    },
  })
}
// watch(
//   [allChats, () => totalMessageCount], // watch chats and message count
//   () => {
//     renderUserChart() // re-render chart whenever values change
//   },
//   { deep: true },
// )

const getTopTopic = computed(() => {
  const wordCount = {}
  const allMessages = Object.values(allChats.value)
    .flat()
    .map((m) => m.text)

  allMessages.forEach((text) => {
    if (!text) return
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .forEach((word) => {
        if (word.length < 3) return
        wordCount[word] = (wordCount[word] || 0) + 1
      })
  })

  const sorted = Object.entries(wordCount).sort((a, b) => b[1] - a[1])
  const [topWord, topCount] = sorted[0] || ['N/A', 0]
  const totalWords = allMessages.join(' ').split(/\s+/).length || 1
  const percent = Math.round((topCount / totalWords) * 100)

  return { word: topWord, percent }
})

watch(allChats, () => {
  if (Object.keys(allChats.value).length) renderUserChart()
})

const firstName = adminStore.userInfo.full_name
watch(selectedWebsite, (val) => {
  getAllUser(val)
})

onMounted(() => {
  if (selectedWebsite.value) {
    getAllUser(selectedWebsite.value)
  }
})
// onMounted(getAllChats)
</script>

<template>
  <main class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
    <div class="flex flex-col lg:flex-row gap-6 w-full">
      <div
        class="w-full mx-auto flex flex-col min-[1024px]:flex-row items-center bg-white shadow-sm rounded-lg p-6 gap-6"
      >
        <div class="flex flex-col flex-1 gap-3 text-center min-[1024px]:text-left">
          <h2 class="text-xl text-mainColor font-semibold">Welcome Back, {{ firstName }} 🎉</h2>

          <p class="text-sm text-gray-600 leading-relaxed">
            Your platform is running smoothly today.<br />
            Check key stats to stay on top of performance.
          </p>

          <div class="flex justify-center min-[1024px]:justify-start">
            <RouterLink
              :to="{ name: 'chatreview' }"
              class="mt-2 w-[120px] px-4 py-2 bg-mainColor text-white rounded-lg shadow-sm hover:bg-teal-700 transition"
            >
              View Chat
            </RouterLink>
          </div>
        </div>

        <div class="flex justify-center min-[1024px]:justify-end">
          <div class="max-w-[160px] xl:max-w-[200px]">
            <Illustration />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
        <div
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition animate-fadeUp w-full"
        >
          <div v-if="loading" class="flex justify-center items-center h-[139px]">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>

          <div v-else-if="Object.keys(allChats).length" class="animate-fadeUp">
            <div class="relative bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div
                class="absolute top-3 right-3 w-8 h-8 bg-blue-50 text-blue-500 flex items-center justify-center rounded-lg"
              >
                <UserIcon />
              </div>

              <p class="text-gray-500 text-sm mb-1">Total Users</p>
              <div class="mt-3 h-[1px] bg-gray-100 w-full"></div>

              <h2 class="text-2xl font-bold text-gray-800">
                {{ Object.keys(allChats).length }}
              </h2>

              <p class="text-xs text-gray-400 mt-2">Across all sources</p>
            </div>
          </div>

          <div v-else>
            <NoUserFound />
          </div>
        </div>

        <div
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition w-full"
        >
          <div v-if="loading" class="flex justify-center items-center h-[139px]">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>

          <div v-else-if="Object.values(allMessages).flat().length" class="animate-fadeUp">
            <div class="relative bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div
                class="absolute top-3 right-3 w-8 h-8 bg-blue-50 text-blue-500 flex items-center justify-center rounded-lg"
              >
                <Message />
              </div>

              <p class="text-gray-500 text-sm mb-1">Total Messages</p>
              <div class="mt-3 h-[1px] bg-gray-100 w-full"></div>

              <h2 class="text-2xl font-bold text-gray-800">
                {{ totalMessageCount }}
              </h2>

              <p class="text-xs text-gray-400 mt-2">Across all sources</p>
            </div>
          </div>

          <div v-else>
            <NoMessageFound />
          </div>
        </div>
      </div>
    </div>

    <div class="w-full flex items-center justify-end mt-2 mb-1">
      <div class="flex items-center gap-3">
        <Filter v-model:website="selectedWebsite" />
      </div>
    </div>

    <section class="w-full mt-4 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-800">User Activity</h2>

            <button
              @click="getAllUser"
              class="text-sm bg-mainColor text-white px-3 py-1 rounded-lg hover:bg-teal-700 transition"
            >
              Refresh
            </button>
          </div>

          <div class="flex justify-center items-center h-[250px]">
            <canvas ref="userChartRef" class="max-w-[250px]"></canvas>
          </div>
        </div>

        <!-- RECENT CONVERSATIONS -->
        <div
          class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div v-if="loading" class="flex justify-center items-center h-40">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>

          <div v-else-if="allMessages">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">Recent Conversations</h2>

            <div class="space-y-4 max-h-[260px] overflow-y-auto">
              <div
                v-for="(recent, index) in allMessages.slice(0, 3)"
                :key="index"
                class="border-b border-gray-100 pb-3 last:border-0"
              >
                <div class="flex justify-between items-center">
                  <h3 class="font-medium text-gray-700">User: {{ recent.id }}</h3>

                  <span class="text-xs text-gray-400"> {{ recent.message.length }} msgs </span>
                </div>

                <p class="text-sm text-mainColor truncate mt-1">
                  {{ recent.message }}
                </p>
              </div>
            </div>
          </div>

          <div v-else>
            <EmptyNoMessage />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
