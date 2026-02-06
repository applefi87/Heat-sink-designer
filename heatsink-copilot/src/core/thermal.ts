/* =========================
 * src/core/thermal.ts
 * ========================= */

import { ComputeResult, ThermalPerformance, WarningItem, FormulaItem, ThermalSpecInput } from "./types";

/**
 * Compute internal-convection-only thermal performance:
 *   R_sa = 1 / (eta_o * h * A_eff)
 *   Tj = Ta + Q_heat * (R_jc + R_tim + R_sa)
 */
export function computeThermalPerformance(
  spec: ThermalSpecInput,
  h: number,
  A_eff: number,
  eta_o: number
): ComputeResult<ThermalPerformance> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];

  const R_jc = spec.R_jc ?? 0;
  const R_tim = spec.R_tim ?? 0;

  const R_sa_est = (eta_o > 0 && h > 0 && A_eff > 0) ? 1 / (eta_o * h * A_eff) : Infinity;
  const Tj_est = spec.Ta + spec.Q_heat * (R_jc + R_tim + R_sa_est);

  formulas.push({
    id: "THERMAL_RSA",
    title: "Heatsink thermal resistance (internal convection only)",
    latex: "R_{sa}=\\frac{1}{\\eta_o\\,h\\,A_{eff}}",
    substitutedLatex: `R_{sa}=\\frac{1}{${eta_o}\\cdot ${h.toFixed(1)}\\cdot ${A_eff.toExponential(3)}}=${R_sa_est.toFixed(4)}\\,^{\\circ}C/W`,
    variables: [
      { name: "\\eta_o", value: eta_o, unit: "-" },
      { name: "h", value: h, unit: "W/m^2/K" },
      { name: "A_{eff}", value: A_eff, unit: "m^2" },
    ],
  });

  formulas.push({
    id: "THERMAL_TJ",
    title: "Junction temperature estimate",
    latex: "T_j=T_a + Q\\,(R_{jc}+R_{tim}+R_{sa})",
    substitutedLatex: `T_j=${spec.Ta}+${spec.Q_heat}\\cdot(${R_jc.toFixed(4)}+${R_tim.toFixed(4)}+${R_sa_est.toFixed(4)})=${Tj_est.toFixed(2)}\\,^{\\circ}C`,
    variables: [
      { name: "T_a", value: spec.Ta, unit: "°C" },
      { name: "Q", value: spec.Q_heat, unit: "W" },
      { name: "R_{jc}", value: R_jc, unit: "°C/W" },
      { name: "R_{tim}", value: R_tim, unit: "°C/W" },
      { name: "R_{sa}", value: R_sa_est, unit: "°C/W" },
    ],
  });

  return { result: { R_sa_est, Tj_est }, warnings, formulas };
}
