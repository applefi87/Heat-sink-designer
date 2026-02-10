<template>
  <q-page class="q-pa-md">
    <WizardStepper v-model="draft" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import WizardStepper from "src/components/WizardStepper.vue";
import { readDraft, writeDraft } from "src/composables/useLocalStorageState";
import type { DraftStateV1 } from "src/core/appModel";

const draft = ref<DraftStateV1>(readDraft());

watch(
  draft,
  (val) => {
    writeDraft(val);
  },
  { deep: true }
);
</script>
