<script setup></script>

<template>
  <VueFinalModal
    :overlay="true"
    :click-to-close="true"
    :overlay-transition="'vfm-fade'"
    :content-transition="'vfm-fade'"
    overlay-class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
    content-class="bg-white w-full max-w-[900px] h-[650px] rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden"
    class="fixed inset-0 flex items-center justify-center z-[70]"
  >
    <p>Modal Content Here</p>
  </VueFinalModal>
</template>
