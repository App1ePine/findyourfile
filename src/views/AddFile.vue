<template>
	<div class="add-file-container">
		<h1>添加新文件</h1>

		<div class="file-selector-wrapper">
			<FileSelector @file-selected="handleFileSelected" :reset="resetSignal" />
		</div>

		<el-form
			v-if="selectedFile"
			:model="fileForm"
			label-width="120px"
			:rules="rules"
			ref="fileFormRef"
		>
			<el-form-item label="文件路径" prop="filePath">
				<el-input v-model="fileForm.filePath" disabled />
			</el-form-item>

			<el-form-item label="文件名" prop="fileName">
				<el-input v-model="fileForm.fileName" disabled />
			</el-form-item>

			<el-form-item label="分类" prop="fileCat">
				<el-select
					v-model="fileForm.fileCat"
					filterable
					allow-create
					default-first-option
					placeholder="请选择或输入分类"
					style="width: 100%"
					clearable
				>
					<el-option
						v-for="category in categories"
						:key="category"
						:label="category"
						:value="category"
					/>
				</el-select>
			</el-form-item>

			<el-form-item label="标签" prop="fileTags">
				<div class="tags-container">
					<el-select
						v-model="selectedTag"
						filterable
						allow-create
						default-first-option
						placeholder="请选择或输入标签"
						style="width: 100%"
						clearable
						@change="handleTagChange"
					>
						<el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
					</el-select>

					<div class="selected-tags" v-if="fileForm.fileTags.length > 0">
						<el-tag
							v-for="tag in fileForm.fileTags"
							:key="tag"
							closable
							@close="removeTag(tag)"
							class="tag-item"
						>
							{{ tag }}
						</el-tag>
					</div>
				</div>
			</el-form-item>

			<el-form-item label="描述" prop="fileDesc">
				<el-input
					v-model="fileForm.fileDesc"
					type="textarea"
					rows="4"
					placeholder="请输入文件描述"
				/>
			</el-form-item>

			<el-form-item>
				<el-button type="primary" @click="submitForm" :loading="isSubmitting">保存</el-button>
				<el-button @click="resetForm">重置</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useFilesStore } from '../stores/files'
import { useMetadataStore } from '../stores/metadata'
import FileSelector from '../components/FileSelector.vue'

export default {
	name: 'AddFile',
	components: {
		FileSelector,
	},
	setup() {
		const filesStore = useFilesStore()
		const metadataStore = useMetadataStore()
		const fileFormRef = ref(null)
		const selectedFile = ref(null)
		const isSubmitting = ref(false)
		const resetSignal = ref(false)

		// 分类和标签
		const categories = ref([])
		const availableTags = ref([])
		const selectedTag = ref('')

		const fileForm = reactive({
			filePath: '',
			fileName: '',
			fileExt: '',
			fileCat: '',
			fileTags: [],
			fileDesc: '',
			fileCreatedTime: '',
			fileUpdatedTime: '',
			isDirectory: false,
		})

		const rules = {
			filePath: [{ required: true, message: '文件路径不能为空', trigger: 'blur' }],
			fileName: [{ required: true, message: '文件名不能为空', trigger: 'blur' }],
		}

		// 加载分类和标签
		const loadMetadata = async () => {
			try {
				categories.value = await metadataStore.fetchCategories()
				availableTags.value = await metadataStore.fetchTags()
			} catch (error) {
				console.error('加载元数据失败:', error)
				ElMessage.error('加载分类和标签数据失败')
			}
		}

		const handleFileSelected = (file) => {
			selectedFile.value = file
			fileForm.filePath = file.path
			fileForm.fileName = file.name
			fileForm.fileExt = file.fileExt || ''
			fileForm.fileCreatedTime = file.createdTime
			fileForm.fileUpdatedTime = file.updatedTime
			fileForm.isDirectory = file.isDirectory
		}

		const handleTagChange = (value) => {
			if (value && !fileForm.fileTags.includes(value)) {
				fileForm.fileTags.push(value)
				selectedTag.value = '' // 清空选择
			}
		}

		const removeTag = (tag) => {
			fileForm.fileTags = fileForm.fileTags.filter((t) => t !== tag)
		}

		const submitForm = async () => {
			if (!fileFormRef.value) return

			await fileFormRef.value.validate(async (valid) => {
				if (valid) {
					isSubmitting.value = true

					try {
						// 检查文件存在
						const fileExists = await window.electronAPI.checkFileExists(fileForm.filePath)
						if (!fileExists) {
							ElMessage.error('文件不存在或已被移动')
							return
						}

						// 创建可序列化数据
						const serializableData = {
							fileName: fileForm.fileName,
							filePath: fileForm.filePath,
							fileExt: fileForm.fileExt || '',
							fileCat: fileForm.fileCat || '',
							fileTags: fileForm.fileTags || [],
							fileDesc: fileForm.fileDesc || '',
							fileCreatedTime:
								typeof fileForm.fileCreatedTime === 'string' ? fileForm.fileCreatedTime : null,
							fileUpdatedTime:
								typeof fileForm.fileUpdatedTime === 'string' ? fileForm.fileUpdatedTime : null,
							isDirectory: Boolean(fileForm.isDirectory),
						}

						// 提交到数据库
						const fileId = await filesStore.addFile(serializableData)

						// 如果有新分类或标签，添加到存储
						if (fileForm.fileCat && !categories.value.includes(fileForm.fileCat)) {
							metadataStore.addCategory(fileForm.fileCat)
						}

						fileForm.fileTags.forEach((tag) => {
							if (!availableTags.value.includes(tag)) {
								metadataStore.addTag(tag)
							}
						})

						ElMessage.success('文件添加成功')
						resetForm()
					} catch (error) {
						console.error('提交表单错误:', error)

						// 处理特定错误
						if (error.message.includes('已存在于数据库中')) {
							ElMessage.warning(error.message) // 使用warning样式而不是error
						} else {
							ElMessage.error(`添加失败: ${error.message || '未知错误'}`)
						}
					} finally {
						isSubmitting.value = false
					}
				}
			})
		}

		const resetForm = () => {
			resetSignal.value = true // 发送重置信号
			
			// 延迟重置信号，以便下次可以再次触发
			setTimeout(() => {
				resetSignal.value = false
			}, 100)
			
			selectedFile.value = null
			fileForm.filePath = ''
			fileForm.fileName = ''
			fileForm.fileExt = ''
			fileForm.fileCat = ''
			fileForm.fileTags = []
			fileForm.fileDesc = ''
			fileForm.fileCreatedTime = ''
			fileForm.fileUpdatedTime = ''
			fileForm.isDirectory = false
			selectedTag.value = ''

			if (fileFormRef.value) {
				fileFormRef.value.resetFields()
			}
		}

		onMounted(() => {
			loadMetadata()
		})

		return {
			fileFormRef,
			selectedFile,
			fileForm,
			rules,
			categories,
			availableTags,
			selectedTag,
			isSubmitting,
			resetSignal,
			handleFileSelected,
			handleTagChange,
			removeTag,
			submitForm,
			resetForm,
		}
	},
}
</script>

<style scoped>
.add-file-container {
	padding: 20px;
}

.file-selector-wrapper {
	margin-bottom: 30px;
}

.tags-container {
	width: 100%;
}

.selected-tags {
	margin-top: 10px;
	display: flex;
	flex-wrap: wrap;
}

.tag-item {
	margin-right: 8px;
	margin-bottom: 8px;
}
</style>
