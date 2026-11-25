import { createElement } from 'react'
import { highlightHaxe } from './haxeHighlight'
import englishCopy from '../../content/en/developer/ui.json'
import russianCopy from '../../content/ru/developer/ui.json'
import navigation from '../../content/developer/navigation.json'
import { renderCopy } from '../../content/renderCopy'
import iconsUrl from './assets/icons.svg?no-inline'
import logoUrl from './assets/limen-logo.svg?no-inline'
import { mountSiteHeader } from './SiteHeader'

const language = document.documentElement.lang === 'en' ? 'en' : 'ru'
const copy: typeof russianCopy = language === 'en' ? englishCopy : russianCopy

const templates = import.meta.glob<string>('../../content/developer/articles/*.html', {
	eager: true,
	import: 'default',
	query: '?url&no-inline',
})
const articleLocales = import.meta.glob<string>('../../content/*/developer/articles/*.json', {
	eager: true,
	import: 'default',
	query: '?url&no-inline',
})

type Route = keyof typeof copy.pages
type NavigationEntry = Route | {
	pages: Route[]
} & ({ label: keyof typeof copy.navigationLabels } | { overview: Route })

const groups = Object.entries(navigation.groups) as [keyof typeof navigation.groups, NavigationEntry[]][]
const pages = Object.entries(copy.pages) as [Route, (typeof copy.pages)[Route]][]
const hubHref = document.querySelector<HTMLElement>('#siteHeader')!.dataset.hubHref!
mountSiteHeader({
	language,
	hubHref,
	languageLinks: { en: '../en/', ru: '../ru/' },
	children: createElement('button', {
		id: 'menuButton',
		className: 'mobile-toggle',
		type: 'button',
		'aria-controls': 'sidebar',
		'aria-expanded': false,
	}, copy.shell.menu),
})

const sharedArticleCopy = Object.fromEntries([
	['links.hub', hubHref],
	['assets.icons', iconsUrl],
	['assets.logo', logoUrl],
	...Object.entries(copy.articleLabels).map(([key, value]) => ['common.' + key, value]),
	...pages.map(([route, page]) => ['pages.' + route + '.title', page.title]),
])
const sideNav = document.querySelector<HTMLElement>('#sideNav')!
const main = document.querySelector<HTMLElement>('#main')!
const article = document.querySelector<HTMLElement>('#docContent')!
const toast = document.querySelector<HTMLElement>('#toast')!
const sidebar = document.querySelector<HTMLElement>('#sidebar')!
const shade = document.querySelector<HTMLElement>('#mobileShade')!
const menu = document.querySelector<HTMLButtonElement>('#menuButton')!
const languageLinks = Array.from(
	document.querySelectorAll<HTMLAnchorElement>('.wiki-language a'),
	link => ({ link, href: link.getAttribute('href')! }),
)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const sidebarHighlight = document.createElement('div')

sidebarHighlight.className = 'sidebar-highlight'
sidebarHighlight.setAttribute('aria-hidden', 'true')
sidebarHighlight.hidden = true

let renderedRoute: Route | undefined
let articleRequest: AbortController | undefined
let historyPosition = 0
let toastTimeout: number

function icon(name: string) {
	return `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="${iconsUrl}#${name}"/></svg>`
}

function navLink(route: Route) {
	const page = copy.pages[route]

	return renderCopy(
		`<a class="nav-link" href="#/${route}">${icon(navigation.icons[route])}<span>{{title}}</span></a>`,
		{ title: 'navTitle' in page ? page.navTitle : page.title },
	)
}

sideNav.innerHTML = groups.map(([group, entries]) => `
	<div class="sidebar-group">
		<span class="group-label" id="nav-${group}">${copy.articleLabels[group]}</span>
		<ul class="nav-list" aria-labelledby="nav-${group}">
			${entries.map(entry => {
				if (typeof entry === 'string') {
					return `<li>${navLink(entry)}</li>`
				}

				const label = 'overview' in entry ? copy.pages[entry.overview].title : copy.navigationLabels[entry.label]
				const heading = 'overview' in entry ? navLink(entry.overview) : `<span class="nav-subgroup-title">${label}</span>`

				return `<li class="nav-subgroup">
					${heading}
					<ul class="nav-list nav-branch" aria-label="${label}">
						${entry.pages.map(route => `<li>${navLink(route)}</li>`).join('')}
					</ul>
				</li>`
			}).join('')}
		</ul>
	</div>
`).join('')

