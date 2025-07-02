export default {
	appId: 'com.djl.findyourfile.app',
	productName: '文件位置查询软件',
	directories: {
		output: 'release',
	},
	files: ['dist/**/*', 'electron/**/*'],
	asar: true,
	mac: {
		target: [
			{ target: 'zip', arch: ['arm64', 'x64'] },
			{ target: 'dmg', arch: ['arm64', 'x64'] },
		],
		icon: 'public/icons/mac.icns',
		artifactName: 'findyourfile-${version}-mac-${arch}.${ext}',
		category: 'public.app-category.productivity',
		hardenedRuntime: false,
		notarize: false,
	},
	win: {
		target: [
			{ target: 'zip', arch: ['x64'] },
			{ target: 'nsis', arch: ['x64'] },
		],
		icon: 'public/icons/win.ico',
		artifactName: 'findyourfile-${version}-win-x64.${ext}',
	},
	nsis: {
		oneClick: false,
		allowElevation: true,
		allowToChangeInstallationDirectory: true,
		createDesktopShortcut: true,
		createStartMenuShortcut: true,
	},
	forceCodeSigning: false,
	publish: {
		provider: 'generic',
		url: 'https://updates.djldjl.cn/findyourfile/${os}-${arch}/',
	},
}
