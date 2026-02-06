<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5">Results</div>
      <q-space />
      <q-btn outline label="Back to Wizard" to="/wizard" />
    </div>

    <WarningsBanner :warnings="run.warnings.flat" />
    <div v-if="invalidOp" class="q-mb-md text-negative">
      No valid operating point. Results may be invalid; Save Run is disabled.
    </div>

    <ResultSummary :outputs="run.outputs" />

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1">Operating Point Chart</div>
        <ChartOperatingPoint :fan-curve="fanSeries" :hs-curve="hsSeries" :op="run.outputs.opFinal" />
      </q-card-section>
    </q-card>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1">Thermal Budget</div>
        <ChartBudgetDonut
          :R_jc="draft.thermal.R_jc_C_per_W"
          :R_tim="draft.thermal.R_tim_C_per_W"
          :R_sa_target="run.outputs.budget.R_sa_target"
        />
      </q-card-section>
    </q-card>

    <div class="text-h6 q-mt-lg q-mb-sm">Optimization: Spacing Sweep</div>
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <q-input v-model.number="draft.sweep1d.s_min_m" type="number" label="s_min (m)" />
          <q-input v-model.number="draft.sweep1d.s_max_m" type="number" label="s_max (m)" />
          <q-input v-model.number="draft.sweep1d.n_points" type="number" label="n_points" />
        </div>
        <q-btn color="primary" class="q-mt-sm" label="Run 1D sweep" @click="runSweep1d" />
        <div v-if="sweep1d">
          <ChartSpacingCurve :points="sweep1d.points" :best-index="sweep1d.bestIndex" />
          <q-card flat bordered class="q-mt-sm">
            <q-card-section>
              <div class="text-subtitle2">Recommendation</div>
              <div>Best s: {{ bestSmm }} mm</div>
              <div>Best N_fin: {{ bestPoint?.N_fin }}</div>
              <div>Best Tj_est: {{ bestPoint?.Tj_est.toFixed(2) }} °C</div>
            </q-card-section>
          </q-card>
        </div>
        <FormulaPanel :items="sweep1dFormulas" />
      </q-card-section>
    </q-card>

    <div class="text-h6 q-mt-lg q-mb-sm">Optimization: 2D Sweep</div>
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <q-input v-model.number="draft.sweep2d.s_min_m" type="number" label="s_min (m)" />
          <q-input v-model.number="draft.sweep2d.s_max_m" type="number" label="s_max (m)" />
          <q-input v-model.number="draft.sweep2d.s_steps" type="number" label="s_steps" />
          <q-input v-model.number="draft.sweep2d.h_min_m" type="number" label="h_min (m)" />
          <q-input v-model.number="draft.sweep2d.h_max_m" type="number" label="h_max (m)" />
          <q-input v-model.number="draft.sweep2d.h_steps" type="number" label="h_steps" />
        </div>
        <q-btn color="primary" class="q-mt-sm" label="Run 2D sweep" @click="runSweep2d" />
        <q-linear-progress v-if="sweep2dProgress" :value="sweep2dProgress.percent / 100" class="q-mt-sm" />
        <div v-if="sweep2d">
          <div class="row q-col-gutter-sm q-mt-sm">
            <q-card v-for="(cand, idx) in sweep2d.top3" :key="idx" class="col-4" flat bordered>
              <q-card-section>
                <div class="text-subtitle2">Candidate {{ idx + 1 }}</div>
                <div>s: {{ (cand.s_m * 1000).toFixed(2) }} mm</div>
                <div>h: {{ (cand.h_m * 1000).toFixed(2) }} mm</div>
                <div>Tj_est: {{ cand.Tj_est.toFixed(2) }} °C</div>
                <q-btn dense color="primary" label="Apply" @click="applyCandidate(cand)" class="q-mt-sm" />
              </q-card-section>
            </q-card>
          </div>
          <div ref="scatterRef" class="chart q-mt-md" />
        </div>
      </q-card-section>
    </q-card>

    <div class="text-h6 q-mt-lg q-mb-sm">Formulas (A → E)</div>
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div v-for="block in formulasOrdered" :key="block.step" class="q-mb-md">
          <div class="text-subtitle2">Step {{ block.step }}</div>
          <FormulaBlock v-for="item in block.items" :key="item.id" :item="item" />
        </div>
      </q-card-section>
    </q-card>

    <RunHistoryPanel :current-run="run" :disable-save="invalidOp" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { computeRun } from "src/composables/useCompute";
import { readDraft, writeDraft } from "src/composables/useLocalStorageState";
import { sweepFinSpacingCurve } from "src/core/sweepSpacing";
import { computePressureDropAtQ } from "src/core/pressureDrop";
import { mToMm } from "src/core/units";
import type { DraftStateV1 } from "src/core/appModel";
import type { FormulaItem, SpacingSweepPoint } from "src/core/types";
import WarningsBanner from "src/components/WarningsBanner.vue";
import ResultSummary from "src/components/ResultSummary.vue";
import ChartOperatingPoint from "src/components/ChartOperatingPoint.vue";
import ChartBudgetDonut from "src/components/ChartBudgetDonut.vue";
import ChartSpacingCurve from "src/components/ChartSpacingCurve.vue";
import FormulaPanel from "src/components/FormulaPanel.vue";
import FormulaBlock from "src/components/FormulaBlock.vue";
import RunHistoryPanel from "src/components/RunHistoryPanel.vue";
import type { Sweep2DProgress, Sweep2DResult } from "src/workers/sweepWorker";

