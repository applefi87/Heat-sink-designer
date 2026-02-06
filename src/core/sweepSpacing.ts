/* =========================
 * src/core/sweepSpacing.ts
 * ========================= */

import {
  AirProps, ComputeResult, FanCurve, HeatsinkGeomInput, LossModel, SpacingSweepPoint,
  ThermalSpecInput, WarningItem, FormulaItem
} from "./types";
import { deriveHeatsinkGeometry } from "./geometry";
import { solveOperatingPointIter3, solveOperatingPointBisection } from "./operatingPoint";
import { computeHeatTransfer } from "./heatTransfer";
import { computeThermalPerformance } from "./thermal";

/**
 * Sweep fin spacing s over a grid, producing the curve:
 *   s -> Tj_est (or R_sa_est)
 *
 * Recommended pipeline per s:
 *  1) derive geometry
 *  2) operating point via iter3 (user requested), optionally refine by bisection
 *  3) compute h from Nu model
 *  4) compute R_sa, Tj
 */
export type SpacingSweepInput = {
  base: Omit<HeatsinkGeomInput, "s">;
  sGrid: number[]; // meters
  eta_o: number;   // overall efficiency (MVP constant e.g. 0.8)
  useBisectionRefine: boolean;
  bisectionRange?: { Qmin: number; Qmax: number }; // in m^3/s
  nuModel: "mvp-piecewise" | "paper-correlation";
};

export function sweepFinSpacingCurve(
  spec: ThermalSpecInput,
  fan: FanCurve,
  air: AirProps,
  loss: LossModel,
  input: SpacingSweepInput
): ComputeResult<SpacingSweepPoint[]> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];

  const points: SpacingSweepPoint[] = [];

  for (const s of input.sGrid) {
    // 1) geometry
    const geomRes = deriveHeatsinkGeometry({ ...input.base, s });
    const wLocal = [...geomRes.warnings];

    if (geomRes.warnings.some(w => w.severity === "error")) {
      points.push({
        s,
        N_fin: geomRes.result.N_fin,
        N_ch: geomRes.result.N_ch,
        A_flow: geomRes.result.A_flow,
        Dh: geomRes.result.Dh,
        A_eff: geomRes.result.A_eff,
        Q_star: NaN,
        dp_star: NaN,
        Re_star: NaN,
        h: NaN,
        R_sa_est: Infinity,
        Tj_est: Infinity,
        warnings: wLocal,
      });
      continue;
    }

    // 2) operating point: iter3 initial
    const opIter = solveOperatingPointIter3(fan, geomRes.result, air, loss, input.base.L);
    wLocal.push(...opIter.warnings);

    let Q_star = opIter.result.Q_star;
    let dp_star = opIter.result.dp_star;

    // Optional refine by bisection for guaranteed intersection
    if (input.useBisectionRefine && input.bisectionRange) {
      const opBis = solveOperatingPointBisection(
        fan,
        geomRes.result,
        air,
        loss,
        input.base.L,
        input.bisectionRange.Qmin,
        input.bisectionRange.Qmax
      );
      wLocal.push(...opBis.warnings);
      if (!Number.isNaN(opBis.result.Q_star)) {
        Q_star = opBis.result.Q_star;
        dp_star = opBis.result.dp_star;
      }
    }

    // 3) heat transfer
    const htRes = computeHeatTransfer(Q_star, geomRes.result, air, input.nuModel);
    wLocal.push(...htRes.warnings);

    // 4) thermal
    const thRes = computeThermalPerformance(spec, htRes.result.h, geomRes.result.A_eff, input.eta_o);
    wLocal.push(...thRes.warnings);

    points.push({
      s,
      N_fin: geomRes.result.N_fin,
      N_ch: geomRes.result.N_ch,
      A_flow: geomRes.result.A_flow,
      Dh: geomRes.result.Dh,
      A_eff: geomRes.result.A_eff,
      Q_star,
      dp_star,
      Re_star: htRes.result.Re,
      h: htRes.result.h,
      R_sa_est: thRes.result.R_sa_est,
      Tj_est: thRes.result.Tj_est,
      warnings: wLocal,
    });
  }

  formulas.push({
    id: "SWEEP_SPACING_PIPELINE",
    title: "Spacing sweep pipeline",
    latex: "s\\rightarrow \\{N_{fin},A_{flow},D_h,A_{eff}\\}\\rightarrow Q^*\\rightarrow h\\rightarrow R_{sa}\\rightarrow T_j",
    variables: [],
    notes: "For each spacing s, compute operating point and resulting thermal performance.",
  });

  return { result: points, warnings, formulas };
}
