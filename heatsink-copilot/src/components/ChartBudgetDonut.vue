<template>
  <div ref="chartRef" class="chart" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";

const props = defineProps<{ R_jc: number; R_tim: number; R_sa_target: number }>();
const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const render = () => {
  if (!chart) return;
  const option: echarts.EChartsOption = {
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        data: [
          { name: "R_jc", value: props.R_jc },
          { name: "R_tim", value: props.R_tim },
          { name: "R_sa_target", value: props.R_sa_target },
        ],
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

watch(() => [props.R_jc, props.R_tim, props.R_sa_target], render);

onBeforeUnmount(() => {
  chart?.dispose();
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: 260px;
}
</style>
