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

const navItems = [
  { name: 'overview', icon: Dashboard, label: 'Overview' },
  { name: 'request', icon: Resquest, label: 'Request' },
  { name: 'chatreview', icon: Chat, label: 'Chat' },
  { name: 'addDomain', icon: Domain, label: 'Domain' },
  { name: 'settings', icon: Settings, label: 'Settings' },
  { name: 'profile', icon: Profile, label: 'Profile' },
]
</script>

<template>
  <aside
    @mouseenter="expanded = true"
    @mouseleave="expanded = false"
    :class="[
      'hidden sm:block sm:fixed inset-y-0 left-0 z-50',
      'overflow-y-auto overflow-x-hidden bg-mainColor py-5 px-5',
      'transition-all duration-300',
      expanded ? 'w-64' : 'w-[85px]',
      'lg:flex lg:flex-col',
    ]"
  >
    <div class="flex-1 space-y-3 overflow-y-auto">
      <RouterLink :to="{ name: 'overview' }" class="dashBgNav flex items-center">
        <Dashboard class="flex-shrink-0 w-6 h-6" />
        <span v-show="expanded" class="sidebar-text ml-3">Overview</span>
      </RouterLink>

      <RouterLink :to="{ name: 'request' }" class="dashBgNav flex items-center">
        <Resquest class="flex-shrink-0 w-6 h-6" />
        <span v-show="expanded" class="sidebar-text ml-3">Knowledge base</span>
      </RouterLink>

      <RouterLink :to="{ name: 'chatreview' }" class="dashBgNav flex items-center">
        <Chat class="flex-shrink-0 w-6 h-6" />
        <span v-show="expanded" class="sidebar-text ml-3">Chat Review</span>
      </RouterLink>

      <RouterLink :to="{ name: 'addDomain' }" class="dashBgNav flex items-center">
        <Domain class="flex-shrink-0 w-6 h-6" />
        <span v-show="expanded" class="sidebar-text ml-3">Manage Domain</span>
      </RouterLink>

      <RouterLink :to="{ name: 'settings' }" class="dashBgNav mb-2.5 flex items-center">
        <Settings class="flex-shrink-0 w-6 h-6" />
        <span v-show="expanded" class="sidebar-text ml-3">Settings</span>
      </RouterLink>
    </div>

    <div class="lg:mt-auto divide-y divide-gray-600">
      <RouterLink :to="{ name: 'profile' }" class="dashBgNav flex items-center">
        <Profile class="flex-shrink-0 w-6 h-6" />
        <span v-show="expanded" class="sidebar-text ml-3">Profile</span>
      </RouterLink>
    </div>
  </aside>

  <div
    class="sm:hidden fixed bottom-0 left-0 w-full bg-mainColor flex justify-around items-center py-3 z-50"
  >
    <RouterLink
      :to="{ name: 'overview' }"
      class="flex flex-col items-center transition-transform duration-200 hover:scale-110 group"
      :class="$route.name === 'overview' ? 'text-emerald-500 scale-110' : 'text-white'"
    >
      <Dashboard class="w-6 h-6 group-hover:text-emerald-400 transition-colors duration-200" />
    </RouterLink>

    <RouterLink
      :to="{ name: 'request' }"
      class="flex flex-col items-center transition-transform duration-200 hover:scale-110 group"
      :class="$route.name === 'request' ? 'text-emerald-200 scale-110' : 'text-white'"
    >
      <Resquest class="w-6 h-6 group-hover:text-emerald-400 transition-colors duration-200" />
    </RouterLink>

    <RouterLink
      :to="{ name: 'chatreview' }"
      class="flex flex-col items-center transition-transform duration-200 hover:scale-110 group"
      :class="$route.name === 'chatreview' ? 'text-emerald-200 scale-110' : 'text-white'"
    >
      <Chat class="w-6 h-6 group-hover:text-emerald-400 transition-colors duration-200" />
    </RouterLink>

    <RouterLink
      :to="{ name: 'addDomain' }"
      class="flex flex-col items-center transition-transform duration-200 hover:scale-110 group"
      :class="$route.name === 'addDomain' ? 'text-emerald-200 scale-110' : 'text-white'"
    >
      <Domain class="w-6 h-6 group-hover:text-emerald-400 transition-colors duration-200" />
    </RouterLink>

    <RouterLink
      :to="{ name: 'settings' }"
      class="flex flex-col items-center transition-transform duration-200 hover:scale-110 group"
      :class="$route.name === 'settings' ? 'text-emerald-200 scale-110' : 'text-white'"
    >
      <Settings class="w-6 h-6 group-hover:text-emerald-400 transition-colors duration-200" />
    </RouterLink>

    <RouterLink
      :to="{ name: 'profile' }"
      class="flex flex-col items-center transition-transform duration-200 hover:scale-110 group"
      :class="$route.name === 'profile' ? 'text-emerald-200 scale-110' : 'text-white'"
    >
      <Profile class="w-6 h-6 group-hover:text-emerald-400 transition-colors duration-200" />
    </RouterLink>
  </div>
</template>
