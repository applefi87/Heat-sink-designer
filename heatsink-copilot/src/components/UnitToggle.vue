<template>
  <q-btn-toggle
    v-model="model"
    :options="[
      { label: 'User', value: 'user' },
      { label: 'SI', value: 'si' },
    ]"
    toggle-color="primary"
    dense
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { UnitsMode } from "src/core/appModel";

const props = defineProps<{ modelValue: UnitsMode }>();
const emit = defineEmits<{ (e: "update:modelValue", value: UnitsMode): void }>();

const model = computed({
  get: () => props.modelValue,
  set: (val: UnitsMode) => emit("update:modelValue", val),
});
</script>
