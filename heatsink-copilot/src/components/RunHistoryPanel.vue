<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1">Run History</div>
      <div class="row q-col-gutter-sm q-mt-sm">
        <q-btn color="primary" label="Save run" :disable="disableSave" @click="save" />
        <q-btn outline label="Export runs JSON" @click="exportRuns" />
        <q-btn outline label="Import runs JSON" @click="importRuns" />
        <q-btn color="negative" outline label="Clear all local data" @click="clearAll" />
      </div>
      <q-list bordered separator class="q-mt-md">
        <q-item v-for="item in items" :key="item.runId">
          <q-item-section>
            <q-item-label>{{ item.createdAtISO }}</q-item-label>
            <q-item-label caption>Q*: {{ item.outputs.opFinal.Q_star.toExponential(3) }} m³/s</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn dense flat icon="delete" color="negative" @click="remove(item.runId)" />
          </q-item-section>
        </q-item>
        <q-item v-if="items.length === 0">
          <q-item-section>
            <q-item-label>No saved runs.</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { RunResultV1 } from "src/core/appModel";
import { useRunsStore } from "src/composables/useRunsStore";
import { clearAllLocalData } from "src/composables/useLocalStorageState";

const props = defineProps<{ currentRun: RunResultV1; disableSave: boolean }>();

const store = useRunsStore();
const items = ref(store.items);

const refresh = () => {
  items.value = store.items;
};

const save = () => {
  store.save(props.currentRun);
  refresh();
};

const remove = (runId: string) => {
  store.remove(runId);
  refresh();
};

const exportRuns = () => {
  const json = store.exportJson();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "heatsink-runs.json";
  a.click();
  URL.revokeObjectURL(url);
};

const importRuns = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    store.importJson(text);
    refresh();
  };
  input.click();
};

const clearAll = () => {
  clearAllLocalData();
  store.clear();
  refresh();
};
</script>
