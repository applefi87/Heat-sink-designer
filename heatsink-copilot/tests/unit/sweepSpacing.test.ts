import { describe, it, expect } from "vitest";
import { sweepFinSpacingCurve } from "src/core/sweepSpacing";
import type { AirProps, FanCurve, LossModel, ThermalSpecInput } from "src/core/types";

const spec: ThermalSpecInput = { Tj_max: 100, Ta: 25, Q_heat: 50, R_jc: 0.1, R_tim: 0.1 };
const fan: FanCurve = { points: [{ Q: 0, dp: 100 }, { Q: 0.05, dp: 0 }] };
const air: AirProps = { rho: 1.2, mu: 1.8e-5, k: 0.026, Pr: 0.71 };
const loss: LossModel = { K_sum: 2, frictionModel: "simple" };

describe("sweepFinSpacingCurve", () => {
  it("returns array length n_points", () => {
    const res = sweepFinSpacingCurve(spec, fan, air, loss, {
      base: { W: 0.1, L: 0.05, h: 0.02, t: 0.001 },
      sGrid: [0.001, 0.0015, 0.002],
      eta_o: 0.8,
      useBisectionRefine: true,
      bisectionRange: { Qmin: 0, Qmax: 0.05 },
      nuModel: "mvp-piecewise",
    });
    expect(res.result.length).toBe(3);
  });

  it("best point has min Tj_est", () => {
    const res = sweepFinSpacingCurve(spec, fan, air, loss, {
      base: { W: 0.1, L: 0.05, h: 0.02, t: 0.001 },
      sGrid: [0.001, 0.0015, 0.002],
      eta_o: 0.8,
      useBisectionRefine: true,
      bisectionRange: { Qmin: 0, Qmax: 0.05 },
      nuModel: "mvp-piecewise",
    });
    const temps = res.result.map((p) => p.Tj_est);
    const min = Math.min(...temps);
    expect(temps).toContain(min);
  });
});
