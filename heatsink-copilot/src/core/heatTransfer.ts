/* =========================
 * src/core/heatTransfer.ts
 * ========================= */

import { AirProps, ComputeResult, HeatTransfer, HeatsinkDerived, WarningItem, FormulaItem } from "./types";
import { W } from "./warnings";

/**
 * Compute heat transfer coefficient h based on:
 *   h = Nu * k / Dh
 *
 * MVP Nu model (upgradeable):
 * - If laminar: Nu ~ constant (parallel plates, fully developed, boundary conditions dependent)
 * - If turbulent: Nu via Dittus-Boelter-like (placeholder)
 *
 * IMPORTANT: This is where you can later swap in a paper-grade rectangular-channel correlation.
 */
export function computeHeatTransfer(
  Q_star: number,
  derived: HeatsinkDerived,
  air: AirProps,
  nuModel: "mvp-piecewise" | "paper-correlation"
): ComputeResult<HeatTransfer> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];

  const v = derived.A_flow > 0 ? Q_star / derived.A_flow : 0;
  const Re = derived.Dh > 0 ? (air.rho * v * derived.Dh) / air.mu : 0;

  let Nu: number;

  if (nuModel === "mvp-piecewise") {
    // MVP: choose a constant Nu in laminar; use simple turbulent placeholder
    if (Re < 2300) {
      // NOTE: constant depends on boundary condition and aspect ratio. Use placeholder + info warning.
      Nu = 7.54; // common order for fully developed laminar between plates (one typical case)
      warnings.push({
        code: W.MODEL_SIMPLIFIED,
        severity: "info",
        message: "Using simplified laminar Nu constant (MVP). Replace with rectangular-channel correlation for accuracy.",
        context: { Nu },
      });
    } else {
      // turbulent placeholder (not exact for ducts): Nu = 0.023 Re^0.8 Pr^0.4
      Nu = 0.023 * Math.pow(Re, 0.8) * Math.pow(air.Pr, 0.4);
      warnings.push({
        code: W.MODEL_SIMPLIFIED,
        severity: "info",
        message: "Using simplified turbulent Nu model (MVP). Replace with duct correlation for accuracy.",
        context: { Nu },
      });
    }
  } else {
    // reserved for future: implement paper-grade correlation here
    Nu = 7.54;
    warnings.push({
      code: W.MODEL_SIMPLIFIED,
      severity: "info",
      message: "paper-correlation mode not implemented yet; fallback to MVP constant.",
    });
  }

  const h = derived.Dh > 0 ? (Nu * air.k) / derived.Dh : 0;

  formulas.push({
    id: "HT_NU_H",
    title: "Heat transfer coefficient from Nusselt number",
    latex: "h=\\frac{Nu\\,k}{D_h},\\quad Re=\\frac{\\rho v D_h}{\\mu},\\quad v=\\frac{Q^*}{A_{flow}}",
    substitutedLatex: `Re=${Re.toFixed(0)},\\;Nu=${Nu.toFixed(2)},\\;h=\\frac{${Nu.toFixed(2)}\\cdot ${air.k}}{${derived.Dh.toExponential(3)}}=${h.toFixed(1)}\\,W/m^2/K`,
    variables: [
      { name: "Nu", value: Nu, unit: "-" },
      { name: "k", value: air.k, unit: "W/m·K" },
      { name: "D_h", value: derived.Dh, unit: "m" },
      { name: "Re", value: Re, unit: "-" },
      { name: "Q^*", value: Q_star, unit: "m^3/s" },
      { name: "A_{flow}", value: derived.A_flow, unit: "m^2" },
    ],
  });

  return { result: { Nu, h, Re, Pr: air.Pr }, warnings, formulas };
}
