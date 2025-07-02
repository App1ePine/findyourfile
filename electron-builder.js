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
			{ target: 'zip', arch: ['arm64'] },
			{ target: 'dmg', arch: ['arm64'] },
		],
		icon: 'dist/icons/mac/icon.icns',
		artifactName: 'findyourfile-${version}-mac-arm64.${ext}',
		category: 'public.app-category.productivity',
		// 使用自签名配置
		identity: 'ApplePine',
		hardenedRuntime: false,
		notarize: false,
	},
	win: {
		target: [
			{ target: 'zip', arch: ['x64'] },
			{ target: 'nsis', arch: ['x64'] },
		],
		icon: 'dist/icons/win/icon.ico',
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
