import catalogUrl from '../../content/developer/api/catalog.json?url&no-inline'
import { renderCopy } from '../../content/renderCopy'
import { memberDescription, memberUsage, typeDescription } from './apiUsage'
import { highlightHaxe } from './haxeHighlight'
import { mountSiteHeader } from './SiteHeader'
import { api as englishApi } from '../../content/en/developer/ui.json'
import { api as russianApi } from '../../content/ru/developer/ui.json'
import openglLogo from './assets/gfx/opengl.svg?raw'
import vulkanLogo from './assets/gfx/vulkan.svg?raw'
import nvidiaLogo from './assets/gfx/nvidia.svg?raw'
import amdLogo from './assets/gfx/amd.svg?raw'
import './styles/_api-reference.scss'

type Member = {
	name: string
	kind: 'constructor' | 'value' | 'staticField' | 'staticMethod' | 'field' | 'method' | 'operator'
	signature: string
	doc?: string
	line?: number
	internal?: boolean
	define?: string
}

type ApiType = {
	path: string
	importPath: string
	kind: 'class' | 'abstract' | 'enum' | 'enumAbstract' | 'typedef'
	declaration: string
	file: string
	line: number
	doc?: string
	internal?: boolean
	forwarded?: string[]
	members: Member[]
}

const kinds: Record<ApiType['kind'], [string, string]> = {
	class: ['class', 'класс'],
	abstract: ['abstract', 'абстрактный тип'],
	enum: ['enum', 'перечисление'],
	enumAbstract: ['enum abstract', 'абстрактное перечисление'],
	typedef: ['typedef', 'псевдоним типа'],
}

type Catalog = { revision: string; version: string; types: ApiType[] }

const isRussian = document.documentElement.lang === 'ru'
const labels = isRussian ? {
	title: 'Справочник API Limen',
	intro: 'Справочник по всем публичным объявлениям Haxe для HashLink: платформа, ввод, окна, OpenGL, Vulkan, Direct3D и постобработка.',
	filter: 'Поиск по типам, полям и методам',
	placeholder: 'Например, Window.create',
	internals: 'Включить внутренние привязки',
	noResults: 'Ничего не найдено. Попробуйте изменить запрос или пакет.',
	more: 'Показать ещё',
	index: 'Указатель API',
	source: 'Исходник',
	revision: 'Ревизия',
	guide: 'Руководство',
	members: 'На этой странице',
	example: 'Пример',
	referencedBy: 'Где используется:',
	internal: 'Внутренний API',
	conditional: 'Флаг компиляции',
	forwarded: 'Члены базового типа',
	apiNotes: 'Доступность функций зависит от платформы, драйвера и установленных нативных модулей.',
	license: 'Лицензия Limen (MIT)',
	tree: 'Дерево пакетов',
	results: 'Результатов',
	clearScope: 'Все пакеты',
	matchMembers: 'Поиск по полям и методам типа',
	featured: 'Основные типы',
	backends: 'Графические API',
	loadFailed: 'Не удалось загрузить справочник. Обновите страницу.',
	missingType: 'Тип не найден в этой версии Limen.',
} : {
	title: 'Limen API reference',
	intro: 'Browse every public Haxe declaration for HashLink across the platform, input, windowing, OpenGL, Vulkan, Direct3D, and post-processing APIs.',
	filter: 'Find types and members',
	placeholder: 'e.g. Window.create',
	internals: 'Include internal bindings',
	noResults: 'No results. Try a different query or package.',
	more: 'Show more',
	index: 'API index',
	source: 'Source',
	revision: 'Revision',
	guide: 'Guide',
	members: 'On this page',
	example: 'Example',
	referencedBy: 'Referenced by',
	internal: 'Internal API',
	conditional: 'Compiler define',
	forwarded: 'Forwarded members',
	apiNotes: 'Availability depends on your platform, driver, and installed native modules.',
	license: 'Limen license (MIT)',
	tree: 'Package tree',
	results: 'Results',
	clearScope: 'All packages',
	matchMembers: 'Filter members on this page',
	featured: 'Core types',
	backends: 'Graphics APIs',
	loadFailed: 'Could not load the reference. Reload the page to try again.',
	missingType: 'This type was not found in this Limen revision.',
}

