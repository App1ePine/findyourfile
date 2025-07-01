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

// 添加文件记录
function addFile(fileData) {
	return new Promise((resolve, reject) => {
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
			JSON.stringify(fileData.fileTags || []),
			fileData.fileDesc,
			fileData.fileCreatedTime,
			fileData.fileUpdatedTime,
			fileData.filePath,
			fileData.isDirectory ? 1 : 0,
			function (err) {
				if (err) {
					reject(err)
				} else {
					resolve(this.lastID)
				}
			},
		)

		stmt.finalize()
	})
}

// 搜索文件
function searchFiles(criteria) {
	return new Promise((resolve, reject) => {
		let query = `SELECT * FROM files WHERE 1=1`
		const params = []

		if (criteria.fileName) {
			query += ` AND file_name LIKE ?`
			params.push(`%${criteria.fileName}%`)
		}

		if (criteria.fileCat) {
			query += ` AND file_cat = ?`
			params.push(criteria.fileCat)
		}

		if (criteria.fileTags && criteria.fileTags.length > 0) {
			const tagConditions = criteria.fileTags.map(() => `file_tags LIKE ?`).join(' OR ')
			query += ` AND (${tagConditions})`
			criteria.fileTags.forEach((tag) => {
				params.push(`%${tag}%`)
			})
		}

		if (criteria.startDate) {
			query += ` AND added_time >= ?`
			params.push(criteria.startDate)
		}

		if (criteria.endDate) {
			query += ` AND added_time <= ?`
			params.push(criteria.endDate)
		}

		db.all(query, params, (err, rows) => {
			if (err) {
				reject(err)
			} else {
				// 解析JSON格式的标签
				const results = rows.map((row) => ({
					...row,
					fileTags: JSON.parse(row.file_tags || '[]'),
				}))
				resolve(results)
			}
		})
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

module.exports = {
	initDatabase,
	addFile,
	searchFiles,
	getStats,
}
