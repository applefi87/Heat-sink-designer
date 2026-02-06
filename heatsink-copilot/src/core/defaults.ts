/* =========================
 * src/core/defaults.ts
 * ========================= */

import type { DraftStateV1 } from "./appModel";
import type { AirProps, FanCurve, LossModel } from "./types";

export function defaultDraftState(): DraftStateV1 {
  return {
    version: 1,
    unitsMode: "user",
    showAdvanced: false,
    thermal: {
      Tj_max_C: 100,
      Ta_C: 25,
      Q_heat_W: 60,
      R_jc_C_per_W: 0.15,
      R_tim_C_per_W: 0.1,
    },
    fan: {
      curveSource: "default",
      curveName: "Default Fan",
      pointsText: "",
      units: { Q: "cfm", dp: "pa" },
      rpm_ref: 3000,
      rpm_new: 3000,
    },
    geom: {
      W_m: 0.1,
      L_m: 0.05,
      h_m: 0.02,
      t_m: 0.001,
      s_m: 0.0015,
    },
    loss: {
      K_sum: 2.0,
      frictionModel: "piecewise",
    },
    air: {
      rho: 1.184,
      mu: 1.85e-5,
      k: 0.0262,
      Pr: 0.71,
    },
    solver: {
      mode: "robust_iter3_bisect",
      eta_o: 0.8,
      nuModel: "mvp-piecewise",
    },
    sweep1d: {
      s_min_m: 0.0008,
      s_max_m: 0.003,
      n_points: 25,
    },
    sweep2d: {
      s_min_m: 0.0008,
      s_max_m: 0.003,
      s_steps: 10,
      h_min_m: 0.01,
      h_max_m: 0.03,
      h_steps: 10,
    },
  };
}

export function defaultFanCurveSI(): FanCurve {
  return {
    name: "Default Fan",
    points: [
      { Q: 0.0, dp: 120 },
      { Q: 0.01, dp: 100 },
      { Q: 0.02, dp: 80 },
      { Q: 0.03, dp: 55 },
      { Q: 0.04, dp: 30 },
      { Q: 0.05, dp: 10 },
      { Q: 0.055, dp: 0 },
    ],
  };
}

export function defaultAirProps(): AirProps {
  return {
    rho: 1.184,
    mu: 1.85e-5,
    k: 0.0262,
    Pr: 0.71,
  };
}

export function defaultLossModel(): LossModel {
  return {
    K_sum: 2.0,
    frictionModel: "piecewise",
  };
}