const groups: Record<Member['kind'], [string, string]> = {
	constructor: ['Constructors', 'Конструкторы'],
	value: ['Values and constants', 'Значения и константы'],
	staticField: ['Static fields', 'Статические поля'],
	staticMethod: ['Static methods', 'Статические методы'],
	field: ['Fields and properties', 'Поля и свойства'],
	method: ['Instance methods', 'Методы экземпляра'],
	operator: ['Operators', 'Операторы'],
}
const badgeShapes: Record<string, [string, string]> = {
	'limen.graphics.renderer.opengl': ['gl', '<path d="M8 2 14 5.5v5L8 14 2 10.5v-5Z"/><path d="M2 5.5 8 9l6-3.5M8 9v5"/>'],
	'limen.graphics.renderer.vulkan': ['vk', '<path d="M2 3h3l3 7 3-7h3l-6 11Z"/>'],
	'limen.graphics.renderer.d3d11': ['dx', '<rect x="3" y="3" width="10" height="10"/><path d="M8 3v10M3 8h10"/>'],
	'limen.graphics.renderer.d3d12': ['dx', '<rect x="2" y="2" width="7" height="7"/><rect x="7" y="7" width="7" height="7"/>'],
	'limen.graphics.postprocess': ['fx', '<path d="M8 1.5 9.6 6.4 14.5 8 9.6 9.6 8 14.5 6.4 9.6 1.5 8 6.4 6.4Z"/>'],
	'limen.platform.Platform': ['core', '<circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.4 3.4l2.1 2.1M10.5 10.5l2.1 2.1M12.6 3.4l-2.1 2.1M5.5 10.5l-2.1 2.1"/>'],
	'limen.platform.window.Window': ['core', '<rect x="2" y="3" width="12" height="10"/><path d="M2 6h12"/>'],
	'limen.platform.event.Event': ['core', '<path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8Z"/>'],
	'limen.platform.event.EventType': ['core', '<path d="M2.5 4h11M2.5 8h11M2.5 12h7"/>'],
}
const logos: Record<string, [string, string][]> = {
	'limen.graphics.renderer.opengl': [['gl', openglLogo]],
	'limen.graphics.renderer.vulkan': [['vk', vulkanLogo]],
	'limen.graphics.postprocess': [['nv', nvidiaLogo], ['amd', amdLogo]],
}
const logoViewBox: Record<string, string> = { gl: '0 7 24 10', vk: '0 8.8 24 6.4', nv: '0 4 24 16', amd: '0 9 24 5.8' }
const logoBadges = (path: string) => (logos[path] ?? []).map(([kind, svg]) =>
	`<span class="gfx-badge gfx-logo gfx-${kind}" aria-hidden="true">${svg.replace(/<title>.*?<\/title>/, '').replace('role="img"', '').replace('viewBox="0 0 24 24"', `viewBox="${logoViewBox[kind]}"`)}</span>`,
).join('<span class="gfx-x" aria-hidden="true">×</span>')
const badge = (path: string) => {
	if (logos[path]) {
		return logoBadges(path)
	}

	const [kind, shape] = badgeShapes[path] ?? ['core', '<circle cx="8" cy="8" r="4"/>']
	return `<span class="gfx-badge gfx-${kind}" aria-hidden="true"><svg viewBox="0 0 16 16">${shape}</svg></span>`
}
const guides = [
	['limen.platform.window', 'window', 'Windows', 'Окна'],
	['limen.platform.event', 'events', 'Events', 'События'],
	['limen.platform.input', 'recipes', 'Input', 'Ввод'],
	['limen.platform', 'platform', 'Platform', 'Платформа'],
	['limen.graphics.renderer.opengl', 'opengl', 'OpenGL', 'OpenGL'],
	['limen.graphics.renderer.vulkan', 'vulkan', 'Vulkan', 'Vulkan'],
	['limen.graphics.renderer.d3d11', 'd3d11', 'Direct3D 11 · Windows', 'Direct3D 11 · Windows'],
	['limen.graphics.renderer.d3d12', 'd3d12', 'Direct3D 12 · Windows x64', 'Direct3D 12 · Windows x64'],
	['limen.graphics.postprocess', 'recipes', 'DLSS and FSR · Direct3D 12', 'DLSS и FSR · Direct3D 12'],
	['limen.graphics', 'graphics', 'Graphics', 'Графика'],
]

