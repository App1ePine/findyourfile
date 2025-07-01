<template>
	<el-card class="file-card" shadow="hover">
		<div class="file-icon">
			<el-icon v-if="file.is_directory">
				<Folder />
			</el-icon>
			<el-icon v-else>
				<Document />
			</el-icon>
		</div>

		<div class="file-info">
			<h3 class="file-name">{{ file.file_name }}</h3>
			<p class="file-path">{{ file.file_path }}</p>

			<div class="file-meta">
				<el-tag v-if="file.file_cat" size="small" type="info">{{ file.file_cat }}</el-tag>
				<el-tag v-for="tag in parsedTags" :key="tag" size="small" class="file-tag">
					{{ tag }}
				</el-tag>
			</div>

			<p v-if="file.file_desc" class="file-desc">{{ file.file_desc }}</p>

			<div class="file-actions">
				<el-button size="small" @click="openFile">打开文件</el-button>
				<el-button size="small" @click="openLocation">打开位置</el-button>
			</div>
		</div>
	</el-card>
</template>

<script>
import { computed } from 'vue'
import { Folder, Document } from '@element-plus/icons-vue'

export default {
	name: 'FileCard',
	components: {
		Folder,
		Document,
	},
	props: {
		file: {
			type: Object,
			required: true,
		},
	},
	setup(props) {
		const parsedTags = computed(() => {
			if (!props.file.file_tags) return []
			try {
				return JSON.parse(props.file.file_tags)
			} catch (e) {
				return []
			}
		})

		const openFile = async () => {
			try {
				await window.electronAPI.openFile(props.file.file_path)
			} catch (error) {
				console.error('打开文件失败:', error)
			}
		}

		const openLocation = async () => {
			try {
				await window.electronAPI.showItemInFolder(props.file.file_path)
			} catch (error) {
				console.error('打开文件位置失败:', error)
			}
		}

		return {
			parsedTags,
			openFile,
			openLocation,
		}
	},
}
</script>

<style scoped>
.file-card {
	margin-bottom: 15px;
}

.file-icon {
	font-size: 24px;
	margin-bottom: 10px;
}

.file-name {
	margin: 0 0 5px 0;
	font-size: 16px;
	font-weight: bold;
}

.file-path {
	margin: 5px 0;
	color: #909399;
	font-size: 12px;
	word-break: break-all;
}

.file-meta {
	margin: 10px 0;
}

.file-tag {
	margin-right: 5px;
	margin-bottom: 5px;
}

.file-desc {
	margin: 10px 0;
	color: #606266;
	font-size: 14px;
}

.file-actions {
	margin-top: 15px;
}
</style>
