/* =========================
 * src/core/units.ts
 * ========================= */

export const MM_PER_M = 1000;
export const CFM_TO_M3S = 0.00047194745;
export const INH2O_TO_PA = 249.08891;

export function mmToM(mm: number): number {
  return mm / MM_PER_M;
}

export function mToMm(m: number): number {
  return m * MM_PER_M;
}

export function cfmToM3s(cfm: number): number {
  return cfm * CFM_TO_M3S;
}

export function m3sToCfm(m3s: number): number {
  return m3s / CFM_TO_M3S;
}

export function inH2OToPa(inH2o: number): number {
  return inH2o * INH2O_TO_PA;
}

export function paToInH2O(pa: number): number {
  return pa / INH2O_TO_PA;
}
