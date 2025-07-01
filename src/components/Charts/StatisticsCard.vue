<template>
	<el-card class="stats-card">
		<div class="stats-card-content">
			<div class="stats-icon">
				<el-icon :size="36">
					<component :is="icon" />
				</el-icon>
			</div>
			<div class="stats-info">
				<div class="stats-title">{{ title }}</div>
				<div class="stats-value">{{ value }}</div>
			</div>
		</div>
	</el-card>
</template>

<script>
export default {
	name: 'StatisticsCard',
	props: {
		title: {
			type: String,
			required: true,
		},
		value: {
			type: [Number, String],
			required: true,
		},
		icon: {
			type: String,
			default: 'DataLine',
		},
	},
}
</script>

<style scoped>
.stats-card {
	height: 120px;
	margin-bottom: 20px;
}

.stats-card-content {
	display: flex;
	align-items: center;
	height: 100%;
}

.stats-icon {
	padding: 0 20px;
	color: #409eff;
}

.stats-info {
	flex-grow: 1;
}

.stats-title {
	font-size: 16px;
	color: #909399;
	margin-bottom: 10px;
}

.stats-value {
	font-size: 28px;
	font-weight: bold;
	color: #303133;
}
</style>
