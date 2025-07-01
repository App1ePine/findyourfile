<template>
	<div class="header">
		<div class="left">
			<h2>{{ currentPageTitle }}</h2>
		</div>
	</div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
	name: 'Header',
	setup() {
		const route = useRoute()

		const currentPageTitle = computed(() => {
			const pathMap = {
				'/dashboard': 'DashBoard',
				'/add': '添加文件',
				'/search': '查询文件',
			}

			return pathMap[route.path] || ''
		})

		return {
			currentPageTitle,
		}
	},
}
</script>

<style scoped>
.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 20px;
	height: 60px;
	border-bottom: 1px solid #e6e6e6;
}
</style>
