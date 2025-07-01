<template>
	<div class="search-files-container">
		<h1>查询文件</h1>

		<el-card class="search-card">
			<div class="search-type-selector">
				<el-radio-group v-model="searchType" @change="handleSearchTypeChange">
					<el-radio-button label="fileName">按文件名查询</el-radio-button>
					<el-radio-button label="keyword">按关键字查询</el-radio-button>
					<el-radio-button label="fileCat">按分类查询</el-radio-button>
					<el-radio-button label="fileTags">按标签查询</el-radio-button>
					<el-radio-button label="dateRange">按时间查询</el-radio-button>
					<el-radio-button label="advanced">高级查询</el-radio-button>
				</el-radio-group>
			</div>

			<div class="search-content">
				<!-- 文件名查询 -->
				<template v-if="searchType === 'fileName'">
					<el-input
						v-model="searchForm.fileName"
						placeholder="请输入文件名关键词"
						clearable
						:prefix-icon="Search"
						@keyup.enter="search"
					>
						<template #append>
							<el-button @click="search" :loading="isLoading">查询</el-button>
						</template>
					</el-input>
				</template>

				<!-- 关键字查询 -->
				<template v-else-if="searchType === 'keyword'">
					<el-input
						v-model="searchForm.keyword"
						placeholder="请输入关键字(同时搜索文件名和描述)"
						clearable
						:prefix-icon="Search"
						@keyup.enter="search"
					>
						<template #append>
							<el-button @click="search" :loading="isLoading">查询</el-button>
						</template>
					</el-input>
				</template>

				<!-- 分类查询 -->
				<template v-else-if="searchType === 'fileCat'">
					<div class="category-search">
						<el-select
							v-model="searchForm.fileCat"
							filterable
							placeholder="请选择分类"
							style="width: 100%"
							clearable
						>
							<el-option
								v-for="category in availableCategories"
								:key="category"
								:label="category"
								:value="category"
							/>
						</el-select>
						<el-button type="primary" @click="search" :loading="isLoading" class="search-button">
							查询
						</el-button>
					</div>
				</template>

				<!-- 标签查询 -->
				<template v-else-if="searchType === 'fileTags'">
					<div class="tags-search">
						<el-select
							v-model="searchForm.fileTags"
							multiple
							filterable
							allow-create
							default-first-option
							placeholder="请选择或输入标签"
							style="width: 100%"
							clearable
						>
							<el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
						</el-select>
						<el-button type="primary" @click="search" :loading="isLoading" class="search-button">
							查询
						</el-button>
					</div>
				</template>

				<!-- 时间查询 -->
				<template v-else-if="searchType === 'dateRange'">
					<div class="date-search">
						<el-date-picker
							v-model="searchForm.dateRange"
							type="daterange"
							range-separator="至"
							start-placeholder="开始日期"
							end-placeholder="结束日期"
							style="width: 100%"
							value-format="YYYY-MM-DD"
							clearable
						/>
						<el-button type="primary" @click="search" :loading="isLoading" class="search-button">
							查询
						</el-button>
					</div>
				</template>

				<!-- 高级查询 -->
				<template v-else-if="searchType === 'advanced'">
					<el-form :model="searchForm" label-width="80px">
						<el-row :gutter="20">
							<el-col :span="12">
								<el-form-item label="文件名">
									<el-input
										v-model="searchForm.fileName"
										placeholder="请输入文件名关键词"
										clearable
									/>
								</el-form-item>
							</el-col>

							<el-col :span="12">
								<el-form-item label="关键字">
									<el-input
										v-model="searchForm.keyword"
										placeholder="同时搜索文件名和描述"
										clearable
									/>
								</el-form-item>
							</el-col>
						</el-row>

						<el-row :gutter="20">
							<el-col :span="12">
								<el-form-item label="分类">
									<el-select
										v-model="searchForm.fileCat"
										filterable
										placeholder="请选择分类"
										style="width: 100%"
										clearable
									>
										<el-option
											v-for="category in availableCategories"
											:key="category"
											:label="category"
											:value="category"
										/>
									</el-select>
								</el-form-item>
							</el-col>

							<el-col :span="12">
								<el-form-item label="添加时间">
									<el-date-picker
										v-model="searchForm.dateRange"
										type="daterange"
										range-separator="至"
										start-placeholder="开始日期"
										end-placeholder="结束日期"
										style="width: 100%"
										value-format="YYYY-MM-DD"
										clearable
									/>
								</el-form-item>
							</el-col>
						</el-row>

						<el-form-item label="标签">
							<el-select
								v-model="searchForm.fileTags"
								multiple
								filterable
								allow-create
								default-first-option
								placeholder="请选择标签"
								style="width: 100%"
								clearable
							>
								<el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
							</el-select>
						</el-form-item>

						<el-form-item>
							<el-button type="primary" @click="search" :loading="isLoading">查询</el-button>
							<el-button @click="resetSearch">重置</el-button>
						</el-form-item>
					</el-form>
				</template>
			</div>
		</el-card>

		<div v-if="isLoading" class="loading-container">
			<el-skeleton :rows="5" animated />
		</div>

		<div v-else-if="searchResults.length === 0 && hasSearched" class="no-results">
			<el-empty description="没有找到匹配的文件" />
		</div>

		<div v-else-if="searchResults.length > 0" class="search-results">
			<el-card class="result-card">
				<div slot="header" class="result-header">
					<span>查询结果</span>
					<span class="result-count">共找到 {{ searchResults.length }} 个文件</span>
				</div>

				<FileTable :files="paginatedResults" @refresh="handleRefresh" />

				<el-pagination
					v-if="searchResults.length > pageSize"
					:current-page="currentPage"
					:page-size="pageSize"
					:total="searchResults.length"
					layout="prev, pager, next"
					@current-change="handlePageChange"
					class="pagination"
				/>
			</el-card>
		</div>
	</div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useFilesStore } from '../stores/files'
