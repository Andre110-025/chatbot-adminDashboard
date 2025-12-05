<script setup>
import { VueFinalModal } from 'vue-final-modal'
import { toast } from 'vue3-toastify'
import axios from 'axios'
const emit = defineEmits(['confirm'])

const props = defineProps({
  website: String,
  id: Number,
})

console.log(props.id)

const deleteConversation = async () => {
  if (!props.website) {
    toast.warning('Cannot delete')
    return
  }

  try {
    const response = await axios.delete('/deleteknowledgebase', {
      params: {
        website: props.website,
        id: props.id,
      },
    })
    console.log(response)

    toast.success('Message deleted!')
    setTimeout(() => {
      emit('confirm')
    }, 3000)
  } catch (err) {
    console.error(err)
    toast.error('Failed to delete message.')
  }
}
</script>

<template>
  <VueFinalModal
    :overlay="true"
    :click-to-close="true"
    :overlay-transition="'vfm-fade'"
    :content-transition="'vfm-fade'"
    overlay-class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
    content-class="bg-white w-[600px] max-w-[850px] h-auto rounded-2xl shadow-2xl overflow-hidden z-[70]"
    class="fixed inset-0 flex items-center justify-center p-4 z-[70]"
  >
    <div class="p-6 text-center space-y-4">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg
          class="h-6 w-6 text-yellow-500"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L4.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2 class="text-lg font-semibold text-gray-800">Confirm Action</h2>
      <p class="text-sm text-gray-600">
        This action <span class="font-semibold text-red-500">cannot be undone</span>. Are you sure
        you want to delete this info
      </p>

      <div class="flex justify-center gap-3 pt-4">
        <button
          @click="emit('confirm')"
          class="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          @click="deleteConversation"
          class="px-4 py-2 text-sm rounded-lg bg-mainColor text-white transition"
        >
          Delete
        </button>
      </div>
    </div>
  </VueFinalModal>
</template>
