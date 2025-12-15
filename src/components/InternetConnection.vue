<script setup>
defineProps(['reloadPage'])
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div class="relative w-16 h-16 mb-6">
      <span
        class="absolute inset-0 rounded-full border-2 border-mainColor opacity-60 animate-ping"
      ></span>
      <span
        class="absolute inset-2 rounded-full border-2 border-[#0f928c] opacity-70 animate-wave"
      ></span>
      <span
        class="absolute inset-4 rounded-full border-2 border-[#1ab4ad] opacity-80 animate-wave-slow"
      ></span>
      <span class="absolute inset-6 bg-mainColor rounded-full"></span>
    </div>

    <p class="text-black text-lg font-medium tracking-wide flex items-center">
      You’re offline — trying to reconnect
      <span class="ml-1 flex space-x-1">
        <span class="dot bg-mainColor w-1.5 h-1.5 rounded-full"></span>
        <span class="dot bg-mainColor w-1.5 h-1.5 rounded-full"></span>
        <span class="dot bg-mainColor w-1.5 h-1.5 rounded-full"></span>
      </span>
    </p>
    <button
      @click="reloadPage"
      class="mt-6 px-6 py-2 bg-mainColor text-white font-semibold rounded-full shadow transition-all duration-300 transform hover:scale-105 active:scale-95"
    >
      Retry
    </button>
  </div>
</template>

<style setup>
@keyframes wave {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}
@keyframes wave-slow {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

.animate-wave {
  animation: wave 2s infinite ease-in-out;
}
.animate-wave-slow {
  animation: wave-slow 3s infinite ease-in-out;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.8;
  }
  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

.dot {
  animation: bounce 1.4s infinite;
}
.dot:nth-child(1) {
  animation-delay: 0s;
}
.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}
</style>
