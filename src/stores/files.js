import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

export const useFilesStore = defineStore('files', {
	state: () => ({
		files: [],
		isLoading: false,
		error: null,
		totalFiles: 0,
		currentPage: 1,
		pageSize: 10,
	}),

	actions: {
		async searchFiles(criteria) {
			this.isLoading = true
			this.error = null

			try {
				console.log('filesStore.searchFiles 收到条件:', JSON.stringify(criteria))

				// 检查是否有关键字查询
				if (criteria.keyword) {
					console.log('检测到关键字查询:', criteria.keyword)
				}

				// 创建一个简单的可序列化对象
				const simpleCriteria = {}

				// 只添加有值的属性
				if (criteria.fileName) simpleCriteria.fileName = criteria.fileName
				if (criteria.fileCat) simpleCriteria.fileCat = criteria.fileCat

				// 特别处理标签数组，确保它们是简单字符串
				if (Array.isArray(criteria.fileTags) && criteria.fileTags.length > 0) {
					// 转换为简单字符串数组
					simpleCriteria.fileTags = criteria.fileTags.map((tag) => String(tag))
				}

				if (criteria.startDate) simpleCriteria.startDate = criteria.startDate
				if (criteria.endDate) simpleCriteria.endDate = criteria.endDate

				console.log('发送查询条件:', JSON.stringify(simpleCriteria))

				// 如果没有任何条件，返回空数组
				if (Object.keys(simpleCriteria).length === 0) {
					return []
				}

				const result = await window.electronAPI.searchFiles(simpleCriteria)
				console.log('searchFiles 结果数量:', result.length)

				// 确保结果是可序列化的
				const safeResult = JSON.parse(JSON.stringify(result))

				this.files = safeResult
				this.totalFiles = safeResult.length
				return safeResult
			} catch (err) {
				this.error = err.message
				console.error('搜索错误:', err)
				throw new Error(`查询失败: ${err.message}`)
			} finally {
				this.isLoading = false
			}
		},

		async addFile(fileData) {
			this.isLoading = true
			this.error = null

			try {
				// 确保所有对象都是可序列化的
				const serializable = {
					fileName: fileData.fileName || '',
					fileExt: fileData.fileExt || '',
					fileCat: fileData.fileCat || '',
					fileTags: JSON.stringify(fileData.fileTags || []), // 直接在这里序列化标签
					fileDesc: fileData.fileDesc || '',
					filePath: fileData.filePath || '',
					fileCreatedTime:
						typeof fileData.fileCreatedTime === 'string' ? fileData.fileCreatedTime : null,
					fileUpdatedTime:
						typeof fileData.fileUpdatedTime === 'string' ? fileData.fileUpdatedTime : null,
					isDirectory: Boolean(fileData.isDirectory),
				}

				console.log('正在添加文件，序列化数据:', serializable)

				const fileId = await window.electronAPI.addFile(serializable)
				return fileId
			} catch (err) {
				this.error = err.message
				console.error('添加文件错误:', err)

				// 翻译错误信息为用户友好的提示
				if (err.message === 'FILE_DUPLICATE') {
					throw new Error('该文件已存在于数据库中，请勿重复添加')
				} else if (err.message === 'FILE_NOT_EXIST') {
					throw new Error('文件不存在或已被移动')
				} else {
					throw err
				}
			} finally {
				this.isLoading = false
			}
		},
	},
})
