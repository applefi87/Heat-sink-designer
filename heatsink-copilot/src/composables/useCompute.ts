/* =========================
 * src/composables/useCompute.ts
 * ========================= */

import { computeThermalBudget } from "src/core/thermalBudget";
import { validateFanCurve, scaleFanCurveByRpm } from "src/core/fan";
import { deriveHeatsinkGeometry } from "src/core/geometry";
import { solveOperatingPointIter3, solveOperatingPointBisection } from "src/core/operatingPoint";
import { computeHeatTransfer } from "src/core/heatTransfer";
import { computeThermalPerformance } from "src/core/thermal";
import { defaultFanCurveSI } from "src/core/defaults";
import { parseFanCurveCSV, parseFanCurveText } from "src/core/validators";
import { cfmToM3s, inH2OToPa } from "src/core/units";
import type { DraftStateV1, RunResultV1, AggregatedFormulas, AggregatedWarnings, StepId } from "src/core/appModel";
import type { FormulaItem, WarningItem, FanCurve } from "src/core/types";

function buildRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function aggregateFormulas(steps: Array<{ step: StepId; items: FormulaItem[] }>): AggregatedFormulas {
  const flat = steps.flatMap((s) => s.items);
  const byId: Record<string, FormulaItem> = {};
  const seen = new Set<string>();
  const dupes: string[] = [];
  flat.forEach((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      byId[item.id] = item;
    } else if (!dupes.includes(item.id)) {
      dupes.push(item.id);
    }
  });
  return { ordered: steps, flat, byId, duplicateIds: dupes };
}

function aggregateWarnings(steps: Array<{ step: StepId; items: WarningItem[] }>): AggregatedWarnings {
  const flat = steps.flatMap((s) => s.items);
  const counts = {
    info: flat.filter((w) => w.severity === "info").length,
    warn: flat.filter((w) => w.severity === "warn").length,
    error: flat.filter((w) => w.severity === "error").length,
  };
  return { ordered: steps, flat, counts, hasError: counts.error > 0 };
}

function buildFanCurveFromDraft(draft: DraftStateV1): FanCurve {
  if (draft.fan.curveSource === "default") return defaultFanCurveSI();
  if (draft.fan.curveSource === "csv") {
    return parseFanCurveCSV(draft.fan.pointsText, draft.fan.curveName).curve;
  }
  return parseFanCurveText(draft.fan.pointsText, draft.fan.curveName).curve;
}

function convertFanCurveToSI(curve: FanCurve, draft: DraftStateV1): FanCurve {
  const qUnit = draft.fan.units.Q;
  const dpUnit = draft.fan.units.dp;
  return {
    ...curve,
    points: curve.points.map((p) => ({
      Q: qUnit === "cfm" ? cfmToM3s(p.Q) : p.Q,
      dp: dpUnit === "inh2o" ? inH2OToPa(p.dp) : p.dp,
    })),
  };
}

