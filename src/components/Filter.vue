<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

const emit = defineEmits(['update:selected', 'update:details', 'update:website'])

const allProducts = ref([])
const selected = ref('') // current site selected
const showOptions = ref(false)
const selectedProductId = ref(null)
const selectedWebsite = ref(null)

// toggle dropdown
const toggleDropdown = () => (showOptions.value = !showOptions.value)

const select = (product) => {
  selected.value = product.business_name
  selectedProductId.value = product.id
  selectedWebsite.value = product.website
  showOptions.value = false

  // emit to parent
  emit('update:selected', product.id)
  emit('update:website', product.website)
  emit('update:details', product.website)
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
const getAllProducts = async () => {
  try {
    const res = await axios.get('/getproduct')
    // console.log(res)
    allProducts.value = res.data['all websites']

    // automatically select first product if available
    if (allProducts.value.length > 0) {
      const firstProduct = allProducts.value[0]
      selected.value = firstProduct.business_name

      // this is like, telling em to keep a sit for an id coming
      selectedProductId.value = firstProduct.id
      selectedWebsite.value = firstProduct.website

      // emit to parent
      emit('update:selected', firstProduct.id)
      emit('update:details', firstProduct.website)
      emit('update:website', firstProduct.website)
    }
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div ref="target" class="relative w-64">
    <!-- Trigger -->
    <button
      @click="toggleDropdown"
      class="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm font-medium transition-all duration-200
             hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20
             {{ showOptions ? 'border-mainColor ring-2 ring-mainColor' : 'border-gray-200' }}"
    >
      <span :class="selected ? 'text-gray-900' : 'text-gray-500'">
        {{ selected || 'Select Product' }}
      </span>

      <svg
        class="h-5 w-5 text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180 text-teal-600': showOptions }"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="showOptions"
        class="absolute left-0 right-0 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50"
      >
        <div class="max-h-80 overflow-y-auto py-1">
          <button
            v-for="prod in allProducts"
            :key="prod.id"
            @click="select(prod)"
            class="flex w-full items-center justify-between px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
            :class="{ 'bg-teal-50 text-teal-700 font-medium': selected === prod.business_name }"
          >
            <span class="truncate">{{ prod.business_name }}</span>

            <!-- Checkmark -->
            <svg
              v-if="selected === prod.business_name"
              class="h-4 w-4 text-teal-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <!-- Optional empty state if you ever filter -->
        <div v-if="!allProducts.length" class="px-4 py-8 text-center text-sm text-gray-400">
          No products available
        </div>
      </div>
    </transition>
  </div>
</template>
