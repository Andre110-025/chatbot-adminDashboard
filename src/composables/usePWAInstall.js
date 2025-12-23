// import { ref, onMounted, onUnmounted } from 'vue'

// console.log('📜 PWA Script Loaded')

// window.addEventListener('beforeinstallprompt', (e) => {
//   console.log('🚨 GLOBAL EVENT CAPTURED - Browser is ready to install')
// })

// export function usePWAInstall() {
//   const deferredPrompt = ref(null)
//   const canInstall = ref(false)
//   const isInstalled = ref(false)

//   // 1. Check if the app is already running as a PWA
//   const checkIfInstalled = () => {
//     const isStandalone = window.matchMedia('(display-mode: standalone)').matches
//     const isStandaloneIOS = window.navigator.standalone === true

//     isInstalled.value = isStandalone || isStandaloneIOS
//     return isInstalled.value
//   }

//   // 2. Capture the REAL browser prompt
//   const handleBeforeInstall = (e) => {
//     // Prevent the default mini-infobar from appearing
//     e.preventDefault()
//     // Stash the event so it can be triggered by your button
//     deferredPrompt.value = e
//     // Now show your "Install App" button
//     canInstall.value = true

//     console.log('✅ Real PWA Install Prompt captured')
//   }

//   // 3. The function that triggers the actual download/install
//   const installApp = async () => {
//     if (!deferredPrompt.value) {
//       // If the prompt isn't here, it's usually iOS or browser hasn't fired it yet
//       showNativeInstructions()
//       return
//     }

//     try {
//       // This line triggers the ACTUAL native browser download popup
//       await deferredPrompt.value.prompt()

//       // Wait for the user to click "Install" or "Cancel"
//       const { outcome } = await deferredPrompt.value.userChoice
//       console.log(`User response: ${outcome}`)

//       if (outcome === 'accepted') {
//         canInstall.value = false
//         isInstalled.value = true
//       }

//       // The prompt can only be used once, so clear it
//       deferredPrompt.value = null
//     } catch (error) {
//       console.error('Install error:', error)
//     }
//   }

//   const showNativeInstructions = () => {
//     const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
//     if (isIOS) {
//       alert('To install: Tap the "Share" icon (📤) and then "Add to Home Screen".')
//     } else {
//       alert(
//         'Tap the menu (⋮) in top right look for "Install app" or "Add to Home Screen Follow the prompts to install',
//       )
//     }
//   }

//   onMounted(() => {
//     checkIfInstalled()
//     window.addEventListener('beforeinstallprompt', handleBeforeInstall)

//     // Also listen for the 'appinstalled' event
//     window.addEventListener('appinstalled', () => {
//       console.log('🚀 PWA was installed successfully')
//       canInstall.value = false
//       isInstalled.value = true
//     })
//   })

//   onUnmounted(() => {
//     window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
//   })

//   return { canInstall, installApp, isInstalled }
// }

import { ref, onMounted, onUnmounted } from 'vue'

// 1. Move these OUTSIDE so they are global constants
const deferredPrompt = ref(null)
const canInstall = ref(false)
const isInstalled = ref(false)

// 2. This listener runs IMMEDIATELY when the script loads
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🚨 GLOBAL EVENT CAPTURED')
  e.preventDefault()
  deferredPrompt.value = e
  canInstall.value = true
})

window.addEventListener('appinstalled', () => {
  console.log('🚀 PWA was installed successfully')
  canInstall.value = false
  isInstalled.value = true
})

export function usePWAInstall() {
  const checkIfInstalled = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isStandaloneIOS = window.navigator.standalone === true
    isInstalled.value = isStandalone || isStandaloneIOS
    return isInstalled.value
  }

  const installApp = async () => {
    if (!deferredPrompt.value) {
      showNativeInstructions()
      return
    }

    try {
      await deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice
      if (outcome === 'accepted') {
        canInstall.value = false
        isInstalled.value = true
        deferredPrompt.value = null
      }
    } catch (error) {
      console.error('Install error:', error)
    }
  }

  const showNativeInstructions = () => {
    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    if (isIOS) {
      alert('To install: Tap the "Share" icon (📤) and then "Add to Home Screen".')
    } else {
      alert('Tap the menu (⋮) and look for "Install app" or "Add to Home Screen".')
    }
  }

  onMounted(() => {
    checkIfInstalled()
    // We don't necessarily need to add the listener here anymore
    // because the global one above handles it for all components
  })

  // Return the GLOBAL refs
  return { canInstall, installApp, isInstalled }
}
