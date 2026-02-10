import { describe, it, expect } from "vitest";
import { solveOperatingPointBisection, solveOperatingPointIter3 } from "src/core/operatingPoint";
import { deriveHeatsinkGeometry } from "src/core/geometry";
import type { AirProps, FanCurve, LossModel } from "src/core/types";

const fan: FanCurve = {
  points: [
    { Q: 0, dp: 100 },
    { Q: 0.05, dp: 0 },
  ],
};

const air: AirProps = { rho: 1.2, mu: 1.8e-5, k: 0.026, Pr: 0.71 };
const loss: LossModel = { K_sum: 2, frictionModel: "simple" };
const geom = deriveHeatsinkGeometry({ W: 0.1, L: 0.05, h: 0.02, t: 0.001, s: 0.002 }).result;

describe("operatingPoint", () => {
  it("bisection finds intersection", () => {
    const res = solveOperatingPointBisection(fan, geom, air, loss, 0.05, 0, 0.05);
    expect(res.result.Q_star).toBeGreaterThan(0);
  });

  it("no intersection returns NO_OPERATING_POINT", () => {
    const highDpFan: FanCurve = { points: [{ Q: 0, dp: 1 }, { Q: 0.05, dp: 0.5 }] };
    const res = solveOperatingPointBisection(highDpFan, geom, air, loss, 0.05, 0, 0.05);
    expect(res.warnings.some((w) => w.code === "NO_OPERATING_POINT")).toBe(true);
  });

  it("formulas include OP_BISECTION bracket", () => {
    const res = solveOperatingPointBisection(fan, geom, air, loss, 0.05, 0, 0.05);
    expect(res.formulas.some((f) => f.id === "OP_BISECTION" || f.id === "OP_NO_INTERSECTION")).toBe(true);
  });

  it("iter3 returns trace length 3 and OP_ITER3", () => {
    const res = solveOperatingPointIter3(fan, geom, air, loss, 0.05);
    expect(res.result.iterTrace?.length).toBe(3);
    expect(res.formulas.some((f) => f.id === "OP_ITER3")).toBe(true);
  });
});
