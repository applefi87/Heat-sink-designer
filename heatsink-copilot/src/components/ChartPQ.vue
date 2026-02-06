<template>
  <div ref="chartRef" class="chart" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";
import type { FanCurve } from "src/core/types";

const props = defineProps<{ original: FanCurve; scaled: FanCurve }>();
const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const render = () => {
  if (!chart || !chartRef.value) return;
  const option: echarts.EChartsOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "value", name: "Q (m³/s)" },
    yAxis: { type: "value", name: "ΔP (Pa)" },
    series: [
      {
        type: "line",
        name: "Original",
        data: props.original.points.map((p) => [p.Q, p.dp]),
      },
      {
        type: "line",
        name: "Scaled",
        data: props.scaled.points.map((p) => [p.Q, p.dp]),
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

watch(() => [props.original, props.scaled], render, { deep: true });

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
