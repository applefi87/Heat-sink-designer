/* =========================
 * src/composables/useRunsStore.ts
 * ========================= */

import type { RunResultV1, RunsStoreV1 } from "src/core/appModel";
import { readRuns, writeRuns } from "./useLocalStorageState";

const MAX_RUNS = 50;

export function useRunsStore() {
  let store: RunsStoreV1 = readRuns();

  const save = (run: RunResultV1) => {
    store.items = [run, ...store.items].slice(0, MAX_RUNS);
    writeRuns(store);
  };

  const remove = (runId: string) => {
    store.items = store.items.filter((item) => item.runId !== runId);
    writeRuns(store);
  };

  const clear = () => {
    store.items = [];
    writeRuns(store);
  };

  const exportJson = () => JSON.stringify(store, null, 2);

  const importJson = (json: string) => {
    const parsed = JSON.parse(json) as RunsStoreV1;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      throw new Error("Invalid runs JSON");
    }
    store = { version: 1, items: parsed.items.slice(0, MAX_RUNS) };
    writeRuns(store);
  };

  return {
    get items() {
      return store.items;
    },
    save,
    remove,
    clear,
    exportJson,
    importJson,
  };
}
