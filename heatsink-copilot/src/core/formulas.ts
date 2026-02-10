/* =========================
 * src/core/formulas.ts
 * ========================= */

import type { FormulaItem } from "./types";

export function formulaHasLatex(item: FormulaItem): boolean {
  return typeof item.latex === "string" && item.latex.length > 0;
}

export function safeFormulaSample(): FormulaItem {
  return {
    id: "SAMPLE_FORMULA",
    title: "Sample",
    latex: "a=b+c",
    substitutedLatex: "a=1+2=3",
    variables: [
      { name: "a", value: 3, unit: "-" },
      { name: "b", value: 1, unit: "-" },
      { name: "c", value: 2, unit: "-" },
    ],
  };
}