const draft = ref<DraftStateV1>(readDraft());
watch(
  draft,
  (val) => {
    writeDraft(val);
  },
  { deep: true }
);

const run = computed(() => computeRun(draft.value));

const invalidOp = computed(() => run.value.warnings.hasError || !Number.isFinite(run.value.outputs.opFinal.Q_star));

const fanSeries = computed(() => run.value.outputs.fanScaled.points.map((p) => [p.Q, p.dp]) as Array<[number, number]>);
const hsSeries = computed(() => {
  const points = run.value.outputs.fanScaled.points;
  const Qmax = Math.max(...points.map((p) => p.Q));
  const n = 30;
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= n; i += 1) {
    const Q = (i / n) * Qmax;
    const dp = computePressureDropAtQ(Q, run.value.outputs.derived, draft.value.air, draft.value.loss, draft.value.geom.L_m).result.dp;
    out.push([Q, dp]);
  }
  return out;
});

const sweep1d = ref<{ points: SpacingSweepPoint[]; bestIndex: number } | null>(null);
const sweep1dFormulas = ref<FormulaItem[]>([]);

const runSweep1d = () => {
  const sGrid = Array.from({ length: draft.value.sweep1d.n_points }, (_, i) => {
    const t = i / (draft.value.sweep1d.n_points - 1);
    return draft.value.sweep1d.s_min_m + t * (draft.value.sweep1d.s_max_m - draft.value.sweep1d.s_min_m);
  });
  const res = sweepFinSpacingCurve(
    {
      Tj_max: draft.value.thermal.Tj_max_C,
      Ta: draft.value.thermal.Ta_C,
      Q_heat: draft.value.thermal.Q_heat_W,
      R_jc: draft.value.thermal.R_jc_C_per_W,
      R_tim: draft.value.thermal.R_tim_C_per_W,
    },
    run.value.outputs.fanScaled,
    draft.value.air,
    draft.value.loss,
    {
      base: { W: draft.value.geom.W_m, L: draft.value.geom.L_m, h: draft.value.geom.h_m, t: draft.value.geom.t_m },
      sGrid,
      eta_o: draft.value.solver.eta_o,
      useBisectionRefine: true,
      bisectionRange: { Qmin: 0, Qmax: Math.max(...run.value.outputs.fanScaled.points.map((p) => p.Q)) },
      nuModel: draft.value.solver.nuModel,
    }
  );
  const points = res.result;
  const finitePoints = points.map((p, idx) => ({ idx, Tj: p.Tj_est })).filter((p) => Number.isFinite(p.Tj));
  const bestIndex = finitePoints.length ? finitePoints.reduce((best, cur) => (cur.Tj < best.Tj ? cur : best)).idx : -1;
  sweep1d.value = { points, bestIndex };
  sweep1dFormulas.value = res.formulas;
};

const bestPoint = computed(() => (sweep1d.value && sweep1d.value.bestIndex >= 0 ? sweep1d.value.points[sweep1d.value.bestIndex] : null));
const bestSmm = computed(() => (bestPoint.value ? mToMm(bestPoint.value.s).toFixed(2) : "--"));

const formulasOrdered = computed(() => {
  const ordered = [...run.value.formulas.ordered];
  if (sweep1dFormulas.value.length) {
    ordered.push({ step: "E", items: sweep1dFormulas.value });
  }
  return ordered;
});

const sweep2d = ref<Sweep2DResult | null>(null);
const sweep2dProgress = ref<Sweep2DProgress | null>(null);
const scatterRef = ref<HTMLDivElement | null>(null);
let scatterChart: echarts.ECharts | null = null;
let worker: Worker | null = null;

const runSweep2d = () => {
  sweep2d.value = null;
  sweep2dProgress.value = { type: "progress", done: 0, total: 1, percent: 0 };
  if (!worker) {
    worker = new Worker(new URL("../workers/sweepWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (evt: MessageEvent<Sweep2DProgress | Sweep2DResult>) => {
      if (evt.data.type === "progress") {
        sweep2dProgress.value = evt.data;
      } else {
        sweep2d.value = evt.data;
        sweep2dProgress.value = null;
        renderScatter();
      }
    };
  }
  worker.postMessage({ draft: draft.value, fanScaled: run.value.outputs.fanScaled });
};

const renderScatter = () => {
  if (!scatterRef.value || !sweep2d.value) return;
  if (!scatterChart) scatterChart = echarts.init(scatterRef.value);
  const data = sweep2d.value.points.map((p) => [p.s_m * 1000, p.h_m * 1000, p.Tj_est]);
  scatterChart.setOption({
    tooltip: { trigger: "item" },
    xAxis: { type: "value", name: "s (mm)" },
    yAxis: { type: "value", name: "h (mm)" },
    visualMap: { min: Math.min(...data.map((d) => d[2])), max: Math.max(...data.map((d) => d[2])), dimension: 2, orient: "vertical" },
    series: [{ type: "scatter", data }],
  });
};

const applyCandidate = (cand: { s_m: number; h_m: number }) => {
  draft.value.geom.s_m = cand.s_m;
  draft.value.geom.h_m = cand.h_m;
};

onMounted(() => {
  if (scatterRef.value && sweep2d.value) renderScatter();
});

onBeforeUnmount(() => {
  worker?.terminate();
  scatterChart?.dispose();
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: 320px;
}
</style>
