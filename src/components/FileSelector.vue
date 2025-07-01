<template>
	<div class="file-selector">
		<div
			class="drop-zone"
			@click="selectFile"
			@dragover.prevent
			@dragenter.prevent
			@drop.prevent="handleDrop"
			:class="{ active: isDragging }"
			@dragenter="isDragging = true"
			@dragleave="isDragging = false"
		>
			<el-icon class="drop-icon"><Upload /></el-icon>
			<div class="drop-text">
				<p>点击选择文件或拖放到此处</p>
				<el-button type="primary" size="small" @click.stop="selectFile">选择文件</el-button>
				<el-button size="small" @click.stop="selectDirectory">选择文件夹</el-button>
			</div>
		</div>

		<div v-if="selectedFile" class="file-info">
			<el-alert title="文件已选择" type="success" :closable="false" show-icon>
				<template #default>
					<p><strong>名称:</strong> {{ selectedFile.name }}</p>
					<p><strong>路径:</strong> {{ selectedFile.path }}</p>
					<p><strong>类型:</strong> {{ selectedFile.isDirectory ? '文件夹' : '文件' }}</p>
				</template>
			</el-alert>
		</div>
	</div>
</template>

<script>
import { ref } from 'vue'
import { Upload } from '@element-plus/icons-vue'

export default {
	name: 'FileSelector',
	components: {
		Upload,
	},
	emits: ['file-selected'],
	setup(props, { emit }) {
		const selectedFile = ref(null)
		const isDragging = ref(false)

		const selectFile = async () => {
			try {
				const file = await window.electronAPI.selectFile()
				if (file) {
					handleFileSelected(file)
				}
			} catch (error) {
				console.error('选择文件失败:', error)
			}
		}

		const selectDirectory = async () => {
			try {
				const dir = await window.electronAPI.selectDirectory()
				if (dir) {
					handleFileSelected(dir)
				}
			} catch (error) {
				console.error('选择文件夹失败:', error)
			}
		}

		const handleDrop = async (event) => {
			isDragging.value = false
			const file = event.dataTransfer.files[0]
			if (file) {
				const filePath = file.path
				// 通过Electron API获取文件的完整信息
				try {
					const fileInfo = await window.electronAPI.getFileInfo(filePath)
					handleFileSelected(fileInfo)
				} catch (error) {
					console.error('获取文件信息失败:', error)
				}
			}
		}

		const handleFileSelected = (file) => {
			// 创建一个可序列化的文件对象
			const safeFile = {
				path: file.path,
				name: file.name,
				isDirectory: file.isDirectory,
				fileExt: file.fileExt || '',
				// 转换日期为ISO字符串
				createdTime: file.createdTime ? new Date(file.createdTime).toISOString() : null,
				updatedTime: file.updatedTime ? new Date(file.updatedTime).toISOString() : null,
				size: file.size,
			}

			selectedFile.value = safeFile
			emit('file-selected', safeFile)
		}

		return {
			selectedFile,
			isDragging,
			selectFile,
			selectDirectory,
			handleDrop,
		}
	},
}
</script>

<style scoped>
.file-selector {
	width: 100%;
}

.drop-zone {
	border: 2px dashed #dcdfe6;
	border-radius: 8px;
	padding: 40px;
	text-align: center;
	cursor: pointer;
	transition: all 0.3s;
}

.drop-zone:hover,
.drop-zone.active {
	border-color: #409eff;
	background-color: rgba(64, 158, 255, 0.1);
}

.drop-icon {
	font-size: 48px;
	color: #909399;
	margin-bottom: 16px;
}

.drop-text {
	color: #606266;
}

.file-info {
	margin-top: 20px;
}
</style>