const escape = (value: string) => renderCopy('{{value}}', { value })
const shortName = (path: string) => path.slice(path.lastIndexOf('.') + 1)
const packageName = (path: string) => path.slice(0, path.lastIndexOf('.'))
const indexHref = './'
const hubHref = document.querySelector<HTMLElement>('#siteHeader')!.dataset.hubHref!
const hub = new URL(hubHref, location.href)
const language = isRussian ? 'ru' : 'en'
const guidesHref = new URL('limen/' + language + '/', hub).href

mountSiteHeader({
	language,
	hubHref,
	languageLinks: {
		en: new URL('api/limen/', hub).href,
		ru: new URL('api/limen/ru/', hub).href,
	},
})

const memberId = (member: Member) => 'member-' + member.name
const expandedFolders = new Map<string, boolean>()
const examples: Record<string, string> = {
	'limen.platform.Platform': `import limen.graphics.GraphicsDriver;
import limen.platform.Platform;
import limen.platform.event.Event;
import limen.platform.event.EventType;
import limen.platform.window.Window;

class Main {
	static function main() {
		Platform.init(GraphicsDriver.None);
		final window = Window.create({title: "Limen", width: 800, height: 600});
		final event = new Event();
		var running = true;

		while (running) {
			while (Platform.pollEvent(event)) {
				if (event.type == EventType.Quit) running = false;
			}
			Platform.delay(1);
		}

		window.destroy();
		Platform.quit();
	}
}`,
	'limen.platform.window.WindowOptions': `final window = Window.create({
	title: "Limen",
	width: 800,
	height: 600,
	resizable: false
});`,
}

type PackageFolder = {
	name: string
	folders: Map<string, PackageFolder>
	modules: Map<string, ApiType[]>
}

function href(type: ApiType, member?: Member) {
	return indexHref + '?type=' + type.path + (member ? '#' + memberId(member) : '')
}

let catalogRequest: Promise<Catalog> | undefined

function loadCatalog() {
	return catalogRequest ??= Promise.all([
		fetch(catalogUrl).then(response => {
			if (!response.ok) {
				throw new Error('API catalog unavailable')
			}

			return response.json() as Promise<Catalog>
		}),
		isRussian ? import('../../content/ru/developer/api/docs.json') : undefined,
	]).then(([data, russian]) => {
		if (russian) {
			const docs: Record<string, Record<string, string>> = russian.default

			for (const type of data.types) {
				const entries = docs[type.path]
				type.doc = entries?.['']

				for (const member of type.members) {
					member.doc = entries && Object.prototype.hasOwnProperty.call(entries, member.name)
						? entries[member.name]
						: undefined
				}
			}
		}

		return data
	}).catch(error => {
		catalogRequest = undefined
		throw error
	})
}

function renderDoc(doc: string) {
	return doc.split(/\n\s*\n/).map(paragraph =>
		'<p>' + renderInlineCode(paragraph) + '</p>',
	).join('')
}

