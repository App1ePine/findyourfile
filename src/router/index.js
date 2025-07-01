import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		redirect: '/dashboard',
	},
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: () => import('../views/Dashboard.vue'),
	},
	{
		path: '/add',
		name: 'AddFile',
		component: () => import('../views/AddFile.vue'),
	},
	{
		path: '/search',
		name: 'SearchFiles',
		component: () => import('../views/SearchFiles.vue'),
	},
]

const router = createRouter({
	history: createWebHashHistory(),
	routes,
})

export default router
