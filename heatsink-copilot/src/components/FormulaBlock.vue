<template>
  <q-card flat bordered class="q-mb-sm">
    <q-card-section>
      <div class="text-subtitle2 q-mb-xs">{{ item.title }}</div>
      <div v-html="rendered" class="formula" />
      <div v-if="item.substitutedLatex" class="q-mt-sm" v-html="renderedSub" />
      <div v-if="item.notes" class="text-caption text-grey-7 q-mt-sm">{{ item.notes }}</div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import katex from "katex";
import type { FormulaItem } from "src/core/types";

const props = defineProps<{ item: FormulaItem }>();

const rendered = computed(() => katex.renderToString(props.item.latex, { throwOnError: false }));
const renderedSub = computed(() =>
  props.item.substitutedLatex
    ? katex.renderToString(props.item.substitutedLatex, { throwOnError: false })
    : ""
);
</script>

<style scoped>
.formula {
  font-size: 1.05rem;
}
</style>
