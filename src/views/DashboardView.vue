<script setup>
import { ref } from 'vue'
import TopHeading from '@/components/TopHeading.vue'
import SideNavBar from '@/components/SideNavBar.vue'

const isExpanded = ref(false)
</script>

<template>
  <div class="flex min-h-[100dvh]">
    <SideNavBar v-model:isExpanded="isExpanded" />

    <div
      :class="[
        'flex-1 flex flex-col transition-all duration-300 bg-gray-100',
        isExpanded ? 'ml-64' : 'ml-20',
      ]"
    >
      <div class="m-3 space-y-5">
        <TopHeading />
        <RouterView />
      </div>
    </div>
  </div>
</template>
