/* =========================
 * src/core/geometry.ts
 * ========================= */

import { ComputeResult, HeatsinkGeomInput, HeatsinkDerived, WarningItem, FormulaItem } from "./types";
import { W } from "./warnings";

/**
 * Derive fin count, channel count, flow area, hydraulic diameter, and effective convective area
 * considering ONLY internal channel convection (ignore external areas).
 *
 * Geometry (continuous approx; in UI you may also show floor'd integer):
 *   N_fin ≈ W / (t + s)
 *   N_ch ≈ N_fin - 1
 *   A_flow = N_ch * s * h
 *   D_h = 2 s h / (s + h)   (rect/parallel-plate approximation)
 *   A_eff = N_ch * (2 L h + L s)  (two fin walls + channel bottom, no fin tip)
 */
export function deriveHeatsinkGeometry(input: HeatsinkGeomInput): ComputeResult<HeatsinkDerived> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];

  const { W: width, L, h, t, s } = input;

  if (width <= 0 || L <= 0 || h <= 0 || t <= 0 || s <= 0) {
    warnings.push({ code: W.GEOM_INVALID, severity: "error", message: "All geometry dimensions must be > 0.", context: input });
  }

  const N_fin_cont = width / (t + s);
  const N_fin = Math.max(1, Math.floor(N_fin_cont)); // discrete fins
  const N_ch = Math.max(0, N_fin - 1);

  if (N_ch < 1) {
    warnings.push({
      code: W.GEOM_NO_CHANNEL,
      severity: "error",
      message: "No internal flow channel exists (N_ch < 1). Increase width W or reduce fin thickness t / adjust spacing s.",
      context: { N_fin, N_ch },
    });
  }

  // DFM hint example: fin spacing < 0.8 mm
  if (s < 0.0008) {
    warnings.push({
      code: W.DFM_FIN_SPACING_LOW,
      severity: "warn",
      message: "Fin spacing is very small (<0.8 mm). Manufacturing tolerance / clogging risk may be high.",
      context: { s_m: s, s_mm: s * 1000 },
    });
  }

  const A_flow = N_ch * s * h;
  if (A_flow > 0 && A_flow < 1e-5) {
    warnings.push({
      code: W.FLOW_AREA_TOO_SMALL,
      severity: "warn",
      message: "Total flow area is very small. Expect high velocity and pressure drop.",
      context: { A_flow },
    });
  }

  const Dh = (2 * s * h) / (s + h); // [m]
  const A_eff = N_ch * (2 * L * h + L * s);

  formulas.push({
    id: "GEOM_N_FIN",
    title: "Fin count",
    latex: "N_{fin} = \\left\\lfloor \\frac{W}{t+s} \\right\\rfloor",
    substitutedLatex: `N_{fin} = \\left\\lfloor \\frac{${width}\\,m}{${t}\\,m + ${s}\\,m} \\right\\rfloor = ${N_fin}`,
    variables: [
      { name: "W", value: width, unit: "m" },
      { name: "t", value: t, unit: "m" },
      { name: "s", value: s, unit: "m" },
    ],
  });

  formulas.push({
    id: "GEOM_A_FLOW",
    title: "Total flow area",
    latex: "A_{flow} = N_{ch}\\,s\\,h",
    substitutedLatex: `A_{flow} = ${N_ch}\\cdot ${s}\\,m \\cdot ${h}\\,m = ${A_flow.toExponential(3)}\\,m^2`,
    variables: [
      { name: "N_{ch}", value: N_ch, unit: "-" },
      { name: "s", value: s, unit: "m" },
      { name: "h", value: h, unit: "m" },
    ],
  });

  formulas.push({
    id: "GEOM_DH",
    title: "Hydraulic diameter (rect/parallel-plate approximation)",
    latex: "D_h = \\frac{2 s h}{s+h}",
    substitutedLatex: `D_h = \\frac{2\\cdot ${s}\\cdot ${h}}{${s}+${h}} = ${Dh.toExponential(3)}\\,m`,
    variables: [
      { name: "s", value: s, unit: "m" },
      { name: "h", value: h, unit: "m" },
    ],
    notes: "This is a common approximation for rectangular/parallel-plate channels.",
  });

  formulas.push({
    id: "GEOM_A_EFF_INTERNAL",
    title: "Internal effective convection area (channels only)",
    latex: "A_{eff} = N_{ch}\\,(2 L h + L s)",
    substitutedLatex: `A_{eff} = ${N_ch}\\,(2\\cdot ${L}\\cdot ${h} + ${L}\\cdot ${s}) = ${A_eff.toExponential(3)}\\,m^2`,
    variables: [
      { name: "N_{ch}", value: N_ch, unit: "-" },
      { name: "L", value: L, unit: "m" },
      { name: "h", value: h, unit: "m" },
      { name: "s", value: s, unit: "m" },
    ],
    notes: "Excludes external areas and fin tips per MVP requirement.",
  });

  return { result: { N_fin, N_ch, A_flow, Dh, A_eff }, warnings, formulas };
}
