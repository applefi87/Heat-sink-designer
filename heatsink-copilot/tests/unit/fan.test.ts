import { describe, it, expect } from "vitest";
import { scaleFanCurveByRpm, fanDpAtQ, validateFanCurve } from "src/core/fan";
import type { FanCurve } from "src/core/types";

const baseCurve: FanCurve = {
  points: [
    { Q: 0, dp: 100 },
    { Q: 1, dp: 0 },
  ],
};

describe("fan", () => {
  it("scaleFanCurveByRpm scales Q and dp", () => {
    const res = scaleFanCurveByRpm(baseCurve, 1000, 800);
    expect(res.result.points[1].Q).toBeCloseTo(0.8);
    expect(res.result.points[0].dp).toBeCloseTo(100 * 0.64);
  });

  it("fanDpAtQ interpolation", () => {
    const dp = fanDpAtQ(baseCurve, 0.5);
    expect(dp).toBeCloseTo(50);
  });

  it("validateFanCurve returns FAN_INTERP_LINEAR formula", () => {
    const res = validateFanCurve(baseCurve);
    expect(res.formulas.some((f) => f.id === "FAN_INTERP_LINEAR")).toBe(true);
  });
});
