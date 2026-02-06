/* =========================
 * src/core/fan.ts
 * ========================= */

import { ComputeResult, FanCurve, FanPoint, WarningItem, FormulaItem } from "./types";
import { W } from "./warnings";

/**
 * Validate fan curve:
 * - Q must be strictly increasing
 * - dp must be non-negative (clamp with warning if needed)
 */
export function validateFanCurve(curve: FanCurve): ComputeResult<FanCurve> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];

  const pts = curve.points.map((p) => ({
    Q: p.Q,
    dp: p.dp < 0 ? 0 : p.dp,
  }));

  for (let i = 1; i < pts.length; i++) {
    if (!(pts[i].Q > pts[i - 1].Q)) {
      warnings.push({
        code: W.FAN_NON_MONOTONE,
        severity: "error",
        message: "Fan curve Q must be strictly increasing.",
        context: { i, prev: pts[i - 1], curr: pts[i] },
      });
      break;
    }
  }

  if (curve.points.some((p) => p.dp < 0)) {
    warnings.push({
      code: W.FAN_DP_NEGATIVE_CLAMPED,
      severity: "warn",
      message: "Negative dp values were clamped to 0 Pa.",
    });
  }

  formulas.push({
    id: "FAN_INTERP_LINEAR",
    title: "Fan curve interpolation",
    latex: "\\Delta P_{fan}(Q) = \\text{linearInterpolate}(\\{(Q_i,\\Delta P_i)\\})",
    variables: [],
    notes: "Use piecewise linear interpolation with clamping at endpoints.",
  });

  return { result: { ...curve, points: pts }, warnings, formulas };
}

/** dp_fan(Q): linear interpolation, clamp to endpoints. */
export function fanDpAtQ(curve: FanCurve, Q: number): number {
  const pts = curve.points;
  if (Q <= pts[0].Q) return pts[0].dp;
  if (Q >= pts[pts.length - 1].Q) return pts[pts.length - 1].dp;

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (Q <= b.Q) {
      const t = (Q - a.Q) / (b.Q - a.Q);
      return a.dp + t * (b.dp - a.dp);
    }
  }
  return pts[pts.length - 1].dp;
}

/** inverse: Q_fan(dp): find Q where dp_fan(Q)=dp by linear segment lookup (assumes dp decreases with Q in typical fans, but we handle general by scanning). */
export function fanQAtDp(curve: FanCurve, dp: number): number {
  const pts = curve.points;
  // For robustness: scan segments and find where dp lies between endpoints (either direction).
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const minDp = Math.min(a.dp, b.dp);
    const maxDp = Math.max(a.dp, b.dp);
    if (dp >= minDp && dp <= maxDp) {
      const t = (dp - a.dp) / (b.dp - a.dp);
      return a.Q + t * (b.Q - a.Q);
    }
  }
  // If outside range, clamp to nearest endpoint in dp-space
  const d0 = Math.abs(dp - pts[0].dp);
  const d1 = Math.abs(dp - pts[pts.length - 1].dp);
  return d0 < d1 ? pts[0].Q : pts[pts.length - 1].Q;
}

/** Convenience: Q_max at dp=0 (free delivery). Typically last point where dp ~ 0. */
export function fanFreeDeliveryQMax(curve: FanCurve): number {
  // choose maximum Q point; if curve includes dp=0 at end that's fine
  return curve.points[curve.points.length - 1].Q;
}

/**
 * Fan affinity scaling (optional):
 *   r = N_new/N_ref
 *   Q_new = r Q_ref
 *   dp_new = r^2 dp_ref
 */
export function scaleFanCurveByRpm(curve: FanCurve, rpmRef: number, rpmNew: number): ComputeResult<FanCurve> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];
  const r = rpmNew / rpmRef;

  const scaled: FanCurve = {
    ...curve,
    name: `${curve.name ?? "fan"} @${rpmNew}rpm`,
    points: curve.points.map((p) => ({ Q: r * p.Q, dp: (r * r) * p.dp })),
  };

  formulas.push({
    id: "FAN_AFFINITY",
    title: "Fan affinity scaling",
    latex: "r=\\frac{N_{new}}{N_{ref}},\\quad Q_{new}=rQ_{ref},\\quad \\Delta P_{new}=r^2\\Delta P_{ref}",
    substitutedLatex: `r=\\frac{${rpmNew}}{${rpmRef}}=${r.toFixed(3)}`,
    variables: [
      { name: "N_{new}", value: rpmNew, unit: "rpm" },
      { name: "N_{ref}", value: rpmRef, unit: "rpm" },
      { name: "r", value: r, unit: "-" },
    ],
  });

  return { result: scaled, warnings, formulas };
}
