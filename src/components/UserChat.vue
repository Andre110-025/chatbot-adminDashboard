<script setup></script>

<template>
  <div class="flex flex-col md:flex-row h-auto md:h-[550px] gap-4">
    <nav
      class="w-full md:w-[270px] bg-white shadow rounded-lg md:ml-1 overflow-y-auto p-5 flex flex-col"
    >
      <p>All users</p>
    </nav>
    <section class="flex-1 px-4 py-4 bg-white h-full shadow rounded-lg">
      <div class="flex flex-row justify-between items-center">
        <div class="text-2xl text-gray-800 flex flex-col">
          <span>User Chat</span>
          <p class="text-gray-800 text-[15px] mt-[-5px]">
            Admin can respond to all unanswered chat from user
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
