<template>
  <div>
    <q-input
      v-model="textModel"
      type="textarea"
      label="Fan curve points (Q, dp)"
      hint="One pair per line: Q, dp"
      rows="6"
    />
    <div class="row q-col-gutter-sm q-mt-sm items-center">
      <q-file dense label="Upload CSV" @update:model-value="onFile" />
      <q-select
        v-model="sourceModel"
        :options="sourceOptions"
        dense
        label="Source"
        style="min-width: 150px"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ modelValue: string; source: "default" | "textarea" | "csv" }>();
const emit = defineEmits<{ (e: "update:modelValue", value: string): void; (e: "update:source", value: "default" | "textarea" | "csv"): void }>();

const sourceOptions = [
  { label: "Default", value: "default" },
  { label: "Textarea", value: "textarea" },
  { label: "CSV", value: "csv" },
];

const textModel = computed({
  get: () => props.modelValue,
  set: (val: string) => emit("update:modelValue", val),
});

const sourceModel = computed({
  get: () => props.source,
  set: (val: "default" | "textarea" | "csv") => emit("update:source", val),
});

const onFile = async (file: File | null) => {
  if (!file) return;
  const text = await file.text();
  emit("update:modelValue", text);
  emit("update:source", "csv");
};
</script>
