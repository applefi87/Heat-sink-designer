/* =========================
 * src/workers/sweepWorker.ts
 * ========================= */

import { deriveHeatsinkGeometry } from "src/core/geometry";
import { solveOperatingPointIter3, solveOperatingPointBisection } from "src/core/operatingPoint";
import { computeHeatTransfer } from "src/core/heatTransfer";
import { computeThermalPerformance } from "src/core/thermal";
import type { DraftStateV1 } from "src/core/appModel";
import type { FanCurve } from "src/core/types";

export type Sweep2DRequest = {
  draft: DraftStateV1;
  fanScaled: FanCurve;
};

export type Sweep2DProgress = { type: "progress"; done: number; total: number; percent: number };
export type Sweep2DResult = {
  type: "result";
  points: Array<{ s_m: number; h_m: number; Tj_est: number; Q_star: number; dp_star: number; ok: boolean }>;
  top3: Array<{ s_m: number; h_m: number; Tj_est: number; Q_star: number; dp_star: number }>;
};

function post(message: Sweep2DProgress | Sweep2DResult) {
  // eslint-disable-next-line no-restricted-globals
  postMessage(message);
}

// eslint-disable-next-line no-restricted-globals
onmessage = (evt: MessageEvent<Sweep2DRequest>) => {
  const { draft, fanScaled } = evt.data;
  const sMin = draft.sweep2d.s_min_m;
  const sMax = draft.sweep2d.s_max_m;
  const hMin = draft.sweep2d.h_min_m;
  const hMax = draft.sweep2d.h_max_m;
  const sSteps = draft.sweep2d.s_steps;
  const hSteps = draft.sweep2d.h_steps;

  const sGrid = Array.from({ length: sSteps }, (_, i) => sMin + (i / (sSteps - 1)) * (sMax - sMin));
  const hGrid = Array.from({ length: hSteps }, (_, i) => hMin + (i / (hSteps - 1)) * (hMax - hMin));

  const total = sGrid.length * hGrid.length;
  let done = 0;

  const points: Array<{ s_m: number; h_m: number; Tj_est: number; Q_star: number; dp_star: number; ok: boolean }> = [];

  for (const s of sGrid) {
    for (const h of hGrid) {
      const derivedRes = deriveHeatsinkGeometry({
        W: draft.geom.W_m,
        L: draft.geom.L_m,
        h,
        t: draft.geom.t_m,
        s,
      });

      let ok = derivedRes.result.N_ch >= 1;
      let Q_star = NaN;
      let dp_star = NaN;
      let Tj_est = NaN;

      if (ok) {
        const opIter3 = solveOperatingPointIter3(fanScaled, derivedRes.result, draft.air, draft.loss, draft.geom.L_m).result;
        const Qmax = Math.max(...fanScaled.points.map((p) => p.Q));
        const opBis = solveOperatingPointBisection(
          fanScaled,
          derivedRes.result,
          draft.air,
          draft.loss,
          draft.geom.L_m,
          0,
          Qmax
        ).result;
        const opFinal = Number.isFinite(opBis.Q_star) ? opBis : opIter3;
        Q_star = opFinal.Q_star;
        dp_star = opFinal.dp_star;
        if (Number.isFinite(Q_star)) {
          const ht = computeHeatTransfer(Q_star, derivedRes.result, draft.air, draft.solver.nuModel).result;
          const perf = computeThermalPerformance(
            {
              Tj_max: draft.thermal.Tj_max_C,
              Ta: draft.thermal.Ta_C,
              Q_heat: draft.thermal.Q_heat_W,
              R_jc: draft.thermal.R_jc_C_per_W,
              R_tim: draft.thermal.R_tim_C_per_W,
            },
            ht.h,
            derivedRes.result.A_eff,
            draft.solver.eta_o
          ).result;
          Tj_est = perf.Tj_est;
          ok = Number.isFinite(Tj_est);
        } else {
          ok = false;
        }
      }

      points.push({ s_m: s, h_m: h, Tj_est, Q_star, dp_star, ok });
      done += 1;
      post({ type: "progress", done, total, percent: Math.round((done / total) * 100) });
    }
  }

  const sorted = points.filter((p) => p.ok).sort((a, b) => a.Tj_est - b.Tj_est).slice(0, 3);
  post({ type: "result", points, top3: sorted.map((p) => ({ s_m: p.s_m, h_m: p.h_m, Tj_est: p.Tj_est, Q_star: p.Q_star, dp_star: p.dp_star })) });
};
