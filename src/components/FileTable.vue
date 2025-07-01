<template>
	<el-table :data="files" stripe style="width: 100%" v-loading="loading">
		<el-table-column label="文件名" min-width="150">
			<template #default="scope">
				<div class="file-name-cell">
					<el-icon v-if="scope.row.is_directory === 1"><Folder /></el-icon>
					<el-icon v-else><Document /></el-icon>
					<span>{{ scope.row.file_name }}</span>
				</div>
			</template>
		</el-table-column>

		<el-table-column prop="file_cat" label="分类" width="100" />

		<el-table-column label="标签" width="180">
			<template #default="scope">
				<el-tag v-for="tag in getTags(scope.row)" :key="tag" size="small" class="file-tag">
					{{ tag }}
				</el-tag>
			</template>
		</el-table-column>

		<el-table-column prop="file_desc" label="描述" min-width="200" show-overflow-tooltip />

		<el-table-column prop="file_path" label="路径" min-width="200" show-overflow-tooltip />

		<el-table-column prop="added_time" label="添加时间" width="180" />

		<el-table-column label="操作" width="240" fixed="right">
			<template #default="scope">
				<el-button size="small" @click="openFile(scope.row)" type="primary" plain>
					打开文件
				</el-button>
				<el-button size="small" @click="openLocation(scope.row)" type="info" plain>
					打开位置
				</el-button>
				<el-button size="small" @click="deleteFile(scope.row)" type="danger" plain>
					删除
				</el-button>
			</template>
		</el-table-column>
	</el-table>
</template>

<script>
import { ref } from 'vue'
import { Folder, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
	name: 'FileTable',
	components: {
		Folder,
		Document,
	},
	props: {
		files: {
			type: Array,
			required: true,
		},
	},
	emits: ['refresh'],
	setup(props, { emit }) {
		const loading = ref(false)

		const getTags = (file) => {
			if (!file.file_tags) return []
			try {
				return JSON.parse(file.file_tags)
			} catch (e) {
				console.error('解析标签失败:', e)
				return []
			}
		}

		const openFile = async (file) => {
			loading.value = true
			try {
				// 先检查文件是否存在
				const exists = await window.electronAPI.checkFileExists(file.file_path)
				if (!exists) {
					// 使用确认框而不是简单提示
					ElMessageBox.confirm('此文件不存在或已被移动，是否从数据库中删除此记录？', '文件丢失', {
						confirmButtonText: '删除记录',
						cancelButtonText: '保留记录',
						type: 'warning',
					})
						.then(async () => {
							// 用户确认删除
							await window.electronAPI.deleteFile(file.file_id)
							ElMessage.success('记录已删除')
							emit('refresh') // 刷新列表
						})
						.catch(() => {
							// 用户取消
							ElMessage.info('记录已保留')
						})
					return
				}

				await window.electronAPI.openFile(file.file_path)
			} catch (error) {
				console.error('打开文件失败:', error)
				ElMessage.error(`打开文件失败: ${error.message || '未知错误'}`)
			} finally {
				loading.value = false
			}
		}

		const openLocation = async (file) => {
			// 与openFile类似的文件存在检查和确认框
			loading.value = true
			try {
				const exists = await window.electronAPI.checkFileExists(file.file_path)
				if (!exists) {
					ElMessageBox.confirm('此文件不存在或已被移动，是否从数据库中删除此记录？', '文件丢失', {
						confirmButtonText: '删除记录',
						cancelButtonText: '保留记录',
						type: 'warning',
					})
						.then(async () => {
							await window.electronAPI.deleteFile(file.file_id)
							ElMessage.success('记录已删除')
							emit('refresh')
						})
						.catch(() => {
							ElMessage.info('记录已保留')
						})
					return
				}

				await window.electronAPI.showItemInFolder(file.file_path)
			} catch (error) {
				console.error('打开文件位置失败:', error)
				ElMessage.error(`打开文件位置失败: ${error.message || '未知错误'}`)
			} finally {
				loading.value = false
			}
		}

		// 添加删除文件记录功能
		const deleteFile = async (file) => {
			try {
				await ElMessageBox.confirm(
					'确认从数据库中删除此记录？此操作不会删除实际文件。',
					'删除确认',
					{
						confirmButtonText: '删除',
						cancelButtonText: '取消',
						type: 'warning',
					},
				)

				await window.electronAPI.deleteFile(file.file_id)
				ElMessage.success('记录已删除')

				// 触发父组件的刷新方法，但不显示"没有找到匹配的文件"
				setTimeout(() => {
					emit('refresh')
				}, 500)
			} catch (error) {
				if (error !== 'cancel') {
					console.error('删除文件记录失败:', error)
					ElMessage.error(`删除失败: ${error.message || '未知错误'}`)
				}
			}
		}

		return {
			loading,
			getTags,
			openFile,
			openLocation,
			deleteFile,
		}
	},
}
</script>

<style scoped>
.file-name-cell {
	display: flex;
	align-items: center;
}

.file-name-cell i {
	margin-right: 5px;
}

.file-tag {
	margin-right: 5px;
	margin-bottom: 3px;
}
</style>
