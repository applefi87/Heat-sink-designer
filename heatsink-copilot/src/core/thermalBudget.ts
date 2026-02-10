/* =========================
 * src/core/thermalBudget.ts
 * ========================= */

import { ComputeResult, ThermalSpecInput, ThermalBudget, WarningItem, FormulaItem } from "./types";
import { W } from "./warnings";

/**
 * Compute thermal resistance budget.
 *
 * Formulas:
 *   R_total,max = (Tj_max - Ta) / Q_heat
 *   R_sa,target = R_total,max - R_jc - R_tim
 */
export function computeThermalBudget(input: ThermalSpecInput): ComputeResult<ThermalBudget> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];

  const R_jc = input.R_jc ?? 0;
  const R_tim = input.R_tim ?? 0;

  const R_total_max = (input.Tj_max - input.Ta) / input.Q_heat;
  const R_sa_target = R_total_max - R_jc - R_tim;

  if (R_sa_target <= 0) {
    warnings.push({
      code: W.BUDGET_NEGATIVE,
      severity: "error",
      message: "Remaining sink thermal resistance (R_sa_target) <= 0. Budget is exhausted.",
      context: { R_sa_target, R_total_max, R_jc, R_tim },
    });
  }

  formulas.push({
    id: "BUDGET_R_TOTAL_MAX",
    title: "Total thermal resistance limit",
    latex: "R_{total,max} = \\frac{T_{j,max}-T_a}{Q}",
    substitutedLatex: `R_{total,max} = \\frac{${input.Tj_max}\\,^{\\circ}C - ${input.Ta}\\,^{\\circ}C}{${input.Q_heat}\\,W} = ${R_total_max.toFixed(4)}\\,^{\\circ}C/W`,
    variables: [
      { name: "T_{j,max}", value: input.Tj_max, unit: "°C" },
      { name: "T_a", value: input.Ta, unit: "°C" },
      { name: "Q", value: input.Q_heat, unit: "W" },
    ],
  });

  formulas.push({
    id: "BUDGET_R_SA_TARGET",
    title: "Heatsink thermal resistance target",
    latex: "R_{sa,target} = R_{total,max} - R_{jc} - R_{tim}",
    substitutedLatex: `R_{sa,target} = ${R_total_max.toFixed(4)} - ${R_jc.toFixed(4)} - ${R_tim.toFixed(4)} = ${R_sa_target.toFixed(4)}\\,^{\\circ}C/W`,
    variables: [
      { name: "R_{total,max}", value: R_total_max, unit: "°C/W" },
      { name: "R_{jc}", value: R_jc, unit: "°C/W" },
      { name: "R_{tim}", value: R_tim, unit: "°C/W" },
    ],
  });

  return { result: { R_total_max, R_sa_target }, warnings, formulas };
}
