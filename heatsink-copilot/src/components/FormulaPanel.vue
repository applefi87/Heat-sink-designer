<template>
  <q-expansion-item icon="functions" label="Show formulas" dense>
    <q-card flat class="q-mt-sm">
      <q-card-section>
        <FormulaBlock v-for="item in items" :key="item.id" :item="item" />
        <div v-if="items.length === 0" class="text-caption text-grey-6">No formulas available.</div>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import type { FormulaItem } from "src/core/types";
import FormulaBlock from "./FormulaBlock.vue";

defineProps<{ items: FormulaItem[] }>();
</script>