export function computeRun(draft: DraftStateV1): RunResultV1 {
  const stepFormulas: Array<{ step: StepId; items: FormulaItem[] }> = [];
  const stepWarnings: Array<{ step: StepId; items: WarningItem[] }> = [];

  // Step A
  const budgetRes = computeThermalBudget({
    Tj_max: draft.thermal.Tj_max_C,
    Ta: draft.thermal.Ta_C,
    Q_heat: draft.thermal.Q_heat_W,
    R_jc: draft.thermal.R_jc_C_per_W,
    R_tim: draft.thermal.R_tim_C_per_W,
  });
  stepFormulas.push({ step: "A", items: budgetRes.formulas });
  stepWarnings.push({ step: "A", items: budgetRes.warnings });

  // Step B
  const rawCurve = buildFanCurveFromDraft(draft);
  const siCurve = convertFanCurveToSI(rawCurve, draft);
  const validatedRes = validateFanCurve(siCurve);
  stepFormulas.push({ step: "B", items: validatedRes.formulas });
  stepWarnings.push({ step: "B", items: validatedRes.warnings });
  let fanScaled = validatedRes.result;
  if (draft.fan.rpm_new !== draft.fan.rpm_ref) {
    const scaledRes = scaleFanCurveByRpm(validatedRes.result, draft.fan.rpm_ref, draft.fan.rpm_new);
    fanScaled = scaledRes.result;
    stepFormulas[stepFormulas.length - 1].items = stepFormulas[stepFormulas.length - 1].items.concat(scaledRes.formulas);
    stepWarnings[stepWarnings.length - 1].items = stepWarnings[stepWarnings.length - 1].items.concat(scaledRes.warnings);
  }

  // Step C
  const derivedRes = deriveHeatsinkGeometry({
    W: draft.geom.W_m,
    L: draft.geom.L_m,
    h: draft.geom.h_m,
    t: draft.geom.t_m,
    s: draft.geom.s_m,
  });
  stepFormulas.push({ step: "C", items: derivedRes.formulas });
  stepWarnings.push({ step: "C", items: derivedRes.warnings });

  // Step D
  const opIter3Res = solveOperatingPointIter3(
    fanScaled,
    derivedRes.result,
    draft.air,
    draft.loss,
    draft.geom.L_m
  );
  stepFormulas.push({ step: "D", items: opIter3Res.formulas });
  stepWarnings.push({ step: "D", items: opIter3Res.warnings });

  let opFinal = opIter3Res.result;
  if (draft.solver.mode === "robust_iter3_bisect") {
    const Qmax = Math.max(...fanScaled.points.map((p) => p.Q));
    const bisRes = solveOperatingPointBisection(
      fanScaled,
      derivedRes.result,
      draft.air,
      draft.loss,
      draft.geom.L_m,
      0,
      Qmax
    );
    stepFormulas[stepFormulas.length - 1].items = stepFormulas[stepFormulas.length - 1].items.concat(bisRes.formulas);
    stepWarnings[stepWarnings.length - 1].items = stepWarnings[stepWarnings.length - 1].items.concat(bisRes.warnings);
    if (Number.isFinite(bisRes.result.Q_star)) {
      opFinal = bisRes.result;
    }
  }

  const htRes = computeHeatTransfer(opFinal.Q_star, derivedRes.result, draft.air, draft.solver.nuModel);
  stepFormulas[stepFormulas.length - 1].items = stepFormulas[stepFormulas.length - 1].items.concat(htRes.formulas);
  stepWarnings[stepWarnings.length - 1].items = stepWarnings[stepWarnings.length - 1].items.concat(htRes.warnings);

  const perfRes = computeThermalPerformance(
    {
      Tj_max: draft.thermal.Tj_max_C,
      Ta: draft.thermal.Ta_C,
      Q_heat: draft.thermal.Q_heat_W,
      R_jc: draft.thermal.R_jc_C_per_W,
      R_tim: draft.thermal.R_tim_C_per_W,
    },
    htRes.result.h,
    derivedRes.result.A_eff,
    draft.solver.eta_o
  );
  stepFormulas[stepFormulas.length - 1].items = stepFormulas[stepFormulas.length - 1].items.concat(perfRes.formulas);
  stepWarnings[stepWarnings.length - 1].items = stepWarnings[stepWarnings.length - 1].items.concat(perfRes.warnings);

  const passBudget = Number.isFinite(perfRes.result.R_sa_est) && Number.isFinite(budgetRes.result.R_sa_target)
    ? perfRes.result.R_sa_est <= budgetRes.result.R_sa_target
    : false;
  const margin_Rsa = budgetRes.result.R_sa_target - perfRes.result.R_sa_est;

  const formulas = aggregateFormulas(stepFormulas);
  const warnings = aggregateWarnings(stepWarnings);

  return {
    version: 1,
    runId: buildRunId(),
    createdAtISO: new Date().toISOString(),
    input: JSON.parse(JSON.stringify(draft)) as DraftStateV1,
    outputs: {
      budget: budgetRes.result,
      fanValidated: validatedRes.result,
      fanScaled,
      derived: derivedRes.result,
      opIter3: opIter3Res.result,
      opFinal,
      heatTransfer: htRes.result,
      thermalPerf: perfRes.result,
      passBudget,
      margin_Rsa,
    },
    warnings,
    formulas,
  };
}
