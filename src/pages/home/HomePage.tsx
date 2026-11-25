import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import copy from '../../content/en/home.json'
import SiteFooter from '../../widgets/site-footer/SiteFooter'
import './HomePage.scss'

const LogoScene = lazy(() => import('../../features/logo-scene/LogoScene'))
const STARTUP_FADE_MS = 1150

function AnimatedGradient() {
	return <div className='animated-gradient' aria-hidden='true' />
}

type StartupFadeProps = {
	onHidden: () => void
}

function StartupFade({ onHidden }: StartupFadeProps) {
	const [hidden, setHidden] = useState(false)
	const didComplete = useRef(false)

	const complete = useCallback(() => {
		if (didComplete.current) {
			return
		}

		didComplete.current = true
		onHidden()
	}, [onHidden])

	useEffect(() => {
		let secondFrame = 0
		let fallbackTimeout = 0
		const firstFrame = requestAnimationFrame(() => {
			secondFrame = requestAnimationFrame(() => {
				setHidden(true)
				fallbackTimeout = window.setTimeout(complete, STARTUP_FADE_MS)
			})
		})

		return () => {
			cancelAnimationFrame(firstFrame)
			cancelAnimationFrame(secondFrame)
			clearTimeout(fallbackTimeout)
		}
	}, [complete])

	return (
		<div
			className={`startup-fade${hidden ? ' startup-fade--hidden' : ''}`}
			aria-hidden='true'
			onTransitionEnd={complete}
		/>
	)
}

export default function HomePage() {
	const [isStarted, setIsStarted] = useState(false)
	const handleStartupHidden = useCallback(() => setIsStarted(true), [])

	return (
		<main className='site-shell'>
			<AnimatedGradient />
			<a className='developer-link' href={`${import.meta.env.BASE_URL}developer/`}>
				{copy.developerLink}<span aria-hidden='true'> →</span>
			</a>
			<Suspense fallback={null}>
				<LogoScene />
			</Suspense>
			<SiteFooter isStarted={isStarted} />
			<StartupFade onHidden={handleStartupHidden} />
		</main>
	)
}
