import { ref, watch } from 'vue'

export function useDarkMode() {
  const isDark = ref(false)

  // Initialize
  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    // Optional: detect system preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  updateHtmlClass()

  watch(isDark, () => {
    updateHtmlClass()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  })

  const toggleDarkMode = () => {
    isDark.value = !isDark.value
  }

  function updateHtmlClass() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  return { isDark, toggleDarkMode }
}
