import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboard', {
	state: () => ({
		stats: {
			fileCount: 0,
			dirCount: 0,
			fileTypes: [],
			recentFiles: [],
		},
		isLoading: false,
		error: null,
	}),

	actions: {
		async getStats() {
			this.isLoading = true
			this.error = null

			try {
				const stats = await window.electronAPI.getStats()
				this.stats = stats
				return stats
			} catch (err) {
				this.error = err.message
				return this.stats
			} finally {
				this.isLoading = false
			}
		},
	},
})
