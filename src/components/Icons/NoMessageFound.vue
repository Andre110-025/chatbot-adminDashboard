<template>
  <div class="flex flex-col items-center justify-center py-10 text-gray-500 text-center">
    <div class="relative w-20 h-20 mb-3 flex items-center justify-center">
      <!-- Outer pulse ring -->
      <div
        class="absolute inset-0 rounded-full border-2 border-mainColor/30 animate-pulse-soft"
      ></div>

      <!-- Floating message bubble -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-10 h-10 text-mainColor animate-float"
        viewBox="0 0 24 24"
      >
        <g
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        >
          <path
            d="M12.686 18.222q.603.117 1.218.123a7.3 7.3 0 0 0 2.992-.64l3.095.455a1.03 1.03 0 0 0 1.032-1.135l-.372-3.126a7.2 7.2 0 0 0 .599-2.9a7.304 7.304 0 0 0-7.336-7.284a7.295 7.295 0 0 0-7.109 5.654"
          />
          <path
            d="M13.904 14.745a5.66 5.66 0 0 1-1.218 3.477a5.61 5.61 0 0 1-4.375 2.063a5.7 5.7 0 0 1-2.29-.495l-2.311.413a.754.754 0 0 1-.826-.877l.32-2.363a5.5 5.5 0 0 1-.454-2.219A5.58 5.58 0 0 1 6.805 9.37a5.2 5.2 0 0 1 1.517-.217a5.59 5.59 0 0 1 5.582 5.593"
          />
        </g>
      </svg>

      <!-- Subtle glowing ring -->
      <div
        class="absolute inset-0 rounded-full bg-mainColor/5 scale-75 opacity-0 animate-glow-pulse"
      ></div>
    </div>

    <p class="text-sm font-medium text-gray-600 animate-fade-in">No messages yet</p>
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

@keyframes pulse-soft {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.25;
  }
}
.animate-pulse-soft {
  animation: pulse-soft 2.4s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%,
  100% {
    transform: scale(0.75);
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
