import { type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { shell as english } from '../../content/en/developer/ui.json'
import { shell as russian } from '../../content/ru/developer/ui.json'
import { rememberWikiLanguage } from './language'
import { SiteSearch } from './SiteSearch'
import './SiteHeader.scss'

type Language = 'en' | 'ru'
type Props = {
	language: Language
	hubHref: string
	docsHome?: boolean
	children?: ReactNode
} & (
	{ onLanguageChange: (language: Language) => void; languageLinks?: never } |
	{ onLanguageChange?: never; languageLinks: Record<Language, string> }
)

const languages = [
	{ id: 'en', name: 'English' },
	{ id: 'ru', name: 'Русский' },
] as const

export function SiteHeader({ language, hubHref, docsHome, children, onLanguageChange, languageLinks }: Props) {
	const copy = language === 'ru' ? russian : english
	const hub = new URL(hubHref, location.href)
	const home = new URL('../', hub)

	return (
		<header className='site-header' lang={language}>
			<a className='site-brand' href={home.href}>
				<img src={new URL('nmb-bug.svg', home).href} width='30' height='30' alt='' />
				<span>NMB Team</span>
			</a>
			<nav className='site-header-nav' aria-label={copy.navigation}>
				<a href={hub.href} aria-current={docsHome ? 'page' : undefined}>{copy.developersLink}</a>
			</nav>
			<div className='site-header-tools'>
				{children}
				<SiteSearch language={language} hubHref={hub.href} />
			</div>
			<div className='wiki-language' role='group' aria-label={copy.languageSwitcher}>
				{languages.map(({ id, name }) => onLanguageChange ? (
					<button key={id} type='button' lang={id} aria-label={name} aria-pressed={id === language}
						onClick={() => {
							rememberWikiLanguage(id)
							onLanguageChange(id)
						}}
					>{id.toUpperCase()}</button>
				) : (
					<a key={id} href={languageLinks[id]} hrefLang={id} lang={id} aria-label={name}
						aria-current={id === language} onClick={() => rememberWikiLanguage(id)}
					>{id.toUpperCase()}</a>
				))}
			</div>
		</header>
	)
}

export function mountSiteHeader(props: Props) {
	const root = createRoot(document.querySelector('#siteHeader')!)

	flushSync(() => root.render(<SiteHeader {...props} />))
}
