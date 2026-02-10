/* =========================
 * src/core/validators.ts
 * ========================= */

import type { FanCurve, FanPoint } from "./types";

export type ParseFanCurveResult = {
  curve: FanCurve;
  errors: string[];
};

export function parseFanCurveText(text: string, name = "User Curve"): ParseFanCurveResult {
  const errors: string[] = [];
  const points: FanPoint[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const parts = line.split(/[\s,;\t]+/).filter(Boolean);
    if (parts.length < 2) {
      errors.push(`Line has <2 values: "${line}"`);
      continue;
    }
    const Q = Number(parts[0]);
    const dp = Number(parts[1]);
    if (!Number.isFinite(Q) || !Number.isFinite(dp)) {
      errors.push(`Invalid numeric values: "${line}"`);
      continue;
    }
    points.push({ Q, dp });
  }

  if (points.length < 2) {
    errors.push("Need at least two fan curve points.");
  }

  return { curve: { name, points }, errors };
}

export function parseFanCurveCSV(csv: string, name = "CSV Curve"): ParseFanCurveResult {
  return parseFanCurveText(csv, name);
}
