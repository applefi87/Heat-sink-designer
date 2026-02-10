/* =========================
 * src/core/pressureDrop.ts
 * ========================= */

import { AirProps, ComputeResult, HeatsinkDerived, LossModel, PressureDropAtQ, WarningItem, FormulaItem } from "./types";
import { W } from "./warnings";

/**
 * Compute heatsink internal-channel pressure drop at a given Q.
 *
 * Steps:
 *  1) v = Q / A_flow
 *  2) Re = rho * v * Dh / mu
 *  3) friction factor f = f(Re) (model-dependent)
 *  4) dp = ( f*L/Dh + K_sum ) * (rho*v^2/2)
 *
 * Formula:
 *  ΔP_hs(Q) = ( f(Re)*L/Dh + ΣK ) * ρ v^2 / 2
 */
export function computePressureDropAtQ(
  Q: number,
  derived: HeatsinkDerived,
  air: AirProps,
  model: LossModel,
  L: number
): ComputeResult<PressureDropAtQ> {
  const warnings: WarningItem[] = [];
  const formulas: FormulaItem[] = [];

  if (derived.A_flow <= 0 || derived.Dh <= 0 || derived.N_ch < 1) {
    warnings.push({
      code: W.GEOM_NO_CHANNEL,
      severity: "error",
      message: "Cannot compute pressure drop: invalid channel geometry.",
      context: derived,
    });
    return {
      result: { Q, v: 0, Re: 0, f: 0, dp: Infinity, dp_fric: Infinity, dp_minor: Infinity },
      warnings,
      formulas,
    };
  }

  const v = Q / derived.A_flow;
  const Re = (air.rho * v * derived.Dh) / air.mu;

  // friction factor model (MVP)
  const f = frictionFactor(Re, model.frictionModel);

  if (Re < 50 || Re > 1e5) {
    warnings.push({
      code: W.RE_OUT_OF_RANGE,
      severity: "info",
      message: "Re is outside typical correlation comfort range; results may be less accurate.",
      context: { Re },
    });
  }

  const dyn = 0.5 * air.rho * v * v;
  const termFric = f * (L / derived.Dh);
  const termMinor = model.K_sum;

  const dp_fric = termFric * dyn;
  const dp_minor = termMinor * dyn;
  const dp = dp_fric + dp_minor;

  formulas.push({
    id: "DP_DARCY_WEISBACH",
    title: "Heatsink channel pressure drop (Darcy–Weisbach + minor losses)",
    latex: "\\Delta P_{hs}(Q)=\\left(\\frac{f(Re)\\,L}{D_h}+\\sum K\\right)\\frac{\\rho v^2}{2},\\quad v=\\frac{Q}{A_{flow}},\\quad Re=\\frac{\\rho v D_h}{\\mu}",
    substitutedLatex: `v=\\frac{${Q.toExponential(3)}}{${derived.A_flow.toExponential(3)}}=${v.toFixed(3)}\\,m/s,\\;Re=${Re.toFixed(0)},\\;\\Delta P=${dp.toFixed(1)}\\,Pa`,
    variables: [
      { name: "Q", value: Q, unit: "m^3/s" },
      { name: "A_{flow}", value: derived.A_flow, unit: "m^2" },
      { name: "D_h", value: derived.Dh, unit: "m" },
      { name: "L", value: L, unit: "m" },
      { name: "\\rho", value: air.rho, unit: "kg/m^3" },
      { name: "\\mu", value: air.mu, unit: "Pa·s" },
      { name: "f", value: f, unit: "-" },
      { name: "\\sum K", value: model.K_sum, unit: "-" },
    ],
    notes: "MVP friction model; can be upgraded to rectangular-channel correlations later.",
  });

  return {
    result: { Q, v, Re, f, dp, dp_fric, dp_minor },
    warnings,
    formulas,
  };
}

/** MVP friction factor models (upgradeable). */
export function frictionFactor(Re: number, model: LossModel["frictionModel"]): number {
  if (Re <= 0) return 0;

  switch (model) {
    case "simple":
      // crude: laminar 64/Re, turbulent Blasius 0.3164/Re^0.25 (pipe-like)
      return Re < 2300 ? 64 / Re : 0.3164 / Math.pow(Re, 0.25);

    case "turbulent-blasius":
      return 0.3164 / Math.pow(Re, 0.25);

    case "laminar-rect":
      // placeholder: use 96/Re for parallel plates (order-of-magnitude), can refine later
      return 96 / Re;

    case "piecewise":
    default:
      if (Re < 2300) return 96 / Re;
      if (Re < 4000) {
        // linear blend transition
        const f1 = 96 / 2300;
        const f2 = 0.3164 / Math.pow(4000, 0.25);
        const t = (Re - 2300) / (4000 - 2300);
        return f1 + t * (f2 - f1);
      }
      return 0.3164 / Math.pow(Re, 0.25);
  }
}
