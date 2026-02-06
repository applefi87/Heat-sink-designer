<template>
  <div ref="chartRef" class="chart" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";
import type { OperatingPoint } from "src/core/types";

const props = defineProps<{
  fanCurve: Array<[number, number]>;
  hsCurve: Array<[number, number]>;
  op: OperatingPoint;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const render = () => {
  if (!chart) return;
  const option: echarts.EChartsOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "value", name: "Q (m³/s)" },
    yAxis: { type: "value", name: "ΔP (Pa)" },
    series: [
      { type: "line", name: "Fan", data: props.fanCurve },
      { type: "line", name: "Heatsink", data: props.hsCurve },
      {
        type: "scatter",
        name: "Operating Point",
        data: [[props.op.Q_star, props.op.dp_star]],
        symbolSize: 10,
      },
    ],
  };
  chart.setOption(option);
};

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
    render();
  }
});

watch(() => [props.fanCurve, props.hsCurve, props.op], render, { deep: true });

onBeforeUnmount(() => {
  chart?.dispose();
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: 300px;
}
</style>
