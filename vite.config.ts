import { readFile } from 'node:fs/promises'
import { defineConfig, type Connect } from 'vite'
import react from '@vitejs/plugin-react'
import homeCopy from './src/content/en/home.json'
import hubCopy from './src/content/en/developer/hub.json'
import englishWiki from './src/content/en/developer/ui.json'
import russianWiki from './src/content/ru/developer/ui.json'
import { renderCopy } from './src/content/renderCopy'

const hubEntry = 'developer/index.html'
const wikiEntry = 'developer/limen/index.html'
const russianWikiEntry = 'developer/limen/ru/index.html'
const englishWikiEntry = 'developer/limen/en/index.html'
const englishApiEntry = 'developer/api/limen/index.html'
const russianApiEntry = 'developer/api/limen/ru/index.html'
const htmlPages = ['index.html', hubEntry, wikiEntry, englishWikiEntry, russianWikiEntry, englishApiEntry, russianApiEntry]

const redirectDeveloperDirectory: Connect.NextHandleFunction = (request, response, next) => {
	const match = request.url?.match(/^(\/developer(?:\/limen(?:\/(?:en|ru))?|\/api\/limen(?:\/ru)?)?)(\?.*)?$/)

	if (!match || (request.method !== 'GET' && request.method !== 'HEAD')) {
		return next()
	}

	const [, pathname, query = ''] = match
	response.writeHead(302, { Location: pathname + '/' + query }).end()
}

export default defineConfig({
	base: './',
	plugins: [
		react(),
		{
			name: 'site-pages',
			configureServer(server) {
				server.middlewares.use(redirectDeveloperDirectory)
			},
			configurePreviewServer(server) {
				server.middlewares.use(redirectDeveloperDirectory)
			},
			transformIndexHtml: {
				order: 'pre',
				async handler(html, context) {
					const filename = context.filename.replace(/\\/g, '/')

					if (filename.endsWith('/' + hubEntry)) {
						return renderCopy(html, hubCopy.meta)
					}

					const isRussianApi = filename.endsWith('/' + russianApiEntry)

					if (isRussianApi || filename.endsWith('/' + englishApiEntry)) {
						const template = await readFile(new URL('./src/content/developer/api/shell.html', import.meta.url), 'utf8')
						const wiki = isRussianApi ? russianWiki : englishWiki
						const hubHref = isRussianApi ? '../../../' : '../../'

						return renderCopy(template, {
							...wiki.shell,
							...wiki.api,
							hubHref,
						})
					}

					const isEnglishWiki = filename.endsWith('/' + englishWikiEntry)

					if (isEnglishWiki || filename.endsWith('/' + russianWikiEntry)) {
						const template = await readFile(new URL('./src/content/developer/shell.html', import.meta.url), 'utf8')
						const wiki = isEnglishWiki ? englishWiki : russianWiki

						return renderCopy(template, {
							...wiki.shell,
							hubHref: '../../',
						})
					}

					if (filename.endsWith('/index.html') && !filename.endsWith('/' + wikiEntry)) {
						return renderCopy(html, homeCopy.meta)
					}
				},
			},
		},
	],
	build: {
		rollupOptions: {
			input: htmlPages,
		},
	},
})
