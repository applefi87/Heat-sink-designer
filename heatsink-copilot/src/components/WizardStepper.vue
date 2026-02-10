<template>
  <div>
    <div class="row items-center q-mb-md">
      <div class="text-h6">Design Wizard</div>
      <q-space />
      <UnitToggle v-model="draft.unitsMode" />
      <q-btn class="q-ml-sm" outline label="Reset all" @click="resetAll" />
    </div>

    <q-stepper v-model="step" vertical animated>
      <q-step :name="1" title="Step A - Thermal Spec" icon="thermostat">
        <p>Define thermal limits. Defaults allow a valid run.</p>
        <q-input v-model.number="draft.thermal.Tj_max_C" type="number" label="Tj_max (°C)" />
        <q-input v-model.number="draft.thermal.Ta_C" type="number" label="Ta (°C)" />
        <q-input v-model.number="draft.thermal.Q_heat_W" type="number" label="Q_heat (W)" />
        <q-input v-model.number="draft.thermal.R_jc_C_per_W" type="number" label="R_jc (°C/W)" />
        <q-input v-model.number="draft.thermal.R_tim_C_per_W" type="number" label="R_tim (°C/W)" />
        <q-btn flat label="Reset step defaults" @click="resetStep('A')" class="q-mt-sm" />
        <WarningsBanner :warnings="stepWarnings.A" />
        <div class="q-mt-sm">
          <div>R_total_max: {{ outputs?.budget.R_total_max.toFixed(4) }}</div>
          <div>R_sa_target: {{ outputs?.budget.R_sa_target.toFixed(4) }}</div>
        </div>
        <FormulaPanel :items="stepFormulas.A" />
        <q-stepper-navigation>
          <q-btn color="primary" label="Continue" @click="step = 2" />
        </q-stepper-navigation>
      </q-step>

      <q-step :name="2" title="Step B - Fan Curve" icon="air">
        <p>Paste or upload a fan curve. The chart shows original vs scaled curve.</p>
        <FanCurveUploader v-model="draft.fan.pointsText" v-model:source="draft.fan.curveSource" />
        <div class="row q-col-gutter-sm q-mt-sm">
          <q-select
            v-model="draft.fan.units.Q"
            :options="[{label:'m³/s',value:'m3s'},{label:'CFM',value:'cfm'}]"
            dense
            label="Q units"
          />
          <q-select
            v-model="draft.fan.units.dp"
            :options="[{label:'Pa',value:'pa'},{label:'inH2O',value:'inh2o'}]"
            dense
            label="ΔP units"
          />
          <q-input v-model.number="draft.fan.rpm_ref" type="number" label="rpm_ref" />
          <q-input v-model.number="draft.fan.rpm_new" type="number" label="rpm_new" />
        </div>
        <q-btn flat label="Reset step defaults" @click="resetStep('B')" class="q-mt-sm" />
        <WarningsBanner :warnings="stepWarnings.B" />
        <ChartPQ v-if="outputs" :original="outputs.fanValidated" :scaled="outputs.fanScaled" />
        <FormulaPanel :items="stepFormulas.B" />
        <q-stepper-navigation>
          <q-btn flat label="Back" @click="step = 1" />
          <q-btn color="primary" label="Continue" @click="step = 3" />
        </q-stepper-navigation>
      </q-step>

      <q-step :name="3" title="Step C - Geometry + Loss" icon="view_in_ar">
        <p>Define geometry and loss model. Units show mm in user mode.</p>
        <div class="row q-col-gutter-sm">
          <q-input v-model.number="geomW" type="number" label="W" />
          <q-input v-model.number="geomL" type="number" label="L" />
          <q-input v-model.number="geomh" type="number" label="h" />
          <q-input v-model.number="geomt" type="number" label="t" />
          <q-input v-model.number="geoms" type="number" label="s" />
        </div>
        <div class="row q-col-gutter-sm q-mt-sm">
          <q-input v-model.number="draft.loss.K_sum" type="number" label="K_sum" />
          <q-select
            v-model="draft.loss.frictionModel"
            :options="['simple','laminar-rect','turbulent-blasius','piecewise']"
            label="Friction model"
            dense
          />
        </div>
        <q-expansion-item label="Advanced air props" icon="science" v-model="draft.showAdvanced" class="q-mt-sm">
          <div class="row q-col-gutter-sm">
            <q-input v-model.number="draft.air.rho" type="number" label="rho (kg/m³)" />
            <q-input v-model.number="draft.air.mu" type="number" label="mu (Pa·s)" />
            <q-input v-model.number="draft.air.k" type="number" label="k (W/m·K)" />
            <q-input v-model.number="draft.air.Pr" type="number" label="Pr" />
          </div>
        </q-expansion-item>
        <q-btn flat label="Reset step defaults" @click="resetStep('C')" class="q-mt-sm" />
        <WarningsBanner :warnings="stepWarnings.C" />
        <div v-if="outputs" class="q-mt-sm">
          <div>N_fin: {{ outputs.derived.N_fin }}</div>
          <div>N_ch: {{ outputs.derived.N_ch }}</div>
          <div>A_flow: {{ outputs.derived.A_flow.toExponential(3) }}</div>
          <div>Dh: {{ outputs.derived.Dh.toExponential(3) }}</div>
          <div>A_eff: {{ outputs.derived.A_eff.toExponential(3) }}</div>
        </div>
        <FormulaPanel :items="stepFormulas.C" />
        <q-stepper-navigation>
          <q-btn flat label="Back" @click="step = 2" />
          <q-btn color="primary" label="Continue" @click="step = 4" />
        </q-stepper-navigation>
      </q-step>

      <q-step :name="4" title="Step D - Operating Point + Thermal" icon="timeline">
        <p>Compute operating point and thermal performance.</p>
        <q-select
          v-model="draft.solver.mode"
          :options="[
            { label: 'Fast (Iter3 only)', value: 'fast_iter3' },
            { label: 'Robust (Iter3 + Bisection)', value: 'robust_iter3_bisect' },
          ]"
          label="Solver mode"
          dense
        />
        <q-input v-model.number="draft.solver.eta_o" type="number" label="eta_o" />
        <q-select v-model="draft.solver.nuModel" :options="['mvp-piecewise','paper-correlation']" dense label="Nu model" />
        <q-btn flat label="Reset step defaults" @click="resetStep('D')" class="q-mt-sm" />
        <WarningsBanner :warnings="stepWarnings.D" />
        <ResultSummary v-if="outputs" :outputs="outputs" />
        <FormulaPanel :items="stepFormulas.D" />
        <q-stepper-navigation>
          <q-btn flat label="Back" @click="step = 3" />
          <q-btn color="primary" label="Go to results" to="/results" />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { defaultDraftState } from "src/core/defaults";
