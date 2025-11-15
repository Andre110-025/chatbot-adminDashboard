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

Chart.register(...registerables)

const adminStore = useAdminStore()
const allChats = ref({})
const userChartRef = ref(null)
const smallChartRef = ref(null)
const loading = ref(false)
let userChart = null
let smallChart = null

const getAllChats = async () => {
  try {
    loading.value = true
    await new Promise((resolve) => setTimeout(resolve, 3000))
    const response = await axios.get('http://localhost:3000/api/chats')
    allChats.value = response.data
  } catch (error) {
    console.error(error)
    toast.info('Unable to get messages, try again')
  } finally {
    loading.value = false
  }
}

const renderUserChart = () => {
  const userCount = Object.keys(allChats.value).length
  const activeUsers = Object.values(allChats.value).filter((msgs) => msgs.length > 0).length

  if (userChart) userChart.destroy()

  userChart = new Chart(userChartRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Inactive'],
      datasets: [
        {
          data: [activeUsers, userCount - activeUsers],
          backgroundColor: ['#14b8a6', '#e5e7eb'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '70%',
    },
  })
}

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

onMounted(getAllChats)
</script>

<template>
  <main class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
    <div class="flex flex-wrap lg:flex-nowrap gap-6 w-full">
      <div
        class="flex flex-row items-center flex-1 min-w-[300px] h-[190px] shadow-sm bg-white rounded-lg overflow-hidden"
      >
        <div class="flex flex-col p-6 flex-1 gap-3">
          <h2 class="text-lg text-mainColor font-semibold">Welcome Back, {{ firstName }} 🎉</h2>
          <p class="text-sm text-gray-600 leading-relaxed">
            Your platform is running smoothly today.<br />
            Check key stats to stay on top of performance.
          </p>
          <button
            class="w-[160px] px-4 py-2 bg-mainColor text-white rounded-lg shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
          >
            View Chat
          </button>
        </div>
        <div class="ml-auto h-full flex items-end">
          <Illustration />
        </div>
      </div>

      <div class="flex flex-row flex-wrap justify-between gap-5 min-w-[350px]">
        <div
          class="flex flex-col justify-center items-center w-[185px] h-[190px] bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border border-gray-100 p-5 text-center relative overflow-hidden"
        >
          <div
            class="w-10 h-10 flex items-center justify-center rounded-full bg-teal-100 text-teal-600 mb-2 shadow-sm"
          >
            <MiniChat class="w-5 h-5" />
          </div>

          <h2 class="text-base font-semibold text-gray-700 mb-1 tracking-wide">Top Topic</h2>

          <h3 class="text-lg font-bold text-gray-800 capitalize">
            "{{ getTopTopic.word || 'N/A' }}"
          </h3>

          <p class="text-sm text-gray-500 mt-2">
            <span class="font-semibold text-teal-600"> {{ getTopTopic.percent || 0 }}% </span>
            of chats
          </p>
        </div>

        <div
          class="flex flex-col justify-center items-center w-[165px] h-[190px] bg-white shadow-sm rounded-lg p-5 text-center border border-gray-100 hover:shadow-md transition"
        >
          <h2 class="text-lg font-semibold text-gray-700 mb-2">Coming Soon</h2>
          <p class="text-xs text-gray-400">Additional insight will appear here</p>
        </div>
      </div>
    </div>

    <section class="w-full mt-4 space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition animate-fadeUp"
        >
          <div v-if="loading" class="flex justify-center items-center h-40">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>

          <div v-else-if="Object.keys(allChats).length">
            <p class="text-gray-500 text-sm mb-1">Total Users</p>
            <h2 class="text-2xl font-bold text-gray-800">
              {{ Object.keys(allChats).length }}
            </h2>
          </div>

          <div v-else>
            <NoUserFound />
          </div>
        </div>

        <div
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div v-if="loading" class="flex justify-center items-center h-40">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>
          <div v-else-if="Object.values(allChats).flat().length">
            <p class="text-gray-500 text-sm mb-1">Total Messages</p>
            <h2 class="text-2xl font-bold text-gray-800">
              {{ Object.values(allChats).flat().length }}
            </h2>
          </div>
          <div v-else>
            <NoMessageFound />
          </div>
        </div>

        <div
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div v-if="loading" class="flex justify-center items-center h-40">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>
          <div v-else-if="Object.values(allChats).filter((chats) => chats.length > 0).length">
            <p class="text-gray-500 text-sm mb-1">Active Users</p>
            <h2 class="text-2xl font-bold text-emerald-600">
              {{ Object.values(allChats).filter((chats) => chats.length > 0).length }}
            </h2>
          </div>
          <div v-else>
            <NoActiveUser />
          </div>
        </div>

        <div
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div v-if="loading" class="flex justify-center items-center h-40">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>

          <div
            v-else-if="Object.entries(allChats).sort((a, b) => b[1].length - a[1].length)[0]?.[0]"
          >
            <p class="text-gray-500 text-sm mb-1">Most Active User</p>
            <h2 class="text-lg font-semibold text-gray-700 truncate">
              {{
                Object.entries(allChats).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'N/A'
              }}
            </h2>
          </div>
          <div v-else>
            <NoMostActive />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-800">User Activity</h2>
            <button
              @click="getAllChats"
              class="text-sm bg-mainColor text-white px-3 py-1 rounded-lg hover:bg-teal-700 transition"
            >
              Refresh
            </button>
          </div>

          <div class="flex justify-center items-center h-[250px]">
            <canvas ref="userChartRef" class="max-w-[250px]"></canvas>
          </div>
        </div>

        <div
          class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div v-if="loading" class="flex justify-center items-center h-40">
            <div
              class="loader w-[40px] p-2 aspect-square rounded-full bg-mainColor animate-spin-smooth"
            ></div>
          </div>

          <div v-else-if="messages">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">Recent Conversations</h2>

            <div class="space-y-4 max-h-[260px] overflow-y-auto">
              <div
                v-for="([userId, messages], index) in Object.entries(allChats).slice(0, 3)"
                :key="index"
                class="border-b border-gray-100 pb-3 last:border-0"
              >
                <div class="flex justify-between items-center">
                  <h3 class="font-medium text-gray-700">{{ userId }}</h3>
                  <span class="text-xs text-gray-400">{{ messages.length }} msgs</span>
                </div>
                <p class="text-sm text-gray-500 truncate mt-1">
                  {{ messages[messages.length - 1]?.text || 'No messages yet' }}
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
