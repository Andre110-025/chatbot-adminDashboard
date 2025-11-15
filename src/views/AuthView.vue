<script setup>
import { RouterView } from 'vue-router'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const images = ref(['/authimage1.jpg', '/authimage2.jpg', '/authimage3.jpg'])

let sliderId
const currentSlider = ref(0)

const startSlide = () => {
  sliderId = setInterval(() => {
    currentSlider.value = (currentSlider.value + 1) % images.value.length
  }, 6000)
}

onMounted(() => {
  if (images.value.length > 0) startSlide()
})

onBeforeUnmount(() => {
  if (sliderId) clearInterval(sliderId)
})
</script>

<template>
  <main class="relative min-h-dvh h-dvh flex overflow-hidden">
    <div class="relative flex-1 min-h-full w-1/2 overflow-hidden">
      <Transition name="slide" mode="in-out">
        <div
          :key="images[currentSlider]"
          class="absolute inset-0 bg-cover bg-center"
          :style="{ backgroundImage: `url('${images[currentSlider]}')` }"
        >
          <div class="absolute inset-0 bg-black/40" />
        </div>
      </Transition>

      <div
        class="absolute inset-0 z-10 flex flex-col justify-between h-full px-12 py-10 text-white"
      >
        <div class="flex items-start">
          <div class="flex items-center space-x-3">
            <div class="bg-white rounded-full p-2 shadow-md">
              <img src="/LogoHead.ico" alt="logo" class="w-6 h-6" />
            </div>
            <h2 class="text-2xl font-semibold tracking-wide text-white">Hub</h2>
          </div>
        </div>
        <div class="flex flex-col items-start justify-end w-[85%] pb-10">
          <h2 class="text-[32px] font-bold leading-tight">NexDre Admin Dashboard</h2>
          <p class="mt-4 text-[15px] leading-relaxed opacity-90">
            Oversee how NexDre interacts with users, manage chatbot data, and optimize its
            intelligence — all in one dashboard.
          </p>
          <div class="flex gap-2 mt-8">
            <span
              v-for="(image, index) in images"
              :key="index"
              @click="currentSlider = index"
              class="w-[7px] h-[7px] rounded-full cursor-pointer transition-all duration-300"
              :class="[
                currentSlider === index ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/70',
              ]"
            ></span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col bg-white min-h-full">
      <RouterView />
    </div>
  </main>
</template>
