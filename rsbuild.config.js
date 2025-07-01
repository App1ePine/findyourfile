import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'

export default defineConfig({
	plugins: [pluginVue()],
	server: {
		port: 3000,
	},
	output: {
		distPath: {
			root: 'dist',
		},
		assetPrefix: './',
	},
	source: {
		entry: {
			index: './src/index.js',
		},
	},
	html: {
		template: './public/index.html',
	},
})