import { computeRun } from "src/composables/useCompute";
import { mToMm, mmToM } from "src/core/units";
import type { DraftStateV1, StepId } from "src/core/appModel";
import UnitToggle from "./UnitToggle.vue";
import WarningsBanner from "./WarningsBanner.vue";
import FormulaPanel from "./FormulaPanel.vue";
import FanCurveUploader from "./FanCurveUploader.vue";
import ChartPQ from "./ChartPQ.vue";
import ResultSummary from "./ResultSummary.vue";

const props = defineProps<{ modelValue: DraftStateV1 }>();
const emit = defineEmits<{ (e: "update:modelValue", value: DraftStateV1): void }>();

const step = ref(1);

const draft = computed({
  get: () => props.modelValue,
  set: (val: DraftStateV1) => emit("update:modelValue", val),
});

const run = computed(() => computeRun(draft.value));
const outputs = computed(() => run.value.outputs);
const stepFormulas = computed(() => {
  const map: Record<StepId, typeof run.value.formulas.ordered[0]["items"]> = { A: [], B: [], C: [], D: [], E: [] };
  run.value.formulas.ordered.forEach((entry) => {
    map[entry.step] = entry.items;
  });
  return map;
});

const stepWarnings = computed(() => {
  const map: Record<StepId, typeof run.value.warnings.ordered[0]["items"]> = { A: [], B: [], C: [], D: [], E: [] };
  run.value.warnings.ordered.forEach((entry) => {
    map[entry.step] = entry.items;
  });
  return map;
});

const resetAll = () => {
  draft.value = defaultDraftState();
};

const resetStep = (stepId: StepId) => {
  const defaults = defaultDraftState();
  if (stepId === "A") draft.value.thermal = defaults.thermal;
  if (stepId === "B") draft.value.fan = defaults.fan;
  if (stepId === "C") {
    draft.value.geom = defaults.geom;
    draft.value.loss = defaults.loss;
    draft.value.air = defaults.air;
  }
  if (stepId === "D") draft.value.solver = defaults.solver;
};

const geomW = computed({
  get: () => (draft.value.unitsMode === "user" ? mToMm(draft.value.geom.W_m) : draft.value.geom.W_m),
  set: (val: number) => {
    draft.value.geom.W_m = draft.value.unitsMode === "user" ? mmToM(val) : val;
  },
});

const geomL = computed({
  get: () => (draft.value.unitsMode === "user" ? mToMm(draft.value.geom.L_m) : draft.value.geom.L_m),
  set: (val: number) => {
    draft.value.geom.L_m = draft.value.unitsMode === "user" ? mmToM(val) : val;
  },
});

const geomh = computed({
  get: () => (draft.value.unitsMode === "user" ? mToMm(draft.value.geom.h_m) : draft.value.geom.h_m),
  set: (val: number) => {
    draft.value.geom.h_m = draft.value.unitsMode === "user" ? mmToM(val) : val;
  },
});

const geomt = computed({
  get: () => (draft.value.unitsMode === "user" ? mToMm(draft.value.geom.t_m) : draft.value.geom.t_m),
  set: (val: number) => {
    draft.value.geom.t_m = draft.value.unitsMode === "user" ? mmToM(val) : val;
  },
});

const geoms = computed({
  get: () => (draft.value.unitsMode === "user" ? mToMm(draft.value.geom.s_m) : draft.value.geom.s_m),
  set: (val: number) => {
    draft.value.geom.s_m = draft.value.unitsMode === "user" ? mmToM(val) : val;
  },
});

watch(
  () => props.modelValue,
  () => {
    // no-op to keep computed fresh
  }
);
</script>
