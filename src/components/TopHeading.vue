<script setup>
import Filter from './Filter.vue'
import Notification from './Icons/Notification.vue'
import Search from './Icons/Search.vue'
import Logo from './Logo.vue'
</script>

<template>
  <header
    class="h-[60px] flex flex-row justify-between items-center px-5 shadow bg-white rounded-lg"
  >
    <Logo class="w-[155px] h-[45px]" />
    <div class="flex flex-row items-center">
      <!-- <Filter /> -->
      <Notification class="text-mainColor w-6 h-6" />
    </div>
  </header>
</template>
