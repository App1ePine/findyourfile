const { contextBridge, ipcRenderer } = require('electron')

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
	// 文件操作
	addFile: (fileData) => ipcRenderer.invoke('add-file', fileData),
	searchFiles: (criteria) => {
		console.log('preload: searchFiles 被调用，参数:', JSON.stringify(criteria))
		return ipcRenderer.invoke('search-files', criteria)
	},
	getStats: () => ipcRenderer.invoke('get-stats'),
	checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
	deleteFile: (fileId) => ipcRenderer.invoke('delete-file', fileId),
	updateFile: (fileId, fileData) => ipcRenderer.invoke('update-file', fileId, fileData),

	// 文件选择器
	selectFile: () => ipcRenderer.invoke('select-file'),
	selectDirectory: () => ipcRenderer.invoke('select-directory'),

	// 文件操作
	openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
	showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
	getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),

	// 添加新方法
	getAllCategories: () => ipcRenderer.invoke('get-all-categories'),
	getAllTags: () => ipcRenderer.invoke('get-all-tags'),
})
