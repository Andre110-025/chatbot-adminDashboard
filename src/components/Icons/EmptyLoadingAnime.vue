<template>
  <div class="flex flex-col items-center justify-center text-center py-16 text-gray-500">
    <div
      class="relative w-32 h-32 mb-4 flex items-center justify-center group"
      @mouseenter="triggerBurst = true"
      @mouseleave="triggerBurst = false"
    >
      <!-- Outer pulse ring -->
      <div
        class="absolute inset-0 rounded-full border-4 border-mainColor/30 animate-pulse-smooth"
      ></div>

      <!-- Inner glow (appears on completion) -->
      <div
        class="absolute inset-0 rounded-full bg-mainColor/10 scale-0 opacity-0 animate-glow-in"
        :class="{ 'animate-glow-in': checkDrawn }"
      ></div>

      <!-- Checkmark SVG -->
      <svg
        class="w-16 h-16 text-mainColor animate-float drop-shadow-sm"
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Background circle (fades in first) -->
        <circle
          cx="26"
          cy="26"
          r="25"
          stroke="currentColor"
          stroke-width="2"
          class="opacity-0"
          fill="none"
        >
          <animate attributeName="opacity" from="0" to="0.15" dur="0.4s" begin="0s" fill="freeze" />
        </circle>

        <!-- Checkmark path with staggered draw -->
        <path
          class="stroke-current"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="3"
          d="M16 27l7 7 13-14"
          fill="none"
          stroke-dasharray="50"
          stroke-dashoffset="50"
          @animationend="onCheckDrawn"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="50"
            to="0"
            dur="0.6s"
            begin="0.4s"
            fill="freeze"
            easing="cubic-bezier(0.65, 0, 0.35, 1)"
          />
        </path>
      </svg>

      <!-- Particle burst (on hover or completion) -->
      <div v-if="triggerBurst || checkDrawn" class="absolute inset-0 pointer-events-none">
        <div
          v-for="i in 6"
          :key="i"
          class="absolute w-1 h-1 bg-mainColor rounded-full animate-particle"
          :style="particleStyle(i)"
        ></div>
      </div>
    </div>

    <p class="text-gray-600 font-medium animate-fade-in delay-1000">
      No pending user issues — all chats are good!
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const checkDrawn = ref(false)
const triggerBurst = ref(false)

const onCheckDrawn = () => {
  checkDrawn.value = true
}

const particleStyle = (i) => {
  const angle = i * 60 * (Math.PI / 180)
  const distance = 40
  return {
    top: `50%`,
    left: `50%`,
    transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
    animationDelay: `${i * 0.05}s`,
  }
}

onMounted(() => {
  // Optional: Auto-trigger burst on load after check
  setTimeout(() => {
    if (checkDrawn.value) triggerBurst.value = true
  }, 1200)
})
</script>

<style scoped>
/* Floating animation */
@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(2deg);
  }
}

.animate-float {
  animation: float 3.2s ease-in-out infinite;
}

/* Smooth pulse */
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

/* Glow on completion */
@keyframes glow-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-glow-in {
  animation: glow-in 0.5s ease-out forwards;
}

/* Particle burst */
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
  animation: particle 0.8s ease-out forwards;
}

/* Fade in text */
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

/* Hover uplift */
.group:hover .animate-float {
  animation-duration: 2s;
}
</style>
