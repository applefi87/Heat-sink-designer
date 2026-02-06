<template>
  <q-chip :color="online ? 'green-5' : 'red-5'" text-color="white" dense>
    <q-icon :name="online ? 'wifi' : 'wifi_off'" class="q-mr-xs" />
    {{ online ? 'Online' : 'Offline' }}
  </q-chip>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const online = ref(navigator.onLine);

const update = () => {
  online.value = navigator.onLine;
};

onMounted(() => {
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
});

onBeforeUnmount(() => {
  window.removeEventListener("online", update);
  window.removeEventListener("offline", update);
});
</script>
