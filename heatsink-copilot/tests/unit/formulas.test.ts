import { describe, it, expect } from "vitest";
import { safeFormulaSample } from "src/core/formulas";

function hasLatex(str?: string) {
  return typeof str === "string" && str.length > 0;
}

describe("formulas", () => {
  it("FormulaItem schema valid and KaTeX-safe strings", () => {
    const item = safeFormulaSample();
    expect(item.id).toBeTruthy();
    expect(item.title).toBeTruthy();
    expect(hasLatex(item.latex)).toBe(true);
    expect(hasLatex(item.substitutedLatex)).toBe(true);
  });
});
