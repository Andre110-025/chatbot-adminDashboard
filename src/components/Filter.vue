<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

const emit = defineEmits(['update:selected'])

const allProducts = ref([])
const selected = ref('')
const showOptions = ref(false)
const selectedProductId = ref(null)

// toggle dropdown
const toggleDropdown = () => (showOptions.value = !showOptions.value)
const select = (product) => {
  selected.value = product.business_name
  selectedProductId.value = product.id
  showOptions.value = false

  // emit to parent
  emit('update:selected', product.id)
}

// click outside
const target = ref(null)
const handleClickOutside = (e) => {
  if (target.value && !target.value.contains(e.target)) showOptions.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  getAllProducts()
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

// fetch products
// fetch products
const getAllProducts = async () => {
  try {
    const res = await axios.get('https://assitance.storehive.com.ng/public/api/getproduct')
    allProducts.value = res.data['all websites']

    // automatically select first product if available
    if (allProducts.value.length > 0) {
      const firstProduct = allProducts.value[0]
      selected.value = firstProduct.business_name
      selectedProductId.value = firstProduct.id

      // emit to parent if needed
      emit('update:selected', firstProduct.id)
    }
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div ref="target" class="relative w-60">
    <!-- Button -->
    <div
      @click="toggleDropdown"
      class="flex items-center justify-between bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm cursor-pointer hover:border-gray-400 transition"
    >
      <span>{{ selected || 'Select Product' }}</span>
      <svg
        :class="[showOptions ? 'rotate-180' : '', 'w-4 h-4 text-gray-500 transition-transform']"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6" stroke-linecap="round" />
      </svg>
    </div>

    <!-- Dropdown -->
    <transition name="fade">
      <div
        v-if="showOptions"
        class="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40"
      >
        <button
          v-for="prod in allProducts"
          :key="prod.id"
          class="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition"
          :class="{ 'bg-teal-50 text-teal-700 font-medium': selected === prod.business_name }"
          @click="select(prod)"
        >
          {{ prod.business_name }}
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
