<template>
	<div class="dashboard-container">
		<h1>文件管理统计</h1>

		<el-row :gutter="20" class="stats-cards">
			<el-col :span="12">
				<StatisticsCard title="文件总数" :value="stats.fileCount" icon="Document" />
			</el-col>
			<el-col :span="12">
				<StatisticsCard title="文件夹总数" :value="stats.dirCount" icon="Folder" />
			</el-col>
		</el-row>

		<el-row :gutter="20" class="charts-row">
			<el-col :span="24">
				<FileTypeChart :data="stats.fileTypes" />
			</el-col>
		</el-row>

		<h2>最近添加的文件</h2>
		<el-table :data="stats.recentFiles" stripe>
			<el-table-column prop="file_name" label="文件名" />
			<el-table-column prop="file_cat" label="分类" />
			<el-table-column prop="file_path" label="路径" />
			<el-table-column prop="added_time" label="添加时间" />
		</el-table>
	</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useDashboardStore } from '../stores/dashboard'
import StatisticsCard from '../components/Charts/StatisticsCard.vue'
import FileTypeChart from '../components/Charts/FileTypeChart.vue'

export default {
	name: 'Dashboard',
	components: {
		StatisticsCard,
		FileTypeChart,
	},
	setup() {
		const dashboardStore = useDashboardStore()
		const stats = ref(dashboardStore.stats)

		onMounted(async () => {
			await dashboardStore.getStats()
			stats.value = dashboardStore.stats
		})

		return {
			stats,
		}
	},
}
</script>

<style scoped>
.dashboard-container {
	padding: 20px;
}

.stats-cards {
	margin-bottom: 30px;
}

.charts-row {
	margin-bottom: 30px;
}
</style>
