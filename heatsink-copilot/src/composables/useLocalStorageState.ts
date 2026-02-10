/* =========================
 * src/composables/useLocalStorageState.ts
 * ========================= */

import type { DraftState, DraftStateV1, RunsStore, RunsStoreV1 } from "src/core/appModel";
import { defaultDraftState } from "src/core/defaults";

const DRAFT_KEY_V1 = "heatsinkCopilot:draft:v1";
const RUNS_KEY_V1 = "heatsinkCopilot:runs:v1";

export function readDraft(): DraftState {
  const raw = localStorage.getItem(DRAFT_KEY_V1);
  if (!raw) return defaultDraftState();
  try {
    const parsed = JSON.parse(raw) as DraftStateV1;
    if (parsed && parsed.version === 1) {
      return parsed;
    }
  } catch {
    return defaultDraftState();
  }
  return defaultDraftState();
}

export function writeDraft(draft: DraftStateV1): void {
  localStorage.setItem(DRAFT_KEY_V1, JSON.stringify(draft));
}

export function readRuns(): RunsStore {
  const raw = localStorage.getItem(RUNS_KEY_V1);
  if (!raw) return { version: 1, items: [] };
  try {
    const parsed = JSON.parse(raw) as RunsStoreV1;
    if (parsed && parsed.version === 1 && Array.isArray(parsed.items)) {
      return parsed;
    }
  } catch {
    return { version: 1, items: [] };
  }
  return { version: 1, items: [] };
}

export function writeRuns(store: RunsStoreV1): void {
  localStorage.setItem(RUNS_KEY_V1, JSON.stringify(store));
}

export function clearAllLocalData(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith("heatsinkCopilot:")) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

// Migration placeholders for future v2 schemas
export function migrateDraftV1ToV2(_draft: DraftStateV1): DraftStateV1 {
  // When v2 exists, map v1 fields into v2 schema and store under heatsinkCopilot:draft:v2
  return _draft;
}

export function migrateRunsV1ToV2(_runs: RunsStoreV1): RunsStoreV1 {
  // When v2 exists, map v1 fields into v2 schema and store under heatsinkCopilot:runs:v2
  return _runs;
}
