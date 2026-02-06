/* =========================
 * src/core/appModel.ts
 * ========================= */

import type { FormulaItem, WarningItem, ThermalBudget, FanCurve, HeatsinkDerived, OperatingPoint, HeatTransfer, ThermalPerformance, SpacingSweepPoint } from "./types";

export type UnitsMode = "si" | "user";

export type DraftStateV1 = {
  version: 1;
  unitsMode: UnitsMode;
  showAdvanced: boolean;
  thermal: {
    Tj_max_C: number;
    Ta_C: number;
    Q_heat_W: number;
    R_jc_C_per_W: number;
    R_tim_C_per_W: number;
  };
  fan: {
    curveSource: "default" | "textarea" | "csv";
    curveName: string;
    pointsText: string;
    units: { Q: "m3s" | "cfm"; dp: "pa" | "inh2o" };
    rpm_ref: number;
    rpm_new: number;
  };
  geom: {
    W_m: number;
    L_m: number;
    h_m: number;
    t_m: number;
    s_m: number;
  };
  loss: {
    K_sum: number;
    frictionModel: "simple" | "laminar-rect" | "turbulent-blasius" | "piecewise";
  };
  air: {
    rho: number;
    mu: number;
    k: number;
    Pr: number;
  };
  solver: {
    mode: "fast_iter3" | "robust_iter3_bisect";
    eta_o: number;
    nuModel: "mvp-piecewise" | "paper-correlation";
  };
  sweep1d: {
    s_min_m: number;
    s_max_m: number;
    n_points: number;
  };
  sweep2d: {
    s_min_m: number;
    s_max_m: number;
    s_steps: number;
    h_min_m: number;
    h_max_m: number;
    h_steps: number;
  };
};

export type DraftState = DraftStateV1;

export type StepId = "A" | "B" | "C" | "D" | "E";

export type AggregatedFormulas = {
  ordered: Array<{ step: StepId; items: FormulaItem[] }>;
  flat: FormulaItem[];
  byId: Record<string, FormulaItem>;
  duplicateIds: string[];
};

export type AggregatedWarnings = {
  ordered: Array<{ step: StepId; items: WarningItem[] }>;
  flat: WarningItem[];
  counts: { info: number; warn: number; error: number };
  hasError: boolean;
};

export type RunOutputs = {
  budget: ThermalBudget;
  fanValidated: FanCurve;
  fanScaled: FanCurve;
  derived: HeatsinkDerived;
  opIter3: OperatingPoint;
  opFinal: OperatingPoint;
  heatTransfer: HeatTransfer;
  thermalPerf: ThermalPerformance;
  passBudget: boolean;
  margin_Rsa: number;
};

export type RunResultV1 = {
  version: 1;
  runId: string;
  createdAtISO: string;
  input: DraftStateV1;
  outputs: RunOutputs;
  warnings: AggregatedWarnings;
  formulas: AggregatedFormulas;
  sweep1d?: {
    config: DraftStateV1["sweep1d"];
    points: SpacingSweepPoint[];
    bestIndex: number;
  };
  sweep2d?: {
    config: DraftStateV1["sweep2d"];
    points: Array<{ s_m: number; h_m: number; Tj_est: number; Q_star: number; dp_star: number; ok: boolean }>;
    top3: Array<{ s_m: number; h_m: number; Tj_est: number; Q_star: number; dp_star: number }>;
  };
};

export type RunResult = RunResultV1;

export type RunsStoreV1 = { version: 1; items: RunResultV1[] };
export type RunsStore = RunsStoreV1;
