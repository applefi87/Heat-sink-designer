<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-subtitle1">Results Summary</div>
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-6">
          <div>Q* (m³/s): {{ outputs.opFinal.Q_star.toExponential(3) }}</div>
          <div>Q* (CFM): {{ qCfm }}</div>
          <div>ΔP* (Pa): {{ outputs.opFinal.dp_star.toFixed(2) }}</div>
          <div>Re*: {{ outputs.heatTransfer.Re.toFixed(1) }}</div>
          <div>Nu: {{ outputs.heatTransfer.Nu.toFixed(2) }}</div>
          <div>h (W/m²K): {{ outputs.heatTransfer.h.toFixed(2) }}</div>
        </div>
        <div class="col-6">
          <div>N_fin: {{ outputs.derived.N_fin }}</div>
          <div>N_ch: {{ outputs.derived.N_ch }}</div>
          <div>A_flow (m²): {{ outputs.derived.A_flow.toExponential(3) }}</div>
          <div>Dh (m): {{ outputs.derived.Dh.toExponential(3) }}</div>
          <div>A_eff (m²): {{ outputs.derived.A_eff.toExponential(3) }}</div>
          <div>R_sa_target (°C/W): {{ outputs.budget.R_sa_target.toFixed(4) }}</div>
          <div>R_sa_est (°C/W): {{ outputs.thermalPerf.R_sa_est.toFixed(4) }}</div>
        </div>
      </div>
      <q-chip :color="outputs.passBudget ? 'green-4' : 'red-4'" text-color="white" class="q-mt-sm">
        {{ outputs.passBudget ? 'Pass' : 'Fail' }} (margin: {{ outputs.margin_Rsa.toFixed(4) }} °C/W)
      </q-chip>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RunOutputs } from "src/core/appModel";
import { m3sToCfm } from "src/core/units";

const props = defineProps<{ outputs: RunOutputs }>();

const qCfm = computed(() => m3sToCfm(props.outputs.opFinal.Q_star).toFixed(2));
</script>
