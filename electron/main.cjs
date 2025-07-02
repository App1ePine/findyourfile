process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const {
	initDatabase,
	addFile,
	searchFiles,
	getStats,
	getAllTags,
	getAllCategories,
} = require('./database/sqlite.cjs')

let mainWindow
let db

function createWindow() {
	// 设置应用图标路径
	const iconPath = process.platform === 'darwin' 
		? path.join(__dirname, '../public/icons/mac.icns')
		: path.join(__dirname, '../public/icons/win.ico')
		
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		icon: iconPath,
		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			webSecurity: true,
		},
	})

	// 设置CSP策略
	mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
		// 开发环境使用较宽松的CSP
		const isDev = process.env.NODE_ENV === 'development'
		const cspValue = isDev
			? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws: wss:;"
			: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"

		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [cspValue],
			},
		})
	})

	// 打印路径，帮助调试
	const htmlPath = path.join(__dirname, '../dist/index.html')
	console.log('Loading HTML from:', htmlPath)
	console.log('File exists:', fs.existsSync(htmlPath))

	// 在开发模式下直接加载开发服务器
	if (process.env.NODE_ENV === 'development') {
		mainWindow.loadURL('http://localhost:3000')
		mainWindow.webContents.openDevTools()
	} else {
		// 生产模式下加载构建后的文件
		mainWindow.loadURL(`file://${htmlPath}`)
	}
}

app.whenReady().then(() => {
	db = initDatabase()
	createWindow()

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})

	// 文件选择器处理
	ipcMain.handle('select-file', async () => {
		const { canceled, filePaths } = await dialog.showOpenDialog({
			properties: ['openFile'],
		})

		if (canceled || filePaths.length === 0) {
			return null
		}

		const filePath = filePaths[0]
		return getFileInfo(filePath)
	})

	ipcMain.handle('select-directory', async () => {
		const { canceled, filePaths } = await dialog.showOpenDialog({
			properties: ['openDirectory'],
		})

		if (canceled || filePaths.length === 0) {
			return null
		}

		const dirPath = filePaths[0]
		return getFileInfo(dirPath)
	})

	// 文件信息获取
	ipcMain.handle('get-file-info', async (event, filePath) => {
		return getFileInfo(filePath)
	})

	// 文件操作
	ipcMain.handle('open-file', async (event, filePath) => {
		return shell.openPath(filePath)
	})

	ipcMain.handle('show-item-in-folder', async (event, filePath) => {
		return shell.showItemInFolder(filePath)
	})

	// 数据库操作
	ipcMain.handle('add-file', async (event, fileData) => {
		try {
			console.log('主进程接收到添加文件请求:', JSON.stringify(fileData))

			// 确保文件仍然存在
			if (!fs.existsSync(fileData.filePath)) {
				throw new Error('FILE_NOT_EXIST')
			}

			// 添加到数据库
			const fileId = await addFile(fileData)
			return fileId
		} catch (error) {
			console.error('添加文件失败:', error)

			// 根据错误类型返回不同的错误信息
			if (error.message === 'FILE_DUPLICATE') {
				throw new Error('FILE_DUPLICATE')
			} else if (error.message === 'FILE_NOT_EXIST') {
				throw new Error('FILE_NOT_EXIST')
			} else {
				throw new Error(error.message || '未知错误')
			}
		}
	})

	// 测试关键字查询功能
	ipcMain.handle('search-files', async (event, criteria) => {
		console.log('main: 收到search-files请求, 参数:', JSON.stringify(criteria))

		// 如果是关键字查询，添加特殊处理
		if (criteria.keyword) {
			console.log('检测到关键字查询:', criteria.keyword)

			// 执行最简单的SQL查询测试
			const testQuery = `SELECT * FROM files WHERE file_name LIKE '%${criteria.keyword}%' OR file_desc LIKE '%${criteria.keyword}%' LIMIT 10`
			console.log('执行测试查询:', testQuery)

			return new Promise((resolve, reject) => {
				db.all(testQuery, [], (err, rows) => {
					if (err) {
						console.error('测试查询错误:', err)
						reject(err)
					} else {
						console.log(`测试查询结果: ${rows.length} 条记录`)
						resolve(rows)
					}
				})
			})
		}

		// 其他查询逻辑...
		try {
			const results = await searchFiles(criteria)
			return results
		} catch (error) {
			console.error('搜索失败:', error)
			throw error
		}
	})

	ipcMain.handle('get-stats', async () => {
		try {
			const stats = await getStats()
			return stats
		} catch (error) {
			console.error('获取统计数据失败:', error)
			throw error
		}
	})

	ipcMain.handle('check-file-exists', async (event, filePath) => {
		return fs.existsSync(filePath)
	})

	// 获取所有分类
	ipcMain.handle('get-all-categories', async () => {
		try {
			const categories = await getAllCategories()
			return categories
		} catch (error) {
			console.error('获取所有分类失败:', error)
			throw error
		}
	})

	// 获取所有标签
	ipcMain.handle('get-all-tags', async () => {
		try {
			const tags = await getAllTags()
			return tags
		} catch (error) {
			console.error('获取所有标签失败:', error)
			throw error
		}
	})

	// 删除文件记录
	ipcMain.handle('delete-file', async (event, fileId) => {
		try {
			await deleteFile(fileId)
			return true
		} catch (error) {
			console.error('删除文件记录失败:', error)
			throw error
		}
	})

	// 检查数据库中是否有数据
	db.get('SELECT COUNT(*) as count FROM files', [], (err, row) => {
		if (err) {
			console.error('数据库连接测试失败:', err)
		} else {
			console.log(`数据库中有 ${row.count} 条记录`)

			// 查看几条示例数据
			if (row.count > 0) {
				db.all('SELECT * FROM files LIMIT 3', [], (err, rows) => {
					if (err) {
						console.error('获取示例数据失败:', err)
					} else {
						console.log('示例数据:')
						rows.forEach((row) => {
							console.log(`ID: ${row.file_id}, 名称: ${row.file_name}, 描述: ${row.file_desc}`)
						})
					}
				})
			}
		}
	})
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})

// 获取文件信息的辅助函数
function getFileInfo(filePath) {
	try {
		const stats = fs.statSync(filePath)
		const isDirectory = stats.isDirectory()
		const fileName = path.basename(filePath)
		const fileExt = isDirectory ? '' : path.extname(filePath).slice(1)

		return {
			path: filePath,
			name: fileName,
			isDirectory,
			fileExt,
			createdTime: stats.birthtime.toISOString(),
			updatedTime: stats.mtime.toISOString(),
			size: stats.size,
		}
	} catch (error) {
		console.error('获取文件信息失败:', error)
		return null
	}
}

function deleteFile(fileId) {
	return new Promise((resolve, reject) => {
		db.run('DELETE FROM files WHERE file_id = ?', [fileId], function (err) {
			if (err) {
				reject(err)
			} else {
				resolve(this.changes)
			}
		})
	})
}
