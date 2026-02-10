<template>
  <div ref="chartRef" class="chart" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";
import type { SpacingSweepPoint } from "src/core/types";
import { mToMm } from "src/core/units";

const props = defineProps<{ points: SpacingSweepPoint[]; bestIndex: number }>();
const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const render = () => {
  if (!chart) return;
  const data = props.points.map((p) => [mToMm(p.s), p.Tj_est]);
  const option: echarts.EChartsOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "value", name: "s (mm)" },
    yAxis: { type: "value", name: "Tj_est (°C)" },
    series: [
      { type: "line", data },
      {
        type: "scatter",
        data: props.bestIndex >= 0 ? [data[props.bestIndex]] : [],
        symbolSize: 12,
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

watch(() => [props.points, props.bestIndex], render, { deep: true });

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
