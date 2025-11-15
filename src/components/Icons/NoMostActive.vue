<template>
  <div class="flex flex-col items-center justify-center py-10 text-gray-500 text-center">
    <div class="relative w-20 h-20 mb-3 flex items-center justify-center">
      <!-- Glowing outer ring -->
      <div
        class="absolute inset-0 rounded-full border-2 border-mainColor/40 animate-glow-pulse-strong"
      ></div>

      <!-- Floating user with crown -->
      <div class="relative animate-float">
        <!-- Crown -->
        <svg
          class="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-yellow-400 animate-crown-bounce"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 10l2-4 5 3 5-3 2 4v10H5V10z" />
        </svg>

        <!-- User icon -->
        <svg
          class="w-10 h-10 text-mainColor"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" />
          <path d="M4 20c0-3.31 3.13-6 8-6s8 2.69 8 6" />
        </svg>
      </div>

      <!-- Subtle glow ring -->
      <div
        class="absolute inset-0 rounded-full bg-mainColor/10 scale-75 opacity-0 animate-glow-pulse"
      ></div>
    </div>

    <p class="text-sm font-medium text-gray-600 animate-fade-in">No most active user yet</p>
  </div>
</template>

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

@keyframes glow-pulse {
  0%,
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
}
.animate-glow-pulse {
  animation: glow-pulse 2.8s ease-in-out infinite;
}

@keyframes glow-pulse-strong {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
    border-color: rgba(16, 185, 129, 0.3);
  }
  50% {
    transform: scale(1.2);
    opacity: 0.2;
    border-color: rgba(16, 185, 129, 0.6);
  }
}
.animate-glow-pulse-strong {
  animation: glow-pulse-strong 3s ease-in-out infinite;
}

@keyframes crown-bounce {
  0%,
  100% {
    transform: translate(-50%, 0);
  }
  50% {
    transform: translate(-50%, -3px);
  }
}
.animate-crown-bounce {
  animation: crown-bounce 1.8s ease-in-out infinite;
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
  animation: fade-in 0.8s ease-out forwards;
}
</style>
