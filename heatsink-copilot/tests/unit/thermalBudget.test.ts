import { describe, it, expect } from "vitest";
import { computeThermalBudget } from "src/core/thermalBudget";

describe("thermalBudget", () => {
  it("formulas contain ids and substituted latex", () => {
    const res = computeThermalBudget({ Tj_max: 100, Ta: 25, Q_heat: 50, R_jc: 0.1, R_tim: 0.1 });
    const ids = res.formulas.map((f) => f.id);
    expect(ids).toContain("BUDGET_R_TOTAL_MAX");
    expect(ids).toContain("BUDGET_R_SA_TARGET");
    expect(res.formulas.every((f) => typeof f.substitutedLatex === "string")).toBe(true);
  });

  it("R_sa_target <= 0 triggers BUDGET_NEGATIVE", () => {
    const res = computeThermalBudget({ Tj_max: 30, Ta: 25, Q_heat: 10, R_jc: 1, R_tim: 1 });
    expect(res.warnings.some((w) => w.code === "BUDGET_NEGATIVE")).toBe(true);
  });
});
