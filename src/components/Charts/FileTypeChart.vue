<template>
	<el-card class="chart-card">
		<div class="chart-title">文件类型分布</div>
		<v-chart class="chart" :option="chartOption" autoresize />
	</el-card>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

export default {
	name: 'FileTypeChart',
	components: {
		VChart,
	},
	props: {
		data: {
			type: Array,
			default: () => [],
		},
	},
	setup(props) {
		const chartOption = computed(() => {
			const chartData = props.data.map((item) => ({
				name: item.file_ext || '无扩展名',
				value: item.count,
			}))

			return {
				tooltip: {
					trigger: 'item',
					formatter: '{a} <br/>{b}: {c} ({d}%)',
				},
				legend: {
					orient: 'horizontal',
					bottom: 'bottom',
					data: chartData.map((item) => item.name),
				},
				series: [
					{
						name: '文件类型',
						type: 'pie',
						radius: ['40%', '70%'],
						avoidLabelOverlap: false,
						label: {
							show: false,
							position: 'center',
						},
						emphasis: {
							label: {
								show: true,
								fontSize: '18',
								fontWeight: 'bold',
							},
						},
						labelLine: {
							show: false,
						},
						data: chartData,
					},
				],
			}
		})

		return {
			chartOption,
		}
	},
}
</script>

<style scoped>
.chart-card {
	width: 100%;
	height: 400px;
}

.chart-title {
	font-size: 16px;
	font-weight: bold;
	margin-bottom: 20px;
}

.chart {
	height: 320px;
}
</style>
