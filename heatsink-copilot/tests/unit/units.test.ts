import { describe, it, expect } from "vitest";
import { cfmToM3s, m3sToCfm, mmToM, mToMm } from "src/core/units";

describe("units", () => {
  it("CFM round trip", () => {
    const cfm = 100;
    const m3s = cfmToM3s(cfm);
    expect(m3sToCfm(m3s)).toBeCloseTo(cfm, 5);
  });

  it("mm <-> m", () => {
    expect(mToMm(mmToM(25))).toBeCloseTo(25);
  });
});
