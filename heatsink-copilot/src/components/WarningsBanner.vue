<template>
  <div v-if="warnings.length" class="q-mb-md">
    <q-banner dense rounded :class="bannerClass">
      <div class="row items-center">
        <div class="text-weight-medium">Warnings</div>
        <q-space />
        <q-chip dense color="grey-2" text-color="dark">Info: {{ counts.info }}</q-chip>
        <q-chip dense color="orange-2" text-color="dark">Warn: {{ counts.warn }}</q-chip>
        <q-chip dense color="red-2" text-color="dark">Error: {{ counts.error }}</q-chip>
        <q-btn flat dense icon="expand_more" @click="expanded = !expanded" />
      </div>
      <div v-if="expanded" class="q-mt-sm">
        <q-list dense bordered>
          <q-item v-for="(w, idx) in warnings" :key="idx">
            <q-item-section>
              <q-item-label><strong>[{{ w.severity.toUpperCase() }}]</strong> {{ w.code }}</q-item-label>
              <q-item-label caption>{{ w.message }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { WarningItem } from "src/core/types";

const props = defineProps<{ warnings: WarningItem[] }>();
const expanded = ref(false);

const counts = computed(() => ({
  info: props.warnings.filter((w) => w.severity === "info").length,
  warn: props.warnings.filter((w) => w.severity === "warn").length,
  error: props.warnings.filter((w) => w.severity === "error").length,
}));

const bannerClass = computed(() => {
  if (counts.value.error > 0) return "bg-red-1 text-red-9";
  if (counts.value.warn > 0) return "bg-orange-1 text-orange-9";
  return "bg-blue-1 text-blue-9";
});
</script>
