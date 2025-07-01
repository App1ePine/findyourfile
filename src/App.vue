<template>
	<div class="app-container">
		<el-container>
			<el-aside width="200px">
				<Sidebar />
			</el-aside>
			<el-container>
				<el-header>
					<Header />
				</el-header>
				<el-main>
					<router-view />
				</el-main>
			</el-container>
		</el-container>
	</div>
</template>

<script>
import { ElContainer, ElAside, ElHeader, ElMain } from 'element-plus'
import Sidebar from './components/Layout/Sidebar.vue'
import Header from './components/Layout/Header.vue'

export default {
	name: 'App',
	components: {
		ElContainer,
		ElAside,
		ElHeader,
		ElMain,
		Sidebar,
		Header,
	},
}
</script>

<style>
.app-container {
	height: 100vh;
	width: 100%;
}
</style>