sideNav.prepend(sidebarHighlight)

const sidebarOrder = new Map(Array.from(
	sideNav.querySelectorAll<HTMLAnchorElement>('.nav-link'),
	(link, index) => [link.hash.slice(2) as Route, index],
))

function updateSidebarHighlight() {
	const link = sideNav.querySelector<HTMLElement>('.nav-link.active')
	sidebarHighlight.hidden = !link

	if (!link) {
		return
	}

	const navBounds = sideNav.getBoundingClientRect()
	const linkBounds = link.getBoundingClientRect()

	sidebarHighlight.style.transform = `translate(${linkBounds.left - navBounds.left}px, ${linkBounds.top - navBounds.top}px)`
	sidebarHighlight.style.width = `${linkBounds.width}px`
	sidebarHighlight.style.height = `${linkBounds.height}px`
}

new ResizeObserver(updateSidebarHighlight).observe(sideNav)

function updateNavigation(route: Route) {
	document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach(link => {
		const current = link.getAttribute('href') === '#/' + route
		link.classList.toggle('active', current)

		if (current) {
			link.setAttribute('aria-current', 'page')
		} else {
			link.removeAttribute('aria-current')
		}
	})

	updateSidebarHighlight()
}

function highlightExamples(body: HTMLElement) {
	body.querySelectorAll('.code-card').forEach(card => {
		if (card.querySelector('.language')?.textContent !== 'HAXE') {
			return
		}

		const code = card.querySelector('pre code')!
		code.innerHTML = highlightHaxe(code.textContent ?? '')
	})
}

function turnArticle(body: HTMLElement, section: string | null, backwards: boolean) {
	const outgoing = !section && article.getBoundingClientRect().top >= 0
		? article.firstElementChild as HTMLElement | null
		: null
	const direction = backwards ? -1 : 1
	const exitOrigin = backwards ? 'left top' : 'right top'
	const entranceOrigin = backwards ? 'right top' : 'left top'

	article.replaceChildren(body)

	if (outgoing) {
		outgoing.getAnimations().forEach(animation => animation.cancel())
		outgoing.inert = true
		outgoing.classList.add('is-leaving')
		outgoing.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'))
		article.append(outgoing)

		const turn = outgoing.animate(
			[
				{ opacity: 1, transform: 'none', transformOrigin: exitOrigin },
				{
					opacity: 0,
					transform: `translateX(${-18 * direction}px) rotateY(${-10 * direction}deg)`,
					transformOrigin: exitOrigin,
				},
			],
			{ duration: 170, easing: 'ease-out', fill: 'both' },
		)
		void turn.finished.then(() => outgoing.remove(), () => outgoing.remove())
	}

	const entrance = section
		? { opacity: 0.35 }
		: { opacity: 0.3, transform: `translateX(${14 * direction}px) rotateY(${8 * direction}deg)` }

	body.animate(
		[
			{ ...entrance, transformOrigin: entranceOrigin },
			{ opacity: 1, transform: 'none', transformOrigin: entranceOrigin },
		],
		{ duration: 260, easing: 'cubic-bezier(.2, .75, .25, 1)', fill: 'backwards' },
	)
}

