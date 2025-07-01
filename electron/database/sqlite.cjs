const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

// 数据库路径
const dbPath = path.join(app.getPath('userData'), 'database.sqlite')
let db

// 初始化数据库
function initDatabase() {
	const dbDir = path.dirname(dbPath)
	if (!fs.existsSync(dbDir)) {
		fs.mkdirSync(dbDir, { recursive: true })
	}

	db = new sqlite3.Database(dbPath)

	// 创建表
	db.serialize(() => {
		db.run(`
      CREATE TABLE IF NOT EXISTS files (
        file_id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_ext TEXT,
        file_cat TEXT,
        file_tags TEXT,
        file_desc TEXT,
        file_created_time DATETIME,
        file_updated_time DATETIME,
        file_path TEXT NOT NULL UNIQUE,
        is_directory BOOLEAN DEFAULT 0,
        added_time DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
	})

	console.log('Database initialized at:', dbPath)
	return db
}

// 检查文件是否已存在于数据库
function isFileExists(filePath) {
	return new Promise((resolve, reject) => {
		db.get('SELECT file_id FROM files WHERE file_path = ?', [filePath], (err, row) => {
			if (err) {
				reject(err)
			} else {
				resolve(!!row) // 如果找到记录则返回true
			}
		})
	})
}

// 添加文件记录
function addFile(fileData) {
	return new Promise(async (resolve, reject) => {
		try {
			// 先检查文件是否已存在
			const exists = await isFileExists(fileData.filePath)
			if (exists) {
				// 返回自定义错误，指明是文件重复
				reject(new Error('FILE_DUPLICATE'))
				return
			}

			console.log('收到文件数据:', fileData)

			// 处理标签 - 确保它是一个字符串
			let tagsString
			if (typeof fileData.fileTags === 'string') {
				// 如果已经是字符串，检查是否是有效的JSON
				try {
					JSON.parse(fileData.fileTags)
					tagsString = fileData.fileTags
				} catch (e) {
					tagsString = JSON.stringify([fileData.fileTags])
				}
			} else if (Array.isArray(fileData.fileTags)) {
				tagsString = JSON.stringify(fileData.fileTags)
			} else {
				tagsString = JSON.stringify([])
			}

			const stmt = db.prepare(`
        INSERT INTO files (
          file_name, file_ext, file_cat, file_tags, file_desc, 
          file_created_time, file_updated_time, file_path, is_directory
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

			stmt.run(
				fileData.fileName,
				fileData.fileExt,
				fileData.fileCat,
				tagsString,
				fileData.fileDesc,
				fileData.fileCreatedTime,
				fileData.fileUpdatedTime,
				fileData.filePath,
				fileData.isDirectory ? 1 : 0,
				function (err) {
					if (err) {
						console.error('数据库插入错误:', err)
						// 如果是唯一约束错误，返回自定义错误
						if (err.message.includes('UNIQUE constraint failed')) {
							reject(new Error('FILE_DUPLICATE'))
						} else {
							reject(err)
						}
					} else {
						resolve(this.lastID)
					}
				},
			)

			stmt.finalize()
		} catch (error) {
			console.error('addFile函数执行错误:', error)
			reject(error)
		}
	})
}

// 搜索文件
function searchFiles(criteria) {
	return new Promise((resolve, reject) => {
		try {
			// 构建基本查询
			let query = `SELECT * FROM files WHERE 1=1`
			const params = []

			// 关键字查询 - 简化逻辑，确保正确性
			if (criteria.keyword) {
				// 使用OR逻辑，匹配文件名或描述
				query += ` AND (file_name LIKE ? OR file_desc LIKE ?)`
				params.push(`%${criteria.keyword}%`)
				params.push(`%${criteria.keyword}%`)

				// 输出调试信息
				console.log(`关键字查询: "${criteria.keyword}"`)
			}

			// 其他查询条件保持不变
			if (criteria.fileName) {
				query += ` AND file_name LIKE ?`
				params.push(`%${criteria.fileName}%`)
			}

			if (criteria.fileCat) {
				query += ` AND file_cat = ?`
				params.push(criteria.fileCat)
			}

			if (criteria.fileTags && Array.isArray(criteria.fileTags) && criteria.fileTags.length > 0) {
				const tagConditions = []
				criteria.fileTags.forEach((tag) => {
					tagConditions.push(`file_tags LIKE ?`)
					params.push(`%"${tag}"%`)
				})
				query += ` AND (${tagConditions.join(' OR ')})`
			}

			if (criteria.startDate) {
				query += ` AND added_time >= ?`
				params.push(`${criteria.startDate} 00:00:00`)
			}

			if (criteria.endDate) {
				query += ` AND added_time <= ?`
				params.push(`${criteria.endDate} 23:59:59`)
			}

			console.log('执行SQL:', query)
			console.log('参数:', params)

			// 执行查询
			db.all(query, params, (err, rows) => {
				if (err) {
					console.error('查询错误:', err)
					reject(err)
					return
				}

				console.log(`查询结果: ${rows.length} 条`)

				// 如果是关键字查询且没有结果，检查数据库中是否有描述字段有数据
				if (rows.length === 0 && criteria.keyword) {
					db.get(
						"SELECT COUNT(*) as count FROM files WHERE file_desc IS NOT NULL AND file_desc != ''",
						[],
						(err, result) => {
							if (err) {
								console.error('检查描述字段错误:', err)
							} else {
								console.log(`数据库中有 ${result.count} 条记录含有描述`)
							}
							resolve(rows)
						},
					)
				} else {
					resolve(rows)
				}
			})
		} catch (error) {
			console.error('查询异常:', error)
			reject(error)
		}
	})
}

// 获取统计数据
function getStats() {
	return new Promise((resolve, reject) => {
		const stats = {}

		// 获取文件总数
		db.get('SELECT COUNT(*) as count FROM files WHERE is_directory = 0', (err, row) => {
			if (err) {
				reject(err)
				return
			}
			stats.fileCount = row.count

			// 获取文件夹总数
			db.get('SELECT COUNT(*) as count FROM files WHERE is_directory = 1', (err, row) => {
				if (err) {
					reject(err)
					return
				}
				stats.dirCount = row.count

				// 获取文件类型分布
				db.all(
					'SELECT file_ext, COUNT(*) as count FROM files WHERE is_directory = 0 GROUP BY file_ext',
					(err, rows) => {
						if (err) {
							reject(err)
							return
						}
						stats.fileTypes = rows

						// 获取最近添加的文件
						db.all('SELECT * FROM files ORDER BY added_time DESC LIMIT 10', (err, rows) => {
							if (err) {
								reject(err)
							} else {
								stats.recentFiles = rows.map((row) => ({
									...row,
									fileTags: JSON.parse(row.file_tags || '[]'),
								}))
								resolve(stats)
							}
						})
					},
				)
			})
		})
	})
}

// 获取所有分类
function getAllCategories() {
	return new Promise((resolve, reject) => {
		db.all(
			'SELECT DISTINCT file_cat FROM files WHERE file_cat IS NOT NULL AND file_cat != ""',
			(err, rows) => {
				if (err) {
					reject(err)
					return
				}

				const categories = rows.map((row) => row.file_cat)
				resolve(categories)
			},
		)
	})
}

// 获取所有标签
function getAllTags() {
	return new Promise((resolve, reject) => {
		db.all(
			'SELECT file_tags FROM files WHERE file_tags IS NOT NULL AND file_tags != ""',
			(err, rows) => {
				if (err) {
					reject(err)
					return
				}

				// 从所有记录中提取唯一标签
				const allTags = new Set()
				rows.forEach((row) => {
					if (row.file_tags) {
						try {
							const tags = JSON.parse(row.file_tags)
							if (Array.isArray(tags)) {
								tags.forEach((tag) => {
									if (tag) allTags.add(tag)
								})
							}
						} catch (e) {
							console.error('解析标签失败:', e)
						}
					}
				})

				resolve(Array.from(allTags))
			},
		)
	})
}

module.exports = {
	initDatabase,
	addFile,
	searchFiles,
	getStats,
	getAllTags,
	getAllCategories,
	isFileExists,
}