function renderInlineCode(value: string) {
	return escape(value).replace(/`([^`]+)`/g, '<code>$1</code>')
}

function renderPackageTree(types: ApiType[], level: string, current?: ApiType) {
	const suffix = current ? '&type=' + current.path : ''
	const levelHref = (name: string) => `${indexHref}?package=${name}${suffix}`
	const folders = new Map<string, number>()
	const here: ApiType[] = []

	for (const type of types) {
		const pkg = packageName(type.path)

		if (pkg === level) {
			here.push(type)
		} else if (pkg.startsWith(level + '.')) {
			const next = level + '.' + pkg.slice(level.length + 1).split('.')[0]
			folders.set(next, (folders.get(next) ?? 0) + 1)
		}
	}

	const segments = level.split('.')
	const path = segments.map((segment, index) =>
		`<a href="${levelHref(segments.slice(0, index + 1).join('.'))}">${escape(segment)}</a>`,
	).join('<span aria-hidden="true"> / </span>')
	const parent = segments.slice(0, -1).join('.')
	const order = ['class', 'abstract', 'enumAbstract', 'enum', 'typedef']
	const sorted = here.sort((a, b) =>
		order.indexOf(a.kind) - order.indexOf(b.kind) || shortName(a.path).localeCompare(shortName(b.path)))

	return `<nav class="api-tree api-level" aria-label="${labels.tree}">
		<p class="api-level-path">${path}</p>
		<ul>
			${parent ? `<li><a class="api-level-up" href="${levelHref(parent)}"><code>[..]</code></a></li>` : ''}
			${[...folders].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) =>
				`<li><a class="api-level-folder" href="${levelHref(name)}"><code>${escape(shortName(name))}/</code><span>${count}</span></a></li>`,
			).join('')}
			${sorted.map(type => `<li><a class="api-tree-type" href="${href(type)}"${type === current ? ' aria-current="page"' : ''}>
				<code>${escape(shortName(type.path))}</code>
				<span>${kinds[type.kind][isRussian ? 1 : 0]}</span>
			</a></li>`).join('')}
		</ul>
	</nav>`
}

function renderType(catalog: Catalog, type: ApiType) {
	const source = 'https://github.com/NMB-Team/Limen/blob/' + catalog.revision + '/' + type.file
	const byPath = new Map(catalog.types.map(entry => [entry.path, entry]))
	const guide = guides.find(([prefix]) => type.path.startsWith(prefix + '.'))
	const breadcrumb = packageName(type.path).split('.').map((segment, index, segments) =>
		`<a href="${indexHref}?package=${segments.slice(0, index + 1).join('.')}"><code>${segment}</code></a>`,
	).join('<span aria-hidden="true">/</span>')
	const byKind = Object.entries(groups).map(([kind, title]) => ({
		kind,
		title: title[isRussian ? 1 : 0],
		members: type.members.filter(member => member.kind === kind),
	})).filter(group => group.members.length)
	const description = typeDescription(type)
	const example = examples[type.path]
	const references: { type: ApiType; member: Member }[] = []

	for (const owner of catalog.types) {
		if (owner === type || owner.internal) {
			continue
		}

		for (const member of owner.members) {
			if (!member.internal && (member.kind === 'method' || member.kind === 'staticMethod')
				&& member.signature.match(/\blimen(?:\.\w+)+/g)?.includes(type.path)) {
				references.push({ type: owner, member })
			}
		}

		if (references.length >= 6) {
			break
		}
	}

	function linkedType(path: string) {
		const linked = byPath.get(path)
		return linked && `<a href="${href(linked)}" title="${escape(linked.importPath)}">${escape(shortName(path))}</a>`
	}

	function memberNotes(member: Member) {
		const usage = memberUsage(type, member)

		return `<div class="api-description">
			${renderDoc(memberDescription(type, member))}
			${usage ? `<p class="api-usage">${renderInlineCode(usage)}</p>` : ''}
		</div>`
	}

	return `
		<div class="crumbs"><a href="${indexHref}">${labels.index}</a><span aria-hidden="true">/</span>
			${breadcrumb}</div>
		<header class="page-hero">
			<p class="page-kicker">Haxe · HashLink</p>
			<h1>${escape(shortName(type.path))}</h1>
			<code class="api-signature">${highlightHaxe(`import ${type.importPath};`)}</code>
			<div class="metadata">
				<span class="pill">${escape(kinds[type.kind][isRussian ? 1 : 0])}</span>
				${type.internal ? `<span class="pill">${labels.internal}</span>` : ''}
				<a href="${source}#L${type.line}">${labels.source} ↗</a>
				${guide ? `<a href="${guidesHref}#/${guide[1]}">${labels.guide}: ${guide[isRussian ? 3 : 2]}</a>` : ''}
			</div>
		</header>
		<code class="api-signature">${highlightHaxe(type.declaration, linkedType)}</code>
		${description ? `<div class="api-description">${renderDoc(description)}</div>` : ''}
		${example ? `<section class="article-section">
			<div class="section-head"><h2>${labels.example}</h2></div>
			<pre class="api-example"><code>${highlightHaxe(example)}</code></pre>
		</section>` : ''}
		${references.length ? `<p class="api-related">${labels.referencedBy} ${references.slice(0, 6).map(entry =>
			`<a href="${href(entry.type, entry.member)}"><code>${escape(shortName(entry.type.path) + '.' + entry.member.name)}</code></a>`,
		).join(', ')}</p>` : ''}
		${type.forwarded ? `<p>${labels.forwarded}: <code>${escape(type.forwarded.join(', '))}</code></p>` : ''}
		${byKind.length ? `<div class="api-member-toolbar">
			<nav class="api-jumps" aria-label="${labels.members}">
				${byKind.map(({ kind, title, members }) => `<a href="${href(type)}#api-${kind}">${title} · ${members.length}</a>`).join('')}
			</nav>
			${type.members.length >= 10 ? `<input type="search" id="apiMemberFilter" aria-label="${labels.matchMembers}" placeholder="${labels.matchMembers}">` : ''}
			<p id="apiMemberStatus" role="status" hidden></p>
		</div>` : ''}
		${byKind.map(({ kind, title, members }) => `
			<section class="article-section" id="api-${kind}">
				<div class="section-head"><h2>${title}</h2></div>
				<ul class="api-members">${members.map(member => `
					<li id="${memberId(member)}">
						<div class="api-member-heading">
							<a href="${href(type, member)}" class="api-permalink" aria-label="${escape(member.name)}">#</a>
							<code class="api-signature">${highlightHaxe(member.signature, linkedType)}</code>
							<a class="api-member-source" href="${source}${member.line ? '#L' + member.line : '#L' + type.line}">${labels.source} ↗</a>
						</div>
						${member.internal ? `<span class="pill">${labels.internal}</span>` : ''}
						${member.define ? `<span class="pill">${labels.conditional}: <code>${escape(member.define)}</code></span>` : ''}
						${memberNotes(member)}
					</li>`).join('')}</ul>
			</section>`).join('')}
	`
}

function renderPackage(catalog: Catalog, pkg: string) {
	const types = catalog.types.filter(type => !type.internal && packageName(type.path) === pkg)
		.sort((a, b) => shortName(a.path).localeCompare(shortName(b.path)))
	const folders = new Map<string, number>()

	for (const type of catalog.types) {
		const name = packageName(type.path)

		if (!type.internal && name.startsWith(pkg + '.')) {
			const next = pkg + '.' + name.slice(pkg.length + 1).split('.')[0]
			folders.set(next, (folders.get(next) ?? 0) + 1)
		}
	}

	const summary = (type: ApiType) => escape((type.doc ?? '').split('\n')[0])

	return `
		<header class="page-hero">
			<h1>${escape(pkg)}</h1>
			<p class="lede"><a href="${indexHref}">${labels.index}</a></p>
		</header>
		${folders.size ? `<section class="article-section"><div class="section-head"><h2>${isRussian ? 'Пакеты' : 'Packages'}</h2></div>
			<ul class="api-members api-package-list">${[...folders].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) =>
				`<li><div class="api-member-heading"><a href="${indexHref}?package=${name}"><code>${escape(shortName(name))}/</code></a></div><div class="api-description"><p>${count}</p></div></li>`,
			).join('')}</ul></section>` : ''}
		${types.length ? `<section class="article-section"><div class="section-head"><h2>${isRussian ? 'Типы' : 'Types'}</h2></div>
			<ul class="api-members api-package-list">${types.map(type =>
				`<li><div class="api-member-heading"><a href="${href(type)}"><code>${escape(shortName(type.path))}</code></a> <small>${kinds[type.kind][isRussian ? 1 : 0]}</small></div><div class="api-description"><p>${summary(type)}</p></div></li>`,
			).join('')}</ul></section>` : ''}
	`
}

function renderIndex(catalog: Catalog, missing: boolean) {
	const repository = 'https://github.com/NMB-Team/Limen'
	const featuredPaths = [
		'limen.platform.Platform', 'limen.platform.window.Window',
		'limen.platform.event.Event', 'limen.platform.event.EventType',
	]
	const featured = featuredPaths.flatMap(path => catalog.types.filter(type => type.path === path))

	return `
		<header class="page-hero">
			<h1>${labels.title}</h1>
			<p class="lede">${labels.intro}</p>
			<div class="metadata">
				<a href="${repository}/tree/${catalog.revision}">Limen ${escape(catalog.version)} · ${catalog.revision.slice(0, 7)} ↗</a>
				<a href="${repository}/blob/${catalog.revision}/LICENSE">${labels.license} ↗</a>
				<a href="${guidesHref}">${(isRussian ? russianApi : englishApi).apiGuides}</a>
			</div>
		</header>
		${missing ? `<p role="status">${labels.missingType}</p>` : ''}
		<section class="article-section api-landing">
			<h2>${labels.featured}</h2>
			<ul>${featured.map(type => `<li><a class="resource-row" href="${href(type)}">${badge(type.path)}<code>${shortName(type.path)}</code></a></li>`).join('')}</ul>
		</section>
		<section class="article-section api-landing">
			<h2>${labels.backends}</h2>
			<ul>${guides.filter(([path]) => path.startsWith('limen.graphics.')).map(([path, , en, ru]) =>
				`<li><a class="resource-row" href="${indexHref}?package=${path}">${badge(path)}<span>${isRussian ? ru : en}</span></a></li>`,
			).join('')}</ul>
		</section>
		<p class="api-muted">${labels.apiNotes}</p>
	`
}

const content = document.querySelector<HTMLElement>('#apiContent')!
const browser = document.querySelector<HTMLElement>('#apiBrowser')!
const disclosure = browser.closest('details')!
const languageLinks = [...document.querySelectorAll<HTMLAnchorElement>('.wiki-language a')].map(link => ({
	link,
	url: new URL(link.href),
}))

async function startReference() {
	const catalog = await loadCatalog()

	browser.innerHTML = `
		<label class="api-search-label" for="apiSearch">${labels.filter}</label>
		<input type="search" id="apiSearch" placeholder="${labels.placeholder}" autocomplete="off" spellcheck="false">
		<label class="api-toggle"><input type="checkbox"> ${labels.internals}</label>
		<div class="api-scope"></div>
		<p class="api-result-count" role="status"></p>
		<div class="api-results"></div>
		<button type="button" class="api-more" hidden>${labels.more}</button>
	`

	const search = browser.querySelector<HTMLInputElement>('#apiSearch')!
	const internal = browser.querySelector<HTMLInputElement>('input[type=checkbox]')!
	const scope = browser.querySelector<HTMLElement>('.api-scope')!
	const status = browser.querySelector<HTMLElement>('.api-result-count')!
	const results = browser.querySelector<HTMLElement>('.api-results')!
	const more = browser.querySelector<HTMLButtonElement>('.api-more')!
	const mobile = window.matchMedia('(max-width: 800px)')
	const pageSize = 40

	let current: ApiType | undefined
	let packageFilter = ''
	let limit = pageSize
	let renderedType: string | null | undefined

	function updateLanguageLinks() {
		for (const { link, url } of languageLinks) {
			url.search = location.search
			url.hash = location.hash
			link.href = url.href
		}
	}

	function updateBrowser() {
		const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
		const visible = catalog.types.filter(type =>
			(!type.internal || internal.checked || type === current)
			&& (!packageFilter || type.path.startsWith(packageFilter + '.')),
		)
		scope.innerHTML = packageFilter ? `<code>${escape(packageFilter)}</code> <a href="./">${labels.clearScope}</a>` : ''

		if (!terms.length) {
			status.textContent = visible.length ? '' : labels.noResults
			const level = packageFilter || (current ? packageName(current.path) : 'limen')
			results.innerHTML = visible.length ? renderPackageTree(visible, level, current) : ''
			more.hidden = true
			return
		}

		const matches: { type: ApiType; member?: Member; score: number }[] = []
		const query = terms.join(' ')

		for (const type of visible) {
			const typeName = shortName(type.path).toLowerCase()
			const typePath = (type.path + ' ' + type.importPath).toLowerCase()

			if (terms.every(term => typePath.includes(term))) {
				matches.push({ type, score: typeName === query ? 0 : typeName.startsWith(query) ? 1 : 4 })
			}

			for (const member of type.members) {
				if (member.internal && !internal.checked) {
					continue
				}

				const memberName = member.name.toLowerCase()
				const qualified = typeName + '.' + memberName
				const keywords = (type.path + '.' + member.name + ' ' + member.signature).toLowerCase()

				if (terms.every(term => keywords.includes(term))) {
					const score = memberName === query || qualified === query ? 0 : memberName.startsWith(query) ? 2 : 5
					matches.push({ type, member, score })
				}
			}
		}

		matches.sort((left, right) => left.score - right.score)
		status.textContent = matches.length
			? labels.results + ': ' + matches.length.toLocaleString(document.documentElement.lang)
			: labels.noResults
		results.innerHTML = `<ul class="api-search-results">${matches.slice(0, limit).map(({ type, member }) =>
			`<li><a href="${href(type, member)}">
				<code>${escape(shortName(type.path) + (member ? '.' + member.name : ''))}</code>
				<small>${escape(packageName(type.path))}</small>
			</a></li>`,
		).join('')}</ul>`
		more.hidden = limit >= matches.length
	}

	function draw(moveFocus: boolean) {
		const params = new URLSearchParams(location.search)
		const requested = params.get('type')
		current = catalog.types.find(type => type.path === requested)
		packageFilter = params.get('package') ?? ''
		search.value = params.get('q') ?? ''
		internal.checked = params.has('internal')
		limit = pageSize

		const renderKey = requested ?? (packageFilter ? 'package:' + packageFilter : null)

		if (renderKey !== renderedType) {
			content.innerHTML = current ? renderType(catalog, current)
				: packageFilter && !requested ? renderPackage(catalog, packageFilter)
				: renderIndex(catalog, Boolean(requested))
			document.title = current ? shortName(current.path) + ' | ' + labels.title : packageFilter && !requested ? packageFilter + ' | ' + labels.title : labels.title
			renderedType = renderKey
		}

		updateBrowser()
		updateLanguageLinks()
		disclosure.open = !mobile.matches || !current
		if (moveFocus) {
			content.focus({ preventScroll: true })
		}

		const target = document.getElementById(location.hash.slice(1))
		const memberFilter = content.querySelector<HTMLInputElement>('#apiMemberFilter')
		if (target && memberFilter?.value) {
			memberFilter.value = ''
			memberFilter.dispatchEvent(new Event('input', { bubbles: true }))
		}

		if (target && content.contains(target)) {
			target.scrollIntoView({ block: 'start' })
		} else {
			window.scrollTo({ top: 0, behavior: 'instant' })
		}
	}

	function storeBrowserState() {
		const url = new URL(location.href)
		const query = search.value.trim()

		if (query) {
			url.searchParams.set('q', query)
		} else {
			url.searchParams.delete('q')
		}
		if (internal.checked) {
			url.searchParams.set('internal', '1')
		} else {
			url.searchParams.delete('internal')
		}

		history.replaceState(null, '', url)
		updateLanguageLinks()
		limit = pageSize
		updateBrowser()
	}

	search.addEventListener('input', storeBrowserState)
	search.addEventListener('keydown', event => {
		if (event.key === 'Enter' && search.value.trim()) {
			results.querySelector<HTMLAnchorElement>('a')?.click()
		}
	})
	internal.addEventListener('change', storeBrowserState)
	more.addEventListener('click', () => {
		const previous = limit
		limit += pageSize
		updateBrowser()
		results.querySelectorAll<HTMLAnchorElement>('a')[previous]?.focus()
	})
	results.addEventListener('toggle', event => {
		const folder = event.target as HTMLDetailsElement
		if (folder.dataset.folder) {
			expandedFolders.set(folder.dataset.folder, folder.open)
		}
	}, true)
	content.addEventListener('input', event => {
		const input = event.target as HTMLInputElement
		if (input.id !== 'apiMemberFilter') {
			return
		}

		const query = input.value.trim().toLowerCase()
		let found = false

		for (const section of content.querySelectorAll<HTMLElement>('section[id^=api-]')) {
			let visible = false

			for (const member of section.querySelectorAll<HTMLElement>('.api-members > li')) {
				member.hidden = !member.querySelector('.api-signature')!.textContent!.toLowerCase().includes(query)
				visible ||= !member.hidden
			}

			section.hidden = !visible
			found ||= visible
		}

		const status = content.querySelector<HTMLElement>('#apiMemberStatus')!
		status.textContent = found ? '' : labels.noResults
		status.hidden = found
	})

	document.addEventListener('click', event => {
		const link = (event.target as Element).closest<HTMLAnchorElement>('a')
		if (!link || event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
			return
		}

		const target = new URL(link.href)
		const here = new URL('./', location.href)
		if (link.hreflang || target.origin !== here.origin || target.pathname !== here.pathname) {
			return
		}

		event.preventDefault()
		if (results.contains(link)) {
			if (search.value.trim()) {
				target.searchParams.set('q', search.value.trim())
			}
			if (packageFilter && !target.searchParams.has('package')) {
				target.searchParams.set('package', packageFilter)
			}
		}
		if (internal.checked) {
			target.searchParams.set('internal', '1')
		}

		if (target.href !== location.href) {
			history.pushState(null, '', target)
		}
		draw(true)
	})
	document.addEventListener('keydown', event => {
		const editing = (event.target as Element).closest('input, textarea, select, [contenteditable]')
		const slash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !editing

		if (slash) {
			event.preventDefault()
			disclosure.open = true
			search.focus()
			search.select()
		}
	})
	window.addEventListener('popstate', () => draw(false))
	mobile.addEventListener('change', () => { disclosure.open = !mobile.matches || !current })

	draw(false)
}

content.setAttribute('aria-busy', 'true')
void startReference().catch(() => {
	const message = document.createElement('p')
	message.setAttribute('role', 'alert')
	message.textContent = labels.loadFailed
	content.replaceChildren(message)
}).finally(() => content.removeAttribute('aria-busy'))
