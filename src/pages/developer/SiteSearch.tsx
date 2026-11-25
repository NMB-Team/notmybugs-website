import { useEffect, useMemo, useRef, useState } from 'react'
import englishHub from '../../content/en/developer/hub.json'
import { shell as englishShell } from '../../content/en/developer/ui.json'
import russianHub from '../../content/ru/developer/hub.json'
import { shell as russianShell } from '../../content/ru/developer/ui.json'
import { projects, teamRepository } from './projects'
import type { SearchPage } from './siteSearchIndex'

type Props = {
	language: 'en' | 'ru'
	hubHref: string
}

function normalize(value: string) {
	return value.toLowerCase().replace(/ё/g, 'е')
}

export function SiteSearch({ language, hubHref }: Props) {
	const hub = language === 'ru' ? russianHub : englishHub
	const shell = language === 'ru' ? russianShell : englishShell
	const copy = hub.search
	const base = new URL(hubHref, location.href)
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(false)
	const [loaded, setLoaded] = useState<{ language: Props['language']; pages: SearchPage[] | null }>()
	const input = useRef<HTMLInputElement>(null)
	const results = useRef<HTMLDivElement>(null)
	const search = normalize(query.trim().replace(/\s+/g, ' '))
	const current = loaded?.language === language ? loaded : undefined
	const shouldLoad = Boolean(search) && !current

	useEffect(() => {
		function focusSearch(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault()
				input.current?.focus()
				input.current?.select()
				setOpen(true)
			}
		}

		document.addEventListener('keydown', focusSearch)

		return () => document.removeEventListener('keydown', focusSearch)
	}, [])

	useEffect(() => {
		if (!shouldLoad) {
			return
		}

		let active = true

		import('./siteSearchIndex').then(({ loadSearchPages }) => loadSearchPages(language, copy.guide, copy.api))
			.then(entries => {
				if (active) {
					setLoaded({ language, pages: entries })
				}
			})
			.catch(() => {
				if (active) {
					setLoaded({ language, pages: null })
				}
			})

		return () => { active = false }
	}, [shouldLoad, language, copy.guide, copy.api])

	const entries = useMemo(() => {
		const pages: SearchPage[] = [
			{ title: shell.returnToHome, detail: 'NMB Team', href: '../' },
			{ title: shell.overview, detail: hub.intro, href: './' },
			{ title: hub.api + ' · LIMEN', detail: copy.api, href: language === 'ru' ? './api/limen/ru/' : './api/limen/' },
			{ title: shell.nmbProjects, detail: 'GitHub', href: 'https://github.com/orgs/NMB-Team/repositories' },
			{ title: shell.limenRepository, detail: 'GitHub', href: teamRepository + '/Limen' },
			...projects.map(({ id, name }) => ({
				title: name,
				detail: hub.projects[id].description,
				href: '#project-' + id,
			})),
			...(current?.pages ?? []),
		]

		return pages.map(page => {
			const title = normalize(page.title)
			const text = normalize([page.title, page.detail, page.keywords].join(' '))

			return { page, title, text }
		})
	}, [hub, shell, copy.api, current, language])

	const matches = useMemo(() => {
		if (!search) {
			return []
		}

		const terms = search.split(' ')

		return entries.flatMap(({ page, title, text }) => {
			if (!terms.every(term => text.includes(term))) {
				return []
			}

			const rank = title === search ? 0 : title.startsWith(search) ? 1
				: terms.every(term => title.includes(term)) ? 2 : 3

			return [{ page, rank }]
		}).sort((left, right) => left.rank - right.rank).slice(0, 12).map(({ page }) => page)
	}, [entries, search])

	return (
		<form
			className='site-search'
			role='search'
			aria-label={copy.label}
			onSubmit={event => {
				event.preventDefault()

				if (matches.length) {
					setOpen(false)
					location.assign(new URL(matches[0].href, base))
				}
			}}
			onBlur={event => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					setOpen(false)
				}
			}}
			onKeyDown={event => {
				if (event.key === 'Escape' && open) {
					event.preventDefault()
					input.current?.focus()
					setOpen(false)
				}

				if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
					return
				}

				if (!open) {
					setOpen(true)
					return
				}

				const links = Array.from(results.current?.querySelectorAll('a') ?? [])
				if (!links.length) {
					return
				}

				event.preventDefault()
				const index = links.indexOf(event.target as HTMLAnchorElement)
				const next = event.key === 'ArrowDown' ? index + 1 : (index < 0 ? links.length - 1 : index - 1)
				const target = links[next] ?? input.current

				target?.focus()
			}}
		>
			<input
				ref={input}
				type='search'
				value={query}
				aria-label={copy.label}
				placeholder={copy.label}
				autoComplete='off'
				spellCheck={false}
				onFocus={() => setOpen(true)}
				onChange={event => {
					setQuery(event.target.value)
					setOpen(true)
				}}
			/>
			{open && search && (
				<div ref={results} className='site-search-results search-results'>
					{matches.map(page => (
						<a
							key={page.href}
							className='search-item'
							href={new URL(page.href, base).href}
							onMouseDown={event => {
								if (event.button === 0) {
									event.preventDefault()
								}
							}}
							onClick={() => setOpen(false)}
						>
							<div><strong>{page.title}</strong><span>{page.detail}</span></div>
						</a>
					))}
					<p className='site-search-status' role='status'>
						{!current ? copy.loading : current.pages === null ? copy.error : matches.length ? '' : copy.empty}
					</p>
					{current?.pages === null && (
						<button type='button' onClick={() => {
							input.current?.focus()
							setLoaded(undefined)
						}}>{copy.retry}</button>
					)}
				</div>
			)}
		</form>
	)
}
