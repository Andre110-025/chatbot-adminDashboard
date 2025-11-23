<script setup>
// dummy data for now
const users = [
  { id: 1, name: 'John Doe', lastMessage: 'Hello admin…' },
  { id: 2, name: 'Sarah James', lastMessage: 'How do I reset…' },
  { id: 3, name: 'Michael', lastMessage: 'Thanks!' },
]

const messages = [
  { sender: 'user', text: 'Hey admin, I need help' },
  { sender: 'admin', text: 'Sure, what’s the issue?' },
  { sender: 'user', text: 'My API key is not working' },
]
</script>

<template>
  <div class="flex flex-col md:flex-row h-auto md:h-[550px] gap-4">
    <!-- LEFT SIDEBAR -->
    <nav class="w-full md:w-[270px] bg-white shadow rounded-lg overflow-y-auto p-4 flex flex-col">
      <p class="text-xl font-semibold mb-3 text-gray-700">All Users</p>

      <div
        v-for="user in users"
        :key="user.id"
        class="p-3 rounded-lg hover:bg-gray-100 cursor-pointer border-b"
      >
        <p class="font-medium text-gray-800">{{ user.name }}</p>
        <p class="text-sm text-gray-500 truncate">{{ user.lastMessage }}</p>
      </div>
    </nav>

    <!-- CHAT PANEL -->
    <section class="flex-1 bg-white shadow rounded-lg flex flex-col">
      <!-- TOP HEADER -->
      <div class="p-4 border-b flex items-center justify-between">
        <div>
          <p class="text-lg font-semibold text-gray-800">John Doe</p>
          <p class="text-sm text-gray-500 mt-[-3px]">Active now</p>
        </div>
      </div>

      <!-- CHAT MESSAGES -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="flex"
          :class="msg.sender === 'admin' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[70%] p-3 rounded-xl text-sm"
            :class="
              msg.sender === 'admin'
                ? 'bg-teal-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 shadow rounded-bl-none'
            "
          >
            {{ msg.text }}
          </div>
        </div>
      </div>

      <!-- INPUT BAR -->
      <div class="p-3 border-t flex gap-2">
        <input
          type="text"
          placeholder="Type a message"
          class="flex-1 p-3 border rounded-lg focus:outline-none"
        />
        <button class="bg-teal-600 text-white px-4 rounded-lg">Send</button>
      </div>
    </section>
  </div>
</template>
