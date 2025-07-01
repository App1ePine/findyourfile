import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

export const useMetadataStore = defineStore('metadata', {
	state: () => ({
		categories: [],
		tags: [],
		isLoading: false,
		error: null,
	}),

	actions: {
		async fetchCategories() {
			if (this.categories.length > 0) return this.categories

			this.isLoading = true
			try {
				const categories = await window.electronAPI.getAllCategories()
				this.categories = categories
				return categories
			} catch (error) {
				console.error('获取分类失败:', error)
				this.error = error.message
				return []
			} finally {
				this.isLoading = false
			}
		},

		async fetchTags() {
			if (this.tags.length > 0) return this.tags

			this.isLoading = true
			try {
				const tags = await window.electronAPI.getAllTags()
				this.tags = tags
				return tags
			} catch (error) {
				console.error('获取标签失败:', error)
				this.error = error.message
				return []
			} finally {
				this.isLoading = false
			}
		},

		async refreshMetadata() {
			this.categories = []
			this.tags = []
			await Promise.all([this.fetchCategories(), this.fetchTags()])
		},

		addCategory(category) {
			if (category && !this.categories.includes(category)) {
				this.categories.push(category)
			}
		},

		addTag(tag) {
			if (tag && !this.tags.includes(tag)) {
				this.tags.push(tag)
			}
		},
	},
})
