/* =========================
 * src/core/types.ts
 * ========================= */

export type Severity = "info" | "warn" | "error";

export type WarningItem = {
  code: string;
  severity: Severity;
  message: string;
  context?: Record<string, unknown>;
};

export type Variable = { name: string; value: number; unit: string };

export type FormulaItem = {
  id: string;
  title: string;
  latex: string;              // symbolic formula
  substitutedLatex?: string;  // numbers substituted w/ units
  variables: Variable[];
  notes?: string;
};

export type ComputeResult<T> = {
  result: T;
  warnings: WarningItem[];
  formulas: FormulaItem[];
};

/** Basic scalar with units for UI convenience (SI internally). */
export type ScalarSI = { value: number; unit: string };

/* =========================
 * Domain input types
 * ========================= */

/** Air properties at a reference temperature. Use SI units. */
export type AirProps = {
  /** density [kg/m^3] */
  rho: number;
  /** dynamic viscosity [Pa·s] */
  mu: number;
  /** thermal conductivity [W/m·K] */
  k: number;
  /** Prandtl number [-] */
  Pr: number;
};

/** Heatsink "outer" design constraints + fin geometry (meters). */
export type HeatsinkGeomInput = {
  /** base width across fins (total width) [m] */
  W: number;
  /** flow length along fins [m] */
  L: number;
  /** fin height [m] */
  h: number;
  /** fin thickness [m] */
  t: number;
  /** fin spacing (gap) [m] - sweep variable */
  s: number;
};

/** Derived channel/area quantities (meters, m^2) */
export type HeatsinkDerived = {
  /** fin count (approx continuous + discrete) */
  N_fin: number;
  /** channel count */
  N_ch: number;
  /** total flow area across all channels [m^2] */
  A_flow: number;
  /** channel hydraulic diameter [m] */
  Dh: number;
  /** internal convective effective area (inside channels only) [m^2] */
  A_eff: number;
};

/** Fan curve in SI: Q [m^3/s], dp [Pa]. Must be monotone increasing in Q. */
export type FanPoint = { Q: number; dp: number };
export type FanCurve = {
  points: FanPoint[];
  /** optional metadata */
  name?: string;
};

/** Thermal budget inputs (°C, W, °C/W). */
export type ThermalSpecInput = {
  Tj_max: number;  // °C
  Ta: number;      // °C
  Q_heat: number;  // W
  R_jc?: number;   // °C/W
  R_tim?: number;  // °C/W
};

/** Thermal budget computed outputs. */
export type ThermalBudget = {
  R_total_max: number;   // °C/W
  R_sa_target: number;   // °C/W
};

/** Pressure-drop model knobs. */
export type LossModel = {
  /** Sum of minor loss coefficients (entrance/exit, etc.) */
  K_sum: number;
  /** How to compute friction factor f(Re). */
  frictionModel: "simple" | "laminar-rect" | "turbulent-blasius" | "piecewise";
};

/** Pressure-drop outputs at a given Q. */
export type PressureDropAtQ = {
  Q: number;       // m^3/s
  v: number;       // m/s
  Re: number;      // -
  f: number;       // -
  dp: number;      // Pa
  dp_fric: number; // Pa
  dp_minor: number;// Pa
};

/** Operating point solution. */
export type OperatingPoint = {
  Q_star: number;      // m^3/s
  dp_star: number;     // Pa
  method: "iter3" | "bisection";
  /** diagnostic bracket for bisection */
  bracket?: { Q1: number; Q2: number; f1: number; f2: number };
  /** iteration trace if using iter3 */
  iterTrace?: Array<{ k: number; Q: number; dp_hs: number; Q_next: number }>;
};

/** Heat transfer coefficient and intermediate dimensionless numbers. */
export type HeatTransfer = {
  Nu: number;
  h: number;  // W/m^2/K
  Re: number;
  Pr: number;
};

/** Final thermal performance for a geometry. */
export type ThermalPerformance = {
  R_sa_est: number; // °C/W
  Tj_est: number;   // °C
};

/** One curve point in spacing sweep. */
export type SpacingSweepPoint = {
  s: number; // m
  N_fin: number;
  N_ch: number;
  A_flow: number;
  Dh: number;
  A_eff: number;
  Q_star: number;
  dp_star: number;
  Re_star: number;
  h: number;
  R_sa_est: number;
  Tj_est: number;
  warnings: WarningItem[];
};
