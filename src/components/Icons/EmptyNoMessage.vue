<template>
  <div class="flex flex-col items-center justify-center text-center py-6 text-gray-500">
    <div class="relative w-28 h-28 mb-4 flex items-center justify-center group">
      <!-- Outer pulse -->
      <div
        class="absolute inset-0 rounded-full border-4 border-mainColor/30 animate-pulse-smooth"
      ></div>

      <!-- Floating envelope -->
      <!-- <svg
        class="w-16 h-16 text-mainColor animate-float drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
        <path d="M22 6l-10 7L2 6" class="animate-envelope-lid" stroke-linecap="round" />
      </svg> -->

      <svg
        class="w-16 h-16 text-mainColor animate-float drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 14 14"
      >
        <!-- Icon from Flex free icons by Streamline - https://creativecommons.org/licenses/by/4.0/ -->
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M7 .25c-1.523 0-3.013.08-4.44.23A2.326 2.326 0 0 0 .485 2.452a23.4 23.4 0 0 0-.01 6.54c.159 1.141 1.116 1.952 2.217 2.055l.218.02l.225.02v2.164a.5.5 0 0 0 .704.456c1.405-.63 2.255-1.242 3.28-2.39a43 43 0 0 0 4.256-.234a2.386 2.386 0 0 0 2.131-2.033a23 23 0 0 0 .244-3.266c0-1.13-.087-2.238-.239-3.301a2.354 2.354 0 0 0-2.101-2A43 43 0 0 0 7 .25m.171 3.167a.888.888 0 0 0-1.044.857a.625.625 0 0 1-1.25 0c0-1.325 1.239-2.341 2.538-2.083c.83.165 1.503.84 1.668 1.668c.083.417.035.813-.146 1.169c-.175.344-.452.607-.757.81c-.276.185-.425.294-.512.384a.4.4 0 0 0-.042.052a.625.625 0 0 1-1.25-.003c0-.39.171-.686.391-.915c.197-.204.464-.386.719-.557c.188-.126.288-.241.337-.338a.52.52 0 0 0 .034-.358a.9.9 0 0 0-.686-.686m.454 5.143a.625.625 0 1 0-1.25 0v.275a.625.625 0 1 0 1.25 0z"
          clip-rule="evenodd"
          class="animate-envelope-lid"
        />
      </svg>

      <!-- Subtle burst particles -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          v-for="i in 8"
          :key="i"
          class="absolute w-1 h-1 bg-mainColor rounded-full animate-particle"
          :style="particleStyle(i)"
        ></div>
      </div>
    </div>

    <p class="text-gray-600 font-medium animate-fade-in delay-1000">No messages started yet</p>
  </div>
</template>

<script setup>
const particleStyle = (i) => {
  const angle = i * 45 * (Math.PI / 180)
  const distance = 30
  return {
    top: `50%`,
    left: `50%`,
    transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
    animationDelay: `${i * 0.05}s`,
  }
}
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes pulse-smooth {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.3;
  }
}
.animate-pulse-smooth {
  animation: pulse-smooth 2.8s ease-in-out infinite;
}

@keyframes envelope-lid {
  0%,
  100% {
    transform: rotateX(0deg);
    transform-origin: top;
  }
  50% {
    transform: rotateX(-15deg);
    transform-origin: top;
  }
}
.animate-envelope-lid {
  animation: envelope-lid 2.8s ease-in-out infinite;
}

@keyframes particle {
  0% {
    transform: translate(-50%, -50%) translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) translate(var(--tx, 0), var(--ty, 0)) scale(0);
    opacity: 0;
  }
}
.animate-particle {
  animation: particle 0.9s ease-out forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}
.delay-1000 {
  animation-delay: 1s;
}
</style>
