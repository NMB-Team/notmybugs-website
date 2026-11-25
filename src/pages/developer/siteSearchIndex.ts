import catalogUrl from '../../content/developer/api/catalog.json?url&no-inline'
import englishWiki from '../../content/en/developer/ui.json'
import englishUsage from '../../content/en/developer/api/usage.json'
import russianWiki from '../../content/ru/developer/ui.json'
import russianDocs from '../../content/ru/developer/api/docs.json'
import russianUsage from '../../content/ru/developer/api/usage.json'

export type SearchPage = {
	title: string
	detail: string
	href: string
	keywords?: string
}

type Catalog = {
	types: {
		path: string
		importPath: string
		doc?: string
		internal?: boolean
		members: { name: string; signature: string; doc?: string; internal?: boolean }[]
	}[]
}

const articles = import.meta.glob<Record<string, string>>('../../content/*/developer/articles/*.json', {
	eager: true,
	import: 'default',
})
const docs: Record<string, Record<string, string>> = russianDocs

export async function loadSearchPages(language: 'en' | 'ru', guideLabel: string, apiLabel: string): Promise<SearchPage[]> {
	const response = await fetch(catalogUrl)

	if (!response.ok) {
		throw new Error('API catalog unavailable')
	}

	const catalog: Catalog = await response.json()
	const wiki = language === 'ru' ? russianWiki : englishWiki
	const usage: Record<string, Record<string, string>> = language === 'ru' ? russianUsage : englishUsage
	const wikiHref = `./limen/${language}/#/`
	const apiHref = language === 'ru' ? './api/limen/ru/' : './api/limen/'
	const pages = Object.entries(wiki.pages).map(([route, page]) => {
		const copy = articles[`../../content/${language}/developer/articles/${route}.json`]

		return {
			title: page.title,
			detail: guideLabel + ' · ' + page.description,
			href: wikiHref + route,
			keywords: [route, 'navTitle' in page ? page.navTitle : '', ...Object.values(copy)]
				.join(' ').replace(/<[^>]*>/g, ' '),
		}
	})

	for (const type of catalog.types) {
		if (type.internal) {
			continue
		}

		const title = type.path.slice(type.path.lastIndexOf('.') + 1)
		const detail = apiLabel + ' · ' + type.path
		const href = apiHref + '?type=' + type.path
		const translated = language === 'ru' ? docs[type.path] : undefined
		const typeDoc = language === 'ru' ? translated?.[''] : type.doc
		const notes = usage[type.path.slice('limen.'.length)]

		pages.push({ title, detail, href, keywords: [type.importPath, typeDoc, notes?.['']].join(' ') })

		for (const member of type.members) {
			if (member.internal) {
				continue
			}

			const memberDoc = language === 'ru' ? translated?.[member.name] : member.doc

			pages.push({
				title: title + '.' + member.name,
				detail,
				href: href + '#member-' + member.name,
				keywords: [member.signature, memberDoc, notes?.[member.name]].join(' '),
			})
		}
	}

	return pages
}