async function drawPage(moveFocus: boolean) {
	const [path, query] = location.hash.slice(2).split('?', 2)
	const isArticleLink = location.hash.startsWith('#/')
	const params = new URLSearchParams(query)
	const section = params.get('s')
	params.delete('s')

	if (isArticleLink && path === 'home') {
		location.replace(hubHref + (section === 'products' ? '#projects' : ''))
		return
	}

	if (isArticleLink && path === 'api-reference') {
		const locale = copy.shell.language === 'ru' ? 'ru/' : ''
		const destination = new URL(hubHref + 'api/limen/' + locale, location.href)
		destination.search = params.toString()
		destination.hash = section ?? ''
		location.replace(destination)
		return
	}

	const route = isArticleLink && Object.prototype.hasOwnProperty.call(copy.pages, path)
		? path as Route
		: 'start'

	for (const { link, href } of languageLinks) {
		link.href = href + location.hash
	}

	const entryPosition = history.state?.wikiPosition
	const visitedEntry = typeof entryPosition === 'number'
	const previousIndex = renderedRoute ? sidebarOrder.get(renderedRoute) ?? 0 : 0
	const backwards = visitedEntry
		? entryPosition < historyPosition
		: (sidebarOrder.get(route) ?? 0) < previousIndex

	if (visitedEntry) {
		historyPosition = entryPosition
	} else {
		historyPosition += 1
		history.replaceState({ ...history.state, wikiPosition: historyPosition }, '')
	}

	articleRequest?.abort()
	setMobileMenu(false)
	updateNavigation(route)

	const changingPage = renderedRoute !== route
	if (changingPage) {
		const request = new AbortController()
		articleRequest = request
		article.setAttribute('aria-busy', 'true')

		try {
			const body = document.createElement('div')
			body.className = 'doc-inner'

			const templateUrl = templates['../../content/developer/articles/' + route + '.html']
			const localeUrl = articleLocales[
				'../../content/' + copy.shell.language + '/developer/articles/' + route + '.json'
			]
			const options = { signal: request.signal }
			const [templateResponse, localeResponse] = await Promise.all([
				fetch(templateUrl, options),
				fetch(localeUrl, options),
			])

			if (!templateResponse.ok || !localeResponse.ok) {
				throw new Error('Article assets unavailable')
			}

			const [template, messages] = await Promise.all([
				templateResponse.text(),
				localeResponse.json() as Promise<Record<string, string>>,
			])

			body.innerHTML = renderCopy(template, { ...sharedArticleCopy, ...messages })
			body.querySelectorAll('[data-copy] span').forEach(label => {
				label.textContent = copy.copy
			})

			highlightExamples(body)

			if (request.signal.aborted) {
				return
			}

			if (moveFocus && renderedRoute !== undefined && !reducedMotion.matches) {
				turnArticle(body, section, backwards)
			} else {
				article.replaceChildren(body)
			}

			renderedRoute = route
			document.title = copy.pages[route].title + ' | ' + copy.shell.title
		} catch {
			if (request.signal.aborted) {
				return
			}

			const error = document.createElement('p')
			error.className = 'doc-inner'
			error.setAttribute('role', 'alert')
			error.textContent = copy.loadFailed
			article.replaceChildren(error)
			renderedRoute = undefined
		} finally {
			if (articleRequest === request) {
				article.removeAttribute('aria-busy')
				articleRequest = undefined
			}
		}
	}

	if (moveFocus) {
		main.focus({ preventScroll: true })
	}

	const target = section && document.getElementById(section)

	if (target && article.contains(target)) {
		target.scrollIntoView()
	} else {
		window.scrollTo({ top: 0, behavior: changingPage ? 'instant' : 'auto' })
	}
}

async function copyExample(button: HTMLElement) {
	const code = button.closest('.code-card')!.querySelector('pre code')!
	let message = copy.copied

	try {
		await navigator.clipboard.writeText(code.textContent ?? '')
	} catch {
		message = copy.copyFailed
	}

	window.clearTimeout(toastTimeout)
	toast.textContent = message
	toast.classList.add('visible')
	toastTimeout = window.setTimeout(() => toast.classList.remove('visible'), 1900)
}

function selectExample(button: HTMLElement) {
	const switcher = button.closest('.backend-switcher')!

	switcher.querySelectorAll<HTMLElement>('[data-example]').forEach(option => {
		const selected = option === button
		option.classList.toggle('selected', selected)
		option.setAttribute('aria-pressed', String(selected))
	})

	switcher.querySelectorAll<HTMLElement>('[data-example-panel]').forEach(panel => {
		panel.hidden = panel.dataset.examplePanel !== button.dataset.example
	})
}

function setMobileMenu(open: boolean) {
	sidebar.classList.toggle('open', open)
	shade.classList.toggle('visible', open)
	menu.setAttribute('aria-expanded', String(open))
}

article.addEventListener('click', event => {
	const button = (event.target as Element).closest<HTMLElement>('button')

	if (button?.hasAttribute('data-copy')) {
		void copyExample(button)
	} else if (button?.hasAttribute('data-example')) {
		selectExample(button)
	}
})

menu.addEventListener('click', () => setMobileMenu(!sidebar.classList.contains('open')))
shade.addEventListener('click', () => setMobileMenu(false))

sidebar.addEventListener('click', event => {
	if ((event.target as Element).closest('a')) {
		setMobileMenu(false)
	}
})

document.addEventListener('keydown', event => {
	if (!event.defaultPrevented && event.key === 'Escape' && sidebar.classList.contains('open')) {
		setMobileMenu(false)
		menu.focus()
	}
})

window.addEventListener('hashchange', () => void drawPage(true))
void drawPage(false)