import { useMetadataStore } from '../stores/metadata'
import FileTable from '../components/FileTable.vue'
import { ElMessage } from 'element-plus'
import { Search, Collection } from '@element-plus/icons-vue'

export default {
	name: 'SearchFiles',
	components: {
		FileTable,
	},
	setup() {
		const filesStore = useFilesStore()
		const metadataStore = useMetadataStore()
		const searchForm = reactive({
			fileName: '',
			keyword: '',
			fileCat: '',
			fileTags: [],
			dateRange: [],
		})

		const searchType = ref('fileName') // 默认按文件名查询
		const searchResults = ref([])
		const availableTags = ref([])
		const availableCategories = ref([])
		const isLoading = ref(false)
		const currentPage = ref(1)
		const pageSize = ref(10)
		const hasSearched = ref(false)

		// 切换查询类型时清空相关字段
		const handleSearchTypeChange = (type) => {
			// 重置所有查询条件
			if (type !== 'advanced') {
				resetSearch()
			}
		}

		// 加载所有标签和分类
		const loadMetadata = async () => {
			try {
				availableTags.value = await metadataStore.fetchTags()
				availableCategories.value = await metadataStore.fetchCategories()
				console.log('已加载分类:', availableCategories.value)
			} catch (error) {
				console.error('加载元数据失败:', error)
				ElMessage.error('加载分类和标签数据失败')
			}
		}

		// 分页结果
		const paginatedResults = computed(() => {
			const start = (currentPage.value - 1) * pageSize.value
			const end = start + pageSize.value
			return searchResults.value.slice(start, end)
		})

		// 准备查询条件
		const prepareSearchCriteria = () => {
			const criteria = {}

			if (searchType.value === 'fileName' || searchType.value === 'advanced') {
				if (searchForm.fileName.trim()) {
					criteria.fileName = searchForm.fileName.trim()
				}
			}

			if (searchType.value === 'keyword' || searchType.value === 'advanced') {
				if (searchForm.keyword.trim()) {
					criteria.keyword = searchForm.keyword.trim()
					console.log('添加关键字查询条件:', criteria.keyword)
				}
			}

			if (searchType.value === 'fileCat' || searchType.value === 'advanced') {
				if (searchForm.fileCat.trim()) {
					criteria.fileCat = searchForm.fileCat.trim()
				}
			}

			if (searchType.value === 'fileTags' || searchType.value === 'advanced') {
				if (searchForm.fileTags.length > 0) {
					criteria.fileTags = searchForm.fileTags
				}
			}

			if (searchType.value === 'dateRange' || searchType.value === 'advanced') {
				if (searchForm.dateRange && searchForm.dateRange.length === 2) {
					criteria.startDate = searchForm.dateRange[0]
					criteria.endDate = searchForm.dateRange[1]
				}
			}

			console.log('最终查询条件:', JSON.stringify(criteria))
			return criteria
		}

		// 执行搜索
		const search = async () => {
			console.log('开始搜索，searchType =', searchType.value)
			console.log('searchForm =', JSON.stringify(searchForm))

			// 添加直接日志输出
			if (searchType.value === 'keyword') {
				console.log('执行关键字查询:', searchForm.keyword)

				// 尝试直接调用API
				try {
					const results = await window.electronAPI.searchFiles({
						keyword: searchForm.keyword.trim(),
					})
					console.log('关键字查询结果:', results)
					searchResults.value = results
				} catch (error) {
					console.error('直接关键字查询错误:', error)
				}
				return
			}

			const criteria = prepareSearchCriteria()

			// 确保至少有一个查询条件
			if (Object.keys(criteria).length === 0) {
				ElMessage.warning('请至少输入一个查询条件')
				return
			}

			isLoading.value = true
			hasSearched.value = true

			try {
				console.log('开始搜索，条件:', JSON.stringify(criteria))
				const results = await filesStore.searchFiles(criteria)
				console.log('搜索结果:', results)
				searchResults.value = results
				currentPage.value = 1

				console.log('搜索结果数量:', results.length)

				// 只有当结果为空且进行了查询时才显示提示
				if (results.length === 0) {
					ElMessage.info('没有找到匹配的文件')
				}
			} catch (error) {
				console.error('查询执行失败:', error)
				ElMessage.error(`查询失败: ${error.message || '未知错误'}`)
				searchResults.value = []
			} finally {
				isLoading.value = false
			}
		}

		// 重置搜索条件
		const resetSearch = () => {
			searchForm.fileName = ''
			searchForm.keyword = ''
			searchForm.fileCat = ''
			searchForm.fileTags = []
			searchForm.dateRange = []
			searchResults.value = []
			hasSearched.value = false
		}

		// 页码变更
		const handlePageChange = (page) => {
			currentPage.value = page
		}

		// 当FileTable组件触发refresh事件时，重新加载数据
		const handleRefresh = async () => {
			// 如果已经搜索过，则重新执行搜索
			if (hasSearched.value) {
				await search()
			}
		}

		// 页面加载时获取标签
		onMounted(() => {
			loadMetadata()
		})

		return {
			searchForm,
			searchType,
			searchResults,
			paginatedResults,
			availableTags,
			availableCategories,
			isLoading,
			currentPage,
			pageSize,
			hasSearched,
			Search,
			Collection,
			handleSearchTypeChange,
			search,
			resetSearch,
			handlePageChange,
			handleRefresh,
		}
	},
}
</script>

<style scoped>
.search-files-container {
	padding: 20px;
}

.search-card {
	margin-bottom: 20px;
}

.search-type-selector {
	margin-bottom: 20px;
}

.search-content {
	margin-top: 20px;
}

.tags-search,
.date-search {
	display: flex;
	align-items: center;
}

.search-button {
	margin-left: 10px;
	flex-shrink: 0;
}

.loading-container {
	padding: 20px;
}

.no-results {
	margin-top: 40px;
	text-align: center;
}

.result-card {
	margin-top: 20px;
}

.result-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.result-count {
	font-size: 14px;
	color: #909399;
}

.pagination {
	margin-top: 20px;
	text-align: center;
}

.category-search {
	display: flex;
	align-items: center;
}

.category-search .el-select {
	flex: 1;
}
</style>
