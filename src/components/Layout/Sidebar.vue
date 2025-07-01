<template>
	<div class="sidebar">
		<div class="logo-container">
			<h2>FindYourFile</h2>
		</div>
		<el-menu :default-active="activeIndex" class="sidebar-menu" router>
			<el-menu-item index="/dashboard">
				<el-icon><DataLine /></el-icon>
				<span>Dashboard</span>
			</el-menu-item>
			<el-menu-item index="/add">
				<el-icon><Plus /></el-icon>
				<span>添加文件</span>
			</el-menu-item>
			<el-menu-item index="/search">
				<el-icon><Search /></el-icon>
				<span>查询文件</span>
			</el-menu-item>
		</el-menu>
	</div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { DataLine, Plus, Search } from '@element-plus/icons-vue'

export default {
	name: 'Sidebar',
	components: {
		DataLine,
		Plus,
		Search,
	},
	setup() {
		const route = useRoute()
		const activeIndex = computed(() => route.path)

		return {
			activeIndex,
		}
	},
}
</script>

<style scoped>
.sidebar {
	height: 100%;
	background-color: #fff;
	border-right: 1px solid #e6e6e6;
}

.logo-container {
	height: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-bottom: 1px solid #e6e6e6;
}

.sidebar-menu {
	height: calc(100% - 60px);
}
</style>
