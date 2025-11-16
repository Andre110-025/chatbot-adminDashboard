<script setup>
import { ref, watch } from 'vue'
import Chat from './Icons/Chat.vue'
import Dashboard from './Icons/Dashboard.vue'
import Profile from './Icons/Profile.vue'
import Resquest from './Icons/Resquest.vue'
import Settings from './Icons/Settings.vue'
import Domain from './Icons/Domain.vue'

const props = defineProps({
  isExpanded: Boolean,
})
const emit = defineEmits(['update:isExpanded'])

const expanded = ref(props.isExpanded)

watch(expanded, (val) => emit('update:isExpanded', val))
</script>

<template>
<aside
  @mouseenter="expanded = true"
  @mouseleave="expanded = false"
  :class="[
    'hidden sm:fixed bottom-0 left-0 top-0 z-50 overflow-y-auto overflow-x-hidden bg-mainColor py-5 px-5 lg:flex flex-col transition-all duration-300',
    expanded ? 'w-64' : 'w-[85px]',
  ]"
>
  <div class="flex-1 space-y-3 overflow-y-auto">
    <RouterLink :to="{ name: 'overview' }" class="dashBgNav">
      <Dashboard />
      <span v-show="expanded" class="sidebar-text">Overview</span>
    </RouterLink>

    <RouterLink :to="{ name: 'request' }" class="dashBgNav">
      <Resquest />
      <span v-show="expanded" class="sidebar-text">Request</span>
    </RouterLink>

    <RouterLink :to="{ name: 'chatreview' }" class="dashBgNav">
      <Chat />
      <span v-show="expanded" class="sidebar-text">Chat Review</span>
    </RouterLink>

    <RouterLink :to="{ name: 'addDomain' }" class="dashBgNav">
      <Domain />
      <span v-show="expanded" class="sidebar-text">Add Domain</span>
    </RouterLink>

    <RouterLink :to="{ name: 'settings' }" class="dashBgNav mb-2.5">
      <Settings />
      <span v-show="expanded" class="sidebar-text">Settings</span>
    </RouterLink>
  </div>

  <div class="divide-y divide-gray-600">
    <RouterLink :to="{ name: 'profile' }" class="dashBgNav">
      <Profile />
      <span v-show="expanded" class="sidebar-text">Profile</span>
    </RouterLink>
  </div>
</aside>

<!-- MOBILE NAV -->
<div class="sm:hidden fixed bottom-0 left-0 w-full bg-mainColor 
            flex justify-around items-center py-3 z-50">
  
  <RouterLink :to="{ name: 'overview' }" class="flex flex-col items-center">
    <Dashboard class="w-6 h-6" />
  </RouterLink>

  <RouterLink :to="{ name: 'request' }" class="flex flex-col items-center">
    <Resquest class="w-6 h-6" />
  </RouterLink>

  <RouterLink :to="{ name: 'chatreview' }" class="flex flex-col items-center">
    <Chat class="w-6 h-6" />
  </RouterLink>

  <RouterLink :to="{ name: 'addDomain' }" class="flex flex-col items-center">
    <Domain class="w-6 h-6" />
  </RouterLink>

  <RouterLink :to="{ name: 'settings' }" class="flex flex-col items-center">
    <Settings class="w-6 h-6" />
  </RouterLink>

  <RouterLink :to="{ name: 'profile' }" class="flex flex-col items-center">
    <Profile class="w-6 h-6" />
  </RouterLink>
</div>

</template>
