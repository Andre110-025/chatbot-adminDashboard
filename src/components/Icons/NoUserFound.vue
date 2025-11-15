<template>
  <div class="flex flex-col items-center justify-center py-10 text-gray-500 text-center">
    <div class="relative w-20 h-20 mb-3 flex items-center justify-center">
      <!-- Outer pulse ring -->
      <div
        class="absolute inset-0 rounded-full border-2 border-mainColor/30 animate-pulse-soft"
      ></div>

      <!-- Inner floating SVG -->
      <svg
        class="w-10 h-10 text-mainColor animate-float"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <!-- Simple user outline -->
        <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" />
        <path d="M4 20c0-3.31 3.13-6 8-6s8 2.69 8 6" />
      </svg>

      <!-- Subtle glowing ring -->
      <div
        class="absolute inset-0 rounded-full bg-mainColor/5 scale-75 opacity-0 animate-glow-pulse"
      ></div>
    </div>

    <p class="text-sm font-medium text-gray-600 animate-fade-in">No users yet</p>
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
