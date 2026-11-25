import { useEffect, useState } from 'react'
import { renderPage } from '../../app/renderPage'
import english from '../../content/en/developer/hub.json'
import { shell as englishShell } from '../../content/en/developer/ui.json'
import russian from '../../content/ru/developer/hub.json'
import { shell as russianShell } from '../../content/ru/developer/ui.json'
import limenLogo from '../developer/assets/limen-logo.svg'
import { getWikiLanguage } from '../developer/language'
import { SiteHeader } from '../developer/SiteHeader'
import { projects, teamRepository } from '../developer/projects'
import imguiLogo from './assets/dear-imgui.jpg'
import hashlinkLogo from './assets/hashlink.svg'
import heapsLogo from './assets/heaps.svg'
import '../developer/DeveloperPage.scss'
import './DeveloperHub.scss'

const logos = { limen: limenLogo, hashlink: hashlinkLogo, heaps: heapsLogo, imgui: imguiLogo }

function DeveloperHub() {
	const [language, setLanguage] = useState(getWikiLanguage)
	const copy = language === 'ru' ? russian : english
	const shell = language === 'ru' ? russianShell : englishShell
	const limenWiki = `./limen/${language}/`
	const limenApi = language === 'ru' ? './api/limen/ru/' : './api/limen/'

	useEffect(() => {
		document.documentElement.lang = copy.meta.language
		document.title = copy.meta.title
		document.querySelector('meta[name="description"]')?.setAttribute('content', copy.meta.description)
	}, [copy.meta])

	useEffect(() => {
		document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
	}, [])

	return (
		<div className='app developer-hub'>
			<SiteHeader language={language} hubHref='./' docsHome onLanguageChange={setLanguage} />

			<div className='workspace'>
				<main className='wiki-main'>
					<article className='wiki-article-surface'>
						<div className='doc-inner'>
							<div className='page-hero home-hero'>
								<h1>{copy.title}</h1>
								<p className='lede'>{copy.intro}</p>
							</div>

							<section className='article-section' id='projects' aria-labelledby='projects-title'>
								<div className='section-head'>
									<h2 id='projects-title'>{copy.projectsTitle}</h2>
								</div>
								{projects.map(project => {
									const content = copy.projects[project.id]

									return (
										<section key={project.id} className='product-entry' aria-labelledby={`project-${project.id}`}>
											<div className='product-entry-main'>
												<img src={logos[project.id]} width='62' height='62' alt='' />
												<div>
													<h3 className='product-title' id={`project-${project.id}`}>
														<strong>{project.name}</strong><span className='product-tag'>{content.category}</span>
													</h3>
													<p>{content.description}</p>
													<div className='product-actions'>
														{project.id === 'limen' && (
															<>
																<a className='action-link primary' href={`${limenWiki}#/start`}>{copy.docs}</a>
																<a className='action-link' href={limenApi}>{copy.api}</a>
																<a className='action-link' href={`${limenWiki}#/first-window`}>{copy.guide}</a>
															</>
														)}
														<a className='action-link' href={`${teamRepository}/${project.repository}`}>
															{shell.sourceCode} <span aria-hidden='true'>↗</span>
														</a>
													</div>
												</div>
											</div>
										</section>
									)
								})}
							</section>
						</div>
					</article>
				</main>
			</div>

			<footer className='site-footer'>
				<span>{shell.title}</span>
			</footer>
		</div>
	)
}

renderPage(<DeveloperHub />)
