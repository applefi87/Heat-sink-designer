/* =========================
 * src/core/operatingPoint.ts
 * ========================= */

import { AirProps, ComputeResult, FanCurve, HeatsinkDerived, LossModel, OperatingPoint, WarningItem, FormulaItem } from "./types";
import { fanDpAtQ, fanFreeDeliveryQMax, fanQAtDp } from "./fan";
import { computePressureDropAtQ } from "./pressureDrop";
import { W } from "./warnings";

/**
 * 3-iteration calibration requested by user:
 * Start with Q0 = Q_max (free delivery at dp=0)
 * Repeat:
 *   dp_k = dp_hs(Q_k)
 *   Q_{k+1} = Q_fan(dp_k)   // inverse interpolation
 * Do 3 iterations -> Q3
 */
export function solveOperatingPointIter3(
  curve: FanCurve,
  derived: HeatsinkDerived,
  air: AirProps,
  model: LossModel,
  L: number
): ComputeResult<OperatingPoint> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];

  let Qk = fanFreeDeliveryQMax(curve);
  const trace: Array<{ k: number; Q: number; dp_hs: number; Q_next: number }> = [];

  for (let k = 0; k < 3; k++) {
    const dpRes = computePressureDropAtQ(Qk, derived, air, model, L);
    warnings.push(...dpRes.warnings);

    const dp_k = dpRes.result.dp;
    const Q_next = fanQAtDp(curve, dp_k);
    trace.push({ k, Q: Qk, dp_hs: dp_k, Q_next });

    Qk = Q_next;
  }

  // output Q_star approx by iter3 and dp at that Q
  const dpFinal = computePressureDropAtQ(Qk, derived, air, model, L);
  warnings.push(...dpFinal.warnings);

  formulas.push({
    id: "OP_ITER3",
    title: "3-step calibration using free-delivery Q_max",
    latex: "Q_0=Q_{max}(\\Delta P=0),\\quad \\Delta P_k=\\Delta P_{hs}(Q_k),\\quad Q_{k+1}=Q_{fan}(\\Delta P_k)",
    substitutedLatex: `Q_0=${trace[0]?.Q.toExponential(3)}\\,m^3/s \\rightarrow Q_3=${Qk.toExponential(3)}\\,m^3/s`,
    variables: [],
    notes: "Use as an initial guess. For robustness, follow with bisection to guarantee intersection if exists.",
  });

  return {
    result: {
      Q_star: Qk,
      dp_star: dpFinal.result.dp,
      method: "iter3",
      iterTrace: trace,
    },
    warnings,
    formulas,
  };
}

/**
 * Robust operating point solver using bracket + bisection on:
 *   f(Q)=dp_fan(Q) - dp_hs(Q)
 * Find Q* where f(Q*)=0.
 */
export function solveOperatingPointBisection(
  curve: FanCurve,
  derived: HeatsinkDerived,
  air: AirProps,
  model: LossModel,
  L: number,
  Qmin: number,
  Qmax: number
): ComputeResult<OperatingPoint> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];

  // sample to find bracket
  const n = 40;
  let bestBracket: { Q1: number; Q2: number; f1: number; f2: number } | null = null;

  function f(Q: number): number {
    const dpFan = fanDpAtQ(curve, Q);
    const dpHs = computePressureDropAtQ(Q, derived, air, model, L).result.dp;
    return dpFan - dpHs;
  }

  let prevQ = Qmin;
  let prevF = f(prevQ);
  for (let i = 1; i <= n; i++) {
    const Q = Qmin + (i / n) * (Qmax - Qmin);
    const curF = f(Q);
    if (prevF === 0) {
      bestBracket = { Q1: prevQ, Q2: prevQ, f1: prevF, f2: prevF };
      break;
    }
    if (prevF * curF < 0) {
      bestBracket = { Q1: prevQ, Q2: Q, f1: prevF, f2: curF };
      break;
    }
    prevQ = Q;
    prevF = curF;
  }

  if (!bestBracket) {
    warnings.push({
      code: W.NO_OPERATING_POINT,
      severity: "error",
      message: "No operating point: fan curve does not intersect heatsink pressure-drop curve in the scanned range.",
      context: { Qmin, Qmax },
    });
    formulas.push({
      id: "OP_NO_INTERSECTION",
      title: "No intersection detected",
      latex: "f(Q)=\\Delta P_{fan}(Q)-\\Delta P_{hs}(Q)\\;\\text{has no sign change in }[Q_{min},Q_{max}]",
      variables: [
        { name: "Q_{min}", value: Qmin, unit: "m^3/s" },
        { name: "Q_{max}", value: Qmax, unit: "m^3/s" },
      ],
    });
    return { result: { Q_star: NaN, dp_star: NaN, method: "bisection" }, warnings, formulas };
  }

  // bisection
  let { Q1, Q2, f1, f2 } = bestBracket;
  for (let iter = 0; iter < 60; iter++) {
    const Qm = 0.5 * (Q1 + Q2);
    const fm = f(Qm);
    if (Math.abs(fm) < 1e-3 || Math.abs(Q2 - Q1) < 1e-6) {
      const dpStar = fanDpAtQ(curve, Qm); // equals dp_hs approx
      formulas.push({
        id: "OP_BISECTION",
        title: "Operating point by bisection",
        latex: "f(Q)=\\Delta P_{fan}(Q)-\\Delta P_{hs}(Q),\\;\\text{bisect on bracket }[Q_1,Q_2]\\rightarrow Q^*",
        substitutedLatex: `[Q_1,Q_2]=[${bestBracket.Q1.toExponential(3)},${bestBracket.Q2.toExponential(3)}] \\Rightarrow Q^*=${Qm.toExponential(3)}\\,m^3/s,\\;\\Delta P^*=${dpStar.toFixed(1)}\\,Pa`,
        variables: [],
      });
      return {
        result: { Q_star: Qm, dp_star: dpStar, method: "bisection", bracket: bestBracket },
        warnings,
        formulas,
      };
    }
    if (f1 * fm < 0) {
      Q2 = Qm; f2 = fm;
    } else {
      Q1 = Qm; f1 = fm;
    }
  }

  warnings.push({
    code: W.ITER_NOT_CONVERGED,
    severity: "warn",
    message: "Bisection reached iteration limit; result may be approximate.",
  });

  const Q_star = 0.5 * (Q1 + Q2);
  const dp_star = fanDpAtQ(curve, Q_star);
  return { result: { Q_star, dp_star, method: "bisection", bracket: bestBracket }, warnings, formulas };
}
